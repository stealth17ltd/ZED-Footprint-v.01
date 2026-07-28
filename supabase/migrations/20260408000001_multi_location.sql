-- ================================================================
-- Multi-Location Support
-- Date: 2026-04-08
-- Purpose: Lift the single-location restriction and allow companies
--          to track emissions per site/branch/warehouse etc.
-- ================================================================

-- 1. Remove the one-location-per-company constraint
ALTER TABLE locations DROP CONSTRAINT IF EXISTS locations_company_id_key;

-- 2. Add missing columns used by the UI
ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS location_type TEXT DEFAULT 'office'
    CHECK (location_type IN ('office', 'warehouse', 'factory', 'retail', 'data_center', 'other')),
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Bulgaria',
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false;

-- 3. Mark first existing location per company as primary
UPDATE locations l
SET is_primary = true
WHERE id = (
  SELECT id FROM locations l2
  WHERE l2.company_id = l.company_id
  ORDER BY created_at ASC
  LIMIT 1
);

-- 4. Emit_data location_id column already exists (initial schema)
-- Add index for faster location-based queries
CREATE INDEX IF NOT EXISTS idx_emission_data_location_id
  ON emission_data(location_id);

-- 5. Location stats view (convenience — optional)
-- Not created as a VIEW to avoid RLS complications; query handled in API.

COMMENT ON TABLE locations IS
  'Company locations / sites. Multiple locations allowed per company after 2026-04-08 migration.';
COMMENT ON COLUMN locations.is_primary IS
  'One primary location per company used as default in data entry forms.';
COMMENT ON COLUMN locations.location_type IS
  'Functional type of the location for categorisation.';
