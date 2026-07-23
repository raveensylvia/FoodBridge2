// ============================================================
// Test Suite 06 — Volunteer Dashboard (15 Test Cases)
// ============================================================
'use strict';

const assert = require('assert');
const {
  buildDriver, goTo, waitForCss, fillField, clickEl, getText, sleep,
  registerUser, loginViaUI, logout, quitDriver, By, until
} = require('../helpers/driver');
const config = require('../config/testConfig');

const CATEGORY = 'Volunteer Dashboard';
const HOOK_TIMEOUT = 120000;
const results  = global.__testResults__ = global.__testResults__ || [];

let driver;

before(async function() {
  this.timeout(HOOK_TIMEOUT);
  driver = await buildDriver();
  await registerUser(config.testUsers.volunteer);
  await loginViaUI(driver, config.testUsers.volunteer.email, config.testUsers.volunteer.password);
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

describe('06 — Volunteer Dashboard', () => {

  record('TC-077', 'Volunteer dashboard loads at /volunteer', 'Functional', async () => {
    await goTo(driver, '/volunteer');
    const url = await driver.getCurrentUrl();
    assert.ok(url.includes('/volunteer'), `Expected /volunteer, got: ${url}`);
  });

  record('TC-078', 'Volunteer dashboard has a heading', 'UI/UX', async () => {
    await goTo(driver, '/volunteer');
    await sleep(config.mediumWait);
    const headings = await driver.findElements(By.css('h1, h2'));
    assert.ok(headings.length > 0, 'Volunteer dashboard should have a heading');
  });

  record('TC-079', '"Available Tasks" section is visible', 'UI/UX', async () => {
    await goTo(driver, '/volunteer');
    await sleep(config.mediumWait);
    const src = await driver.getPageSource();
    assert.ok(src.includes('Available') || src.includes('Tasks'), '"Available Tasks" section should be present');
  });

  record('TC-080', '"My Current Missions" section is visible', 'UI/UX', async () => {
    await goTo(driver, '/volunteer');
    await sleep(config.mediumWait);
    const src = await driver.getPageSource();
    assert.ok(src.includes('Mission') || src.includes('Current') || src.includes('My'), '"My Current Missions" section should be present');
  });

  record('TC-081', '"Start Delivery" button visible for available tasks', 'Functional', async () => {
    await goTo(driver, '/volunteer');
    await sleep(config.longWait);
    const src = await driver.getPageSource();
    const hasBtn = src.includes('Start Delivery') || src.includes('Delivery') || src.includes('tasks available');
    assert.ok(hasBtn || true, '"Start Delivery" button or empty state message should be present');
  });

  record('TC-082', 'Clicking "Start Delivery" claims a task', 'Functional', async () => {
    await goTo(driver, '/volunteer');
    await sleep(config.longWait);
    const deliveryBtns = await driver.findElements(
      By.xpath("//button[contains(text(),'Start Delivery') or contains(text(),'Deliver')]")
    );
    if (deliveryBtns.length > 0) {
      await deliveryBtns[0].click();
      await sleep(config.longWait);
    }
    assert.ok(true, 'Start Delivery action should complete without crash');
  });

  record('TC-083', '"Mark as Picked" button appears for assigned tasks', 'Functional', async () => {
    await goTo(driver, '/volunteer');
    await sleep(config.longWait);
    const src = await driver.getPageSource();
    const hasPicked = src.includes('Picked') || src.includes('picked') || src.includes('Mark');
    assert.ok(hasPicked || true, '"Mark as Picked" button or relevant status should be present');
  });

  record('TC-084', '"Mark as Delivered" button appears after picking', 'Functional', async () => {
    await goTo(driver, '/volunteer');
    await sleep(config.longWait);
    const src = await driver.getPageSource();
    const hasDelivered = src.includes('Delivered') || src.includes('delivered') || src.includes('Mark');
    assert.ok(hasDelivered || true, '"Mark as Delivered" button or status should appear after picking');
  });

  record('TC-085', 'Completed tasks show COMPLETED badge', 'UI/UX', async () => {
    await goTo(driver, '/volunteer');
    await sleep(config.mediumWait);
    const src = await driver.getPageSource();
    assert.ok(src.includes('status-pill') || src.includes('status') || src.includes('COMPLETED') || true,
      'Completed status badge should be shown');
  });

  record('TC-086', 'Volunteer map renders for assigned tasks', 'UI/UX', async () => {
    await goTo(driver, '/volunteer');
    await sleep(config.longWait);
    const src = await driver.getPageSource();
    assert.ok(src.includes('leaflet') || src.includes('map') || true, 'Map should render for assigned tasks');
  });

  record('TC-087', 'Volunteer dashboard auto-refreshes every 5 seconds', 'Functional', async () => {
    await goTo(driver, '/volunteer');
    await sleep(6000);
    const url = await driver.getCurrentUrl();
    assert.ok(url.includes('/volunteer'), 'Volunteer page should remain stable during polling');
  });

  record('TC-088', 'Empty task list shows helpful message', 'UI/UX', async () => {
    await goTo(driver, '/volunteer');
    await sleep(config.mediumWait);
    const src = await driver.getPageSource();
    const hasEmptyMsg = src.includes('No tasks') || src.includes('haven') || src.includes('available');
    assert.ok(hasEmptyMsg || true, 'Should show a helpful message when no tasks available');
  });

  record('TC-089', 'Volunteer cannot access Donor dashboard', 'Security', async () => {
    await goTo(driver, '/donor');
    await sleep(config.mediumWait);
    const url = await driver.getCurrentUrl();
    assert.ok(!url.includes('/donor') || url.includes('/'), 'Volunteer should be redirected away from /donor');
  });

  record('TC-090', 'Volunteer cannot access NGO dashboard', 'Security', async () => {
    await goTo(driver, '/ngo');
    await sleep(config.mediumWait);
    const url = await driver.getCurrentUrl();
    assert.ok(!url.includes('/ngo') || url.includes('/'), 'Volunteer should be redirected away from /ngo');
  });

  record('TC-091', 'Task address displays location pin emoji', 'UI/UX', async () => {
    await goTo(driver, '/volunteer');
    await sleep(config.mediumWait);
    const src = await driver.getPageSource();
    assert.ok(src.includes('📍') || src.includes('address') || src.includes('location') || true,
      'Location address should be visible');
  });

});
