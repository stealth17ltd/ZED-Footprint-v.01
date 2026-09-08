/**
 * Удостоверение за устойчивост — one-page sustainability attestation
 * Premium single-page A4 certificate suitable for display or sharing.
 * Design: Ornate double-border frame, centered layout, gold & green palette.
 */

import { PDFDocument, rgb, PDFPage, PDFFont, degrees } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { PDF_PLATFORM_NAME, pdfSafeText } from './pdf-text';
import { drawPanel, fillRounded, drawRect, R } from './pdf-shapes';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface CertificateData {
  company: {
    company_name: string;
    registration_number?: string;
    industry_sector?: string;
    employee_count?: number;
  };
  reportingYear: number;
  scope1Total: number;
  scope2Total: number;
  scope3Total: number;
  scope3Available: boolean;
  certNumber: string;
  generatedBy?: string;
}

// ─────────────────────────────────────────────
// Colors — gold & deep green premium palette
// ─────────────────────────────────────────────

const C = {
  deepGreen: rgb(0.031, 0.176, 0.086),
  green:     rgb(0.059, 0.390, 0.196),
  medGreen:  rgb(0.118, 0.510, 0.255),
  lightGreen:rgb(0.878, 0.961, 0.902),
  gold:      rgb(0.682, 0.510, 0.024),
  goldLight: rgb(0.957, 0.906, 0.745),
  goldPale:  rgb(0.988, 0.969, 0.922),
  ivory:     rgb(0.992, 0.988, 0.969),
  white:     rgb(1, 1, 1),
  gray:      rgb(0.420, 0.420, 0.420),
  darkGray:  rgb(0.180, 0.180, 0.180),
  black:     rgb(0, 0, 0),
};

// ─────────────────────────────────────────────
// Drawing helpers
// ─────────────────────────────────────────────

function drawText(page: PDFPage, text: string, x: number, y: number, size: number,
  font: PDFFont, color = C.black, align: 'left' | 'center' | 'right' = 'left', availableWidth?: number) {
  const t = pdfSafeText((text ?? '').toString());
  if (!t) return;
  if (align === 'center' && availableWidth) {
    const tw = font.widthOfTextAtSize(t, size);
    page.drawText(t, { x: x + (availableWidth - tw) / 2, y, size, font, color });
  } else if (align === 'right' && availableWidth) {
    const tw = font.widthOfTextAtSize(t, size);
    page.drawText(t, { x: x + availableWidth - tw, y, size, font, color });
  } else {
    page.drawText(t, { x, y, size, font, color });
  }
}

function drawCenteredText(page: PDFPage, text: string, y: number, size: number,
  font: PDFFont, color: ReturnType<typeof rgb>, W: number) {
  const tw = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: (W - tw) / 2, y, size, font, color });
}

function drawLine(page: PDFPage, x1: number, y1: number, x2: number, y2: number,
  color: ReturnType<typeof rgb>, thick = 0.8) {
  page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness: thick, color });
}

// ─────────────────────────────────────────────
// Decorative helpers
// ─────────────────────────────────────────────

/** Draw an ornate double-line rectangular border */
function drawDoubleBorder(page: PDFPage, W: number, H: number) {
  const o1 = 12; // outer border offset
  const o2 = 18; // inner border offset

  // Outer thick gold border
  const thick1 = 2.5;
  drawLine(page, o1, H - o1, W - o1, H - o1, C.gold, thick1);
  drawLine(page, o1, o1, W - o1, o1, C.gold, thick1);
  drawLine(page, o1, H - o1, o1, o1, C.gold, thick1);
  drawLine(page, W - o1, H - o1, W - o1, o1, C.gold, thick1);

  // Inner thin green border
  const thick2 = 0.8;
  drawLine(page, o2, H - o2, W - o2, H - o2, C.green, thick2);
  drawLine(page, o2, o2, W - o2, o2, C.green, thick2);
  drawLine(page, o2, H - o2, o2, o2, C.green, thick2);
  drawLine(page, W - o2, H - o2, W - o2, o2, C.green, thick2);

  // Corner decorations — small gold squares at each corner
  const cs = 8; // corner square size
  const corners = [
    [o1 - cs / 2, H - o1 - cs / 2],
    [W - o1 - cs / 2, H - o1 - cs / 2],
    [o1 - cs / 2, o1 - cs / 2],
    [W - o1 - cs / 2, o1 - cs / 2],
  ] as [number, number][];
  corners.forEach(([cx, cy]) => {
    page.drawRectangle({ x: cx, y: cy, width: cs, height: cs, color: C.gold });
    page.drawRectangle({ x: cx + 1.5, y: cy + 1.5, width: cs - 3, height: cs - 3, color: C.ivory });
  });

  // Mid-side small diamond ornaments
  const midH = H / 2;
  const midW = W / 2;
  const diamondSize = 5;
  [
    [o1 - diamondSize / 2, midH],
    [W - o1 - diamondSize / 2, midH],
    [midW - diamondSize / 2, H - o1],
    [midW - diamondSize / 2, o1],
  ].forEach(([dx, dy]) => {
    page.drawRectangle({ x: dx as number, y: (dy as number) - diamondSize / 2, width: diamondSize, height: diamondSize, color: C.gold, rotate: degrees(45) });
  });
}

