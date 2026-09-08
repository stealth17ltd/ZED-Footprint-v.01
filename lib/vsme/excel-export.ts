import * as XLSX from 'xlsx';
import type { VsmeExportDocument } from './export-document';
import { VSME_XBRL_CONCEPT_MAP } from './xbrl-mapping';
import { PDF_PLATFORM_NAME } from '@/lib/reports/pdf-text';

export function buildVsmeExcelBuffer(exportDoc: VsmeExportDocument): Buffer {
  const wb = XLSX.utils.book_new();

  const summaryRows = [
    [`VSME Експорт — ${PDF_PLATFORM_NAME}`],
    ['Стандарт', exportDoc.standard],
    ['Отчетна година', exportDoc.reportingYear],
    ['Генериран на', exportDoc.generatedAt],
    ['Генериран от', exportDoc.generatedBy],
    [],
    ['Компания', exportDoc.company.company_name ?? ''],
    ['ЕИК/Рег. номер', exportDoc.company.registration_number ?? ''],
    ['Сектор', exportDoc.company.industry_sector ?? ''],
    ['Служители', exportDoc.company.employee_count ?? ''],
    ['Базова година', exportDoc.company.baseline_year ?? ''],
    [],
    ['Готовност (%)', exportDoc.readiness.scorePercent],
    ['Пълни', exportDoc.readiness.complete],
    ['Частични', exportDoc.readiness.partial],
    ['Липсващи', exportDoc.readiness.missing],
    [],
    ['Емисии (tCO2e)'],
    ['Обхват 1', exportDoc.emissions.scope1_tco2e],
    ['Обхват 2', exportDoc.emissions.scope2_tco2e],
    ['Обхват 3', exportDoc.emissions.scope3_tco2e],
    ['Общо', exportDoc.emissions.total_tco2e],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryRows), 'Обобщение');

  const disclosureHeader = ['ID', 'VSME код', 'Категория', 'Заглавие', 'Статус', 'Бележка'];
  const disclosureRows = exportDoc.readiness.disclosures.map(d => [
    d.id, d.vsmeCode, d.category, d.title, d.status, d.note,
  ]);
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([disclosureHeader, ...disclosureRows]),
    'Разкривания',
  );

  const targetHeader = ['Цел', 'Стойност (%)', 'Целева година'];
  const targetRows = exportDoc.targets.map(t => [t.name, t.target_value, t.target_year]);
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([targetHeader, ...targetRows]),
    'Цели',
  );

  const strategyHeader = ['Стратегия', 'Категория', 'Статус'];
  const strategyRows = exportDoc.strategies.map(s => [s.title, s.category, s.status]);
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([strategyHeader, ...strategyRows]),
    'Стратегии',
  );

  const manual = exportDoc.manualDisclosures;
  const manualRows = [
    ['Поле', 'Стойност'],
    ['БЗР политика', manual?.health_safety_has_policy == null ? '' : manual.health_safety_has_policy ? 'Да' : 'Не'],
    ['БЗР описание', manual?.health_safety_description ?? ''],
    ['БЗР инциденти', manual?.health_safety_incidents ?? ''],
    ['БЗР отговорно лице', manual?.health_safety_responsible_person ?? ''],
    ['БЗР честота на инструктаж', manual?.health_safety_training_frequency ?? ''],
    ['Антикорупция политика', manual?.anti_corruption_has_policy == null ? '' : manual.anti_corruption_has_policy ? 'Да' : 'Не'],
    ['Антикорупция описание', manual?.anti_corruption_description ?? ''],
    ['Whistleblower канал', manual?.anti_corruption_whistleblower == null ? '' : manual.anti_corruption_whistleblower ? 'Да' : 'Не'],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(manualRows), 'Ръчни разкривания');

  const xbrlHeader = ['Disclosure ID', 'VSME код', 'Concept QName', 'Data type', 'Unit'];
  const xbrlRows = VSME_XBRL_CONCEPT_MAP.map(m => [
    m.disclosureId, m.vsmeCode, m.conceptQName, m.dataType, m.unitRef ?? '',
  ]);
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([xbrlHeader, ...xbrlRows]),
    'XBRL mapping',
  );

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}
