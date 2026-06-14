// ============================================================
// Selenium WebDriver Setup & Teardown Helper  (FIXED)
// ============================================================
'use strict';

const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome  = require('selenium-webdriver/chrome');
const path    = require('path');
const config  = require('../config/testConfig');

// ── Resolve chromedriver ─────────────────────────────────────
// Priority:
//  1. CHROMEWEBDRIVER env var (set by browser-actions/setup-chrome on GitHub Actions)
//  2. npm chromedriver package (local dev)
//  3. null → let Selenium Manager auto-download
function getChromedriverPath() {
  // GitHub Actions: browser-actions/setup-chrome sets this
  if (process.env.CHROMEWEBDRIVER) {
    const path = require('path');
    const fs   = require('fs');
    const bin  = process.env.CHROMEWEBDRIVER;
    // The env var may be a directory or the binary itself
    const candidate = fs.existsSync(bin) && fs.statSync(bin).isDirectory()
      ? path.join(bin, 'chromedriver')
      : bin;
    if (fs.existsSync(candidate)) {
      console.log(`  [driver] Using chromedriver from CHROMEWEBDRIVER: ${candidate}`);
      return candidate;
    }
  }
  // Local development fallback – npm chromedriver package
  try {
    return require('chromedriver').path;
  } catch (_) {
    return null; // Fall back to Selenium Manager
  }
}

/**
 * Build a fresh Chrome WebDriver instance.
 */
async function buildDriver() {
  const options = new chrome.Options();

  if (config.headless) {
    options.addArguments('--headless=new');
    options.addArguments('--disable-gpu');
  }
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');
  options.addArguments('--disable-web-security');
  options.addArguments('--allow-running-insecure-content');
  options.addArguments('--ignore-certificate-errors');
  options.addArguments(`--window-size=${config.windowWidth},${config.windowHeight}`);
  options.addArguments('--disable-extensions');
  options.addArguments('--disable-popup-blocking');

  let builder = new Builder().forBrowser('chrome').setChromeOptions(options);

  // Use explicit chromedriver path if available
  const driverPath = getChromedriverPath();
  if (driverPath) {
    const service = new chrome.ServiceBuilder(driverPath);
    builder = builder.setChromeService(service);
  }

  const driver = await builder.build();

  await driver.manage().setTimeouts({
    implicit: config.implicitWait,
    pageLoad: config.pageLoadTimeout,
    script:   config.scriptTimeout
  });

  await driver.manage().window().setRect({
    width:  config.windowWidth,
    height: config.windowHeight
  });

  return driver;
}

/** Navigate to path relative to baseUrl */
async function goTo(driver, path = '/') {
  await driver.get(config.baseUrl + path);
}

/** Wait for element by CSS selector (visible) */
async function waitForCss(driver, selector, timeout = config.mediumWait) {
  const el = await driver.wait(until.elementLocated(By.css(selector)), timeout);
  await driver.wait(until.elementIsVisible(el), timeout);
  return el;
}

/** Clear + type into an input */
async function fillField(driver, selector, value) {
  const el = await waitForCss(driver, selector);
  await el.clear();
  await el.sendKeys(value);
}

/** Click element by CSS selector */
async function clickEl(driver, selector) {
  const el = await waitForCss(driver, selector);
  await driver.executeScript('arguments[0].scrollIntoView(true)', el);
  await el.click();
}

/** Get text of element */
async function getText(driver, selector) {
  const el = await waitForCss(driver, selector);
  return el.getText();
}

/** Sleep */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Register user via API (ignore 400 = already exists) */
async function registerUser(userData) {
  const axios = require('axios');
  try {
    await axios.post(`${config.apiUrl}/api/auth/signup`, userData);
  } catch (err) {
    if (!(err.response && err.response.status === 400)) {
      console.warn('  [setup] Register warning:', err.message);
    }
  }
}

/** Login via UI form */
async function loginViaUI(driver, email, password) {
  await goTo(driver, '/login');
  await fillField(driver, 'input[type="email"]', email);
  await fillField(driver, 'input[type="password"]', password);
  await clickEl(driver, 'button[type="submit"]');
  await sleep(config.longWait);
}

/** Logout via navbar or localStorage clear */
async function logout(driver) {
  try {
    const logoutBtn = await driver.findElement(
      By.xpath("//*[contains(text(),'Logout') or contains(text(),'logout')]")
    );
    await logoutBtn.click();
    await sleep(config.shortWait);
  } catch (_) {
    await driver.executeScript('localStorage.clear()');
    await goTo(driver, '/');
    await sleep(config.shortWait);
  }
}

/** Safely quit driver */
async function quitDriver(driver) {
  try { if (driver) await driver.quit(); } catch (_) {}
}

module.exports = {
  buildDriver, goTo, waitForCss, fillField, clickEl, getText,
  sleep, registerUser, loginViaUI, logout, quitDriver,
  By, until, Key
};
