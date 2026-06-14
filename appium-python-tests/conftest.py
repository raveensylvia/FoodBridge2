# ============================================================
# Pytest Configuration and Global Hooks (conftest.py)
# ============================================================
import pytest
import requests
import time
import os
import json
from helpers import driver
from config.appium_config import CONFIG

# Anchor the results file to THIS directory (appium-python-tests/)
_RESULTS_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".pytest_results.json")

# Global list to hold results for report generation
pytest_results = []

@pytest.fixture(scope="session", autouse=True)
def appium_driver_setup():
    # Delete old results file if exists
    if os.path.exists(_RESULTS_FILE):
        try:
            os.remove(_RESULTS_FILE)
        except Exception:
            pass

    # Pre-register test users in the Flask backend
    for role, user in CONFIG["test_users"].items():
        try:
            requests.post(
                f"{CONFIG['api_url']}/api/auth/signup",
                json={
                    "username": user["username"],
                    "email": user["email"],
                    "password": user["password"],
                    "role": user["role"]
                },
                timeout=5
            )
        except Exception:
            pass
            
    # Build driver session
    driver.build_driver()
    yield
    # Delete session
    driver.quit_driver()


@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    outcome = yield
    rep = outcome.get_result()
    
    if rep.when == "call":
        # Extract properties attached by @record_test decorator
        test_id = getattr(item.function, "test_id", "TC-M?")
        category = getattr(item.function, "category", "General")
        name = getattr(item.function, "test_name", item.name)
        test_type = getattr(item.function, "test_type", "Functional")
        
        status = "PASS"
        error_msg = ""
        
        if rep.failed:
            status = "FAIL"
            error_msg = str(rep.longrepr) if rep.longrepr else "Test assertion failed"
            # Truncate long tracebacks to save space in Excel cells
            if len(error_msg) > 200:
                error_msg = error_msg[:200]
        elif rep.skipped:
            status = "SKIP"
            error_msg = "Skipped"

        duration_ms = int(rep.duration * 1000)
        
        res_obj = {
            "id": test_id,
            "category": category,
            "name": name,
            "type": test_type,
            "status": status,
            "duration": duration_ms,
            "error": error_msg
        }
        pytest_results.append(res_obj)
        print(f"__TEST_RESULT__:{json.dumps(res_obj)}", flush=True)

        # Write to JSON file (anchored path)
        try:
            results_list = []
            if os.path.exists(_RESULTS_FILE):
                with open(_RESULTS_FILE, "r") as f:
                    results_list = json.load(f)
            results_list.append(res_obj)
            with open(_RESULTS_FILE, "w") as f:
                json.dump(results_list, f)
        except Exception:
            pass

