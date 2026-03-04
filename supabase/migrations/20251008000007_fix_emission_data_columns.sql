-- Add emission_factor column (simplified from emission_factor_value)
-- This makes the API cleaner and matches the PRD
ALTER TABLE emission_data ADD COLUMN IF NOT EXISTS emission_factor NUMERIC;

-- Update existing data if any
UPDATE emission_data SET emission_factor = emission_factor_value WHERE emission_factor IS NULL;

-- The emission_factor_value column can coexist for now
-- Future: we can deprecate emission_factor_value and use just emission_factor


