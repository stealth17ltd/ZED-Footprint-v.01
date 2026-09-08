/**
 * Shared pdf-lib drawing primitives for report PDFs.
 * Rounded corners use two rectangles + four corner circles (pdf-lib drawCircle
 * `size` is the radius — never pass diameter or corners bulge outward).
 */

import { PDFPage, rgb } from 'pdf-lib';

export type PdfColor = ReturnType<typeof rgb>;

/** Corner radii — subtle rounding, larger boxes get a slightly softer corner */
export const R = { sm: 3.5, md: 6, lg: 8 } as const;

/** Top-down rect: y is the TOP of the rectangle */
export function drawRect(
  page: PDFPage,
  x: number, y: number, w: number, h: number,
  color: PdfColor,
  borderColor?: PdfColor,
  borderWidth = 1,
) {
  page.drawRectangle({
    x, y: y - h, width: w, height: h,
    color,
    borderColor,
    borderWidth: borderColor ? borderWidth : 0,
  });
}

/** Solid rounded shape from two rectangles plus four corner circles */
export function fillRounded(
  page: PDFPage,
  x: number, top: number, w: number, h: number,
  radius: number,
  color: PdfColor,
) {
  if (w <= 0 || h <= 0) return;
  const r = Math.max(0, Math.min(radius, w / 2, h / 2));
  const bottom = top - h;

  if (r < 0.5) {
    page.drawRectangle({ x, y: bottom, width: w, height: h, color });
    return;
  }

  page.drawRectangle({ x: x + r, y: bottom, width: w - 2 * r, height: h, color });
  page.drawRectangle({ x, y: bottom + r, width: w, height: h - 2 * r, color });
  page.drawCircle({ x: x + r,     y: top - r,    size: r, color });
  page.drawCircle({ x: x + w - r, y: top - r,    size: r, color });
  page.drawCircle({ x: x + r,     y: bottom + r, size: r, color });
  page.drawCircle({ x: x + w - r, y: bottom + r, size: r, color });
}

/**
 * Rounded panel. Border is the outer shape; inner fill is inset.
 * `accentTop` thickens only the top edge for scope / status colour coding.
 */
export function drawPanel(
  page: PDFPage,
  x: number, top: number, w: number, h: number,
  fill: PdfColor,
  border: PdfColor,
  borderWidth = 1,
  radius: number = R.md,
  accentTop = 0,
) {
  const bw = Math.max(0, borderWidth);
  if (bw === 0 && accentTop === 0) {
    fillRounded(page, x, top, w, h, radius, fill);
    return;
  }
  fillRounded(page, x, top, w, h, radius, border);
  const topInset = Math.max(bw, accentTop);
  fillRounded(
    page,
    x + bw, top - topInset,
    w - bw * 2, h - topInset - bw,
    Math.max(0, radius - bw),
    fill,
  );
}

/** Left accent stripe inside a rounded panel */
export function drawAccentBar(
  page: PDFPage,
  x: number, top: number, h: number,
  color: PdfColor,
  inset = 3,
  barW = 4,
) {
  drawRect(page, x + inset, top - inset, barW, h - inset * 2, color);
}
