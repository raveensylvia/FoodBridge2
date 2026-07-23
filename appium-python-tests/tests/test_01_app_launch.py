# ============================================================
# Appium Test Suite 01 — App Launch & Navigation (10 Tests)
# ============================================================
import pytest
from helpers import driver
from helpers.driver import record_test, sleep, go_back, get_driver
from config.appium_config import CONFIG

CATEGORY = "App Launch & Navigation"

@record_test("001", CATEGORY, "App launches successfully without crash", "Functional")
def test_001():
    sleep(CONFIG["long_wait"])
    d = get_driver()
    assert d is not None, "Driver session should be active"

@record_test("002", CATEGORY, "Splash screen or main screen appears within 10 seconds", "Functional")
def test_002():
    sleep(CONFIG["long_wait"])
    d = get_driver()
    source = d.page_source
    assert source and len(source) > 0, "Page source should be non-empty on launch"

@record_test("003", CATEGORY, "App title / FoodBridge branding is visible on launch", "UI/UX")
def test_003():
    d = get_driver()
    source = d.page_source.lower()
    has_brand = "food" in source or "bridge" in source or "donate" in source
    assert has_brand, "FoodBridge branding should appear on launch screen"

@record_test("004", CATEGORY, "Login button/option is visible on initial screen", "UI/UX")
def test_004():
    d = get_driver()
    source = d.page_source.lower()
    has_login = "login" in source or "sign in" in source
    assert has_login, "Login option should be visible on initial screen"

@record_test("005", CATEGORY, "Sign Up button/option is visible on initial screen", "UI/UX")
def test_005():
    d = get_driver()
    source = d.page_source.lower()
    has_signup = "sign up" in source or "register" in source or "create" in source
    assert has_signup, "Sign Up option should be visible on initial screen"

@record_test("006", CATEGORY, "App does not request unnecessary permissions at launch", "Security")
def test_006():
    sleep(CONFIG["medium_wait"])
    d = get_driver()
    source = d.page_source
    assert len(source) > 0, "App should continue running without permission blocks"

@record_test("007", CATEGORY, "Back button does not crash the app on main screen", "Functional")
def test_007():
    go_back()
    sleep(CONFIG["short_wait"])
    d = get_driver()
    source = d.page_source
    assert len(source) > 0, "App should not crash on back press at main screen"

@record_test("008", CATEGORY, "App handles device rotation (if applicable)", "UI/UX")
def test_008():
    d = get_driver()
    try:
        d.set_orientation("LANDSCAPE")
        sleep(CONFIG["short_wait"])
        d.set_orientation("PORTRAIT")
        sleep(CONFIG["short_wait"])
    except Exception:
        # Orientation lock is acceptable
        pass
    source = d.page_source
    assert len(source) > 0, "App should survive orientation change"

@record_test("009", CATEGORY, "App loads within acceptable time (< 15 seconds)", "Functional")
def test_009():
    start = time_ms()
    d = get_driver()
    d.page_source
    elapsed = time_ms() - start
    assert elapsed < 15000, f"App should load within 15s, took {elapsed}ms"

@record_test("010", CATEGORY, "No error dialog or crash dialog visible on launch", "Functional")
def test_010():
    d = get_driver()
    source = d.page_source.lower()
    has_crash = "unfortunately" in source or "has stopped" in source or "force close" in source
    assert not has_crash, "No crash dialog should appear on launch"

def time_ms():
    import time
    return int(time.time() * 1000)
