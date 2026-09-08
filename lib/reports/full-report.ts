import { PDFDocument, rgb, PDFPage, PDFFont } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { PDF_PLATFORM_NAME, pdfSafeText } from './pdf-text';
import { drawPanel, drawAccentBar, fillRounded, drawRect, R } from './pdf-shapes';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface Scope12Emission {
  reporting_period: string;
  scope: number;
  category: string;
  activity_value: number;
  unit: string;
  calculated_co2e: number;
}

export interface Scope3Calculation {
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
    calculation?: string;
    date?: string;
  };
}

export interface FullReportData {
  company: {
    company_name: string;
    registration_number?: string;
    industry_sector?: string;
    employee_count?: number;
    address?: string;
  };
  reportingYear: number;
  scope12Emissions: Scope12Emission[];
  scope3Calculations: Scope3Calculation[];
  generatedBy?: string;
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  vehicles_diesel: 'Превозни средства - Дизел',
  vehicles_petrol: 'Превозни средства - Бензин',
  vehicles_lpg: 'Превозни средства - ГПГ',
  natural_gas: 'Природен газ',
  heating_oil: 'Нафта за отопление',
  coal: 'Въглища',
  refrigerant_r134a: 'Хладилен агент R-134a',
  refrigerant_r404a: 'Хладилен агент R-404A',
  electricity: 'Електроенергия',
  district_heating: 'Топлоенергия',
  district_cooling: 'Хладилна енергия',
};

const SCOPE3_CATEGORY_LABELS: Record<number, string> = {
  1: 'Кат. 1: Закупени стоки и услуги',
  4: 'Кат. 4: Транспорт нагоре по веригата',
  5: 'Кат. 5: Генерирани отпадъци',
  6: 'Кат. 6: Бизнес пътувания',
  7: 'Кат. 7: Пътуване на служители',
};

// ─────────────────────────────────────────────
// Colors
// ─────────────────────────────────────────────

const C = {
  darkGreen:   rgb(0.059, 0.239, 0.114),
  green:       rgb(0.086, 0.502, 0.200),
  lightGreen:  rgb(0.878, 0.965, 0.902),
  medGreen:    rgb(0.200, 0.620, 0.310),
  blue:        rgb(0.114, 0.337, 0.761),
  lightBlue:   rgb(0.875, 0.910, 0.988),
  orange:      rgb(0.780, 0.290, 0.059),
  lightOrange: rgb(0.988, 0.929, 0.910),
  amber:       rgb(0.820, 0.545, 0.000),
  lightAmber:  rgb(0.988, 0.961, 0.878),
  purple:      rgb(0.420, 0.180, 0.680),
  lightPurple: rgb(0.945, 0.906, 0.980),
  gray:        rgb(0.420, 0.420, 0.420),
  lightGray:   rgb(0.922, 0.922, 0.922),
  darkGray:    rgb(0.180, 0.180, 0.180),
  nearWhite:   rgb(0.976, 0.980, 0.984),
  pageBg:      rgb(0.965, 0.969, 0.973),
  white:       rgb(1, 1, 1),
  black:       rgb(0.08, 0.08, 0.08),
  row1:        rgb(0.985, 0.988, 0.990),
  row2:        rgb(1, 1, 1),
  divider:     rgb(0.780, 0.790, 0.800),
  gold:        rgb(0.850, 0.680, 0.180),
  goldLight:   rgb(0.960, 0.910, 0.720),
};

// ─────────────────────────────────────────────
// Drawing helpers
// ─────────────────────────────────────────────

/** Draw text. y = baseline position (PDF y) */
function drawText(
  page: PDFPage,
  text: string,
  x: number, y: number,
  size: number,
  font: PDFFont,
  color = C.black,
  maxWidth?: number
) {
  const safeText = pdfSafeText((text ?? '').toString());
  if (!safeText) return;
  if (maxWidth) {
    let t = safeText;
    while (t.length > 3 && font.widthOfTextAtSize(t, size) > maxWidth) t = t.slice(0, -1);
    if (t !== safeText) t = t.slice(0, -2) + '..';
    page.drawText(t, { x, y, size, font, color });
  } else {
    page.drawText(safeText, { x, y, size, font, color });
  }
}

function drawLine(page: PDFPage, x1: number, y: number, x2: number, color = C.divider, thickness = 0.5) {
  page.drawLine({ start: { x: x1, y }, end: { x: x2, y }, thickness, color });
}

/** Decorative divider with diamond centre */
function drawOrnamentDivider(page: PDFPage, x: number, y: number, w: number) {
  const mid = x + w / 2;
  drawLine(page, x, y, mid - 6, C.gold, 1);
  drawLine(page, mid + 6, y, x + w, C.gold, 1);
  page.drawRectangle({ x: mid - 2.5, y: y - 2.5, width: 5, height: 5, color: C.gold });
}

function drawPageBackground(page: PDFPage, width: number, height: number) {
  drawRect(page, 0, height, width, height, C.pageBg);
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
      cur = word;
    }
  }
  if (cur) lines.push(cur);
  return lines.length > 0 ? lines : [''];
}

// ─────────────────────────────────────────────
// Page management
// ─────────────────────────────────────────────

interface PageCtx {
  pdfDoc: PDFDocument;
  font: PDFFont;
  fontBold: PDFFont;
  page: PDFPage;
  y: number;
  pageNum: number;
  width: number;
  height: number;
  margin: number;
}

function newPage(ctx: PageCtx): PageCtx {
  const page = ctx.pdfDoc.addPage([595, 842]);
  ctx.pageNum += 1;
  drawPageBackground(page, 595, 842);
  drawFooter(page, ctx.font, ctx.pageNum);
  return { ...ctx, page, y: 842 - 56 };
}

