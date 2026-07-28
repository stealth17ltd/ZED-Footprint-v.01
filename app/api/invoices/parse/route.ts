import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// pdfjs-dist (bundled inside pdf-parse v2) calls `new DOMMatrix()` at module
// evaluation time, which fails in Node.js because DOMMatrix is browser-only.
// The polyfill must live here — at module scope, BEFORE the dynamic import of
// pdf-parse — so it is in place when pdf-parse is first loaded.
if (typeof globalThis.DOMMatrix === 'undefined') {
  (globalThis as unknown as Record<string, unknown>).DOMMatrix = class DOMMatrix {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
    m11 = 1; m12 = 0; m13 = 0; m14 = 0;
    m21 = 0; m22 = 1; m23 = 0; m24 = 0;
    m31 = 0; m32 = 0; m33 = 1; m34 = 0;
    m41 = 0; m42 = 0; m43 = 0; m44 = 1;
    is2D = true; isIdentity = true;
    constructor(init?: string | number[]) {
      if (Array.isArray(init) && init.length === 6) {
        [this.a, this.b, this.c, this.d, this.e, this.f] = init;
      }
    }
    multiply() { return this; }
    translate(tx = 0, ty = 0) { this.e += tx; this.f += ty; return this; }
    scale(sx = 1, sy = sx) { this.a *= sx; this.d *= sy; return this; }
    rotate() { return this; }
    inverse() { return new (this.constructor as new () => this)(); }
    transformPoint(p: { x: number; y: number }) { return p; }
    toString() {
      return `matrix(${this.a},${this.b},${this.c},${this.d},${this.e},${this.f})`;
    }
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ParsedInvoiceField<T> {
  value: T;
  confidence: 'high' | 'medium' | 'low';
}

export interface ParsedInvoice {
  filename: string;
  rawText: string;            // for debugging / AI fallback
  txn_date:           ParsedInvoiceField<string>;   // ISO YYYY-MM-DD
  supplier:           ParsedInvoiceField<string>;
  description:        ParsedInvoiceField<string>;
  amount_original:    ParsedInvoiceField<number>;
  currency_original:  ParsedInvoiceField<string>;   // BGN | EUR | USD
  invoice_number:     ParsedInvoiceField<string>;
  vat_amount:         ParsedInvoiceField<number>;
  // Overall extraction quality
  overallConfidence: 'high' | 'medium' | 'low';
  method: 'ai' | 'heuristic' | 'failed';
  error?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Date parsing helpers
// ─────────────────────────────────────────────────────────────────────────────

function parseBGDate(raw: string): string | null {
  // DD.MM.YYYY → YYYY-MM-DD
  const m1 = raw.match(/^(\d{1,2})[.\-\/](\d{1,2})[.\-\/](\d{4})$/);
  if (m1) return `${m1[3]}-${m1[2].padStart(2,'0')}-${m1[1].padStart(2,'0')}`;
  // YYYY-MM-DD (already ISO)
  const m2 = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m2) return raw;
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Amount parsing helpers
// ─────────────────────────────────────────────────────────────────────────────

function parseAmount(raw: string): number | null {
  // Strip currency letters/symbols, keep only digits, dots, commas, spaces
  const s = raw.replace(/[лвBGNEUReuro€$]/gi, '').replace(/\s/g, '').trim();
  if (!s) return null;

  const hasComma = s.includes(',');
  const hasDot   = s.includes('.');

  let n: number;
  if (hasComma && hasDot) {
    // Both separators present — whichever comes last is the decimal separator
    // "1.234,56" (BG)  →  comma last  →  remove dots, swap comma→dot
    // "1,234.56" (EN)  →  dot last    →  remove commas
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
      n = parseFloat(s.replace(/\./g, '').replace(',', '.'));
    } else {
      n = parseFloat(s.replace(/,/g, ''));
    }
  } else if (hasComma) {
    // "79,76" or "1 234,56"
    n = parseFloat(s.replace(',', '.'));
  } else {
    // "79.76" or "1234.56" or plain integer — dot is decimal (or absent)
    n = parseFloat(s);
  }

  return !isNaN(n) && n > 0 ? n : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Smart heuristic parser for Bulgarian НАП-format invoices
// ─────────────────────────────────────────────────────────────────────────────

function heuristicParse(text: string, filename: string): ParsedInvoice {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const full  = lines.join('\n');

  // ── Date ──────────────────────────────────────────────────────────────────
  let txn_date: ParsedInvoiceField<string> = { value: '', confidence: 'low' };

  const dateKeywords = [
    /[Дд]ата\s+на\s+издаване[:\s]+(\d{1,2}[.\-\/]\d{1,2}[.\-\/]\d{4})/,
    /[Дд]ата\s+на\s+фактурата[:\s]+(\d{1,2}[.\-\/]\d{1,2}[.\-\/]\d{4})/,
    /[Дд]ата[:\s]+(\d{1,2}[.\-\/]\d{1,2}[.\-\/]\d{4})/,
    /[Дд]ата[:\s]+(\d{4}-\d{2}-\d{2})/,
    /Date[:\s]+(\d{1,2}[.\-\/]\d{1,2}[.\-\/]\d{4})/i,
  ];
  for (const p of dateKeywords) {
    const m = full.match(p);
    if (m) {
      const iso = parseBGDate(m[1]);
      if (iso) { txn_date = { value: iso, confidence: 'high' }; break; }
    }
  }
  if (!txn_date.value) {
    const standalone = full.match(/\b(\d{2}[.]\d{2}[.]\d{4})\b/);
    if (standalone) {
      const iso = parseBGDate(standalone[1]);
      if (iso) txn_date = { value: iso, confidence: 'medium' };
    }
  }

  // ── Currency ───────────────────────────────────────────────────────────────
  // Detect BEFORE amount parsing so we can pick the right amount on dual-currency lines.
  let currency_original: ParsedInvoiceField<string> = { value: 'BGN', confidence: 'medium' };
  // "Сума за плащане: BGN 156.00 79.76 EUR" — EUR listed last means EUR invoice
  const dualCurrencyEUR = /[Сс]ума\s+за\s+плащане[:\s]+BGN\s+[0-9,\.]+\s+[0-9,\.]+\s+EUR/.test(full);
  const dualCurrencyUSD = /[Сс]ума\s+за\s+плащане[:\s]+BGN\s+[0-9,\.]+\s+[0-9,\.]+\s+USD/.test(full);
  if (dualCurrencyEUR || /\bEUR\b|€/.test(full)) {
    currency_original = { value: 'EUR', confidence: 'high' };
  } else if (dualCurrencyUSD || /\bUSD\b|\$/.test(full)) {
    currency_original = { value: 'USD', confidence: 'high' };
  } else if (/\bBGN\b|лв\.?|leva/i.test(full)) {
    currency_original = { value: 'BGN', confidence: 'high' };
  }

  // ── Supplier ──────────────────────────────────────────────────────────────
  let supplier: ParsedInvoiceField<string> = { value: '', confidence: 'low' };

  // Work only within the supplier section (before the first "Получател:" line)
  const supplierSection = full.split(/\n[Пп]олучател:/)[0];
  const supLines = supplierSection.split('\n').map(l => l.trim()).filter(Boolean);

  // Helper: strip a "Label: " prefix from a line (e.g. "Им на фирма: COMPANY" → "COMPANY")
  const stripLabelPrefix = (s: string) => s.replace(/^[^:]{1,40}:\s*/, '').trim();

  // Strategy 1 — two-column header: "RecipientCo   Получател Доставчик SupplierCo" on one line.
  // Must run FIRST — this line also contains company suffixes so later strategies grab it wrongly.
  const twoColLine = lines.find(l => /[Пп]олучател\s+[Дд]оставчик/.test(l));
  if (twoColLine) {
    const m = twoColLine.match(/[Дд]оставчик\s+(\S.*)/);
    if (m && m[1].trim()) {
      supplier = { value: m[1].trim().slice(0, 120), confidence: 'high' };
    }
  }

  // Strategy 2 — "предприятие-издател": company name is on the line BEFORE the label
  if (!supplier.value) {
    const issuerIdx = supLines.findIndex(l => /предприятие-издател/i.test(l));
    if (issuerIdx > 0 && supLines[issuerIdx - 1].length > 2) {
      supplier = { value: supLines[issuerIdx - 1].trim().slice(0, 120), confidence: 'high' };
    }
  }

  // Strategy 3 — find lines with a Bulgarian company legal suffix.
  // Skip lines that contain header keywords (Получател/Доставчик) — those are layout headers.
  if (!supplier.value) {
    const suffixRe = /(?:ЕООД|ЕАД|ООД|ДЗЗД|ЕТ\b)/;
    const companyLines = supLines.filter(l =>
      suffixRe.test(l) && !/[Пп]олучател|[Дд]оставчик/.test(l)
    );
    if (companyLines.length > 0) {
      companyLines.sort((a, b) => a.length - b.length);
      const cleaned = stripLabelPrefix(companyLines[0]);
      if (cleaned.length > 2) {
        supplier = { value: cleaned.slice(0, 120), confidence: 'high' };
      }
    }
  }

  // Strategy 4 — label on same line as value (with or without colon)
  if (!supplier.value) {
    const sameLineLabels = [
      /[Дд]оставчик:\s*(\S[^\n]+)/,
      /[Дд]оставчик\s+("?[А-Яа-яA-Za-z"„][^\n]+)/,
      /[Пп]родавач:\s*(\S[^\n]+)/,
      /Supplier:\s*(\S[^\n]+)/i,
    ];
    for (const p of sameLineLabels) {
      const m = supplierSection.match(p);
      if (m && m[1].trim() && !m[1].includes(':')) {
        supplier = { value: m[1].trim().slice(0, 120), confidence: 'high' };
        break;
      }
    }
  }

  // Strategy 5 — first short non-label line in the supplier section
  if (!supplier.value) {
    const skipLabel = /фактура|invoice|дата|date|еик|булстат|доставчик|продавач|получател|адрес|мол|град|ддс|банк|bic|iban|телефон|email/i;
    const candidate = supLines.find(l => l.length > 3 && l.length < 80 && !skipLabel.test(l));
    if (candidate) supplier = { value: stripLabelPrefix(candidate).slice(0, 120), confidence: 'low' };
  }

  // ── Invoice number ────────────────────────────────────────────────────────
  let invoice_number: ParsedInvoiceField<string> = { value: '', confidence: 'low' };
  const invPatterns = [
    /[Фф]актура\s*[№Nn#No\.]*\s*:?\s*([0-9А-Яа-яA-Za-z\-\/]+)/,
    /Invoice\s*[#No\.]*\s*:?\s*([0-9A-Za-z\-\/]+)/i,
    /[Нн]омер[:\s]+([0-9А-Яа-яA-Za-z\-\/]+)/,
    // "No:0000002964" format from НАП
    /^No[:\s]*([0-9]{5,15})$/m,
    /[Нн][оо]\.?\s*([0-9]{5,12})/,
  ];
  for (const p of invPatterns) {
    const m = full.match(p);
    if (m) { invoice_number = { value: m[1].trim(), confidence: 'high' }; break; }
  }

  // ── Helper: extract amount from a line that may have "BGN X EUR_amount EUR" ──
  // Returns the amount in the detected invoice currency.
  function extractAmountFromLine(line: string): number | null {
    const cur = currency_original.value;
    // Dual-currency: "BGN 156.00 79.76 EUR"  →  take the EUR/USD amount
    if (cur !== 'BGN') {
      const dual = line.match(new RegExp(`BGN\\s+[0-9,\\.]+\\s+([0-9,\\.]+)\\s+${cur}`));
      if (dual) { const n = parseAmount(dual[1]); if (n && n > 0) return n; }
    }
    // Single-currency or BGN invoice: skip optional leading currency code
    const single = line.match(/(?:[A-Z]{3}\s+)?([0-9]+[,\.][0-9]+)/);
    if (single) { const n = parseAmount(single[1]); if (n && n > 0) return n; }
    return null;
  }

  // ── Total amount (with VAT) ───────────────────────────────────────────────
  let amount_original: ParsedInvoiceField<number> = { value: 0, confidence: 'low' };

  // High-confidence label patterns — search line by line to feed into extractAmountFromLine
  const totalLabels = [
    /[Сс]ума\s+за\s+плащане\s*:/,
    /[Оо]бщо\s+с\s+[Дд]{3}/,
    /[Зз]а\s+плащане\s*:/,
    /Total\s+(?:incl\.?\s+VAT)?/i,
    /TOTAL/i,
    /[Иитт]того\s*:/,
    /[Оо]бщо\s*:/,
    /[Сс]ума\s*:/,
  ];
  for (const label of totalLabels) {
    const matchLine = lines.find(l => label.test(l));
    if (matchLine) {
      const rest = matchLine.replace(label, '').replace(/^[\s:]+/, '');
      const n = extractAmountFromLine(rest.length > 2 ? rest : matchLine);
      if (n !== null && n > 0) {
        const isHigh = /сума\s+за\s+плащане|общо\s+с\s+[дд]{3}|за\s+плащане|total.*vat/i.test(matchLine);
        amount_original = { value: n, confidence: isHigh ? 'high' : 'medium' };
        break;
      }
    }
  }

  // ── VAT amount ────────────────────────────────────────────────────────────
  let vat_amount: ParsedInvoiceField<number> = { value: 0, confidence: 'low' };
  const vatLabels = [
    /[Нн]ачислен\s+[Дд]{3}/,           // "Начислен ДДС (20.00 %): BGN 25.99 13.29 EUR"
    /[Дд]{3}\s+[\d,\.]+\s*%/,           // "ДДС 20.00%      50.50"  (no colon)
    /[Дд]{3}\s*(?:\(?\d+[,\.]?\d*\s*%\)?)?:/,
    /VAT\s*(?:\(?\d+%\)?)?:/i,
    /[Нн]нДС\s*:/,
  ];
  for (const label of vatLabels) {
    const matchLine = lines.find(l => label.test(l));
    if (matchLine) {
      const rest = matchLine.replace(label, '').replace(/^[\s:().\d%]+/, '');
      const n = extractAmountFromLine(rest.length > 2 ? rest : matchLine);
      if (n !== null && n > 0) { vat_amount = { value: n, confidence: 'medium' }; break; }
    }
  }

  // ── Description ───────────────────────────────────────────────────────────
  let description: ParsedInvoiceField<string> = { value: '', confidence: 'low' };

  // ── Description ── table-row extraction with multi-line support ──────────────
  // Find the first data row: line starting with a row number then Cyrillic/Latin/quote text.
  const firstRowIdx = lines.findIndex(l => /^\d+\s+[А-Яа-яA-Za-z"„«»]/.test(l));
  if (firstRowIdx >= 0) {
    const firstRow = lines[firstRowIdx];
    // Remove leading row number
    let descText = firstRow.replace(/^\d+\s+/, '').trim();
    // Strip trailing price columns that may appear on the same line
    // e.g. "абонаментна поддръжка февруари бр. 1 66.47 20.00% 66.47"
    descText = descText.replace(/\s+\d+[\s.,]\d+[\s.,\d%]*$/, '').trim();
    // Strip dangling unit abbreviation at the end (e.g. trailing "бр." or "бр")
    descText = descText.replace(/\s+(?:бр\.?|кг\.?|шт\.?)$/i, '').trim();
    // Strip trailing punctuation
    descText = descText.replace(/[,\s]+$/, '').trim();

    // Look ahead for continuation lines (description cells often wrap to next lines)
    // Stop when we hit: a new row, a unit-only line, a pure-number line, or a section header
    const unitLineRe  = /^(?:бр|кг|л|м|шт|ч)\s+[\d\s.,]+$/i;   // "бр 2 500 0.50880 ..."
    const numberLineRe = /^[\d\s.,]+$/;                            // pure numbers
    for (let i = firstRowIdx + 1; i < Math.min(firstRowIdx + 5, lines.length); i++) {
      const next = lines[i];
      if (!next || next.length < 2) break;
      if (/^\d+\s+[А-Яа-яA-Za-z"„«»]/.test(next)) break;        // next row
      if (/:\s*$/.test(next)) break;                              // section label ending with ":"
      if (unitLineRe.test(next)) break;                           // unit+qty+price line
      if (numberLineRe.test(next)) break;                         // price-only line
      if (/[А-Яа-яA-Za-z]/.test(next)) {                         // contains letters → continuation
        descText += ' ' + next.trim();
      } else {
        break;
      }
    }
    descText = descText.replace(/\s+/g, ' ').trim();
    if (descText.length > 2) {
      description = { value: descText.slice(0, 200), confidence: 'high' };
    }
  }

  // Label-based fallback
  if (!description.value) {
    for (const p of [/[Оо]писание:\s*([^\n]+)/, /[Пп]редмет:\s*([^\n]+)/, /Description:\s*([^\n]+)/i]) {
      const m = full.match(p);
      if (m && m[1].trim()) {
        description = { value: m[1].trim().slice(0, 200), confidence: 'medium' };
        break;
      }
    }
  }

  // Last-resort: longest meaningful line
  if (!description.value) {
    const skipDesc = /фактура|invoice|еик|булстат|дата|адрес|телефон|email|iban|бик|банка|наименование|стоката|услугата|доставчик|продавач|получател|им(е)?\s+на|мярка|кол\.|ед\.\s*цена|стойност|оригинал|powered|tcpdf|qr\s+код|page:|microinvest|www\./i;
    const candidate = lines
      .filter(l => l.length > 10 && l.length < 150 && !skipDesc.test(l))
      .sort((a, b) => b.length - a.length)[0];
    if (candidate) description = { value: candidate.slice(0, 200), confidence: 'low' };
  }

  // ── Overall confidence ────────────────────────────────────────────────────
  const scores = [
    txn_date.confidence, supplier.confidence,
    amount_original.confidence, currency_original.confidence,
  ];
  const highCount = scores.filter(s => s === 'high').length;
  const overallConfidence =
    highCount >= 3 ? 'high' :
    highCount >= 2 ? 'medium' : 'low';

  return {
    filename,
    rawText: text.slice(0, 3000),
    txn_date,
    supplier,
    description,
    amount_original,
    currency_original,
    invoice_number,
    vat_amount,
    overallConfidence,
    method: 'heuristic',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Optional AI enhancement (only when OPENAI_API_KEY is set)
// ─────────────────────────────────────────────────────────────────────────────

async function aiParse(text: string, filename: string): Promise<ParsedInvoice | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  try {
    const prompt = `Extract invoice data from the following text. Return ONLY valid JSON with these keys:
txn_date (ISO YYYY-MM-DD), supplier (company name), description (main product/service purchased),
amount_original (number, total with VAT), currency_original (BGN|EUR|USD),
invoice_number (string or ""), vat_amount (number or 0).

Invoice text:
${text.slice(0, 4000)}`;

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0,
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const raw  = JSON.parse(data.choices[0].message.content);

    return {
      filename,
      rawText: text.slice(0, 3000),
      txn_date:          { value: raw.txn_date        ?? '',    confidence: 'high' },
      supplier:          { value: raw.supplier         ?? '',   confidence: 'high' },
      description:       { value: raw.description      ?? '',   confidence: 'high' },
      amount_original:   { value: Number(raw.amount_original) || 0, confidence: 'high' },
      currency_original: { value: raw.currency_original ?? 'BGN', confidence: 'high' },
      invoice_number:    { value: raw.invoice_number   ?? '',   confidence: 'high' },
      vat_amount:        { value: Number(raw.vat_amount)     || 0, confidence: 'high' },
      overallConfidence: 'high',
      method: 'ai',
    };
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// API Route
// POST /api/invoices/parse
// Accepts: multipart/form-data with field "files" (multiple PDFs)
// Returns: { results: ParsedInvoice[], aiActive: boolean }
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
    }
    if (files.length > 30) {
      return NextResponse.json({ error: 'Maximum 30 files per batch' }, { status: 400 });
    }

    const aiActive = !!process.env.OPENAI_API_KEY;

    const results: ParsedInvoice[] = await Promise.all(
      files.map(async (file) => {
        try {
          const buffer = Buffer.from(await file.arrayBuffer());
          let text = '';

          if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
            // Dynamic import so the DOMMatrix polyfill (above) is guaranteed to
            // be in place before pdfjs-dist evaluates its module-level code.
            const { PDFParse } = await import('pdf-parse');
            const parser = new PDFParse({ data: buffer });
            try {
              const textResult = await parser.getText({ first: 3 }); // first 3 pages
              text = textResult.text;
            } finally {
              await parser.destroy();
            }
          } else {
            // Plain text fallback (e.g. .txt exports)
            text = buffer.toString('utf-8');
          }

          if (!text || text.trim().length < 20) {
            return {
              filename: file.name,
              rawText: '',
              txn_date:          { value: '', confidence: 'low' as const },
              supplier:          { value: '', confidence: 'low' as const },
              description:       { value: '', confidence: 'low' as const },
              amount_original:   { value: 0,  confidence: 'low' as const },
              currency_original: { value: 'BGN', confidence: 'low' as const },
              invoice_number:    { value: '', confidence: 'low' as const },
              vat_amount:        { value: 0,  confidence: 'low' as const },
              overallConfidence: 'low' as const,
              method: 'failed' as const,
              error: 'Не може да се извлече текст от файла. Файлът може да е сканиран или защитен.',
            };
          }

          // Try AI first if key is present, fall back to heuristic
          const aiResult = await aiParse(text, file.name);
          return aiResult ?? heuristicParse(text, file.name);
        } catch (err) {
          console.error(`Parse error for ${file.name}:`, err);
          return {
            filename: file.name,
            rawText: '',
            txn_date:          { value: '', confidence: 'low' as const },
            supplier:          { value: '', confidence: 'low' as const },
            description:       { value: '', confidence: 'low' as const },
            amount_original:   { value: 0,  confidence: 'low' as const },
            currency_original: { value: 'BGN', confidence: 'low' as const },
            invoice_number:    { value: '', confidence: 'low' as const },
            vat_amount:        { value: 0,  confidence: 'low' as const },
            overallConfidence: 'low' as const,
            method: 'failed' as const,
            error: 'Грешка при четене на файла.',
          };
        }
      })
    );

    return NextResponse.json({ results, aiActive });
  } catch (err) {
    console.error('Invoice parse error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
