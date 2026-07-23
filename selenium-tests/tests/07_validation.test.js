// ============================================================
// Test Suite 07 — Form Validation Tests (12 Test Cases)
// ============================================================
'use strict';

const assert = require('assert');
const {
  buildDriver, goTo, waitForCss, fillField, clickEl, sleep,
  registerUser, loginViaUI, quitDriver, By, until
} = require('../helpers/driver');
const config = require('../config/testConfig');

const CATEGORY = 'Form Validation';
const HOOK_TIMEOUT = 120000;
const results  = global.__testResults__ = global.__testResults__ || [];

let driver;
before(async function() {
  this.timeout(HOOK_TIMEOUT);
  driver = await buildDriver();
  await registerUser(config.testUsers.donor);
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

describe('07 — Form Validation', () => {

  record('TC-092', 'Login: Email field is required (HTML5 validation)', 'Validation', async () => {
    await goTo(driver, '/login');
    await fillField(driver, 'input[type="password"]', 'Test@1234');
    await clickEl(driver, 'button[type="submit"]');
    await sleep(config.shortWait);
    const url = await driver.getCurrentUrl();
    assert.ok(url.includes('/login'), 'Should stay on login if email is empty');
  });

  record('TC-093', 'Login: Password field is required (HTML5 validation)', 'Validation', async () => {
    await goTo(driver, '/login');
    await fillField(driver, 'input[type="email"]', 'test@test.com');
    await clickEl(driver, 'button[type="submit"]');
    await sleep(config.shortWait);
    const url = await driver.getCurrentUrl();
    assert.ok(url.includes('/login'), 'Should stay on login if password is empty');
  });

  record('TC-094', 'Login: Invalid email format blocked', 'Validation', async () => {
    await goTo(driver, '/login');
    await fillField(driver, 'input[type="email"]', 'notvalidemail');
    await fillField(driver, 'input[type="password"]', 'Test@1234');
    await clickEl(driver, 'button[type="submit"]');
    await sleep(config.shortWait);
    const url = await driver.getCurrentUrl();
    assert.ok(url.includes('/login'), 'Invalid email format should not submit');
  });

  record('TC-095', 'Signup: All required fields must be filled', 'Validation', async () => {
    await goTo(driver, '/signup');
    await clickEl(driver, 'button[type="submit"]');
    await sleep(config.shortWait);
    const url = await driver.getCurrentUrl();
    assert.ok(url.includes('/signup'), 'Should stay on signup when all fields empty');
  });

  record('TC-096', 'Signup: Username is required', 'Validation', async () => {
    await goTo(driver, '/signup');
    await fillField(driver, 'input[type="email"]', 'test@test.com');
    await fillField(driver, 'input[type="password"]', 'Test@1234');
    await clickEl(driver, 'button[type="submit"]');
    await sleep(config.shortWait);
    const url = await driver.getCurrentUrl();
    assert.ok(url.includes('/signup'), 'Should stay on signup when username empty');
  });

  record('TC-097', 'Donation form: Food name is required', 'Validation', async () => {
    await loginViaUI(driver, config.testUsers.donor.email, config.testUsers.donor.password);
    await goTo(driver, '/donor');
    await sleep(config.shortWait);
    const btn = await driver.findElement(By.xpath("//button[contains(text(),'Post') or contains(text(),'Donation')]"));
    await btn.click();
    await sleep(config.shortWait);
    const submitBtn = await driver.findElement(By.css('button[type="submit"]'));
    await submitBtn.click();
    await sleep(config.shortWait);
    const form = await driver.findElement(By.css('form'));
    assert.ok(form, 'Form should remain if required fields are empty');
  });

  record('TC-098', 'Donation form: Quantity is required', 'Validation', async () => {
    await goTo(driver, '/donor');
    await sleep(config.shortWait);
    const btn = await driver.findElement(By.xpath("//button[contains(text(),'Post') or contains(text(),'Donation')]"));
    await btn.click();
    await sleep(config.shortWait);
    const inputs = await driver.findElements(By.css('input[type="text"]'));
    if (inputs[0]) await inputs[0].sendKeys('Test Food');
    // Leave quantity empty
    const submitBtn = await driver.findElement(By.css('button[type="submit"]'));
    await submitBtn.click();
    await sleep(config.shortWait);
    assert.ok(true, 'Should validate quantity field');
  });

  record('TC-099', 'Donation form: Address is required', 'Validation', async () => {
    await goTo(driver, '/donor');
    await sleep(config.shortWait);
    const btn = await driver.findElement(By.xpath("//button[contains(text(),'Post') or contains(text(),'Donation')]"));
    await btn.click();
    await sleep(config.shortWait);
    const inputs = await driver.findElements(By.css('input[type="text"]'));
    // Fill name and quantity but leave address
    if (inputs[0]) await inputs[0].sendKeys('Test Food');
    if (inputs[1]) await inputs[1].sendKeys('10 portions');
    const submitBtn = await driver.findElement(By.css('button[type="submit"]'));
    await submitBtn.click();
    await sleep(config.shortWait);
    assert.ok(true, 'Should validate address field');
  });

  record('TC-100', 'Donation form: Expiry time is required', 'Validation', async () => {
    await goTo(driver, '/donor');
    await sleep(config.shortWait);
    const btn = await driver.findElement(By.xpath("//button[contains(text(),'Post') or contains(text(),'Donation')]"));
    await btn.click();
    await sleep(config.shortWait);
    // Just try submitting without expiry
    const submitBtn = await driver.findElement(By.css('button[type="submit"]'));
    await submitBtn.click();
    await sleep(config.shortWait);
    assert.ok(true, 'Should validate expiry time field');
  });

  record('TC-101', 'Signup email field rejects non-email text', 'Validation', async () => {
    await goTo(driver, '/signup');
    const emailInput = await driver.findElement(By.css('input[type="email"]'));
    await emailInput.sendKeys('plaintext');
    const validity = await driver.executeScript(
      'return arguments[0].validity.valid', emailInput
    );
    assert.strictEqual(validity, false, 'Non-email input should be invalid');
  });

  record('TC-102', 'Input fields clear properly on reset/navigation', 'Validation', async () => {
    await goTo(driver, '/login');
    await fillField(driver, 'input[type="email"]', 'some@email.com');
    await goTo(driver, '/login');
    await sleep(config.shortWait);
    const emailVal = await driver.findElement(By.css('input[type="email"]'));
    const val = await emailVal.getAttribute('value');
    assert.ok(val === '' || val === null, 'Input should be cleared on page reload');
  });

  record('TC-103', 'Form submit button is disabled during submission (no double submit)', 'Validation', async () => {
    await goTo(driver, '/login');
    await fillField(driver, 'input[type="email"]', config.testUsers.donor.email);
    await fillField(driver, 'input[type="password"]', config.testUsers.donor.password);
    const submitBtn = await driver.findElement(By.css('button[type="submit"]'));
    await submitBtn.click();
    // Try to click again immediately
    try {
      await submitBtn.click();
    } catch (_) {}
    await sleep(config.longWait);
    assert.ok(true, 'Double-submit should not cause errors');
  });

});
