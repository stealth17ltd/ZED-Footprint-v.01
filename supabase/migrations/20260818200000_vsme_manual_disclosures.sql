-- VSME Phase 2: manual social/governance disclosures per company and year

CREATE TABLE IF NOT EXISTS vsme_manual_disclosures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  reporting_year INTEGER NOT NULL CHECK (reporting_year >= 2000 AND reporting_year <= 2100),
  health_safety_has_policy BOOLEAN,
  health_safety_description TEXT,
  health_safety_incidents INTEGER CHECK (health_safety_incidents IS NULL OR health_safety_incidents >= 0),
  anti_corruption_has_policy BOOLEAN,
  anti_corruption_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, reporting_year)
);

CREATE INDEX IF NOT EXISTS idx_vsme_manual_company_year
  ON vsme_manual_disclosures (company_id, reporting_year);

ALTER TABLE vsme_manual_disclosures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own company vsme manual" ON vsme_manual_disclosures
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users upsert own company vsme manual" ON vsme_manual_disclosures
  FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users update own company vsme manual" ON vsme_manual_disclosures
  FOR UPDATE USING (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

COMMENT ON TABLE vsme_manual_disclosures IS
  'Manual VSME disclosures (health & safety, anti-corruption) per reporting year.';
