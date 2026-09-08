/**
 * Backfill calculation_snapshots for existing emission_data rows.
 * Usage: npm run backfill:snapshots
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const METHODOLOGY_VERSION = 'GHG-Scope12-v1';

function loadEnvLocal() {
  const raw = readFileSync(join(root, '.env.local'), 'utf8');
  for (const line of raw.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    process.env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
}

loadEnvLocal();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

function buildExpression(activityValue, activityUnit, factor, gwp, effective, co2eKg, co2eTons) {
  const act = activityValue.toLocaleString('bg-BG');
  if (gwp > 1 && factor === 1) {
    return `${act} ${activityUnit} × GWP ${gwp} = ${co2eKg.toFixed(2)} kgCO₂e (${co2eTons.toFixed(4)} tCO₂e)`;
  }
  if (gwp > 1) {
    return `${act} ${activityUnit} × ${factor} × GWP ${gwp} = ${co2eKg.toFixed(2)} kgCO₂e (${co2eTons.toFixed(4)} tCO₂e)`;
  }
  return `${act} ${activityUnit} × ${effective} kgCO₂e/${activityUnit} = ${co2eKg.toFixed(2)} kgCO₂e (${co2eTons.toFixed(4)} tCO₂e)`;
}

async function main() {
  const { data: existing, error: exErr } = await supabase
    .from('calculation_snapshots')
    .select('emission_id')
    .eq('is_current', true);

  if (exErr?.code === '42P01') {
    console.error('calculation_snapshots table missing — run: npm run db:migrate');
    process.exit(1);
  }
  if (exErr) throw exErr;

  const hasSnapshot = new Set((existing ?? []).map((r) => r.emission_id));

  const { data: emissions, error: emErr } = await supabase
    .from('emission_data')
    .select('*')
    .order('created_at', { ascending: true });

  if (emErr) throw emErr;

  const toBackfill = (emissions ?? []).filter((e) => !hasSnapshot.has(e.id));
  if (toBackfill.length === 0) {
    console.log('All emission records already have calculation snapshots.');
    return;
  }

  console.log(`Backfilling ${toBackfill.length} emission record(s)...`);

  let ok = 0;
  for (const row of toBackfill) {
    const factor = Number(row.emission_factor ?? 1);
    const gwp = Number(row.gwp_factor ?? 1);
    const effective = Number(row.emission_factor_value ?? factor * gwp);
    const co2eTons = Number(row.calculated_co2e);
    const co2eKg = co2eTons * 1000;
    const activityUnit = row.unit;
    const expression = buildExpression(
      row.activity_value,
      activityUnit,
      factor,
      gwp,
      effective,
      co2eKg,
      co2eTons,
    );

    const { error } = await supabase.from('calculation_snapshots').insert({
      company_id: row.company_id,
      emission_id: row.id,
      scope: row.scope,
      category: row.category,
      location_id: row.location_id,
      factor_db_id: row.factor_db_id,
      factor_value: factor,
      gwp_factor: gwp,
      effective_factor: effective,
      factor_unit: `kgCO₂e/${activityUnit}`,
      factor_source_name: row.factor_source_name,
      factor_source_year: row.factor_source_year,
      factor_source_type: row.factor_db_id ? 'database' : 'fallback',
      activity_value: row.activity_value,
      activity_unit: activityUnit,
      co2e_kg: co2eKg,
      co2e_tons: co2eTons,
      calculation_expression: expression,
      methodology_version: METHODOLOGY_VERSION,
      data_quality: row.data_quality,
      measurement_method: row.measurement_method,
      data_source: row.data_source,
      calculation_version: 1,
      is_current: true,
      calculated_by: row.uploaded_by,
    });

    if (error) {
      console.error(`  fail ${row.id}:`, error.message);
    } else {
      ok++;
    }
  }

  console.log(`\nBackfill complete: ${ok}/${toBackfill.length} snapshots created.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
