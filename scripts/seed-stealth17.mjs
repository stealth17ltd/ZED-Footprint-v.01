/**
 * Seed demo data for СТЕЛТ 17 ООД (stealth17bulgaria@gmail.com)
 * Populates Scope 1/2 emissions (2024, 2025, H1 2026), Scope 3, targets, strategies,
 * locations, ETS/compliance profile, and VSME manual disclosures.
 *
 * Usage: npm run seed:stealth17
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

const FACTORS = {
  vehicles_diesel: { ef: 2.68, unit: 'литри', scope: 1 },
  vehicles_petrol: { ef: 2.31, unit: 'литри', scope: 1 },
  electricity:     { ef: 0.505, unit: 'kWh', scope: 2 },
};

const MONTHS = [
  ...Array.from({ length: 12 }, (_, i) => ({ year: 2024, month: i + 1 })),
  ...Array.from({ length: 12 }, (_, i) => ({ year: 2025, month: i + 1 })),
  ...Array.from({ length: 6 }, (_, i) => ({ year: 2026, month: i + 1 })),
];

function calcCo2e(activity, factor) {
  return Math.round((activity * factor / 1000) * 1000) / 1000;
}

function activity(base, year, month, key) {
  const seasonal =
    key === 'electricity'
      ? month >= 6 && month <= 8 ? 1.12 : month <= 2 || month >= 11 ? 1.08 : 1.0
      : 1.0;
  const trend = year === 2024 ? 1.06 : year === 2025 ? 1.0 : 0.94;
  const jitter = 0.9 + (((year * 12 + month) * 17) % 20) / 100;
  return Math.round(base * seasonal * trend * jitter);
}

const SCOPE3_SUPPLIERS = [
  { supplier: 'Microsoft Ireland', desc: 'Microsoft 365 абонамент', cat: 1, amount: [180, 220] },
  { supplier: 'Офис 1 Суперстор', desc: 'Канцеларски материали', cat: 1, amount: [85, 160] },
  { supplier: 'A1 България', desc: 'Мобилни и интернет услуги', cat: 1, amount: [120, 180] },
  { supplier: 'DHL Express', desc: 'Куриерски услуги', cat: 4, amount: [45, 95] },
  { supplier: 'Rent A Car Sofia', desc: 'Командировка — наем автомобил', cat: 6, amount: [200, 380] },
  { supplier: 'Technopolis', desc: 'IT оборудване', cat: 1, amount: [350, 900] },
  { supplier: 'Econt Express', desc: 'Доставка на стоки', cat: 4, amount: [30, 75] },
  { supplier: 'Regus Sofia', desc: 'Наем на конферентна зала', cat: 1, amount: [150, 280] },
];

async function findClient() {
  const { data: list, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  const authUser = list.users.find((u) => u.email?.toLowerCase() === CLIENT_EMAIL);
  if (!authUser) throw new Error(`Auth user not found: ${CLIENT_EMAIL}`);

  const { data: userRow, error: userErr } = await supabase
    .from('users')
    .select('id, company_id, first_name')
    .eq('id', authUser.id)
    .single();
  if (userErr || !userRow?.company_id) throw new Error('User has no company_id');

  const { data: company, error: coErr } = await supabase
    .from('companies')
    .select('*')
    .eq('id', userRow.company_id)
    .single();
  if (coErr) throw coErr;

  return { authUser, userRow, company };
}

async function clearCompanyData(companyId) {
  const tables = [
    'calculated_emissions',
    'transaction_classifications',
    'transactions',
    'import_batches',
    'scope3_activity_entries',
    'emission_data',
    'strategy_initiatives',
    'reduction_strategies',
    'emission_targets',
    'vsme_manual_disclosures',
  ];

  for (const table of tables) {
    if (table === 'strategy_initiatives') {
      const { data: strategies } = await supabase
        .from('reduction_strategies')
        .select('id')
        .eq('company_id', companyId);
      if (strategies?.length) {
        await supabase
          .from('strategy_initiatives')
          .delete()
          .in('strategy_id', strategies.map((s) => s.id));
      }
      continue;
    }
    if (table === 'transaction_classifications') {
      const { data: txns } = await supabase.from('transactions').select('id').eq('company_id', companyId);
      if (txns?.length) {
        await supabase.from('transaction_classifications').delete().in('transaction_id', txns.map((t) => t.id));
      }
      continue;
    }
    const q = supabase.from(table).delete().eq('company_id', companyId);
    await q;
  }
}

async function seedScope12(companyId, userId) {
  const rows = [];
  for (const { year, month } of MONTHS) {
    const period = `${year}-${String(month).padStart(2, '0')}-01`;
    const entries = [
      { cat: 'vehicles_diesel', base: 310 },
      { cat: 'vehicles_petrol', base: 135 },
      { cat: 'electricity', base: 920 },
    ];
    for (const { cat, base } of entries) {
      const f = FACTORS[cat];
      const val = activity(base, year, month, cat);
      rows.push({
        company_id: companyId,
        reporting_period: period,
        scope: f.scope,
        category: cat,
        activity_value: val,
        unit: f.unit,
        emission_factor: f.ef,
        emission_factor_value: f.ef,
        gwp_factor: 1,
        calculated_co2e: calcCo2e(val, f.ef),
        data_source: 'manual',
        validation_status: 'validated',
        measurement_method: 'measured',
        data_quality: 'high',
        uploaded_by: userId,
        notes: null,
      });
    }
  }

  const { error } = await supabase.from('emission_data').insert(rows);
  if (error) throw error;
  console.log(`  Scope 1&2: ${rows.length} emission records`);
  return rows.reduce((s, r) => s + r.calculated_co2e, 0);
}

async function seedScope3(companyId, userId) {
  const { data: factor } = await supabase
    .from('emission_factors')
    .select('id, value, unit')
    .eq('scope', 3)
    .eq('scope3_category', 1)
    .eq('is_active', true)
    .limit(1)
    .single();

  const factorValue = factor ? parseFloat(factor.value) : 0.42;
  const factorId = factor?.id ?? null;

  const { data: batch, error: batchErr } = await supabase
    .from('import_batches')
    .insert({
      company_id: companyId,
      filename: 'seed-stealth17-demo.csv',
      row_count: 0,
      status: 'completed',
      imported_by: userId,
      completed_at: new Date().toISOString(),
    })
    .select('id')
    .single();
  if (batchErr) throw batchErr;

  let txnCount = 0;
  let calcRows = [];

  for (const { year, month } of MONTHS) {
    const picks = SCOPE3_SUPPLIERS.filter((_, idx) => (idx + month + year) % 3 !== 0);
    for (let i = 0; i < Math.min(picks.length, 4); i++) {
      const p = picks[i];
      const day = 5 + ((i * 7 + month) % 20);
      const txnDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const amount = p.amount[0] + ((year + month + i) * 13) % (p.amount[1] - p.amount[0]);

      const { data: txn, error: txnErr } = await supabase
        .from('transactions')
        .insert({
          company_id: companyId,
          import_batch_id: batch.id,
          txn_date: txnDate,
          supplier: p.supplier,
          description: p.desc,
          amount_original: amount,
          currency_original: 'EUR',
          amount_base_currency: amount,
          base_currency: 'EUR',
          fx_rate: 1,
          invoice_number: `ST17-${year}${String(month).padStart(2, '0')}-${i + 1}`,
          created_by: userId,
        })
        .select('id')
        .single();
      if (txnErr) throw txnErr;

      await supabase.from('transaction_classifications').insert({
        transaction_id: txn.id,
        scope: 3,
        scope3_category: p.cat,
        method_tier: 'C',
        factor_id: factorId,
        confidence_score: 0.85,
        classified_by: 'user',
        classified_by_user: userId,
      });

      const co2eKg = amount * factorValue;
      calcRows.push({
        company_id: companyId,
        source_type: 'transaction',
        source_id: txn.id,
        reporting_period: `${year}-${String(month).padStart(2, '0')}-01`,
        scope: 3,
        scope_category: p.cat,
        co2e_kg: co2eKg,
        factor_id: factorId,
        method_tier: 'C',
        calculation_trace: {
          supplier: p.supplier,
          description: p.desc,
          amount,
          currency: 'EUR',
          factor_value: factorValue,
          calculation: `${amount} EUR × ${factorValue} = ${co2eKg.toFixed(2)} kg`,
        },
      });
      txnCount++;
    }
  }

  if (calcRows.length) {
    const { error: calcErr } = await supabase.from('calculated_emissions').insert(calcRows);
    if (calcErr) throw calcErr;
  }

  console.log(`  Scope 3: ${txnCount} transactions, ${calcRows.length} calculations`);
  return calcRows.reduce((s, r) => s + r.co2e_kg, 0) / 1000;
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
    scope1: Math.round(scope1 * 1000) / 1000,
    scope2: Math.round(scope2 * 1000) / 1000,
    scope3: Math.round(scope3 * 1000) / 1000,
    total: Math.round((scope1 + scope2 + scope3) * 1000) / 1000,
  };
}

async function seedTargets(companyId, footprints) {
  const fp2024 = footprints[2024];
  const fp2025 = footprints[2025];

  const targets = [
    {
      company_id: companyId,
      name: 'Намаляване на емисиите с 15% (2024–2027)',
      description: 'Общ цел за Обхват 1, 2 и 3 спрямо базова 2024 г.',
      target_type: 'percentage',
      scope: null,
      baseline_year: 2024,
      baseline_value: fp2024.total,
      target_year: 2027,
      target_value: 15,
      current_value: fp2025.total,
      status: 'active',
      sbti_aligned: true,
    },
    {
      company_id: companyId,
      name: 'Нулеви Обхват 2 емисии до 2028',
      description: 'Преминаване към зелена електроенергия',
      target_type: 'percentage',
      scope: 2,
      baseline_year: 2024,
      baseline_value: fp2024.scope2,
      target_year: 2028,
      target_value: 100,
      current_value: fp2025.scope2,
      status: 'active',
      sbti_aligned: true,
    },
    {
      company_id: companyId,
      name: 'Намаляване на автопарк (Обхват 1) с 10% за 2026',
      description: 'Оптимизация на служебните превозни средства',
      target_type: 'percentage',
      scope: 1,
      baseline_year: 2025,
      baseline_value: fp2025.scope1,
      target_year: 2026,
      target_value: 10,
      current_value: Math.round(fp2025.scope1 * 0.92 * 1000) / 1000,
      status: 'active',
      sbti_aligned: false,
    },
  ];

  const { error } = await supabase.from('emission_targets').insert(targets);
  if (error) throw error;
  console.log(`  Targets: ${targets.length}`);
}

async function seedStrategies(companyId) {
  const { data: strategy, error: sErr } = await supabase
    .from('reduction_strategies')
    .insert({
      company_id: companyId,
      title: 'Преминаване към LED осветление',
      description: 'Замяна на остаряло осветление с LED технология в офиса и склада.',
      category: 'energy_efficiency',
      scope: 2,
      priority: 'high',
      status: 'active',
      estimated_reduction_co2e: 8,
      estimated_cost: 6000,
      start_date: '2025-03-01',
      target_completion_date: '2026-06-30',
      is_ai_generated: false,
    })
    .select('id')
    .single();
  if (sErr) throw sErr;

  await supabase.from('strategy_initiatives').insert([
    { strategy_id: strategy.id, title: 'Одит на осветление', status: 'completed', sort_order: 1, estimated_reduction_co2e: 0 },
    { strategy_id: strategy.id, title: 'Събиране на оферти', status: 'in_progress', sort_order: 2, estimated_reduction_co2e: 0 },
    { strategy_id: strategy.id, title: 'Монтаж на LED', status: 'pending', sort_order: 3, estimated_reduction_co2e: 8 },
  ]);

  await supabase.from('reduction_strategies').insert({
    company_id: companyId,
    title: 'Оптимизация на автопарка',
    description: 'Намаляване на служебните пътувания и преминаване към по-икономични автомобили.',
    category: 'fleet',
    scope: 1,
    priority: 'medium',
    status: 'active',
    estimated_reduction_co2e: 5,
    estimated_cost: 12000,
    start_date: '2025-01-01',
    target_completion_date: '2027-12-31',
    is_ai_generated: false,
  });

  console.log('  Strategies: 2 active with initiatives');
}

async function seedCompanyProfile(companyId) {
  const { error } = await supabase.from('companies').update({
    company_name: 'СТЕЛТ 17 ООД',
    industry_sector: 'Консултантски услуги',
    employee_count: 22,
    baseline_year: 2024,
    eu_green_deal_commitment: true,
    annual_turnover_eur: 850000,
    ets_has_installation: false,
    ets_thermal_input_mw: null,
    ets_activity_annex_i: null,
    updated_at: new Date().toISOString(),
  }).eq('id', companyId);
  if (error) throw error;
  console.log('  Company profile: turnover, ETS screening (no installation)');
}

async function seedLocations(companyId) {
  await supabase.from('locations').delete().eq('company_id', companyId);

  const locations = [
    {
      company_id: companyId,
      location_name: 'Централен офис София',
      address: 'ул. „Граф Игнатиев" 12, София',
      city: 'София',
      country: 'Bulgaria',
      location_type: 'office',
      square_meters: 180,
      employee_count: 18,
      is_primary: true,
      is_active: true,
    },
    {
      company_id: companyId,
      location_name: 'Склад Пловдив',
      address: 'бул. „Марица" 45, Пловдив',
      city: 'Пловдив',
      country: 'Bulgaria',
      location_type: 'warehouse',
      square_meters: 320,
      employee_count: 4,
      is_primary: false,
      is_active: true,
    },
  ];

  const { error } = await supabase.from('locations').insert(locations);
  if (error) throw error;
  console.log(`  Locations: ${locations.length}`);
}

async function seedVsmeManual(companyId) {
  const base = {
    health_safety_has_policy: true,
    health_safety_description:
      'Въведена е политика за здраве и безопасност при работа. Провеждат се периодични инструктажи и оценка на риска за офис и склад.',
    health_safety_responsible_person: 'Мария Петрова — HR мениджър',
    health_safety_training_frequency: 'на 3 месеца',
    anti_corruption_has_policy: true,
    anti_corruption_description:
      'Кодекс за етично поведение и политика срещу корупция. Всички служители подписват декларация при назначаване.',
    anti_corruption_whistleblower: true,
  };

  const rows = [2024, 2025, 2026].map((year) => ({
    company_id: companyId,
    reporting_year: year,
    ...base,
    health_safety_incidents: year === 2024 ? 1 : 0,
  }));

  let { error } = await supabase.from('vsme_manual_disclosures').insert(rows);

  if (error?.code === 'PGRST204') {
    const withoutFrequency = rows.map(({ health_safety_training_frequency, ...rest }) => ({
      ...rest,
      health_safety_annual_training: true,
    }));
    ({ error } = await supabase.from('vsme_manual_disclosures').insert(withoutFrequency));
  }

  if (error?.code === 'PGRST204') {
    const minimal = rows.map(({
      health_safety_training_frequency,
      health_safety_responsible_person,
      anti_corruption_whistleblower,
      ...rest
    }) => rest);
    ({ error } = await supabase.from('vsme_manual_disclosures').insert(minimal));
  }

  if (error) throw error;
  console.log(`  VSME manual disclosures: ${rows.length} years`);
}

async function main() {
  console.log(`\nSeeding demo data for ${CLIENT_EMAIL}...\n`);

  const { userRow, company } = await findClient();
  const companyId = company.id;
  console.log(`Company: ${company.company_name} (${companyId})`);

  await seedCompanyProfile(companyId);

  await supabase.from('users').update({
    onboarding_completed: true,
    onboarding_completed_at: new Date().toISOString(),
  }).eq('id', userRow.id);

  console.log('Clearing existing company data...');
  await clearCompanyData(companyId);

  await seedLocations(companyId);
  await seedScope12(companyId, userRow.id);
  await seedScope3(companyId, userRow.id);

  const footprints = {
    2024: await getYearFootprint(companyId, 2024),
    2025: await getYearFootprint(companyId, 2025),
    2026: await getYearFootprint(companyId, 2026),
  };

  await seedTargets(companyId, footprints);
  await seedStrategies(companyId);
  await seedVsmeManual(companyId);

  console.log(`\nDone! Yearly totals (tCO₂e):`);
  for (const [year, fp] of Object.entries(footprints)) {
    console.log(`  ${year}: ${fp.total.toFixed(2)} (S1=${fp.scope1.toFixed(2)}, S2=${fp.scope2.toFixed(2)}, S3=${fp.scope3.toFixed(2)})`);
  }
  console.log('Log in and switch years 2024 / 2025 / 2026 on the dashboard.');
  console.log('Check VSME readiness at /vsme and exports at /reports.\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
