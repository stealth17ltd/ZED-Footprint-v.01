import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { z } from 'zod';

const updateCompanySchema = z.object({
  company_name: z.string().min(1).optional(),
  registration_number: z.string().min(1).optional(),
  industry_sector: z.string().min(1).optional(),
  employee_count: z.number().positive().nullable().optional(),
  primary_contact_email: z.string().email().optional(),
  billing_address: z.string().nullable().optional(),
  sustainability_goals: z.string().nullable().optional(),
  eu_green_deal_commitment: z.boolean().optional(),
  baseline_year: z.number().min(2000).max(2030).nullable().optional(),
  annual_turnover_eur: z.number().nonnegative().nullable().optional(),
  ets_has_installation: z.boolean().nullable().optional(),
  ets_thermal_input_mw: z.number().nonnegative().nullable().optional(),
  ets_activity_annex_i: z.boolean().nullable().optional(),
});

export async function GET(
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

    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Компанията не е намерена' }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching company:', error);
    return NextResponse.json(
      { error: 'Възникна грешка при зареждане на данните' },
      { status: 500 }
    );
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

    // Check if user has access to this company
    const { data: userData } = await supabase
      .from('users')
      .select('company_id, role')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'Потребителят не е намерен' }, { status: 404 });
    }

    // Admin can edit any company, client can only edit their own
    if (userData.role !== 'admin' && userData.company_id !== id) {
      return NextResponse.json({ error: 'Нямате права за тази операция' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updateCompanySchema.parse(body);

    // Service role bypasses RLS — clients may update own company via API after auth check above
    const serviceSupabase = createServiceClient();
    const { data, error } = await serviceSupabase
      .from('companies')
      .update({ ...validatedData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase company update error:', error);
      throw error;
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error updating company:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Грешка при валидация', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Възникна грешка при актуализиране на данните' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Нямате права за тази операция' }, { status: 403 });
    }

    // Soft delete - set is_active to false
    const { error } = await supabase
      .from('companies')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ message: 'Компанията е деактивирана успешно' });
  } catch (error) {
    console.error('Error deleting company:', error);
    return NextResponse.json(
      { error: 'Възникна грешка при деактивиране на компанията' },
      { status: 500 }
    );
  }
}