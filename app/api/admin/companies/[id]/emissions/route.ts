import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;
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

    // Use service client to fetch all emissions for the company
    const serviceSupabase = createServiceClient();
    
    const { data, error } = await serviceSupabase
      .from('emission_data')
      .select('*')
      .eq('company_id', companyId)
      .order('reporting_period', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching company emissions:', error);
    return NextResponse.json(
      { error: 'Възникна грешка при зареждане на данните' },
      { status: 500 }
    );
  }
}


