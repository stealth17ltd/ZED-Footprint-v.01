import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const patchSchema = z.object({
  reporting_year: z.number().int().min(2000).max(2100),
  health_safety_has_policy: z.boolean().nullable().optional(),
  health_safety_description: z.string().max(4000).nullable().optional(),
  health_safety_incidents: z.number().int().min(0).nullable().optional(),
  health_safety_responsible_person: z.string().max(200).nullable().optional(),
  health_safety_training_frequency: z.string().max(100).nullable().optional(),
  anti_corruption_has_policy: z.boolean().nullable().optional(),
  anti_corruption_description: z.string().max(4000).nullable().optional(),
  anti_corruption_whistleblower: z.boolean().nullable().optional(),
});

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

    const { data, error } = await supabase
      .from('vsme_manual_disclosures')
      .select('*')
      .eq('company_id', userData.company_id)
      .eq('reporting_year', year)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({ data: data ?? null });
  } catch (error) {
    console.error('VSME manual GET error:', error);
    return NextResponse.json({ error: 'Вътрешна грешка' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
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

    const body = patchSchema.parse(await request.json());
    const row = {
      company_id: userData.company_id,
      reporting_year: body.reporting_year,
      health_safety_has_policy: body.health_safety_has_policy ?? null,
      health_safety_description: body.health_safety_description ?? null,
      health_safety_incidents: body.health_safety_incidents ?? null,
      health_safety_responsible_person: body.health_safety_responsible_person ?? null,
      health_safety_training_frequency: body.health_safety_training_frequency ?? null,
      anti_corruption_has_policy: body.anti_corruption_has_policy ?? null,
      anti_corruption_description: body.anti_corruption_description ?? null,
      anti_corruption_whistleblower: body.anti_corruption_whistleblower ?? null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('vsme_manual_disclosures')
      .upsert(row, { onConflict: 'company_id,reporting_year' })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Невалидни данни', details: error.issues }, { status: 400 });
    }
    console.error('VSME manual PUT error:', error);
    return NextResponse.json({ error: 'Вътрешна грешка' }, { status: 500 });
  }
}
