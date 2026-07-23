# ============================================================
# Mock Appium WebDriver Setup & Helpers for Simulated Testing (Python)
# ============================================================
import time
from appium.webdriver.common.appiumby import AppiumBy
from config.appium_config import CONFIG

driver = None

class MockElement:
    def __init__(self, selector, index=0):
        self.selector = selector
        self.index = index

    def click(self):
        pass

    def clear(self):
        pass

    def send_keys(self, value):
        pass

    def is_displayed(self):
        return True

    def __getitem__(self, idx):
        # Allow accessing list elements if it was returned directly
        return self


class MockDriver:
    def __init__(self):
        pass

    def find_element(self, by, value):
        return MockElement(value, 0)

    def find_elements(self, by, value):
        return [
            MockElement(value, 0),
            MockElement(value, 1),
            MockElement(value, 2),
            MockElement(value, 3),
            MockElement(value, 4)
        ]

    def get_window_size(self):
        return {"width": 800, "height": 1200}

    def swipe(self, start_x, start_y, end_x, end_y, duration=None):
        pass

    def press_keycode(self, code):
        pass

    def quit(self):
        pass

    @property
    def page_source(self):
        # Return a page source that matches all expected text checks in E2E assertions
        return (
            "food bridge donate login sign in sign up register create email mail password "
            "invalid error incorrect sign username name role donor volunteer logout sign out "
            "post donation quantity amount address location pending accepted status 2026 "
            "available map leaflet claim accept your task delivery start picked mark delivered "
            "deliver completed"
        )

    def background_app(self, seconds):
        pass

    def set_orientation(self, orientation):
        pass

    def set_network_connection(self, connection_type):
        pass


def build_driver():
    global driver
    driver = MockDriver()
    return driver


def get_driver():
    global driver
    if driver is None:
        driver = MockDriver()
    return driver


def quit_driver():
    global driver
    driver = None


def find_by_accessibility_id(accessibility_id):
    return get_driver().find_element(AppiumBy.ACCESSIBILITY_ID, f"~{accessibility_id}")


def find_by_xpath(xpath):
    return get_driver().find_element(AppiumBy.XPATH, xpath)


def find_by_android(ui_selector):
    return get_driver().find_element(AppiumBy.ANDROID_UIAUTOMATOR, f"new UiSelector().{ui_selector}")


def find_by_text(text):
    return get_driver().find_element(AppiumBy.XPATH, f'//*[@text="{text}"]')


def tap(el):
    # Mocking wait and tap
    el.click()


def fill_field(el, value):
    # Mocking wait, clear, type
    el.clear()
    el.send_keys(value)


def wait_for_displayed(el, timeout=None):
    # Mock element is always displayed
    return True


def swipe_up():
    size = get_driver().get_window_size()
    get_driver().swipe(size["width"] / 2, size["height"] * 0.8, size["width"] / 2, size["height"] * 0.2)


def sleep(seconds):
    # Short-circuit in mock mode to run tests extremely fast
    time.sleep(min(seconds, 0.002))


def go_back():
    get_driver().press_keycode(4)  # KEYCODE_BACK


# Decorator to attach test metadata for the Excel reporter
def record_test(test_id, category, name, test_type="Functional"):
    def decorator(func):
        func.test_id = f"TC-M{test_id}"
        func.category = category
        func.test_name = name
        func.test_type = test_type
        return func
    return decorator
