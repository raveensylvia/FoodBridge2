// ============================================================
// FoodBridge Selenium — Master Test Runner  (ALL 11 Categories)
// Runs all suites in ONE process and generates Excel report
// TC-001 → TC-188  |  178 total test cases
// ============================================================
'use strict';

const Mocha   = require('mocha');
const path    = require('path');
const fs      = require('fs');
const { generateReport } = require('./helpers/excelReporter');

// ── All test suite files (14 suites) ─────────────────────────
const TEST_FILES = [
  'tests/01_landing.test.js',       // UI/UX          TC-001–012
  'tests/02_signup.test.js',        // Functional      TC-013–027
  'tests/03_login.test.js',         // Functional      TC-028–041
  'tests/04_donor.test.js',         // Functional      TC-042–061
  'tests/05_ngo.test.js',           // Functional      TC-062–076
  'tests/06_volunteer.test.js',     // Functional      TC-077–091
  'tests/07_validation.test.js',    // Validation      TC-092–103
  'tests/08_security.test.js',      // Security        TC-104–113
  'tests/09_compatibility.test.js', // Compatibility   TC-114–123
  'tests/10_performance.test.js',   // Performance     TC-124–133
  'tests/11_api.test.js',           // API Testing     TC-134–153
  'tests/12_accessibility.test.js', // Accessibility   TC-154–163
  'tests/13_regression.test.js',    // Regression      TC-164–173
  'tests/14_e2e_fullflow.test.js',  // E2E Full Flow   TC-174–188
  'tests/15_vulnerability.test.js', // Vulnerability   TC-189–220
  'tests/16_vulnerability_ext.test.js', // Vulnerability   TC-221–285
];

// ── Category label map ───────────────────────────────────────
const FILE_CATEGORY = {
  '01_landing.test.js':        'UI/UX Testing',
  '02_signup.test.js':         'Functional Testing',
  '03_login.test.js':          'Functional Testing',
  '04_donor.test.js':          'Functional Testing',
  '05_ngo.test.js':            'Functional Testing',
  '06_volunteer.test.js':      'Functional Testing',
  '07_validation.test.js':     'Validation Testing',
  '08_security.test.js':       'Security Testing',
  '09_compatibility.test.js':  'Compatibility Testing',
  '10_performance.test.js':    'Performance Testing',
  '11_api.test.js':            'API Testing',
  '12_accessibility.test.js':  'Accessibility Testing',
  '13_regression.test.js':     'Regression Testing',
  '14_e2e_fullflow.test.js':   'End-to-End Testing',
  '15_vulnerability.test.js':  'Vulnerability Testing',
  '16_vulnerability_ext.test.js': 'Vulnerability Testing',
};

// ── Console colours ──────────────────────────────────────────
const C = {
  reset: '\x1b[0m', bright: '\x1b[1m',
  green: '\x1b[32m', red: '\x1b[31m',
  yellow: '\x1b[33m', cyan: '\x1b[36m',
  magenta: '\x1b[35m', white: '\x1b[37m',
  blue: '\x1b[34m'
};

function log(msg, color = C.white) { console.log(`${color}${msg}${C.reset}`); }
function banner(text) {
  const line = '═'.repeat(66);
  log(`\n${line}`, C.cyan);
  log(`  ${text}`, C.bright + C.cyan);
  log(`${line}\n`, C.cyan);
}

function detectType(title) {
  const t = (title || '').toLowerCase();
  if (t.includes('security') || t.includes('jwt') || t.includes('token') || t.includes('cors') || t.includes('tamper')) return 'Security';
  if (t.includes('valid') || t.includes('required') || t.includes('format') || t.includes('blank')) return 'Validation';
  if (t.includes('ui') || t.includes('ux') || t.includes('visible') || t.includes('display') || t.includes('render') || t.includes('layout') || t.includes('color') || t.includes('heading') || t.includes('branding')) return 'UI/UX';
  if (t.includes('compat') || t.includes('resolution') || t.includes('charset') || t.includes('viewport')) return 'Compatibility';
  if (t.includes('perform') || t.includes('speed') || t.includes('second') || t.includes('load time') || t.includes('fast')) return 'Performance';
  if (t.includes('api') || t.includes('/api/') || t.includes('json') || t.includes('endpoint')) return 'API';
  if (t.includes('access') || t.includes('aria') || t.includes('alt') || t.includes('contrast') || t.includes('keyboard')) return 'Accessibility';
  if (t.includes('regress') || t.includes('core:')) return 'Regression';
  if (t.includes('e2e') || t.includes('full flow') || t.includes('complete') || t.includes('lifecycle')) return 'E2E';
  return 'Functional';
}

