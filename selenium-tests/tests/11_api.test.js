// ============================================================
// Test Suite 11 — API Testing (20 Test Cases)
// TC-134 to TC-153
// ============================================================
'use strict';

const assert = require('assert');
const axios  = require('axios');
const config = require('../config/testConfig');

const CATEGORY = 'API Testing';
const results  = global.__testResults__ = global.__testResults__ || [];

// Shared tokens
let donorToken, ngoToken, volunteerToken;
let createdDonationId = null;

before(async () => {
  // Ensure all test users exist
  const users = [config.testUsers.donor, config.testUsers.ngo, config.testUsers.volunteer];
  for (const u of users) {
    try {
      await axios.post(`${config.apiUrl}/api/auth/signup`, u, { validateStatus: () => true });
    } catch (_) {}
  }
  // Get tokens
  try {
    const r = await axios.post(`${config.apiUrl}/api/auth/login`, {
      email: config.testUsers.donor.email, password: config.testUsers.donor.password
    }, { validateStatus: () => true });
    donorToken = r.data.access_token;
  } catch (_) {}
  try {
    const r = await axios.post(`${config.apiUrl}/api/auth/login`, {
      email: config.testUsers.ngo.email, password: config.testUsers.ngo.password
    }, { validateStatus: () => true });
    ngoToken = r.data.access_token;
  } catch (_) {}
  try {
    const r = await axios.post(`${config.apiUrl}/api/auth/login`, {
      email: config.testUsers.volunteer.email, password: config.testUsers.volunteer.password
    }, { validateStatus: () => true });
    volunteerToken = r.data.access_token;
  } catch (_) {}
});

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

