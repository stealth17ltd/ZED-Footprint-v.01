import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/onboarding/complete
 * Marks the current user's onboarding as complete.
 * Optionally updates company profile fields collected during the wizard.
 *
 * Body (all optional):
 *   { industry_sector, employee_count, baseline_year }
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single();

    // Mark user onboarding complete
    await supabase
      .from('users')
      .update({
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    // Update company profile if data was provided
    const body = await request.json().catch(() => ({}));
    const { industry_sector, employee_count, baseline_year } = body;

    if (userData?.company_id && (industry_sector || employee_count || baseline_year)) {
      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (industry_sector)  patch.industry_sector  = industry_sector;
      if (employee_count)   patch.employee_count   = Number(employee_count);
      if (baseline_year)    patch.baseline_year     = Number(baseline_year);

      await supabase
        .from('companies')
        .update(patch)
        .eq('id', userData.company_id);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Onboarding complete error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
