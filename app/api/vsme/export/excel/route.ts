import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildVsmeReportBundle } from '@/lib/vsme/report-bundle';
import { buildVsmeExportDocument, vsmeSafeFilename } from '@/lib/vsme/export-document';
import { buildVsmeExcelBuffer } from '@/lib/vsme/excel-export';
import { resolveVsmeExportContext } from '@/lib/vsme/export-auth';

/**
 * GET /api/vsme/export/excel?year=2025
 * Excel workbook export for VSME disclosures and emissions.
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
    const buffer = buildVsmeExcelBuffer(exportDoc);
    const safeName = vsmeSafeFilename(bundle.company.company_name);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="VSME-${safeName}-${year}.xlsx"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('VSME Excel export error:', error);
    return NextResponse.json({ error: 'Вътрешна грешка' }, { status: 500 });
  }
}
