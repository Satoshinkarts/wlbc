"""Headless/browser automation for creating Maricopa Community
Colleges admissions accounts.

This helper lives alongside the original ``provision_accounts.py``
implementation which talks to a generic provisioning API.  The
Maricopa bot is entirely separate; it navigates the public admissions
wizard, generates temporary Gmailnator addresses and scrapes the OTP
from the incoming message.

Usage example::

    # set an environment variable with your RapidAPI key
    export GMAILNATOR_API_KEY=<secret>

    python -m scripts.maricopa_admissions_bot --count 3

The script is intentionally interactive; there are a couple of
steps (CAPTCHA, manual ID verification) that are difficult to automate.
"""

import argparse
import functools
import glob
import json
import logging
import os
import random
import re
import subprocess
import time
from typing import Callable, Dict, List, Optional

import pandas as pd
import requests
import undetected_chromedriver as uc
from faker import Faker
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, WebDriverException
from selenium.webdriver.support.ui import WebDriverWait


# configuration ---------------------------------------------------------------

RAPIDAPI_KEY = os.environ.get("GMAILNATOR_API_KEY")
GMAILNATOR_HOST = "gmailnator.p.rapidapi.com"
PROXYSCRAPE_API_KEY = os.environ.get("PROXYSCRAPE_API_KEY")
PROXYSCRAPE_API_URL = "https://api.proxyscrape.com/v2/"

URBAN_VPN_EXT_ID = "eppiocemhmnlbhjplcgkofciiegomcon"
URBAN_VPN_EXT_DIR = os.path.join(
    os.environ.get("LOCALAPPDATA", ""),
    "Google", "Chrome", "User Data", "Default", "Extensions",
    URBAN_VPN_EXT_ID,
)

# if you prefer to hard‑code a key for testing, set it above or in the
# environment.  failing to provide a key will still work, but the
# generated messages may be rate limited by the free tier.


# helpers ---------------------------------------------------------------------

def _retry_with_backoff(max_retries: int = 3, initial_delay: float = 2.0) -> Callable:
    """Decorator for exponential backoff retry logic on API calls.
    
    Args:
        max_retries: Maximum number of retries (default 3)
        initial_delay: Initial delay in seconds (default 2.0)
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except (requests.exceptions.RequestException, Exception) as exc:
                    if attempt == max_retries - 1:
                        logging.warning(
                            "%s failed after %d retries: %s",
                            func.__name__, max_retries, str(exc)
                        )
                        raise
                    delay = initial_delay * (2 ** attempt)
                    logging.debug(
                        "%s attempt %d failed, retrying in %.1fs: %s",
                        func.__name__, attempt + 1, delay, str(exc)
                    )
                    time.sleep(delay)
        return wrapper
    return decorator


def _find_urban_vpn_path() -> Optional[str]:
    """Return the path to the latest installed Urban VPN extension version, or None."""
    if not os.path.isdir(URBAN_VPN_EXT_DIR):
        return None
    versions = glob.glob(os.path.join(URBAN_VPN_EXT_DIR, "*"))
    versions = [v for v in versions if os.path.isdir(v)]
    if not versions:
        return None
    # pick the latest version directory
    return sorted(versions)[-1]


def _get_chrome_user_data_dir() -> str:
    """Return the path to the user's real Chrome User Data directory."""
    return os.path.join(
        os.environ.get("LOCALAPPDATA", ""),
        "Google", "Chrome", "User Data",
    )


def _ensure_chrome_closed() -> None:
    """Check that the user's normal Chrome is closed (profile lock).

    If chrome.exe processes are found, ask the user to close them.
    """
    while True:
        result = subprocess.run(
            ["tasklist", "/FI", "IMAGENAME eq chrome.exe"],
            capture_output=True, text=True,
        )
        if "chrome.exe" not in result.stdout.lower():
            return
        print()
        print("=" * 60)
        print("  Your regular Chrome must be closed first!")
        print("  The bot needs exclusive access to your profile.")
        print("  Please close ALL Chrome windows, then press Enter.")
        print("=" * 60)
        input("[WAIT] Press [Enter] after closing Chrome... ")


