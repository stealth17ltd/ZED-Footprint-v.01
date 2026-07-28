import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { z } from 'zod';

const updateSchema = z.object({
  value:       z.number().min(0).optional(),
  unit:        z.string().min(1).optional(),
  source:      z.string().optional().nullable(),
  source_name: z.string().optional().nullable(),
  source_year: z.number().int().optional().nullable(),
  is_active:   z.boolean().optional(),
});

/**
 * PATCH /api/emission-factors/[id]
 * Admin-only: update factor value, unit, source or active status.
 */
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

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Само администраторите могат да редактират фактори' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const validated = updateSchema.parse(body);

    const service = createServiceClient();
    const { data, error } = await service
      .from('emission_factors')
      .update({ ...validated, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    console.error('emission-factors patch error:', err);
    return NextResponse.json({ error: 'Грешка при актуализиране' }, { status: 500 });
  }
}
