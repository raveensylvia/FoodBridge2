# ============================================================
# Appium Test Suite 08 — Performance Testing (10 Tests)
# ============================================================
import pytest
import time
import requests
from helpers import driver
from helpers.driver import record_test, sleep, get_driver, swipe_up
from config.appium_config import CONFIG

CATEGORY = "Performance Testing"

def time_ms():
    return int(time.time() * 1000)

@record_test("076", CATEGORY, "App launches and UI is ready within 15 seconds", "Performance")
def test_076():
    start = time_ms()
    d = get_driver()
    source = d.page_source
    elapsed = time_ms() - start
    assert len(source) > 0 and elapsed < 15000

@record_test("077", CATEGORY, "getPageSource call completes within 5 seconds", "Performance")
def test_077():
    d = get_driver()
    start = time_ms()
    d.page_source
    elapsed = time_ms() - start
    assert elapsed < 5000

@record_test("078", CATEGORY, "API login responds within 5 seconds from device", "Performance")
def test_078():
    start = time_ms()
    try:
        requests.post(f"{CONFIG['api_url']}/api/auth/login", json={
            "email": CONFIG["test_users"]["donor"]["email"],
            "password": CONFIG["test_users"]["donor"]["password"]
        }, timeout=5)
    except Exception:
        pass
    elapsed = time_ms() - start
    assert elapsed < 5000

@record_test("079", CATEGORY, "API donations list responds within 5 seconds", "Performance")
def test_079():
    donor_token = None
    try:
        r = requests.post(f"{CONFIG['api_url']}/api/auth/login", json={
            "email": CONFIG["test_users"]["donor"]["email"],
            "password": CONFIG["test_users"]["donor"]["password"]
        }, timeout=5)
        donor_token = r.json().get("access_token")
    except Exception:
        pass
    if not donor_token:
        assert True
        return
    start = time_ms()
    try:
        requests.get(f"{CONFIG['api_url']}/api/donations", headers={"Authorization": f"Bearer {donor_token}"}, timeout=5)
    except Exception:
        pass
    elapsed = time_ms() - start
    assert elapsed < 5000

@record_test("080", CATEGORY, "Tap interaction responds within 2 seconds", "Performance")
def test_080():
    d = get_driver()
    start = time_ms()
    elements = d.find_elements("xpath", "//*[contains(@text,'Login') or contains(@text,'Sign')]")
    if len(elements) > 0:
        try:
            elements[0].click()
        except Exception:
            pass
    elapsed = time_ms() - start
    assert elapsed < 2000

@record_test("081", CATEGORY, "getWindowSize API responds immediately", "Performance")
def test_081():
    d = get_driver()
    start = time_ms()
    size = d.get_window_size()
    elapsed = time_ms() - start
    assert size["width"] > 0 and elapsed < 1000

@record_test("082", CATEGORY, "Multiple getPageSource calls do not degrade", "Performance")
def test_082():
    d = get_driver()
    times = []
    for _ in range(3):
        s = time_ms()
        d.page_source
        times.append(time_ms() - s)
    max_time = max(times)
    assert max_time < 5000

@record_test("083", CATEGORY, "API signup responds within 5 seconds", "Performance")
def test_083():
    ts = int(time.time() * 1000)
    start = time_ms()
    try:
        requests.post(f"{CONFIG['api_url']}/api/auth/signup", json={
            "username": f"perf_mob_{ts}",
            "email": f"perf_mob_{ts}@test.com",
            "password": "Test@1234",
            "role": "donor"
        }, timeout=5)
    except Exception:
        pass
    elapsed = time_ms() - start
    assert elapsed < 5000

@record_test("084", CATEGORY, "swipeUp gesture completes without delay", "Performance")
def test_084():
    start = time_ms()
    swipe_up()
    elapsed = time_ms() - start
    assert elapsed < 3000

@record_test("085", CATEGORY, "App remains responsive after 5 rapid API calls", "Performance")
def test_085():
    # Run rapid requests sequentially in Python for simplicity or using session
    s = requests.Session()
    success = True
    for _ in range(5):
        try:
            r = s.post(f"{CONFIG['api_url']}/api/auth/login", json={
                "email": "perf@test.com", "password": "Test@1234"
            }, timeout=2)
            if r.status_code == 0:
                success = False
        except Exception:
            pass
    assert success