def _inject_stealth(driver: uc.Chrome) -> None:
    """Inject JS via CDP *before* any page loads to mask automation fingerprints."""
    stealth_js = """
    // Remove webdriver flag
    Object.defineProperty(navigator, 'webdriver', {get: () => undefined});

    // Fake realistic plugins array
    Object.defineProperty(navigator, 'plugins', {
        get: () => {
            const arr = [
                {name:'Chrome PDF Plugin',filename:'internal-pdf-viewer',description:'Portable Document Format',length:1},
                {name:'Chrome PDF Viewer',filename:'mhjfbmdgcfjbbpaeojofohoefgiehjai',description:'',length:1},
                {name:'Native Client',filename:'internal-nacl-plugin',description:'',length:2},
            ];
            arr.item = i => arr[i];
            arr.namedItem = n => arr.find(p => p.name === n);
            arr.refresh = () => {};
            return arr;
        }
    });

    // Languages
    Object.defineProperty(navigator, 'languages', {get: () => ['en-US', 'en']});

    // Realistic chrome object
    window.chrome = window.chrome || {};
    window.chrome.runtime = window.chrome.runtime || {};
    window.chrome.loadTimes = window.chrome.loadTimes || function(){};
    window.chrome.csi = window.chrome.csi || function(){};

    // Permissions API override
    const origQuery = window.navigator.permissions.query.bind(window.navigator.permissions);
    window.navigator.permissions.query = (params) =>
        params.name === 'notifications'
            ? Promise.resolve({state: Notification.permission})
            : origQuery(params);

    // WebGL vendor/renderer spoofing
    const getParam = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function(p) {
        if (p === 37445) return 'Intel Inc.';
        if (p === 37446) return 'Intel Iris OpenGL Engine';
        return getParam.apply(this, arguments);
    };

    // Prevent iframe contentWindow detection
    const origAttachShadow = Element.prototype.attachShadow;
    Element.prototype.attachShadow = function(init) {
        return origAttachShadow.call(this, {...init, mode: 'open'});
    };
    """
    try:
        driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {"source": stealth_js})
    except Exception as exc:
        logging.debug("CDP stealth injection failed: %s", exc)


def _make_driver(
    headless: bool,
    proxy_url: Optional[str] = None,
    use_vpn: bool = False,
    use_real_profile: bool = False,
) -> uc.Chrome:
    """Return a fresh :class:`uc.Chrome` instance.

    When *use_real_profile* is ``True`` the user's real Chrome profile
    is loaded (all extensions, cookies, history intact).  This gives
    the best Cloudflare pass-through because the browser is
    indistinguishable from a normal session.
    """
    options = uc.ChromeOptions()

    user_data_dir: Optional[str] = None

    if use_real_profile:
        # ---- real-profile mode ----------------------------------------
        _ensure_chrome_closed()
        user_data_dir = _get_chrome_user_data_dir()
        if not os.path.isdir(user_data_dir):
            raise FileNotFoundError(
                f"Chrome profile not found at {user_data_dir}"
            )
        logging.info("using real Chrome profile at %s", user_data_dir)
        # Keep options minimal — the profile already has everything
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--start-maximized")
        options.add_argument("--disable-blink-features=AutomationControlled")
        driver = uc.Chrome(
            options=options,
            user_data_dir=user_data_dir,
            version_main=145,
        )
        return driver

    # ---- isolated-profile mode (original behaviour) -------------------
    if headless and not use_vpn:
        options.add_argument("--headless=new")
    if proxy_url:
        options.add_argument(f"--proxy-server={proxy_url}")

    # Window / display — look like a normal desktop user
    options.add_argument("--window-size=1920,1080")
    options.add_argument("--start-maximized")

    # Core stability
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")

    # Stealth flags
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_argument("--disable-infobars")
    options.add_argument("--lang=en-US,en;q=0.9")
    if not use_vpn:
        options.add_argument("--disable-extensions-except=")

    # Preferences that real browsers ship with
    prefs = {
        "credentials_enable_service": False,
        "profile.password_manager_enabled": False,
        "profile.default_content_setting_values.notifications": 2,
    }
    options.add_experimental_option("prefs", prefs)

    if use_vpn:
        ext_path = _find_urban_vpn_path()
        if ext_path:
            options.add_argument(f"--load-extension={ext_path}")
            logging.info("loading Urban VPN extension from %s", ext_path)
        else:
            logging.warning("Urban VPN extension not found at %s", URBAN_VPN_EXT_DIR)

    driver = uc.Chrome(options=options, version_main=145)

    # Pre-page stealth JS injection
    _inject_stealth(driver)

    return driver


