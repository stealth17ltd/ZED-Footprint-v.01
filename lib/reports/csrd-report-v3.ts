/**
 * CSRD Report — ESRS E1 Climate Change
 * European Sustainability Reporting Standards (ESRS) E1
 * GHG Protocol Corporate Standard, ISO 14064-1
 *
 * Covers: Scope 1, Scope 2, Scope 3 (Categories 1, 4, 5, 6, 7)
 */

import { PDFDocument, rgb, PDFPage, PDFFont } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { PDF_PLATFORM_NAME, pdfSafeText } from './pdf-text';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface CSRDScope12Emission {
  reporting_period: string;
  scope: number;
  category: string;
  activity_value: number;
  unit: string;
  calculated_co2e: number;
  measurement_method?: string;
  data_quality?: string;
}

export interface CSRDScope3Calculation {
  scope_category: number;
  co2e_kg: number;
  method_tier: string;
  calculation_trace?: {
    supplier?: string;
    description?: string;
    amount?: number;
    currency?: string;
    factor_value?: number;
    factor_unit?: string;
    factor_source?: string;
  };
}

export interface CSRDTarget {
  name: string;
  target_type: string;
  target_value: number;
  target_year: number;
  baseline_year: number;
  description?: string;
  scope?: number;
}

export interface CSRDReportData {
  company: {
    company_name: string;
    registration_number?: string;
    industry_sector?: string;
    employee_count?: number;
    address?: string;
  };
  reportingYear: number;
  scope12Emissions: CSRDScope12Emission[];
  scope3Calculations: CSRDScope3Calculation[];
  targets: CSRDTarget[];
  comparisonData?: {
    previousYear: number;
    change: number;
    changePercent: number;
  };
  generatedBy?: string;
}

// ─────────────────────────────────────────────
// Labels
// ─────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  vehicles_diesel: 'Превозни средства — Дизел',
  vehicles_petrol: 'Превозни средства — Бензин',
  vehicles_lpg: 'Превозни средства — ГПГ',
  natural_gas: 'Природен газ',
  heating_oil: 'Нафта за отопление',
  coal: 'Въглища',
  refrigerant_r134a: 'Хладилен агент R-134a',
  refrigerant_r404a: 'Хладилен агент R-404A',
  electricity: 'Електроенергия',
  district_heating: 'Топлоенергия',
  district_cooling: 'Хладилна енергия',
};

const SCOPE3_LABELS: Record<number, string> = {
  1: 'Кат. 1: Закупени стоки и услуги',
  4: 'Кат. 4: Транспорт нагоре по веригата',
  5: 'Кат. 5: Генерирани отпадъци',
  6: 'Кат. 6: Бизнес пътувания',
  7: 'Кат. 7: Пътуване на служители',
};

// ─────────────────────────────────────────────
// Colors — CSRD navy/blue compliance palette
// ─────────────────────────────────────────────

const C = {
  navy:        rgb(0.063, 0.137, 0.294),  // header/title
  navyMid:     rgb(0.118, 0.220, 0.447),
  navyLight:   rgb(0.867, 0.898, 0.961),
  green:       rgb(0.059, 0.390, 0.196),
  lightGreen:  rgb(0.878, 0.961, 0.902),
  blue:        rgb(0.114, 0.337, 0.761),
  lightBlue:   rgb(0.875, 0.910, 0.988),
  orange:      rgb(0.780, 0.290, 0.059),
  lightOrange: rgb(0.988, 0.929, 0.910),
  gold:        rgb(0.682, 0.463, 0.000),
  lightGold:   rgb(0.988, 0.969, 0.878),
  gray:        rgb(0.420, 0.420, 0.420),
  lightGray:   rgb(0.933, 0.933, 0.933),
  darkGray:    rgb(0.220, 0.220, 0.220),
  nearWhite:   rgb(0.976, 0.980, 0.984),
  white:       rgb(1, 1, 1),
  black:       rgb(0, 0, 0),
  row1:        rgb(0.970, 0.974, 0.980),
  row2:        rgb(1, 1, 1),
  divider:     rgb(0.820, 0.831, 0.855),
};

// ─────────────────────────────────────────────
// Drawing helpers
// ─────────────────────────────────────────────

/** y = TOP of rectangle */
function drawRect(
  page: PDFPage, x: number, y: number, w: number, h: number,
  color: ReturnType<typeof rgb>, borderColor?: ReturnType<typeof rgb>
) {
  page.drawRectangle({ x, y: y - h, width: w, height: h, color, borderColor, borderWidth: borderColor ? 0.5 : 0 });
}

/** y = baseline */
function drawText(
  page: PDFPage, text: string, x: number, y: number, size: number,
  font: PDFFont, color = C.black, maxWidth?: number
) {
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

/** Split text into lines that fit within maxWidth */
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
      cur = word; // even if single word is too wide, we have no choice
    }
  }
  if (cur) lines.push(cur);
  return lines.length > 0 ? lines : [''];
}

function drawAccent(page: PDFPage, x: number, top: number, h: number, color: ReturnType<typeof rgb>) {
  page.drawRectangle({ x, y: top - h, width: 4, height: h, color });
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
  W: number;
  H: number;
  M: number; // margin
}

function newPage(ctx: Ctx): Ctx {
  const page = ctx.pdfDoc.addPage([ctx.W, ctx.H]);
  ctx.pageNum += 1;
  addFooter(page, ctx.font, ctx.W, ctx.pageNum, ctx.pdfDoc.getPageCount());
  return { ...ctx, page, y: ctx.H - 56 };
}

function need(ctx: Ctx, space: number): Ctx {
  if (ctx.y - space < 65) return newPage(ctx);
  return ctx;
}

function addFooter(page: PDFPage, font: PDFFont, W: number, n: number, total: number) {
  page.drawLine({ start: { x: 40, y: 44 }, end: { x: W - 40, y: 44 }, thickness: 0.5, color: C.divider });
  drawText(page, 'CSRD \u2014 ESRS E1 Climate Change Disclosure', 40, 30, 7.5, font, C.gray);
  drawText(page, 'Поверително', W / 2 - 25, 30, 7.5, font, C.gray);
  drawText(page, `${n} / ${total}`, W - 60, 30, 7.5, font, C.gray);
}

// ─────────────────────────────────────────────
// Layout helpers
// ─────────────────────────────────────────────

