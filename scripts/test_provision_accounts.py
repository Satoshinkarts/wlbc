import os
import sys
import tempfile
import requests
import requests_mock

# make sure the script directory is on the path so tests can import it directly
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from provision_accounts import create_user, provision


def test_create_user_dry_run(monkeypatch, tmp_path):
    # dry run should never actually POST
    called = False

    def fake_post(*args, **kwargs):
        nonlocal called
        called = True
        class R: status_code = 201
        return R()

    monkeypatch.setattr(requests, 'post', fake_post)
    assert create_user('a@b.edu', 'A B', 'pwd', dry_run=True)
    assert not called


def test_provision_iteration(monkeypatch, tmp_path):
    csv_content = "email,full_name,password\nfoo@x.edu,Foo,pass\nbar@x.edu,Bar,\n"
    csv_file = tmp_path / "data.csv"
    csv_file.write_text(csv_content)

    posted = []

    def fake_post(url, json, headers, timeout):
        posted.append((url, json, headers))
        class R: status_code = 201
        return R()

    monkeypatch.setattr(requests, 'post', fake_post)
    provision(str(csv_file), dry_run=False)
    assert len(posted) == 2
    assert posted[0][1]['username'] == 'foo@x.edu'
    assert posted[1][1]['username'] == 'bar@x.edu'
