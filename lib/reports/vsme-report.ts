/**
 * VSME доброволен отчет — подробен human-readable PDF.
 */

import { PDFDocument, rgb, PDFPage, PDFFont } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import type { VsmeReportBundle } from '@/lib/vsme/report-bundle';
import type { VsmeDisclosureStatus } from '@/lib/vsme/disclosure-registry';
import {
  PDF_PLATFORM_NAME,
  PDF_TCO2E,
  pdfSafeText,
  pdfVsmeDisclosureNote,
} from './pdf-text';
import { drawPanel, drawAccentBar, fillRounded, drawRect, R } from './pdf-shapes';

const C = {
  darkGreen: rgb(0.031, 0.176, 0.086),
  green: rgb(0.059, 0.390, 0.196),
  lightGreen: rgb(0.878, 0.965, 0.902),
  indigo: rgb(0.22, 0.28, 0.55),
  lightIndigo: rgb(0.91, 0.92, 0.98),
  violet: rgb(0.38, 0.22, 0.58),
  gray: rgb(0.42, 0.42, 0.42),
  lightGray: rgb(0.94, 0.94, 0.94),
  nearWhite: rgb(0.976, 0.980, 0.984),
  white: rgb(1, 1, 1),
  black: rgb(0, 0, 0),
  amber: rgb(0.82, 0.51, 0),
  lightAmber: rgb(0.996, 0.961, 0.878),
  red: rgb(0.78, 0.1, 0.1),
  lightRed: rgb(0.992, 0.878, 0.878),
  divider: rgb(0.82, 0.831, 0.855),
  row1: rgb(0.972, 0.976, 0.980),
  row2: rgb(1, 1, 1),
};

const STATUS_COLOR: Record<VsmeDisclosureStatus, ReturnType<typeof rgb>> = {
  complete: C.green,
  partial: C.amber,
  missing: C.red,
  na: C.gray,
};
const STATUS_BG: Record<VsmeDisclosureStatus, ReturnType<typeof rgb>> = {
  complete: C.lightGreen,
  partial: C.lightAmber,
  missing: C.lightRed,
  na: C.lightGray,
};
const STATUS_LABEL: Record<VsmeDisclosureStatus, string> = {
  complete: 'ГОТОВО',
  partial: 'ЧАСТИЧНО',
  missing: 'ЛИПСВА',
  na: 'Н/П',
};

interface Ctx {
  pdfDoc: PDFDocument;
  font: PDFFont;
  page: PDFPage;
  y: number;
  pageNum: number;
  W: number;
  H: number;
  M: number;
}

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

function drawFooter(page: PDFPage, font: PDFFont, W: number, n: number, standard: string) {
  page.drawLine({ start: { x: 40, y: 44 }, end: { x: W - 40, y: 44 }, thickness: 0.5, color: C.divider });
  drawText(page, `VSME отчет · ${standard}`, 40, 30, 7.5, font, C.gray);
  drawText(page, `Страница ${n}`, W - 70, 30, 7.5, font, C.gray);
}

function newPage(ctx: Ctx, standard: string): Ctx {
  const page = ctx.pdfDoc.addPage([ctx.W, ctx.H]);
  ctx.pageNum += 1;
  drawFooter(page, ctx.font, ctx.W, ctx.pageNum, standard);
  return { ...ctx, page, y: ctx.H - 56 };
}

function need(ctx: Ctx, h: number, standard: string): Ctx {
  return ctx.y - h < 65 ? newPage(ctx, standard) : ctx;
}

function titleBand(ctx: Ctx, label: string, color: ReturnType<typeof rgb>, standard: string): Ctx {
  const bTop = ctx.y + 10;
  drawRect(ctx.page, 0, bTop, ctx.W, 36, color);
  ctx.page.drawRectangle({ x: 0, y: bTop - 36, width: 6, height: 36, color: C.white, opacity: 0.25 });
  drawText(ctx.page, label, 46, bTop - 23, 12, ctx.font, C.white);
  return { ...ctx, y: ctx.y - 36 };
}

