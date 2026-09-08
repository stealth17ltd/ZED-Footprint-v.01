import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateComplianceReport } from '@/lib/reports/compliance-report';
import { getCompanyFootprint } from '@/lib/carbon/footprint-service';
import { getEvidenceCoverage } from '@/lib/evidence/coverage';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Неоторизиран достъп' }, { status: 401 });

    const body = await request.json();
    const { reportingYear, startDate, endDate } = body;
    if (!reportingYear || !startDate || !endDate) {
      return NextResponse.json({ error: 'Липсват задължителни параметри' }, { status: 400 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('company_id, first_name, last_name')
      .eq('id', user.id)
      .single();

    if (!userData?.company_id) return NextResponse.json({ error: 'Няма свързана компания' }, { status: 400 });

    const { data: company } = await supabase
      .from('companies')
      .select('company_name, registration_number, industry_sector, employee_count, billing_address, annual_turnover_eur, ets_has_installation, ets_thermal_input_mw, ets_activity_annex_i')
      .eq('id', userData.company_id)
      .single();

    if (!company) return NextResponse.json({ error: 'Компанията не е намерена' }, { status: 404 });

    const { data: emissions } = await supabase
      .from('emission_data')
      .select('category, calculated_co2e')
      .eq('company_id', userData.company_id)
      .gte('reporting_period', startDate)
      .lte('reporting_period', endDate);

    const footprint = await getCompanyFootprint(supabase, userData.company_id, reportingYear);
    const evidenceCoverage = await getEvidenceCoverage(supabase, userData.company_id, reportingYear);

    const { data: scope3Data } = await supabase
      .from('calculated_emissions')
      .select('id')
      .eq('company_id', userData.company_id)
      .eq('scope', 3)
      .gte('reporting_period', `${reportingYear}-01-01`)
      .lte('reporting_period', `${reportingYear}-12-31`)
      .limit(1);

    const { data: targets } = await supabase
      .from('emission_targets')
      .select('name, target_value, target_year, target_type, baseline_year')
      .eq('company_id', userData.company_id)
      .eq('status', 'active');

    const emissionsByCategory = (emissions || []).reduce((acc: Record<string, number>, e) => {
      acc[e.category] = (acc[e.category] || 0) + (e.calculated_co2e || 0);
      return acc;
    }, {});

    const generatedBy = `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || user.email || undefined;

    const pdfBuffer = await generateComplianceReport({
      company: {
        company_name: company.company_name,
        registration_number: company.registration_number,
        industry_sector: company.industry_sector,
        employee_count: company.employee_count,
        address: company.billing_address,
        annual_turnover_eur: company.annual_turnover_eur,
        ets_has_installation: company.ets_has_installation,
        ets_thermal_input_mw: company.ets_thermal_input_mw,
        ets_activity_annex_i: company.ets_activity_annex_i,
      },
      reportingYear,
      scope1Total: footprint.scope1,
      scope2Total: footprint.scope2,
      scope3Total: footprint.scope3,
      scope3Available: (scope3Data?.length || 0) > 0,
      emissionsByCategory,
      targets: targets || [],
      generatedBy,
      evidenceCoverage,
    });

    const safeName = company.company_name.replace(/[\u0400-\u04FF]/g, '').replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'Company';
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Compliance-Report-${safeName}-${reportingYear}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Compliance report error:', error);
    return NextResponse.json({ error: 'Грешка при генериране', details: error instanceof Error ? error.message : 'Unknown' }, { status: 500 });
  }
}
