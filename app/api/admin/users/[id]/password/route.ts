import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { z } from 'zod';

const passwordSchema = z.object({
  password: z.string().min(8, 'Паролата трябва да е поне 8 символа'),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
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
    const validatedData = passwordSchema.parse(body);

    // Use service client (admin) to update password
    const serviceSupabase = createServiceClient();
    
    // Update user password using admin API
    const { error } = await serviceSupabase.auth.admin.updateUserById(
      userId,
      { password: validatedData.password }
    );

    if (error) {
      console.error('Password update error:', error);
      throw error;
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Паролата е променена успешно' 
    });
  } catch (error) {
    console.error('Error updating password:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Възникна грешка при промяна на паролата' },
      { status: 500 }
    );
  }
}

