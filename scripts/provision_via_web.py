#!/usr/bin/env python3
"""Automate a web signup form with Selenium.

This script reads the same CSV format as ``provision_accounts.py`` and
visits a configurable URL, filling in email, full name and password fields.

CAPTCHAs or other interactive challenges are not handled; the script pauses
and waits for you to manually complete them before hitting Enter in the
console.  The browser session will use whatever VPN or proxy the OS is
configured to use (Avira VPN is a system-level service on Windows).

Usage:
    python scripts/provision_via_web.py students.csv --url "https://.../register"

Selectors in ``fill_row()`` must be adjusted to match the target page.

This is provided for demonstration purposes only; it is brittle and should
not replace the proper API-based approach described elsewhere in this repo.
"""

import argparse
import csv
import sys
import time

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.common.exceptions import NoSuchElementException


def fill_row(driver, row, url):
    """Navigate to ``url`` and fill form fields from ``row``.

    The function assumes the page has inputs with IDs/names that look like
    "email", "full_name" and "password".  Change the selectors if your form
    is different.
    """
    driver.get(url)
    time.sleep(2)  # allow page to load; adjust as necessary

    try:
        email_input = driver.find_element(By.NAME, "email")
    except NoSuchElementException:
        email_input = driver.find_element(By.ID, "email")
    email_input.clear()
    email_input.send_keys(row["email"])

    try:
        name_input = driver.find_element(By.NAME, "full_name")
    except NoSuchElementException:
        name_input = driver.find_element(By.ID, "full_name")
    name_input.clear()
    name_input.send_keys(row["full_name"])

    try:
        pwd_input = driver.find_element(By.NAME, "password")
    except NoSuchElementException:
        pwd_input = driver.find_element(By.ID, "password")
    pwd_input.clear()
    pwd_input.send_keys(row.get("password", ""))

    # if there is a submit button we could click it here, but often
    # sites require a captcha; pause so the user can complete it.
    input("Press Enter after you've finished any captcha / confirmation...")
    try:
        submit = driver.find_element(By.XPATH, "//button[@type='submit']")
        submit.click()
    except NoSuchElementException:
        pass


def main():
    parser = argparse.ArgumentParser(description="Selenium-based form filler")
    parser.add_argument("csv", help="CSV file of users")
    parser.add_argument("--url", required=True, help="registration page URL")
    parser.add_argument("--browser", choices=["chrome", "firefox"], default="chrome")
    args = parser.parse_args()

    # choose a driver; webdriver-manager will download if needed
    if args.browser == "chrome":
        from webdriver_manager.chrome import ChromeDriverManager
        driver = webdriver.Chrome(ChromeDriverManager().install())
    else:
        from webdriver_manager.firefox import GeckoDriverManager
        driver = webdriver.Firefox(executable_path=GeckoDriverManager().install())

    with open(args.csv, newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            print(f"processing {row['email']}")
            fill_row(driver, row, args.url)
            time.sleep(1)

    driver.quit()


if __name__ == "__main__":
    main()
