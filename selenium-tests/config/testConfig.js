// ============================================================
// FoodBridge Selenium Test Configuration
// ============================================================
'use strict';

const config = {
  // ── Application URLs ──────────────────────────────────────
  baseUrl: 'http://localhost:5173',          // Vite dev server
  apiUrl:  'http://localhost:5000',           // Flask backend

  // ── Browser Settings ──────────────────────────────────────
  browser: 'chrome',
  headless: true,                            // Set true for CI
  windowWidth: 1366,
  windowHeight: 768,
  implicitWait: 5000,                        // ms
  pageLoadTimeout: 30000,                    // ms
  scriptTimeout: 10000,                      // ms

  // ── Test Users ────────────────────────────────────────────
  testUsers: {
    donor: {
      username: 'selenium_donor',
      email:    'selenium.donor@test.com',
      password: 'Test@1234',
      role:     'donor'
    },
    ngo: {
      username: 'selenium_ngo',
      email:    'selenium.ngo@test.com',
      password: 'Test@1234',
      role:     'ngo'
    },
    volunteer: {
      username: 'selenium_volunteer',
      email:    'selenium.volunteer@test.com',
      password: 'Test@1234',
      role:     'volunteer'
    }
  },

  // ── Test Data ─────────────────────────────────────────────
  testDonation: {
    food_name:   'Selenium Test Biryani',
    quantity:    '50 portions',
    food_type:   'Cooked Meal',
    expiry_time: '4 hours',
    address:     '123 Test Street, Test City, India'
  },

  // ── Timeouts ──────────────────────────────────────────────
  shortWait:  2000,
  mediumWait: 4000,
  longWait:   8000,

  // ── Report Settings ───────────────────────────────────────
  reportDir:  './reports',
  reportName: 'FoodBridge_Web_Test_Report'
};

module.exports = config;
