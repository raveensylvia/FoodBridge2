# ============================================================
# FoodBridge Appium — Master Test Runner (Python version)
# Runs all mobile suites and generates Excel report
# ============================================================
import os
import sys
import time

# Ensure current directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import pytest
from conftest import pytest_results
from helpers.excel_reporter import generate_report
from config.appium_config import CONFIG

# Console colors matching Node.js
class C:
    reset = '\033[0m'
    bright = '\033[1m'
    green = '\033[32m'
    red = '\033[31m'
    yellow = '\033[33m'
    cyan = '\033[36m'
    magenta = '\033[35m'
    white = '\033[37m'
    blue = '\033[34m'

def banner(text):
    line = "=" * 62
    print(f"\n{C.cyan}{line}{C.reset}")
    print(f"  {C.bright}{C.cyan}{text}{C.reset}")
    print(f"{C.cyan}{line}{C.reset}\n")

def main():
    banner("[Mobile] FoodBridge - Appium Mobile Test Runner (Python)")
    print(f"  [Tests] Planned Tests : 132 (TC-M001 to TC-M132)")
    print(f"  [Warn]  Mock driver active - tests run without physical device")
    print(f"  [API]   Backend URL   : {CONFIG['api_url']}\n")

    global_start = int(time.time() * 1000)
    
    # Run tests using pytest
    test_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "tests")
    exit_code = pytest.main(["-q", "--tb=no", test_dir])
    
    global_duration = int(time.time() * 1000) - global_start

    # Load results from .pytest_results.json
    import json
    loaded_results = []
    for p in [".pytest_results.json", os.path.join(os.path.dirname(os.path.abspath(__file__)), ".pytest_results.json"), os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".pytest_results.json")]:
        if os.path.exists(p):
            try:
                with open(p, "r") as f:
                    loaded_results = json.load(f)
                break
            except Exception:
                pass

    total = len(loaded_results)
    passed = sum(1 for r in loaded_results if r["status"] == "PASS")
    failed = sum(1 for r in loaded_results if r["status"] == "FAIL")
    skipped = sum(1 for r in loaded_results if r["status"] == "SKIP")
    pass_rate = (passed / total * 100) if total > 0 else 0

    banner("Mobile Test Run Summary - All 11 Categories")
    print(f"  Total Tests  : {total}")
    print(f"  {C.green}[PASS] Passed    : {passed}{C.reset}")
    print(f"  {C.red}[FAIL] Failed    : {failed}{C.reset}")
    print(f"  {C.yellow}[SKIP] Skipped   : {skipped}{C.reset}")
    print(f"  {C.cyan}[Time] Duration  : {(global_duration / 1000):.2f}s{C.reset}")
    print(f"  Pass Rate    : {pass_rate:.1f}%\n")

    # Group by category
    by_category = {}
    for r in loaded_results:
        cat = r["category"]
        if cat not in by_category:
            by_category[cat] = {"total": 0, "passed": 0, "failed": 0}
        by_category[cat]["total"] += 1
        if r["status"] == "PASS":
            by_category[cat]["passed"] += 1
        elif r["status"] == "FAIL":
            by_category[cat]["failed"] += 1

    print(f"  {C.cyan}[Stats] Results by Suite:{C.reset}")
    print(f"  {C.cyan}" + "-" * 45 + f"{C.reset}")
    for cat, data in by_category.items():
        pct = (data["passed"] / data["total"] * 100) if data["total"] > 0 else 0
        color = C.red if data["failed"] > 0 else C.green
        print(f"  {color}{cat.ljust(30)} {str(data['passed']).rjust(3)}/{str(data['total']).rjust(3)} ({pct:.0f}%){C.reset}")

    # Generate Excel report
    print(f"\n  {C.cyan}[Report] Generating Excel report...{C.reset}")
    try:
        report_path = generate_report(loaded_results, {
            "total": total,
            "passed": passed,
            "failed": failed,
            "skipped": skipped,
            "duration": global_duration,
            "suite": "FoodBridge Mobile E2E - Python Suite (TC-M001 to TC-M132)"
        })
        print(f"  {C.green}[Report] Excel report saved -> {report_path}{C.reset}")
    except Exception as err:
        print(f"  {C.red}[Report] Report generation failed: {err}{C.reset}")

    if failed == 0:
        banner("ALL MOBILE TESTS PASSED!")
        sys.exit(0)
    else:
        banner(f"{failed} TEST(S) FAILED")
        sys.exit(1)

if __name__ == "__main__":
    main()
