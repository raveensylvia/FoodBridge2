// ============================================================
// Excel Report Generator — Selenium Tests
// ============================================================
'use strict';

const ExcelJS  = require('exceljs');
const path     = require('path');
const fs       = require('fs');
const config   = require('../config/testConfig');

// ── Colour palette ──────────────────────────────────────────
const COLORS = {
  PASS:       { argb: 'FF4CAF50' },   // Green
  FAIL:       { argb: 'FFF44336' },   // Red
  SKIP:       { argb: 'FFFFC107' },   // Amber
  HEADER_BG:  { argb: 'FF1A1A2E' },   // Dark navy
  HEADER_FG:  { argb: 'FFFFFFFF' },   // White
  ALT_ROW:    { argb: 'FFF5F5F5' },   // Light grey
  TITLE_BG:   { argb: 'FF16213E' },   // Darker navy
  ACCENT:     { argb: 'FFE94560' }    // Coral accent
};

const FONT_HEADER = { name: 'Calibri', size: 11, bold: true, color: COLORS.HEADER_FG };
const FONT_TITLE  = { name: 'Calibri', size: 16, bold: true, color: COLORS.HEADER_FG };
const FONT_BODY   = { name: 'Calibri', size: 10 };
const FONT_PASS   = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF2E7D32' } };
const FONT_FAIL   = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFC62828' } };

/**
 * Generate a full Excel test report.
 * @param {Array} results  - Array of test result objects
 * @param {Object} summary - { total, passed, failed, skipped, duration, suite }
 */
async function generateReport(results, summary) {
  if (!fs.existsSync(config.reportDir)) {
    fs.mkdirSync(config.reportDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename  = `${config.reportName}_${timestamp}.xlsx`;
  const filepath  = path.join(config.reportDir, filename);

  const workbook = new ExcelJS.Workbook();
  workbook.creator  = 'FoodBridge Selenium Suite';
  workbook.created  = new Date();
  workbook.modified = new Date();

  _buildSummarySheet(workbook, summary, results);
  _buildDetailsSheet(workbook, results);
  _buildCategorySheet(workbook, results);

  await workbook.xlsx.writeFile(filepath);
  console.log(`\n  📊 Excel report saved → ${filepath}\n`);
  return filepath;
}

// ── Summary Sheet ───────────────────────────────────────────
function _buildSummarySheet(workbook, summary, results) {
  const ws = workbook.addWorksheet('📋 Summary', {
    properties: { tabColor: { argb: 'FF1A1A2E' } }
  });

  ws.columns = [
    { width: 30 }, { width: 25 }, { width: 20 }, { width: 20 }
  ];

  // Title
  ws.mergeCells('A1:D1');
  const titleCell = ws.getCell('A1');
  titleCell.value = '🍱 FoodBridge Web Application — Test Report';
  titleCell.font = FONT_TITLE;
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: COLORS.TITLE_BG };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 36;

  // Metadata
  const meta = [
    ['Generated At',   new Date().toLocaleString()],
    ['Suite Name',     summary.suite || 'FoodBridge Web E2E'],
    ['Browser',        config.browser.toUpperCase()],
    ['Base URL',       config.baseUrl],
    ['Total Duration', `${(summary.duration / 1000).toFixed(2)}s`]
  ];

  meta.forEach(([k, v], i) => {
    const row = ws.getRow(i + 2);
    row.getCell(1).value = k;
    row.getCell(2).value = v;
    row.getCell(1).font  = { bold: true, name: 'Calibri' };
    row.getCell(2).font  = FONT_BODY;
    row.height = 18;
  });

  ws.addRow([]);

  // Stats cards
  const statsRow = ws.getRow(8);
  const stats = [
    { label: 'Total Tests',   value: summary.total,   color: 'FF1A1A2E' },
    { label: '✅ Passed',     value: summary.passed,  color: 'FF4CAF50' },
    { label: '❌ Failed',     value: summary.failed,  color: 'FFF44336' },
    { label: '⏭ Skipped',    value: summary.skipped, color: 'FFFFC107' }
  ];
  stats.forEach((s, i) => {
    const col = i + 1;
    ws.mergeCells(8, col, 9, col);
    const cell = ws.getCell(8, col);
    cell.value     = `${s.label}\n${s.value}`;
    cell.font      = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: s.color } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    ws.getRow(8).height = 40;
  });

  ws.addRow([]);
  ws.addRow([]);

  // Pass rate bar
  const passRate = summary.total > 0
    ? ((summary.passed / summary.total) * 100).toFixed(1)
    : 0;
  const rateRow = ws.addRow([`Pass Rate: ${passRate}%`]);
  rateRow.getCell(1).font = { bold: true, size: 12, name: 'Calibri', color: { argb: 'FF2E7D32' } };

  ws.addRow([]);

  // Category breakdown header
  const catHeader = ws.addRow(['Category', 'Total', 'Passed', 'Failed', 'Pass %']);
  catHeader.eachCell(cell => {
    cell.font = FONT_HEADER;
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: COLORS.HEADER_BG };
    cell.alignment = { horizontal: 'center' };
  });
  ws.getRow(catHeader.number).height = 22;

  // Category breakdown data
  const byCategory = {};
  results.forEach(r => {
    if (!byCategory[r.category]) byCategory[r.category] = { total: 0, passed: 0, failed: 0 };
    byCategory[r.category].total++;
    if (r.status === 'PASS') byCategory[r.category].passed++;
    else if (r.status === 'FAIL') byCategory[r.category].failed++;
  });

  Object.entries(byCategory).forEach(([cat, data], i) => {
    const pct = data.total > 0 ? ((data.passed / data.total) * 100).toFixed(0) : 0;
    const row = ws.addRow([cat, data.total, data.passed, data.failed, `${pct}%`]);
    if (i % 2 === 0) {
      row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: COLORS.ALT_ROW };
      });
    }
    row.getCell(3).font = { color: { argb: 'FF2E7D32' }, bold: true, name: 'Calibri' };
    row.getCell(4).font = { color: { argb: 'FFC62828' }, bold: true, name: 'Calibri' };
    row.eachCell(cell => { cell.alignment = { horizontal: 'center' }; });
  });
}

