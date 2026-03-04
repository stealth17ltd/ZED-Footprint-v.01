import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateInternalReport } from '@/lib/reports/internal-report-simple';
import { generateFullReport } from '@/lib/reports/full-report';
import { z } from 'zod';

const generateReportSchema = z.object({
  reportType: z.enum(['internal', 'full', 'compliance', 'certificate']),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Невалиден формат на дата'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Невалиден формат на дата'),
  reportingYear: z.number().optional(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Неоторизиран достъп' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('company_id, role, first_name, last_name')
      .eq('id', user.id)
      .single();

    if (!userData?.company_id) {
      return NextResponse.json({ error: 'Потребителят не е свързан с компания' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = generateReportSchema.parse(body);

    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .select('company_name, registration_number, industry_sector, employee_count, billing_address')
      .eq('id', userData.company_id)
      .single();

    if (companyError || !companyData) {
      return NextResponse.json({ error: 'Компанията не е намерена' }, { status: 404 });
    }

    // Fetch Scope 1 & 2 emissions
    const { data: emissionsData, error: emissionsError } = await supabase
      .from('emission_data')
      .select('*')
      .eq('company_id', userData.company_id)
      .gte('reporting_period', validatedData.startDate)
      .lte('reporting_period', validatedData.endDate)
      .order('reporting_period', { ascending: true });

    if (emissionsError) throw emissionsError;

    let pdfBuffer: Buffer;
    let filename: string;

    switch (validatedData.reportType) {
      case 'internal': {
        if (!emissionsData || emissionsData.length === 0) {
          return NextResponse.json({ error: 'Няма данни за емисии за избрания период' }, { status: 404 });
        }
        pdfBuffer = await generateInternalReport({
          company: companyData,
          emissions: emissionsData,
          startDate: validatedData.startDate,
          endDate: validatedData.endDate,
        });
        filename = `Internal-Report-${validatedData.startDate}-${validatedData.endDate}.pdf`;
        break;
      }

      case 'full': {
        const year = validatedData.reportingYear || new Date(validatedData.endDate).getFullYear();

        // Fetch Scope 3 calculated emissions with traces
        const { data: scope3Data } = await supabase
          .from('calculated_emissions')
          .select('scope_category, co2e_kg, method_tier, calculation_trace')
          .eq('company_id', userData.company_id)
          .eq('scope', 3)
          .gte('reporting_period', `${year}-01-01`)
          .lte('reporting_period', `${year}-12-31`);

        pdfBuffer = await generateFullReport({
          company: {
            company_name: companyData.company_name,
            registration_number: companyData.registration_number,
            industry_sector: companyData.industry_sector,
            employee_count: companyData.employee_count,
            address: companyData.billing_address,
          },
          reportingYear: year,
          scope12Emissions: emissionsData || [],
          scope3Calculations: scope3Data || [],
          generatedBy: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || user.email || undefined,
        });
        const safeCompanyName = companyData.company_name
          .replace(/[\u0400-\u04FF]/g, '') // strip Cyrillic
          .replace(/[^a-zA-Z0-9]/g, '-')   // replace non-ASCII
          .replace(/-+/g, '-')             // collapse dashes
          .replace(/^-|-$/g, '')           // trim edge dashes
          || 'Company';
        filename = `ZED-Full-Report-${safeCompanyName}-${year}.pdf`;
        break;
      }

      case 'compliance':
        return NextResponse.json({ error: 'Отчетът за съответствие все още не е внедрен' }, { status: 501 });

      case 'certificate':
        return NextResponse.json({ error: 'Сертификатът все още не е внедрен' }, { status: 501 });

      default:
        return NextResponse.json({ error: 'Невалиден вид отчет' }, { status: 400 });
    }

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Error generating report:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Грешка при валидация', details: error.errors }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Възникна грешка при генериране на отчета', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
