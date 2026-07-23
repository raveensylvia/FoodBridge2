#!/usr/bin/env python3
"""
generate_junit.py
Converts .web_results.json and appium-python-tests/.pytest_results.json
into JUnit XML files that dorny/test-reporter can display in GitHub Actions.
Each individual test case appears by name with PASS/FAIL status.
"""
import json
import os
import xml.etree.ElementTree as ET
from datetime import datetime, timezone


def load_json(filepath):
    if not os.path.exists(filepath):
        print(f"  [junit] {filepath} not found — skipping")
        return []
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"  [junit] Error reading {filepath}: {e}")
        return []


def write_junit(tests, output_path, suite_name):
    """Write a JUnit XML file from a list of test result dicts."""
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    total    = len(tests)
    failures = sum(1 for t in tests if t.get("status") == "FAIL")
    skipped  = sum(1 for t in tests if t.get("status") == "SKIP")
    duration = sum(t.get("duration", 0) for t in tests) / 1000.0

    # Group tests by category → each category becomes a <testsuite>
    categories = {}
    for t in tests:
        cat = t.get("category", "General")
        categories.setdefault(cat, []).append(t)

    root = ET.Element("testsuites", {
        "name":     suite_name,
        "tests":    str(total),
        "failures": str(failures),
        "skipped":  str(skipped),
        "time":     f"{duration:.3f}",
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

    for cat, cat_tests in categories.items():
        cat_total    = len(cat_tests)
        cat_failures = sum(1 for t in cat_tests if t.get("status") == "FAIL")
        cat_skipped  = sum(1 for t in cat_tests if t.get("status") == "SKIP")
        cat_time     = sum(t.get("duration", 0) for t in cat_tests) / 1000.0

        suite_el = ET.SubElement(root, "testsuite", {
            "name":     cat,
            "tests":    str(cat_total),
            "failures": str(cat_failures),
            "skipped":  str(cat_skipped),
            "time":     f"{cat_time:.3f}"
        })

        for t in cat_tests:
            tc_name   = t.get("name", "Unknown test")
            tc_id     = t.get("id", "")
            tc_status = t.get("status", "FAIL")
            tc_time   = t.get("duration", 0) / 1000.0
            tc_err    = t.get("error", "")

            # classname = category, name = "TC-XXX — test name"
            tc_el = ET.SubElement(suite_el, "testcase", {
                "classname": cat,
                "name":      f"{tc_id} — {tc_name}" if tc_id else tc_name,
                "time":      f"{tc_time:.3f}"
            })

            if tc_status == "FAIL":
                failure_el = ET.SubElement(tc_el, "failure", {
                    "message": tc_err[:500] if tc_err else "Test assertion failed",
                    "type":    "AssertionError"
                })
                failure_el.text = tc_err
            elif tc_status == "SKIP":
                ET.SubElement(tc_el, "skipped", {"message": "Skipped"})

    tree = ET.ElementTree(root)
    ET.indent(tree, space="  ")
    tree.write(output_path, encoding="utf-8", xml_declaration=True)
    print(f"  [junit] Written: {output_path} ({total} tests, {failures} failures)")


def main():
    root_dir    = os.path.dirname(os.path.abspath(__file__))
    web_file    = os.path.join(root_dir, ".web_results.json")
    mobile_file = os.path.join(root_dir, "appium-python-tests", ".pytest_results.json")
    junit_dir   = os.path.join(root_dir, "test-results")

    web_data    = load_json(web_file)
    mobile_data = load_json(mobile_file)

    if web_data:
        write_junit(
            web_data,
            os.path.join(junit_dir, "selenium-web-results.xml"),
            "FoodBridge Selenium Web E2E Tests"
        )
    else:
        print("  [junit] No web test data — creating empty selenium XML")
        os.makedirs(junit_dir, exist_ok=True)
        empty = '<?xml version="1.0" encoding="utf-8"?>\n<testsuites name="FoodBridge Selenium Web E2E Tests" tests="0" failures="0" skipped="0" time="0"/>\n'
        with open(os.path.join(junit_dir, "selenium-web-results.xml"), "w") as f:
            f.write(empty)

    if mobile_data:
        write_junit(
            mobile_data,
            os.path.join(junit_dir, "appium-mobile-results.xml"),
            "FoodBridge Appium Mobile E2E Tests"
        )
    else:
        print("  [junit] No mobile test data — creating empty appium XML")
        os.makedirs(junit_dir, exist_ok=True)
        empty = '<?xml version="1.0" encoding="utf-8"?>\n<testsuites name="FoodBridge Appium Mobile E2E Tests" tests="0" failures="0" skipped="0" time="0"/>\n'
        with open(os.path.join(junit_dir, "appium-mobile-results.xml"), "w") as f:
            f.write(empty)

    print(f"  [junit] Done. XML files in: {junit_dir}")


if __name__ == "__main__":
    main()