// ── Test Details Sheet ──────────────────────────────────────
function _buildDetailsSheet(workbook, results) {
  const ws = workbook.addWorksheet('📝 Test Details', {
    properties: { tabColor: { argb: 'FF4CAF50' } }
  });

  ws.columns = [
    { header: 'Test ID',      key: 'id',       width: 10 },
    { header: 'Category',     key: 'category', width: 25 },
    { header: 'Test Name',    key: 'name',     width: 50 },
    { header: 'Type',         key: 'type',     width: 18 },
    { header: 'Status',       key: 'status',   width: 12 },
    { header: 'Duration (s)', key: 'duration', width: 15 },
    { header: 'Error / Notes', key: 'error',  width: 55 }
  ];

  // Style header row
  const headerRow = ws.getRow(1);
  headerRow.eachCell(cell => {
    cell.font      = FONT_HEADER;
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: COLORS.HEADER_BG };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border    = {
      bottom: { style: 'medium', color: COLORS.ACCENT }
    };
  });
  headerRow.height = 24;

  // Data rows
  results.forEach((r, i) => {
    const row = ws.addRow({
      id:       r.id,
      category: r.category,
      name:     r.name,
      type:     r.type || 'Functional',
      status:   r.status,
      duration: r.duration ? (r.duration / 1000).toFixed(2) : '-',
      error:    r.error || ''
    });

    // Alternate row shading
    if (i % 2 === 0) {
      row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: COLORS.ALT_ROW };
      });
    }

    // Status cell colouring
    const statusCell = row.getCell('status');
    if (r.status === 'PASS') {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBBDEFB' } };
      statusCell.font = FONT_PASS;
    } else if (r.status === 'FAIL') {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFCDD2' } };
      statusCell.font = FONT_FAIL;
    } else {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF9C4' } };
      statusCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFE65100' } };
    }

    statusCell.alignment = { horizontal: 'center' };
    row.getCell('error').alignment = { wrapText: true };
    row.height = 20;
  });

  // Auto filter
  ws.autoFilter = { from: 'A1', to: 'G1' };
  ws.views = [{ state: 'frozen', ySplit: 1 }];
}

// ── Category Sheet ──────────────────────────────────────────
function _buildCategorySheet(workbook, results) {
  const ws = workbook.addWorksheet('📊 By Category', {
    properties: { tabColor: { argb: 'FFE94560' } }
  });

  ws.columns = [
    { header: 'Category',  key: 'category', width: 30 },
    { header: 'Test Type', key: 'type',     width: 20 },
    { header: 'Test Name', key: 'name',     width: 50 },
    { header: 'Status',    key: 'status',   width: 12 }
  ];

  const headerRow = ws.getRow(1);
  headerRow.eachCell(cell => {
    cell.font  = FONT_HEADER;
    cell.fill  = { type: 'pattern', pattern: 'solid', fgColor: COLORS.HEADER_BG };
    cell.alignment = { horizontal: 'center' };
  });
  headerRow.height = 22;

  // Sort by category
  const sorted = [...results].sort((a, b) =>
    a.category.localeCompare(b.category)
  );

  sorted.forEach((r, i) => {
    const row = ws.addRow({
      category: r.category,
      type:     r.type || 'Functional',
      name:     r.name,
      status:   r.status
    });

    if (i % 2 === 0) {
      row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: COLORS.ALT_ROW };
      });
    }

    const sc = row.getCell('status');
    if (r.status === 'PASS') {
      sc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBBDEFB' } };
      sc.font = FONT_PASS;
    } else if (r.status === 'FAIL') {
      sc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFCDD2' } };
      sc.font = FONT_FAIL;
    }
    sc.alignment = { horizontal: 'center' };
  });

  ws.autoFilter = { from: 'A1', to: 'D1' };
  ws.views = [{ state: 'frozen', ySplit: 1 }];
}

module.exports = { generateReport };
