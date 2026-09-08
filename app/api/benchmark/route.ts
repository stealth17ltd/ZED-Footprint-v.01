import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCompanyFootprint, roundTco2e } from '@/lib/carbon/footprint-service';

// ─────────────────────────────────────────────────────────────────────────────
// Industry benchmark data (tCO2e per employee per year)
// Source: EU ETS, GHG Protocol sector guides, Eurostat, CDP SME benchmarks
// These are conservative medians for Bulgarian/SEE SMEs — update as better
// regional data becomes available.
// ─────────────────────────────────────────────────────────────────────────────
export interface IndustryBenchmark {
  sector: string;
  tco2e_per_employee: number;   // total (S1+S2+S3)
  scope1_pct: number;           // typical % of total
  scope2_pct: number;
  scope3_pct: number;
  top_categories: string[];     // biggest Scope 3 contributors
}

export const INDUSTRY_BENCHMARKS: Record<string, IndustryBenchmark> = {
  'Производство':              { sector: 'Производство',              tco2e_per_employee: 28,  scope1_pct: 20, scope2_pct: 20, scope3_pct: 60, top_categories: ['Суровини', 'Транспорт', 'Енергия'] },
  'Търговия на дребно':        { sector: 'Търговия на дребно',        tco2e_per_employee: 9,   scope1_pct: 8,  scope2_pct: 22, scope3_pct: 70, top_categories: ['Закупени стоки', 'Опаковки', 'Транспорт'] },
  'Търговия на едро':          { sector: 'Търговия на едро',          tco2e_per_employee: 14,  scope1_pct: 12, scope2_pct: 18, scope3_pct: 70, top_categories: ['Закупени стоки', 'Транспорт', 'Складиране'] },
  'Строителство':              { sector: 'Строителство',              tco2e_per_employee: 22,  scope1_pct: 25, scope2_pct: 15, scope3_pct: 60, top_categories: ['Строителни материали', 'Гориво', 'Отпадъци'] },
  'Транспорт и логистика':     { sector: 'Транспорт и логистика',     tco2e_per_employee: 35,  scope1_pct: 55, scope2_pct: 10, scope3_pct: 35, top_categories: ['Гориво', 'Поддръжка', 'Закупени услуги'] },
  'ИТ и технологии':           { sector: 'ИТ и технологии',           tco2e_per_employee: 5.5, scope1_pct: 5,  scope2_pct: 20, scope3_pct: 75, top_categories: ['Облачни услуги', 'Хардуер', 'Командировки'] },
  'Финанси и застраховане':    { sector: 'Финанси и застраховане',    tco2e_per_employee: 4.8, scope1_pct: 4,  scope2_pct: 18, scope3_pct: 78, top_categories: ['Офис консумативи', 'Командировки', 'Доставчици'] },
  'Здравеопазване':            { sector: 'Здравеопазване',            tco2e_per_employee: 8,   scope1_pct: 10, scope2_pct: 25, scope3_pct: 65, top_categories: ['Консумативи', 'Хранене', 'Транспорт'] },
  'Образование':               { sector: 'Образование',               tco2e_per_employee: 3.5, scope1_pct: 10, scope2_pct: 30, scope3_pct: 60, top_categories: ['Ток', 'Транспорт', 'Материали'] },
  'Хотелиерство и ресторантьорство': { sector: 'Хотелиерство и ресторантьорство', tco2e_per_employee: 11, scope1_pct: 18, scope2_pct: 22, scope3_pct: 60, top_categories: ['Хранене', 'Ток', 'Вода'] },
  'Земеделие':                 { sector: 'Земеделие',                 tco2e_per_employee: 45,  scope1_pct: 40, scope2_pct: 10, scope3_pct: 50, top_categories: ['Торове', 'Гориво', 'Животновъдство'] },
  'Енергетика':                { sector: 'Енергетика',                tco2e_per_employee: 52,  scope1_pct: 50, scope2_pct: 15, scope3_pct: 35, top_categories: ['Горива', 'Оборудване', 'Транспорт'] },
  'Консултантски услуги':      { sector: 'Консултантски услуги',      tco2e_per_employee: 4.2, scope1_pct: 5,  scope2_pct: 15, scope3_pct: 80, top_categories: ['Командировки', 'Офис', 'ИТ'] },
  'Друго':                     { sector: 'Друго',                     tco2e_per_employee: 10,  scope1_pct: 10, scope2_pct: 20, scope3_pct: 70, top_categories: ['Разнообразно'] },
};

