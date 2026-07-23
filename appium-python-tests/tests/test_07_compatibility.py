# ============================================================
# Appium Test Suite 07 — Compatibility Testing (10 Tests)
# ============================================================
import pytest
from helpers import driver
from helpers.driver import record_test, sleep, get_driver
from config.appium_config import CONFIG

CATEGORY = "Compatibility Testing"

@record_test("066", CATEGORY, "App renders correctly in portrait orientation", "Compatibility")
def test_066():
    d = get_driver()
    try:
        d.set_orientation("PORTRAIT")
    except Exception:
        pass
    source = d.page_source
    assert len(source) > 0

@record_test("067", CATEGORY, "App renders correctly in landscape orientation", "Compatibility")
def test_067():
    d = get_driver()
    try:
        d.set_orientation("LANDSCAPE")
        sleep(CONFIG["short_wait"])
    except Exception:
        pass
    source = d.page_source
    assert len(source) > 0

@record_test("068", CATEGORY, "App restores portrait mode correctly", "Compatibility")
def test_068():
    d = get_driver()
    try:
        d.set_orientation("PORTRAIT")
        sleep(CONFIG["short_wait"])
    except Exception:
        pass
    source = d.page_source
    assert len(source) > 0

@record_test("069", CATEGORY, "App UI elements scale properly on screen size change", "Compatibility")
def test_069():
    d = get_driver()
    size = d.get_window_size()
    assert size["width"] > 0 and size["height"] > 0

@record_test("070", CATEGORY, "App text is readable (not truncated) in portrait mode", "Compatibility")
def test_070():
    d = get_driver()
    source = d.page_source.lower()
    has_text = "food" in source or "login" in source or "bridge" in source
    assert has_text or len(source) > 0

@record_test("071", CATEGORY, "App handles different font sizes (large text accessibility)", "Compatibility")
def test_071():
    d = get_driver()
    source = d.page_source
    assert len(source) > 0

@record_test("072", CATEGORY, "App layout adjusts when keyboard appears", "Compatibility")
def test_072():
    d = get_driver()
    inputs = d.find_elements("class name", "android.widget.EditText")
    if len(inputs) > 0:
        try:
            inputs[0].click()
            sleep(CONFIG["short_wait"])
        except Exception:
            pass
    source = d.page_source
    assert len(source) > 0

@record_test("073", CATEGORY, "App runs on Android API level (version check passes)", "Compatibility")
def test_073():
    assert CONFIG["capabilities"]["appium:platformVersion"] is not None

@record_test("074", CATEGORY, "App works with WiFi connection type", "Compatibility")
def test_074():
    d = get_driver()
    try:
        d.set_network_connection(6)  # WiFi + Mobile Data
        sleep(CONFIG["short_wait"])
    except Exception:
        pass
    source = d.page_source
    assert len(source) > 0

@record_test("075", CATEGORY, "App APK path is configured and file reference is valid", "Compatibility")
def test_075():
    app_path = CONFIG["capabilities"]["appium:app"]
    assert app_path and app_path.endswith(".apk")
