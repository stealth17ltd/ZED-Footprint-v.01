/**
 * Emission Factor Lookup
 * ─────────────────────────────────────────────────────────────────────────
 * Resolves an emission factor from the `emission_factors` database table.
 * Falls back to static values if the DB has no active row for the key.
 *
 * WHY: The data entry form uses human-readable category keys like
 * 'vehicles_diesel'. The database stores rows by (category, subcategory).
 * This module is the single source of truth for that mapping.
 */

import { createServiceClient } from '@/lib/supabase/service';

// ── Category key → DB (category, subcategory) mapping ─────────────────────
// 'isGwp: true' means the DB `value` IS the GWP multiplier,
// formula: CO2e_kg = activity_kg × gwp_value (factor=1)
const CATEGORY_DB_MAP: Record<
  string,
  { category: string; subcategory: string; isGwp?: boolean }
> = {
  vehicles_diesel:    { category: 'fuel',        subcategory: 'diesel'            },
  vehicles_petrol:    { category: 'fuel',        subcategory: 'petrol'            },
  vehicles_lpg:       { category: 'fuel',        subcategory: 'lpg'               },
  natural_gas:        { category: 'fuel',        subcategory: 'natural_gas_m3'    }, // m³
  heating_oil:        { category: 'fuel',        subcategory: 'heating_oil'       }, // litres
  coal:               { category: 'fuel',        subcategory: 'coal'              }, // kg
  refrigerant_r134a:  { category: 'refrigerant', subcategory: 'R-134a', isGwp: true },
  refrigerant_r404a:  { category: 'refrigerant', subcategory: 'R-404A', isGwp: true },
  electricity:        { category: 'electricity', subcategory: 'grid_standard'     }, // kWh
  district_heating:   { category: 'heating',     subcategory: 'district_heating'  }, // kWh
  district_cooling:   { category: 'heating',     subcategory: 'district_cooling'  }, // kWh
};

// ── Static fallback values ────────────────────────────────────────────────
// Used when the DB lookup fails or returns no active row.
// These are the original values the app shipped with.
const FALLBACK_FACTORS: Record<string, { factor: number; gwp: number }> = {
  vehicles_diesel:    { factor: 2.68,  gwp: 1    },
  vehicles_petrol:    { factor: 2.31,  gwp: 1    },
  vehicles_lpg:       { factor: 1.67,  gwp: 1    },
  natural_gas:        { factor: 2.02,  gwp: 1    },
  heating_oil:        { factor: 3.18,  gwp: 1    },
  coal:               { factor: 2.42,  gwp: 1    },
  refrigerant_r134a:  { factor: 1,     gwp: 1430 },
  refrigerant_r404a:  { factor: 1,     gwp: 3922 },
  electricity:        { factor: 0.505, gwp: 1    },
  district_heating:   { factor: 0.220, gwp: 1    },
  district_cooling:   { factor: 0.185, gwp: 1    },
};

// ── Return type ───────────────────────────────────────────────────────────
export interface FactorResult {
  /** The base emission factor (1 for refrigerants — use gwp instead). */
  factor: number;
  /** GWP multiplier (1 for non-refrigerants). */
  gwp: number;
  /**
   * Combined multiplier: factor × gwp.
   * Apply as: CO2e_kg = activity_value × effectiveFactor
   */
  effectiveFactor: number;
  /** Whether the value came from the live database or the static fallback. */
  source: 'database' | 'fallback';
  /** DB row ID — stored alongside the calculation for full audit trail. */
  factorId?: string;
  /** Human-readable source name (e.g. "DEFRA 2024"). */
  sourceName?: string;
  /** Year the source data was published. */
  sourceYear?: number;
}

/**
 * Look up the active emission factor for a given category key.
 *
 * Queries the database for the most-recently-valid active row.
 * Automatically falls back to static constants if the DB has no row
 * or if the query fails — so calculations never break due to a DB issue.
 *
 * @param categoryKey  e.g. 'vehicles_diesel', 'electricity'
 * @returns FactorResult or null if the key is unknown entirely
 */
export async function lookupEmissionFactor(
  categoryKey: string,
): Promise<FactorResult | null> {
  const mapping = CATEGORY_DB_MAP[categoryKey];
  if (!mapping) {
    console.warn(`[FactorLookup] Unknown category key: ${categoryKey}`);
    return null;
  }

  try {
    const supabase = createServiceClient();
    const today    = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('emission_factors')
      .select('id, value, source_name, source_year')
      .eq('category',    mapping.category)
      .eq('subcategory', mapping.subcategory)
      .eq('is_active',   true)
      // valid_to is null (no expiry) OR still in the future
      .or(`valid_to.is.null,valid_to.gte.${today}`)
      .order('valid_from', { ascending: false })
      .limit(1)
      .maybeSingle(); // returns null (not error) when no row found

    if (error) {
      console.error(`[FactorLookup] DB error for ${categoryKey}:`, error.message);
      return buildFallback(categoryKey);
    }

    if (!data) {
      console.warn(
        `[FactorLookup] No active DB row for ${categoryKey} ` +
        `(${mapping.category}/${mapping.subcategory}). Using fallback.`,
      );
      return buildFallback(categoryKey);
    }

    // Refrigerants: DB value IS the GWP. factor=1, gwp=db_value.
    // Everything else: factor=db_value, gwp=1.
    const factor = mapping.isGwp ? 1          : data.value;
    const gwp    = mapping.isGwp ? data.value : 1;

    return {
      factor,
      gwp,
      effectiveFactor: factor * gwp,
      source:          'database',
      factorId:        data.id,
      sourceName:      data.source_name ?? undefined,
      sourceYear:      data.source_year ?? undefined,
    };
  } catch (err) {
    console.error(`[FactorLookup] Unexpected error for ${categoryKey}:`, err);
    return buildFallback(categoryKey);
  }
}

function buildFallback(categoryKey: string): FactorResult | null {
  const fb = FALLBACK_FACTORS[categoryKey];
  if (!fb) return null;
  return {
    factor:          fb.factor,
    gwp:             fb.gwp,
    effectiveFactor: fb.factor * fb.gwp,
    source:          'fallback',
  };
}

/**
 * Convenience: returns only the effectiveFactor (factor × gwp).
 * Useful when you just need the number and don't need provenance.
 */
export async function getEffectiveFactor(categoryKey: string): Promise<number | null> {
  const result = await lookupEmissionFactor(categoryKey);
  return result?.effectiveFactor ?? null;
}
