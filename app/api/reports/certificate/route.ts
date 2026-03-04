import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateSustainabilityCertificate } from '@/lib/reports/sustainability-certificate';

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
      .select('company_name, registration_number, industry_sector, employee_count')
      .eq('id', userData.company_id)
      .single();

    if (!company) return NextResponse.json({ error: 'Компанията не е намерена' }, { status: 404 });

    const { data: emissions } = await supabase
      .from('emission_data')
      .select('scope, calculated_co2e')
      .eq('company_id', userData.company_id)
      .gte('reporting_period', startDate)
      .lte('reporting_period', endDate);

    const { data: scope3Data } = await supabase
      .from('calculated_emissions')
      .select('co2e_kg')
      .eq('company_id', userData.company_id)
      .eq('scope', 3)
      .gte('reporting_period', `${reportingYear}-01-01`)
      .lte('reporting_period', `${reportingYear}-12-31`);

    const scope1 = (emissions || []).filter(e => e.scope === 1).reduce((s, e) => s + (e.calculated_co2e || 0), 0);
    const scope2 = (emissions || []).filter(e => e.scope === 2).reduce((s, e) => s + (e.calculated_co2e || 0), 0);
    const scope3Kg = (scope3Data || []).reduce((s, e) => s + (e.co2e_kg || 0), 0);

    // Generate a deterministic certificate number
    const certNumber = `ZED-${reportingYear}-${userData.company_id.slice(0, 6).toUpperCase()}`;

    const pdfBuffer = await generateSustainabilityCertificate({
      company: {
        company_name: company.company_name,
        registration_number: company.registration_number,
        industry_sector: company.industry_sector,
        employee_count: company.employee_count,
      },
      reportingYear,
      scope1Total: scope1,
      scope2Total: scope2,
      scope3Total: scope3Kg / 1000,
      scope3Available: (scope3Data?.length || 0) > 0,
      certNumber,
      generatedBy: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || user.email || undefined,
    });

    const safeName = company.company_name.replace(/[\u0400-\u04FF]/g, '').replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'Company';
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Sustainability-Certificate-${safeName}-${reportingYear}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Certificate error:', error);
    return NextResponse.json({ error: 'Грешка при генериране', details: error instanceof Error ? error.message : 'Unknown' }, { status: 500 });
  }
}