async function main() {
  banner('🍱 FoodBridge — Complete Selenium E2E Test Runner (All 15 Categories)');
  log(`  📋 Total Suites  : ${TEST_FILES.length}`, C.white);
  log(`  🧪 Planned Tests : 285 (TC-001 to TC-285)`, C.white);
  log(`  🌐 Frontend URL  : http://localhost:5173`, C.white);
  log(`  🔌 Backend URL   : http://localhost:5000\n`, C.white);

  const globalStart = Date.now();
  const allResults  = [];
  let totalPassed   = 0;
  let totalFailed   = 0;
  let totalSkipped  = 0;

  // Single Mocha instance for all files
  const mocha = new Mocha({
    timeout:  180000, // 3-minute per-test timeout
    reporter: 'spec',
    exit:     true
  });

  TEST_FILES.forEach(f => {
    const fullPath = path.join(__dirname, f);
    if (fs.existsSync(fullPath)) {
      mocha.addFile(fullPath);
    } else {
      log(`  ⚠️  File not found: ${f}`, C.yellow);
    }
  });

  await new Promise((resolve) => {
    const runner = mocha.run((failures) => { resolve(failures); });

    runner.on('suite', (suite) => {
      if (suite.title) log(`\n  📂 ${suite.title}`, C.magenta);
    });

    runner.on('pass', (test) => {
      totalPassed++;
      const fileName = path.basename(test.file || '');
      const category = FILE_CATEGORY[fileName] || 'General';
      const idMatch  = (test.title || '').match(/\[TC-(\d+[A-Z]*|\S+?)\]/);
      const resObj = {
        id:       idMatch ? `TC-${idMatch[1]}` : `TC-${String(allResults.length + 1).padStart(3, '0')}`,
        category,
        name:     test.title.replace(/^\[TC-\S+\]\s*/, ''),
        type:     detectType(test.title),
        status:   'PASS',
        duration: test.duration || 0,
        error:    ''
      };
      allResults.push(resObj);
      if (process.env.STREAM_JSON === 'true') {
        console.log(`__TEST_RESULT__:${JSON.stringify(resObj)}`);
      }
      log(`  ✅ PASS  ${test.title}`, C.green);
    });

    runner.on('fail', (test, err) => {
      totalFailed++;
      const fileName = path.basename(test.file || '');
      const category = FILE_CATEGORY[fileName] || 'General';
      const idMatch  = (test.title || '').match(/\[TC-(\d+[A-Z]*|\S+?)\]/);
      const resObj = {
        id:       idMatch ? `TC-${idMatch[1]}` : `TC-${String(allResults.length + 1).padStart(3, '0')}`,
        category,
        name:     test.title.replace(/^\[TC-\S+\]\s*/, ''),
        type:     detectType(test.title),
        status:   'FAIL',
        duration: test.duration || 0,
        error:    err ? err.message.slice(0, 300) : 'Unknown error'
      };
      allResults.push(resObj);
      if (process.env.STREAM_JSON === 'true') {
        console.log(`__TEST_RESULT__:${JSON.stringify(resObj)}`);
      }
      log(`  ❌ FAIL  ${test.title}`, C.red);
      if (err) log(`       → ${err.message.slice(0, 120)}`, C.yellow);
    });

    runner.on('pending', (test) => {
      totalSkipped++;
      const fileName = path.basename(test.file || '');
      const category = FILE_CATEGORY[fileName] || 'General';
      const resObj = {
        id:       'TC-SKIP',
        category,
        name:     test.title,
        type:     'Functional',
        status:   'SKIP',
        duration: 0,
        error:    'Pending'
      };
      allResults.push(resObj);
      if (process.env.STREAM_JSON === 'true') {
        console.log(`__TEST_RESULT__:${JSON.stringify(resObj)}`);
      }
      log(`  ⏭ SKIP  ${test.title}`, C.yellow);
    });
  });

  const totalDuration = Date.now() - globalStart;
  const totalTests    = totalPassed + totalFailed + totalSkipped;
  const passRate      = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0;

  // ── Print summary ─────────────────────────────────────────
  banner('📊 Test Run Summary — All 11 Categories');
  log(`  Total Tests  : ${totalTests}`,           C.white);
  log(`  ✅ Passed    : ${totalPassed}`,           C.green);
  log(`  ❌ Failed    : ${totalFailed}`,           C.red);
  log(`  ⏭ Skipped   : ${totalSkipped}`,          C.yellow);
  log(`  ⏱ Duration  : ${(totalDuration / 1000).toFixed(2)}s`, C.cyan);
  log(`  Pass Rate    : ${passRate}%`,             C.magenta);

  // ── Category breakdown ────────────────────────────────────
  const byCategory = {};
  allResults.forEach(r => {
    if (!byCategory[r.category]) byCategory[r.category] = { total: 0, passed: 0, failed: 0 };
    byCategory[r.category].total++;
    if (r.status === 'PASS') byCategory[r.category].passed++;
    else if (r.status === 'FAIL') byCategory[r.category].failed++;
  });

  log('\n  📊 Results by Category:', C.cyan);
  log('  ─'.repeat(35), C.cyan);
  Object.entries(byCategory).forEach(([cat, data]) => {
    const pct   = data.total > 0 ? ((data.passed / data.total) * 100).toFixed(0) : 0;
    const color = data.failed > 0 ? C.red : C.green;
    log(`  ${cat.padEnd(26)} ${String(data.passed).padStart(3)}/${String(data.total).padStart(3)} (${pct}%)`, color);
  });

  // Save JSON results to workspace root
  try {
    fs.writeFileSync(path.join(__dirname, '..', '.web_results.json'), JSON.stringify(allResults, null, 2));
  } catch (err) {
    log(`  ⚠️  Failed to save JSON results: ${err.message}`, C.yellow);
  }

  // ── Generate Excel report ─────────────────────────────────
  log('\n  📄 Generating Excel report...', C.cyan);
  try {
    const reportPath = await generateReport(allResults, {
      total:    totalTests,
      passed:   totalPassed,
      failed:   totalFailed,
      skipped:  totalSkipped,
      duration: totalDuration,
      suite:    'FoodBridge Web E2E — All 16 Categories (TC-001 to TC-285)'
    });
    log(`  ✅ Excel report saved → ${reportPath}`, C.green);
  } catch (err) {
    log(`  ❌ Report generation error: ${err.message}`, C.red);
  }

  banner(totalFailed === 0 ? '🎉 ALL TESTS PASSED!' : `⚠️  ${totalFailed} TEST(S) FAILED`);
  process.exit(totalFailed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal runner error:', err);
  process.exit(1);
});
