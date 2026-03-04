import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export interface ForecastPoint {
  year: number;
  actual?: number;       // real measured emission data
  required: number;      // linear path baseline → target
  projected?: number;    // trend extrapolation from actuals
}

export interface ForecastResult {
  forecastPoints: ForecastPoint[];
  targetAbsoluteValue: number;
  annualReductionRate: number;   // % reduction per year needed
  isSBTiAligned: boolean;        // ≥ 4.2 % / year
  projectedFinal: number;        // where the trend lands at target_year
  willAchieve: boolean;
  lastActualYear: number;
  lastActualValue: number;
  totalYears: number;
  yearsRemaining: number;
  annualCO2eRequired: number;    // tCO2e to cut per year from NOW
}

/**
 * GET /api/targets/forecast?targetId=xxx
 * Returns year-by-year trajectory data for charting.
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetId = searchParams.get('targetId');
    if (!targetId) {
      return NextResponse.json({ error: 'targetId required' }, { status: 400 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('company_id, role')
      .eq('id', user.id)
      .single();

    if (!userData?.company_id) {
      return NextResponse.json({ error: 'No company associated' }, { status: 400 });
    }

    // Load target
    const { data: target, error: targetErr } = await supabase
      .from('emission_targets')
      .select('*')
      .eq('id', targetId)
      .single();

    if (targetErr || !target) {
      return NextResponse.json({ error: 'Target not found' }, { status: 404 });
    }

    if (target.company_id !== userData.company_id && userData.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const now = new Date();
    const currentYear = now.getFullYear();

    // ── Gather historical emissions per year ──────────────────────────────
    const historicalData: Record<number, number> = {};
    historicalData[target.baseline_year] = target.baseline_value;

    const yearsToFetch: number[] = [];
    for (let y = target.baseline_year + 1; y <= currentYear; y++) {
      yearsToFetch.push(y);
    }

    for (const year of yearsToFetch) {
      const start = `${year}-01-01`;
      const end   = `${year}-12-31`;

      if (target.scope === 3) {
        // Scope 3: pull from calculated_emissions
        const { data: s3 } = await supabase
          .from('calculated_emissions')
          .select('co2e_kg')
          .eq('company_id', userData.company_id)
          .gte('calculated_at', start)
          .lte('calculated_at', end);

        if (s3 && s3.length > 0) {
          historicalData[year] = s3.reduce((s, r) => s + (r.co2e_kg || 0), 0) / 1000; // kg → tCO2e
        }
      } else {
        // Scope 1/2 (or all): pull from emission_data
        let q = supabase
          .from('emission_data')
          .select('scope, calculated_co2e')
          .eq('company_id', userData.company_id)
          .gte('reporting_period', start)
          .lte('reporting_period', end);

        if (target.scope === 1 || target.scope === 2) {
          q = q.eq('scope', target.scope);
        }

        const { data: ed } = await q;
        if (ed && ed.length > 0) {
          historicalData[year] = ed.reduce((s, r) => s + (r.calculated_co2e || 0), 0);
        }
      }
    }

    // ── Build forecast geometry ───────────────────────────────────────────
    const totalYears       = target.target_year - target.baseline_year;
    const targetAbsolute   = target.target_type === 'percentage'
      ? target.baseline_value * (1 - target.target_value / 100)
      : target.target_value;

    const reductionPerYear = totalYears > 0
      ? (target.baseline_value - targetAbsolute) / totalYears
      : 0;

    // Determine last year with actual data
    const actualYears   = Object.keys(historicalData).map(Number).sort();
    const lastActualYear = Math.max(...actualYears);
    const lastActualValue = historicalData[lastActualYear] ?? target.current_value ?? target.baseline_value;

    // Linear regression over actual points for trend line
    let projSlope = -reductionPerYear; // default: same slope as required
    if (actualYears.length >= 2) {
      const n    = actualYears.length;
      const sumX  = actualYears.reduce((s, y) => s + y, 0);
      const sumY  = actualYears.reduce((s, y) => s + historicalData[y], 0);
      const sumXY = actualYears.reduce((s, y) => s + y * historicalData[y], 0);
      const sumX2 = actualYears.reduce((s, y) => s + y * y, 0);
      const denom = n * sumX2 - sumX * sumX;
      if (denom !== 0) projSlope = (n * sumXY - sumX * sumY) / denom;
    }

    // Build full year range baseline → target_year
    const allYears: number[] = [];
    for (let y = target.baseline_year; y <= target.target_year; y++) allYears.push(y);

    const forecastPoints: ForecastPoint[] = allYears.map(year => {
      const yFromBase = year - target.baseline_year;
      const required  = Math.max(0, target.baseline_value - reductionPerYear * yFromBase);

      const actual = historicalData[year] !== undefined ? historicalData[year] : undefined;

      let projected: number | undefined;
      if (year >= lastActualYear && year <= target.target_year) {
        projected = Math.max(0, lastActualValue + projSlope * (year - lastActualYear));
      }

      return { year, actual, required, projected };
    });

    // ── Derived metrics ───────────────────────────────────────────────────
    const projectedFinal = Math.max(0, lastActualValue + projSlope * (target.target_year - lastActualYear));
    const willAchieve    = projectedFinal <= targetAbsolute;

    const annualReductionRate = target.baseline_value > 0
      ? (reductionPerYear / target.baseline_value) * 100
      : 0;
    const isSBTiAligned = annualReductionRate >= 4.2;

    const yearsRemaining      = Math.max(0, target.target_year - currentYear);
    const annualCO2eRequired  = yearsRemaining > 0
      ? (lastActualValue - targetAbsolute) / yearsRemaining
      : 0;

    const result: ForecastResult = {
      forecastPoints,
      targetAbsoluteValue: targetAbsolute,
      annualReductionRate,
      isSBTiAligned,
      projectedFinal,
      willAchieve,
      lastActualYear,
      lastActualValue,
      totalYears,
      yearsRemaining,
      annualCO2eRequired: Math.max(0, annualCO2eRequired),
    };

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error('Forecast error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
