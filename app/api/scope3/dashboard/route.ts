import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/scope3/dashboard
 * Returns aggregated Scope 3 dashboard data for the company
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!userData?.company_id) {
      return NextResponse.json({ error: 'Company not found' }, { status: 400 });
    }

    const companyId = userData.company_id;
    const { searchParams } = new URL(req.url);
    const year = searchParams.get('year') || new Date().getFullYear().toString();

    // 1. Transaction stats - fetch separately for reliability
    const { data: transactions } = await supabase
      .from('transactions')
      .select('id, amount_base_currency, txn_date')
      .eq('company_id', companyId)
      .gte('txn_date', `${year}-01-01`)
      .lte('txn_date', `${year}-12-31`);

    const totalTransactions = transactions?.length || 0;
    const totalSpend = transactions?.reduce((sum, t) => sum + (t.amount_base_currency || 0), 0) || 0;

    // Count classified transactions via direct join
    let classifiedCount = 0;
    if (transactions && transactions.length > 0) {
      const txnIds = transactions.map(t => t.id);
      const { data: classified } = await supabase
        .from('transaction_classifications')
        .select('transaction_id')
        .in('transaction_id', txnIds);
      // unique transaction IDs that have at least one classification
      const classifiedIds = new Set(classified?.map(c => c.transaction_id) || []);
      classifiedCount = classifiedIds.size;
    }

    // 2. Calculated emissions - total & by category
    const { data: emissions } = await supabase
      .from('calculated_emissions')
      .select('*')
      .eq('company_id', companyId)
      .eq('scope', 3)
      .gte('reporting_period', `${year}-01-01`)
      .lte('reporting_period', `${year}-12-31`);

    const totalCo2eKg = emissions?.reduce((sum, e) => sum + parseFloat(e.co2e_kg.toString()), 0) || 0;
    const totalCo2eTons = totalCo2eKg / 1000;

    // By category
    const byCategory: Record<number, { co2e_kg: number; co2e_tons: number; count: number; label: string }> = {};
    const CATEGORY_LABELS: Record<number, string> = {
      1: 'Кат. 1: Закупени стоки и услуги',
      4: 'Кат. 4: Транспорт нагоре по веригата',
      5: 'Кат. 5: Генерирани отпадъци',
      6: 'Кат. 6: Бизнес пътувания',
      7: 'Кат. 7: Пътуване на служители',
    };

    emissions?.forEach(e => {
      const cat = e.scope_category || 0;
      if (!byCategory[cat]) {
        byCategory[cat] = { co2e_kg: 0, co2e_tons: 0, count: 0, label: CATEGORY_LABELS[cat] || `Кат. ${cat}` };
      }
      byCategory[cat].co2e_kg += parseFloat(e.co2e_kg.toString());
      byCategory[cat].count += 1;
    });

    // Compute tons after summing kg
    Object.values(byCategory).forEach(c => { c.co2e_tons = c.co2e_kg / 1000; });

    const categoryChartData = Object.entries(byCategory)
      .map(([cat, data]) => ({
        category: parseInt(cat),
        label: data.label,
        shortLabel: `Кат. ${cat}`,
        co2e_tons: Math.round(data.co2e_tons * 1000) / 1000,
        count: data.count,
        percentage: totalCo2eKg > 0 ? Math.round((data.co2e_kg / totalCo2eKg) * 100) : 0,
      }))
      .sort((a, b) => b.co2e_tons - a.co2e_tons);

    // 3. Monthly trend (all months in year)
    const monthlyMap: Record<string, { month: string; monthNum: number; co2e_kg: number }> = {};

    for (let m = 1; m <= 12; m++) {
      const key = `${year}-${String(m).padStart(2, '0')}`;
      const label = new Date(parseInt(year), m - 1, 1).toLocaleString('bg-BG', { month: 'short' });
      monthlyMap[key] = { month: label, monthNum: m, co2e_kg: 0 };
    }

    emissions?.forEach(e => {
      const key = e.reporting_period.substring(0, 7);
      if (monthlyMap[key]) {
        monthlyMap[key].co2e_kg += parseFloat(e.co2e_kg.toString());
      }
    });

    const monthlyTrend = Object.values(monthlyMap)
      .sort((a, b) => a.monthNum - b.monthNum)
      .map(m => ({
        month: m.month,
        co2e_tons: Math.round((m.co2e_kg / 1000) * 1000) / 1000,
      }));

    // 4. Top suppliers by spend
    const supplierMap: Record<string, { supplier: string; spend: number; co2e_kg: number; txn_count: number }> = {};

    const { data: txnWithSuppliers } = await supabase
      .from('transactions')
      .select(`
        supplier,
        amount_base_currency,
        calculated_emissions:calculated_emissions(co2e_kg)
      `)
      .eq('company_id', companyId)
      .gte('txn_date', `${year}-01-01`)
      .lte('txn_date', `${year}-12-31`);

    txnWithSuppliers?.forEach((t: any) => {
      const s = t.supplier || 'Неизвестен';
      if (!supplierMap[s]) supplierMap[s] = { supplier: s, spend: 0, co2e_kg: 0, txn_count: 0 };
      supplierMap[s].spend += t.amount_base_currency || 0;
      supplierMap[s].txn_count += 1;
      const emCalcs = Array.isArray(t.calculated_emissions) ? t.calculated_emissions : [];
      emCalcs.forEach((e: any) => { supplierMap[s].co2e_kg += parseFloat(e.co2e_kg?.toString() || '0'); });
    });

    const topSuppliers = Object.values(supplierMap)
      .sort((a, b) => b.co2e_kg - a.co2e_kg)
      .slice(0, 10)
      .map(s => ({
        ...s,
        co2e_tons: Math.round((s.co2e_kg / 1000) * 1000) / 1000,
        spend: Math.round(s.spend * 100) / 100,
      }));

    // 5. Method tier quality breakdown
    const tierBreakdown: Record<string, { tier: string; count: number; co2e_kg: number; label: string }> = {};
    const TIER_LABELS: Record<string, string> = {
      A: 'Ниво A: Специфични доставчикови данни',
      B: 'Ниво B: Активност-базирано',
      C: 'Ниво C: Разходно-базирано (EEIO)',
      D: 'Ниво D: Прокси / оценка',
    };

    emissions?.forEach(e => {
      const tier = e.method_tier || 'C';
      if (!tierBreakdown[tier]) tierBreakdown[tier] = { tier, count: 0, co2e_kg: 0, label: TIER_LABELS[tier] || tier };
      tierBreakdown[tier].count += 1;
      tierBreakdown[tier].co2e_kg += parseFloat(e.co2e_kg.toString());
    });

    const methodQuality = Object.values(tierBreakdown).sort((a, b) => a.tier.localeCompare(b.tier));

    // 6. Scope comparison (Scope 1+2 vs Scope 3)
    const { data: scope12Data } = await supabase
      .from('emission_data')
      .select('scope, calculated_co2e')
      .eq('company_id', companyId)
      .gte('reporting_period', `${year}-01-01`)
      .lte('reporting_period', `${year}-12-31`);

    const scope1Co2e = scope12Data?.filter(d => d.scope === 1).reduce((sum, d) => sum + (d.calculated_co2e || 0), 0) || 0;
    const scope2Co2e = scope12Data?.filter(d => d.scope === 2).reduce((sum, d) => sum + (d.calculated_co2e || 0), 0) || 0;
    const scope3Co2e = totalCo2eTons;

    return NextResponse.json({
      year,
      summary: {
        total_co2e_tons: Math.round(totalCo2eTons * 1000) / 1000,
        total_co2e_kg: Math.round(totalCo2eKg * 100) / 100,
        total_transactions: totalTransactions,
        classified_transactions: classifiedCount,
        unclassified_transactions: totalTransactions - classifiedCount,
        classification_rate: totalTransactions > 0 ? Math.round((classifiedCount / totalTransactions) * 100) : 0,
        total_spend_eur: Math.round(totalSpend * 100) / 100,
        total_calculations: emissions?.length || 0,
      },
      by_category: categoryChartData,
      monthly_trend: monthlyTrend,
      top_suppliers: topSuppliers,
      method_quality: methodQuality,
      scope_comparison: {
        scope1: Math.round(scope1Co2e * 1000) / 1000,
        scope2: Math.round(scope2Co2e * 1000) / 1000,
        scope3: Math.round(scope3Co2e * 1000) / 1000,
        total: Math.round((scope1Co2e + scope2Co2e + scope3Co2e) * 1000) / 1000,
      },
    });

  } catch (error) {
    console.error('Error fetching scope3 dashboard data:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
