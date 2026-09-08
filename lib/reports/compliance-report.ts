/**
 * Отчет за съответствие — Регулаторна рамка
 * Bulgarian & EU Environmental Compliance Report
 * Covers: ЗООС, Наредба 7/1999, EU ETS readiness, CSRD readiness, SBTi
 */

import { PDFDocument, rgb, PDFPage, PDFFont } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import {
  type ComplianceStatus,
  COMPLIANCE_RULE_VERSION,
  summarizeCompliance,
  readinessLabel,
  readinessBarHint,
} from './compliance-scoring';
import {
  evaluateComplianceRules,
  toComplianceTableRows,
  buildComplianceActionPlan,
  ESRS_STANDARD_METADATA,
} from './compliance-rules';
import { PDF_PLATFORM_NAME, pdfSafeText } from './pdf-text';
import { drawPanel, drawAccentBar, fillRounded, drawRect, R } from './pdf-shapes';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface ComplianceReportData {
  company: {
    company_name: string;
    registration_number?: string;
    industry_sector?: string;
    employee_count?: number;
    annual_turnover_eur?: number | null;
    address?: string;
    ets_has_installation?: boolean | null;
    ets_thermal_input_mw?: number | null;
    ets_activity_annex_i?: boolean | null;
  };
  reportingYear: number;
  scope1Total: number;
  scope2Total: number;
  scope3Total: number; // in tCO2e
  scope3Available: boolean;
  emissionsByCategory: Record<string, number>;
  targets: Array<{ name: string; target_value: number; target_year: number; target_type: string; baseline_year: number }>;
  generatedBy?: string;
  evidenceCoverage?: {
    scope12Entries: number;
    scope12WithEvidence: number;
    coveragePercent: number;
  };
}

// ─────────────────────────────────────────────
// Colors — red/green/regulatory palette
// ─────────────────────────────────────────────

const C = {
  darkRed:    rgb(0.600, 0.059, 0.059),
  green:      rgb(0.059, 0.390, 0.196),
  darkGreen:  rgb(0.039, 0.220, 0.118),
  lightGreen: rgb(0.878, 0.965, 0.902),
  amber:      rgb(0.820, 0.510, 0.000),
  lightAmber: rgb(0.996, 0.961, 0.878),
  red:        rgb(0.780, 0.100, 0.100),
  lightRed:   rgb(0.992, 0.878, 0.878),
  blue:       rgb(0.063, 0.137, 0.294),
  lightBlue:  rgb(0.867, 0.898, 0.961),
  gray:       rgb(0.420, 0.420, 0.420),
  lightGray:  rgb(0.933, 0.933, 0.933),
  darkGray:   rgb(0.220, 0.220, 0.220),
  nearWhite:  rgb(0.976, 0.980, 0.984),
  white:      rgb(1, 1, 1),
  black:      rgb(0, 0, 0),
  row1:       rgb(0.972, 0.976, 0.980),
  row2:       rgb(1, 1, 1),
  divider:    rgb(0.820, 0.831, 0.855),
};

type StatusType = ComplianceStatus;

const STATUS_COLOR: Record<StatusType, ReturnType<typeof rgb>> = {
  compliant: C.green,
  partial:   C.amber,
  gap:       C.red,
  na:        C.gray,
  requires_review: C.amber,
};
const STATUS_BG: Record<StatusType, ReturnType<typeof rgb>> = {
  compliant: C.lightGreen,
  partial:   C.lightAmber,
  gap:       C.lightRed,
  na:        C.lightGray,
  requires_review: C.lightAmber,
};
const STATUS_LABEL: Record<StatusType, string> = {
  compliant: 'ИЗПЪЛНЕНО',
  partial:   'ЧАСТИЧНО',
  gap:       'ПРОПУСК',
  na:        'НЕ ПРИЛАГА',
  requires_review: 'ПРЕГЛЕД',
};

// ─────────────────────────────────────────────
// Drawing helpers
// ─────────────────────────────────────────────

function drawText(page: PDFPage, text: string, x: number, y: number, size: number, font: PDFFont, color = C.black, maxWidth?: number) {
  const t = pdfSafeText((text ?? '').toString());
  if (!t) return;
  if (maxWidth) {
    let s = t;
    while (s.length > 3 && font.widthOfTextAtSize(s, size) > maxWidth) s = s.slice(0, -1);
    if (s !== t) s = s.slice(0, -2) + '..';
    page.drawText(s, { x, y, size, font, color });
  } else {
    page.drawText(t, { x, y, size, font, color });
  }
}