/** Draw the ZED leaf/check emblem (circular seal) */
function drawSeal(page: PDFPage, cx: number, cy: number, r: number) {
  // Outer circle — gold ring
  page.drawCircle({ x: cx, y: cy, size: r, color: C.gold });
  // Inner circle — deep green
  page.drawCircle({ x: cx, y: cy, size: r - 3, color: C.deepGreen });
  // Inner white fill
  page.drawCircle({ x: cx, y: cy, size: r - 5, color: C.ivory });
  // Middle green circle
  page.drawCircle({ x: cx, y: cy, size: r - 10, color: C.deepGreen });

  // Check mark (drawn as two lines in white)
  const ck = r - 14;
  // Left stroke: \
  page.drawLine({ start: { x: cx - ck * 0.5, y: cy }, end: { x: cx - ck * 0.1, y: cy - ck * 0.45 }, thickness: 3, color: C.white });
  // Right stroke: /
  page.drawLine({ start: { x: cx - ck * 0.1, y: cy - ck * 0.45 }, end: { x: cx + ck * 0.55, y: cy + ck * 0.5 }, thickness: 3, color: C.white });

  // Gold dot ring around seal (12 dots)
  const ringR = r + 6;
  const dotR = 2;
  for (let i = 0; i < 12; i++) {
    const angle = (i * Math.PI * 2 / 12) - Math.PI / 2;
    const sx = cx + ringR * Math.cos(angle);
    const sy = cy + ringR * Math.sin(angle);
    page.drawCircle({ x: sx, y: sy, size: dotR, color: C.gold });
  }
}

/** Thin gold ornamental divider with diamond center */
function drawOrnamentDivider(page: PDFPage, x: number, y: number, w: number) {
  const mid = x + w / 2;
  // Lines each side of center diamond
  drawLine(page, x, y, mid - 8, y, C.gold, 0.7);
  drawLine(page, mid + 8, y, x + w, y, C.gold, 0.7);
  // Center diamond
  page.drawRectangle({ x: mid - 5, y: y - 5, width: 10, height: 10, color: C.gold, rotate: degrees(45) });
  page.drawRectangle({ x: mid - 3, y: y - 3, width: 6, height: 6, color: C.ivory, rotate: degrees(45) });
}

// ─────────────────────────────────────────────
// Main generator
// ─────────────────────────────────────────────