# bot class ------------------------------------------------------------------

class MaricopaAdmissionsBot:
    def __init__(
        self,
        headless: bool = False,
        proxy_url: Optional[str] = None,
        use_vpn: bool = False,
        use_real_profile: bool = False,
    ) -> None:
        self.fake = Faker("en_US")
        self.proxy_url = proxy_url
        self.use_vpn = use_vpn
        self.use_real_profile = use_real_profile
        self.driver = _make_driver(
            headless, proxy_url, use_vpn=use_vpn,
            use_real_profile=use_real_profile,
        )
        self.wait = WebDriverWait(self.driver, 20)
        self.accounts: List[Dict] = []
        self._cf_warmed_up = False
        if use_real_profile:
            # Real profile — VPN extension is already installed.
            # Prompt the user to connect it before we start.
            self._activate_vpn()
        elif use_vpn:
            self._activate_vpn()
        logging.debug(
            "driver initialized headless=%s proxy=%s vpn=%s profile=%s",
            headless, proxy_url or "none", use_vpn, use_real_profile,
        )

    # ---------------------------------------------------------------------
    # vpn helpers
    # ---------------------------------------------------------------------

    def _activate_vpn(self) -> None:
        """Wait for the user to connect Urban VPN, then proceed."""
        print()
        print("=" * 60)
        print("  1. Click the Urban VPN icon in Chrome's toolbar")
        print("     (puzzle-piece icon -> pin Urban VPN if needed)")
        print("  2. Select 'United States' as the location")
        print("  3. Click Connect")
        print("  4. Wait until it shows 'Connected'")
        print("=" * 60)
        print()
        input("[VPN] Press [Enter] once Urban VPN shows 'Connected'... ")
        logging.info("VPN confirmed by user, proceeding...")
        # Give VPN a moment to stabilize
        time.sleep(3)

    def _session_alive(self) -> bool:
        """Return True if the Chrome session is still responding."""
        try:
            _ = self.driver.title
            return True
        except (WebDriverException, Exception):
            return False

    # ---------------------------------------------------------------------
    # proxy helpers
    # ---------------------------------------------------------------------

    @staticmethod
    def _fetch_proxy_list() -> List[str]:
        """Fetch a list of proxies from ProxyScrape API."""
        if not PROXYSCRAPE_API_KEY:
            logging.warning("PROXYSCRAPE_API_KEY not set, cannot fetch proxies")
            return []
        try:
            params = {
                "request": "getproxies",
                "timeout": "5000",
                "apikey": PROXYSCRAPE_API_KEY,
            }
            resp = requests.get(PROXYSCRAPE_API_URL, params=params, timeout=10)
            resp.raise_for_status()
            raw = [line.strip() for line in resp.text.strip().split("\r\n") if line.strip()]
            random.shuffle(raw)
            return raw
        except Exception as exc:
            logging.warning("failed to fetch proxy list: %s", str(exc))
            return []

    @staticmethod
    def _test_proxy(proxy_addr: str) -> bool:
        """Quick connectivity test through proxy."""
        try:
            resp = requests.get(
                "https://httpbin.org/ip",
                proxies={"http": f"http://{proxy_addr}", "https": f"http://{proxy_addr}"},
                timeout=8,
            )
            return resp.status_code == 200
        except Exception:
            return False

    @classmethod
    def fetch_proxy(cls, max_attempts: int = 15) -> Optional[str]:
        """Fetch and validate a working proxy.

        Tries up to *max_attempts* proxies from the pool, returning the
        first one that passes a quick connectivity test.
        """
        candidates = cls._fetch_proxy_list()
        if not candidates:
            return None
        for proxy_addr in candidates[:max_attempts]:
            logging.debug("testing proxy %s", proxy_addr)
            if cls._test_proxy(proxy_addr):
                logging.info("validated proxy: %s", proxy_addr)
                return f"http://{proxy_addr}"
            logging.debug("proxy %s failed connectivity test", proxy_addr)
        logging.warning("no working proxy found after %d attempts", max_attempts)
        return None

    # ---------------------------------------------------------------------
    # debug helpers
    # ---------------------------------------------------------------------

    def _save_debug_snapshot(self, label: str) -> None:
        """Save a screenshot and page source for debugging."""
        ts = int(time.time())
        try:
            png = f"debug_{label}_{ts}.png"
            self.driver.save_screenshot(png)
            logging.info("screenshot saved to %s", png)
        except Exception:
            pass
        try:
            html = f"debug_{label}_{ts}.html"
            with open(html, "w", encoding="utf-8") as f:
                f.write(self.driver.page_source)
            logging.info("page source saved to %s", html)
        except Exception:
            pass

    # ---------------------------------------------------------------------
    # gmailnator helpers
    # ---------------------------------------------------------------------

    @_retry_with_backoff(max_retries=3, initial_delay=2.0)
    def generate_temp_email(self) -> str:
        """Create a random address using the Gmailnator API."""
        url = "https://gmailnator.p.rapidapi.com/api/emails/generate"
        headers = {
            "Content-Type": "application/json",
            "x-rapidapi-host": GMAILNATOR_HOST,
            "x-rapidapi-key": RAPIDAPI_KEY or "",
        }
        proxies = {"http": self.proxy_url, "https": self.proxy_url} if self.proxy_url else None
        try:
            resp = requests.post(url, headers=headers, proxies=proxies, timeout=10)
            resp.raise_for_status()
            data = resp.json()
            return data.get("email") or f"temp{random.randint(1000,9999)}@gmailnator.com"
        except Exception:  # pragma: no cover - network call
            logging.warning("failed to generate temp address, falling back to random string")
            return f"temp{random.randint(1000,9999)}@gmailnator.com"

    def check_inbox_for_otp(self, email: str, timeout: int = 300) -> Optional[str]:
        """Poll the inbox for the one‑time code and return it.

        Returns ``None`` if the timeout expires.
        """
        url = "https://gmailnator.p.rapidapi.com/api/inbox"
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "x-rapidapi-host": GMAILNATOR_HOST,
            "x-rapidapi-key": RAPIDAPI_KEY or "",
        }
        proxies = {"http": self.proxy_url, "https": self.proxy_url} if self.proxy_url else None
        deadline = time.time() + timeout
        while time.time() < deadline:
            try:
                resp = requests.post(url, headers=headers, json={"email": email}, proxies=proxies, timeout=10)
                resp.raise_for_status()
                msgs = resp.json().get("data", [])
            except Exception:
                msgs = []
            for msg in msgs:
                sender = msg.get("from", "").lower()
                subject = msg.get("subject", "").lower()
                if "maricopa" in sender or "otp" in subject:
                    mid = msg.get("messageId")
                    if not mid:
                        continue
                    mresp = requests.get(f"https://gmailnator.p.rapidapi.com/api/inbox/{mid}", headers=headers, proxies=proxies, timeout=10)
                    if mresp.status_code != 200:
                        continue
                    body = (mresp.json().get("htmlBody", "") + mresp.json().get("textBody", ""))
                    match = re.search(r"\b\d{6,8}\b", body)
                    if match:
                        return match.group(0)
            time.sleep(5)
        return None

    # ---------------------------------------------------------------------
    # form‑filling helpers
    # ---------------------------------------------------------------------

    def generate_account_data(self) -> Dict:
        """Return a dict containing fake student profile data."""
        first_names = ["John", "Jane", "Mike", "Sarah", "David", "Emily", "Chris", "Lisa"]
        last_names = ["Smith", "Johnson", "Brown", "Davis", "Wilson", "Moore", "Taylor", "Anderson"]
        first = random.choice(first_names)
        last = random.choice(last_names)
        return {
            "first_name": first,
            "last_name": last,
            "full_name": f"{first} {last}",
            "email": None,
            "birth_month": random.randint(1, 12),
            "birth_day": random.randint(1, 28),
            "birth_year": random.randint(1980, 2008),
            "phone": self.fake.phone_number()[:12].replace("-", ""),
            "address": self.fake.street_address(),
            "city": self.fake.city(),
            "state": random.choice(["AZ", "CA", "TX", "FL", "NY"]),
            "zip": self.fake.zipcode(),
            "high_school": self.fake.company() + " High School",
            "grad_year": random.randint(2015, 2025),
        }

    def _wait_for_cloudflare(self, timeout: int = 45) -> None:
        """Wait for Cloudflare challenge to resolve, prompting user if needed."""
        # Short initial sleep — CF JS checks need a moment
        time.sleep(5)
        deadline = time.time() + timeout
        while time.time() < deadline:
            title = self.driver.title.lower()
            url = self.driver.current_url.lower()
            if ("cloudflare" not in title and "attention" not in title
                    and "challenge" not in url and "cdn-cgi" not in url):
                logging.info("Cloudflare cleared (title: %s)", self.driver.title)
                return
            logging.info("Cloudflare challenge active, waiting... (title: %s)", self.driver.title)
            time.sleep(4)
        # Still on Cloudflare — ask user to solve manually
        logging.warning("Cloudflare challenge did not auto-resolve after %ds", timeout)
        print()
        print("=" * 60)
        print("  Cloudflare challenge detected.")
        print("  If you see a checkbox / Turnstile widget, click it.")
        print("  If it says 'Attention Required', try a different")
        print("  VPN server (Settings -> change location) and reload.")
        print("=" * 60)
        input("[CF] Press [Enter] after the page loads normally... ")
        time.sleep(2)

    def _warmup_cloudflare(self) -> None:
        """Navigate to the root domain first to earn CF cookies before
        hitting a specific page. This dramatically improves pass-through
        rates because CF sees a normal browsing pattern."""
        logging.info("CF warm-up: visiting root domain first...")
        self.driver.get("https://admissions.maricopa.edu/")
        self._wait_for_cloudflare(timeout=45)
        # Re-inject stealth in case CF cleared scripts
        _inject_stealth(self.driver)
        logging.info("CF warm-up complete — cookies acquired")

    def create_account_step1(self, data: Dict) -> bool:
        if not self._session_alive():
            logging.warning("Chrome session died — attempting to restart driver")
            try:
                self.driver.quit()
            except Exception:
                pass
            self.driver = _make_driver(
                False, use_vpn=self.use_vpn,
                use_real_profile=self.use_real_profile,
            )
            self.wait = WebDriverWait(self.driver, 20)
            self._cf_warmed_up = False
            if self.use_vpn or self.use_real_profile:
                input("[VPN] Reconnect Urban VPN in the browser, then press [Enter]... ")
        # Warm up on root domain first to get CF clearance cookies
        if not self._cf_warmed_up:
            self._warmup_cloudflare()
            self._cf_warmed_up = True
        self.driver.get("https://admissions.maricopa.edu/Wizard/WizardStep1.aspx")
        logging.info("navigated to: %s", self.driver.current_url)
        logging.info("page title: %s", self.driver.title)
        self._wait_for_cloudflare()
        try:
            self.wait.until(EC.presence_of_element_located((By.ID, "txtFirstName")))
        except TimeoutException:
            logging.error("timed out waiting for txtFirstName — page may have changed or IP blocked")
            logging.error("current url: %s", self.driver.current_url)
            self._save_debug_snapshot("step1_timeout")
            raise
        self.driver.find_element(By.ID, "txtFirstName").send_keys(data["first_name"])
        self.driver.find_element(By.ID, "txtLastName").send_keys(data["last_name"])
        self.driver.find_element(By.ID, "txtEmail").send_keys(data["email"])
        self.driver.find_element(By.ID, "btnContinue").click()
        time.sleep(2)
        return True

    def verify_otp_step(self, data: Dict) -> bool:
        self.driver.get("https://admissions.maricopa.edu/Application/Verify.aspx")
        input("Please solve any CAPTCHA or manual challenge in the browser, then hit [Enter].")
        otp = self.check_inbox_for_otp(data["email"])
        if otp:
            fld = self.wait.until(EC.presence_of_element_located((By.ID, "txtVerificationCode")))
            fld.clear()
            fld.send_keys(otp)
            self.driver.find_element(By.ID, "btnVerify").click()
            time.sleep(3)
            return True
        logging.error("OTP not received for %s", data["email"])
        return False

    def fill_personal_info(self, data: Dict) -> bool:
        self.driver.get("https://admissions.maricopa.edu/Application/PersonalInformation.aspx")
        mapping = {
            "txtSSN1": str(random.randint(100, 999)),
            "txtSSN2": str(random.randint(10, 99)),
            "txtSSN3": str(random.randint(1000, 9999)),
            "txtPhone": data["phone"],
            "txtAddress1": data["address"],
            "txtCity": data["city"],
            "ddlState": data["state"],
            "txtZip": data["zip"],
        }
        for fid, val in mapping.items():
            try:
                elem = self.driver.find_element(By.ID, fid)
                elem.clear()
                elem.send_keys(val)
            except Exception:
                logging.debug("field %s not found, skipping", fid)
        self.driver.find_element(By.ID, "btnContinue").click()
        time.sleep(2)
        return True

    def fill_education_info(self, data: Dict) -> bool:
        self.driver.get("https://admissions.maricopa.edu/Application/EducationInformation.aspx")
        self.driver.find_element(By.ID, "txtHighSchool").send_keys(data["high_school"])
        self.driver.find_element(By.ID, "txtGradYear").send_keys(str(data["grad_year"]))
        self.driver.find_element(By.ID, "btnContinue").click()
        time.sleep(2)
        return True

    def process_id(self) -> bool:
        self.driver.get("https://admissions.maricopa.edu/Application/ProcessID.aspx")
        input("Complete ID verification in the browser then press [Enter].")
        return True

    def set_password(self, data: Dict, password: Optional[str] = None) -> bool:
        self.driver.get("https://admissions.maricopa.edu/Application/SetPassword.aspx")
        password = password or "@Phc2026nitmirr"
        self.driver.find_element(By.ID, "txtPassword").send_keys(password)
        self.driver.find_element(By.ID, "txtConfirmPassword").send_keys(password)
        self.driver.find_element(By.ID, "btnContinue").click()
        time.sleep(3)
        return True

    # ---------------------------------------------------------------------

    def run_single_account(self) -> Dict:
        acct = self.generate_account_data()
        acct["email"] = self.generate_temp_email()
        logging.info("starting %s <%s>", acct["full_name"], acct["email"])
        try:
            self.create_account_step1(acct)
            self.verify_otp_step(acct)
            self.fill_personal_info(acct)
            self.fill_education_info(acct)
            self.process_id()
            self.set_password(acct)
            acct["status"] = "success"
            acct["username"] = f"{acct['first_name'][:3].upper()}{random.randint(100000, 999999)}"
        except Exception as exc:  # pragma: no cover - runtime errors
            logging.exception("failed to create account for %s", acct["email"])
            acct["status"] = "failed"
            acct["error"] = str(exc)
        self.accounts.append(acct)
        return acct

    def run_batch(self, count: int, use_proxies: bool = True) -> None:
        logging.info("running batch of %d accounts (proxies=%s)", count, "enabled" if use_proxies else "disabled")
        for i in range(count):
            logging.info("account %d/%d", i + 1, count)
            
            # Fetch new proxy if enabled
            current_proxy = None
            if use_proxies:
                current_proxy = self.fetch_proxy()
                if current_proxy:
                    logging.info("using proxy %s", current_proxy)
                    if self.driver:
                        self.driver.quit()
                    self.proxy_url = current_proxy
                    self.driver = _make_driver(False, current_proxy)
                    self.wait = WebDriverWait(self.driver, 20)
                else:
                    logging.warning("no working proxy found, falling back to direct connection")
            
            try:
                self.run_single_account()
                if current_proxy:
                    self.accounts[-1]["proxy"] = current_proxy
            except Exception as exc:
                logging.error("error during account creation: %s", str(exc))
                if current_proxy:
                    self.accounts[-1]["proxy"] = current_proxy
            
            if i < count - 1:
                delay = random.randint(30, 120)
                logging.debug("sleeping %ds before next", delay)
                time.sleep(delay)
        
        pd.DataFrame(self.accounts).to_csv("maricopa_accounts.csv", index=False)
        successes = len([a for a in self.accounts if a.get("status") == "success"])
        logging.info("batch complete (%d successes)", successes)

    def close(self) -> None:
        try:
            self.driver.quit()
        except Exception:
            pass


