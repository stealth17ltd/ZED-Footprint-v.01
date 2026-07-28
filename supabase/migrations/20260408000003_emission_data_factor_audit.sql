-- ================================================================
-- Emission Data — Factor Audit Columns
-- Date: 2026-04-08
-- Purpose: Store which emission factor row was used for each
--          calculation so auditors can trace every CO2e number
--          back to a specific versioned factor source.
-- ================================================================

ALTER TABLE emission_data
  ADD COLUMN IF NOT EXISTS factor_source_name TEXT,
  ADD COLUMN IF NOT EXISTS factor_source_year INTEGER,
  ADD COLUMN IF NOT EXISTS factor_db_id        UUID REFERENCES emission_factors(id) ON DELETE SET NULL;

COMMENT ON COLUMN emission_data.factor_source_name IS
  'Human-readable factor source, e.g. "DEFRA 2024", "Bulgarian Energy Agency".';
COMMENT ON COLUMN emission_data.factor_source_year IS
  'Publication year of the emission factor dataset used (e.g. 2024).';
COMMENT ON COLUMN emission_data.factor_db_id IS
  'FK to the emission_factors row that was active at calculation time.
   NULL for records created before this migration or when fallback values were used.';

CREATE INDEX IF NOT EXISTS idx_emission_data_factor_db_id
  ON emission_data(factor_db_id);