function ensureSpace(ctx: PageCtx, needed: number): PageCtx {
  if (ctx.y - needed < 72) return newPage(ctx);
  return ctx;
}

function drawFooter(page: PDFPage, font: PDFFont, pageNum: number) {
  const { width } = page.getSize();
  drawLine(page, 40, 44, width - 40, C.divider);
  drawText(page, PDF_PLATFORM_NAME, 40, 30, 7, font, C.gray, width - 80);
  drawText(page, 'Поверително', width / 2 - 28, 30, 7.5, font, C.gray);
  drawText(page, `Страница ${pageNum}`, width - 75, 30, 7.5, font, C.gray);
}

// ─────────────────────────────────────────────
// Section helpers
// ─────────────────────────────────────────────

/** Section header — dark band, white title */
function sectionHeader(ctx: PageCtx, title: string, subtitle?: string): PageCtx {
  const subtitleLines = subtitle ? wrapText(ctx.font, subtitle, 8, ctx.width - ctx.margin * 2 - 24) : [];
  const boxH = subtitle ? 38 + subtitleLines.length * 12 : 34;
  ctx = ensureSpace(ctx, boxH + 14);
  const { page, y, font, fontBold, width, margin } = ctx;

  drawPanel(page, margin, y, width - margin * 2, boxH, C.darkGreen, C.medGreen, 1, R.md);
  drawAccentBar(page, margin, y, boxH, C.gold);

  drawText(page, title, margin + 14, y - 15, 11, fontBold, C.white);
  subtitleLines.forEach((line, i) => {
    drawText(page, line, margin + 14, y - 29 - i * 12, 8, font, C.goldLight);
  });

  return { ...ctx, y: y - boxH - 12 };
}

/** Full-width title band */
function pageTitleBand(ctx: PageCtx, title: string, color: ReturnType<typeof rgb>): PageCtx {
  const { page, width } = ctx;
  const bandH = 40;
  const bandTop = ctx.y + 8;
  const bandW = width - marginBand(ctx) * 2;
  drawPanel(page, marginBand(ctx), bandTop, bandW, bandH, color, C.medGreen, 1, R.lg);
  drawAccentBar(page, marginBand(ctx), bandTop, bandH, C.gold);
  drawText(page, title, marginBand(ctx) + 14, bandTop - 24, 13, ctx.fontBold, C.white, width - marginBand(ctx) * 2 - 28);
  return { ...ctx, y: ctx.y - bandH - 4 };
}

function marginBand(ctx: PageCtx) { return ctx.margin - 4; }

/** KPI cards row */
function kpiRow(
  ctx: PageCtx,
  items: Array<{ label: string; value: string; unit?: string; color?: ReturnType<typeof rgb>; bg?: ReturnType<typeof rgb> }>
): PageCtx {
  const cardH = 62;
  ctx = ensureSpace(ctx, cardH + 12);
  const { page, y, font, fontBold, width, margin } = ctx;
  const gap = 8;
  const n = items.length;
  const colW = (width - margin * 2 - gap * (n - 1)) / n;

  items.forEach((item, i) => {
    const cx = margin + i * (colW + gap);
    const col = item.color || C.darkGray;

    drawPanel(page, cx, y, colW, cardH, C.white, col, 1, R.md, 4);

    drawText(page, item.label, cx + 12, y - 16, 7.5, fontBold, C.darkGray, colW - 16);
    drawText(page, item.value, cx + 12, y - 36, 16, fontBold, col, colW - 16);
    if (item.unit) drawText(page, item.unit, cx + 12, y - 52, 7.5, font, C.gray, colW - 16);
  });

  return { ...ctx, y: y - cardH - 12 };
}

/** Notes bullet list — wraps long text with hanging indent */
function notesList(ctx: PageCtx, notes: string[]): PageCtx {
  const lH = 13;
  const textX = ctx.margin + 14;
  const maxW = ctx.width - ctx.margin * 2 - 16;

  notes.forEach(note => {
    const lines = wrapText(ctx.font, note, 8, maxW);
    lines.forEach((line, i) => {
      ctx = ensureSpace(ctx, lH + 2);
      if (i === 0) drawText(ctx.page, '\u2022', ctx.margin + 2, ctx.y - 11, 9, ctx.font, C.darkGreen);
      drawText(ctx.page, line, textX, ctx.y - 11, 8, ctx.font, C.darkGray);
      ctx.y -= lH;
    });
  });
  return ctx;
}

// ─────────────────────────────────────────────
// Table: Scope 1 & 2
// ─────────────────────────────────────────────

