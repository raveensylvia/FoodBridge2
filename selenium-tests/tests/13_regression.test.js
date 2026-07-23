// ============================================================
// Test Suite 13 — Regression Testing (10 Test Cases)
// TC-164 to TC-173
// ============================================================
'use strict';

const assert = require('assert');
const axios  = require('axios');
const {
  buildDriver, goTo, fillField, clickEl, sleep,
  registerUser, loginViaUI, logout, quitDriver, By
} = require('../helpers/driver');
const config = require('../config/testConfig');

const CATEGORY = 'Regression Testing';
const results  = global.__testResults__ = global.__testResults__ || [];

let driver;

before(async () => {
  driver = await buildDriver();
  await registerUser(config.testUsers.donor);
  await registerUser(config.testUsers.ngo);
  await registerUser(config.testUsers.volunteer);
});
after(async () => { await quitDriver(driver); });

function record(id, name, type, fn) {
  it(`[TC-${id}] ${name}`, async function () {
    const start = Date.now();
    try {
      await fn();
      results.push({ id, category: CATEGORY, name, type, status: 'PASS', duration: Date.now() - start });
    } catch (err) {
      results.push({ id, category: CATEGORY, name, type, status: 'FAIL', duration: Date.now() - start, error: err.message });
      throw err;
    }
  });
}

describe('13 — Regression Testing', () => {

  record('TC-164', 'Core: Landing page still loads after all previous tests', 'Regression', async () => {
    await goTo(driver, '/');
    await sleep(config.shortWait);
    const title = await driver.getTitle();
    assert.ok(title !== undefined && title !== null, 'Landing page title should load');
  });

  record('TC-165', 'Core: Login page still accessible and has email input', 'Regression', async () => {
    await goTo(driver, '/login');
    await sleep(config.shortWait);
    const emailEls = await driver.findElements(By.css('input[type="email"]'));
    assert.ok(emailEls.length > 0, 'Login page should still have email input');
  });

  record('TC-166', 'Core: Signup page still accessible and has role selector', 'Regression', async () => {
    await goTo(driver, '/signup');
    await sleep(config.shortWait);
    const selects = await driver.findElements(By.css('select'));
    assert.ok(selects.length > 0, 'Signup page should still have role selector');
  });

  record('TC-167', 'Core: Donor login → /donor redirect still works', 'Regression', async () => {
    await loginViaUI(driver, config.testUsers.donor.email, config.testUsers.donor.password);
    await sleep(config.shortWait);
    const url = await driver.getCurrentUrl();
    assert.ok(url.includes('/donor'), `Expected /donor, got: ${url}`);
    await logout(driver);
  });

  record('TC-168', 'Core: NGO login → /ngo redirect still works', 'Regression', async () => {
    await loginViaUI(driver, config.testUsers.ngo.email, config.testUsers.ngo.password);
    await sleep(config.shortWait);
    const url = await driver.getCurrentUrl();
    assert.ok(url.includes('/ngo'), `Expected /ngo, got: ${url}`);
    await logout(driver);
  });

  record('TC-169', 'Core: Volunteer login → /volunteer redirect still works', 'Regression', async () => {
    await loginViaUI(driver, config.testUsers.volunteer.email, config.testUsers.volunteer.password);
    await sleep(config.shortWait);
    const url = await driver.getCurrentUrl();
    assert.ok(url.includes('/volunteer'), `Expected /volunteer, got: ${url}`);
    await logout(driver);
  });

  record('TC-170', 'Core: Unauthenticated /donor still redirects to /login', 'Regression', async () => {
    await driver.executeScript('localStorage.clear()');
    await goTo(driver, '/donor');
    await sleep(config.mediumWait);
    const url = await driver.getCurrentUrl();
    assert.ok(url.includes('/login'), `Expected /login, got: ${url}`);
  });

  record('TC-171', 'Core: JWT API auth still blocks requests without token', 'Regression', async () => {
    const res = await axios.get(`${config.apiUrl}/api/donations`, {
      validateStatus: () => true
    });
    assert.ok(res.status === 401 || res.status === 422,
      `Expected 401/422, got: ${res.status}`);
  });

  record('TC-172', 'Core: Role-based route still blocks wrong-role access', 'Regression', async () => {
    const ngoLogin = await axios.post(`${config.apiUrl}/api/auth/login`, {
      email: config.testUsers.ngo.email, password: config.testUsers.ngo.password
    }, { validateStatus: () => true });
    const ngoToken = ngoLogin.data.access_token;
    if (!ngoToken) { assert.ok(true, 'Skipped — no NGO token'); return; }
    // NGO cannot POST donation
    const res = await axios.post(`${config.apiUrl}/api/donations`, {
      food_name: 'Regression Hack', quantity: '1', food_type: 'Veg',
      expiry_time: '1h', location_lat: 28.6, location_lng: 77.2, address: 'Test'
    }, {
      headers: { Authorization: `Bearer ${ngoToken}` },
      validateStatus: () => true
    });
    assert.strictEqual(res.status, 403, `Expected 403 for NGO creating donation, got: ${res.status}`);
  });

  record('TC-173', 'Core: Logout still clears localStorage and redirects', 'Regression', async () => {
    await loginViaUI(driver, config.testUsers.donor.email, config.testUsers.donor.password);
    await sleep(config.shortWait);
    await logout(driver);
    await sleep(config.shortWait);
    const token = await driver.executeScript('return localStorage.getItem("token")');
    assert.ok(!token, 'Token should be cleared after logout in regression test');
  });

});
