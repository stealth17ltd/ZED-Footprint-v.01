-- Calculation snapshots — immutable audit trail for Scope 1+2 emissions
-- Stores factor values at calculation time so historical CO2e remains reproducible
-- even if emission_factors rows are updated later.

CREATE TABLE IF NOT EXISTS calculation_snapshots (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id              UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  emission_id             UUID NOT NULL REFERENCES emission_data(id) ON DELETE CASCADE,
  scope                   INTEGER NOT NULL CHECK (scope IN (1, 2)),
  category                TEXT NOT NULL,
  location_id             UUID REFERENCES locations(id) ON DELETE SET NULL,

  -- Factor snapshot (values frozen at calculation time)
  factor_db_id            UUID REFERENCES emission_factors(id) ON DELETE SET NULL,
  factor_value            NUMERIC NOT NULL,
  gwp_factor              NUMERIC NOT NULL DEFAULT 1,
  effective_factor        NUMERIC NOT NULL,
  factor_unit             TEXT NOT NULL DEFAULT 'kgCO2e',
  factor_source_name      TEXT,
  factor_source_year      INTEGER,
  factor_source_type      TEXT NOT NULL DEFAULT 'database'
    CHECK (factor_source_type IN ('database', 'fallback')),

  -- Activity snapshot
  activity_value          NUMERIC NOT NULL,
  activity_unit           TEXT NOT NULL,

  -- Result
  co2e_kg                 NUMERIC NOT NULL,
  co2e_tons               NUMERIC NOT NULL,
  calculation_expression  TEXT NOT NULL,
  methodology_version   TEXT NOT NULL DEFAULT 'GHG-Scope12-v1',
  data_quality            TEXT,
  measurement_method      TEXT,
  data_source             TEXT,

  -- Version chain (each recalc supersedes prior snapshot)
  calculation_version     INTEGER NOT NULL DEFAULT 1,
  is_current              BOOLEAN NOT NULL DEFAULT true,
  supersedes_snapshot_id  UUID REFERENCES calculation_snapshots(id) ON DELETE SET NULL,

  calculated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  calculated_by           UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calc_snapshots_emission
  ON calculation_snapshots(emission_id);

CREATE INDEX IF NOT EXISTS idx_calc_snapshots_company
  ON calculation_snapshots(company_id);

CREATE INDEX IF NOT EXISTS idx_calc_snapshots_current
  ON calculation_snapshots(emission_id, is_current)
  WHERE is_current = true;

CREATE UNIQUE INDEX IF NOT EXISTS idx_calc_snapshots_one_current
  ON calculation_snapshots(emission_id)
  WHERE is_current = true;

ALTER TABLE calculation_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view company calculation snapshots" ON calculation_snapshots
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

COMMENT ON TABLE calculation_snapshots IS
  'Immutable calculation audit trail — factor values snapshotted at compute time';
