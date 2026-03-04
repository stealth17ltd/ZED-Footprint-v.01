import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateCSRDReportV3 } from '@/lib/reports/csrd-report-v3';

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

    // User & company
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

    // Scope 1 & 2 emissions
    const { data: emissionsData, error: emissionsError } = await supabase
      .from('emission_data')
      .select('*')
      .eq('company_id', userData.company_id)
      .gte('reporting_period', startDate)
      .lte('reporting_period', endDate)
      .order('reporting_period', { ascending: true });

    if (emissionsError) throw emissionsError;

    // Scope 3 calculated emissions
    const { data: scope3Data } = await supabase
      .from('calculated_emissions')
      .select('scope_category, co2e_kg, method_tier, calculation_trace')
      .eq('company_id', userData.company_id)
      .eq('scope', 3)
      .gte('reporting_period', `${reportingYear}-01-01`)
      .lte('reporting_period', `${reportingYear}-12-31`);

    // Targets
    const { data: targets } = await supabase
      .from('emission_targets')
      .select('*')
      .eq('company_id', userData.company_id)
      .eq('status', 'active');

    // Year-over-year comparison
    const { data: prevYearData } = await supabase
      .from('emission_data')
      .select('calculated_co2e')
      .eq('company_id', userData.company_id)
      .gte('reporting_period', `${reportingYear - 1}-01-01`)
      .lte('reporting_period', `${reportingYear - 1}-12-31`);

    const scope1Total = (emissionsData || []).filter(e => e.scope === 1).reduce((s, e) => s + (e.calculated_co2e || 0), 0);
    const scope2Total = (emissionsData || []).filter(e => e.scope === 2).reduce((s, e) => s + (e.calculated_co2e || 0), 0);
    const scope3TotalKg = (scope3Data || []).reduce((s, e) => s + (e.co2e_kg || 0), 0);
    const currentTotal = scope1Total + scope2Total + scope3TotalKg / 1000;

    let comparisonData;
    if (prevYearData && prevYearData.length > 0) {
      const prevTotal = prevYearData.reduce((s, e) => s + (e.calculated_co2e || 0), 0);
      const change = currentTotal - prevTotal;
      comparisonData = {
        previousYear: prevTotal,
        change,
        changePercent: prevTotal > 0 ? (change / prevTotal) * 100 : 0,
      };
    }

    const generatedBy = `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || user.email || undefined;

    const pdfBuffer = await generateCSRDReportV3({
      company: {
        company_name: company.company_name,
        registration_number: company.registration_number,
        industry_sector: company.industry_sector,
        employee_count: company.employee_count,
        address: company.billing_address,
      },
      reportingYear,
      scope12Emissions: emissionsData || [],
      scope3Calculations: scope3Data || [],
      targets: targets || [],
      comparisonData,
      generatedBy,
    });

    const safeCompanyName = company.company_name
      .replace(/[\u0400-\u04FF]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'Company';

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="CSRD-ESRS-E1-${safeCompanyName}-${reportingYear}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Error generating CSRD report:', error);
    return NextResponse.json(
      { error: 'Грешка при генериране на CSRD отчета', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
