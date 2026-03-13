#!/usr/bin/env python3
"""Bulk-provision `.edu` accounts via an administrative API.

Usage:
    export PROV_API_BASE=https://mail.example.edu/api/v1
    export PROV_API_KEY=secret-token
    python3 scripts/provision_accounts.py students.csv

The script reads a CSV file with at least the columns
`email` and `full_name`.  An optional `password` column may be
provided; if omitted the script assigns a default and prints a
reminder to the console.

It posts each record to the provider's ``/users`` endpoint.  The
API details below are placeholders; replace them with whatever
interface your mail-system exposes (Google Workspace, M365,
self-hosted Postfix+LDAP, etc.).

To produce 100 accounts per day you can generate a daily CSV
or integrate this script with your student information system.
On Windows, schedule the command with Task Scheduler; on *nix
use a cronjob or systemd timer.

The important point is to **use a supported provisioning API** and
respect rate limits rather than trying to "hack" an unrelated
web‑form.
"""

import argparse
import csv
import os
import sys
import time
import requests

API_BASE = os.environ.get("PROV_API_BASE")
API_KEY = os.environ.get("PROV_API_KEY")
RATE_DELAY = float(os.environ.get("PROV_RATE_DELAY", "0.5"))  # seconds
DEFAULT_PASSWORD = os.environ.get("PROV_DEFAULT_PWD", "ChangeMe123!")


def check_config():
    if not API_BASE or not API_KEY:
        sys.exit("Set PROV_API_BASE and PROV_API_KEY in the environment before running")


def create_user(email: str, full_name: str, password: str, dry_run: bool = False) -> bool:
    """Call the provisioning endpoint for a single user.

    Return ``True`` on success (HTTP 201 created) or ``False``.

    If ``dry_run`` is ``True`` the HTTP request is skipped and the
    payload is printed instead.  This makes it safe to test the script
    without hitting the real API.
    """
    payload = {
        "username": email,
        "displayName": full_name,
        "password": password,
        # add whatever additional fields your API requires
    }

    if dry_run:
        print(f"[dry run] would post {payload} to {API_BASE.rstrip('/')}/users")
        return True

    resp = requests.post(
        f"{API_BASE.rstrip('/')}/users",
        json=payload,
        headers={"Authorization": f"Bearer {API_KEY}"},
        timeout=10,
    )

    if resp.status_code == 201:
        return True
    else:
        print(f"error provisioning {email}: {resp.status_code} {resp.text}")
        return False


def provision(csv_path: str, dry_run: bool = False) -> None:
    with open(csv_path, newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            email = row.get("email")
            name = row.get("full_name")
            pwd = row.get("password") or DEFAULT_PASSWORD
            if not email or not name:
                print("skipping row with missing email or full_name", row)
                continue
            success = create_user(email, name, pwd, dry_run=dry_run)
            if success:
                print(f"created {email}")
            time.sleep(RATE_DELAY)


def main():
    parser = argparse.ArgumentParser(description="Bulk-provision edu accounts")
    parser.add_argument("csv", help="path to CSV file containing user rows")
    parser.add_argument("--dry-run", action="store_true", help="show what would be done without calling API")
    args = parser.parse_args()

    csv_file = args.csv
    if not os.path.exists(csv_file):
        sys.exit(f"CSV file not found: {csv_file}")

    check_config()
    provision(csv_file, dry_run=args.dry_run)


if __name__ == "__main__":
    main()
