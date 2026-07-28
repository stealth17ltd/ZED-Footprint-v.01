import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const createInitiativeSchema = z.object({
  title: z.string().min(1, 'Заглавието е задължително'),
  description: z.string().optional().nullable(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).default('pending'),
  assigned_to: z.string().optional().nullable(),
  due_date: z.string().optional().nullable(),
  estimated_cost: z.number().min(0).optional().nullable(),
  estimated_reduction_co2e: z.number().min(0).optional().nullable(),
  sort_order: z.number().int().default(0),
  notes: z.string().optional().nullable(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: strategyId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Неоторизиран достъп' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('strategy_initiatives')
      .select('*')
      .eq('strategy_id', strategyId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching initiatives:', error);
    return NextResponse.json({ error: 'Грешка при зареждане на инициативите' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: strategyId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Неоторизиран достъп' }, { status: 401 });
    }

    const body = await request.json();
    const validated = createInitiativeSchema.parse(body);

    const { data, error } = await supabase
      .from('strategy_initiatives')
      .insert({ ...validated, strategy_id: strategyId })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Error creating initiative:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Грешка при създаване на инициатива' }, { status: 500 });
  }
}