function tableScope12(ctx: PageCtx, rows: Scope12Emission[]): PageCtx {
  const { margin, width } = ctx;
  const cols = [
    { label: 'Период',    w: 72 },
    { label: 'Категория', w: 165 },
    { label: 'Дейност',   w: 68 },
    { label: 'Единица',   w: 58 },
    { label: 'tCO2e',     w: 62 },
  ];
  const totalW = width - margin * 2;
  const rowH = 18;

  ctx = ensureSpace(ctx, rowH * 2);
  drawPanel(ctx.page, margin, ctx.y, totalW, rowH, C.darkGreen, C.darkGreen, 0, R.sm);
  let hx = margin;
  cols.forEach(c => {
    drawText(ctx.page, c.label, hx + 4, ctx.y - 12, 8, ctx.fontBold, C.white, c.w - 6);
    hx += c.w;
  });
  ctx.y -= rowH;

  rows.forEach((row, i) => {
    ctx = ensureSpace(ctx, rowH);
    const bg = i % 2 === 0 ? C.row1 : C.white;
    drawRect(ctx.page, margin, ctx.y, totalW, rowH, bg);
    let rx = margin;
    const period = (() => { try { return new Date(row.reporting_period).toLocaleDateString('bg-BG', { month: 'short', year: 'numeric' }); } catch { return row.reporting_period; } })();
    const catLabel = CATEGORY_LABELS[row.category] || row.category;
    [
      { val: period,                         w: cols[0].w },
      { val: catLabel,                       w: cols[1].w },
      { val: (row.activity_value ?? 0).toFixed(2), w: cols[2].w },
      { val: row.unit,                       w: cols[3].w },
      { val: (row.calculated_co2e ?? 0).toFixed(4), w: cols[4].w },
    ].forEach(({ val, w }) => {
      drawText(ctx.page, val, rx + 4, ctx.y - 12, 7.5, ctx.font, C.darkGray, w - 6);
      rx += w;
    });
    ctx.y -= rowH;
  });

  return ctx;
}

// ─────────────────────────────────────────────
// Table: Scope 3 categories
// ─────────────────────────────────────────────

function tableScope3Categories(ctx: PageCtx, byCategory: Record<number, number>): PageCtx {
  const { margin, width } = ctx;
  const totalTons = Object.values(byCategory).reduce((s, v) => s + v, 0);
  const sorted = Object.entries(byCategory).sort(([, a], [, b]) => b - a);
  const rowH = 20;

  ctx = ensureSpace(ctx, rowH * (sorted.length + 2));

  const totalW = width - margin * 2;
  const colW = [totalW * 0.48, totalW * 0.18, totalW * 0.14, totalW * 0.20];
  const headers = ['Категория', 'tCO2e', 'Дял %', 'Метод'];

  // Header
  drawPanel(ctx.page, margin, ctx.y, totalW, rowH, C.darkGreen, C.darkGreen, 0, R.sm);
  let hx = margin;
  headers.forEach((h, i) => {
    drawText(ctx.page, h, hx + 5, ctx.y - 13, 8, ctx.fontBold, C.white);
    hx += colW[i];
  });
  ctx.y -= rowH;

  sorted.forEach(([catStr, tons], i) => {
    ctx = ensureSpace(ctx, rowH);
    const cat = parseInt(catStr);
    const pct = totalTons > 0 ? ((tons / totalTons) * 100).toFixed(1) : '0';
    const bg = i % 2 === 0 ? C.row1 : C.row2;
    drawRect(ctx.page, margin, ctx.y, totalW, rowH, bg);
    let rx = margin;
    [SCOPE3_CATEGORY_LABELS[cat] || `Кат. ${cat}`, tons.toFixed(4), `${pct}%`, 'Ниво C (EEIO)'].forEach((v, vi) => {
      drawText(ctx.page, v, rx + 5, ctx.y - 13, 8, ctx.font, C.darkGray, colW[vi] - 8);
      rx += colW[vi];
    });
    ctx.y -= rowH;
  });

  // Total row
  ctx = ensureSpace(ctx, rowH);
  drawPanel(ctx.page, margin, ctx.y, totalW, rowH, C.lightGreen, C.medGreen, 1, R.sm);
  let rx = margin;
  [['ОБЩО', colW[0]], [totalTons.toFixed(4), colW[1]], ['100%', colW[2]], ['', colW[3]]].forEach(([v, w]) => {
    drawText(ctx.page, v as string, rx + 5, ctx.y - 13, 8.5, ctx.fontBold, C.darkGreen, (w as number) - 8);
    rx += w as number;
  });
  ctx.y -= rowH;

  return ctx;
}

// ─────────────────────────────────────────────
// Table: Scope 3 top calculations (audit trace)
// ─────────────────────────────────────────────

function tableScope3Calculations(ctx: PageCtx, calcs: Scope3Calculation[]): PageCtx {
  const { margin, width } = ctx;
  const top10 = [...calcs].sort((a, b) => b.co2e_kg - a.co2e_kg).slice(0, 10);
  const rowH = 20;
  const totalW = width - margin * 2;
  const colW = [totalW * 0.26, totalW * 0.22, totalW * 0.12, totalW * 0.14, totalW * 0.14, totalW * 0.12];
  const headers = ['Доставчик', 'Описание', 'Сума EUR', 'Категория', 'kg CO2e', 'Метод'];

  ctx = ensureSpace(ctx, rowH * 2);
  drawPanel(ctx.page, margin, ctx.y, totalW, rowH, C.darkGreen, C.darkGreen, 0, R.sm);
  let hx = margin;
  headers.forEach((h, i) => {
    drawText(ctx.page, h, hx + 5, ctx.y - 13, 8, ctx.fontBold, C.white);
    hx += colW[i];
  });
  ctx.y -= rowH;

  top10.forEach((calc, i) => {
    ctx = ensureSpace(ctx, rowH);
    const trace = calc.calculation_trace || {};
    const bg = i % 2 === 0 ? C.row1 : C.row2;
    drawRect(ctx.page, margin, ctx.y, totalW, rowH, bg);
    let rx = margin;
    [
      trace.supplier != null ? String(trace.supplier) : '\u2014',
      trace.description != null ? String(trace.description) : '\u2014',
      trace.amount != null && !Number.isNaN(Number(trace.amount))
        ? Number(trace.amount).toFixed(2)
        : '\u2014',
      SCOPE3_CATEGORY_LABELS[calc.scope_category]?.replace('Кат. ', 'К.') || `К.${calc.scope_category}`,
      (calc.co2e_kg ?? 0).toFixed(3),
      calc.method_tier ? `Ниво ${calc.method_tier}` : '\u2014',
    ].forEach((v, vi) => {
      drawText(ctx.page, v, rx + 5, ctx.y - 13, 7.5, ctx.font, C.darkGray, colW[vi] - 8);
      rx += colW[vi];
    });
    ctx.y -= rowH;
  });

  if (calcs.length > 10) {
    ctx = ensureSpace(ctx, 18);
    drawText(ctx.page, `+ още ${calcs.length - 10} изчисления`, margin + 4, ctx.y - 12, 8, ctx.font, C.gray);
    ctx.y -= 18;
  }

  return ctx;
}

