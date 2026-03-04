import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export interface MonthlyPoint {
  month: number;         // 1-12
  label: string;         // "Яну", "Фев", …
  yearA: number;
  yearB: number;
}

export interface ComparisonResult {
  yearA: number;
  yearB: number;
  scope1A: number; scope1B: number;
  scope2A: number; scope2B: number;
  scope3A: number; scope3B: number;
  totalA:  number; totalB:  number;
  delta1:  number; delta2:  number; delta3:  number; deltaTotal: number; // absolute tCO2e change
  pct1:    number; pct2:    number; pct3:    number; pctTotal:   number; // % change (negative = improvement)
  monthly: MonthlyPoint[];  // scope 1+2 only (emission_data is monthly)
  topCategories: { category: string; yearA: number; yearB: number; delta: number }[];
}

const BG_MONTHS = ['Яну','Фев','Мар','Апр','Май','Юни','Юли','Авг','Сеп','Окт','Ное','Дек'];

/**
 * GET /api/comparison?yearA=2024&yearB=2025
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: userData } = await supabase
      .from('users')
      .select('company_id, role')
      .eq('id', user.id)
      .single();
    if (!userData?.company_id) return NextResponse.json({ error: 'No company' }, { status: 400 });

    const { searchParams } = new URL(request.url);
    const now   = new Date().getFullYear();
    const yearB = parseInt(searchParams.get('yearB') ?? String(now));
    const yearA = parseInt(searchParams.get('yearA') ?? String(yearB - 1));

    // Helper: sum emission_data for a given year + optional scope
    async function fetchScope12(year: number) {
      const { data } = await supabase
        .from('emission_data')
        .select('scope, calculated_co2e, reporting_period')
        .eq('company_id', userData!.company_id)
        .gte('reporting_period', `${year}-01-01`)
        .lte('reporting_period', `${year}-12-31`);
      return data ?? [];
    }

    // Helper: sum calculated_emissions for a given year (Scope 3)
    async function fetchScope3(year: number) {
      const { data } = await supabase
        .from('calculated_emissions')
        .select('co2e_kg, category')
        .eq('company_id', userData!.company_id)
        .gte('calculated_at', `${year}-01-01`)
        .lte('calculated_at', `${year}-12-31`);
      return data ?? [];
    }

    const [edA, edB, s3A, s3B] = await Promise.all([
      fetchScope12(yearA),
      fetchScope12(yearB),
      fetchScope3(yearA),
      fetchScope3(yearB),
    ]);

    const sum = (rows: any[], scopeFilter?: number) =>
      rows
        .filter(r => scopeFilter == null || r.scope === scopeFilter)
        .reduce((s, r) => s + (r.calculated_co2e || 0), 0);

    const sum3 = (rows: any[]) =>
      rows.reduce((s, r) => s + (r.co2e_kg || 0), 0) / 1000; // kg → tCO2e

    const scope1A = sum(edA, 1), scope1B = sum(edB, 1);
    const scope2A = sum(edA, 2), scope2B = sum(edB, 2);
    const scope3Av = sum3(s3A),  scope3Bv = sum3(s3B);
    const totalA  = scope1A + scope2A + scope3Av;
    const totalB  = scope1B + scope2B + scope3Bv;

    const pctChg = (a: number, b: number) =>
      a === 0 ? 0 : ((b - a) / a) * 100;

    // Monthly comparison (Scope 1+2 per month for both years)
    const monthly: MonthlyPoint[] = Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const pad = String(m).padStart(2, '0');
      const totA = edA
        .filter(r => r.reporting_period?.slice(5, 7) === pad)
        .reduce((s, r) => s + (r.calculated_co2e || 0), 0);
      const totB = edB
        .filter(r => r.reporting_period?.slice(5, 7) === pad)
        .reduce((s, r) => s + (r.calculated_co2e || 0), 0);
      return { month: m, label: BG_MONTHS[i], yearA: totA, yearB: totB };
    });

    // Top Scope 3 categories comparison
    const catMap: Record<string, { a: number; b: number }> = {};
    s3A.forEach(r => {
      const c = r.category ?? 'Некласифицирано';
      catMap[c] = catMap[c] ?? { a: 0, b: 0 };
      catMap[c].a += (r.co2e_kg || 0) / 1000;
    });
    s3B.forEach(r => {
      const c = r.category ?? 'Некласифицирано';
      catMap[c] = catMap[c] ?? { a: 0, b: 0 };
      catMap[c].b += (r.co2e_kg || 0) / 1000;
    });
    const topCategories = Object.entries(catMap)
      .map(([category, { a, b }]) => ({ category, yearA: a, yearB: b, delta: b - a }))
      .sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta))
      .slice(0, 6);

    const result: ComparisonResult = {
      yearA, yearB,
      scope1A, scope1B,
      scope2A, scope2B,
      scope3A: scope3Av, scope3B: scope3Bv,
      totalA,  totalB,
      delta1: scope1B - scope1A, delta2: scope2B - scope2A, delta3: scope3Bv - scope3Av, deltaTotal: totalB - totalA,
      pct1: pctChg(scope1A, scope1B), pct2: pctChg(scope2A, scope2B),
      pct3: pctChg(scope3Av, scope3Bv), pctTotal: pctChg(totalA, totalB),
      monthly,
      topCategories,
    };

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error('Comparison error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
