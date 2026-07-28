import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { z } from 'zod';
import { lookupEmissionFactor } from '@/lib/emission-factors-lookup';

const updateSchema = z.object({
  scope:              z.number().int().min(1).max(2).optional(),
  category:           z.string().min(1).optional(),
  activity_value:     z.number().positive().optional(),
  unit:               z.string().min(1).optional(),
  reporting_period:   z.string().regex(/^\d{4}-\d{2}$/).optional(),
  notes:              z.string().optional().nullable(),
  location:           z.string().optional().nullable(),
  location_id:        z.string().uuid().optional().nullable(),
  equipment_id:       z.string().optional().nullable(),
  supplier:           z.string().optional().nullable(),
  invoice_number:     z.string().optional().nullable(),
  measurement_method: z.enum(['measured', 'calculated', 'estimated']).optional(),
  data_quality:       z.enum(['high', 'medium', 'low']).optional(),
  cost:               z.number().optional().nullable(),
  currency:           z.enum(['BGN', 'EUR', 'USD']).optional(),
  responsible_person: z.string().optional().nullable(),
});

export async function PATCH(
  request: Request,
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
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!userData?.company_id) {
      return NextResponse.json({ error: 'Няма свързана компания' }, { status: 400 });
    }

    const body = await request.json();
    const validated = updateSchema.parse(body);

    // Recalculate CO2e if activity_value or category changed
    const updates: Record<string, unknown> = { ...validated };

    const needsRecalc = validated.activity_value !== undefined || validated.category !== undefined;
    if (needsRecalc) {
      // Fetch current record to fill in any missing values
      const { data: current } = await supabase
        .from('emission_data')
        .select('activity_value, category')
        .eq('id', id)
        .eq('company_id', userData.company_id)
        .single();

      if (!current) {
        return NextResponse.json({ error: 'Записът не е намерен' }, { status: 404 });
      }

      const actVal = validated.activity_value ?? current.activity_value;
      const cat    = validated.category ?? current.category;

      // DB-first factor lookup with static fallback
      const efData = await lookupEmissionFactor(cat);
      if (efData) {
        updates.emission_factor       = efData.factor;
        updates.emission_factor_value = efData.effectiveFactor;
        updates.gwp_factor            = efData.gwp;
        updates.calculated_co2e       = (actVal * efData.effectiveFactor) / 1000;
        // Refresh audit trail columns
        updates.factor_source_name    = efData.sourceName || null;
        updates.factor_source_year    = efData.sourceYear || null;
        updates.factor_db_id          = efData.factorId   || null;

        if (efData.source === 'fallback') {
          console.warn(`[emissions PATCH] Using fallback factor for category: ${cat}`);
        }
      }
    }

    // Convert reporting_period to date if provided
    if (validated.reporting_period) {
      updates.reporting_period = new Date(`${validated.reporting_period}-01`).toISOString().split('T')[0];
    }

    const service = createServiceClient();
    const { data, error } = await service
      .from('emission_data')
      .update(updates)
      .eq('id', id)
      .eq('company_id', userData.company_id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Записът не е намерен' }, { status: 404 });

    return NextResponse.json({ data });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    console.error('emissions PATCH error:', err);
    return NextResponse.json({ error: 'Грешка при актуализиране' }, { status: 500 });
  }
}

export async function DELETE(
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
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!userData?.company_id) {
      return NextResponse.json({ error: 'Няма свързана компания' }, { status: 400 });
    }

    const service = createServiceClient();
    const { error } = await service
      .from('emission_data')
      .delete()
      .eq('id', id)
      .eq('company_id', userData.company_id);

    if (error) throw error;

    return NextResponse.json({ message: 'Записът е изтрит' });
  } catch (err) {
    console.error('emissions DELETE error:', err);
    return NextResponse.json({ error: 'Грешка при изтриване' }, { status: 500 });
  }
}
