import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const updateLocationSchema = z.object({
  location_name:  z.string().min(1).max(100).optional(),
  address:        z.string().max(255).optional().nullable(),
  city:           z.string().max(100).optional().nullable(),
  country:        z.string().max(100).optional(),
  location_type:  z.enum(['office', 'warehouse', 'factory', 'retail', 'data_center', 'other']).optional(),
  square_meters:  z.number().min(0).optional().nullable(),
  employee_count: z.number().int().min(0).optional().nullable(),
  is_primary:     z.boolean().optional(),
  is_active:      z.boolean().optional(),
  notes:          z.string().max(500).optional().nullable(),
});

async function resolveCompanyId(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase
    .from('users')
    .select('company_id, role')
    .eq('id', userId)
    .single();
  return data;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Неоторизиран достъп' }, { status: 401 });
    }

    const userData = await resolveCompanyId(supabase, user.id);
    if (!userData?.company_id) {
      return NextResponse.json({ error: 'Няма свързана компания' }, { status: 400 });
    }

    const body = await request.json();
    const validated = updateLocationSchema.parse(body);

    // If setting as primary, clear others first
    if (validated.is_primary) {
      await supabase
        .from('locations')
        .update({ is_primary: false })
        .eq('company_id', userData.company_id);
    }

    const { data, error } = await supabase
      .from('locations')
      .update({ ...validated, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('company_id', userData.company_id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Локацията не е намерена' }, { status: 404 });

    return NextResponse.json({ data });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    console.error('locations PATCH error:', err);
    return NextResponse.json({ error: 'Грешка при актуализиране на локацията' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Неоторизиран достъп' }, { status: 401 });
    }

    const userData = await resolveCompanyId(supabase, user.id);
    if (!userData?.company_id) {
      return NextResponse.json({ error: 'Няма свързана компания' }, { status: 400 });
    }

    // Soft-delete: mark inactive instead of hard-delete
    // (emission_data rows reference this location_id)
    const { data, error } = await supabase
      .from('locations')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('company_id', userData.company_id)
      .select('id')
      .single();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Локацията не е намерена' }, { status: 404 });

    return NextResponse.json({ message: 'Локацията е деактивирана' });
  } catch (err) {
    console.error('locations DELETE error:', err);
    return NextResponse.json({ error: 'Грешка при деактивиране на локацията' }, { status: 500 });
  }
}
