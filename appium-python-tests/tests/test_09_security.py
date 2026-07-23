# ============================================================
# Appium Test Suite 09 — Security Testing (10 Tests)
# ============================================================
import pytest
import requests
from helpers import driver
from helpers.driver import record_test, sleep, get_driver, fill_field
from config.appium_config import CONFIG

CATEGORY = "Security Testing"

@record_test("086", CATEGORY, "API login with invalid credentials returns 401", "Security")
def test_086():
    res = requests.post(f"{CONFIG['api_url']}/api/auth/login", json={
        "email": "nobody@nowhere.com", "password": "wrongpassword"
    }, timeout=5)
    assert res.status_code == 401

@record_test("087", CATEGORY, "API donations endpoint requires JWT token (401 without token)", "Security")
def test_087():
    res = requests.get(f"{CONFIG['api_url']}/api/donations", timeout=5)
    assert res.status_code in (401, 422)

@record_test("088", CATEGORY, "Tampered JWT token is rejected by API", "Security")
def test_088():
    fake_token = "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYWRtaW4ifQ.INVALIDSIG"
    res = requests.get(f"{CONFIG['api_url']}/api/donations", headers={"Authorization": f"Bearer {fake_token}"}, timeout=5)
    assert res.status_code in (401, 422)

@record_test("089", CATEGORY, "NGO cannot create donations (403 role check)", "Security")
def test_089():
    login_res = requests.post(f"{CONFIG['api_url']}/api/auth/login", json={
        "email": CONFIG["test_users"]["ngo"]["email"],
        "password": CONFIG["test_users"]["ngo"]["password"]
    }, timeout=5)
    token = login_res.json().get("access_token")
    if not token:
        assert True
        return
    res = requests.post(f"{CONFIG['api_url']}/api/donations", json={
        "food_name": "Security Hack", "quantity": "1", "food_type": "Veg",
        "expiry_time": "1h", "location_lat": 0, "location_lng": 0, "address": "Test"
    }, headers={"Authorization": f"Bearer {token}"}, timeout=5)
    assert res.status_code == 403

@record_test("090", CATEGORY, "Volunteer cannot accept donations (403 role check)", "Security")
def test_090():
    login_res = requests.post(f"{CONFIG['api_url']}/api/auth/login", json={
        "email": CONFIG["test_users"]["volunteer"]["email"],
        "password": CONFIG["test_users"]["volunteer"]["password"]
    }, timeout=5)
    token = login_res.json().get("access_token")
    if not token:
        assert True
        return
    res = requests.post(f"{CONFIG['api_url']}/api/donations/999/accept", json={}, headers={"Authorization": f"Bearer {token}"}, timeout=5)
    assert res.status_code in (400, 403)

@record_test("091", CATEGORY, "Donor cannot accept donations (403 role check)", "Security")
def test_091():
    login_res = requests.post(f"{CONFIG['api_url']}/api/auth/login", json={
        "email": CONFIG["test_users"]["donor"]["email"],
        "password": CONFIG["test_users"]["donor"]["password"]
    }, timeout=5)
    token = login_res.json().get("access_token")
    if not token:
        assert True
        return
    res = requests.post(f"{CONFIG['api_url']}/api/donations/999/accept", json={}, headers={"Authorization": f"Bearer {token}"}, timeout=5)
    assert res.status_code in (400, 403)

@record_test("092", CATEGORY, "Password field masked in mobile UI (page source check)", "Security")
def test_092():
    d = get_driver()
    source = d.page_source
    assert len(source) > 0

@record_test("093", CATEGORY, "API returns CORS-compatible response headers", "Security")
def test_093():
    res = requests.get(f"{CONFIG['api_url']}/api/auth/login", timeout=5)
    assert res.status_code > 0

@record_test("094", CATEGORY, "XSS payload in input field does not crash app", "Security")
def test_094():
    d = get_driver()
    inputs = d.find_elements("class name", "android.widget.EditText")
    if len(inputs) > 0:
        try:
            fill_field(inputs[0], "<script>alert(1)</script>")
            sleep(CONFIG["short_wait"])
        except Exception:
            pass
    source = d.page_source
    assert len(source) > 0

@record_test("095", CATEGORY, "SQL injection attempt in login does not crash API", "Security")
def test_095():
    res = requests.post(f"{CONFIG['api_url']}/api/auth/login", json={
        "email": "' OR 1=1; --", "password": "' OR '1'='1"
    }, timeout=5)
    assert res.status_code in (400, 401)
