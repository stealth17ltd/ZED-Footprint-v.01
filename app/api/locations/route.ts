import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const createLocationSchema = z.object({
  location_name:  z.string().min(1, 'Името на локацията е задължително').max(100),
  address:        z.string().max(255).optional().nullable(),
  city:           z.string().max(100).optional().nullable(),
  country:        z.string().max(100).default('Bulgaria'),
  location_type:  z.enum(['office', 'warehouse', 'factory', 'retail', 'data_center', 'other']).default('office'),
  square_meters:  z.number().min(0).optional().nullable(),
  employee_count: z.number().int().min(0).optional().nullable(),
  is_primary:     z.boolean().default(false),
  notes:          z.string().max(500).optional().nullable(),
});

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Неоторизиран достъп' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('company_id, role')
      .eq('id', user.id)
      .single();

    if (!userData?.company_id && userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Няма свързана компания' }, { status: 400 });
    }

    let query = supabase
      .from('locations')
      .select('*')
      .order('is_primary', { ascending: false })
      .order('location_name', { ascending: true });

    if (userData.role !== 'admin') {
      query = query.eq('company_id', userData.company_id);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Attach emission record counts per location
    const locationIds = (data ?? []).map(l => l.id);
    let countMap: Record<string, number> = {};
    if (locationIds.length > 0) {
      const { data: counts } = await supabase
        .from('emission_data')
        .select('location_id')
        .in('location_id', locationIds)
        .eq('company_id', userData.company_id ?? '');
      (counts ?? []).forEach(r => {
        if (r.location_id) countMap[r.location_id] = (countMap[r.location_id] ?? 0) + 1;
      });
    }

    const enriched = (data ?? []).map(loc => ({
      ...loc,
      emission_record_count: countMap[loc.id] ?? 0,
    }));

    return NextResponse.json({ data: enriched });
  } catch (err) {
    console.error('locations GET error:', err);
    return NextResponse.json({ error: 'Грешка при зареждане на локациите' }, { status: 500 });
  }
}

export async function POST(request: Request) {
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

    const body = await request.json();
    const validated = createLocationSchema.parse(body);

    // If this is set as primary, unset all others first
    if (validated.is_primary) {
      await supabase
        .from('locations')
        .update({ is_primary: false })
        .eq('company_id', userData.company_id);
    }

    const { data, error } = await supabase
      .from('locations')
      .insert({ ...validated, company_id: userData.company_id })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    console.error('locations POST error:', err);
    return NextResponse.json({ error: 'Грешка при създаване на локация' }, { status: 500 });
  }
}
