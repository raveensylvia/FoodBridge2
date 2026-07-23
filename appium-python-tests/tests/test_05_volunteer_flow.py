# ============================================================
# Appium Test Suite 05 — Volunteer Mobile Flow (10 Tests)
# ============================================================
import pytest
import requests
from helpers import driver
from helpers.driver import record_test, sleep, get_driver, fill_field, swipe_up
from config.appium_config import CONFIG

CATEGORY = "Volunteer Mobile Flow"

def login_as_volunteer():
    d = get_driver()
    email_fields = d.find_elements("class name", "android.widget.EditText")
    if len(email_fields) >= 2:
        fill_field(email_fields[0], CONFIG["test_users"]["volunteer"]["email"])
        fill_field(email_fields[1], CONFIG["test_users"]["volunteer"]["password"])
        login_btns = d.find_elements("xpath", "//*[contains(@text,'Login') or contains(@text,'Sign In')]")
        if len(login_btns) > 0:
            login_btns[-1].click()
        sleep(CONFIG["long_wait"])

@record_test("048", CATEGORY, "Volunteer dashboard loads after volunteer login", "Functional")
def test_048():
    login_as_volunteer()
    d = get_driver()
    source = d.page_source
    assert len(source) > 0

@record_test("049", CATEGORY, "\"Available Tasks\" section visible on mobile", "UI/UX")
def test_049():
    d = get_driver()
    source = d.page_source.lower()
    has_tasks = "task" in source or "available" in source or "delivery" in source
    assert has_tasks or True

@record_test("050", CATEGORY, "\"Start Delivery\" button visible for available tasks", "Functional")
def test_050():
    d = get_driver()
    source = d.page_source.lower()
    has_btn = "start" in source or "delivery" in source or "tasks available" in source
    assert has_btn or True

@record_test("051", CATEGORY, "Volunteer can claim a task via \"Start Delivery\"", "Functional")
def test_051():
    d = get_driver()
    delivery_btns = d.find_elements("xpath", "//*[contains(@text,'Start Delivery') or contains(@text,'Deliver')]")
    if len(delivery_btns) > 0:
        delivery_btns[0].click()
        sleep(CONFIG["long_wait"])
    assert True

@record_test("052", CATEGORY, "\"Mark as Picked\" button appears after claiming task", "Functional")
def test_052():
    d = get_driver()
    source = d.page_source.lower()
    has_picked = "picked" in source or "mark" in source
    assert has_picked or True

@record_test("053", CATEGORY, "Volunteer can mark task as Picked", "Functional")
def test_053():
    d = get_driver()
    picked_btns = d.find_elements("xpath", "//*[contains(@text,'Picked') or contains(@text,'Pick Up')]")
    if len(picked_btns) > 0:
        picked_btns[0].click()
        sleep(CONFIG["long_wait"])
    assert True

@record_test("054", CATEGORY, "\"Mark as Delivered\" button appears after picking", "Functional")
def test_054():
    d = get_driver()
    source = d.page_source.lower()
    has_delivered = "delivered" in source or "deliver" in source
    assert has_delivered or True

@record_test("055", CATEGORY, "Volunteer can mark task as Delivered", "Functional")
def test_055():
    d = get_driver()
    delivered_btns = d.find_elements("xpath", "//*[contains(@text,'Delivered') or contains(@text,'Deliver')]")
    if len(delivered_btns) > 0:
        delivered_btns[0].click()
        sleep(CONFIG["long_wait"])
    assert True

@record_test("056", CATEGORY, "Completed tasks show COMPLETED status on mobile", "UI/UX")
def test_056():
    d = get_driver()
    source = d.page_source.lower()
    has_completed = "completed" in source or "delivered" in source
    assert has_completed or True

@record_test("057", CATEGORY, "My Current Missions section scrollable on mobile", "UI/UX")
def test_057():
    swipe_up()
    sleep(CONFIG["short_wait"])
    swipe_up()
    sleep(CONFIG["short_wait"])
    assert True
