# ============================================================
# FoodBridge Appium Test Configuration (Python)
# ============================================================
import os

CONFIG = {
    # -- Appium Server -----------------------------------------
    "appium_host": "127.0.0.1",
    "appium_port": 4723,

    # -- Android Device / Emulator Capabilities ----------------
    "capabilities": {
        "platformName": "Android",
        "appium:automationName": "UiAutomator2",
        "appium:platformVersion": "13.0",
        "appium:deviceName": "emulator-5554",
        "appium:app": os.path.normpath("c:/Users/ravee/Downloads/food_bridge2/app-release.apk"),
        "appium:noReset": False,
        "appium:fullReset": False,
        "appium:newCommandTimeout": 90,
        "appium:autoGrantPermissions": True
    },

    # -- App Configuration --------------------------------------
    "app_package": "com.foodbridge.app",
    "app_activity": "com.foodbridge.app.MainActivity",

    # -- Backend API -------------------------------------------
    "api_url": "http://127.0.0.1:5000",

    # -- Test Users --------------------------------------------
    "test_users": {
        "donor": {
            "username": "appium_donor",
            "email": "appium.donor@test.com",
            "password": "Test@1234",
            "role": "donor"
        },
        "ngo": {
            "username": "appium_ngo",
            "email": "appium.ngo@test.com",
            "password": "Test@1234",
            "role": "ngo"
        },
        "volunteer": {
            "username": "appium_volunteer",
            "email": "appium.volunteer@test.com",
            "password": "Test@1234",
            "role": "volunteer"
        }
    },

    # -- Timeouts (in seconds for Python) ----------------------
    "short_wait": 2,
    "medium_wait": 4,
    "long_wait": 10,

    # -- Report Settings ---------------------------------------
    "report_dir": os.path.normpath("./reports"),
    "report_name": "FoodBridge_Mobile_Test_Report"
}
