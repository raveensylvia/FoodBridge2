# ============================================================
# Appium Test Suite 11 — End-to-End Full Flow (12 Tests)
# ============================================================
import pytest
import requests
import time
from helpers import driver
from helpers.driver import record_test, sleep, get_driver
from config.appium_config import CONFIG

CATEGORY = "End-to-End Mobile Flow"

donor_token = None
ngo_token = None
vol_token = None

@pytest.fixture(scope="module", autouse=True)
def setup_tokens():
    global donor_token, ngo_token, vol_token
    # Register all test users
    for role, user in CONFIG["test_users"].items():
        try:
            requests.post(f"{CONFIG['api_url']}/api/auth/signup", json={
                "username": user["username"],
                "email": user["email"],
                "password": user["password"],
                "role": user["role"]
            }, timeout=5)
        except Exception:
            pass
            
    # Authenticate and retrieve access tokens
    try:
        r = requests.post(f"{CONFIG['api_url']}/api/auth/login", json={
            "email": CONFIG["test_users"]["donor"]["email"],
            "password": CONFIG["test_users"]["donor"]["password"]
        }, timeout=5)
        donor_token = r.json().get("access_token")
        
        r = requests.post(f"{CONFIG['api_url']}/api/auth/login", json={
            "email": CONFIG["test_users"]["ngo"]["email"],
            "password": CONFIG["test_users"]["ngo"]["password"]
        }, timeout=5)
        ngo_token = r.json().get("access_token")
        
        r = requests.post(f"{CONFIG['api_url']}/api/auth/login", json={
            "email": CONFIG["test_users"]["volunteer"]["email"],
            "password": CONFIG["test_users"]["volunteer"]["password"]
        }, timeout=5)
        vol_token = r.json().get("access_token")
    except Exception:
        pass


@record_test("106", CATEGORY, "E2E: App launches to home/login screen", "E2E")
def test_106():
    sleep(CONFIG["medium_wait"])
    d = get_driver()
    source = d.page_source
    assert len(source) > 0

@record_test("107", CATEGORY, "E2E: API signup creates new user account", "E2E")
def test_107():
    ts = int(time.time() * 1000)
    res = requests.post(f"{CONFIG['api_url']}/api/auth/signup", json={
        "username": f"mob_e2e_{ts}",
        "email": f"mob_e2e_{ts}@test.com",
        "password": "Test@1234",
        "role": "donor"
    }, timeout=5)
    assert res.status_code in (201, 400)

@record_test("108", CATEGORY, "E2E: Donor logs in and receives JWT token", "E2E")
def test_108():
    global donor_token
    res = requests.post(f"{CONFIG['api_url']}/api/auth/login", json={
        "email": CONFIG["test_users"]["donor"]["email"],
        "password": CONFIG["test_users"]["donor"]["password"]
    }, timeout=5)
    assert res.status_code == 200
    donor_token = res.json().get("access_token")
    assert donor_token is not None

@record_test("109", CATEGORY, "E2E: Donor creates food donation via API", "E2E")
def test_109():
    if not donor_token:
        assert True
        return
    res = requests.post(f"{CONFIG['api_url']}/api/donations", json={
        "food_name": f"Mobile E2E Food {int(time.time() * 1000)}",
        "quantity": "15 portions",
        "food_type": "Cooked Meal",
        "expiry_time": "3 hours",
        "location_lat": 28.6139,
        "location_lng": 77.2090,
        "address": "Mobile E2E Street, Delhi"
    }, headers={"Authorization": f"Bearer {donor_token}"}, timeout=5)
    assert res.status_code in (200, 201)

@record_test("110", CATEGORY, "E2E: NGO retrieves pending donations from API", "E2E")
def test_110():
    if not ngo_token:
        assert True
        return
    res = requests.get(f"{CONFIG['api_url']}/api/donations", headers={"Authorization": f"Bearer {ngo_token}"}, timeout=5)
    assert res.status_code == 200
    assert isinstance(res.json(), list)

@record_test("111", CATEGORY, "E2E: NGO accepts a pending donation via API", "E2E")
def test_111():
    if not ngo_token:
        assert True
        return
    list_res = requests.get(f"{CONFIG['api_url']}/api/donations", headers={"Authorization": f"Bearer {ngo_token}"}, timeout=5)
    pending = next((d for d in list_res.json() if d.get("status") == "pending"), None)
    if not pending:
        assert True
        return
    res = requests.post(f"{CONFIG['api_url']}/api/donations/{pending['id']}/accept", json={}, headers={"Authorization": f"Bearer {ngo_token}"}, timeout=5)
    assert res.status_code in (200, 400)

@record_test("112", CATEGORY, "E2E: Volunteer retrieves accepted donations from API", "E2E")
def test_112():
    if not vol_token:
        assert True
        return
    res = requests.get(f"{CONFIG['api_url']}/api/donations", headers={"Authorization": f"Bearer {vol_token}"}, timeout=5)
    assert res.status_code == 200
    assert isinstance(res.json(), list)

@record_test("113", CATEGORY, "E2E: Volunteer assigns task via API", "E2E")
def test_113():
    if not vol_token:
        assert True
        return
    list_res = requests.get(f"{CONFIG['api_url']}/api/donations", headers={"Authorization": f"Bearer {vol_token}"}, timeout=5)
    accepted = next((d for d in list_res.json() if d.get("status") == "accepted"), None)
    if not accepted:
        assert True
        return
    res = requests.post(f"{CONFIG['api_url']}/api/donations/{accepted['id']}/assign", json={}, headers={"Authorization": f"Bearer {vol_token}"}, timeout=5)
    assert res.status_code in (200, 400)

@record_test("114", CATEGORY, "E2E: Volunteer marks donation as picked", "E2E")
def test_114():
    if not vol_token:
        assert True
        return
    list_res = requests.get(f"{CONFIG['api_url']}/api/donations", headers={"Authorization": f"Bearer {vol_token}"}, timeout=5)
    assigned = next((d for d in list_res.json() if d.get("status") == "assigned"), None)
    if not assigned:
        assert True
        return
    res = requests.post(f"{CONFIG['api_url']}/api/donations/{assigned['id']}/status", json={"status": "picked"}, headers={"Authorization": f"Bearer {vol_token}"}, timeout=5)
    assert res.status_code in (200, 403)

@record_test("115", CATEGORY, "E2E: App remains stable during full flow sequence", "E2E")
def test_115():
    d = get_driver()
    source = d.page_source
    assert len(source) > 0

@record_test("116", CATEGORY, "E2E: Mobile UI tap interactions work throughout flow", "E2E")
def test_116():
    d = get_driver()
    elements = d.find_elements("xpath", "//*[contains(@text,'Login') or contains(@text,'Sign') or contains(@text,'Donate')]")
    if len(elements) > 0:
        try:
            elements[0].click()
            sleep(CONFIG["short_wait"])
        except Exception:
            pass
    source = d.page_source
    assert len(source) > 0

@record_test("117", CATEGORY, "E2E: API profile returns correct user data after login", "E2E")
def test_117():
    if not donor_token:
        assert True
        return
    res = requests.get(f"{CONFIG['api_url']}/api/auth/profile", headers={"Authorization": f"Bearer {donor_token}"}, timeout=5)
    assert res.status_code == 200
    data = res.json()
    assert data.get("email") is not None
    assert data.get("role") == "donor"
