import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  buildMonthlyScope12,
  buildScope3CategoryTotals,
  fetchScope12Rows,
  fetchScope3Rows,
  getCompanyFootprint,
  pctChange,
  roundTco2e,
} from '@/lib/carbon/footprint-service';

export interface MonthlyPoint {
  month: number;
  label: string;
  yearA: number;
  yearB: number;
}

export interface ComparisonResult {
  yearA: number;
  yearB: number;
  scope1A: number; scope1B: number;
  scope2A: number; scope2B: number;
  scope3A: number; scope3B: number;
  totalA: number; totalB: number;
  delta1: number; delta2: number; delta3: number; deltaTotal: number;
  pct1: number; pct2: number; pct3: number; pctTotal: number;
  monthly: MonthlyPoint[];
  topCategories: { category: string; yearA: number; yearB: number; delta: number }[];
}

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
      .select('company_id')
      .eq('id', user.id)
      .single();
    if (!userData?.company_id) return NextResponse.json({ error: 'No company' }, { status: 400 });

    const companyId = userData.company_id;
    const { searchParams } = new URL(request.url);
    const now = new Date().getFullYear();
    const yearB = parseInt(searchParams.get('yearB') ?? String(now));
    const yearA = parseInt(searchParams.get('yearA') ?? String(yearB - 1));

    const [footprintA, footprintB, edA, edB, s3A, s3B] = await Promise.all([
      getCompanyFootprint(supabase, companyId, yearA),
      getCompanyFootprint(supabase, companyId, yearB),
      fetchScope12Rows(supabase, companyId, yearA),
      fetchScope12Rows(supabase, companyId, yearB),
      fetchScope3Rows(supabase, companyId, yearA),
      fetchScope3Rows(supabase, companyId, yearB),
    ]);

    const monthlyA = buildMonthlyScope12(edA);
    const monthlyB = buildMonthlyScope12(edB);
    const monthly: MonthlyPoint[] = monthlyA.map((m, i) => ({
      month: m.month,
      label: m.label,
      yearA: m.total,
      yearB: monthlyB[i]?.total ?? 0,
    }));

    const catsA = buildScope3CategoryTotals(s3A);
    const catsB = buildScope3CategoryTotals(s3B);
    const catKeys = new Set([...catsA.map((c) => c.category), ...catsB.map((c) => c.category)]);
    const topCategories = [...catKeys]
      .map((category) => {
        const a = catsA.find((c) => c.category === category)?.tco2e ?? 0;
        const b = catsB.find((c) => c.category === category)?.tco2e ?? 0;
        return { category, yearA: a, yearB: b, delta: roundTco2e(b - a) };
      })
      .sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta))
      .slice(0, 6);

    const result: ComparisonResult = {
      yearA,
      yearB,
      scope1A: footprintA.scope1,
      scope1B: footprintB.scope1,
      scope2A: footprintA.scope2,
      scope2B: footprintB.scope2,
      scope3A: footprintA.scope3,
      scope3B: footprintB.scope3,
      totalA: footprintA.total,
      totalB: footprintB.total,
      delta1: roundTco2e(footprintB.scope1 - footprintA.scope1),
      delta2: roundTco2e(footprintB.scope2 - footprintA.scope2),
      delta3: roundTco2e(footprintB.scope3 - footprintA.scope3),
      deltaTotal: roundTco2e(footprintB.total - footprintA.total),
      pct1: pctChange(footprintA.scope1, footprintB.scope1),
      pct2: pctChange(footprintA.scope2, footprintB.scope2),
      pct3: pctChange(footprintA.scope3, footprintB.scope3),
      pctTotal: pctChange(footprintA.total, footprintB.total),
      monthly,
      topCategories,
    };

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error('Comparison error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