function sectionHead(ctx: Ctx, label: string, subtitle: string | undefined, standard: string): Ctx {
  const subLines = subtitle ? wrapText(ctx.font, subtitle, 8, ctx.W - ctx.M * 2 - 14) : [];
  const bH = 28 + subLines.length * 12;
  ctx = need(ctx, bH + 12, standard);
  const { page, y, M, W } = ctx;
  drawPanel(page, M, y, W - M * 2, bH, C.lightGreen, C.green, 0.5, R.md);
  drawAccentBar(page, M, y, bH, C.darkGreen);
  drawText(page, label, M + 10, y - 15, 10.5, ctx.font, C.darkGreen, W - M * 2 - 14);
  subLines.forEach((l, i) => drawText(page, l, M + 10, y - 28 - i * 12, 8, ctx.font, C.gray));
  return { ...ctx, y: y - bH - 10 };
}

function para(ctx: Ctx, text: string, standard: string, indent = 0): Ctx {
  const lH = 13;
  const lines = wrapText(ctx.font, text, 8.5, ctx.W - ctx.M * 2 - indent);
  for (const line of lines) {
    ctx = need(ctx, lH + 3, standard);
    drawText(ctx.page, line, ctx.M + indent, ctx.y - 11, 8.5, ctx.font, C.gray);
    ctx = { ...ctx, y: ctx.y - lH };
  }
  return { ...ctx, y: ctx.y - 2 };
}

function bullet(ctx: Ctx, text: string, standard: string, col = C.green): Ctx {
  const lH = 13;
  const lines = wrapText(ctx.font, text, 8, ctx.W - ctx.M * 2 - 20);
  lines.forEach((line, i) => {
    ctx = need(ctx, lH + 2, standard);
    if (i === 0) drawText(ctx.page, '\u2022', ctx.M + 6, ctx.y - 11, 9, ctx.font, col);
    drawText(ctx.page, line, ctx.M + 18, ctx.y - 11, 8, ctx.font, C.gray);
    ctx = { ...ctx, y: ctx.y - lH };
  });
  return ctx;
}

function spacer(ctx: Ctx, px = 10): Ctx {
  return { ...ctx, y: ctx.y - px };
}

function readinessLabel(score: number): string {
  if (score >= 80) return 'Висока готовност';
  if (score >= 50) return 'Средна готовност — нужни допълнения';
  if (score >= 25) return 'Ниска готовност — значителни пропуски';
  return 'Начална фаза — попълнете основните теми';
}

function statusBadge(page: PDFPage, status: VsmeDisclosureStatus, x: number, midY: number, font: PDFFont) {
  const bW = 62;
  const bH = 16;
  drawPanel(page, x, midY + bH / 2, bW, bH, STATUS_BG[status], STATUS_COLOR[status], 0.5, R.sm);
  const label = STATUS_LABEL[status];
  const lW = font.widthOfTextAtSize(label, 7);
  drawText(page, label, x + (bW - lW) / 2, midY - 2.5, 7, font, STATUS_COLOR[status]);
}

function categorySummary(ctx: Ctx, standard: string): Ctx {
  const data = (ctx as Ctx & { bundle?: VsmeReportBundle }).bundle;
  if (!data) return ctx;

  const categories = [...new Set(data.disclosures.map(d => d.categoryBg))];
  const { M, W } = ctx;
  const count = Math.min(categories.length, 4);
  const boxW = count > 0 ? (W - M * 2 - (count - 1) * 6) / count : 0;
  const boxH = 52;

  ctx = need(ctx, boxH + 16, standard);
  categories.slice(0, 4).forEach((cat, i) => {
    const items = data.disclosures.filter(d => d.categoryBg === cat);
    const done = items.filter(d => d.status === 'complete').length;
    const cx = M + i * (boxW + 6);
    drawPanel(ctx.page, cx, ctx.y, boxW, boxH, C.nearWhite, C.indigo, 0.4, R.sm);
    drawText(ctx.page, cat, cx + 6, ctx.y - 14, 7.5, ctx.font, C.indigo, boxW - 10);
    drawText(ctx.page, `${done}/${items.length} готови`, cx + 6, ctx.y - 30, 11, ctx.font, C.darkGreen);
    const pct = items.length ? Math.round((done / items.length) * 100) : 0;
    drawText(ctx.page, `${pct}%`, cx + 6, ctx.y - 44, 8, ctx.font, C.gray);
  });
  return { ...ctx, y: ctx.y - boxH - 12 };
}

