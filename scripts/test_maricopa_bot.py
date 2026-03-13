import pytest

from scripts import maricopa_admissions_bot as bot_module


def test_generate_account_data():
    bot = bot_module.MaricopaAdmissionsBot(headless=True)
    data = bot.generate_account_data()
    assert "first_name" in data and "last_name" in data
    assert data["email"] is None
    bot.close()


def test_temp_email_format(monkeypatch):
    # if the API fails return fallback
    monkeypatch.setattr(bot_module.requests, "post", lambda *args, **kwargs: type("R", (), {"status_code": 500, "json": lambda: {}})())
    bot = bot_module.MaricopaAdmissionsBot(headless=True)
    email = bot.generate_temp_email()
    assert email.endswith("@gmailnator.com")
    bot.close()
