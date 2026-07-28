import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const createStrategySchema = z.object({
  title: z.string().min(1, 'Заглавието е задължително'),
  description: z.string().optional().nullable(),
  category: z.enum([
    'energy_efficiency', 'renewable_energy', 'fleet',
    'supply_chain', 'waste', 'water', 'behavioral', 'other',
  ]),
  scope: z.number().int().min(1).max(3).optional().nullable(),
  priority: z.enum(['high', 'medium', 'low']).default('medium'),
  status: z.enum(['draft', 'active', 'completed', 'cancelled', 'on_hold']).default('draft'),
  target_id: z.string().uuid().optional().nullable(),
  estimated_reduction_co2e: z.number().min(0).optional().nullable(),
  estimated_cost: z.number().min(0).optional().nullable(),
  responsible_person: z.string().optional().nullable(),
  start_date: z.string().optional().nullable(),
  target_completion_date: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
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
      .from('reduction_strategies')
      .select(`
        *,
        strategy_initiatives (
          id, status
        ),
        emission_targets (
          id, name, target_year, target_value, target_type, current_value, baseline_value
        )
      `)
      .order('created_at', { ascending: false });

    if (userData.role !== 'admin') {
      query = query.eq('company_id', userData.company_id);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching strategies:', error);
    return NextResponse.json({ error: 'Грешка при зареждане на стратегиите' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
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
    const validated = createStrategySchema.parse(body);

    const { data, error } = await supabase
      .from('reduction_strategies')
      .insert({ ...validated, company_id: userData.company_id })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Error creating strategy:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Грешка при създаване на стратегия' }, { status: 500 });
  }
}
