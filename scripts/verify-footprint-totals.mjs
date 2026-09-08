/**
 * Regression check — Stealth17 canonical footprint totals.
 * Usage: npm run verify:footprint
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

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

const CLIENT_EMAIL = 'stealth17bulgaria@gmail.com';

/** Expected totals after seed-stealth17 (tCO₂e, 3 dp). */
const EXPECTED = {
  2024: { scope1: 14.27, scope2: 6.14, scope3: 1.31, total: 21.72 },
  2025: { scope1: 13.78, scope2: 5.92, scope3: 1.25, total: 20.96 },
};

function round3(n) {
  return Math.round(n * 1000) / 1000;
}

async function getYearFootprint(companyId, year) {
  const { data: ed } = await supabase
    .from('emission_data')
    .select('scope, calculated_co2e')
    .eq('company_id', companyId)
    .gte('reporting_period', `${year}-01-01`)
    .lte('reporting_period', `${year}-12-31`);

  const { data: s3 } = await supabase
    .from('calculated_emissions')
    .select('co2e_kg')
    .eq('company_id', companyId)
    .eq('scope', 3)
    .gte('reporting_period', `${year}-01-01`)
    .lte('reporting_period', `${year}-12-31`);

  const scope1 = (ed ?? []).filter((r) => r.scope === 1).reduce((s, r) => s + r.calculated_co2e, 0);
  const scope2 = (ed ?? []).filter((r) => r.scope === 2).reduce((s, r) => s + r.calculated_co2e, 0);
  const scope3 = (s3 ?? []).reduce((s, r) => s + parseFloat(r.co2e_kg), 0) / 1000;

  return {
    scope1: round3(scope1),
    scope2: round3(scope2),
    scope3: round3(scope3),
    total: round3(scope1 + scope2 + scope3),
  };
}

async function findCompanyId() {
  const { data: list, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  const authUser = list.users.find((u) => u.email?.toLowerCase() === CLIENT_EMAIL);
  if (!authUser) throw new Error(`Auth user not found: ${CLIENT_EMAIL}`);

  const { data: userRow, error: userErr } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', authUser.id)
    .single();
  if (userErr || !userRow?.company_id) throw new Error('Company not found for Stealth17');
  return userRow.company_id;
}

function assertClose(label, actual, expected, tol = 0.02) {
  if (Math.abs(actual - expected) > tol) {
    throw new Error(`${label}: expected ${expected} (±${tol}), got ${actual}`);
  }
}

async function main() {
  const companyId = await findCompanyId();
  let failed = 0;

  for (const [year, exp] of Object.entries(EXPECTED)) {
    const fp = await getYearFootprint(companyId, Number(year));
    console.log(`${year}: S1=${fp.scope1} S2=${fp.scope2} S3=${fp.scope3} total=${fp.total}`);

    for (const key of ['scope1', 'scope2', 'scope3', 'total']) {
      try {
        assertClose(`${year}.${key}`, fp[key], exp[key]);
      } catch (e) {
        console.error('FAIL:', e.message);
        failed += 1;
      }
    }
  }

  if (failed > 0) {
    console.error(`\n${failed} assertion(s) failed.`);
    process.exit(1);
  }

  console.log('\nAll footprint regression checks passed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