const DEFAULT_BENCHMARK = INDUSTRY_BENCHMARKS['Друго'];

export interface BenchmarkResult {
  year: number;
  sector: string;
  employeeCount: number;

  // Company actuals
  actualScope1: number;         // tCO2e
  actualScope2: number;
  actualScope3: number;
  actualTotal: number;
  actualPerEmployee: number;    // tCO2e/employee

  // Industry benchmark
  benchmark: IndustryBenchmark;
  benchmarkTotal: number;       // benchmark total for same employee count (tCO2e)

  // Comparison
  vsIndustryPct: number;        // positive = above average (worse), negative = below (better)
  performanceGrade: 'A' | 'B' | 'C' | 'D';  // A = top 25%, D = bottom 25%
  percentileEstimate: number;   // 0-100, higher = better (lower emissions)

  // Scope distribution actuals (%)
  scope1ActualPct: number;
  scope2ActualPct: number;
  scope3ActualPct: number;

  // Top reduction opportunities
  reductionOpportunities: Array<{
    area: string;
    potentialPct: number;
    description: string;
    effort: 'Ниско' | 'Средно' | 'Високо';
    co2eSaving: number;         // tCO2e/yr estimate
  }>;

  hasData: boolean;
}

function grade(vsIndustryPct: number): 'A' | 'B' | 'C' | 'D' {
  if (vsIndustryPct <= -20) return 'A';
  if (vsIndustryPct <= 0)   return 'B';
  if (vsIndustryPct <= 30)  return 'C';
  return 'D';
}

function percentile(vsIndustryPct: number): number {
  // Rough mapping: -50% = 90th percentile, 0% = 50th, +50% = 20th, +100% = 5th
  if (vsIndustryPct <= -50) return 92;
  if (vsIndustryPct <= -30) return 80;
  if (vsIndustryPct <= -10) return 65;
  if (vsIndustryPct <= 0)   return 55;
  if (vsIndustryPct <= 20)  return 40;
  if (vsIndustryPct <= 50)  return 28;
  if (vsIndustryPct <= 100) return 15;
  return 8;
}

function buildOpportunities(
  sector: string,
  actualScope1: number,
  actualScope2: number,
  actualScope3: number,
  total: number,
): BenchmarkResult['reductionOpportunities'] {
  const opps: BenchmarkResult['reductionOpportunities'] = [];

  // Scope 2 — switch to renewables (always applicable, quick win)
  if (actualScope2 > 0) {
    opps.push({
      area: 'Зелена електроенергия',
      potentialPct: 80,
      description: 'Преминете към договор с 100% ВЕИ или инсталирайте соларни панели. Намалява Обхват 2 с до 80%.',
      effort: 'Ниско',
      co2eSaving: Math.round(actualScope2 * 0.8 * 10) / 10,
    });
  }

  // Scope 3 supplier optimization
  if (actualScope3 > 0.1 * total) {
    opps.push({
      area: 'Оптимизация на доставчици',
      potentialPct: 15,
      description: 'Заменете 3-5 доставчика с по-ниско въглероден еквивалент. Изискайте EPD данни от ключовите доставчици.',
      effort: 'Средно',
      co2eSaving: Math.round(actualScope3 * 0.15 * 10) / 10,
    });
  }

  // Business travel
  if (['ИТ и технологии', 'Финанси и застраховане', 'Консултантски услуги'].includes(sector)) {
    opps.push({
      area: 'Командировки — видеоконференции',
      potentialPct: 40,
      description: 'Политика за замяна на вътрешни полети с видеоконференции. Намалява Кат. 6 с 30-50%.',
      effort: 'Ниско',
      co2eSaving: Math.round(total * 0.05 * 10) / 10,
    });
  }

  // Scope 1 — fleet electrification
  if (actualScope1 > 0.1 * total) {
    opps.push({
      area: 'Електрифициране на автопарка',
      potentialPct: 60,
      description: 'Замяна на дизелови/бензинови превозни средства с електрически при следваща смяна.',
      effort: 'Високо',
      co2eSaving: Math.round(actualScope1 * 0.6 * 10) / 10,
    });
  }

  // Energy efficiency
  if (actualScope2 > 0) {
    opps.push({
      area: 'Енергийна ефективност',
      potentialPct: 20,
      description: 'LED осветление, термопомпи, умни термостати. Намалява Обхват 2 с 15-25% без промяна на договора.',
      effort: 'Средно',
      co2eSaving: Math.round(actualScope2 * 0.2 * 10) / 10,
    });
  }

  // Waste reduction
  opps.push({
    area: 'Намаляване на отпадъците',
    potentialPct: 30,
    description: 'Одит на отпадъците, компостиране, намаляване на опаковките. Намалява Кат. 5 с до 30%.',
    effort: 'Ниско',
    co2eSaving: Math.round(total * 0.02 * 10) / 10,
  });

  // Sort by savings descending, cap at 5
  return opps.sort((a, b) => b.co2eSaving - a.co2eSaving).slice(0, 5);
}

