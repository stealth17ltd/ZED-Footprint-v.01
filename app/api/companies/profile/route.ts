import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/companies/profile
 * Returns current user + company profile data for the onboarding wizard.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: userData } = await supabase
      .from('users')
      .select('first_name, last_name, role, company_id, onboarding_completed')
      .eq('id', user.id)
      .single();

    if (!userData?.company_id) {
      return NextResponse.json({ user: userData, company: null });
    }

    const { data: company } = await supabase
      .from('companies')
      .select('company_name, industry_sector, employee_count, baseline_year, annual_turnover_eur, ets_has_installation, ets_thermal_input_mw, ets_activity_annex_i')
      .eq('id', userData.company_id)
      .single();

    return NextResponse.json({ user: userData, company });
  } catch (err) {
    console.error('Profile error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
