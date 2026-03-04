import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { z } from 'zod';

const createEmissionSchema = z.object({
  scope: z.number().int().min(1).max(2),
  category: z.string().min(1, 'Категорията е задължителна'),
  activity_value: z.number().positive('Количеството трябва да е положително число'),
  unit: z.string().min(1, 'Единицата е задължителна'),
  reporting_period: z.string().regex(/^\d{4}-\d{2}$/, 'Невалиден формат на период'),
  notes: z.string().optional(),
  // Enhanced fields
  location: z.string().optional(),
  equipment_id: z.string().optional(),
  supplier: z.string().optional(),
  invoice_number: z.string().optional(),
  measurement_method: z.enum(['measured', 'calculated', 'estimated']).optional(),
  data_quality: z.enum(['high', 'medium', 'low']).optional(),
  cost: z.string().optional(),
  currency: z.enum(['BGN', 'EUR', 'USD']).optional(),
  responsible_person: z.string().optional(),
});

// Emission factors for Bulgaria/EU (kgCO2e per unit)
// Source: DEFRA 2023, Bulgarian Energy Agency
const EMISSION_FACTORS: Record<string, { factor: number; gwp?: number }> = {
  // Scope 1 - Vehicles
  'vehicles_diesel': { factor: 2.68 },      // kg CO2e per liter
  'vehicles_petrol': { factor: 2.31 },      // kg CO2e per liter
  'vehicles_lpg': { factor: 1.67 },         // kg CO2e per liter
  
  // Scope 1 - Fuels
  'natural_gas': { factor: 2.02 },          // kg CO2e per m³
  'heating_oil': { factor: 3.18 },          // kg CO2e per liter
  'coal': { factor: 2.42 },                 // kg CO2e per kg
  
  // Scope 1 - Refrigerants (GWP factors)
  'refrigerant_r134a': { factor: 1, gwp: 1430 },    // GWP100
  'refrigerant_r404a': { factor: 1, gwp: 3922 },    // GWP100
  
  // Scope 2 - Energy
  'electricity': { factor: 0.505 },         // kg CO2e per kWh (Bulgaria grid 2023)
  'district_heating': { factor: 0.220 },    // kg CO2e per kWh
  'district_cooling': { factor: 0.185 },    // kg CO2e per kWh
};

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

    // Get emission factor
    const emissionFactorData = EMISSION_FACTORS[validatedData.category];
    if (!emissionFactorData) {
      return NextResponse.json(
        { error: 'Невалидна категория емисия' },
        { status: 400 }
      );
    }

    // Calculate CO2e
    // Formula: CO2e (kg) = Activity Value × Emission Factor × GWP (if applicable)
    const gwp = emissionFactorData.gwp || 1;
    const calculatedCO2e_kg = validatedData.activity_value * emissionFactorData.factor * gwp;
    const calculatedCO2e_tons = calculatedCO2e_kg / 1000; // Convert to metric tons

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
        emission_factor: emissionFactorData.factor,
        emission_factor_value: emissionFactorData.factor,
        gwp_factor: gwp,
        calculated_co2e: calculatedCO2e_tons,
        data_source: 'manual',
        validation_status: 'validated',
        notes: validatedData.notes,
        uploaded_by: user.id,
        // Enhanced fields
        location: validatedData.location || null,
        equipment_id: validatedData.equipment_id || null,
        supplier: validatedData.supplier || null,
        invoice_number: validatedData.invoice_number || null,
        measurement_method: validatedData.measurement_method || 'measured',
        data_quality: validatedData.data_quality || 'high',
        cost: validatedData.cost ? parseFloat(validatedData.cost) : null,
        currency: validatedData.currency || 'BGN',
        responsible_person: validatedData.responsible_person || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }

    return NextResponse.json({
      data: emissionData,
      calculation: {
        activity_value: validatedData.activity_value,
        unit: validatedData.unit,
        emission_factor: emissionFactorData.factor,
        gwp: gwp,
        calculated_co2e_kg: calculatedCO2e_kg,
        calculated_co2e_tons: calculatedCO2e_tons,
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating emission data:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Грешка при валидация', details: error.errors },
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