function disclosureTable(ctx: Ctx, standard: string): Ctx {
  const data = (ctx as Ctx & { bundle?: VsmeReportBundle }).bundle;
  if (!data) return ctx;

  const { M, W } = ctx;
  const totalW = W - M * 2;
  const cols = [totalW * 0.12, totalW * 0.30, totalW * 0.14, totalW * 0.44];
  const headers = ['Код', 'Тема', 'Статус', 'Бележка'];
  const rH = 24;

  ctx = need(ctx, rH * 2, standard);
  drawPanel(ctx.page, M, ctx.y, totalW, rH, C.indigo, C.indigo, 0, R.sm);
  let hx = M;
  headers.forEach((h, i) => {
    drawText(ctx.page, h, hx + 5, ctx.y - 16, 8, ctx.font, C.white);
    hx += cols[i];
  });
  ctx.y -= rH;

  data.disclosures.forEach((row, i) => {
    const pdfNote = pdfVsmeDisclosureNote(row.id, row.status, row.note);
    const titleLines = wrapText(ctx.font, row.titleBg, 8, cols[1] - 10);
    const noteLines = wrapText(ctx.font, pdfNote, 7.5, cols[3] - 10);
    const maxLines = Math.max(titleLines.length, noteLines.length, 1);
    const dynH = Math.max(rH, maxLines * 12 + 10);

    ctx = need(ctx, dynH, standard);
    drawRect(ctx.page, M, ctx.y, totalW, dynH, i % 2 === 0 ? C.row1 : C.row2);
    ctx.page.drawRectangle({ x: M, y: ctx.y - dynH, width: 3, height: dynH, color: STATUS_COLOR[row.status] });

    let rx = M;
    drawText(ctx.page, row.code, rx + 6, ctx.y - 14, 8, ctx.font, C.indigo);
    rx += cols[0];
    titleLines.forEach((l, li) => drawText(ctx.page, l, rx + 5, ctx.y - 12 - li * 12, 8, ctx.font, C.black, cols[1] - 10));
    rx += cols[1];
    statusBadge(ctx.page, row.status, rx + 4, ctx.y - dynH / 2, ctx.font);
    rx += cols[2];
    noteLines.forEach((l, li) => drawText(ctx.page, l, rx + 5, ctx.y - 12 - li * 12, 7.5, ctx.font, C.gray, cols[3] - 10));

    ctx.y -= dynH;
  });

  return ctx;
}

