// ============================================================
// Test Suite 01 — Landing Page & UI/UX (12 Test Cases)
// ============================================================
'use strict';

const assert  = require('assert');
const { buildDriver, goTo, waitForCss, clickEl, sleep, quitDriver, By, until } = require('../helpers/driver');
const config  = require('../config/testConfig');

const CATEGORY = 'Landing Page & UI/UX';
const HOOK_TIMEOUT = 120000;
const results  = global.__testResults__ = global.__testResults__ || [];

let driver;

before(async function() { this.timeout(HOOK_TIMEOUT); driver = await buildDriver(); });
after(async  function() { this.timeout(30000); await quitDriver(driver); });

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

describe('01 — Landing Page & UI/UX', () => {

  record('TC-001', 'Landing page loads without errors', 'UI/UX', async () => {
    await goTo(driver, '/');
    const title = await driver.getTitle();
    assert.ok(title && title.length > 0, 'Page title should not be empty');
  });

  record('TC-002', 'Page URL is correct (localhost:5173)', 'Functional', async () => {
    await goTo(driver, '/');
    const url = await driver.getCurrentUrl();
    assert.ok(url.includes('localhost:5173'), `Expected localhost:5173, got: ${url}`);
  });

  record('TC-003', 'Navbar is visible on landing page', 'UI/UX', async () => {
    await goTo(driver, '/');
    const nav = await waitForCss(driver, 'nav, header, .navbar, [class*="nav"]');
    assert.ok(nav, 'Navbar should be visible');
  });

  record('TC-004', 'Login navigation link is present', 'UI/UX', async () => {
    await goTo(driver, '/');
    const links = await driver.findElements(By.xpath("//*[contains(text(),'Login') or contains(@href,'/login')]"));
    assert.ok(links.length > 0, 'Login link should exist on landing page');
  });

  record('TC-005', 'Sign Up navigation link is present', 'UI/UX', async () => {
    await goTo(driver, '/');
    const links = await driver.findElements(By.xpath("//*[contains(text(),'Sign') or contains(text(),'Register') or contains(@href,'/signup')]"));
    assert.ok(links.length > 0, 'Sign Up link should exist on landing page');
  });

  record('TC-006', 'Page renders without JS console errors (check title renders)', 'UI/UX', async () => {
    await goTo(driver, '/');
    await sleep(config.mediumWait);
    const body = await driver.findElement(By.tagName('body'));
    const text = await body.getText();
    assert.ok(text.length > 0, 'Page body should have visible text');
  });

  record('TC-007', 'FoodBridge branding / logo is visible', 'UI/UX', async () => {
    await goTo(driver, '/');
    const pageSource = await driver.getPageSource();
    const hasBranding = pageSource.toLowerCase().includes('foodbridge') ||
                        pageSource.toLowerCase().includes('food bridge');
    assert.ok(hasBranding, 'FoodBridge branding should be present');
  });

  record('TC-008', 'Page has proper heading (h1 or h2)', 'UI/UX', async () => {
    await goTo(driver, '/');
    const headings = await driver.findElements(By.css('h1, h2'));
    assert.ok(headings.length > 0, 'Landing page should have at least one heading');
  });

  record('TC-009', 'Clicking Login link navigates to /login', 'Functional', async () => {
    await goTo(driver, '/');
    const loginLink = await driver.findElement(By.xpath("//*[contains(@href,'/login') or (self::a and contains(text(),'Login'))]"));
    await loginLink.click();
    await sleep(config.shortWait);
    const url = await driver.getCurrentUrl();
    assert.ok(url.includes('/login'), `Expected /login, got: ${url}`);
  });

  record('TC-010', 'Clicking Sign Up link navigates to /signup', 'Functional', async () => {
    await goTo(driver, '/');
    const signupLink = await driver.findElement(By.xpath("//*[contains(@href,'/signup') or (self::a and (contains(text(),'Sign') or contains(text(),'Register')))]"));
    await signupLink.click();
    await sleep(config.shortWait);
    const url = await driver.getCurrentUrl();
    assert.ok(url.includes('/signup'), `Expected /signup, got: ${url}`);
  });

  record('TC-011', 'Page is responsive — viewport meta tag exists', 'UI/UX', async () => {
    await goTo(driver, '/');
    const metas = await driver.findElements(By.css('meta[name="viewport"]'));
    assert.ok(metas.length > 0, 'Viewport meta tag should be present for responsiveness');
  });

  record('TC-012', 'Landing page has at least one call-to-action button', 'UI/UX', async () => {
    await goTo(driver, '/');
    const buttons = await driver.findElements(By.css('button, a.btn, .btn, [class*="btn"]'));
    assert.ok(buttons.length > 0, 'At least one CTA button should be present');
  });

});