function drawLine(page: PDFPage, x1: number, y: number, x2: number, color = C.divider, thick = 0.5) {
  page.drawLine({ start: { x: x1, y }, end: { x: x2, y }, thickness: thick, color });
}

function wrapText(font: PDFFont, text: string, size: number, maxWidth: number): string[] {
  if (!text) return [''];
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const word of words) {
    const test = cur ? `${cur} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) <= maxWidth) {
      cur = test;
    } else {
      if (cur) lines.push(cur);
      cur = word;
    }
  }
  if (cur) lines.push(cur);
  return lines.length > 0 ? lines : [''];
}

// ─────────────────────────────────────────────
// Page context
// ─────────────────────────────────────────────

interface Ctx {
  pdfDoc: PDFDocument;
  font: PDFFont;
  page: PDFPage;
  y: number;
  pageNum: number;
  W: number; H: number; M: number;
}

function newPage(ctx: Ctx): Ctx {
  const page = ctx.pdfDoc.addPage([ctx.W, ctx.H]);
  ctx.pageNum += 1;
  drawFooter(page, ctx.font, ctx.W, ctx.pageNum);
  return { ...ctx, page, y: ctx.H - 56 };
}

function need(ctx: Ctx, h: number): Ctx {
  return ctx.y - h < 65 ? newPage(ctx) : ctx;
}

function drawFooter(page: PDFPage, font: PDFFont, W: number, n: number) {
  page.drawLine({ start: { x: 40, y: 44 }, end: { x: W - 40, y: 44 }, thickness: 0.5, color: C.divider });
  drawText(page, 'Отчет за съответствие — Регулаторна рамка', 40, 30, 7.5, font, C.gray);
  drawText(page, `Страница ${n}`, W - 70, 30, 7.5, font, C.gray);
}

// ─────────────────────────────────────────────
// Layout helpers
// ─────────────────────────────────────────────

function titleBand(ctx: Ctx, label: string, color: ReturnType<typeof rgb>): Ctx {
  const bTop = ctx.y + 10;
  drawRect(ctx.page, 0, bTop, ctx.W, 36, color);
  ctx.page.drawRectangle({ x: 0, y: bTop - 36, width: 6, height: 36, color: C.white, opacity: 0.25 });
  drawText(ctx.page, label, 46, bTop - 23, 12, ctx.font, C.white);
  return { ...ctx, y: ctx.y - 36 };
}

function sectionHead(ctx: Ctx, label: string, subtitle?: string): Ctx {
  const subLines = subtitle ? wrapText(ctx.font, subtitle, 8, ctx.W - ctx.M * 2 - 14) : [];
  const bH = 28 + subLines.length * 12;
  ctx = need(ctx, bH + 12);
  const { page, y, M, W } = ctx;
  drawPanel(page, M, y, W - M * 2, bH, C.lightGreen, C.green, 0.5, R.md);
  drawAccentBar(page, M, y, bH, C.darkGreen);
  drawText(page, label, M + 10, y - 15, 10.5, ctx.font, C.darkGreen, W - M * 2 - 14);
  subLines.forEach((l, i) => drawText(page, l, M + 10, y - 28 - i * 12, 8, ctx.font, C.gray));
  return { ...ctx, y: y - bH - 10 };
}

function kpiRow(ctx: Ctx, items: Array<{ label: string; value: string; unit?: string; color?: ReturnType<typeof rgb>; bg?: ReturnType<typeof rgb> }>): Ctx {
  const cH = 54;
  ctx = need(ctx, cH + 8);
  const { page, y, M, W, font } = ctx;
  const gap = 6;
  const n = items.length;
  const cW = (W - M * 2 - gap * (n - 1)) / n;
  items.forEach((item, i) => {
    const cx = M + i * (cW + gap);
    const col = item.color || C.darkGray;
    drawPanel(page, cx, y, cW, cH, item.bg || C.nearWhite, col, 0.5, R.md, 3);
    drawText(page, item.label, cx + 9, y - 11, 7, font, C.gray, cW - 12);
    drawText(page, item.value, cx + 9, y - 30, 15, font, col, cW - 12);
    if (item.unit) drawText(page, item.unit, cx + 9, y - 43, 7, font, C.gray, cW - 12);
  });
  return { ...ctx, y: y - cH - 10 };
}

function para(ctx: Ctx, text: string, indent = 0): Ctx {
  const lH = 13;
  const lines = wrapText(ctx.font, text, 8.5, ctx.W - ctx.M * 2 - indent);
  for (const line of lines) {
    ctx = need(ctx, lH + 3);
    drawText(ctx.page, line, ctx.M + indent, ctx.y - 11, 8.5, ctx.font, C.darkGray);
    ctx = { ...ctx, y: ctx.y - lH };
  }
  return { ...ctx, y: ctx.y - 2 };
}

function bullet(ctx: Ctx, text: string, col = C.green): Ctx {
  const lH = 13;
  const lines = wrapText(ctx.font, text, 8, ctx.W - ctx.M * 2 - 20);
  lines.forEach((line, i) => {
    ctx = need(ctx, lH + 2);
    if (i === 0) drawText(ctx.page, '\u2022', ctx.M + 6, ctx.y - 11, 9, ctx.font, col);
    drawText(ctx.page, line, ctx.M + 18, ctx.y - 11, 8, ctx.font, C.darkGray);
    ctx = { ...ctx, y: ctx.y - lH };
  });
  return ctx;
}

function spacer(ctx: Ctx, px = 10): Ctx { return { ...ctx, y: ctx.y - px }; }

// ─────────────────────────────────────────────
// Compliance status badge
// ─────────────────────────────────────────────

function statusBadge(page: PDFPage, status: StatusType, x: number, midY: number, font: PDFFont) {
  const bW = status === 'requires_review' ? 82 : 72;
  const bH = 16;
  drawPanel(page, x, midY + bH / 2, bW, bH, STATUS_BG[status], STATUS_COLOR[status], 0.5, R.sm);
  const label = STATUS_LABEL[status];
  const lW = font.widthOfTextAtSize(label, 7);
  // Text baseline slightly below midY so cap-height centers optically inside box
  drawText(page, label, x + (bW - lW) / 2, midY - 2.5, 7, font, STATUS_COLOR[status]);
}

// ─────────────────────────────────────────────
// Compliance table
// ─────────────────────────────────────────────

interface ComplianceRow {
  regulation: string;
  requirement: string;
  status: StatusType;
  note: string;
}

function complianceTable(ctx: Ctx, rows: ComplianceRow[]): Ctx {
  const { M, W } = ctx;
  const totalW = W - M * 2;
  const cols = [totalW * 0.28, totalW * 0.30, totalW * 0.16, totalW * 0.26];
  const headers = ['Регулация', 'Изискване', 'Статус', 'Бележка'];
  const rH = 26;

  ctx = need(ctx, rH * 2);
  drawPanel(ctx.page, M, ctx.y, totalW, rH, C.blue, C.blue, 0, R.sm);
  let hx = M;
  headers.forEach((h, i) => {
    drawText(ctx.page, h, hx + 5, ctx.y - 17, 8, ctx.font, C.white);
    hx += cols[i];
  });
  ctx.y -= rH;

  rows.forEach((row, i) => {
    // Calculate row height based on wrapped content
    const regLines = wrapText(ctx.font, row.regulation, 7.5, cols[0] - 10);
    const reqLines = wrapText(ctx.font, row.requirement, 7.5, cols[1] - 10);
    const noteLines = wrapText(ctx.font, row.note, 7, cols[3] - 10);
    const maxLines = Math.max(regLines.length, reqLines.length, noteLines.length, 1);
    const dynH = Math.max(rH, maxLines * 12 + 10);

    ctx = need(ctx, dynH);
    drawRect(ctx.page, M, ctx.y, totalW, dynH, i % 2 === 0 ? C.row1 : C.row2);

    // left-accent colored bar per status
    ctx.page.drawRectangle({ x: M, y: ctx.y - dynH, width: 3, height: dynH, color: STATUS_COLOR[row.status] });

    let rx = M;
    // Regulation col
    regLines.forEach((l, li) => drawText(ctx.page, l, rx + 6, ctx.y - 10 - li * 12, 7.5, ctx.font, C.darkGray, cols[0] - 10));
    rx += cols[0];
    // Requirement col
    reqLines.forEach((l, li) => drawText(ctx.page, l, rx + 5, ctx.y - 10 - li * 12, 7.5, ctx.font, C.darkGray, cols[1] - 10));
    rx += cols[1];
    // Status badge
    statusBadge(ctx.page, row.status, rx + 5, ctx.y - dynH / 2, ctx.font);
    rx += cols[2];
    // Note col
    noteLines.forEach((l, li) => drawText(ctx.page, l, rx + 5, ctx.y - 10 - li * 12, 7, ctx.font, C.gray, cols[3] - 10));

    ctx.y -= dynH;
  });

  return ctx;
}

// ─────────────────────────────────────────────
// Action plan card
// ─────────────────────────────────────────────

interface ActionItem {
  priority: number;
  action: string;
  regulation: string;
  timeline: string;
  impact: 'висок' | 'среден' | 'нисък';
}

const IMPACT_COL: Record<string, ReturnType<typeof rgb>> = {
  'висок': C.red,
  'среден': C.amber,
  'нисък': C.green,
};

function actionTable(ctx: Ctx, items: ActionItem[]): Ctx {
  const { M, W } = ctx;
  const totalW = W - M * 2;
  const cols = [totalW * 0.06, totalW * 0.40, totalW * 0.22, totalW * 0.18, totalW * 0.14];
  const headers = ['#', 'Действие', 'Регулация', 'Срок', 'Приоритет'];
  const rH = 22;

  ctx = need(ctx, rH * 2);
  drawPanel(ctx.page, M, ctx.y, totalW, rH, C.darkGreen, C.darkGreen, 0, R.sm);
  let hx = M;
  headers.forEach((h, i) => {
    drawText(ctx.page, h, hx + 4, ctx.y - 15, 8, ctx.font, C.white);
    hx += cols[i];
  });
  ctx.y -= rH;

  items.forEach((item, i) => {
    const actionLines = wrapText(ctx.font, item.action, 8, cols[1] - 10);
    const dynH = Math.max(rH, actionLines.length * 13 + 8);
    ctx = need(ctx, dynH);
    drawRect(ctx.page, M, ctx.y, totalW, dynH, i % 2 === 0 ? C.row1 : C.row2);

    let rx = M;
    // #
    drawText(ctx.page, item.priority.toString(), rx + 8, ctx.y - 15, 9, ctx.font, C.darkGreen, cols[0] - 4);
    rx += cols[0];
    // Action (wrapped)
    actionLines.forEach((l, li) => drawText(ctx.page, l, rx + 4, ctx.y - 10 - li * 13, 8, ctx.font, C.darkGray, cols[1] - 8));
    rx += cols[1];
    // Regulation
    drawText(ctx.page, item.regulation, rx + 4, ctx.y - 15, 7.5, ctx.font, C.darkGray, cols[2] - 8);
    rx += cols[2];
    // Timeline
    drawText(ctx.page, item.timeline, rx + 4, ctx.y - 15, 7.5, ctx.font, C.darkGray, cols[3] - 8);
    rx += cols[3];
    // Impact badge
    const ic = IMPACT_COL[item.impact] || C.gray;
    drawPanel(ctx.page, rx + 4, ctx.y - 8, cols[4] - 12, 14, rgb(ic.red * 0.15 + 0.85, ic.green * 0.15 + 0.85, ic.blue * 0.15 + 0.85), ic, 0.5, R.sm);
    drawText(ctx.page, item.impact.toUpperCase(), rx + 7, ctx.y - 18, 6.5, ctx.font, ic);

    ctx.y -= dynH;
  });

  return ctx;
}

// ─────────────────────────────────────────────
// Compliance score gauge (visual bar)
// ─────────────────────────────────────────────

function complianceScoreBar(ctx: Ctx, score: number, label: string, invert = false): Ctx {
  ctx = need(ctx, 32);
  const { page, y, M, W } = ctx;
  const barW = W - M * 2;
  const barH = 22;

  drawPanel(page, M, y, barW, barH, C.lightGray, C.divider, 0.5, R.sm);
  const fillW = Math.round((score / 100) * barW);
  const good = invert ? score < 50 : score >= 75;
  const mid = invert ? score < 75 : score >= 50;
  const fillCol = good ? C.green : mid ? C.amber : C.red;
  if (fillW > 0) fillRounded(page, M, y, fillW, barH, R.sm, fillCol);
  drawText(page, `${label}: ${score}%`, M + 8, y - 14, 9, ctx.font, good ? C.white : C.darkGray);
  const hint = invert
    ? (score >= 75 ? 'Много отворени действия' : score >= 50 ? 'Нужни са допълнителни мерки' : 'Ограничен брой действия')
    : readinessBarHint(score);
  drawText(page, hint, M + barW - 200, y - 14, 8, ctx.font, good ? C.white : C.darkGray);

  return { ...ctx, y: y - barH - 8 };
}

// ─────────────────────────────────────────────
// Main generator
// ─────────────────────────────────────────────

export async function generateComplianceReport(data: ComplianceReportData): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const fontUrl = 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5WZLCzYlKw.ttf';
  const fontBytes = await fetch(fontUrl).then(r => r.arrayBuffer());
  const font = await pdfDoc.embedFont(fontBytes);

  const grandTotal = data.scope1Total + data.scope2Total + data.scope3Total;
  const today = new Date().toLocaleDateString('bg-BG', { day: 'numeric', month: 'long', year: 'numeric' });
  const W = 595, H = 842, M = 40;

  const evaluation = evaluateComplianceRules({
    company: {
      employee_count: data.company.employee_count,
      annual_turnover_eur: data.company.annual_turnover_eur,
      industry_sector: data.company.industry_sector,
      ets_has_installation: data.company.ets_has_installation,
      ets_thermal_input_mw: data.company.ets_thermal_input_mw,
      ets_activity_annex_i: data.company.ets_activity_annex_i,
    },
    reportingYear: data.reportingYear,
    scope1Total: data.scope1Total,
    scope2Total: data.scope2Total,
    scope3Total: data.scope3Total,
    scope3Available: data.scope3Available,
    hasTargets: (data.targets?.length ?? 0) > 0,
    evidenceCoverage: data.evidenceCoverage,
  });

  const regulations = toComplianceTableRows(evaluation.rows);
  const summary = summarizeCompliance(regulations);
  const readinessScore = summary.readinessScore;
  const actions = buildComplianceActionPlan({
    company: {
      employee_count: data.company.employee_count,
      annual_turnover_eur: data.company.annual_turnover_eur,
      industry_sector: data.company.industry_sector,
      ets_has_installation: data.company.ets_has_installation,
      ets_thermal_input_mw: data.company.ets_thermal_input_mw,
      ets_activity_annex_i: data.company.ets_activity_annex_i,
    },
    reportingYear: data.reportingYear,
    scope1Total: data.scope1Total,
    scope2Total: data.scope2Total,
    scope3Total: data.scope3Total,
    scope3Available: data.scope3Available,
    hasTargets: (data.targets?.length ?? 0) > 0,
    evidenceCoverage: data.evidenceCoverage,
  });

  // ══════════════════════════════════════════════
  // PAGE 1 — Cover
  // ══════════════════════════════════════════════
  const firstPage = pdfDoc.addPage([W, H]);
  let ctx: Ctx = { pdfDoc, font, page: firstPage, y: H - 56, pageNum: 1, W, H, M };
  drawFooter(firstPage, font, W, 1);

  // Bulgarian tricolor accent stripe
  const stripeH = 8;
  // Bulgarian flag: white (top), green (middle), red (bottom) — PDF y increases upward
  firstPage.drawRectangle({ x: 0, y: H - stripeH * 1, width: W, height: stripeH, color: C.white });
  firstPage.drawRectangle({ x: 0, y: H - stripeH * 2, width: W, height: stripeH, color: C.green });
  firstPage.drawRectangle({ x: 0, y: H - stripeH * 3, width: W, height: stripeH, color: C.red });

  // Header band
  const HDR = 195;
  drawRect(firstPage, 0, H - stripeH * 3, W, HDR - stripeH * 3, C.blue);
  firstPage.drawRectangle({ x: 0, y: H - HDR, width: 6, height: HDR - stripeH * 3, color: C.white, opacity: 0.2 });

  // Report badge
  const badgeTop = H - stripeH * 3 - 12;
  drawPanel(firstPage, M, badgeTop, 120, 14, C.green, C.green, 0, R.sm);
  drawText(firstPage, 'РЕГУЛАТОРЕН ОТЧЕТ', M + 6, badgeTop - 10, 7, font, C.white);

  // Title
  drawText(firstPage, 'ОТЧЕТ ЗА', M + 4, H - HDR + 110, 26, font, C.white);
  drawText(firstPage, 'СЪОТВЕТСТВИЕ', M + 4, H - HDR + 80, 26, font, C.white);
  drawText(firstPage, `Регулаторна готовност и стандарти — ЗООС, CSRD, EU ETS  |  ${data.reportingYear} г.`, M + 4, H - HDR + 55, 9.5, font, rgb(0.72, 0.84, 1.0));

  // Company info box
  const cbTop = H - HDR - 10;
  drawPanel(firstPage, M, cbTop, W - M * 2, 68, C.white, C.divider, 0.5, R.lg);
  drawAccentBar(firstPage, M, cbTop, 68, C.green);
  drawText(firstPage, data.company.company_name, M + 12, cbTop - 18, 16, font, C.blue, W - M * 2 - 16);
  const infoLine: string[] = [];
  if (data.company.registration_number) infoLine.push(`ЕИК: ${data.company.registration_number}`);
  if (data.company.industry_sector) infoLine.push(`Сектор: ${data.company.industry_sector}`);
  if (data.company.employee_count) infoLine.push(`Служители: ${data.company.employee_count}`);
  drawText(firstPage, infoLine.join('   |   '), M + 12, cbTop - 36, 8.5, font, C.gray, W - M * 2 - 16);
  drawText(firstPage, `Отчетна година: ${data.reportingYear}   |   Генериран: ${today}   |   ${data.generatedBy || PDF_PLATFORM_NAME}`, M + 12, cbTop - 52, 8, font, C.gray);

  // Score banner — readiness index (not legal compliance)
  const scoreBanTop = cbTop - 68 - 12;
  const fillCol = readinessScore >= 75 ? C.green : readinessScore >= 50 ? C.amber : C.red;
  drawPanel(firstPage, M, scoreBanTop, W - M * 2, 72, C.nearWhite, C.divider, 0.5, R.lg);
  drawAccentBar(firstPage, M, scoreBanTop, 72, fillCol);
  drawText(firstPage, 'ИНДЕКС НА РЕГУЛАТОРНА ГОТОВНОСТ', M + 12, scoreBanTop - 12, 8, font, C.gray);
  drawText(firstPage, '(автоматичен скрининг — не е правен или регулаторен съвет)', M + 12, scoreBanTop - 24, 7, font, C.gray, W - M * 2 - 16);
  const scoreStr = `${readinessScore}%`;
  drawText(firstPage, scoreStr, M + 12, scoreBanTop - 50, 28, font, fillCol);
  drawText(
    firstPage,
    readinessLabel(readinessScore),
    M + 12 + font.widthOfTextAtSize(scoreStr, 28) + 10,
    scoreBanTop - 44,
    9,
    font,
    fillCol,
    W - M * 2 - 100,
  );
  const countLine = `${summary.fulfilled} изпълнени · ${summary.partial} частични · ${summary.gap} пропуски · ${summary.requiresReview} за преглед · ${summary.notApplicable} не се прилагат`;
  drawText(firstPage, countLine, M + 12, scoreBanTop - 64, 7.5, font, C.gray, W - M * 2 - 16);

  // Progress bar for readiness score
  const pbTop = scoreBanTop - 58;
  const pbW = W - M * 2 - 16;
  fillRounded(firstPage, M + 8, pbTop, pbW, 8, R.sm, C.lightGray);
  if (readinessScore > 0) fillRounded(firstPage, M + 8, pbTop, Math.round((readinessScore / 100) * pbW), 8, R.sm, fillCol);

  // Emissions summary boxes (3 scopes)
  const boxAreaTop = scoreBanTop - 72 - 12;
  const boxH2 = 96;
  const boxGap = 7;
  const boxW2 = (W - M * 2 - boxGap * 2) / 3;
  [
    { label: 'Обхват 1', sub: 'Директни (горива/флот)', val: data.scope1Total, color: C.green, bg: C.lightGreen },
    { label: 'Обхват 2', sub: 'Закупена енергия', val: data.scope2Total, color: rgb(0.114, 0.337, 0.761), bg: rgb(0.875, 0.910, 0.988) },
    { label: 'Обхват 3', sub: data.scope3Available ? 'Верига на стойността' : 'Не е измерен', val: data.scope3Total, color: data.scope3Available ? rgb(0.780, 0.290, 0.059) : C.gray, bg: data.scope3Available ? rgb(0.988, 0.929, 0.910) : C.lightGray },
  ].forEach(({ label, sub, val, color, bg }, i) => {
    const cx = M + i * (boxW2 + boxGap);
    drawPanel(firstPage, cx, boxAreaTop, boxW2, boxH2, bg, color, 0.5, R.md, 5);
    drawText(firstPage, label, cx + 10, boxAreaTop - 15, 10, font, color, boxW2 - 14);
    drawText(firstPage, sub, cx + 10, boxAreaTop - 28, 7, font, C.gray, boxW2 - 14);
    drawText(firstPage, val.toFixed(3), cx + 10, boxAreaTop - 56, 18, font, color);
    drawText(firstPage, 'tCO2e', cx + 10, boxAreaTop - 72, 8, font, C.gray);
    const pct = grandTotal > 0 ? ((val / grandTotal) * 100).toFixed(0) : '0';
    drawText(firstPage, `${pct}% от общото`, cx + 10, boxAreaTop - 84, 7.5, font, color);
  });

  // Scope legend block
  const legTop = boxAreaTop - boxH2 - 12;
  drawPanel(firstPage, M, legTop, W - M * 2, 34, C.nearWhite, C.divider, 0.5, R.md);
  drawText(firstPage, 'Обхват (1+2+3) ОБЩО:', M + 10, legTop - 12, 9, font, C.blue);
  drawText(firstPage, `${grandTotal.toFixed(3)} tCO2e`, M + 140, legTop - 12, 12, font, C.blue);
  drawText(firstPage, `Отчетна година: ${data.reportingYear}   |   ESRS ${ESRS_STANDARD_METADATA.standardVersion}   |   Правила v${COMPLIANCE_RULE_VERSION}`, M + 10, legTop - 26, 8, font, C.gray);

  // CSRD applicability callout
  const csrdTop = legTop - 34 - 10;
  const csrdScopeLabel =
    evaluation.csrd.mandatoryScope === 'in_scope'
      ? 'Вероятно в задължителен CSRD обхват'
      : evaluation.csrd.mandatoryScope === 'out_of_scope'
        ? 'Извън задължителен CSRD обхват'
        : 'CSRD обхват — необходим преглед';
  const csrdCol =
    evaluation.csrd.mandatoryScope === 'in_scope' ? C.amber : evaluation.csrd.mandatoryScope === 'out_of_scope' ? C.green : C.amber;
  drawPanel(firstPage, M, csrdTop, W - M * 2, 40, C.nearWhite, csrdCol, 0.5, R.md);
  drawAccentBar(firstPage, M, csrdTop, 40, csrdCol);
  drawText(firstPage, csrdScopeLabel, M + 12, csrdTop - 14, 9, font, csrdCol);
  drawText(firstPage, evaluation.csrd.summary, M + 12, csrdTop - 28, 7.5, font, C.gray, W - M * 2 - 16);

  // ══════════════════════════════════════════════
  // PAGE 2 — Regulatory Compliance Assessment
  // ══════════════════════════════════════════════
  ctx = newPage(ctx);
  ctx = titleBand(ctx, '1. ОЦЕНКА НА РЕГУЛАТОРНОТО СЪОТВЕТСТВИЕ', C.blue);
  ctx = spacer(ctx, 10);

  // Legend
  ctx = need(ctx, 24);
  const legendItems: [StatusType, string][] = [
    ['compliant', 'Изпълнено'],
    ['partial', 'Частично'],
    ['requires_review', 'За преглед'],
    ['gap', 'Пропуск'],
    ['na', 'Не се прилага'],
  ];
  legendItems.forEach(([s, l], li) => {
    const lx = ctx.M + li * 98;
    fillRounded(ctx.page, lx, ctx.y, 10, 10, 2.5, STATUS_BG[s]);
    drawText(ctx.page, l, lx + 13, ctx.y - 8, 7.5, ctx.font, C.darkGray);
  });
  ctx = { ...ctx, y: ctx.y - 22 };

  ctx = complianceTable(ctx, regulations);
  ctx = spacer(ctx, 10);

  // Score breakdown — partial never counts as fulfilled
  ctx = sectionHead(ctx, 'Обобщен индекс на готовност по категория');
  const actionsPct =
    summary.applicableTotal > 0
      ? Math.round((summary.actionsRequired / summary.applicableTotal) * 100)
      : 0;

  ctx = complianceScoreBar(
    ctx,
    readinessScore,
    `Изпълнени изисквания (${summary.fulfilled} от ${summary.applicableTotal})`,
  );
  ctx = complianceScoreBar(
    ctx,
    actionsPct,
    `Изискват действие (${summary.actionsRequired} от ${summary.applicableTotal})`,
    true,
  );
  ctx = spacer(ctx, 4);
  ctx = para(
    ctx,
    `От ${summary.totalRows} проверени регулации и рамки: ${summary.fulfilled} изпълнени, ${summary.partial} частични, ${summary.gap} с пропуски, ${summary.requiresReview} изискват експертен преглед, ${summary.notApplicable} не се прилагат. Частичните и непотвърдените статуси не се броят като пълно съответствие.`,
  );

  // ══════════════════════════════════════════════
  // PAGE 3 — GHG Data + Actions
  // ══════════════════════════════════════════════
  ctx = newPage(ctx);
  ctx = titleBand(ctx, '2. ДАННИ ЗА ПГ ЕМИСИИ И ПЛАН ЗА ДЕЙСТВИЕ', C.darkGreen);
  ctx = spacer(ctx, 8);

  ctx = sectionHead(ctx, 'Обобщение на ПГ емисиите');
  ctx = kpiRow(ctx, [
    { label: 'Обхват 1 — Директни', value: data.scope1Total.toFixed(3), unit: 'tCO2e', color: C.green, bg: C.lightGreen },
    { label: 'Обхват 2 — Енергия', value: data.scope2Total.toFixed(3), unit: 'tCO2e', color: rgb(0.114, 0.337, 0.761), bg: rgb(0.875, 0.910, 0.988) },
    { label: 'Обхват 3 — Верига', value: data.scope3Total > 0 ? data.scope3Total.toFixed(3) : 'Н/П', unit: 'tCO2e', color: rgb(0.780, 0.290, 0.059), bg: rgb(0.988, 0.929, 0.910) },
    { label: 'ОБЩО', value: grandTotal.toFixed(3), unit: 'tCO2e', color: C.blue, bg: C.lightBlue },
  ]);
  ctx = spacer(ctx, 6);

  ctx = sectionHead(ctx, 'Приоритетен план за действие', 'Наредени по значимост — адресирайте ги в показания ред');
  ctx = actionTable(ctx, actions);
  ctx = spacer(ctx, 10);

  // ── Regulatory context note ─────────────────────────
  ctx = sectionHead(ctx, 'Регулаторен контекст и следващи стъпки');
  ctx = para(
    ctx,
    `Скринингът използва правила v${COMPLIANCE_RULE_VERSION} (CSRD ${evaluation.csrd.ruleVersion}, ESRS ${ESRS_STANDARD_METADATA.standardVersion}). Задължителният CSRD обхват се определя по профил на компанията, не по наличие на емисионни данни. Препоръчителен маршрут: ${evaluation.csrd.suggestedRoute}.`,
  );
  ctx = spacer(ctx, 4);
  ctx = para(ctx, 'Следващи стъпки за регулаторна готовност:');
  ctx = bullet(ctx, 'Генерирайте CSRD Отчет (ESRS E1) от секция "Отчети" — вече са въведени всички данни');
  ctx = bullet(ctx, 'Задайте количествени цели в секция "Цели" за да отговорите на изискванията на E1-4');
  ctx = bullet(ctx, 'Поканете верификатор за ограничена (limited assurance) верификация по ISAE 3410');
  ctx = bullet(ctx, 'Подгответе документация за EU Taxonomy скрининг на основните дейности');
  ctx = spacer(ctx, 10);

  // ── Disclaimer ─────────────────────────────────────
  ctx = need(ctx, 52);
  ctx = spacer(ctx, 8);
  drawPanel(ctx.page, ctx.M, ctx.y, ctx.W - ctx.M * 2, 44, C.nearWhite, C.divider, 0.5, R.md);
  drawText(ctx.page, 'Правно уведомление', ctx.M + 10, ctx.y - 12, 8.5, ctx.font, C.darkGray);
  const disclaimer = 'Настоящият отчет е автоматичен регулаторен скрининг с информационна цел и не представлява правен или регулаторен съвет. Заключенията са консервативни и зависят от предоставените данни. За задължителна регулаторна отчетност се препоръчва консултация с квалифициран EHS/ESG специалист.';
  const dlLines = wrapText(font, disclaimer, 7.5, ctx.W - ctx.M * 2 - 14);
  dlLines.forEach((l, i) => drawText(ctx.page, l, ctx.M + 10, ctx.y - 24 - i * 11, 7.5, ctx.font, C.gray));

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
