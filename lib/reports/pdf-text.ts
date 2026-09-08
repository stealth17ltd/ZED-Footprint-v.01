/**
 * Shared PDF-safe text — Roboto embedded in pdf-lib lacks Unicode subscripts (₂).
 * Use plain CO2/tCO2 units and the official platform name in generated documents.
 */

export const PDF_PLATFORM_NAME =
  'Софтуер за отчитане на предприятията във връзка с устойчивостта';

export const PDF_TCO2E = 'tCO2e';
export const PDF_CO2E = 'CO2e';

/** Normalize Unicode subscripts and legacy ZED branding for PDF output. */
export function pdfSafeText(text: string): string {
  return text
    .replace(/\u2082/g, '2')
    .replace(/\u2084/g, '4')
    .replace(/tCO₂e/gi, PDF_TCO2E)
    .replace(/kgCO₂e/gi, 'kgCO2e')
    .replace(/CO₂e/g, PDF_CO2E)
    .replace(/CO₂/g, 'CO2')
    .replace(/N₂O/g, 'N2O')
    .replace(/CH₄/g, 'CH4')
    .replace(/ZED Carbon Footprint Platform/gi, PDF_PLATFORM_NAME)
    .replace(/ZED Carbon Footprint Management System/gi, PDF_PLATFORM_NAME)
    .replace(/ZED Carbon Footprint Management/gi, PDF_PLATFORM_NAME)
    .replace(/ZED Carbon Footprint/gi, PDF_PLATFORM_NAME)
    .replace(/ZED Footprint Platform/gi, PDF_PLATFORM_NAME)
    .replace(/ZED Platform/gi, PDF_PLATFORM_NAME)
    .replace(/ZED Bulgaria/gi, PDF_PLATFORM_NAME)
    .replace(/ZED Въглероден отпечатък/gi, PDF_PLATFORM_NAME)
    .replace(/\bZED\b/g, PDF_PLATFORM_NAME);
}

/** VSME disclosure notes — general guidance for PDF (no in-app form references). */
export function pdfVsmeDisclosureNote(
  id: string,
  status: string,
  note: string,
): string {
  if (note.includes('Попълнете формата')) {
    if (id === 'b10-health-safety') {
      return status === 'partial'
        ? 'Допълнете описание на политиката по БЗР, отговорник и честота на обучения'
        : 'Документирайте политика по здраве и безопасност, мерки, инструктажи и регистрирани инциденти';
    }
    if (id === 'b11-governance') {
      return status === 'partial'
        ? 'Допълнете описание на политиката и канал за сигнали (whistleblowing)'
        : 'Документирайте политика срещу корупция и подкуп, обучения и канал за сигнали';
    }
  }
  return pdfSafeText(note);
}
