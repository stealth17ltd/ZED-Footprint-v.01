import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateInternalReport } from '@/lib/reports/internal-report-simple';
import { generatePremiumCSRDReport } from '@/lib/reports/premium-csrd-report';
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

    // Scope 1 & 2 emissions
    const { data: emissionsData, error: emissionsError } = await supabase
      .from('emission_data')
      .select('reporting_period, scope, category, activity_value, unit, calculated_co2e, measurement_method, data_quality, location, factor_source_name, factor_source_year')
      .eq('company_id', userData.company_id)
      .gte('reporting_period', validatedData.startDate)
      .lte('reporting_period', validatedData.endDate)
      .order('reporting_period', { ascending: true });

    if (emissionsError) throw emissionsError;

    let pdfBuffer: Buffer;
    let filename: string;

    const safeCompanyName = companyData.company_name
      .replace(/[\u0400-\u04FF]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'Company';

    const generatedBy = `${userData.first_name ?? ''} ${userData.last_name ?? ''}`.trim()
      || user.email
      || undefined;

    switch (validatedData.reportType) {
      case 'internal': {
        if (!emissionsData || emissionsData.length === 0) {
          return NextResponse.json(
            { error: 'Няма данни за емисии за избрания период' }, { status: 404 }
          );
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
        const year = validatedData.reportingYear ?? new Date(validatedData.endDate).getFullYear();

        const [
          { data: scope3Data },
          { data: targets },
          { data: strategies },
          { data: prevYearData },
        ] = await Promise.all([
          supabase
            .from('calculated_emissions')
            .select('scope_category, co2e_kg, method_tier, calculation_trace')
            .eq('company_id', userData.company_id)
            .eq('scope', 3)
            .gte('reporting_period', `${year}-01-01`)
            .lte('reporting_period', `${year}-12-31`),

          supabase
            .from('emission_targets')
            .select('name, target_type, target_value, target_year, baseline_year, description, scope')
            .eq('company_id', userData.company_id)
            .eq('status', 'active'),

          supabase
            .from('reduction_strategies')
            .select('title, category, status, estimated_reduction_co2e, actual_reduction_co2e, responsible_person')
            .eq('company_id', userData.company_id)
            .in('status', ['active', 'completed']),

          supabase
            .from('emission_data')
            .select('calculated_co2e')
            .eq('company_id', userData.company_id)
            .gte('reporting_period', `${year - 1}-01-01`)
            .lte('reporting_period', `${year - 1}-12-31`),
        ]);

        // Year-over-year
        const s1 = (emissionsData ?? []).filter((e: { scope: number }) => e.scope === 1)
          .reduce((s: number, e: { calculated_co2e: number }) => s + (e.calculated_co2e ?? 0), 0);
        const s2 = (emissionsData ?? []).filter((e: { scope: number }) => e.scope === 2)
          .reduce((s: number, e: { calculated_co2e: number }) => s + (e.calculated_co2e ?? 0), 0);
        const s3kg = (scope3Data ?? [])
          .reduce((s: number, e: { co2e_kg: number }) => s + (e.co2e_kg ?? 0), 0);
        const currentTotal = s1 + s2 + s3kg / 1000;

        let comparisonData;
        if (prevYearData && prevYearData.length > 0) {
          const prevTotal = prevYearData.reduce(
            (s: number, e: { calculated_co2e: number }) => s + (e.calculated_co2e ?? 0), 0
          );
          const change = currentTotal - prevTotal;
          comparisonData = {
            previousYear: prevTotal,
            change,
            changePercent: prevTotal > 0 ? (change / prevTotal) * 100 : 0,
          };
        }

        pdfBuffer = await generatePremiumCSRDReport({
          company: {
            company_name:        companyData.company_name,
            registration_number: companyData.registration_number,
            industry_sector:     companyData.industry_sector,
            employee_count:      companyData.employee_count,
            address:             companyData.billing_address,
          },
          reportingYear: year,
          scope12Emissions: emissionsData ?? [],
          scope3Calculations: scope3Data ?? [],
          targets:    targets ?? [],
          strategies: strategies ?? [],
          comparisonData,
          generatedBy,
        });
        filename = `ZED-Full-Report-${safeCompanyName}-${year}.pdf`;
        break;
      }

      case 'compliance':
        return NextResponse.json(
          { error: 'Отчетът за съответствие все още не е внедрен' }, { status: 501 }
        );

      case 'certificate':
        return NextResponse.json(
          { error: 'Сертификатът все още не е внедрен' }, { status: 501 }
        );

      default:
        return NextResponse.json({ error: 'Невалиден вид отчет' }, { status: 400 });
    }

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type':        'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length':      String(pdfBuffer.length),
      },
    });

  } catch (error) {
    console.error('Error generating report:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Грешка при валидация', details: error.errors }, { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Възникна грешка при генериране на отчета', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 },
    );
  }
}
