import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getCalculationSnapshotHistory,
  getCurrentCalculationSnapshot,
  type CalculationSnapshotRow,
} from '@/lib/carbon/calculation-snapshot';

export type { CalculationSnapshotRow };

/**
 * GET /api/emissions/[id]/calculation
 * Returns current snapshot + version history for an emission record.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Неоторизиран достъп' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('company_id, role')
      .eq('id', user.id)
      .single();

    if (!userData?.company_id && userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Няма свързана компания' }, { status: 400 });
    }

    const emissionQuery = supabase
      .from('emission_data')
      .select('id, company_id, calculated_co2e, activity_value, unit, emission_factor_value, gwp_factor')
      .eq('id', id);

    if (userData.role !== 'admin') {
      emissionQuery.eq('company_id', userData.company_id!);
    }

    const { data: emission, error: emErr } = await emissionQuery.single();
    if (emErr || !emission) {
      return NextResponse.json({ error: 'Записът не е намерен' }, { status: 404 });
    }

    const [current, history] = await Promise.all([
      getCurrentCalculationSnapshot(supabase, id),
      getCalculationSnapshotHistory(supabase, id),
    ]);

    return NextResponse.json({
      data: {
        current,
        history,
        emission: {
          id: emission.id,
          calculated_co2e: emission.calculated_co2e,
          activity_value: emission.activity_value,
          unit: emission.unit,
        },
      },
    });
  } catch (err) {
    console.error('calculation snapshot GET error:', err);
    return NextResponse.json({ error: 'Грешка при зареждане на изчислението' }, { status: 500 });
  }
}