/** Dark navy page title band */
function titleBand(ctx: Ctx, label: string): Ctx {
  const bH = 36;
  const bTop = ctx.y + 10;
  drawRect(ctx.page, 0, bTop, ctx.W, bH, C.navy);
  page_drawRectangle(ctx.page, 0, bTop - bH, 6, bH, C.navyMid);
  drawText(ctx.page, label, 46, bTop - 23, 12, ctx.font, C.white);
  return { ...ctx, y: ctx.y - bH };
}

function page_drawRectangle(page: PDFPage, x: number, y: number, w: number, h: number, color: ReturnType<typeof rgb>) {
  page.drawRectangle({ x, y, width: w, height: h, color });
}

/** ESRS-numbered section header */
function sectionHead(ctx: Ctx, esrsRef: string, title: string, subtitle?: string): Ctx {
  const subtitleLines = subtitle ? wrapText(ctx.font, subtitle, 8, ctx.W - ctx.M * 2 - 14) : [];
  const bH = subtitle ? 28 + subtitleLines.length * 12 : 28;
  ctx = need(ctx, bH + 12);
  const { page, y, M, W } = ctx;

  drawRect(page, M, y, W - M * 2, bH, C.navyLight);
  drawAccent(page, M, y, bH, C.navy);

  // ESRS ref badge
  const badgeW = esrsRef ? font_width(ctx.font, esrsRef, 7) + 10 : 0;
  if (esrsRef) {
    drawRect(page, M + 8, y - 6, badgeW, 13, C.navy);
    drawText(page, esrsRef, M + 13, y - 15, 6.5, ctx.font, C.white);
  }

  const titleX = M + (esrsRef ? badgeW + 14 : 10);
  drawText(page, title, titleX, y - 15, 10.5, ctx.font, C.navy, W - M * 2 - titleX + M);
  subtitleLines.forEach((line, i) => {
    drawText(page, line, M + 10, y - 28 - i * 12, 8, ctx.font, C.gray);
  });

  return { ...ctx, y: y - bH - 10 };
}

function font_width(font: PDFFont, text: string, size: number) {
  try { return font.widthOfTextAtSize(text, size); } catch { return text.length * size * 0.5; }
}

/** KPI cards */
function kpiCards(
  ctx: Ctx,
  items: Array<{ label: string; value: string; unit?: string; color?: ReturnType<typeof rgb>; bg?: ReturnType<typeof rgb> }>
): Ctx {
  const cardH = 56;
  ctx = need(ctx, cardH + 8);
  const { page, y, M, W, font } = ctx;
  const gap = 6;
  const n = items.length;
  const cW = (W - M * 2 - gap * (n - 1)) / n;

  items.forEach((item, i) => {
    const cx = M + i * (cW + gap);
    const bg = item.bg || C.nearWhite;
    const col = item.color || C.darkGray;
    drawRect(page, cx, y, cW, cardH, bg, C.divider);
    page.drawRectangle({ x: cx, y: y - cardH, width: 3, height: cardH, color: col });
    drawText(page, item.label, cx + 9, y - 11, 7, font, C.gray, cW - 12);
    drawText(page, item.value, cx + 9, y - 30, 15, font, col, cW - 12);
    if (item.unit) drawText(page, item.unit, cx + 9, y - 44, 7, font, C.gray, cW - 12);
  });
  return { ...ctx, y: y - cardH - 10 };
}

/** Body paragraph with optional indent — wraps across lines */
function para(ctx: Ctx, text: string, indent = 0): Ctx {
  const lH = 13;
  const maxW = ctx.W - ctx.M * 2 - indent;
  const lines = wrapText(ctx.font, text, 8.5, maxW);
  for (const line of lines) {
    ctx = need(ctx, lH + 4);
    drawText(ctx.page, line, ctx.M + indent, ctx.y - 11, 8.5, ctx.font, C.darkGray);
    ctx = { ...ctx, y: ctx.y - lH };
  }
  return { ...ctx, y: ctx.y - 3 };
}

/** Bullet item — wraps long text with hanging indent */
function bullet(ctx: Ctx, text: string): Ctx {
  const lH = 13;
  const bulletX = ctx.M + 6;
  const textX = ctx.M + 18;
  const maxW = ctx.W - ctx.M * 2 - 20;
  const lines = wrapText(ctx.font, text, 8, maxW);

  lines.forEach((line, i) => {
    ctx = need(ctx, lH + 2);
    if (i === 0) drawText(ctx.page, '\u2022', bulletX, ctx.y - 11, 9, ctx.font, C.navy);
    drawText(ctx.page, line, textX, ctx.y - 11, 8, ctx.font, C.darkGray);
    ctx = { ...ctx, y: ctx.y - lH };
  });
  return ctx;
}

function spacer(ctx: Ctx, px = 10): Ctx {
  return { ...ctx, y: ctx.y - px };
}

// ─────────────────────────────────────────────
// Tables
// ─────────────────────────────────────────────

function tableScope12(ctx: Ctx, rows: CSRDScope12Emission[]): Ctx {
  const { M, W } = ctx;
  const totalW = W - M * 2;
  const cols = [
    { label: 'Период',    w: totalW * 0.14 },
    { label: 'Категория', w: totalW * 0.38 },
    { label: 'Дейност',   w: totalW * 0.13 },
    { label: 'Единица',   w: totalW * 0.12 },
    { label: 'tCO2e',     w: totalW * 0.13 },
    { label: 'Качество',  w: totalW * 0.10 },
  ];
  const rH = 18;

  ctx = need(ctx, rH * 2);
  drawRect(ctx.page, M, ctx.y, totalW, rH, C.navy);
  let hx = M;
  cols.forEach(c => {
    drawText(ctx.page, c.label, hx + 4, ctx.y - 12, 7.5, ctx.font, C.white, c.w - 6);
    hx += c.w;
  });
  ctx.y -= rH;

  rows.forEach((row, i) => {
    ctx = need(ctx, rH);
    drawRect(ctx.page, M, ctx.y, totalW, rH, i % 2 === 0 ? C.row1 : C.row2);
    let rx = M;
    const period = (() => { try { return new Date(row.reporting_period).toLocaleDateString('bg-BG', { month: 'short', year: 'numeric' }); } catch { return row.reporting_period; } })();
    const dq = row.data_quality === 'high' ? 'Висококо' : row.data_quality === 'medium' ? 'Средно' : row.data_quality ? 'Ниско' : 'Н/П';
    [
      { v: period,                          w: cols[0].w },
      { v: CATEGORY_LABELS[row.category] || row.category, w: cols[1].w },
      { v: (row.activity_value ?? 0).toFixed(2), w: cols[2].w },
      { v: row.unit,                        w: cols[3].w },
      { v: (row.calculated_co2e ?? 0).toFixed(4), w: cols[4].w },
      { v: dq,                              w: cols[5].w },
    ].forEach(({ v, w }) => {
      drawText(ctx.page, v, rx + 4, ctx.y - 12, 7, ctx.font, C.darkGray, w - 6);
      rx += w;
    });
    ctx.y -= rH;
  });
  return ctx;
}

