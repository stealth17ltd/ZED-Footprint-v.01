import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/gdpr/export
 *
 * GDPR Article 15 — Right of Access / Data Portability.
 * Returns a JSON file containing all personal and company data
 * associated with the authenticated user's company.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Неоторизиран достъп' }, { status: 401 });
    }

    // ── Resolve user + company ─────────────────────────────────────────────
    const { data: userData } = await supabase
      .from('users')
      .select('id, first_name, last_name, role, is_active, created_at, company_id')
      .eq('id', user.id)
      .single();

    if (!userData?.company_id) {
      return NextResponse.json({ error: 'Няма свързана компания' }, { status: 400 });
    }

    const cid = userData.company_id;

    // ── Fetch all data in parallel ─────────────────────────────────────────
    const [
      { data: company },
      { data: users },
      { data: emissionData },
      { data: calcEmissions },
      { data: transactions },
      { data: targets },
      { data: strategies },
      { data: reports },
    ] = await Promise.all([
      supabase.from('companies').select('*').eq('id', cid).single(),
      supabase.from('users').select('id, first_name, last_name, role, is_active, created_at').eq('company_id', cid),
      supabase.from('emission_data').select('*').eq('company_id', cid).order('reporting_period', { ascending: true }),
      supabase.from('calculated_emissions').select('*').eq('company_id', cid).order('calculated_at', { ascending: true }),
      supabase.from('transactions').select('*').eq('company_id', cid).order('txn_date', { ascending: true }),
      supabase.from('emission_targets').select('*').eq('company_id', cid).order('created_at', { ascending: true }),
      supabase.from('reduction_strategies').select(`
        *,
        strategy_initiatives (*)
      `).eq('company_id', cid).order('created_at', { ascending: true }),
      supabase.from('reports').select('*').eq('company_id', cid).order('generated_date', { ascending: true }),
    ]);

    // ── Assemble export payload ────────────────────────────────────────────
    const exportPayload = {
      _meta: {
        export_date: new Date().toISOString(),
        gdpr_article: 'Article 15 – Right of Access / Article 20 – Data Portability',
        format_version: '1.0',
        controller: 'ZED Carbon Footprint Platform',
        subject_user_id: user.id,
        subject_email: user.email,
      },
      company: company ?? null,
      users: users ?? [],
      emission_data: emissionData ?? [],
      calculated_emissions: calcEmissions ?? [],
      transactions: transactions ?? [],
      emission_targets: targets ?? [],
      reduction_strategies: strategies ?? [],
      reports: reports ?? [],
      summary: {
        emission_records: (emissionData ?? []).length,
        scope3_records: (calcEmissions ?? []).length,
        transactions: (transactions ?? []).length,
        targets: (targets ?? []).length,
        strategies: (strategies ?? []).length,
        users: (users ?? []).length,
      },
    };

    const json = JSON.stringify(exportPayload, null, 2);
    const safeCompany = (company?.company_name ?? 'company')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '_')
      .slice(0, 40);
    const date = new Date().toISOString().slice(0, 10);

    return new Response(json, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="gdpr_export_${safeCompany}_${date}.json"`,
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err) {
    console.error('GDPR export error:', err);
    return NextResponse.json({ error: 'Вътрешна грешка при експорт' }, { status: 500 });
  }
}
