import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generatePremiumCSRDReport } from '@/lib/reports/premium-csrd-report';
import { getYoYComparison } from '@/lib/carbon/footprint-service';
import { enrichScope3CalculationsForReport } from '@/lib/carbon/scope3-report-data';
import { getEvidenceCoverage } from '@/lib/evidence/coverage';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Неоторизиран достъп' }, { status: 401 });
    }

    const body = await request.json();
    const { reportingYear, startDate, endDate } = body;

    if (!reportingYear || !startDate || !endDate) {
      return NextResponse.json({ error: 'Липсват задължителни параметри' }, { status: 400 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('company_id, role, first_name, last_name')
      .eq('id', user.id)
      .single();

    if (!userData?.company_id) {
      return NextResponse.json({ error: 'Няма свързана компания' }, { status: 400 });
    }

    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('company_name, registration_number, industry_sector, employee_count, billing_address')
      .eq('id', userData.company_id)
      .single();

    if (companyError || !company) {
      return NextResponse.json({ error: 'Компанията не е намерена' }, { status: 404 });
    }

    // ── Parallel data fetch ──────────────────────────────────────────────
    const [
      { data: emissionsData },
      { data: scope3Raw },
      { data: targets },
      { data: strategies },
      yoy,
      evidenceCoverage,
    ] = await Promise.all([
      supabase
        .from('emission_data')
        .select('reporting_period, scope, category, activity_value, unit, calculated_co2e, measurement_method, data_quality, location, factor_source_name, factor_source_year, emission_factor')
        .eq('company_id', userData.company_id)
        .gte('reporting_period', startDate)
        .lte('reporting_period', endDate)
        .order('reporting_period', { ascending: true }),

      supabase
        .from('calculated_emissions')
        .select('scope_category, co2e_kg, method_tier, calculation_trace, source_type, source_id')
        .eq('company_id', userData.company_id)
        .eq('scope', 3)
        .gte('reporting_period', `${reportingYear}-01-01`)
        .lte('reporting_period', `${reportingYear}-12-31`),

      supabase
        .from('emission_targets')
        .select('name, target_type, target_value, target_year, baseline_year, description, scope')
        .eq('company_id', userData.company_id)
        .eq('status', 'active'),

      supabase
        .from('reduction_strategies')
        .select('title, category, status, estimated_reduction_co2e, actual_reduction_co2e, responsible_person')
        .eq('company_id', userData.company_id)
        .in('status', ['active', 'completed'])
        .order('status', { ascending: true }),

      getYoYComparison(supabase, userData.company_id, reportingYear),
      getEvidenceCoverage(supabase, userData.company_id, reportingYear),
    ]);

    const scope3Data = await enrichScope3CalculationsForReport(
      supabase,
      scope3Raw ?? [],
    );

    const comparisonData =
      yoy.previousTotal > 0 || yoy.currentTotal > 0
        ? {
            previousYear: yoy.previousTotal,
            change: yoy.change,
            changePercent: yoy.changePercent,
          }
        : undefined;

    const generatedBy = `${userData.first_name ?? ''} ${userData.last_name ?? ''}`.trim()
      || user.email
      || undefined;

    // ── Generate PDF ──────────────────────────────────────────────────────
    const pdfBuffer = await generatePremiumCSRDReport({
      company: {
        company_name:        company.company_name,
        registration_number: company.registration_number,
        industry_sector:     company.industry_sector,
        employee_count:      company.employee_count,
        address:             company.billing_address,
      },
      reportingYear,
      scope12Emissions: emissionsData ?? [],
      scope3Calculations: (scope3Data ?? []).map((row) => ({
        ...row,
        calculation_trace: row.calculation_trace ?? undefined,
      })),
      targets:    targets ?? [],
      strategies: strategies ?? [],
      comparisonData,
      evidenceCoverage,
      generatedBy,
    });

    const safeCompanyName = company.company_name
      .replace(/[\u0400-\u04FF]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'Company';

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type':        'application/pdf',
        'Content-Disposition': `attachment; filename="CSRD-ESRS-E1-${safeCompanyName}-${reportingYear}.pdf"`,
        'Content-Length':      String(pdfBuffer.length),
      },
    });

  } catch (error) {
    console.error('CSRD report error:', error);
    return NextResponse.json(
      { error: 'Грешка при генериране на CSRD отчета', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 },
    );
  }
}