function tableScope3Categories(ctx: Ctx, byCategory: Record<number, number>, total: number): Ctx {
  const { M, W } = ctx;
  const totalW = W - M * 2;
  const sorted = Object.entries(byCategory).sort(([, a], [, b]) => b - a);
  const cols = [totalW * 0.46, totalW * 0.16, totalW * 0.12, totalW * 0.14, totalW * 0.12];
  const headers = ['Категория (ESRS E1-6)', 'tCO2e', 'Дял %', 'Метод', 'Ниво'];
  const rH = 20;

  ctx = need(ctx, rH * (sorted.length + 2));
  drawRect(ctx.page, M, ctx.y, totalW, rH, C.navy);
  let hx = M;
  headers.forEach((h, i) => {
    drawText(ctx.page, h, hx + 5, ctx.y - 13, 7.5, ctx.font, C.white);
    hx += cols[i];
  });
  ctx.y -= rH;

  sorted.forEach(([catStr, tons], i) => {
    ctx = need(ctx, rH);
    const cat = parseInt(catStr);
    const pct = total > 0 ? ((tons / total) * 100).toFixed(1) : '0';
    drawRect(ctx.page, M, ctx.y, totalW, rH, i % 2 === 0 ? C.row1 : C.row2);
    let rx = M;
    [SCOPE3_LABELS[cat] || `Категория ${cat}`, tons.toFixed(4), `${pct}%`, 'Разходно-базиран', 'Ниво C'].forEach((v, vi) => {
      drawText(ctx.page, v, rx + 5, ctx.y - 13, 7.5, ctx.font, C.darkGray, cols[vi] - 8);
      rx += cols[vi];
    });
    ctx.y -= rH;
  });

  // Total
  ctx = need(ctx, rH);
  drawRect(ctx.page, M, ctx.y, totalW, rH, C.navyLight, C.navyMid);
  let rx = M;
  [['ОБЩО', cols[0]], [total.toFixed(4), cols[1]], ['100%', cols[2]], ['ESRS E1-6 §51', cols[3]], ['', cols[4]]].forEach(([v, w]) => {
    drawText(ctx.page, v as string, rx + 5, ctx.y - 13, 8, ctx.font, C.navy, (w as number) - 8);
    rx += w as number;
  });
  ctx.y -= rH;
  return ctx;
}

// ─────────────────────────────────────────────
// Main generator
// ─────────────────────────────────────────────

