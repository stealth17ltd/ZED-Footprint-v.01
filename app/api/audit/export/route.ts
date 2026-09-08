import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCompanyFootprint } from '@/lib/carbon/footprint-service';

/**
 * GET /api/audit/export?year=2025
 *
 * Returns a CSV file with the full calculation trace for every emission entry —
 * Scope 1, Scope 2 (from emission_data) and Scope 3 (from calculated_emissions
 * joined with transactions and classification).
 *
 * Column order follows GHG Protocol audit requirements.
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('company_id, role')
      .eq('id', user.id)
      .single();
    if (!userData?.company_id) {
      return NextResponse.json({ error: 'No company' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()));
    const start = `${year}-01-01`;
    const end   = `${year}-12-31`;

    // ── Fetch Scope 1 & 2 entries ─────────────────────────────────────────
    const { data: ed, error: edErr } = await supabase
      .from('emission_data')
      .select(`
        id, reporting_period, scope, category, subcategory,
        activity_value, unit, calculated_co2e, notes,
        emission_factors ( category, subcategory, value, unit, source )
      `)
      .eq('company_id', userData.company_id)
      .gte('reporting_period', start)
      .lte('reporting_period', end)
      .order('reporting_period', { ascending: true });
    if (edErr) throw edErr;

    // ── Fetch Scope 3 calculated entries ──────────────────────────────────
    const { data: s3calc, error: s3Err } = await supabase
      .from('calculated_emissions')
      .select(`
        id, co2e_kg, method_tier, scope_category, calculated_at,
        source_type, source_id,
        emission_factors ( category, subcategory, value, unit, source )
      `)
      .eq('company_id', userData.company_id)
      .eq('scope', 3)
      .gte('reporting_period', start)
      .lte('reporting_period', end)
      .order('reporting_period', { ascending: true });
    if (s3Err) throw s3Err;

    // Fetch related transaction data for Scope 3
    const txIds = (s3calc ?? [])
      .filter(r => r.source_type === 'transaction')
      .map(r => r.source_id)
      .filter(Boolean);
    let txMap: Record<string, any> = {};
    if (txIds.length > 0) {
      const { data: txData } = await supabase
        .from('transactions')
        .select('id, txn_date, supplier, description, amount_original, currency_original, amount_base_currency')
        .in('id', txIds);
      (txData ?? []).forEach(tx => { txMap[tx.id] = tx; });
    }

    // ── Fetch company info for header ─────────────────────────────────────
    const { data: company } = await supabase
      .from('companies')
      .select('company_name, registration_number, industry_sector')
      .eq('id', userData.company_id)
      .single();

    // ── Build CSV rows ────────────────────────────────────────────────────
    const rows: string[] = [];

    // Header block
    rows.push(`# Одитен CSV — GHG Protocol пълна проследимост`);
    rows.push(`# Компания: ${company?.company_name ?? 'Неизвестна'}`);
    rows.push(`# Регистрационен номер: ${company?.registration_number ?? 'N/A'}`);
    rows.push(`# Отчетна година: ${year}`);
    rows.push(`# Генериран: ${new Date().toISOString()}`);
    rows.push(`# Методология: GHG Protocol Corporate Standard`);
    rows.push(``);

    // Column headers
    rows.push([
      'Тип запис',
      'Дата/Период',
      'Обхват',
      'Категория',
      'Подкатегория',
      'Доставчик/Описание',
      'Количество',
      'Единица',
      'Сума (EUR)',
      'Емисионен фактор',
      'Ст-ст фактор',
      'Единица фактор',
      'CO2e (кг)',
      'CO2e (т)',
      'Метод',
      'Ниво',
      'Източник',
      'Бележки',
      'Запис ID',
    ].map(csvEscape).join(','));

    // Scope 1 & 2 rows
    for (const row of ed ?? []) {
      const ef: any = (row as any).emission_factors;
      const efLabel = ef ? [ef.category, ef.subcategory].filter(Boolean).join(' — ') : '';
      const co2eKg  = (row.calculated_co2e ?? 0) * 1000;
      rows.push([
        'Обхват 1&2',
        row.reporting_period ?? '',
        `Обхват ${row.scope}`,
        row.category ?? '',
        row.subcategory ?? '',
        '',
        String(row.activity_value ?? ''),
        row.unit ?? '',
        '',
        efLabel,
        String(ef?.value ?? ''),
        ef?.unit  ?? '',
        co2eKg.toFixed(4),
        (row.calculated_co2e ?? 0).toFixed(6),
        'Активност',
        'Ниво B',
        ef?.source ?? 'GHG Protocol / DEFRA',
        row.notes ?? '',
        row.id,
      ].map(csvEscape).join(','));
    }

    // Scope 3 category label map
    const scope3CatLabel: Record<number, string> = {
      1: 'Кат. 1 — Закупени стоки/услуги',
      4: 'Кат. 4 — Upstream транспорт',
      5: 'Кат. 5 — Отпадъци',
      6: 'Кат. 6 — Командировки',
      7: 'Кат. 7 — Пътуване на служители',
    };

    // Scope 3 rows
    for (const row of s3calc ?? []) {
      const ef: any = (row as any).emission_factors;
      const efLabel3  = ef ? [ef.category, ef.subcategory].filter(Boolean).join(' — ') : '';
      const tx        = row.source_type === 'transaction' ? txMap[row.source_id] : null;
      const co2eTonne = (row.co2e_kg ?? 0) / 1000;
      const catLabel  = scope3CatLabel[row.scope_category] ?? `Кат. ${row.scope_category ?? '?'}`;
      rows.push([
        'Обхват 3',
        tx?.txn_date ?? row.calculated_at?.slice(0, 10) ?? '',
        'Обхват 3',
        catLabel,
        '',
        tx ? `${tx.supplier ?? ''} — ${tx.description ?? ''}` : '',
        String(tx?.amount_original ?? ''),
        tx?.currency_original ?? 'EUR',
        String(tx?.amount_base_currency ?? tx?.amount_original ?? ''),
        efLabel3,
        String(ef?.value ?? ''),
        ef?.unit  ?? '',
        (row.co2e_kg ?? 0).toFixed(4),
        co2eTonne.toFixed(6),
        'Разходен метод (EEIO)',
        row.method_tier ? `Ниво ${row.method_tier}` : 'Ниво C',
        ef?.source ?? 'EXIOBASE / EEIO',
        '',
        row.id,
      ].map(csvEscape).join(','));
    }

    // Totals block (canonical FootprintService)
    const footprint = await getCompanyFootprint(supabase, userData.company_id, year);
    rows.push(``);
    rows.push(`# ОБОБЩЕНИЕ`);
    rows.push(`# Обхват 1: ${footprint.scope1.toFixed(4)} tCO2e`);
    rows.push(`# Обхват 2: ${footprint.scope2.toFixed(4)} tCO2e`);
    rows.push(`# Обхват 3: ${footprint.scope3.toFixed(4)} tCO2e`);
    rows.push(`# ОБЩО: ${footprint.total.toFixed(4)} tCO2e`);

    const csv = rows.join('\r\n');
    const safeCompany = (company?.company_name ?? 'company')
      .replace(/[^\w\s-]/g, '').replace(/\s+/g, '_').slice(0, 40);

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="audit_${safeCompany}_${year}.csv"`,
      },
    });
  } catch (err) {
    console.error('Audit export error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function csvEscape(value: string): string {
  const s = String(value ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}
