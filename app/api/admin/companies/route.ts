import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { z } from 'zod';

const createCompanySchema = z.object({
  company_name: z.string().min(1, 'Името на компанията е задължително'),
  registration_number: z.string().min(1, 'ЕИК е задължителен'),
  industry_sector: z.string().min(1, 'Секторът е задължителен'),
  employee_count: z.number().positive().optional(),
  primary_contact_email: z.string().email('Невалиден имейл адрес'),
  billing_address: z.string().optional(),
  sustainability_goals: z.string().optional(),
  eu_green_deal_commitment: z.boolean().default(false),
  baseline_year: z.number().min(2000).max(2030).optional(),
});

const updateCompanySchema = createCompanySchema.partial();

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Verify admin role
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Неоторизиран достъп' }, { status: 401 });
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Нямате права за тази операция' }, { status: 403 });
    }

    // Validate input
    const body = await request.json();
    const validatedData = createCompanySchema.parse(body);

    // Use service client for admin operations
    const serviceSupabase = createServiceClient();

    // Create company
    const { data: company, error: companyError } = await serviceSupabase
      .from('companies')
      .insert(validatedData)
      .select()
      .single();

    if (companyError) {
      if (companyError.code === '23505') {
        return NextResponse.json(
          { error: 'Компания с този ЕИК вече съществува' },
          { status: 400 }
        );
      }
      throw companyError;
    }

    // Create default location
    await serviceSupabase.from('locations').insert({
      company_id: company.id,
      location_name: 'Основна локация',
      is_active: true,
    });

    return NextResponse.json({ data: company }, { status: 201 });
  } catch (error) {
    console.error('Error creating company:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Грешка при валидация', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Възникна грешка при създаване на компанията' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Неоторизиран достъп' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('companies')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .order('company_name')
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({ 
      data, 
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json(
      { error: 'Възникна грешка при зареждане на компаниите' },
      { status: 500 }
    );
  }
}