export async function generateCSRDReportV3(data: CSRDReportData): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const fontUrl = 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5WZLCzYlKw.ttf';
  const fontBytes = await fetch(fontUrl).then(r => r.arrayBuffer());
  const font = await pdfDoc.embedFont(fontBytes);

  // ── Aggregations ──
  const scope1 = data.scope12Emissions.filter(e => e.scope === 1).reduce((s, e) => s + (e.calculated_co2e ?? 0), 0);
  const scope2 = data.scope12Emissions.filter(e => e.scope === 2).reduce((s, e) => s + (e.calculated_co2e ?? 0), 0);
  const scope3Kg = data.scope3Calculations.reduce((s, e) => s + (e.co2e_kg ?? 0), 0);
  const scope3Tons = scope3Kg / 1000;
  const grandTotal = scope1 + scope2 + scope3Tons;

  const scope3ByCategory: Record<number, number> = {};
  data.scope3Calculations.forEach(e => {
    scope3ByCategory[e.scope_category] = (scope3ByCategory[e.scope_category] || 0) + (e.co2e_kg ?? 0) / 1000;
  });

  const today = new Date().toLocaleDateString('bg-BG', { day: 'numeric', month: 'long', year: 'numeric' });
  const W = 595, H = 842, M = 40;

  // ── Context ──
  // We create page 1 manually then let newPage() handle the rest.
  // Footer is added retroactively for page 1 after we know total pages.
  const firstPage = pdfDoc.addPage([W, H]);
  let ctx: Ctx = { pdfDoc, font, page: firstPage, y: H - 56, pageNum: 1, W, H, M };

  // ══════════════════════════════════════════════
  // PAGE 1 — Cover
  // ══════════════════════════════════════════════

  // Navy header
  const HDR = 210;
  drawRect(firstPage, 0, H, W, HDR, C.navy);
  page_drawRectangle(firstPage, 0, H - HDR, 7, HDR, C.navyMid);

  // EU flag — 12 gold circles arranged in a ring (official EU flag proportions)
  const flagSz = 60;
  const flagX = W - flagSz - 8;
  const flagTop = H - 8;
  drawRect(firstPage, flagX, flagTop, flagSz, flagSz, rgb(0.000, 0.267, 0.667)); // EU blue
  const fcx = flagX + flagSz / 2;
  const fcy = flagTop - flagSz / 2; // center y (PDF bottom-up)
  const starRing = 16;   // radius of the circle of stars
  const starDot = 2.2;   // radius of each gold dot
  const gold = rgb(0.996, 0.800, 0.000);
  for (let i = 0; i < 12; i++) {
    const angle = (i * Math.PI * 2 / 12) - Math.PI / 2; // start from top
    const sx = fcx + starRing * Math.cos(angle);
    const sy = fcy + starRing * Math.sin(angle);
    firstPage.drawCircle({ x: sx, y: sy, size: starDot, color: gold });
  }

  // Report identifier
  drawText(firstPage, 'ESRS E1', M + 4, H - 44, 11, font, rgb(0.6, 0.75, 1.0));
  drawText(firstPage, 'Climate Change', M + 4, H - 57, 9, font, rgb(0.5, 0.65, 0.9));

  // Main title
  drawText(firstPage, 'ОТЧЕТ ЗА КОРПОРАТИВНА', M + 4, H - 88, 24, font, C.white);
  drawText(firstPage, 'УСТОЙЧИВОСТ', M + 4, H - 116, 24, font, C.white);
  drawText(firstPage, `Климат \u2014 Обхват 1 + 2 + 3  |  ${data.reportingYear} г.`, M + 4, H - 140, 10.5, font, rgb(0.65, 0.78, 0.95));
  drawText(firstPage, 'Директива CSRD \u2014 ESRS E1 \u2014 GHG Protocol Corporate Standard', M + 4, H - 157, 8.5, font, rgb(0.55, 0.68, 0.88));

  // Company box
  const cbTop = H - HDR - 8;
  const cbH = 72;
  drawRect(firstPage, M, cbTop, W - M * 2, cbH, C.white, C.divider);
  drawAccent(firstPage, M, cbTop, cbH, C.navy);
  drawText(firstPage, data.company.company_name, M + 12, cbTop - 18, 16, font, C.navy, W - M * 2 - 16);
  const infoLine: string[] = [];
  if (data.company.registration_number) infoLine.push(`ЕИК: ${data.company.registration_number}`);
  if (data.company.industry_sector) infoLine.push(`Сектор: ${data.company.industry_sector}`);
  if (data.company.employee_count) infoLine.push(`Служители: ${data.company.employee_count}`);
  drawText(firstPage, infoLine.join('   |   '), M + 12, cbTop - 36, 8.5, font, C.gray, W - M * 2 - 16);
  if (data.company.address) drawText(firstPage, data.company.address, M + 12, cbTop - 50, 8, font, C.gray, W - M * 2 - 16);
  drawText(firstPage, `Отчетна година: ${data.reportingYear}   |   Генериран: ${today}`, M + 12, cbTop - 63, 8, font, C.gray);

  // Grand total banner
  const banTop = cbTop - cbH - 14;
  const banH = 82;
  drawRect(firstPage, M, banTop, W - M * 2, banH, C.navyLight, C.navyMid);
  drawAccent(firstPage, M, banTop, banH, C.navy);
  drawText(firstPage, 'ОБЩИ ЕМИСИИ ПАРНИКОВИ ГАЗОВЕ (tCO2e)', M + 12, banTop - 12, 8, font, C.gray);

  const gtStr = grandTotal.toFixed(3);
  drawText(firstPage, gtStr, M + 12, banTop - 44, 32, font, C.navy);
  drawText(firstPage, 'tCO2e', M + 12 + font.widthOfTextAtSize(gtStr, 32) + 6, banTop - 44, 13, font, C.navyMid);

  if (data.comparisonData) {
    const sign = data.comparisonData.change <= 0 ? '' : '+';
    const col = data.comparisonData.change <= 0 ? C.green : C.orange;
    drawText(firstPage, `${sign}${data.comparisonData.changePercent.toFixed(1)}% спрямо ${data.reportingYear - 1} г.  (${data.comparisonData.previousYear.toFixed(3)} tCO2e)`, M + 12, banTop - 60, 8.5, font, col);
  }

  drawText(firstPage, `Изготвил: ${data.generatedBy || PDF_PLATFORM_NAME}`, M + 12, banTop - 73, 8, font, C.gray);

  // Scope summary cards
  const cardAreaTop = banTop - banH - 14;
  const cardH = 92;
  const gap = 7;
  const cardW = (W - M * 2 - gap * 2) / 3;
  [
    { label: 'Обхват 1', sub: 'Директни емисии (ESRS E1-6 §44)', val: scope1, bg: C.lightGreen, col: C.green, border: C.green },
    { label: 'Обхват 2', sub: 'Индиректни от енергия (E1-6 §45)', val: scope2, bg: C.lightBlue, col: C.blue, border: C.blue },
    { label: 'Обхват 3', sub: 'Верига на стойността (E1-6 §51)', val: scope3Tons, bg: C.lightOrange, col: C.orange, border: C.orange },
  ].forEach(({ label, sub, val, bg, col, border }, i) => {
    const cx = M + i * (cardW + gap);
    drawRect(firstPage, cx, cardAreaTop, cardW, cardH, bg, border);
    drawRect(firstPage, cx, cardAreaTop, cardW, 5, border);
    drawText(firstPage, label, cx + 10, cardAreaTop - 16, 10, font, col, cardW - 14);
    drawText(firstPage, sub, cx + 10, cardAreaTop - 28, 7, font, C.gray, cardW - 14);
    drawText(firstPage, val.toFixed(3), cx + 10, cardAreaTop - 54, 19, font, col);
    drawText(firstPage, 'tCO2e', cx + 10, cardAreaTop - 68, 8, font, C.gray);
    const pct = grandTotal > 0 ? ((val / grandTotal) * 100).toFixed(1) : '0';
    drawText(firstPage, `${pct}% от общото`, cx + 10, cardAreaTop - 82, 8, font, col);
  });

  // Scope 3 sub-categories mini row
  const s3catTop = cardAreaTop - cardH - 12;
  if (Object.keys(scope3ByCategory).length > 0) {
    const s3catH = 36;
    drawRect(firstPage, M, s3catTop, W - M * 2, s3catH, C.nearWhite, C.divider);
    drawText(firstPage, 'Обхват 3 по категории:', M + 10, s3catTop - 10, 7.5, font, C.gray);
    const cats = Object.entries(scope3ByCategory).sort(([, a], [, b]) => b - a).slice(0, 5);
    const cw2 = (W - M * 2 - 140) / cats.length;
    cats.forEach(([catStr, tons], ci) => {
      const cat = parseInt(catStr);
      const label = SCOPE3_LABELS[cat]?.replace('Кат. ', 'К.') || `К.${cat}`;
      const pct = scope3Tons > 0 ? ((tons / scope3Tons) * 100).toFixed(0) : '0';
      const cx2 = M + 140 + ci * cw2;
      drawText(firstPage, label, cx2, s3catTop - 10, 6.5, font, C.darkGray, cw2 - 4);
      drawText(firstPage, `${tons.toFixed(3)} t (${pct}%)`, cx2, s3catTop - 22, 7.5, font, C.orange, cw2 - 4);
    });
  }

  // Disclaimer
  drawLine(firstPage, M, 60, W - M, C.divider);
  drawText(firstPage, 'Настоящият отчет е изготвен съгласно ESRS E1 и GHG Protocol Corporate Standard. Данните са базирани на предоставена информация.', M, 46, 7, font, C.gray, W - M * 2);

  // ══════════════════════════════════════════════
  // PAGE 2 — About this Disclosure
  // ══════════════════════════════════════════════
  ctx = newPage(ctx);
  ctx = titleBand(ctx, '1. ЗА НАСТОЯЩОТО РАЗКРИВАНЕ');
  ctx = spacer(ctx, 8);

  ctx = sectionHead(ctx, 'ESRS 1', 'Организационна граница и период на отчитане');
  ctx = para(ctx, `Настоящото разкриване обхваща всички дейности, обекти и операции, контролирани от ${data.company.company_name} за периода 1 януари — 31 декември ${data.reportingYear} г. Прилага се подход на оперативен контрол за консолидация, в съответствие с GHG Protocol.`);
  ctx = spacer(ctx, 4);
  ctx = para(ctx, 'Отчетният обхват включва:');
  ctx = bullet(ctx, 'Обхват 1: Всички директни източници на емисии — горива за моторни превозни средства, стационарни горивни процеси, изпускане на хладилни агенти.');
  ctx = bullet(ctx, 'Обхват 2: Закупена електроенергия, топлоенергия и охлаждане (метод на местоположение).');
  ctx = bullet(ctx, `Обхват 3: Категории ${Object.keys(scope3ByCategory).sort().join(', ')} — закупени стоки/услуги, транспорт, отпадъци, бизнес пътувания, пътуване на служители.`);
  ctx = spacer(ctx, 8);

  ctx = sectionHead(ctx, 'ESRS 2', 'Приложими стандарти и процеси');
  ctx = para(ctx, 'Методологията следва:');
  ctx = bullet(ctx, 'GHG Protocol Corporate Accounting and Reporting Standard (Revised Edition, WRI/WBCSD)');
  ctx = bullet(ctx, 'ISO 14064-1:2018 — Спецификация за измерване и отчитане на ПГ на организационно ниво');
  ctx = bullet(ctx, 'ESRS E1 Climate Change (Регламент (ЕС) 2023/2772) — разкриване по климатична промяна');
  ctx = bullet(ctx, 'DEFRA 2024 GHG Conversion Factors — емисионни фактори за Обхват 1 и 2');
  ctx = bullet(ctx, 'EXIOBASE v3 / EEIO — разходно-базирани фактори за Обхват 3 (Ниво C)');
  ctx = spacer(ctx, 8);

  ctx = sectionHead(ctx, 'ESRS 2 §6', 'Базова година');
  ctx = para(ctx, `${data.reportingYear} г. е ${data.comparisonData ? 'отчетна година, за която е налична сравнима информация от предходния период' : 'базовата (референтна) година за бъдещо проследяване на напредъка'}. Базовата година ще се преизчислява при съществени структурни промени (придобивания, отделяния, промяна на методологията).`);

  // ══════════════════════════════════════════════
  // PAGE 3 — Governance (ESRS E1-GOV)
  // ══════════════════════════════════════════════
  ctx = newPage(ctx);
  ctx = titleBand(ctx, '2. УПРАВЛЕНИЕ — ESRS E1-GOV');
  ctx = spacer(ctx, 8);

  ctx = sectionHead(ctx, 'E1-GOV-1', 'Управление на рисковете и възможностите, свързани с климата');
  ctx = para(ctx, `Ръководството на ${data.company.company_name} поема пряка отговорност за управлението на климатичните въпроси. Климатичните рискове и възможности са интегрирани в стратегическото планиране и процесите за вземане на решения.`);
  ctx = spacer(ctx, 4);
  ctx = para(ctx, 'Структура на управлението:');
  ctx = bullet(ctx, 'Изпълнително ръководство: Одобрява климатичната стратегия, цели и политики');
  ctx = bullet(ctx, 'Отговорник по устойчивост: Координира измерването, отчитането и изпълнението на мерките');
  ctx = bullet(ctx, 'Финансов отдел: Осигурява данни за Обхват 3 (финансови транзакции, разходи)');
  ctx = bullet(ctx, 'Операционни отдели: Събират данни за Обхват 1 и 2 (горива, ел. енергия)');
  ctx = spacer(ctx, 8);

  ctx = sectionHead(ctx, 'E1-GOV-2', 'Климатични рискове и възможности');
  ctx = para(ctx, 'Идентифицирани физически рискове:');
  ctx = bullet(ctx, 'Физически рискове: екстремни климатични събития, нарушения в доставките поради промяна на климата');
  ctx = bullet(ctx, 'Преходни рискове: нарастващи въглеродни цени (EU ETS), регулаторни изисквания за отчетност, промени в потребителските предпочитания');
  ctx = spacer(ctx, 4);
  ctx = para(ctx, 'Идентифицирани възможности:');
  ctx = bullet(ctx, 'Намаляване на разходите чрез енергийна ефективност и преминаване към ВЕИ');
  ctx = bullet(ctx, 'Конкурентно предимство при клиенти и партньори, изискващи нисковъглеродна верига на доставки');
  ctx = bullet(ctx, 'Достъп до зелено финансиране и ESG-ориентирани инвеститори');

  // ══════════════════════════════════════════════
  // PAGE 4+ — GHG Emissions (E1-6)
  // ══════════════════════════════════════════════
  ctx = newPage(ctx);
  ctx = titleBand(ctx, '3. ЕМИСИИ НА ПАРНИКОВИ ГАЗОВЕ — ESRS E1-6');
  ctx = spacer(ctx, 8);

  ctx = sectionHead(ctx, 'E1-6 §42', 'Обобщение на Обхват 1 + 2 + 3');
  ctx = kpiCards(ctx, [
    { label: 'Обхват 1 — Директни', value: scope1.toFixed(3), unit: 'tCO2e', color: C.green, bg: C.lightGreen },
    { label: 'Обхват 2 — Закупена енергия', value: scope2.toFixed(3), unit: 'tCO2e', color: C.blue, bg: C.lightBlue },
    { label: 'Обхват 3 — Верига', value: scope3Tons.toFixed(3), unit: 'tCO2e', color: C.orange, bg: C.lightOrange },
    { label: 'ОБЩО (Gross)', value: grandTotal.toFixed(3), unit: 'tCO2e', color: C.navy, bg: C.navyLight },
  ]);
  ctx = spacer(ctx, 6);

  if (data.comparisonData) {
    const sign = data.comparisonData.change <= 0 ? '' : '+';
    const col = data.comparisonData.change <= 0 ? C.green : C.orange;
    ctx = need(ctx, 22);
    drawRect(ctx.page, ctx.M, ctx.y, ctx.W - ctx.M * 2, 18, data.comparisonData.change <= 0 ? C.lightGreen : C.lightOrange, data.comparisonData.change <= 0 ? C.green : C.orange);
    drawText(ctx.page, `Год-над-год промяна: ${sign}${data.comparisonData.changePercent.toFixed(1)}%  (${data.comparisonData.previousYear.toFixed(3)} tCO2e за ${data.reportingYear - 1} г.)`, ctx.M + 10, ctx.y - 12, 8.5, ctx.font, col);
    ctx = { ...ctx, y: ctx.y - 26 };
  }

  ctx = sectionHead(ctx, 'E1-6 §44', 'Обхват 1 — Директни емисии от парникови газове');
  ctx = para(ctx, 'Обхват 1 обхваща всички директни емисии от горивни и технологични процеси, контролирани от организацията. Включва ПГ: CO2, CH4, N2O (изразени в CO2e чрез GWP100, AR5/AR6).');
  ctx = kpiCards(ctx, [
    { label: 'Общо Обхват 1', value: scope1.toFixed(3), unit: 'tCO2e', color: C.green, bg: C.lightGreen },
    { label: 'Брой записи', value: data.scope12Emissions.filter(e => e.scope === 1).length.toString(), unit: 'дейности' },
    { label: 'Дял от 1+2+3', value: grandTotal > 0 ? ((scope1 / grandTotal) * 100).toFixed(1) + '%' : '0%', unit: 'от общото' },
  ]);
  if (data.scope12Emissions.filter(e => e.scope === 1).length > 0) {
    ctx = tableScope12(ctx, data.scope12Emissions.filter(e => e.scope === 1));
  } else {
    ctx = para(ctx, 'Няма данни за Обхват 1 за отчетния период.', 10);
  }
  ctx = spacer(ctx, 12);

  ctx = sectionHead(ctx, 'E1-6 §45', 'Обхват 2 — Индиректни емисии от закупена енергия');
  ctx = para(ctx, 'Обхват 2 включва емисиите, свързани с производството на закупена електроенергия, топлоенергия и охлаждане. Представени на база метод на местоположение (location-based). Пазарно-базираните (market-based) данни ще бъдат включени при наличие на договорни инструменти (GoO/RECs).');
  ctx = kpiCards(ctx, [
    { label: 'Общо Обхват 2', value: scope2.toFixed(3), unit: 'tCO2e (location-based)', color: C.blue, bg: C.lightBlue },
    { label: 'Брой записи', value: data.scope12Emissions.filter(e => e.scope === 2).length.toString(), unit: 'дейности' },
    { label: 'Дял от 1+2+3', value: grandTotal > 0 ? ((scope2 / grandTotal) * 100).toFixed(1) + '%' : '0%', unit: 'от общото' },
  ]);
  if (data.scope12Emissions.filter(e => e.scope === 2).length > 0) {
    ctx = tableScope12(ctx, data.scope12Emissions.filter(e => e.scope === 2));
  } else {
    ctx = para(ctx, 'Няма данни за Обхват 2 за отчетния период.', 10);
  }

  // ══════════════════════════════════════════════
  // PAGE — Scope 3
  // ══════════════════════════════════════════════
  ctx = newPage(ctx);
  ctx = titleBand(ctx, '4. ОБХВАТ 3 — ВЕРИГА НА СТОЙНОСТТА — ESRS E1-6 §51');
  ctx = spacer(ctx, 8);

  ctx = sectionHead(ctx, 'E1-6 §51', 'Обхват на категориите');
  ctx = para(ctx, `Обхват 3 включва всички значими категории нагоре по веригата, идентифицирани при оценка на материалността за ${data.company.company_name}:`);
  ctx = bullet(ctx, 'Категория 1: Закупени стоки и услуги — изчислени по разходно-базиран метод (EEIO, Ниво C)');
  ctx = bullet(ctx, 'Категория 4: Транспорт и дистрибуция нагоре — включва доставки от доставчици до компанията');
  ctx = bullet(ctx, 'Категория 5: Отпадъци от операциите — обработка на отпадъци, генерирани в процеса на работа');
  ctx = bullet(ctx, 'Категория 6: Бизнес пътувания — въздушен транспорт, влак, хотели');
  ctx = bullet(ctx, 'Категория 7: Пътуване на служители до работното място');
  ctx = spacer(ctx, 4);
  ctx = para(ctx, 'Използван метод: Ниво C (Spend-based / EEIO) — финансови транзакции, умножени по отраслови емисионни фактори от EXIOBASE v3 и DEFRA 2024. Методът е стандартен за SME-сектора при липса на специфични доставчикови данни.');
  ctx = spacer(ctx, 8);

  ctx = sectionHead(ctx, 'E1-6 §52', 'Обобщение по категории');
  ctx = kpiCards(ctx, [
    { label: 'Общо Обхват 3', value: scope3Tons.toFixed(3), unit: 'tCO2e', color: C.orange, bg: C.lightOrange },
    { label: 'Покрити категории', value: Object.keys(scope3ByCategory).length.toString(), unit: 'от 5 планирани' },
    { label: 'Изчисления', value: data.scope3Calculations.length.toString(), unit: 'транзакции' },
    { label: 'Метод', value: 'Ниво C', unit: 'EEIO / Spend-based' },
  ]);
  ctx = spacer(ctx, 4);
  ctx = tableScope3Categories(ctx, scope3ByCategory, scope3Tons);
  ctx = spacer(ctx, 8);

  // Top 10 audit trace
  if (data.scope3Calculations.length > 0) {
    ctx = sectionHead(ctx, 'E1-6 §51(g)', 'Одитен след (топ 10 изчисления по CO2e)');
    ctx = para(ctx, '"Покажи математиката" — пълна проследимост за всяко изчисление: доставчик, сума, емисионен фактор.');
    ctx = spacer(ctx, 4);

    const top10 = [...data.scope3Calculations].sort((a, b) => b.co2e_kg - a.co2e_kg).slice(0, 10);
    const { M: m, W: w } = ctx;
    const totalW2 = w - m * 2;
    const colW2 = [totalW2 * 0.22, totalW2 * 0.18, totalW2 * 0.11, totalW2 * 0.16, totalW2 * 0.13, totalW2 * 0.20];
    const headers2 = ['Доставчик', 'Описание', 'EUR', 'Категория', 'kg CO2e', 'Ем. фактор'];
    const rH2 = 19;

    ctx = need(ctx, rH2 * 2);
    drawRect(ctx.page, m, ctx.y, totalW2, rH2, C.navy);
    let hx2 = m;
    headers2.forEach((h, i) => {
      drawText(ctx.page, h, hx2 + 4, ctx.y - 12, 7.5, ctx.font, C.white);
      hx2 += colW2[i];
    });
    ctx.y -= rH2;

    top10.forEach((calc, i) => {
      ctx = need(ctx, rH2);
      const tr = calc.calculation_trace || {};
      drawRect(ctx.page, m, ctx.y, totalW2, rH2, i % 2 === 0 ? C.row1 : C.row2);
      let rx2 = m;
      const factorStr = tr.factor_value ? `${tr.factor_value} ${tr.factor_unit || ''}`.trim() : 'Н/П';
      [
        { v: tr.supplier || '\u2014', w: colW2[0] },
        { v: tr.description || '\u2014', w: colW2[1] },
        { v: tr.amount != null ? tr.amount.toFixed(2) : '\u2014', w: colW2[2] },
        { v: SCOPE3_LABELS[calc.scope_category]?.replace('Кат. ', 'К.') || `К.${calc.scope_category}`, w: colW2[3] },
        { v: (calc.co2e_kg ?? 0).toFixed(3), w: colW2[4] },
        { v: factorStr, w: colW2[5] },
      ].forEach(({ v, w: cw }) => {
        drawText(ctx.page, v, rx2 + 4, ctx.y - 12, 7, ctx.font, C.darkGray, cw - 6);
        rx2 += cw;
      });
      ctx.y -= rH2;
    });

    if (data.scope3Calculations.length > 10) {
      ctx = need(ctx, 16);
      drawText(ctx.page, `+ още ${data.scope3Calculations.length - 10} изчисления`, m + 4, ctx.y - 11, 8, ctx.font, C.gray);
      ctx = { ...ctx, y: ctx.y - 16 };
    }
  }

  // ══════════════════════════════════════════════
  // PAGE — Targets (E1-4) & Strategy (E1-2)
  // ══════════════════════════════════════════════
  ctx = newPage(ctx);
  ctx = titleBand(ctx, '5. ЦЕЛИ ЗА НАМАЛЯВАНЕ НА ЕМИСИИТЕ — ESRS E1-4');
  ctx = spacer(ctx, 8);

  ctx = sectionHead(ctx, 'E1-4 §28', 'Климатичен ангажимент');
  ctx = para(ctx, `${data.company.company_name} е ангажирана с намаляването на своя въглероден отпечатък в съответствие с Парижкото споразумение (1.5°C пътека) и Европейския зелен пакт. Компанията признава отговорността си към заинтересованите страни.`);
  ctx = spacer(ctx, 8);

  if (data.targets && data.targets.length > 0) {
    ctx = sectionHead(ctx, 'E1-4 §29', 'Количествени цели за намаляване');
    data.targets.slice(0, 5).forEach((target, idx) => {
      ctx = need(ctx, 52);
      const tH = 48;
      drawRect(ctx.page, ctx.M, ctx.y, ctx.W - ctx.M * 2, tH, C.lightGreen, C.green);
      drawAccent(ctx.page, ctx.M, ctx.y, tH, C.green);
      drawText(ctx.page, `Цел ${idx + 1}: ${target.name}`, ctx.M + 12, ctx.y - 14, 9.5, ctx.font, C.green, ctx.W - ctx.M * 2 - 16);
      const targetText = target.target_type === 'percentage'
        ? `Намаление с ${target.target_value}% до ${target.target_year} г. | Базова година: ${target.baseline_year}`
        : `Постигане на ${target.target_value} tCO2e до ${target.target_year} г.`;
      drawText(ctx.page, targetText, ctx.M + 12, ctx.y - 28, 8.5, ctx.font, C.darkGray, ctx.W - ctx.M * 2 - 16);
      if (target.description) drawText(ctx.page, target.description, ctx.M + 12, ctx.y - 40, 8, ctx.font, C.gray, ctx.W - ctx.M * 2 - 16);
      ctx = { ...ctx, y: ctx.y - tH - 8 };
    });
  } else {
    ctx = sectionHead(ctx, 'E1-4 §29', 'Планиране на цели');
    ctx = para(ctx, `Количествени цели за намаляване на емисиите са в процес на разработване за следващия отчетен период. Препоръчва се базова цел от -30% от общите емисии до ${data.reportingYear + 5} г. спрямо базовата година ${data.reportingYear}.`);
    ctx = bullet(ctx, 'Краткосрочна цел (1-3 год.): Преминаване към зелена електроенергия (Обхват 2 → 0)');
    ctx = bullet(ctx, 'Средносрочна цел (3-5 год.): Намаляване на Обхват 1 с 20% чрез оптимизация на автопарка');
    ctx = bullet(ctx, 'Дългосрочна цел (5-10 год.): Обвързване с SBTi 1.5°C пътека');
  }
  ctx = spacer(ctx, 8);

  ctx = sectionHead(ctx, 'E1-2', 'Стратегии и планове за преход към нисковъглеродна икономика');
  ctx = para(ctx, 'Ключови стратегически мерки:');
  ctx = bullet(ctx, 'Енергийна ефективност: Одит и инвестиции в ефективно оборудване, сгради и производствени процеси');
  ctx = bullet(ctx, 'Възобновяема енергия: Договор за 100% ВЕИ тарифа и/или собствена фотоволтаична инсталация');
  ctx = bullet(ctx, 'Устойчив транспорт: Постепенна електрификация на служебен автопарк и внедряване на GPS маршрутизиране');
  ctx = bullet(ctx, 'Ангажиране на доставчиците: Изпращане на въглероден въпросник и предпочитание към доставчици с EPD');
  ctx = bullet(ctx, 'Политика за командировки: "Видеоконференция първо" правило за пътувания под 200 км');
  ctx = bullet(ctx, 'Данни и отчитане: Преход от Ниво C към Ниво B за категориите с най-висок дял в Обхват 3');

  // ══════════════════════════════════════════════
  // PAGE — Methodology & Verification
  // ══════════════════════════════════════════════
  ctx = newPage(ctx);
  ctx = titleBand(ctx, '6. МЕТОДОЛОГИЯ И ВЕРИФИКАЦИЯ');
  ctx = spacer(ctx, 8);

  ctx = sectionHead(ctx, 'E1-6 §51', 'Методология на изчисленията');
  const methItems: [string, string][] = [
    ['Обхват 1 & 2', 'Измерени/отчетени количества, умножени по стандартни емисионни фактори (kg CO2e/единица).'],
    ['Обхват 3 Кат. 1', 'EXIOBASE v3 (2023) EEIO фактори — разходно-базиран метод. EUR разходи x фактор = kg CO2e.'],
    ['Обхват 3 Кат. 4/5', 'DEFRA 2024 — тонокилометри или разходи, умножени по транспортни/отпадъчни фактори.'],
    ['Обхват 3 Кат. 6/7', 'DEFRA 2024 — пътнически километри или разходи, умножени по транспортни фактори.'],
    ['GWP стойности', 'AR5 100-годишен потенциал за затопляне (CO2=1, CH4=28, N2O=265, HFC варира по вид).'],
    ['Консолидация', 'Оперативен контрол — 100% от емисиите в контролирани обекти.'],
  ];

  const mTotalW = ctx.W - ctx.M * 2;
  const mColW = [mTotalW * 0.28, mTotalW * 0.72];
  const mRH = 20;

  ctx = need(ctx, mRH * (methItems.length + 1));
  drawRect(ctx.page, ctx.M, ctx.y, mTotalW, mRH, C.navy);
  drawText(ctx.page, 'Компонент', ctx.M + 6, ctx.y - 13, 8, ctx.font, C.white);
  drawText(ctx.page, 'Методология / Стандарт', ctx.M + mColW[0] + 6, ctx.y - 13, 8, ctx.font, C.white);
  ctx.y -= mRH;

  methItems.forEach(([comp, meth], i) => {
    ctx = need(ctx, mRH);
    drawRect(ctx.page, ctx.M, ctx.y, mTotalW, mRH, i % 2 === 0 ? C.row1 : C.row2);
    drawText(ctx.page, comp, ctx.M + 6, ctx.y - 13, 8, ctx.font, C.navy, mColW[0] - 10);
    drawText(ctx.page, meth, ctx.M + mColW[0] + 6, ctx.y - 13, 7.5, ctx.font, C.darkGray, mColW[1] - 10);
    ctx.y -= mRH;
  });
  ctx = spacer(ctx, 10);

  ctx = sectionHead(ctx, 'E1-6 §52', 'Несигурност и ограничения');
  ctx = para(ctx, 'Оценките на Обхват 3 (Ниво C) имат по-висока несигурност (±15-30%) в сравнение с Обхват 1 и 2 (±5-10%). Причините включват:');
  ctx = bullet(ctx, 'Разходно-базираният метод (Ниво C) използва средни индустриални фактори, а не специфични за доставчика данни');
  ctx = bullet(ctx, 'Валутни конверсии и сезонни вариации в разходите могат да доведат до отклонения');
  ctx = bullet(ctx, 'Липсващи физически данни (кг, км, kWh) за някои транзакции');
  ctx = para(ctx, 'Мерки за подобряване на точността: Събиране на физически данни за Топ 10 доставчика; преминаване към Ниво B за най-значимите категории.');
  ctx = spacer(ctx, 8);

  ctx = sectionHead(ctx, 'ESRS 2 §120', 'Вътрешен контрол и верификация');
  ctx = para(ctx, 'Система за вътрешен контрол:');
  ctx = bullet(ctx, 'Документирани процедури за събиране на данни с ясни отговорности');
  ctx = bullet(ctx, 'Четириочно проверяване: Данните се въвеждат от отговорно лице и се преглеждат от ръководството');
  ctx = bullet(ctx, 'Архивиране на първичните документи (фактури, измервания) за минимум 5 години');
  ctx = spacer(ctx, 4);
  ctx = para(ctx, 'Статус на външна верификация: Отчетът не е подложен на независима трета-страна верификация. Компанията планира да търси ограничена (limited) или разумна (reasonable) верификация в съответствие с ISAE 3410 за следващия отчетен период.');
  ctx = spacer(ctx, 10);

  // ── Signature block ──
  ctx = need(ctx, 80);
  ctx = spacer(ctx, 12);
  const lineY = ctx.y;
  drawLine(ctx.page, ctx.M, lineY, ctx.W / 2 - 20);
  drawLine(ctx.page, ctx.W / 2 + 20, lineY, ctx.W - ctx.M);
  drawText(ctx.page, 'Подпис и печат — Изпълнителен директор', ctx.M, lineY - 14, 8, font, C.gray);
  drawText(ctx.page, 'Дата:', ctx.W / 2 - 38, lineY - 14, 8, font, C.gray);
  drawText(ctx.page, 'Подпис — Отговорник по устойчивост', ctx.W / 2 + 20, lineY - 14, 8, font, C.gray);
  ctx.y -= 40;

  // ── ESRS declaration box ──
  ctx = need(ctx, 44);
  ctx = spacer(ctx, 8);
  drawRect(ctx.page, ctx.M, ctx.y, ctx.W - ctx.M * 2, 38, C.navyLight, C.navy);
  drawText(ctx.page, 'Декларация за съответствие с ESRS E1', ctx.M + 10, ctx.y - 12, 8.5, font, C.navy, ctx.W - ctx.M * 2 - 14);
  drawText(ctx.page, `Настоящото разкриване е изготвено в съответствие с изискванията на ESRS E1 (Регламент (ЕС) 2023/2772) и GHG Protocol.`, ctx.M + 10, ctx.y - 25, 8, font, C.darkGray, ctx.W - ctx.M * 2 - 14);
  drawText(ctx.page, `Отчетна година: ${data.reportingYear} г.  |  Изготвил: ${data.generatedBy || PDF_PLATFORM_NAME}  |  Дата: ${today}`, ctx.M + 10, ctx.y - 36, 7.5, font, C.gray, ctx.W - ctx.M * 2 - 14);

  // ── Retroactively add footer to page 1 (now we know total pages) ──
  const totalPages = pdfDoc.getPageCount();
  addFooter(firstPage, font, W, 1, totalPages);

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}