// ─────────────────────────────────────────────
// Recommendations engine
// ─────────────────────────────────────────────

interface Recommendation {
  priority: 'висок' | 'среден' | 'нисък';
  title: string;
  body: string;
  saving: string;
}

function buildRecommendations(
  data: FullReportData,
  scope1: number,
  scope2: number,
  scope3Tons: number,
  scope3ByCategory: Record<number, number>
): Recommendation[] {
  const total = scope1 + scope2 + scope3Tons;
  const recs: Recommendation[] = [];

  const s1pct = total > 0 ? (scope1 / total) * 100 : 0;
  const s2pct = total > 0 ? (scope2 / total) * 100 : 0;
  const s3pct = total > 0 ? (scope3Tons / total) * 100 : 0;
  const cat1 = scope3ByCategory[1] || 0;
  const cat4 = scope3ByCategory[4] || 0;
  const cat6 = scope3ByCategory[6] || 0;
  const cat7 = scope3ByCategory[7] || 0;
  const s3total = scope3Tons;

  // ── Scope 2: easiest win ──
  if (scope2 > 0) {
    recs.push({
      priority: scope2 / total > 0.1 ? 'висок' : 'среден',
      title: 'Преминете към зелена електроенергия',
      body: `Обхват 2 (${scope2.toFixed(3)} tCO2e, ${s2pct.toFixed(1)}% от общото) може да бъде намален почти до нула чрез договор за 100% ВЕИ електроенергия или чрез закупуване на Гаранции за произход (GoO). Това е най-бързата и евтина мярка за намаляване на отпечатъка.`,
      saving: `Потенциал: до -${scope2.toFixed(3)} tCO2e/год.`,
    });
  }

  // ── Scope 1: fleet/fuel ──
  if (scope1 > 0 && s1pct > 10) {
    recs.push({
      priority: s1pct > 40 ? 'висок' : 'среден',
      title: 'Оптимизирайте автопарка и горивното потребление',
      body: `Директните емисии (${scope1.toFixed(3)} tCO2e) идват основно от горива. Планирайте постепенна електрификация на служебния автопарк (EV/PHEV) и въведете GPS-базирано управление на маршрути за намаляване на разход. Само 10% намаление на разход дава ${(scope1 * 0.1).toFixed(3)} tCO2e/год. икономия.`,
      saving: `Потенциал: -10–30% от Обхват 1`,
    });
  }

  // ── Scope 3 Cat 1: purchased goods ──
  if (cat1 > 0) {
    const cat1pct = s3total > 0 ? (cat1 / s3total) * 100 : 0;
    recs.push({
      priority: cat1pct > 30 ? 'висок' : 'среден',
      title: 'Ангажирайте доставчиците за намаляване на емисии (Кат. 1)',
      body: `Закупените стоки и услуги (${cat1.toFixed(3)} tCO2e, ${cat1pct.toFixed(1)}% от Обхват 3) са сред най-значимите категории. Изпратете въпросник за въглероден отпечатък до Топ-10 доставчика по разходи. Предпочитайте доставчици с EPD сертификати и локален произход. Дори 1 доставчик с по-ниски емисии може да намали тази категория с 15-25%.`,
      saving: `Потенциал: -15–25% от Кат. 1`,
    });
  }

  // ── Scope 3 Cat 6: business travel ──
  if (cat6 > 0) {
    const cat6pct = s3total > 0 ? (cat6 / s3total) * 100 : 0;
    recs.push({
      priority: cat6pct > 20 ? 'висок' : 'среден',
      title: 'Въведете политика за командировки (Кат. 6)',
      body: `Бизнес пътуванията генерират ${cat6.toFixed(3)} tCO2e (${cat6pct.toFixed(1)}% от Обхват 3). Политика "видеоконференция първо" за срещи под 200 км. При нужда от въздушно пътуване — преки полети вместо с прекачване (прекачването добавя ~50% CO2e). Компенсирайте оставащите емисии чрез верифицирани CO2 кредити.`,
      saving: `Потенциал: -20–40% от Кат. 6`,
    });
  }

  // ── Scope 3 Cat 7: commuting ──
  if (cat7 > 0) {
    recs.push({
      priority: 'среден',
      title: 'Насърчете зеленото пътуване на служителите (Кат. 7)',
      body: `Пътуването на ${cat7.toFixed(3)} tCO2e може да се намали чрез хибриден режим на работа (2-3 дни у дома), карти за обществен транспорт и схема за наем/покупка на EV велосипед или автомобил. Вземете базово проучване колко служители идват с кола, влак или пеша.`,
      saving: `Потенциал: -15–30% от Кат. 7`,
    });
  }

  // ── Scope 3 Cat 4: transport ──
  if (cat4 > 0) {
    recs.push({
      priority: 'среден',
      title: 'Оптимизирайте логистиката нагоре по веригата (Кат. 4)',
      body: `Транспортните емисии (${cat4.toFixed(3)} tCO2e) могат да се намалят чрез консолидиране на доставките (по-малко, по-пълни товарни превози), преминаване от въздушен към морски/железопътен транспорт там, където е възможно, и избор на логистични партньори с EV флот или биогорива.`,
      saving: `Потенциал: -10–20% от Кат. 4`,
    });
  }

  // ── Data quality ──
  recs.push({
    priority: 'нисък',
    title: 'Подобрете точността на данните (от Ниво C към Ниво B)',
    body: `Текущите Обхват 3 изчисления използват разходно-базиран метод (Ниво C), базиран на индустриални средни стойности. За категориите с най-висок дял — съберете физически данни (кг, км, kWh) и преминете към Ниво B. Това ще повиши доверието в отчета при клиенти, банки и одитори.`,
    saving: `По-точни данни = по-надежден отчет`,
  });

  // ── SBT / target setting ──
  if (total > 0) {
    recs.push({
      priority: 'нисък',
      title: `Поставете цел за намаление до ${data.reportingYear + 5} г.`,
      body: `Базовата година ${data.reportingYear} (${grandTotalStr(scope1, scope2, scope3Tons)} tCO2e) е отправна точка. Научно-базираните цели (SBTi) изискват 42% намаление до 2030 г. спрямо 2019. Дори без сертификация, публично поета цел за -30% до ${data.reportingYear + 5} г. дава конкурентно предимство при търгове и финансиране.`,
      saving: `Цел: -30% до ${data.reportingYear + 5} г.`,
    });
  }

  return recs;
}

