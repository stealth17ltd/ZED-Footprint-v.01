import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildVsmeReportBundle } from '@/lib/vsme/report-bundle';
import { buildVsmeExportDocument, vsmeSafeFilename } from '@/lib/vsme/export-document';
import { resolveVsmeExportContext } from '@/lib/vsme/export-auth';

/**
 * GET /api/vsme/export?year=2025
 * Structured JSON export for VSME reporting / external tools.
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const auth = await resolveVsmeExportContext(supabase);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()));

    const bundle = await buildVsmeReportBundle(supabase, auth.ctx.companyId, year);
    if (!bundle) {
      return NextResponse.json({ error: 'Компанията не е намерена' }, { status: 404 });
    }

    const exportDoc = buildVsmeExportDocument(bundle, year, auth.ctx.generatedBy);
    const safeName = vsmeSafeFilename(bundle.company.company_name);

    return new NextResponse(JSON.stringify(exportDoc, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="VSME-${safeName}-${year}.json"`,
      },
    });
  } catch (error) {
    console.error('VSME export error:', error);
    return NextResponse.json({ error: 'Вътрешна грешка' }, { status: 500 });
  }
}
