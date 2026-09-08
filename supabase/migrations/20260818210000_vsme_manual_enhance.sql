-- VSME manual disclosures — additional fields for health/safety & anti-corruption

ALTER TABLE vsme_manual_disclosures
  ADD COLUMN IF NOT EXISTS health_safety_responsible_person TEXT,
  ADD COLUMN IF NOT EXISTS health_safety_annual_training BOOLEAN,
  ADD COLUMN IF NOT EXISTS anti_corruption_whistleblower BOOLEAN;