export async function generateVsmeReport(data: VsmeReportBundle, generatedBy?: string): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const fontUrl = 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5WZLCzYlKw.ttf';
  const fontBytes = await fetch(fontUrl).then(r => r.arrayBuffer());
  const font = await pdfDoc.embedFont(fontBytes);

  const W = 595;
  const H = 842;
  const M = 45;
  const standard = data.standardVersion;
  const today = new Date().toLocaleDateString('bg-BG', { day: 'numeric', month: 'long', year: 'numeric' });
  const grandTotal = data.footprint.total;
  const scoreCol = data.readinessScore >= 75 ? C.green : data.readinessScore >= 50 ? C.amber : C.red;

  // ══════════════════════════════════════════════
  // PAGE 1 — Cover
  // ══════════════════════════════════════════════
  const firstPage = pdfDoc.addPage([W, H]);
  let ctx: Ctx & { bundle?: VsmeReportBundle } = {
    pdfDoc, font, page: firstPage, y: H - 56, pageNum: 1, W, H, M, bundle: data,
  };
  drawFooter(firstPage, font, W, 1, standard);

  // Accent stripe
  firstPage.drawRectangle({ x: 0, y: H - 6, width: W, height: 6, color: C.violet });

  const HDR = 200;
  drawRect(firstPage, 0, H - 6, W, HDR, C.darkGreen);
  firstPage.drawRectangle({ x: 0, y: H - HDR, width: 6, height: HDR - 6, color: C.lightGreen, opacity: 0.3 });

  drawText(firstPage, 'VSME', M + 4, H - HDR + 130, 11, font, C.lightGreen);
  drawText(firstPage, 'ДОБРОВОЛЕН ОТЧЕТ', M + 4, H - HDR + 108, 22, font, C.white);
  drawText(firstPage, 'ЗА УСТОЙЧИВОСТ НА МСП', M + 4, H - HDR + 82, 22, font, C.white);
  drawText(
    firstPage,
    `Voluntary SME Standard (EFRAG)  ·  ${data.reportingYear} г.`,
    M + 4,
    H - HDR + 58,
    9.5,
    font,
    rgb(0.78, 0.92, 0.82),
  );

  // Company box
  const cbTop = H - HDR - 14;
  drawPanel(firstPage, M, cbTop, W - M * 2, 72, C.white, C.divider, 0.5, R.lg);
  drawAccentBar(firstPage, M, cbTop, 72, C.green);
  drawText(firstPage, data.company.company_name, M + 12, cbTop - 20, 16, font, C.darkGreen, W - M * 2 - 16);
  const infoParts: string[] = [];
  if (data.company.registration_number) infoParts.push(`ЕИК: ${data.company.registration_number}`);
  if (data.company.industry_sector) infoParts.push(`Сектор: ${data.company.industry_sector}`);
  if (data.company.employee_count) infoParts.push(`Служители: ${data.company.employee_count}`);
  if (data.company.baseline_year) infoParts.push(`Базова година: ${data.company.baseline_year}`);
  drawText(firstPage, infoParts.join('   |   '), M + 12, cbTop - 38, 8.5, font, C.gray, W - M * 2 - 16);
  drawText(
    firstPage,
    `Генериран: ${today}${generatedBy ? `   |   ${generatedBy}` : ''}`,
    M + 12,
    cbTop - 56,
    8,
    font,
    C.gray,
  );

  // Readiness banner
  const scoreBanTop = cbTop - 72 - 14;
  drawPanel(firstPage, M, scoreBanTop, W - M * 2, 88, C.nearWhite, C.divider, 0.5, R.lg);
  drawAccentBar(firstPage, M, scoreBanTop, 88, scoreCol);
  drawText(firstPage, 'ИНДЕКС НА VSME ГОТОВНОСТ', M + 12, scoreBanTop - 14, 8, font, C.gray);
  drawText(firstPage, '(автоматична оценка на наличните данни — не е официален одит)', M + 12, scoreBanTop - 26, 7, font, C.gray, W - M * 2 - 16);
  const scoreStr = `${data.readinessScore}%`;
  drawText(firstPage, scoreStr, M + 12, scoreBanTop - 54, 30, font, scoreCol);
  drawText(
    firstPage,
    readinessLabel(data.readinessScore),
    M + 12 + font.widthOfTextAtSize(scoreStr, 30) + 10,
    scoreBanTop - 46,
    9,
    font,
    scoreCol,
    W - M * 2 - 120,
  );
  drawText(
    firstPage,
    `${data.complete} готови · ${data.partial} частични · ${data.missing} липсващи · от ${data.applicableTotal} приложими теми`,
    M + 12,
    scoreBanTop - 72,
    7.5,
    font,
    C.gray,
    W - M * 2 - 16,
  );
  const pbW = W - M * 2 - 16;
  fillRounded(firstPage, M + 8, scoreBanTop - 82, pbW, 8, R.sm, C.lightGray);
  if (data.readinessScore > 0) fillRounded(firstPage, M + 8, scoreBanTop - 82, Math.round((data.readinessScore / 100) * pbW), 8, R.sm, scoreCol);

  // Emissions boxes
  const boxAreaTop = scoreBanTop - 88 - 14;
  const boxH = 96;
  const boxGap = 7;
  const boxW = (W - M * 2 - boxGap * 2) / 3;
  [
    { label: 'Обхват 1', sub: 'Директни емисии', val: data.footprint.scope1, color: C.green, bg: C.lightGreen },
    { label: 'Обхват 2', sub: 'Закупена енергия', val: data.footprint.scope2, color: rgb(0.114, 0.337, 0.761), bg: rgb(0.875, 0.910, 0.988) },
    { label: 'Обхват 3', sub: 'Верига на стойността', val: data.footprint.scope3, color: rgb(0.78, 0.29, 0.059), bg: rgb(0.988, 0.929, 0.910) },
  ].forEach(({ label, sub, val, color, bg }, i) => {
    const cx = M + i * (boxW + boxGap);
    drawPanel(firstPage, cx, boxAreaTop, boxW, boxH, bg, color, 0.5, R.md, 5);
    drawText(firstPage, label, cx + 10, boxAreaTop - 15, 10, font, color, boxW - 14);
    drawText(firstPage, sub, cx + 10, boxAreaTop - 28, 7, font, C.gray, boxW - 14);
    drawText(firstPage, val.toFixed(3), cx + 10, boxAreaTop - 56, 18, font, color);
    drawText(firstPage, PDF_TCO2E, cx + 10, boxAreaTop - 72, 8, font, C.gray);
    const pct = grandTotal > 0 ? ((val / grandTotal) * 100).toFixed(0) : '0';
    drawText(firstPage, `${pct}% от общото`, cx + 10, boxAreaTop - 84, 7.5, font, color);
  });

  const legTop = boxAreaTop - boxH - 12;
  drawPanel(firstPage, M, legTop, W - M * 2, 34, C.lightIndigo, C.indigo, 0.5, R.md);
  drawText(firstPage, 'ОБЩ ВЪГЛЕРОДЕН ОТПЕЧАТЪК:', M + 10, legTop - 12, 9, font, C.indigo);
  drawText(firstPage, `${grandTotal.toFixed(3)} ${PDF_TCO2E}`, M + 180, legTop - 12, 12, font, C.indigo);
  const intensity = data.company.employee_count && data.company.employee_count > 0
    ? (grandTotal / data.company.employee_count).toFixed(3)
    : null;
  if (intensity) {
    drawText(firstPage, `Интензивност: ${intensity} ${PDF_TCO2E}/служител`, M + 10, legTop - 26, 8, font, C.gray);
  }

  // Route callout
  const routeTop = legTop - 34 - 12;
  drawPanel(firstPage, M, routeTop, W - M * 2, 36, C.nearWhite, C.violet, 0.5, R.md);
  drawAccentBar(firstPage, M, routeTop, 36, C.violet);
  drawText(firstPage, data.suggestedRoute, M + 12, routeTop - 14, 9, font, C.violet, W - M * 2 - 16);
  drawText(firstPage, `Стандарт: ${standard}`, M + 12, routeTop - 28, 7.5, font, C.gray);

  // ══════════════════════════════════════════════
  // PAGE 2 — What is VSME
  // ══════════════════════════════════════════════
  ctx = newPage(ctx, standard);
  ctx = titleBand(ctx, '1. КАКВО Е VSME И ЗАЩО Е ВАЖЕН', C.violet, standard);
  ctx = spacer(ctx, 10);

  ctx = sectionHead(ctx, 'Въведение в стандарта', undefined, standard);
  ctx = para(
    ctx,
    'VSME (Voluntary Sustainability Reporting Standard for SMEs) е доброволен стандарт на EFRAG (European Financial Reporting Advisory Group), публикуван през 2024–2025 г. Той дава на малките и средни предприятия (МСП) ясна, достъпна рамка за отчетност по устойчивост — без пълната сложност на ESRS за големите компании по CSRD.',
    standard,
  );
  ctx = para(
    ctx,
    'VSME е особено подходящ за български МСП, които не попадат в задължителния CSRD обхват (обикновено под 250 служители и под определени прагове по оборот), но искат да демонстрират ESG ангажимент пред банки, клиенти, инвеститори и доставчици.',
    standard,
  );
  ctx = spacer(ctx, 6);

  ctx = sectionHead(ctx, 'Основни модули на VSME', 'Basic Module (B) и Comprehensive Module (C)', standard);
  ctx = bullet(ctx, 'Basic Module (B1–B11): профил на компанията, емисии и енергия, локации, персонал, здраве и безопасност, управление.', standard);
  ctx = bullet(ctx, 'Comprehensive Module (C1–C9): цели за намаляване, климатични стратегии, допълнителни социални и управленски теми.', standard);
  ctx = bullet(ctx, 'Отчетът оценява ключови теми от двата модула на база наличните данни за емисии, цели, стратегии и профил на компанията.', standard);
  ctx = spacer(ctx, 6);

  ctx = sectionHead(ctx, 'Ползи от VSME отчетността', undefined, standard);
  ctx = bullet(ctx, 'Структуриран ESG отчет, разбираем за партньори и финансиращи институции.', standard);
  ctx = bullet(ctx, 'Подготовка за бъдещ CSRD обхват — данните могат да се пренасят към пълен ESRS отчет.', standard);
  ctx = bullet(ctx, 'Прозрачност по емисии (Обхват 1, 2 и 3) в съответствие с GHG Protocol.', standard);
  ctx = bullet(ctx, 'Документиране на социални и управленски политики (БЗР, анти-корупция).', standard);
  ctx = spacer(ctx, 6);

  ctx = sectionHead(ctx, 'VSME срещу CSRD', undefined, standard);
  ctx = para(
    ctx,
    'CSRD (Corporate Sustainability Reporting Directive) задължава големи компании да публикуват ESRS отчети. VSME е доброволна, опростена рамка за МСП — същите теми (емисии, цели, социални аспекти), но без пълния ESRS обем. Данните в ZED могат да се използват и за VSME, и за CSRD/ESRS E1 отчети.',
    standard,
  );
  ctx = spacer(ctx, 6);

  ctx = sectionHead(ctx, 'Как да четете този отчет', undefined, standard);
  ctx = para(
    ctx,
    'Следващите страници показват детайлен контролен списък по VSME теми, текущите емисии, активни цели и стратегии, както и социалните раздели. Статусите „Готово“, „Частично“ и „Липсва“ отразяват колко пълно е документирана всяка тема.',
    standard,
  );

  // ══════════════════════════════════════════════
  // PAGE 3 — Disclosure checklist
  // ══════════════════════════════════════════════
  ctx = newPage(ctx, standard);
  ctx = titleBand(ctx, '2. КОНТРОЛЕН СПИСЪК ПО VSME ТЕМИ', C.indigo, standard);
  ctx = spacer(ctx, 8);
  ctx = sectionHead(ctx, 'Обобщение по категории', 'Климат · Компания · Хора · Управление', standard);
  ctx = categorySummary(ctx, standard);
  ctx = spacer(ctx, 6);
  ctx = disclosureTable(ctx, standard);
  ctx = spacer(ctx, 10);

  const missingItems = data.disclosures.filter(d => d.status === 'missing' || d.status === 'partial');
  if (missingItems.length > 0) {
    ctx = sectionHead(ctx, 'Приоритетни действия', 'Теми, които изискват допълнителни данни', standard);
    missingItems.slice(0, 8).forEach((item, idx) => {
      const priority = item.status === 'missing' ? 'висок' : 'среден';
      const col = priority === 'висок' ? C.red : C.amber;
      const note = pdfVsmeDisclosureNote(item.id, item.status, item.note);
      ctx = bullet(ctx, `[${item.code}] ${item.titleBg} — ${note} (приоритет: ${priority})`, standard, col);
      if (idx >= 7) return;
    });
  }

  // ══════════════════════════════════════════════
  // PAGE 4 — Targets, strategies, manual
  // ══════════════════════════════════════════════
  ctx = newPage(ctx, standard);
  ctx = titleBand(ctx, '3. ЦЕЛИ, СТРАТЕГИИ И СОЦИАЛНИ РАЗДЕЛИ', C.darkGreen, standard);
  ctx = spacer(ctx, 8);

  ctx = sectionHead(ctx, 'Активни цели за намаляване', undefined, standard);
  if (data.targets.length > 0) {
    data.targets.forEach(t => {
      ctx = bullet(ctx, `${t.name}: −${t.target_value}% до ${t.target_year} г.`, standard);
    });
  } else {
    ctx = para(ctx, 'Няма активни цели. Препоръчва се задаване на поне една количествена цел за намаляване на емисиите с базова година.', standard);
  }
  ctx = spacer(ctx, 6);

  ctx = sectionHead(ctx, 'Стратегии и инициативи', undefined, standard);
  if (data.strategies.length > 0) {
    data.strategies.slice(0, 10).forEach(s => {
      ctx = bullet(ctx, `${s.title} (${s.category}) — статус: ${s.status}`, standard);
    });
  } else {
    ctx = para(ctx, 'Няма документирани стратегии. Препоръчва се описание на конкретни мерки за намаляване на емисиите (енергийна ефективност, ВЕИ, оптимизация на флота и др.).', standard);
  }
  ctx = spacer(ctx, 6);

  ctx = sectionHead(ctx, 'Здраве и безопасност на работа (B10)', 'Ръчно попълнен раздел', standard);
  const m = data.manual;
  if (m) {
    ctx = para(ctx, m.health_safety_has_policy === true ? 'Има писмена политика по БЗР: Да' : m.health_safety_has_policy === false ? 'Има писмена политика по БЗР: Не' : 'Има писмена политика по БЗР: Не е попълнено', standard);
    if (m.health_safety_description) {
      ctx = para(ctx, `Описание: ${m.health_safety_description}`, standard);
    }
    if (m.health_safety_responsible_person) {
      ctx = para(ctx, `Отговорник: ${m.health_safety_responsible_person}`, standard);
    }
    if (m.health_safety_training_frequency) {
      ctx = para(ctx, `Честота на обучения: ${m.health_safety_training_frequency}`, standard);
    }
    if (m.health_safety_incidents != null) {
      ctx = para(ctx, `Регистрирани инциденти за ${data.reportingYear} г.: ${m.health_safety_incidents}`, standard);
    }
  } else {
    ctx = para(ctx, 'Разделът не е документиран. Опишете политика по здраве и безопасност, мерки, инструктажи и регистрирани инциденти за отчетната година.', standard);
  }
  ctx = spacer(ctx, 6);

  ctx = sectionHead(ctx, 'Корупция и подкуп (B11-G)', 'Ръчно попълнен раздел', standard);
  if (m) {
    ctx = para(ctx, m.anti_corruption_has_policy === true ? 'Има политика срещу корупция: Да' : m.anti_corruption_has_policy === false ? 'Има политика срещу корупция: Не' : 'Има политика срещу корупция: Не е попълнено', standard);
    if (m.anti_corruption_description) {
      ctx = para(ctx, `Описание: ${m.anti_corruption_description}`, standard);
    }
    ctx = para(ctx, m.anti_corruption_whistleblower === true ? 'Канал за сигнали (whistleblowing): Да' : m.anti_corruption_whistleblower === false ? 'Канал за сигнали: Не' : 'Канал за сигнали: Не е попълнено', standard);
  } else {
    ctx = para(ctx, 'Разделът не е документиран. Опишете политика срещу корупция и подкуп, обучения и канал за сигнали (whistleblowing).', standard);
  }

  // ══════════════════════════════════════════════
  // PAGE 5 — Methodology & disclaimer
  // ══════════════════════════════════════════════
  ctx = newPage(ctx, standard);
  ctx = titleBand(ctx, '4. МЕТОДОЛОГИЯ И ОГРАНИЧЕНИЯ', C.gray, standard);
  ctx = spacer(ctx, 10);

  ctx = sectionHead(ctx, 'Методология на изчисленията', undefined, standard);
  ctx = para(ctx, `Емисиите се изчисляват по формулата: CO2e = Дейност x Емисионен фактор x GWP (за хладилни агенти). Използвани са български/EU емисионни фактори. Обхват 1 и 2 идват от директни записи; Обхват 3 — от транзакции и категорийни изчисления.`, standard);
  ctx = para(ctx, `Отчетна година: ${data.reportingYear}. VSME стандарт: ${standard}.`, standard);
  ctx = spacer(ctx, 6);

  ctx = sectionHead(ctx, 'Важно уточнение', undefined, standard);
  ctx = para(ctx, `Този документ е автоматично генериран от ${PDF_PLATFORM_NAME} и не представлява официален VSME/ESRS одит или правен съвет. Преди публикуване или подаване към трети страни препоръчваме преглед от отговорно лице и при необходимост консултация със сертификационен орган или одитор.`, standard);
  ctx = para(ctx, 'За пълна регулаторна оценка (ЗООС, CSRD, EU ETS) препоръчваме допълнителен отчет за съответствие.', standard);

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}
