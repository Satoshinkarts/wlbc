# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

---

## EDU account provisioning helper (Python)

A simple Python script has been added under `scripts/provision_accounts.py` to
make use of an administrative API to bulk-create student email accounts.

This is intended for legitimate use by administrators who already have
credentials to an email system (e.g. Google Workspace, Microsoft 365, or a
custom provider) and wish to automate daily provisioning.  It **does not
attempt to bypass any registration process**; please ensure you are operating
within your organisation's policies.

### Quickstart

1. Install the dependency:
   ```sh
   pip install -r requirements.txt
   ```
2. Prepare a CSV file of new users (see `scripts/students.example.csv`).
3. Set the environment variables:
   ```sh
   export PROV_API_BASE=https://mail.example.edu/api/v1
   export PROV_API_KEY=your-admin-token
   ```
4. Run the script:
   ```sh
   python3 scripts/provision_accounts.py students.csv
   ```

Rate limits, default passwords, and other behaviour can also be configured via
environment variables.  Schedule the command daily using your platform's task
scheduler/cron if you need 100 accounts per day.

A small test suite exists under `scripts/test_provision_accounts.py`; install

```sh
pip install -r requirements.txt
pytest scripts
```

and the tests will exercise both the dry-run mode and a simple provisioning
loop.

Refer to the comments at the top of the script for more details and adapt the
HTTP payload to match the API offered by your mail provider.

### Optional: browser automation via Selenium

If you absolutely need to drive a web form rather than an API, a secondary
script (`scripts/provision_via_web.py`) demonstrates how to launch a browser
and populate the fields.  You must manually solve any CAPTCHA, and the site’s
terms of service may prohibit this kind of automation, so proceed only with
explicit permission.

```sh
pip install -r requirements.txt
python scripts/provision_via_web.py students.csv --url "https://mail.example.edu/register"
```

Modify the element selectors in the script to match your signup page.  The
browser will automatically use whatever network configuration (VPN/proxy) is
active on your machine; Avira VPN being enabled means Selenium’s controlled
Chrome/Firefox will route through it by default.

### Maricopa Community Colleges admissions bot

A more specialised script, `scripts/maricopa_admissions_bot.py`, is also
included.  It walks through the public Maricopa admissions wizard, generates a
temporary email using the Gmailnator API (via RapidAPI) and extracts the
verification code automatically.  Human intervention is still required to
solve the occasional CAPTCHA and to perform ID verification steps.

To use it you need a RapidAPI key assigned to the Gmailnator service:

```sh
export GMAILNATOR_API_KEY=your_key_here
```

Then run:

```sh
python -m scripts.maricopa_admissions_bot --count 5
```

Additional options include `--headless` to hide the browser window.  Results
are saved to `maricopa_accounts.csv` when the run completes.

The bot relies on ``webdriver-manager`` to fetch the correct ChromeDriver
binary automatically, so no manual installation is required.


