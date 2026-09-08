import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

/**
 * POST /api/onboarding/complete
 * Marks the current user's onboarding as complete.
 * Uses service role for the user update (RLS blocks client self-updates on users table).
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serviceSupabase = createServiceClient();

    const { data: userData, error: userFetchErr } = await serviceSupabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (userFetchErr) {
      console.error('Onboarding complete — user fetch:', userFetchErr);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const {
      industry_sector,
      employee_count,
      baseline_year,
      annual_turnover_eur,
      ets_has_installation,
      ets_thermal_input_mw,
      ets_activity_annex_i,
    } = body;

    const { error: updateErr } = await serviceSupabase
      .from('users')
      .update({
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateErr) {
      console.error('Onboarding complete — user update:', updateErr);
      return NextResponse.json(
        { error: 'Failed to mark onboarding complete', details: updateErr.message },
        { status: 500 },
      );
    }

    if (userData?.company_id) {
      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (industry_sector !== undefined) patch.industry_sector = industry_sector;
      if (employee_count !== undefined) patch.employee_count = Number(employee_count);
      if (baseline_year !== undefined) patch.baseline_year = Number(baseline_year);
      if (annual_turnover_eur !== undefined) {
        patch.annual_turnover_eur = annual_turnover_eur === null ? null : Number(annual_turnover_eur);
      }
      if (ets_has_installation !== undefined) patch.ets_has_installation = ets_has_installation;
      if (ets_thermal_input_mw !== undefined) {
        patch.ets_thermal_input_mw = ets_thermal_input_mw === null ? null : Number(ets_thermal_input_mw);
      }
      if (ets_activity_annex_i !== undefined) patch.ets_activity_annex_i = ets_activity_annex_i;

      if (Object.keys(patch).length > 1) {
        const { error: companyErr } = await serviceSupabase
          .from('companies')
          .update(patch)
          .eq('id', userData.company_id);

        if (companyErr) {
          console.error('Onboarding complete — company update:', companyErr);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Onboarding complete error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
