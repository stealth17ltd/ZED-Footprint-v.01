import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const createTargetSchema = z.object({
  name: z.string().min(1, 'Името е задължително'),
  description: z.string().optional(),
  target_type: z.enum(['absolute', 'percentage', 'intensity']),
  scope: z.number().nullable().optional(),
  baseline_year: z.number().min(2000).max(2100),
  baseline_value: z.number().positive(),
  target_year: z.number().min(2000).max(2100),
  target_value: z.number().min(0),
});

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Неоторизиран достъп' }, { status: 401 });
    }

    // Get user's company
    const { data: userData } = await supabase
      .from('users')
      .select('company_id, role')
      .eq('id', user.id)
      .single();

    if (!userData?.company_id && userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Няма свързана компания' }, { status: 400 });
    }

    // Fetch targets
    let query = supabase
      .from('emission_targets')
      .select('*')
      .order('created_at', { ascending: false });

    if (userData.role !== 'admin') {
      query = query.eq('company_id', userData.company_id);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching targets:', error);
    return NextResponse.json(
      { error: 'Грешка при зареждане на целите' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Неоторизиран достъп' }, { status: 401 });
    }

    // Get user's company
    const { data: userData } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!userData?.company_id) {
      return NextResponse.json({ error: 'Няма свързана компания' }, { status: 400 });
    }

    // Validate input
    const body = await request.json();
    const validatedData = createTargetSchema.parse(body);

    // Validate years
    if (validatedData.target_year <= validatedData.baseline_year) {
      return NextResponse.json(
        { error: 'Целевата година трябва да е след базовата' },
        { status: 400 }
      );
    }

    // Create target
    const { data, error } = await supabase
      .from('emission_targets')
      .insert({
        ...validatedData,
        company_id: userData.company_id,
        current_value: validatedData.baseline_value,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Error creating target:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Грешка при създаване на цел' },
      { status: 500 }
    );
  }
}


