import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email('Невалиден имейл адрес'),
  password: z.string().min(6, 'Паролата трябва да е поне 6 символа'),
  first_name: z.string().min(1, 'Името е задължително'),
  last_name: z.string().min(1, 'Фамилията е задължителна'),
  role: z.enum(['admin', 'client']),
  company_id: z.string().uuid().nullable().optional(),
});

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
    const validatedData = createUserSchema.parse(body);

    // Use service client for admin operations
    const serviceSupabase = createServiceClient();

    // Create auth user
    const { data: authData, error: authError } = await serviceSupabase.auth.admin.createUser({
      email: validatedData.email,
      password: validatedData.password,
      email_confirm: true, // Auto-confirm email for admin-created users
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        return NextResponse.json(
          { error: 'Потребител с този имейл вече съществува' },
          { status: 400 }
        );
      }
      throw authError;
    }

    if (!authData.user) {
      throw new Error('Failed to create auth user');
    }

    // Create user record in users table
    const { data: newUser, error: dbError } = await serviceSupabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: validatedData.email,
        first_name: validatedData.first_name,
        last_name: validatedData.last_name,
        role: validatedData.role,
        company_id: validatedData.company_id || null,
        is_active: true,
      })
      .select()
      .single();

    if (dbError) {
      // Rollback: delete auth user if DB insert fails
      await serviceSupabase.auth.admin.deleteUser(authData.user.id);
      throw dbError;
    }

    return NextResponse.json({ data: newUser }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Грешка при валидация', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Възникна грешка при създаване на потребителя' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
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

    // Fetch all users with their company info
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        company:companies(company_name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Възникна грешка при зареждане на потребителите' },
      { status: 500 }
    );
  }
}