function grandTotalStr(s1: number, s2: number, s3: number): string {
  return (s1 + s2 + s3).toFixed(3);
}

// ─────────────────────────────────────────────
// Recommendations page renderer
// ─────────────────────────────────────────────

const PRIORITY_COLORS: Record<string, ReturnType<typeof rgb>> = {
  'висок':  rgb(0.780, 0.140, 0.100),
  'среден': rgb(0.820, 0.545, 0.000),
  'нисък':  rgb(0.086, 0.502, 0.200),
};

const PRIORITY_BG: Record<string, ReturnType<typeof rgb>> = {
  'висок':  rgb(0.996, 0.925, 0.918),
  'среден': rgb(0.996, 0.969, 0.906),
  'нисък':  rgb(0.878, 0.965, 0.902),
};

function renderRecommendations(ctx: PageCtx, recs: Recommendation[]): PageCtx {
  const bodyMaxW = ctx.width - ctx.margin * 2 - 16;
  const titleMaxW = ctx.width - ctx.margin * 2 - 72;
  const lH = 12; // body line height

  recs.forEach((rec, idx) => {
    const { font, fontBold, width, margin } = ctx;
    const col = PRIORITY_COLORS[rec.priority] || C.darkGray;
    const bg = PRIORITY_BG[rec.priority] || C.nearWhite;

    // Pre-calculate wrapped lines to know card height
    const titleLines = wrapText(font, rec.title, 9, titleMaxW);
    const bodyLines = wrapText(font, rec.body, 7.5, bodyMaxW);
    const savingLines = wrapText(font, rec.saving, 7.5, bodyMaxW);

    // Card layout:
    // 8px top pad + badge row (15) + title lines + 6 gap + body lines + 6 gap + saving lines + 8 bottom pad
    const cardH = 8 + 15 + titleLines.length * lH + 6 + bodyLines.length * lH + 6 + savingLines.length * lH + 10;

    ctx = ensureSpace(ctx, cardH + 8);
    const { page, y } = ctx;

    // Card background + left stripe
    drawPanel(page, margin, y, width - margin * 2, cardH, bg, col, 1, R.md);
    drawAccentBar(page, margin, y, cardH, col);

    // Row 1: badge + number + title
    const rowY = y - 16;
    const badgeW = 46;
    fillRounded(page, margin + 10, y - 5, badgeW, 14, R.sm, col);
    drawText(page, rec.priority.toUpperCase(), margin + 14, rowY, 6.5, fontBold, C.white);
    drawText(page, `${idx + 1}.`, margin + 58, rowY, 8, fontBold, col);
    titleLines.forEach((tl, ti) => {
      drawText(page, tl, margin + 68, rowY - ti * lH, 9, fontBold, col, titleMaxW);
    });

    // Body paragraph
    let bodyY = rowY - titleLines.length * lH - 8;
    bodyLines.forEach(line => {
      drawText(page, line, margin + 8, bodyY, 7.5, font, C.darkGray);
      bodyY -= lH;
    });

    // Saving line
    const savingY = bodyY - 6;
    savingLines.forEach((sl, si) => {
      drawText(page, sl, margin + 8, savingY - si * lH, 7.5, fontBold, col);
    });

    ctx = { ...ctx, y: y - cardH - 8 };
  });
  return ctx;
}

// ─────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────

