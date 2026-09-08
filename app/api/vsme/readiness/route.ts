import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildVsmeReportBundle } from '@/lib/vsme/report-bundle';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Неоторизиран достъп' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!userData?.company_id) {
      return NextResponse.json({ error: 'Няма свързана компания' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()));

    const bundle = await buildVsmeReportBundle(supabase, userData.company_id, year);
    if (!bundle) {
      return NextResponse.json({ error: 'Компанията не е намерена' }, { status: 404 });
    }

    const { company, ...rest } = bundle;

    return NextResponse.json({
      data: {
        companyName: company.company_name,
        ...rest,
        summary: {
          readinessScore: rest.readinessScore,
          complete: rest.complete,
          partial: rest.partial,
          missing: rest.missing,
          applicableTotal: rest.applicableTotal,
          na: rest.na,
        },
      },
    });
  } catch (error) {
    console.error('VSME readiness error:', error);
    return NextResponse.json({ error: 'Вътрешна грешка' }, { status: 500 });
  }
}