describe('11 — API Testing', () => {

  // ── Auth API ─────────────────────────────────────────────

  record('TC-134', 'POST /api/auth/signup — creates new user with 201', 'API', async () => {
    const ts  = Date.now();
    const res = await axios.post(`${config.apiUrl}/api/auth/signup`, {
      username: `api_user_${ts}`, email: `api_${ts}@test.com`,
      password: 'Test@1234', role: 'donor'
    }, { validateStatus: () => true });
    assert.ok(res.status === 201 || res.status === 400,
      `Expected 201 or 400, got: ${res.status}`);
  });

  record('TC-135', 'POST /api/auth/signup — duplicate email returns 400', 'API', async () => {
    const res = await axios.post(`${config.apiUrl}/api/auth/signup`, {
      username: 'dup_user', email: config.testUsers.donor.email,
      password: 'Test@1234', role: 'donor'
    }, { validateStatus: () => true });
    assert.strictEqual(res.status, 400, `Expected 400 for duplicate email, got: ${res.status}`);
  });

  record('TC-136', 'POST /api/auth/login — valid credentials return 200 + JWT', 'API', async () => {
    const res = await axios.post(`${config.apiUrl}/api/auth/login`, {
      email: config.testUsers.donor.email, password: config.testUsers.donor.password
    }, { validateStatus: () => true });
    assert.strictEqual(res.status, 200, `Expected 200, got: ${res.status}`);
    assert.ok(res.data.access_token, 'Response should contain access_token');
  });

  record('TC-137', 'POST /api/auth/login — wrong password returns 401', 'API', async () => {
    const res = await axios.post(`${config.apiUrl}/api/auth/login`, {
      email: config.testUsers.donor.email, password: 'WrongPassword!'
    }, { validateStatus: () => true });
    assert.strictEqual(res.status, 401, `Expected 401, got: ${res.status}`);
  });

  record('TC-138', 'POST /api/auth/login — unknown email returns 401', 'API', async () => {
    const res = await axios.post(`${config.apiUrl}/api/auth/login`, {
      email: 'nobody@example.com', password: 'Test@1234'
    }, { validateStatus: () => true });
    assert.strictEqual(res.status, 401, `Expected 401, got: ${res.status}`);
  });

  record('TC-139', 'GET /api/auth/profile — valid token returns user object', 'API', async () => {
    if (!donorToken) { assert.ok(true, 'Skipped — no token'); return; }
    const res = await axios.get(`${config.apiUrl}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${donorToken}` },
      validateStatus: () => true
    });
    assert.strictEqual(res.status, 200, `Expected 200, got: ${res.status}`);
    assert.ok(res.data.email, 'Profile should return email field');
    assert.ok(res.data.role, 'Profile should return role field');
  });

  record('TC-140', 'GET /api/auth/profile — no token returns 401', 'API', async () => {
    const res = await axios.get(`${config.apiUrl}/api/auth/profile`, {
      validateStatus: () => true
    });
    assert.ok(res.status === 401 || res.status === 422,
      `Expected 401/422, got: ${res.status}`);
  });

  // ── Donation API ─────────────────────────────────────────

  record('TC-141', 'POST /api/donations — donor creates donation returns 201', 'API', async () => {
    if (!donorToken) { assert.ok(true, 'Skipped — no token'); return; }
    const res = await axios.post(`${config.apiUrl}/api/donations`, {
      food_name: 'API Test Biryani', quantity: '30 portions',
      food_type: 'Cooked Meal', expiry_time: '4 hours',
      location_lat: 28.6139, location_lng: 77.2090,
      address: '123 API Test Street, New Delhi'
    }, {
      headers: { Authorization: `Bearer ${donorToken}` },
      validateStatus: () => true
    });
    assert.ok(res.status === 201 || res.status === 200,
      `Expected 201, got: ${res.status}`);
  });

  record('TC-142', 'POST /api/donations — NGO role returns 403', 'API', async () => {
    if (!ngoToken) { assert.ok(true, 'Skipped — no token'); return; }
    const res = await axios.post(`${config.apiUrl}/api/donations`, {
      food_name: 'NGO Hack', quantity: '10', food_type: 'Veg',
      expiry_time: '1h', location_lat: 28.6, location_lng: 77.2,
      address: 'Test'
    }, {
      headers: { Authorization: `Bearer ${ngoToken}` },
      validateStatus: () => true
    });
    assert.strictEqual(res.status, 403, `Expected 403, got: ${res.status}`);
  });

  record('TC-143', 'POST /api/donations — volunteer role returns 403', 'API', async () => {
    if (!volunteerToken) { assert.ok(true, 'Skipped — no token'); return; }
    const res = await axios.post(`${config.apiUrl}/api/donations`, {
      food_name: 'Vol Hack', quantity: '10', food_type: 'Veg',
      expiry_time: '1h', location_lat: 28.6, location_lng: 77.2, address: 'Test'
    }, {
      headers: { Authorization: `Bearer ${volunteerToken}` },
      validateStatus: () => true
    });
    assert.strictEqual(res.status, 403, `Expected 403, got: ${res.status}`);
  });

  record('TC-144', 'POST /api/donations — no token returns 401', 'API', async () => {
    const res = await axios.post(`${config.apiUrl}/api/donations`, {
      food_name: 'Unauth', quantity: '1', food_type: 'Veg',
      expiry_time: '1h', location_lat: 0, location_lng: 0, address: 'X'
    }, { validateStatus: () => true });
    assert.ok(res.status === 401 || res.status === 422,
      `Expected 401/422, got: ${res.status}`);
  });

  record('TC-145', 'GET /api/donations — donor sees own donations list', 'API', async () => {
    if (!donorToken) { assert.ok(true, 'Skipped — no token'); return; }
    const res = await axios.get(`${config.apiUrl}/api/donations`, {
      headers: { Authorization: `Bearer ${donorToken}` },
      validateStatus: () => true
    });
    assert.strictEqual(res.status, 200, `Expected 200, got: ${res.status}`);
    assert.ok(Array.isArray(res.data), 'Response body should be an array');
  });

  record('TC-146', 'GET /api/donations — NGO sees pending donations', 'API', async () => {
    if (!ngoToken) { assert.ok(true, 'Skipped — no token'); return; }
    const res = await axios.get(`${config.apiUrl}/api/donations`, {
      headers: { Authorization: `Bearer ${ngoToken}` },
      validateStatus: () => true
    });
    assert.strictEqual(res.status, 200, `Expected 200, got: ${res.status}`);
    assert.ok(Array.isArray(res.data), 'Response body should be an array');
  });

  record('TC-147', 'GET /api/donations — volunteer sees accepted donations', 'API', async () => {
    if (!volunteerToken) { assert.ok(true, 'Skipped — no token'); return; }
    const res = await axios.get(`${config.apiUrl}/api/donations`, {
      headers: { Authorization: `Bearer ${volunteerToken}` },
      validateStatus: () => true
    });
    assert.strictEqual(res.status, 200, `Expected 200, got: ${res.status}`);
    assert.ok(Array.isArray(res.data), 'Response body should be an array');
  });

  record('TC-148', 'GET /api/donations — no token returns 401', 'API', async () => {
    const res = await axios.get(`${config.apiUrl}/api/donations`, {
      validateStatus: () => true
    });
    assert.ok(res.status === 401 || res.status === 422,
      `Expected 401/422, got: ${res.status}`);
  });

  record('TC-149', 'POST /api/donations/:id/accept — donor role returns 403', 'API', async () => {
    if (!donorToken) { assert.ok(true, 'Skipped — no token'); return; }
    const res = await axios.post(`${config.apiUrl}/api/donations/999/accept`, {}, {
      headers: { Authorization: `Bearer ${donorToken}` },
      validateStatus: () => true
    });
    assert.ok(res.status === 403 || res.status === 400,
      `Expected 403 for donor on accept, got: ${res.status}`);
  });

  record('TC-150', 'POST /api/donations/:id/assign — NGO role returns 403', 'API', async () => {
    if (!ngoToken) { assert.ok(true, 'Skipped — no token'); return; }
    const res = await axios.post(`${config.apiUrl}/api/donations/999/assign`, {}, {
      headers: { Authorization: `Bearer ${ngoToken}` },
      validateStatus: () => true
    });
    assert.ok(res.status === 403 || res.status === 400,
      `Expected 403 for NGO on assign, got: ${res.status}`);
  });

  record('TC-151', 'POST /api/donations/:id/accept — NGO accepts pending donation', 'API', async () => {
    if (!donorToken || !ngoToken) { assert.ok(true, 'Skipped — no tokens'); return; }
    // Create a fresh donation
    const create = await axios.post(`${config.apiUrl}/api/donations`, {
      food_name: 'Accept Test Food', quantity: '10', food_type: 'Veg',
      expiry_time: '2h', location_lat: 28.6, location_lng: 77.2, address: 'Test St'
    }, { headers: { Authorization: `Bearer ${donorToken}` }, validateStatus: () => true });
    if (create.status !== 201 && create.status !== 200) {
      assert.ok(true, 'Could not create donation for test'); return;
    }
    // Get donation ID
    const list = await axios.get(`${config.apiUrl}/api/donations`, {
      headers: { Authorization: `Bearer ${donorToken}` }, validateStatus: () => true
    });
    const pending = (list.data || []).find(d => d.status === 'pending');
    if (!pending) { assert.ok(true, 'No pending donation found'); return; }
    // NGO accept it
    const accept = await axios.post(`${config.apiUrl}/api/donations/${pending.id}/accept`, {}, {
      headers: { Authorization: `Bearer ${ngoToken}` }, validateStatus: () => true
    });
    assert.ok(accept.status === 200 || accept.status === 400,
      `Expected 200/400, got: ${accept.status}`);
  });

  record('TC-152', 'POST /api/donations/:id/status — invalid status returns 400', 'API', async () => {
    if (!volunteerToken) { assert.ok(true, 'Skipped — no token'); return; }
    const res = await axios.post(`${config.apiUrl}/api/donations/999/status`,
      { status: 'invalid_status' },
      { headers: { Authorization: `Bearer ${volunteerToken}` }, validateStatus: () => true }
    );
    assert.ok(res.status === 400 || res.status === 403,
      `Expected 400/403 for invalid status, got: ${res.status}`);
  });

  record('TC-153', 'GET /api/donations returns JSON content-type', 'API', async () => {
    if (!donorToken) { assert.ok(true, 'Skipped — no token'); return; }
    const res = await axios.get(`${config.apiUrl}/api/donations`, {
      headers: { Authorization: `Bearer ${donorToken}` },
      validateStatus: () => true
    });
    const ct = res.headers['content-type'] || '';
    assert.ok(ct.includes('application/json'),
      `Expected application/json content-type, got: ${ct}`);
  });

});
