import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildVsmeReportBundle } from '@/lib/vsme/report-bundle';
import { generateVsmeReport } from '@/lib/reports/vsme-report';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Неоторизиран достъп' }, { status: 401 });

    const body = await request.json();
    const reportingYear = Number(body.reportingYear ?? new Date().getFullYear());

    const { data: userData } = await supabase
      .from('users')
      .select('company_id, first_name, last_name')
      .eq('id', user.id)
      .single();

    if (!userData?.company_id) {
      return NextResponse.json({ error: 'Няма свързана компания' }, { status: 400 });
    }

    const bundle = await buildVsmeReportBundle(supabase, userData.company_id, reportingYear);
    if (!bundle) {
      return NextResponse.json({ error: 'Компанията не е намерена' }, { status: 404 });
    }

    const generatedBy = `${userData.first_name ?? ''} ${userData.last_name ?? ''}`.trim() || user.email || undefined;
    const pdfBuffer = await generateVsmeReport(bundle, generatedBy);

    const safeName = (bundle.company.company_name ?? 'Company')
      .replace(/[\u0400-\u04FF]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'Company';

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="VSME-${safeName}-${reportingYear}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('VSME report error:', error);
    return NextResponse.json({ error: 'Грешка при генериране на VSME отчет' }, { status: 500 });
  }
}