export async function generateFullReport(data: FullReportData): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  // Single Cyrillic-supporting font (bold variant has no Cyrillic glyphs in most CDN subsets)
  const fontUrl = 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5WZLCzYlKw.ttf';
  const fontBytes = await fetch(fontUrl).then(r => r.arrayBuffer());
  const font = await pdfDoc.embedFont(fontBytes);
  const fontBold = font; // reuse — differentiated by size

  // ── Aggregations ──────────────────────────────
  const scope1Total = data.scope12Emissions.filter(e => e.scope === 1).reduce((s, e) => s + (e.calculated_co2e ?? 0), 0);
  const scope2Total = data.scope12Emissions.filter(e => e.scope === 2).reduce((s, e) => s + (e.calculated_co2e ?? 0), 0);
  const scope3TotalKg = data.scope3Calculations.reduce((s, e) => s + (e.co2e_kg ?? 0), 0);
  const scope3TotalTons = scope3TotalKg / 1000;
  const grandTotal = scope1Total + scope2Total + scope3TotalTons;

  const scope3ByCategory: Record<number, number> = {};
  data.scope3Calculations.forEach(e => {
    scope3ByCategory[e.scope_category] = (scope3ByCategory[e.scope_category] || 0) + (e.co2e_kg ?? 0) / 1000;
  });

  const today = new Date().toLocaleDateString('bg-BG', { day: 'numeric', month: 'long', year: 'numeric' });

  const W = 595, H = 842;

  // ══════════════════════════════════════════════
  // PAGE 1 — Cover
  // ══════════════════════════════════════════════
  let page = pdfDoc.addPage([W, H]);
  drawPageBackground(page, W, H);
  let ctx: PageCtx = { pdfDoc, font, fontBold, page, y: H - 56, pageNum: 1, width: W, height: H, margin: 40 };
  drawFooter(page, font, 1);

  // ── Cover header band (full width, solid dark green) ─────────────────────
  const HEADER_H = 200;
  drawRect(page, 0, H, W, HEADER_H, C.darkGreen);
  drawRect(page, 0, H, 8, HEADER_H, C.gold);
  drawRect(page, 0, H - HEADER_H, W, H - HEADER_H, C.pageBg);

  drawText(page, 'Софтуер за отчитане на', 48, H - 48, 8.5, font, C.goldLight);
  drawText(page, 'предприятията във връзка с устойчивостта', 48, H - 60, 8.5, font, C.goldLight, W - 96);

  drawText(page, 'ПЪЛЕН ОТЧЕТ', 48, H - 92, 28, fontBold, C.white);
  drawText(page, 'НА УСТОЙЧИВОСТТА', 48, H - 122, 22, fontBold, C.gold);
  drawText(page, `Обхват 1 + 2 + 3  ·  Отчетна година ${data.reportingYear} г.`, 48, H - 142, 10, font, C.goldLight);

  drawOrnamentDivider(page, 48, H - 156, W - 96);

  // ── Company info box ───────────────────────────
  const compBoxTop = H - HEADER_H - 24;
  const compBoxH = 72;
  drawPanel(page, 36, compBoxTop, W - 72, compBoxH, C.white, C.darkGreen, 1, R.lg);
  drawAccentBar(page, 46, compBoxTop - 8, compBoxH - 16, C.darkGreen);

  drawText(page, data.company.company_name, 58, compBoxTop - 20, 16, fontBold, C.darkGreen, W - 116);
  const infoY = compBoxTop - 38;
  const infoParts: string[] = [];
  if (data.company.registration_number) infoParts.push(`ЕИК: ${data.company.registration_number}`);
  if (data.company.industry_sector) infoParts.push(`Сектор: ${data.company.industry_sector}`);
  if (data.company.employee_count) infoParts.push(`Служители: ${data.company.employee_count}`);
  drawText(page, infoParts.join('   ·   '), 58, infoY, 8.5, font, C.darkGray, W - 112);
  if (data.company.address) drawText(page, data.company.address, 58, infoY - 14, 8, font, C.gray, W - 112);

  // ── Grand total banner ─────────────────────────
  const bannerTop = compBoxTop - compBoxH - 16;
  const bannerH = 84;
  drawPanel(page, 36, bannerTop, W - 72, bannerH, C.lightGreen, C.medGreen, 1, R.lg);
  drawAccentBar(page, 46, bannerTop - 8, bannerH - 16, C.darkGreen);

  drawText(page, 'ОБЩ ВЪГЛЕРОДЕН ОТПЕЧАТЪК', 58, bannerTop - 14, 8.5, fontBold, C.darkGray);
  drawText(page, grandTotal.toFixed(3), 58, bannerTop - 46, 34, fontBold, C.darkGreen);
  drawText(page, 'tCO2e', 58 + font.widthOfTextAtSize(grandTotal.toFixed(3), 34) + 8, bannerTop - 46, 13, font, C.green);
  drawText(page, `Отчетна година: ${data.reportingYear} г.   ·   Генериран: ${today}`, 58, bannerTop - 66, 8, font, C.darkGray);

  // ── Scope breakdown cards ──────────────────────
  const cardAreaTop = bannerTop - bannerH - 16;
  const cardH = 96;
  const gap = 10;
  const cardW = (W - 72 - gap * 2) / 3;
  const scopeCards = [
    { label: 'Обхват 1', sub: 'Директни емисии', val: scope1Total, col: C.darkGreen, border: C.medGreen },
    { label: 'Обхват 2', sub: 'Закупена енергия', val: scope2Total, col: C.blue, border: C.blue },
    { label: 'Обхват 3', sub: 'Верига на стойността', val: scope3TotalTons, col: C.orange, border: C.orange },
  ];

  scopeCards.forEach(({ label, sub, val, col, border }, i) => {
    const cx = 36 + i * (cardW + gap);
    drawPanel(page, cx, cardAreaTop, cardW, cardH, C.white, border, 1, R.md, 5);

    drawText(page, label, cx + 12, cardAreaTop - 18, 10, fontBold, col, cardW - 16);
    drawText(page, sub, cx + 12, cardAreaTop - 30, 7.5, font, C.darkGray, cardW - 16);
    drawText(page, val.toFixed(3), cx + 12, cardAreaTop - 56, 20, fontBold, col, cardW - 16);
    drawText(page, 'tCO2e', cx + 12, cardAreaTop - 70, 8, font, C.gray);
    const pct = grandTotal > 0 ? ((val / grandTotal) * 100).toFixed(1) : '0';
    drawText(page, `${pct}% от общото`, cx + 12, cardAreaTop - 86, 8, fontBold, col);
  });

  // ── Methodology note ───────────────────────────
  const methTop = cardAreaTop - cardH - 14;
  const methH = 56;
  drawPanel(page, 36, methTop, W - 72, methH, C.white, C.divider, 1, R.md);
  drawText(page, 'МЕТОДОЛОГИЯ', 50, methTop - 12, 7.5, fontBold, C.darkGreen);
  drawText(page, 'Обхват 1 & 2: емисионни фактори (DEFRA, IPCC, MOEW Bulgaria)', 50, methTop - 26, 7.5, font, C.darkGray);
  drawText(page, 'Обхват 3: разходно-базиран метод (EXIOBASE v3, DEFRA 2024) — Ниво C (EEIO)', 50, methTop - 38, 7.5, font, C.darkGray);
  drawText(page, 'GHG Protocol Corporate Standard · ISO 14064-1', 50, methTop - 50, 7.5, font, C.darkGray);

  // ── Disclaimer ─────────────────────────────────
  drawLine(page, 40, 58, W - 40, C.divider);
  drawText(page, `Настоящият отчет е изготвен на базата на предоставени данни. ${PDF_PLATFORM_NAME} не носи отговорност за точността на входните данни.`, 40, 44, 7, font, C.gray, W - 80);

  // ══════════════════════════════════════════════
  // PAGE 2 — Scope 1 & 2 Detail
  // ══════════════════════════════════════════════
  ctx = newPage(ctx);
  page = ctx.page;
  ctx = pageTitleBand(ctx, 'ОБХВАТ 1 & 2 \u2014 ДЕТАЙЛЕН АНАЛИЗ', C.darkGreen);
  ctx.y -= 10;

  ctx = sectionHeader(ctx, 'Обхват 1 \u2014 Директни емисии', 'Емисии от горива, флот и технологични процеси, контролирани от организацията');
  ctx = kpiRow(ctx, [
    { label: 'Общо Обхват 1', value: scope1Total.toFixed(3), unit: 'tCO2e', color: C.darkGreen, bg: C.lightGreen },
    { label: 'Брой записи', value: data.scope12Emissions.filter(e => e.scope === 1).length.toString(), unit: 'записа' },
    { label: 'Дял Обхват 1+2', value: (scope1Total + scope2Total > 0 ? ((scope1Total / (scope1Total + scope2Total)) * 100).toFixed(1) : '0') + '%', unit: 'от Обхват 1+2' },
  ]);
  ctx.y -= 4;
  if (data.scope12Emissions.filter(e => e.scope === 1).length > 0) {
    ctx = tableScope12(ctx, data.scope12Emissions.filter(e => e.scope === 1));
  }

  ctx.y -= 16;
  ctx = sectionHeader(ctx, 'Обхват 2 \u2014 Индиректни емисии от енергия', 'Закупена електроенергия, топлоенергия и охлаждане');
  ctx = kpiRow(ctx, [
    { label: 'Общо Обхват 2', value: scope2Total.toFixed(3), unit: 'tCO2e', color: C.blue, bg: C.lightBlue },
    { label: 'Брой записи', value: data.scope12Emissions.filter(e => e.scope === 2).length.toString(), unit: 'записа' },
    { label: 'Дял Обхват 1+2', value: (scope1Total + scope2Total > 0 ? ((scope2Total / (scope1Total + scope2Total)) * 100).toFixed(1) : '0') + '%', unit: 'от Обхват 1+2' },
  ]);
  ctx.y -= 4;
  if (data.scope12Emissions.filter(e => e.scope === 2).length > 0) {
    ctx = tableScope12(ctx, data.scope12Emissions.filter(e => e.scope === 2));
  }

  // ══════════════════════════════════════════════
  // PAGE 3+ — Scope 3 Detail
  // ══════════════════════════════════════════════
  ctx = newPage(ctx);
  page = ctx.page;
  ctx = pageTitleBand(ctx, 'ОБХВАТ 3 \u2014 ВЕРИГА НА СТОЙНОСТТА', C.orange);
  ctx.y -= 10;

  ctx = sectionHeader(ctx, 'Обобщение на Обхват 3', `${data.reportingYear} г. — Разходно-базиран метод (Ниво C / EEIO)`);
  ctx = kpiRow(ctx, [
    { label: 'Общо Обхват 3', value: scope3TotalTons.toFixed(3), unit: 'tCO2e', color: C.orange, bg: C.lightOrange },
    { label: 'Транзакции', value: data.scope3Calculations.length.toString(), unit: 'изчислени' },
    { label: 'Дял от Общото', value: grandTotal > 0 ? ((scope3TotalTons / grandTotal) * 100).toFixed(1) + '%' : '0%', unit: 'от Обхват 1+2+3' },
    { label: 'Метод', value: 'Ниво C', unit: 'EEIO разходно-базиран' },
  ]);
  ctx.y -= 8;

  ctx = sectionHeader(ctx, 'Разпределение по категория');
  ctx = tableScope3Categories(ctx, scope3ByCategory);

  if (data.scope3Calculations.length > 0) {
    ctx.y -= 12;
    ctx = sectionHeader(ctx, 'Топ 10 изчисления (одитен след)', '\u201eПокажи математиката\u201c \u2014 пълна проследимост на изчислението');
    ctx = tableScope3Calculations(ctx, data.scope3Calculations);
  }

  // ══════════════════════════════════════════════
  // PAGE — Consolidated Summary
  // ══════════════════════════════════════════════
  ctx = newPage(ctx);
  page = ctx.page;
  ctx = pageTitleBand(ctx, 'КОНСОЛИДИРАНО РЕЗЮМЕ \u2014 ОБХВАТ 1 + 2 + 3', C.darkGreen);
  ctx.y -= 10;

  ctx = sectionHeader(ctx, 'Общ въглероден отпечатък');
  ctx = kpiRow(ctx, [
    { label: 'Обхват 1', value: scope1Total.toFixed(3), unit: 'tCO2e', color: C.darkGreen, bg: C.lightGreen },
    { label: 'Обхват 2', value: scope2Total.toFixed(3), unit: 'tCO2e', color: C.blue, bg: C.lightBlue },
    { label: 'Обхват 3', value: scope3TotalTons.toFixed(3), unit: 'tCO2e', color: C.orange, bg: C.lightOrange },
    { label: 'ОБЩО', value: grandTotal.toFixed(3), unit: 'tCO2e', color: C.darkGreen, bg: C.lightGreen },
  ]);
  ctx.y -= 8;

  ctx = sectionHeader(ctx, 'Бележки към методологията');
  ctx = notesList(ctx, [
    'Обхват 1 и 2 са изчислени на база измерени/прогнозни стойности, умножени по стандартни емисионни фактори.',
    'Обхват 3, Кат. 1 (Закупени стоки и услуги): EXIOBASE v3 (2023) \u2014 разходно-базиран метод.',
    'Обхват 3, Кат. 6 (Бизнес пътувания) и Кат. 7 (Пътуване на служители): DEFRA 2024.',
    'Обхват 3, Кат. 4 (Транспорт нагоре) и Кат. 5 (Отпадъци): DEFRA 2024 / EXIOBASE v3.',
    'Ниво C означава, че се прилага разходно-базиран метод с индустриални средни стойности.',
    'Препоръчително е преминаване към Ниво B (физически данни) за категориите с най-висок дял.',
    `Отчетна година: ${data.reportingYear} г.  |  Изготвил: ${data.generatedBy || PDF_PLATFORM_NAME}  |  Дата: ${today}`,
  ]);
  ctx.y -= 16;

  // Signature block
  ctx = ensureSpace(ctx, 72);
  drawLine(ctx.page, 40, ctx.y, W / 2 - 20);
  drawLine(ctx.page, W / 2 + 20, ctx.y, W - 40);
  drawText(ctx.page, 'Подпис и печат (Компания)', 40, ctx.y - 14, 8, font, C.gray);
  drawText(ctx.page, 'Подпис (Верификатор)', W / 2 + 20, ctx.y - 14, 8, font, C.gray);
  ctx.y -= 40;

  // ══════════════════════════════════════════════
  // PAGE — Recommendations
  // ══════════════════════════════════════════════
  ctx = newPage(ctx);
  page = ctx.page;
  ctx = pageTitleBand(ctx, 'ПРЕПОРЪКИ ЗА НАМАЛЯВАНЕ НА ВЪГЛЕРОДНИЯ ОТПЕЧАТЪК', C.medGreen);
  ctx.y -= 8;

  // Intro text
  ctx = ensureSpace(ctx, 40);
  drawPanel(ctx.page, ctx.margin, ctx.y, W - ctx.margin * 2, 34, C.white, C.divider, 1, R.md);
  drawText(ctx.page, `Базирани на данните от ${data.reportingYear} г. (общо ${grandTotal.toFixed(3)} tCO2e), следните действия имат най-висок потенциал за намаляване`, ctx.margin + 10, ctx.y - 12, 8, font, C.darkGray, W - ctx.margin * 2 - 14);
  drawText(ctx.page, `на въглеродния отпечатък на ${data.company.company_name}. Препоръките са наредени по значимост.`, ctx.margin + 10, ctx.y - 25, 8, font, C.darkGray, W - ctx.margin * 2 - 14);
  ctx.y -= 44;

  // Priority legend
  ctx = ensureSpace(ctx, 18);
  ['висок', 'среден', 'нисък'].forEach((p, pi) => {
    const lx = ctx.margin + pi * 130;
    fillRounded(ctx.page, lx, ctx.y, 10, 10, 2.5, PRIORITY_COLORS[p] || C.gray);
    drawText(ctx.page, `Приоритет: ${p}`, lx + 13, ctx.y - 8, 7.5, font, C.darkGray);
  });
  ctx.y -= 20;

  const recs = buildRecommendations(data, scope1Total, scope2Total, scope3TotalTons, scope3ByCategory);
  ctx = renderRecommendations(ctx, recs);

  // ── Closing note ────────────────────────────────
  ctx = ensureSpace(ctx, 50);
  ctx.y -= 10;
  drawPanel(ctx.page, ctx.margin, ctx.y, W - ctx.margin * 2, 42, C.lightGreen, C.medGreen, 1, R.md);
  drawAccentBar(ctx.page, ctx.margin, ctx.y, 42, C.darkGreen);
  drawText(ctx.page, 'Следващи стъпки', ctx.margin + 10, ctx.y - 14, 9, fontBold, C.darkGreen);
  drawText(ctx.page, `Споделете този отчет с вашия екип и ключови доставчици. Задайте измерими цели и проследявайте напредъка`, ctx.margin + 10, ctx.y - 27, 8, font, C.darkGray, W - ctx.margin * 2 - 14);
  drawText(ctx.page, `чрез редовно обновяване на данните за емисии и доказателства.`, ctx.margin + 10, ctx.y - 39, 8, font, C.darkGray, W - ctx.margin * 2 - 14);

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
