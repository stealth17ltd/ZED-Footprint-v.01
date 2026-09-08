import { NextResponse } from 'next/server';
import { DEFAULT_CURRENCY, currencySchema, normalizeCostForStorage } from '@/lib/constants/currency';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { z } from 'zod';
import { lookupEmissionFactor } from '@/lib/emission-factors-lookup';
import { writeCalculationSnapshot } from '@/lib/carbon/calculation-snapshot';

const createEmissionSchema = z.object({
  scope: z.number().int().min(1).max(2),
  category: z.string().min(1, 'Категорията е задължителна'),
  activity_value: z.number().positive('Количеството трябва да е положително число'),
  unit: z.string().min(1, 'Единицата е задължителна'),
  reporting_period: z.string().regex(/^\d{4}-\d{2}$/, 'Невалиден формат на период'),
  notes: z.string().optional(),
  // Enhanced fields
  location: z.string().optional(),
  location_id: z.string().uuid().optional().nullable(),
  equipment_id: z.string().optional(),
  supplier: z.string().optional(),
  invoice_number: z.string().optional(),
  measurement_method: z.enum(['measured', 'calculated', 'estimated']).optional(),
  data_quality: z.enum(['high', 'medium', 'low']).optional(),
  cost: z.string().optional(),
  currency: currencySchema.optional(),
  responsible_person: z.string().optional(),
});

// Emission factors are now resolved from the database via lookupEmissionFactor().
// Static fallbacks remain inside that module and are used automatically
// when no active DB row exists for a given category key.

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Неоторизиран достъп' }, { status: 401 });
    }

    // Get user's company
    const { data: userData } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!userData?.company_id) {
      return NextResponse.json(
        { error: 'Потребителят не е свързан с компания' },
        { status: 400 }
      );
    }

    // Validate input
    const body = await request.json();
    const validatedData = createEmissionSchema.parse(body);

    // Resolve emission factor — DB-first, falls back to static constants
    const emissionFactorData = await lookupEmissionFactor(validatedData.category);
    if (!emissionFactorData) {
      return NextResponse.json(
        { error: 'Невалидна категория емисия' },
        { status: 400 }
      );
    }

    // Calculate CO2e
    // Formula: CO2e (kg) = Activity Value × factor × GWP
    const { factor, gwp, effectiveFactor, source: factorSource } = emissionFactorData;
    const calculatedCO2e_kg   = validatedData.activity_value * effectiveFactor;
    const calculatedCO2e_tons = calculatedCO2e_kg / 1000;

    if (factorSource === 'fallback') {
      console.warn(`[emissions POST] Using fallback factor for category: ${validatedData.category}`);
    }

    // Convert reporting period to date (first day of month)
    const reportingDate = new Date(`${validatedData.reporting_period}-01`);

    // Use service client for insertion
    const serviceSupabase = createServiceClient();

    // Insert emission data
    const { data: emissionData, error: insertError } = await serviceSupabase
      .from('emission_data')
      .insert({
        company_id: userData.company_id,
        reporting_period: reportingDate.toISOString().split('T')[0],
        scope: validatedData.scope,
        category: validatedData.category,
        activity_value: validatedData.activity_value,
        unit: validatedData.unit,
        emission_factor: factor,
        emission_factor_value: effectiveFactor,
        gwp_factor: gwp,
        calculated_co2e: calculatedCO2e_tons,
        data_source: 'manual',
        validation_status: 'validated',
        notes: validatedData.notes,
        uploaded_by: user.id,
        // Enhanced fields
        location: validatedData.location || null,
        location_id: validatedData.location_id || null,
        equipment_id: validatedData.equipment_id || null,
        supplier: validatedData.supplier || null,
        invoice_number: validatedData.invoice_number || null,
        measurement_method: validatedData.measurement_method || 'measured',
        data_quality: validatedData.data_quality || 'high',
        ...normalizeCostForStorage(
          validatedData.cost ? parseFloat(validatedData.cost) : null,
          validatedData.currency,
        ),
        responsible_person:  validatedData.responsible_person || null,
        // Factor audit trail
        factor_source_name: emissionFactorData.sourceName  || null,
        factor_source_year: emissionFactorData.sourceYear  || null,
        factor_db_id:       emissionFactorData.factorId    || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }

    await writeCalculationSnapshot(serviceSupabase, {
      companyId: userData.company_id,
      emissionId: emissionData.id,
      scope: validatedData.scope,
      category: validatedData.category,
      locationId: validatedData.location_id,
      activityValue: validatedData.activity_value,
      activityUnit: validatedData.unit,
      factor: emissionFactorData,
      co2eTons: calculatedCO2e_tons,
      dataQuality: validatedData.data_quality,
      measurementMethod: validatedData.measurement_method,
      dataSource: 'manual',
      calculatedBy: user.id,
    });

    return NextResponse.json({
      data: emissionData,
      calculation: {
        activity_value:     validatedData.activity_value,
        unit:               validatedData.unit,
        emission_factor:    factor,
        gwp,
        effective_factor:   effectiveFactor,
        calculated_co2e_kg:   calculatedCO2e_kg,
        calculated_co2e_tons: calculatedCO2e_tons,
        factor_source:      factorSource,
        factor_id:          emissionFactorData.factorId,
        factor_source_name: emissionFactorData.sourceName,
        factor_source_year: emissionFactorData.sourceYear,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating emission data:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Грешка при валидация', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Възникна грешка при запазване на данните' },
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

    // Get user's company
    const { data: userData } = await supabase
      .from('users')
      .select('company_id, role')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'Потребителят не е намерен' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope');
    const period = searchParams.get('period');
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');

    let query = supabase
      .from('emission_data')
      .select('*')
      .order('reporting_period', { ascending: false });

    // Filter by company (admins can see all, users see only their company)
    if (userData.role !== 'admin' && userData.company_id) {
      query = query.eq('company_id', userData.company_id);
    }

    // Apply filters
    if (scope) {
      query = query.eq('scope', parseInt(scope));
    }
    if (period) {
      query = query.eq('reporting_period', period);
    }
    if (startDate) {
      query = query.gte('reporting_period', startDate);
    }
    if (endDate) {
      query = query.lte('reporting_period', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching emission data:', error);
    return NextResponse.json(
      { error: 'Възникна грешка при зареждане на данните' },
      { status: 500 }
    );
  }
}
