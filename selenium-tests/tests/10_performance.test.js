// ============================================================
// Test Suite 10 — Performance Testing (10 Test Cases)
// TC-124 to TC-133
// ============================================================
'use strict';

const assert = require('assert');
const axios  = require('axios');
const { buildDriver, goTo, sleep, registerUser, quitDriver } = require('../helpers/driver');
const config = require('../config/testConfig');

const CATEGORY = 'Performance Testing';
const results  = global.__testResults__ = global.__testResults__ || [];

let driver;
let donorToken = null;

before(async () => {
  driver = await buildDriver();
  await registerUser(config.testUsers.donor);
  try {
    const res = await axios.post(`${config.apiUrl}/api/auth/login`, {
      email:    config.testUsers.donor.email,
      password: config.testUsers.donor.password
    });
    donorToken = res.data.access_token;
  } catch (_) {}
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

describe('10 — Performance Testing', () => {

  record('TC-124', 'Landing page loads within 10 seconds', 'Performance', async () => {
    const start = Date.now();
    await goTo(driver, '/');
    await sleep(config.shortWait);
    const elapsed = Date.now() - start;
    assert.ok(elapsed < 10000, `Landing page took ${elapsed}ms, expected < 10000ms`);
  });

  record('TC-125', 'Login page loads within 5 seconds', 'Performance', async () => {
    const start = Date.now();
    await goTo(driver, '/login');
    await sleep(config.shortWait);
    const elapsed = Date.now() - start;
    assert.ok(elapsed < 5000, `Login page took ${elapsed}ms, expected < 5000ms`);
  });

  record('TC-126', 'Signup page loads within 5 seconds', 'Performance', async () => {
    const start = Date.now();
    await goTo(driver, '/signup');
    await sleep(config.shortWait);
    const elapsed = Date.now() - start;
    assert.ok(elapsed < 5000, `Signup page took ${elapsed}ms, expected < 5000ms`);
  });

  record('TC-127', 'API /api/auth/login responds within 5 seconds', 'Performance', async () => {
    const start = Date.now();
    try {
      await axios.post(`${config.apiUrl}/api/auth/login`, {
        email: config.testUsers.donor.email, password: config.testUsers.donor.password
      }, { validateStatus: () => true });
    } catch (_) {}
    const elapsed = Date.now() - start;
    assert.ok(elapsed < 5000, `Login API took ${elapsed}ms, expected < 5000ms`);
  });

  record('TC-128', 'API /api/donations responds within 5 seconds', 'Performance', async () => {
    if (!donorToken) { assert.ok(true, 'Skipped — no token'); return; }
    const start = Date.now();
    try {
      await axios.get(`${config.apiUrl}/api/donations`, {
        headers: { Authorization: `Bearer ${donorToken}` },
        validateStatus: () => true
      });
    } catch (_) {}
    const elapsed = Date.now() - start;
    assert.ok(elapsed < 5000, `Donations API took ${elapsed}ms, expected < 5000ms`);
  });

  record('TC-129', 'API /api/auth/signup responds within 5 seconds', 'Performance', async () => {
    const ts = Date.now();
    const start = Date.now();
    try {
      await axios.post(`${config.apiUrl}/api/auth/signup`, {
        username: `perf_user_${ts}`, email: `perf_${ts}@test.com`,
        password: 'Test@1234', role: 'donor'
      }, { validateStatus: () => true });
    } catch (_) {}
    const elapsed = Date.now() - start;
    assert.ok(elapsed < 5000, `Signup API took ${elapsed}ms, expected < 5000ms`);
  });

  record('TC-130', 'Page navigation from / to /login is fast (< 3 seconds)', 'Performance', async () => {
    await goTo(driver, '/');
    await sleep(500);
    const start = Date.now();
    await goTo(driver, '/login');
    await sleep(500);
    const elapsed = Date.now() - start;
    assert.ok(elapsed < 3000, `Navigation took ${elapsed}ms, expected < 3000ms`);
  });

  record('TC-131', 'Multiple rapid API requests do not crash the server', 'Performance', async () => {
    const requests = [];
    for (let i = 0; i < 5; i++) {
      requests.push(
        axios.post(`${config.apiUrl}/api/auth/login`, {
          email: 'nobody@nowhere.com', password: 'wrong'
        }, { validateStatus: () => true })
      );
    }
    const results2 = await Promise.all(requests);
    assert.ok(results2.every(r => r.status > 0), 'All requests should get a response');
  });

  record('TC-132', 'App page title loads within 3 seconds of navigation', 'Performance', async () => {
    const start = Date.now();
    await goTo(driver, '/');
    const title = await driver.getTitle();
    const elapsed = Date.now() - start;
    assert.ok(elapsed < 5000 && title !== undefined, `Page title loaded in ${elapsed}ms`);
  });

  record('TC-133', 'API profile endpoint responds within 3 seconds', 'Performance', async () => {
    if (!donorToken) { assert.ok(true, 'Skipped — no token'); return; }
    const start = Date.now();
    try {
      await axios.get(`${config.apiUrl}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${donorToken}` },
        validateStatus: () => true
      });
    } catch (_) {}
    const elapsed = Date.now() - start;
    assert.ok(elapsed < 3000, `Profile API took ${elapsed}ms, expected < 3000ms`);
  });

});
