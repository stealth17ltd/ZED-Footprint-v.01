export const EVIDENCE_BUCKET = 'evidence';

export const EVIDENCE_MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export const EVIDENCE_DOCUMENT_TYPES = [
  { value: 'invoice', label: 'Фактура' },
  { value: 'meter_reading', label: 'Показание от уред' },
  { value: 'contract', label: 'Договор' },
  { value: 'photo', label: 'Снимка' },
  { value: 'spreadsheet', label: 'Таблица (Excel/CSV)' },
  { value: 'other', label: 'Друго' },
] as const;

export type EvidenceDocumentType = (typeof EVIDENCE_DOCUMENT_TYPES)[number]['value'];

export const EVIDENCE_ALLOWED_MIME = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export function sanitizeFilename(name: string): string {
  return name.replace(/[^\w.\-() ]/g, '_').slice(0, 120);
}

export function evidenceStoragePath(
  companyId: string,
  emissionId: string,
  fileId: string,
  filename: string,
): string {
  return `${companyId}/${emissionId}/${fileId}-${sanitizeFilename(filename)}`;
}