# -----------------------------------------------------------------------------
# command‑line entry
# -----------------------------------------------------------------------------


def main() -> None:
    parser = argparse.ArgumentParser(description="Automate Maricopa admissions form")
    parser.add_argument("--count", "-n", type=int, default=1, help="number of accounts to generate")
    parser.add_argument("--headless", "-H", action="store_true", help="run Chrome in headless mode")
    parser.add_argument(
        "--use-proxies",
        action="store_true",
        default=PROXYSCRAPE_API_KEY is not None,
        help="enable proxy rotation (default: true if PROXYSCRAPE_API_KEY is set)",
    )
    parser.add_argument(
        "--no-proxy",
        action="store_true",
        help="force disable proxy rotation",
    )
    parser.add_argument(
        "--vpn",
        action="store_true",
        help="use Urban VPN Chrome extension for IP rotation",
    )
    parser.add_argument(
        "--my-chrome",
        action="store_true",
        help="use your real Chrome profile (close Chrome first!)",
    )
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")
    
    if args.no_proxy:
        args.use_proxies = False
    
    if not RAPIDAPI_KEY:
        logging.error("GMAILNATOR_API_KEY not set. Set it with:")
        logging.error("  $env:GMAILNATOR_API_KEY = 'your-rapidapi-key'")
        return
    
    if args.use_proxies and not PROXYSCRAPE_API_KEY:
        logging.warning("--use-proxies enabled but PROXYSCRAPE_API_KEY not set, disabling proxies")
        args.use_proxies = False
    
    if args.my_chrome:
        logging.info("Real Chrome profile mode — VPN must be connected manually")
        args.use_proxies = False
        args.vpn = False  # VPN is in the profile already
    elif args.vpn:
        logging.info("Urban VPN mode enabled")
        args.use_proxies = False
    elif args.use_proxies:
        logging.info("proxy rotation enabled")
    
    bot = MaricopaAdmissionsBot(
        headless=args.headless,
        use_vpn=args.vpn,
        use_real_profile=args.my_chrome,
    )
    try:
        bot.run_batch(args.count, use_proxies=args.use_proxies)
    finally:
        bot.close()


if __name__ == "__main__":
    main()
