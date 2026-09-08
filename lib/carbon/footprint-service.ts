/**
 * Canonical carbon footprint aggregation — single source of truth for totals.
 * Dashboard, comparison, targets, reports and benchmark should consume this module.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

export interface ScopeTotals {
  scope1: number;
  scope2: number;
  scope3: number;
  total: number;
}

export interface YearFootprint extends ScopeTotals {
  year: number;
}

export interface Scope12Row {
  scope: number;
  calculated_co2e: number;
  reporting_period: string;
}

export interface Scope3Row {
  co2e_kg: number | string;
  scope_category: number | null;
  reporting_period?: string;
  source_id?: string | null;
  source_type?: string | null;
}

export const SCOPE3_CATEGORY_LABELS: Record<number, string> = {
  1: 'Кат. 1: Закупени стоки и услуги',
  4: 'Кат. 4: Транспорт нагоре по веригата',
  5: 'Кат. 5: Генерирани отпадъци',
  6: 'Кат. 6: Бизнес пътувания',
  7: 'Кат. 7: Пътуване на служители',
};

const BG_MONTHS = ['Яну', 'Фев', 'Мар', 'Апр', 'Май', 'Юни', 'Юли', 'Авг', 'Сеп', 'Окт', 'Ное', 'Дек'];

/** Round to 3 decimal places (tCO₂e display precision). */
export function roundTco2e(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function pctChange(from: number, to: number): number {
  if (from === 0) return 0;
  return ((to - from) / from) * 100;
}

export function sumScope12Rows(rows: Scope12Row[], scope?: number): number {
  return rows
    .filter((r) => scope == null || r.scope === scope)
    .reduce((s, r) => s + (r.calculated_co2e || 0), 0);
}

export function sumScope3Kg(rows: Scope3Row[]): number {
  return rows.reduce((s, r) => s + parseFloat(String(r.co2e_kg ?? 0)), 0);
}

export function scope3ToTco2e(rows: Scope3Row[]): number {
  return roundTco2e(sumScope3Kg(rows) / 1000);
}

export function buildScopeTotals(scope1: number, scope2: number, scope3: number): ScopeTotals {
  const s1 = roundTco2e(scope1);
  const s2 = roundTco2e(scope2);
  const s3 = roundTco2e(scope3);
  return { scope1: s1, scope2: s2, scope3: s3, total: roundTco2e(s1 + s2 + s3) };
}

export interface FootprintOptions {
  /** Include only months 1..throughMonth (for fair YTD vs same-period-last-year) */
  throughMonth?: number;
}

function monthFromPeriod(period: string): number {
  return parseInt(period.slice(5, 7), 10);
}

function filterScope12ByMonth(rows: Scope12Row[], throughMonth?: number): Scope12Row[] {
  if (!throughMonth || throughMonth >= 12) return rows;
  return rows.filter((r) => monthFromPeriod(r.reporting_period) <= throughMonth);
}

function filterScope3ByMonth(rows: Scope3Row[], throughMonth?: number): Scope3Row[] {
  if (!throughMonth || throughMonth >= 12) return rows;
  return rows.filter(
    (r) => r.reporting_period && monthFromPeriod(r.reporting_period) <= throughMonth,
  );
}

export async function fetchScope12Rows(
  supabase: SupabaseClient,
  companyId: string,
  year: number,
  throughMonth?: number,
): Promise<Scope12Row[]> {
  const { data, error } = await supabase
    .from('emission_data')
    .select('scope, calculated_co2e, reporting_period')
    .eq('company_id', companyId)
    .gte('reporting_period', `${year}-01-01`)
    .lte('reporting_period', `${year}-12-31`);

  if (error) throw error;
  return filterScope12ByMonth(data ?? [], throughMonth);
}

export async function fetchScope3Rows(
  supabase: SupabaseClient,
  companyId: string,
  year: number,
  throughMonth?: number,
): Promise<Scope3Row[]> {
  const { data, error } = await supabase
    .from('calculated_emissions')
    .select('co2e_kg, scope_category, reporting_period, source_id, source_type')
    .eq('company_id', companyId)
    .eq('scope', 3)
    .gte('reporting_period', `${year}-01-01`)
    .lte('reporting_period', `${year}-12-31`);

  if (error) throw error;
  return filterScope3ByMonth(data ?? [], throughMonth);
}

/**
 * Canonical annual footprint for a company (Scope 1 + 2 + 3).
 */
export async function getCompanyFootprint(
  supabase: SupabaseClient,
  companyId: string,
  year: number,
  options?: FootprintOptions,
): Promise<YearFootprint> {
  const throughMonth = options?.throughMonth;
  const [scope12, scope3Rows] = await Promise.all([
    fetchScope12Rows(supabase, companyId, year, throughMonth),
    fetchScope3Rows(supabase, companyId, year, throughMonth),
  ]);

  const totals = buildScopeTotals(
    sumScope12Rows(scope12, 1),
    sumScope12Rows(scope12, 2),
    scope3ToTco2e(scope3Rows),
  );

  return { year, ...totals };
}

/** Footprint for a single scope (1, 2, or 3) or all scopes when scope is null. */
export async function getScopedFootprint(
  supabase: SupabaseClient,
  companyId: string,
  year: number,
  scope: number | null,
): Promise<number> {
  if (scope === 3) {
    const rows = await fetchScope3Rows(supabase, companyId, year);
    return scope3ToTco2e(rows);
  }

  const rows = await fetchScope12Rows(supabase, companyId, year);
  if (scope === 1 || scope === 2) {
    return roundTco2e(sumScope12Rows(rows, scope));
  }

  const fp = await getCompanyFootprint(supabase, companyId, year);
  return fp.total;
}

export interface FairYoYComparison {
  selectedYear: number;
  previousYear: number;
  current: YearFootprint;
  previous: YearFootprint;
  totalChangePercent: number | null;
  scope1ChangePercent: number | null;
  scope2ChangePercent: number | null;
  scope3ChangePercent: number | null;
}

/**
 * Fair YoY: for the current calendar year, compare YTD through current month
 * against the same months in the previous year. For past years, compare full years.
 */
export async function getFairYoYComparison(
  supabase: SupabaseClient,
  companyId: string,
  selectedYear: number,
  referenceDate: Date = new Date(),
): Promise<FairYoYComparison> {
  const isCurrentCalendarYear = selectedYear === referenceDate.getFullYear();
  const throughMonth = isCurrentCalendarYear ? referenceDate.getMonth() + 1 : undefined;
  const options = throughMonth ? { throughMonth } : undefined;

  const [current, previous] = await Promise.all([
    getCompanyFootprint(supabase, companyId, selectedYear, options),
    getCompanyFootprint(supabase, companyId, selectedYear - 1, options),
  ]);

  const pctOrNull = (from: number, to: number) => (from > 0 ? pctChange(from, to) : null);

  return {
    selectedYear,
    previousYear: selectedYear - 1,
    current,
    previous,
    totalChangePercent: pctOrNull(previous.total, current.total),
    scope1ChangePercent: pctOrNull(previous.scope1, current.scope1),
    scope2ChangePercent: pctOrNull(previous.scope2, current.scope2),
    scope3ChangePercent: pctOrNull(previous.scope3, current.scope3),
  };
}

export interface YoYComparison {
  currentYear: number;
  previousYear: number;
  currentTotal: number;
  previousTotal: number;
  change: number;
  changePercent: number;
}

/** Year-over-year comparison using the same canonical totals (all scopes). */
export async function getYoYComparison(
  supabase: SupabaseClient,
  companyId: string,
  year: number,
): Promise<YoYComparison> {
  const [current, previous] = await Promise.all([
    getCompanyFootprint(supabase, companyId, year),
    getCompanyFootprint(supabase, companyId, year - 1),
  ]);

  const change = roundTco2e(current.total - previous.total);

  return {
    currentYear: year,
    previousYear: year - 1,
    currentTotal: current.total,
    previousTotal: previous.total,
    change,
    changePercent: previous.total > 0 ? pctChange(previous.total, current.total) : 0,
  };
}

export interface MonthlyScope12Point {
  month: number;
  label: string;
  total: number;
}

export function buildMonthlyScope12(
  rows: Scope12Row[],
): MonthlyScope12Point[] {
  return Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const pad = String(month).padStart(2, '0');
    const total = rows
      .filter((r) => r.reporting_period?.slice(5, 7) === pad)
      .reduce((s, r) => s + (r.calculated_co2e || 0), 0);
    return { month, label: BG_MONTHS[i], total: roundTco2e(total) };
  });
}

export function scope3CategoryLabel(scopeCategory: number | null | undefined): string {
  if (scopeCategory == null) return 'Некласифицирано';
  return SCOPE3_CATEGORY_LABELS[scopeCategory] ?? `Кат. ${scopeCategory}`;
}

export interface Scope3CategoryTotal {
  category: string;
  tco2e: number;
}

export function buildScope3CategoryTotals(rows: Scope3Row[]): Scope3CategoryTotal[] {
  const map: Record<string, number> = {};
  for (const row of rows) {
    const label = scope3CategoryLabel(row.scope_category);
    map[label] = (map[label] ?? 0) + parseFloat(String(row.co2e_kg ?? 0)) / 1000;
  }
  return Object.entries(map).map(([category, tco2e]) => ({
    category,
    tco2e: roundTco2e(tco2e),
  }));
}
