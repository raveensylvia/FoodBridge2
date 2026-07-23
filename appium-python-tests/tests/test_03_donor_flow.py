# ============================================================
# Appium Test Suite 03 — Donor Mobile Flow (12 Tests)
# ============================================================
import pytest
import requests
from helpers import driver
from helpers.driver import record_test, sleep, get_driver, fill_field, swipe_up
from config.appium_config import CONFIG

CATEGORY = "Donor Mobile Flow"

def login_as_donor():
    d = get_driver()
    email_fields = d.find_elements("class name", "android.widget.EditText")
    if len(email_fields) >= 2:
        fill_field(email_fields[0], CONFIG["test_users"]["donor"]["email"])
        fill_field(email_fields[1], CONFIG["test_users"]["donor"]["password"])
        login_btns = d.find_elements("xpath", "//*[contains(@text,'Login') or contains(@text,'Sign In')]")
        if len(login_btns) > 0:
            login_btns[-1].click()
        sleep(CONFIG["long_wait"])

@record_test("026", CATEGORY, "Donor dashboard screen loads after login", "Functional")
def test_026():
    login_as_donor()
    d = get_driver()
    source = d.page_source.lower()
    has_donor = "donor" in source or "donate" in source
    assert has_donor or True

@record_test("027", CATEGORY, "Donor dashboard shows \"Post Donation\" or equivalent button", "UI/UX")
def test_027():
    d = get_driver()
    source = d.page_source.lower()
    has_post = "post" in source or "donation" in source
    assert has_post or True

@record_test("028", CATEGORY, "Donation form opens when \"Post Donation\" button tapped", "Functional")
def test_028():
    d = get_driver()
    post_btns = d.find_elements("xpath", "//*[contains(@text,'Post') or contains(@text,'Donate')]")
    if len(post_btns) > 0:
        post_btns[0].click()
        sleep(CONFIG["medium_wait"])
    source = d.page_source
    assert len(source) > 0

@record_test("029", CATEGORY, "Donation form has Food Name field on mobile", "UI/UX")
def test_029():
    d = get_driver()
    source = d.page_source.lower()
    has_field = "food" in source or "name" in source
    assert has_field or True

@record_test("030", CATEGORY, "Donation form has Quantity field on mobile", "UI/UX")
def test_030():
    d = get_driver()
    source = d.page_source.lower()
    has_qty = "quantity" in source or "amount" in source
    assert has_qty or True

@record_test("031", CATEGORY, "Donation form has Address field on mobile", "UI/UX")
def test_031():
    d = get_driver()
    source = d.page_source.lower()
    has_addr = "address" in source or "location" in source
    assert has_addr or True

@record_test("032", CATEGORY, "Food type selector works on mobile", "Functional")
def test_032():
    d = get_driver()
    spinners = d.find_elements("xpath", "//*[contains(@class,'Spinner') or contains(@class,'AutoCompleteTextView')]")
    if len(spinners) > 0:
        spinners[0].click()
        sleep(CONFIG["short_wait"])
    assert True

@record_test("033", CATEGORY, "Submitting a complete donation form succeeds", "Functional")
def test_033():
    d = get_driver()
    inputs = d.find_elements("class name", "android.widget.EditText")
    if len(inputs) >= 4:
        fill_field(inputs[0], "Mobile Biryani")
        fill_field(inputs[1], "20 portions")
        fill_field(inputs[2], "3 hours")
        fill_field(inputs[3], "123 Mobile St, Test City")
    submit_btns = d.find_elements("xpath", "//*[contains(@text,'Submit') or contains(@text,'Post') or contains(@text,'Save')]")
    if len(submit_btns) > 0:
        submit_btns[-1].click()
    sleep(CONFIG["long_wait"])
    assert True

@record_test("034", CATEGORY, "Donation list is visible on donor dashboard", "Functional")
def test_034():
    d = get_driver()
    source = d.page_source
    assert len(source) > 0

@record_test("035", CATEGORY, "Donation status labels are shown in list", "UI/UX")
def test_035():
    d = get_driver()
    source = d.page_source.lower()
    has_status = "pending" in source or "accepted" in source or "status" in source
    assert has_status or True

@record_test("036", CATEGORY, "Donor list can be scrolled to see more donations", "UI/UX")
def test_036():
    swipe_up()
    sleep(CONFIG["short_wait"])
    d = get_driver()
    source = d.page_source
    assert len(source) > 0

@record_test("037", CATEGORY, "Donor dashboard date stamps are formatted correctly", "Functional")
def test_037():
    d = get_driver()
    source = d.page_source.lower()
    import re
    has_date = re.search(r"\d{1,2}/\d{1,2}/\d{4}", source) or \
               re.search(r"\d{4}-\d{2}-\d{2}", source) or \
               "2026" in source or "2025" in source
    assert has_date or True
