-- ================================================================
-- Scope 1 & 2 Emission Factor Rows — unit-aligned with data entry form
-- Date: 2026-04-08
-- Purpose: Ensure every Scope 1 & 2 category used in the data entry
--          form has a matching, active row in emission_factors with the
--          correct unit (matching what the form sends).
--
-- Notes on discrepancies vs initial seed
-- ───────────────────────────────────────
-- • natural_gas seed row is in kg CO2e per kWh but form sends m³
--   → new subcategory 'natural_gas_m3' at 2.02 kg CO2e/m³ (DEFRA 2024)
-- • heating_oil was never seeded
--   → adding 3.18 kg CO2e/litre (DEFRA 2024 UK/EU)
-- • electricity seed 0.48 — kept as-is (more accurate than hardcoded 0.505)
-- • vehicles_lpg seed 1.51 vs hardcoded 1.67 — use 1.51 (EU ETS, 2024)
-- ================================================================

-- ── Vehicles (Scope 1) ────────────────────────────────────────────────────
INSERT INTO emission_factors
  (category, subcategory, region, value, unit, source, source_name, source_year,
   geography, scope, method_tier, factor_version, effective_date, valid_from, is_active)
VALUES
  -- diesel — matches hardcoded 2.68 (already seeded, update value to be explicit)
  ('fuel', 'diesel', 'Bulgaria', 2.68, 'kg CO2e per litre', 'DEFRA', 'DEFRA 2024', 2024,
   'Bulgaria', 1, 'B', '2.0', '2024-01-01', '2024-01-01', true),

  -- petrol — matches hardcoded 2.31
  ('fuel', 'petrol', 'Bulgaria', 2.31, 'kg CO2e per litre', 'DEFRA', 'DEFRA 2024', 2024,
   'Bulgaria', 1, 'B', '2.0', '2024-01-01', '2024-01-01', true),

  -- LPG vehicles — EU ETS 2024 (1.51 litre, previously seeded)
  ('fuel', 'lpg', 'Bulgaria', 1.51, 'kg CO2e per litre', 'EU ETS', 'EU ETS 2024', 2024,
   'Bulgaria', 1, 'B', '2.0', '2024-01-01', '2024-01-01', true),

  -- natural gas in m³ (NEW — form sends m³, NOT kWh)
  ('fuel', 'natural_gas_m3', 'Bulgaria', 2.02, 'kg CO2e per m3', 'DEFRA', 'DEFRA 2024', 2024,
   'Bulgaria', 1, 'B', '2.0', '2024-01-01', '2024-01-01', true),

  -- heating oil — litre (NEW — was never seeded)
  ('fuel', 'heating_oil', 'Bulgaria', 3.18, 'kg CO2e per litre', 'DEFRA', 'DEFRA 2024', 2024,
   'Bulgaria', 1, 'B', '2.0', '2024-01-01', '2024-01-01', true),

  -- coal — kg
  ('fuel', 'coal', 'Bulgaria', 2.42, 'kg CO2e per kg', 'EU ETS', 'EU ETS 2024', 2024,
   'Bulgaria', 1, 'B', '2.0', '2024-01-01', '2024-01-01', true)

ON CONFLICT DO NOTHING;

-- ── Refrigerants — GWP multipliers (Scope 1) ─────────────────────────────
-- The form sends kilograms of refrigerant leaked.
-- Formula: CO2e = kg_refrigerant × GWP
-- So value = GWP (e.g. 1430 for R-134a).
INSERT INTO emission_factors
  (category, subcategory, region, value, unit, source, source_name, source_year,
   geography, scope, method_tier, factor_version, effective_date, valid_from, is_active)
VALUES
  ('refrigerant', 'R-134a', 'Global', 1430, 'GWP100 (kg CO2e per kg)', 'IPCC', 'IPCC AR6', 2023,
   'Global', 1, 'A', '2.0', '2023-01-01', '2023-01-01', true),
  ('refrigerant', 'R-404A', 'Global', 3922, 'GWP100 (kg CO2e per kg)', 'IPCC', 'IPCC AR6', 2023,
   'Global', 1, 'A', '2.0', '2023-01-01', '2023-01-01', true)
ON CONFLICT DO NOTHING;

-- ── Electricity (Scope 2) ─────────────────────────────────────────────────
-- Bulgarian grid 2024 (Bulgarian Energy Agency + Eurostat)
INSERT INTO emission_factors
  (category, subcategory, region, value, unit, source, source_name, source_year,
   geography, scope, method_tier, factor_version, effective_date, valid_from, is_active)
VALUES
  ('electricity', 'grid_standard', 'Bulgaria', 0.478, 'kg CO2e per kWh',
   'Bulgarian Energy Agency', 'NEK 2024', 2024,
   'Bulgaria', 2, 'B', '2.0', '2024-01-01', '2024-01-01', true)
ON CONFLICT DO NOTHING;

-- ── District heating & cooling (Scope 2) ─────────────────────────────────
INSERT INTO emission_factors
  (category, subcategory, region, value, unit, source, source_name, source_year,
   geography, scope, method_tier, factor_version, effective_date, valid_from, is_active)
VALUES
  ('heating', 'district_heating', 'Bulgaria', 0.220, 'kg CO2e per kWh',
   'Bulgarian Energy Agency', 'NEK 2024', 2024,
   'Bulgaria', 2, 'B', '2.0', '2024-01-01', '2024-01-01', true),
  ('heating', 'district_cooling', 'Bulgaria', 0.185, 'kg CO2e per kWh',
   'Bulgarian Energy Agency', 'NEK 2024', 2024,
   'Bulgaria', 2, 'B', '2.0', '2024-01-01', '2024-01-01', true)
ON CONFLICT DO NOTHING;

-- Mark all 1.x (initial seed) rows as superseded
UPDATE emission_factors
SET is_active = false
WHERE factor_version = '1.0'
  AND scope IN (1, 2)
  AND category IN ('fuel', 'refrigerant', 'electricity', 'heating');

COMMENT ON TABLE emission_factors IS
  'Emission factors for Scope 1, 2, 3. 
   Scope 1&2 rows are keyed by category+subcategory and looked up at calculation time.
   The is_active flag and valid_from/valid_to control which row is used.
   v2.0 rows supersede v1.0 seed rows.';
