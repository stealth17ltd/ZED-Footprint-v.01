import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const updateInitiativeSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
  assigned_to: z.string().optional().nullable(),
  due_date: z.string().optional().nullable(),
  completed_date: z.string().optional().nullable(),
  estimated_cost: z.number().min(0).optional().nullable(),
  actual_cost: z.number().min(0).optional().nullable(),
  estimated_reduction_co2e: z.number().min(0).optional().nullable(),
  actual_reduction_co2e: z.number().min(0).optional().nullable(),
  sort_order: z.number().int().optional(),
  notes: z.string().optional().nullable(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; initiativeId: string }> },
) {
  try {
    const { initiativeId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Неоторизиран достъп' }, { status: 401 });
    }

    const body = await request.json();
    const validated = updateInitiativeSchema.parse(body);

    // Auto-set completed_date when marking complete
    const updates: Record<string, unknown> = {
      ...validated,
      updated_at: new Date().toISOString(),
    };
    if (validated.status === 'completed' && !validated.completed_date) {
      updates.completed_date = new Date().toISOString().split('T')[0];
    }

    const { data, error } = await supabase
      .from('strategy_initiatives')
      .update(updates)
      .eq('id', initiativeId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error updating initiative:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Грешка при актуализиране на инициативата' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; initiativeId: string }> },
) {
  try {
    const { initiativeId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Неоторизиран достъп' }, { status: 401 });
    }

    const { error } = await supabase
      .from('strategy_initiatives')
      .delete()
      .eq('id', initiativeId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting initiative:', error);
    return NextResponse.json({ error: 'Грешка при изтриване на инициативата' }, { status: 500 });
  }
}
