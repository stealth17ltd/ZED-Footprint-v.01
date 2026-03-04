-- Allow Scope 3 in emission_targets
-- Previously only scopes 1 and 2 were allowed. Expand to include Scope 3
-- so companies can track value-chain (Scope 3) reduction goals.

ALTER TABLE emission_targets DROP CONSTRAINT IF EXISTS emission_targets_scope_check;
ALTER TABLE emission_targets
  ADD CONSTRAINT emission_targets_scope_check CHECK (scope IN (1, 2, 3));

-- Add a notes field for methodology / SBTi alignment comments
ALTER TABLE emission_targets ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add SBTi alignment flag (auto-computed in app, stored for reporting)
ALTER TABLE emission_targets ADD COLUMN IF NOT EXISTS sbti_aligned BOOLEAN DEFAULT FALSE;
