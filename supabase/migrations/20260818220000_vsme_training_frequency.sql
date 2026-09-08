-- Replace boolean annual training with flexible frequency text

ALTER TABLE vsme_manual_disclosures
  ADD COLUMN IF NOT EXISTS health_safety_training_frequency TEXT;

UPDATE vsme_manual_disclosures
SET health_safety_training_frequency = 'годишно'
WHERE health_safety_annual_training = true
  AND (health_safety_training_frequency IS NULL OR health_safety_training_frequency = '');

COMMENT ON COLUMN vsme_manual_disclosures.health_safety_training_frequency IS
  'BZR training cadence, e.g. monthly, every 3 months, on hire.';