/**
 * GET /api/benchmark?year=2025
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: userData } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single();
    if (!userData?.company_id) return NextResponse.json({ error: 'No company' }, { status: 400 });

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()));

    // Company profile
    const { data: company } = await supabase
      .from('companies')
      .select('company_name, industry_sector, employee_count')
      .eq('id', userData.company_id)
      .single();

    const sector       = company?.industry_sector ?? 'Друго';
    const employeeCount = company?.employee_count ?? 10;
    const benchmark    = INDUSTRY_BENCHMARKS[sector] ?? DEFAULT_BENCHMARK;

    const footprint = await getCompanyFootprint(supabase, userData.company_id, year);
    const actualScope1 = footprint.scope1;
    const actualScope2 = footprint.scope2;
    const actualScope3 = footprint.scope3;
    const actualTotal  = footprint.total;
    const hasData      = actualTotal > 0;

    // Per-employee intensity
    const actualPerEmployee   = employeeCount > 0 ? actualTotal / employeeCount : 0;
    const benchmarkTotal      = benchmark.tco2e_per_employee * employeeCount;
    const vsIndustryPct       = benchmarkTotal > 0
      ? Math.round(((actualPerEmployee - benchmark.tco2e_per_employee) / benchmark.tco2e_per_employee) * 100)
      : 0;

    // Scope distribution
    const scope1ActualPct = actualTotal > 0 ? Math.round((actualScope1 / actualTotal) * 100) : 0;
    const scope2ActualPct = actualTotal > 0 ? Math.round((actualScope2 / actualTotal) * 100) : 0;
    const scope3ActualPct = actualTotal > 0 ? Math.round((actualScope3 / actualTotal) * 100) : 0;

    const result: BenchmarkResult = {
      year,
      sector,
      employeeCount,
      actualScope1:      actualScope1,
      actualScope2:      actualScope2,
      actualScope3:      actualScope3,
      actualTotal:       actualTotal,
      actualPerEmployee: roundTco2e(actualPerEmployee),
      benchmark,
      benchmarkTotal:    Math.round(benchmarkTotal * 100) / 100,
      vsIndustryPct:     hasData ? vsIndustryPct : 0,
      performanceGrade:  hasData ? grade(vsIndustryPct) : 'C',
      percentileEstimate: hasData ? percentile(vsIndustryPct) : 50,
      scope1ActualPct,
      scope2ActualPct,
      scope3ActualPct,
      reductionOpportunities: buildOpportunities(sector, actualScope1, actualScope2, actualScope3, actualTotal),
      hasData,
    };

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error('Benchmark error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