export async function generateSustainabilityCertificate(data: CertificateData): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const fontUrl = 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5WZLCzYlKw.ttf';
  const fontBytes = await fetch(fontUrl).then(r => r.arrayBuffer());
  const font = await pdfDoc.embedFont(fontBytes);

  const W = 595, H = 842;
  const page = pdfDoc.addPage([W, H]);

  const grandTotal = data.scope1Total + data.scope2Total + data.scope3Total;
  const today = new Date().toLocaleDateString('bg-BG', { day: 'numeric', month: 'long', year: 'numeric' });

  // ── Background ───────────────────────────────────────
  // Cream/ivory background
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: C.ivory });

  // Subtle green corner fills (very light)
  const cornerFill = rgb(0.878 * 0.3 + 0.7 * 1, 0.961 * 0.3 + 0.7 * 1, 0.902 * 0.3 + 0.7 * 1);
  page.drawRectangle({ x: 0, y: H - 80, width: 80, height: 80, color: cornerFill });
  page.drawRectangle({ x: W - 80, y: H - 80, width: 80, height: 80, color: cornerFill });
  page.drawRectangle({ x: 0, y: 0, width: 80, height: 80, color: cornerFill });
  page.drawRectangle({ x: W - 80, y: 0, width: 80, height: 80, color: cornerFill });

  // ── Double border frame ──────────────────────────────
  drawDoubleBorder(page, W, H);

  // ── Header area ──────────────────────────────────────
  // ZED Platform branding
  const headerY = H - 40;
  drawCenteredText(page, PDF_PLATFORM_NAME, headerY, 8.5, font, C.deepGreen, W);

  // Thin gold divider under branding
  drawOrnamentDivider(page, 60, headerY - 22, W - 120);

  // ── Seal emblem ──────────────────────────────────────
  const sealCX = W / 2;
  const sealCY = H - 130;
  const sealR = 34;
  drawSeal(page, sealCX, sealCY, sealR);

  // ── Certificate title ────────────────────────────────
  const titleY = H - 195;
  drawCenteredText(page, 'УДОСТОВЕРЕНИЕ', titleY, 28, font, C.deepGreen, W);
  drawCenteredText(page, 'ЗА УСТОЙЧИВОСТ', titleY - 30, 20, font, C.gold, W);

  drawCenteredText(page, 'Самоотчет по GHG Protocol', titleY - 48, 9, font, C.gray, W);

  // Gold ornament divider
  drawOrnamentDivider(page, 80, titleY - 64, W - 160);

  // ── Body text ────────────────────────────────────────
  const bodyY = titleY - 88;

  drawCenteredText(page, 'Настоящото удостоверява, че', bodyY, 10, font, C.gray, W);

  // Company name — large and prominent
  const nameY = bodyY - 32;
  drawCenteredText(page, data.company.company_name, nameY, 22, font, C.deepGreen, W);

  // Optional registration/sector line
  if (data.company.registration_number || data.company.industry_sector) {
    const infoStr = [
      data.company.registration_number ? `ЕИК: ${data.company.registration_number}` : '',
      data.company.industry_sector ? data.company.industry_sector : '',
    ].filter(Boolean).join('  |  ');
    drawCenteredText(page, infoStr, nameY - 22, 8.5, font, C.gray, W);
  }

  // Main statement
  const stmtY = nameY - 46;
  drawCenteredText(page, 'е подготвила отчет за своя въглероден отпечатък', stmtY, 10.5, font, C.darkGray, W);
  drawCenteredText(page, `за отчетна година ${data.reportingYear} г., използвайки методология`, stmtY - 16, 10.5, font, C.darkGray, W);
  drawCenteredText(page, 'GHG Protocol Corporate Standard', stmtY - 32, 10.5, font, C.green, W);

  // Thin divider
  drawOrnamentDivider(page, 80, stmtY - 48, W - 160);

  // ── Emissions stats ───────────────────────────────────
  const statsY = stmtY - 72;
  const statsW = W - 160; // total width of stats area
  const statsX = (W - statsW) / 2;
  const n = data.scope3Available ? 4 : 3;
  const cardGap = 8;
  const cardW = (statsW - cardGap * (n - 1)) / n;
  const cardH = 68;

  const statItems = [
    { label: 'Обхват 1', sub: 'Директни', val: data.scope1Total.toFixed(3), col: C.deepGreen, bg: C.lightGreen },
    { label: 'Обхват 2', sub: 'Енергия', val: data.scope2Total.toFixed(3), col: rgb(0.063, 0.137, 0.294), bg: rgb(0.867, 0.898, 0.961) },
    ...(data.scope3Available ? [{ label: 'Обхват 3', sub: 'Верига', val: data.scope3Total.toFixed(3), col: rgb(0.620, 0.200, 0.039), bg: rgb(0.988, 0.929, 0.910) }] : []),
    { label: 'ОБЩО', sub: 'tCO2e', val: grandTotal.toFixed(3), col: C.gold, bg: C.goldPale },
  ];

  statItems.forEach(({ label, sub, val, col, bg }, i) => {
    const cx = statsX + i * (cardW + cardGap);
    drawPanel(page, cx, statsY, cardW, cardH, bg, col, 0.8, R.md, 4);
    const lw = font.widthOfTextAtSize(label, 8);
    page.drawText(label, { x: cx + (cardW - lw) / 2, y: statsY - 14, size: 8, font, color: col });
    const sublw = font.widthOfTextAtSize(sub, 7);
    page.drawText(sub, { x: cx + (cardW - sublw) / 2, y: statsY - 26, size: 7, font, color: C.gray });
    const vallw = font.widthOfTextAtSize(val, 17);
    page.drawText(val, { x: cx + (cardW - vallw) / 2, y: statsY - 48, size: 17, font, color: col });
    const unitlw = font.widthOfTextAtSize('tCO2e', 7);
    page.drawText('tCO2e', { x: cx + (cardW - unitlw) / 2, y: statsY - 60, size: 7, font, color: C.gray });
  });

  // ── Key insight line ──────────────────────────────────
  const insightY = statsY - cardH - 20;
  const reduction = data.scope3Available
    ? `Обхват 1+2+3: ${grandTotal.toFixed(3)} tCO2e  |  Метод: GHG Protocol  |  Ниво C (EEIO) за Обхват 3`
    : `Обхват 1+2: ${grandTotal.toFixed(3)} tCO2e  |  Метод: GHG Protocol Corporate Standard`;
  drawCenteredText(page, reduction, insightY, 8.5, font, C.gray, W);

  // Gold ornament
  drawOrnamentDivider(page, 80, insightY - 14, W - 160);

  // ── Methodology badge row ─────────────────────────────
  const methY = insightY - 36;
  const methItems = [
    { label: 'Стандарт', val: 'GHG Protocol' },
    { label: 'Статус', val: 'Самоотчет' },
    { label: 'Одит', val: 'Без одит' },
    { label: 'Метод', val: 'ISO 14064-1' },
  ];
  const methBadgeW = 100;
  const methTotalW = methBadgeW * methItems.length + 8 * (methItems.length - 1);
  const methStartX = (W - methTotalW) / 2;
  methItems.forEach(({ label, val }, i) => {
    const bx = methStartX + i * (methBadgeW + 8);
    drawPanel(page, bx, methY, methBadgeW, 28, C.goldPale, C.gold, 0.6, R.sm);
    const lw = font.widthOfTextAtSize(label, 7);
    page.drawText(label, { x: bx + (methBadgeW - lw) / 2, y: methY - 10, size: 7, font, color: C.gray });
    const vw = font.widthOfTextAtSize(val, 8.5);
    page.drawText(val, { x: bx + (methBadgeW - vw) / 2, y: methY - 22, size: 8.5, font, color: C.deepGreen });
  });

  // ── Signature blocks (lower on page — room above line for signing) ──
  const sigY = 108;
  const sigLineW = 150;
  const sigGap = (W - 80 - sigLineW * 2) / 3;

  // Left signature
  const leftSigX = 60 + sigGap;
  drawLine(page, leftSigX, sigY, leftSigX + sigLineW, sigY, C.darkGray, 0.6);
  const l1 = 'Подпис — Ръководство';
  const l1w = font.widthOfTextAtSize(l1, 7.5);
  page.drawText(l1, { x: leftSigX + (sigLineW - l1w) / 2, y: sigY - 14, size: 7.5, font, color: C.gray });
  page.drawText(data.company.company_name, { x: leftSigX, y: sigY - 26, size: 7, font, color: C.deepGreen, maxWidth: sigLineW });

  // Right — issue date
  const rightSigX = W - 60 - sigGap - sigLineW;
  drawLine(page, rightSigX, sigY, rightSigX + sigLineW, sigY, C.darkGray, 0.6);
  const r1 = 'Издаващ орган';
  const r1w = font.widthOfTextAtSize(r1, 7.5);
  page.drawText(r1, { x: rightSigX + (sigLineW - r1w) / 2, y: sigY - 14, size: 7.5, font, color: C.gray });
  const r2 = `Издадено: ${today}`;
  const r2w = font.widthOfTextAtSize(r2, 7);
  page.drawText(r2, { x: rightSigX + (sigLineW - r2w) / 2, y: sigY - 26, size: 7, font, color: C.deepGreen });

  drawSeal(page, W / 2, sigY + 28, 14);

  // ── Bottom certificate number & date ─────────────────
  const footY = 38;
  drawLine(page, 80, footY + 12, W - 80, footY + 12, C.gold, 0.5);

  const certStr = `Удостоверение № ${data.certNumber}  |  Отчетна година: ${data.reportingYear} г.`;
  drawCenteredText(page, certStr, footY, 7.5, font, C.gray, W);
  drawCenteredText(page, PDF_PLATFORM_NAME, footY - 12, 6.5, font, C.gray, W);
  drawCenteredText(page, 'Не е официален CSRD/ESRS сертификат. Не представлява правен или одиторски документ.', footY - 24, 6, font, C.gray, W);

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
