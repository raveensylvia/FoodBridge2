// ============================================================
// Selenium WebDriver Setup & Teardown Helper  (FIXED)
// ============================================================
'use strict';

const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome  = require('selenium-webdriver/chrome');
const path    = require('path');
const config  = require('../config/testConfig');

// ── Resolve chromedriver ─────────────────────────────────────
// On CI (GitHub Actions sets CI=true), return null so that
// selenium-webdriver's built-in Selenium Manager auto-downloads
// the exact matching ChromeDriver. Locally, use the npm package.
function getChromedriverPath() {
  // On GitHub Actions, let Selenium Manager handle everything
  if (process.env.CI === 'true' || process.env.CI === true) {
    // Check if chromedriver is on PATH (installed globally)
    if (process.env.CHROMEWEBDRIVER) {
      const fs = require('fs');
      const p  = process.env.CHROMEWEBDRIVER;
      if (fs.existsSync(p)) {
        console.log(`  [driver] CI: using CHROMEWEBDRIVER=${p}`);
        return p;
      }
    }
    console.log('  [driver] CI: deferring to Selenium Manager');
    return null; // Selenium Manager will download matching driver
  }
  // Local dev: use npm chromedriver package
  try {
    const driverPath = require('chromedriver').path;
    console.log(`  [driver] Local: using npm chromedriver at ${driverPath}`);
    return driverPath;
  } catch (_) {
    return null;
  }
}

/**
 * Build a fresh Chrome WebDriver instance.
 */
async function buildDriver() {
  const options = new chrome.Options();

  // Use system Chrome binary on CI (Linux)
  if (process.env.CHROME_PATH) {
    options.setChromeBinaryPath(process.env.CHROME_PATH);
    console.log(`  [driver] Using Chrome binary: ${process.env.CHROME_PATH}`);
  }

  if (config.headless) {
    options.addArguments('--headless=new');
    options.addArguments('--disable-gpu');
  }
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');
  options.addArguments('--disable-web-security');
  options.addArguments('--allow-running-insecure-content');
  options.addArguments('--ignore-certificate-errors');
  options.addArguments('--remote-debugging-port=9222');
  options.addArguments(`--window-size=${config.windowWidth},${config.windowHeight}`);
  options.addArguments('--disable-extensions');
  options.addArguments('--disable-popup-blocking');

  let builder = new Builder().forBrowser('chrome').setChromeOptions(options);

  // Set chromedriver service if we have an explicit path
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
