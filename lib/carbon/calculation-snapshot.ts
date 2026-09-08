/**
 * Calculation snapshots — immutable Scope 1+2 audit trail (Task 7).
 * Stores factor values at calculation time for reproducible CO2e figures.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { FactorResult } from '@/lib/emission-factors-lookup';

export const METHODOLOGY_VERSION = 'GHG-Scope12-v1';

export interface CalculationSnapshotRow {
  id: string;
  company_id: string;
  emission_id: string;
  scope: number;
  category: string;
  location_id: string | null;
  factor_db_id: string | null;
  factor_value: number;
  gwp_factor: number;
  effective_factor: number;
  factor_unit: string;
  factor_source_name: string | null;
  factor_source_year: number | null;
  factor_source_type: 'database' | 'fallback';
  activity_value: number;
  activity_unit: string;
  co2e_kg: number;
  co2e_tons: number;
  calculation_expression: string;
  methodology_version: string;
  data_quality: string | null;
  measurement_method: string | null;
  data_source: string | null;
  calculation_version: number;
  is_current: boolean;
  supersedes_snapshot_id: string | null;
  calculated_at: string;
  calculated_by: string | null;
  created_at: string;
}

export interface WriteSnapshotInput {
  companyId: string;
  emissionId: string;
  scope: number;
  category: string;
  locationId?: string | null;
  activityValue: number;
  activityUnit: string;
  factor: FactorResult;
  co2eTons: number;
  dataQuality?: string | null;
  measurementMethod?: string | null;
  dataSource?: string | null;
  calculatedBy?: string | null;
}

/** Build human-readable formula string (Bulgarian). */
export function buildCalculationExpression(params: {
  activityValue: number;
  activityUnit: string;
  factor: FactorResult;
  co2eKg: number;
  co2eTons: number;
}): string {
  const { activityValue, activityUnit, factor, co2eKg, co2eTons } = params;
  const act = activityValue.toLocaleString('bg-BG');

  if (factor.gwp > 1 && factor.factor === 1) {
    return `${act} ${activityUnit} × GWP ${factor.gwp} = ${co2eKg.toFixed(2)} kgCO₂e (${co2eTons.toFixed(4)} tCO₂e)`;
  }

  if (factor.gwp > 1) {
    return `${act} ${activityUnit} × ${factor.factor} × GWP ${factor.gwp} = ${co2eKg.toFixed(2)} kgCO₂e (${co2eTons.toFixed(4)} tCO₂e)`;
  }

  return `${act} ${activityUnit} × ${factor.effectiveFactor} kgCO₂e/${activityUnit} = ${co2eKg.toFixed(2)} kgCO₂e (${co2eTons.toFixed(4)} tCO₂e)`;
}

function factorUnitLabel(activityUnit: string): string {
  return `kgCO₂e/${activityUnit}`;
}

/**
 * Mark prior snapshots as superseded and insert a new current snapshot.
 * Uses service client (bypasses RLS).
 */
export async function writeCalculationSnapshot(
  supabase: SupabaseClient,
  input: WriteSnapshotInput,
): Promise<CalculationSnapshotRow | null> {
  const co2eKg = input.co2eTons * 1000;
  const expression = buildCalculationExpression({
    activityValue: input.activityValue,
    activityUnit: input.activityUnit,
    factor: input.factor,
    co2eKg,
    co2eTons: input.co2eTons,
  });

  const { data: prior } = await supabase
    .from('calculation_snapshots')
    .select('id, calculation_version')
    .eq('emission_id', input.emissionId)
    .eq('is_current', true)
    .maybeSingle();

  const nextVersion = (prior?.calculation_version ?? 0) + 1;

  if (prior?.id) {
    await supabase
      .from('calculation_snapshots')
      .update({ is_current: false })
      .eq('id', prior.id);
  }

  const { data, error } = await supabase
    .from('calculation_snapshots')
    .insert({
      company_id: input.companyId,
      emission_id: input.emissionId,
      scope: input.scope,
      category: input.category,
      location_id: input.locationId ?? null,
      factor_db_id: input.factor.factorId ?? null,
      factor_value: input.factor.factor,
      gwp_factor: input.factor.gwp,
      effective_factor: input.factor.effectiveFactor,
      factor_unit: factorUnitLabel(input.activityUnit),
      factor_source_name: input.factor.sourceName ?? null,
      factor_source_year: input.factor.sourceYear ?? null,
      factor_source_type: input.factor.source,
      activity_value: input.activityValue,
      activity_unit: input.activityUnit,
      co2e_kg: co2eKg,
      co2e_tons: input.co2eTons,
      calculation_expression: expression,
      methodology_version: METHODOLOGY_VERSION,
      data_quality: input.dataQuality ?? null,
      measurement_method: input.measurementMethod ?? null,
      data_source: input.dataSource ?? null,
      calculation_version: nextVersion,
      is_current: true,
      supersedes_snapshot_id: prior?.id ?? null,
      calculated_by: input.calculatedBy ?? null,
    })
    .select()
    .single();

  if (error) {
    // Table may not exist before migration
    if (error.code === '42P01') {
      console.warn('[CalculationSnapshot] Table not found — apply migration first');
      return null;
    }
    throw error;
  }

  return data as CalculationSnapshotRow;
}

/** Build FactorResult from an existing emission_data row (for backfill). */
export function factorFromEmissionRow(row: {
  emission_factor?: number | null;
  gwp_factor?: number | null;
  emission_factor_value?: number | null;
  factor_db_id?: string | null;
  factor_source_name?: string | null;
  factor_source_year?: number | null;
}): FactorResult {
  const factor = Number(row.emission_factor ?? 1);
  const gwp = Number(row.gwp_factor ?? 1);
  const effective = Number(row.emission_factor_value ?? factor * gwp);
  return {
    factor,
    gwp,
    effectiveFactor: effective,
    source: row.factor_db_id ? 'database' : 'fallback',
    factorId: row.factor_db_id ?? undefined,
    sourceName: row.factor_source_name ?? undefined,
    sourceYear: row.factor_source_year ?? undefined,
  };
}

export async function getCurrentCalculationSnapshot(
  supabase: SupabaseClient,
  emissionId: string,
): Promise<CalculationSnapshotRow | null> {
  const { data, error } = await supabase
    .from('calculation_snapshots')
    .select('*')
    .eq('emission_id', emissionId)
    .eq('is_current', true)
    .maybeSingle();

  if (error) {
    if (error.code === '42P01') return null;
    throw error;
  }
  return data as CalculationSnapshotRow | null;
}

export async function getCalculationSnapshotHistory(
  supabase: SupabaseClient,
  emissionId: string,
): Promise<CalculationSnapshotRow[]> {
  const { data, error } = await supabase
    .from('calculation_snapshots')
    .select('*')
    .eq('emission_id', emissionId)
    .order('calculation_version', { ascending: false });

  if (error) {
    if (error.code === '42P01') return [];
    throw error;
  }
  return (data ?? []) as CalculationSnapshotRow[];
}
