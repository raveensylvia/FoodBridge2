// ============================================================
// Test Suite 03 — Login Page (14 Test Cases)
// ============================================================
'use strict';

const assert = require('assert');
const {
  buildDriver, goTo, waitForCss, fillField, clickEl, getText, sleep,
  registerUser, loginViaUI, logout, quitDriver, By, until
} = require('../helpers/driver');
const config = require('../config/testConfig');

const CATEGORY = 'Login — Functional & Security';
const HOOK_TIMEOUT = 120000;
const results  = global.__testResults__ = global.__testResults__ || [];

let driver;

before(async function() {
  this.timeout(HOOK_TIMEOUT);
  driver = await buildDriver();
  // Ensure test users exist
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

describe('03 — Login Page', () => {

  record('TC-028', 'Login page loads at /login', 'Functional', async () => {
    await goTo(driver, '/login');
    const url = await driver.getCurrentUrl();
    assert.ok(url.includes('/login'), `Expected /login, got: ${url}`);
  });

  record('TC-029', 'Login form has Email and Password fields', 'UI/UX', async () => {
    await goTo(driver, '/login');
    const email = await driver.findElement(By.css('input[type="email"]'));
    const pass  = await driver.findElement(By.css('input[type="password"]'));
    assert.ok(email && pass, 'Both email and password fields should exist');
  });

  record('TC-030', 'Login form has a Submit button', 'UI/UX', async () => {
    await goTo(driver, '/login');
    const btn = await driver.findElement(By.css('button[type="submit"]'));
    assert.ok(btn, 'Submit button should exist');
  });

  record('TC-031', 'Empty form submission stays on /login', 'Validation', async () => {
    await goTo(driver, '/login');
    await clickEl(driver, 'button[type="submit"]');
    await sleep(config.shortWait);
    const url = await driver.getCurrentUrl();
    assert.ok(url.includes('/login'), 'Should stay on /login with empty form');
  });

  record('TC-032', 'Invalid credentials shows error message', 'Validation', async () => {
    await goTo(driver, '/login');
    await fillField(driver, 'input[type="email"]',    'wrong@email.com');
    await fillField(driver, 'input[type="password"]', 'WrongPass');
    await clickEl(driver, 'button[type="submit"]');
    await sleep(config.longWait);
    const src = await driver.getPageSource();
    const url = await driver.getCurrentUrl();
    const hasError = src.toLowerCase().includes('invalid') ||
                     src.toLowerCase().includes('error') ||
                     src.toLowerCase().includes('incorrect') ||
                     url.includes('/login');
    assert.ok(hasError, 'Should show error for invalid credentials');
  });

  record('TC-033', 'Donor login redirects to /donor dashboard', 'Functional', async () => {
    await loginViaUI(driver, config.testUsers.donor.email, config.testUsers.donor.password);
    const url = await driver.getCurrentUrl();
    assert.ok(url.includes('/donor'), `Expected /donor, got: ${url}`);
    await logout(driver);
  });

  record('TC-034', 'NGO login redirects to /ngo dashboard', 'Functional', async () => {
    await loginViaUI(driver, config.testUsers.ngo.email, config.testUsers.ngo.password);
    const url = await driver.getCurrentUrl();
    assert.ok(url.includes('/ngo'), `Expected /ngo, got: ${url}`);
    await logout(driver);
  });

  record('TC-035', 'Volunteer login redirects to /volunteer dashboard', 'Functional', async () => {
    await loginViaUI(driver, config.testUsers.volunteer.email, config.testUsers.volunteer.password);
    const url = await driver.getCurrentUrl();
    assert.ok(url.includes('/volunteer'), `Expected /volunteer, got: ${url}`);
    await logout(driver);
  });

  record('TC-036', 'JWT token stored in localStorage after login', 'Security', async () => {
    await loginViaUI(driver, config.testUsers.donor.email, config.testUsers.donor.password);
    const token = await driver.executeScript(() => localStorage.getItem('token'));
    assert.ok(token && token.length > 10, 'JWT token should be stored in localStorage');
    await logout(driver);
  });

  record('TC-037', 'User info stored in localStorage after login', 'Security', async () => {
    await loginViaUI(driver, config.testUsers.donor.email, config.testUsers.donor.password);
    const user = await driver.executeScript(() => localStorage.getItem('user'));
    assert.ok(user, 'User info should be stored in localStorage');
    const parsed = JSON.parse(user);
    assert.ok(parsed.role, 'User role should be in stored user info');
    await logout(driver);
  });

  record('TC-038', 'Logout clears localStorage and redirects', 'Security', async () => {
    await loginViaUI(driver, config.testUsers.donor.email, config.testUsers.donor.password);
    await logout(driver);
    await sleep(config.shortWait);
    const token = await driver.executeScript(() => localStorage.getItem('token'));
    assert.ok(!token, 'Token should be cleared after logout');
  });

  record('TC-039', 'Unauthenticated access to /donor redirects to /login', 'Security', async () => {
    await driver.executeScript(() => localStorage.clear());
    await goTo(driver, '/donor');
    await sleep(config.mediumWait);
    const url = await driver.getCurrentUrl();
    assert.ok(url.includes('/login'), `Expected redirect to /login, got: ${url}`);
  });

  record('TC-040', '"Don\'t have an account?" link navigates to /signup', 'UI/UX', async () => {
    await goTo(driver, '/login');
    const signupLink = await driver.findElement(
      By.xpath("//*[contains(text(),'Sign Up') or contains(text(),'signup') or contains(@href,'/signup')]")
    );
    await signupLink.click();
    await sleep(config.shortWait);
    const url = await driver.getCurrentUrl();
    assert.ok(url.includes('/signup'), `Expected /signup, got: ${url}`);
  });

  record('TC-041', 'Password field masks characters (type=password)', 'Security', async () => {
    await goTo(driver, '/login');
    const passInput = await driver.findElement(By.css('input[type="password"]'));
    const type = await passInput.getAttribute('type');
    assert.strictEqual(type, 'password', 'Password field must have type="password"');
  });

});
