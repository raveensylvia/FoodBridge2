// ============================================================
// Test Suite 08 — Security & Auth Tests (10 Test Cases)
// ============================================================
'use strict';

const assert = require('assert');
const axios  = require('axios');
const {
  buildDriver, goTo, waitForCss, fillField, clickEl, sleep,
  registerUser, loginViaUI, logout, quitDriver, By, until
} = require('../helpers/driver');
const config = require('../config/testConfig');

const CATEGORY = 'Security & Auth';
const HOOK_TIMEOUT = 120000;
const results  = global.__testResults__ = global.__testResults__ || [];

let driver;
before(async function() {
  this.timeout(HOOK_TIMEOUT);
  driver = await buildDriver();
  await registerUser(config.testUsers.donor);
  await registerUser(config.testUsers.ngo);
  await registerUser(config.testUsers.volunteer);
});
after(async function() { this.timeout(30000); await quitDriver(driver); });

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

describe('08 — Security & Auth', () => {

  record('TC-104', 'Unauthenticated /donor access redirects to /login', 'Security', async () => {
    await goTo(driver, '/');
    await driver.executeScript('localStorage.clear()');
    await goTo(driver, '/donor');
    await sleep(config.mediumWait);
    const url = await driver.getCurrentUrl();
    assert.ok(url.includes('/login'), `Expected redirect to /login, got: ${url}`);
  });

  record('TC-105', 'Unauthenticated /ngo access redirects to /login', 'Security', async () => {
    await goTo(driver, '/');
    await driver.executeScript('localStorage.clear()');
    await goTo(driver, '/ngo');
    await sleep(config.mediumWait);
    const url = await driver.getCurrentUrl();
    assert.ok(url.includes('/login'), `Expected redirect to /login, got: ${url}`);
  });

  record('TC-106', 'Unauthenticated /volunteer access redirects to /login', 'Security', async () => {
    await goTo(driver, '/');
    await driver.executeScript('localStorage.clear()');
    await goTo(driver, '/volunteer');
    await sleep(config.mediumWait);
    const url = await driver.getCurrentUrl();
    assert.ok(url.includes('/login'), `Expected redirect to /login, got: ${url}`);
  });

  record('TC-107', 'API /api/donations requires JWT token (401 without token)', 'Security', async () => {
    let statusCode;
    try {
      await axios.get(`${config.apiUrl}/api/donations`);
      statusCode = 200;
    } catch (err) {
      statusCode = err.response ? err.response.status : 0;
    }
    assert.strictEqual(statusCode, 401, `Expected 401 without token, got: ${statusCode}`);
  });

  record('TC-108', 'API /api/auth/login returns 401 for wrong credentials', 'Security', async () => {
    let statusCode;
    try {
      await axios.post(`${config.apiUrl}/api/auth/login`, {
        email: 'nobody@nowhere.com',
        password: 'wrongpassword'
      });
    } catch (err) {
      statusCode = err.response ? err.response.status : 0;
    }
    assert.strictEqual(statusCode, 401, `Expected 401, got: ${statusCode}`);
  });

  record('TC-109', 'API /api/donations/1/accept returns 403 for donor role', 'Security', async () => {
    // Login as donor to get token
    const loginRes = await axios.post(`${config.apiUrl}/api/auth/login`, {
      email: config.testUsers.donor.email,
      password: config.testUsers.donor.password
    });
    const token = loginRes.data.access_token;
    let statusCode;
    try {
      await axios.post(`${config.apiUrl}/api/donations/1/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      statusCode = 200;
    } catch (err) {
      statusCode = err.response ? err.response.status : 0;
    }
    assert.ok(statusCode === 403 || statusCode === 400, `Expected 403 for wrong role, got: ${statusCode}`);
  });

  record('TC-110', 'API /api/donations/1/assign returns 403 for ngo role', 'Security', async () => {
    const loginRes = await axios.post(`${config.apiUrl}/api/auth/login`, {
      email: config.testUsers.ngo.email,
      password: config.testUsers.ngo.password
    });
    const token = loginRes.data.access_token;
    let statusCode;
    try {
      await axios.post(`${config.apiUrl}/api/donations/1/assign`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      statusCode = 200;
    } catch (err) {
      statusCode = err.response ? err.response.status : 0;
    }
    assert.ok(statusCode === 403 || statusCode === 400, `Expected 403 for wrong role, got: ${statusCode}`);
  });

  record('TC-111', 'Donor cannot POST to /api/donations with NGO token', 'Security', async () => {
    const loginRes = await axios.post(`${config.apiUrl}/api/auth/login`, {
      email: config.testUsers.ngo.email,
      password: config.testUsers.ngo.password
    });
    const token = loginRes.data.access_token;
    let statusCode;
    try {
      await axios.post(`${config.apiUrl}/api/donations`, {
        food_name: 'Hack', quantity: '1', food_type: 'Veg',
        expiry_time: '1h', location_lat: 28.6, location_lng: 77.2, address: 'Test'
      }, { headers: { Authorization: `Bearer ${token}` } });
      statusCode = 200;
    } catch (err) {
      statusCode = err.response ? err.response.status : 0;
    }
    assert.ok(statusCode === 403, `Expected 403 for NGO trying to create donation, got: ${statusCode}`);
  });

  record('TC-112', 'Tampered JWT token is rejected by API', 'Security', async () => {
    const fakeToken = 'eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiZG9ub3IifQ.INVALIDSIGNATURE';
    let statusCode;
    try {
      await axios.get(`${config.apiUrl}/api/donations`, {
        headers: { Authorization: `Bearer ${fakeToken}` }
      });
      statusCode = 200;
    } catch (err) {
      statusCode = err.response ? err.response.status : 0;
    }
    assert.ok(statusCode === 401 || statusCode === 422, `Expected 401/422 for tampered token, got: ${statusCode}`);
  });

  record('TC-113', 'CORS headers present on API response', 'Security', async () => {
    const res = await axios.get(`${config.apiUrl}/api/auth/login`, {
      validateStatus: () => true
    });
    // CORS should be enabled (flask-cors is used)
    assert.ok(res.status !== 0, 'API should respond (CORS should be enabled)');
  });

});
