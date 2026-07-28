import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const updateStrategySchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  category: z.enum([
    'energy_efficiency', 'renewable_energy', 'fleet',
    'supply_chain', 'waste', 'water', 'behavioral', 'other',
  ]).optional(),
  scope: z.number().int().min(1).max(3).optional().nullable(),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  status: z.enum(['draft', 'active', 'completed', 'cancelled', 'on_hold']).optional(),
  target_id: z.string().uuid().optional().nullable(),
  estimated_reduction_co2e: z.number().min(0).optional().nullable(),
  estimated_cost: z.number().min(0).optional().nullable(),
  actual_reduction_co2e: z.number().min(0).optional().nullable(),
  responsible_person: z.string().optional().nullable(),
  start_date: z.string().optional().nullable(),
  target_completion_date: z.string().optional().nullable(),
  actual_completion_date: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Неоторизиран достъп' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('reduction_strategies')
      .select(`
        *,
        strategy_initiatives (
          id, title, description, status, assigned_to,
          due_date, completed_date, estimated_cost, actual_cost,
          estimated_reduction_co2e, actual_reduction_co2e,
          sort_order, notes, created_at, updated_at
        ),
        emission_targets (
          id, name, target_year, target_value, target_type, current_value, baseline_value
        )
      `)
      .eq('id', id)
      .order('sort_order', { referencedTable: 'strategy_initiatives', ascending: true })
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Стратегията не е намерена' }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching strategy:', error);
    return NextResponse.json({ error: 'Грешка при зареждане на стратегията' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Неоторизиран достъп' }, { status: 401 });
    }

    const body = await request.json();
    const validated = updateStrategySchema.parse(body);

    const { data, error } = await supabase
      .from('reduction_strategies')
      .update({ ...validated, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error updating strategy:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Грешка при актуализиране на стратегията' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Неоторизиран достъп' }, { status: 401 });
    }

    const { error } = await supabase
      .from('reduction_strategies')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting strategy:', error);
    return NextResponse.json({ error: 'Грешка при изтриване на стратегията' }, { status: 500 });
  }
}
