-- Onboarding tracking
-- Allows per-user completion flag so each new user gets the wizard once.
-- Future steps (OCR, supplier portal, etc.) can be added as new onboarding_version values.

ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- Existing users (already set up) should be marked as completed
UPDATE users SET onboarding_completed = TRUE, onboarding_completed_at = NOW()
WHERE onboarding_completed IS DISTINCT FROM TRUE;

COMMENT ON COLUMN users.onboarding_completed IS 'True once the user finishes the setup wizard. Reset to false when a new onboarding version is released.';
