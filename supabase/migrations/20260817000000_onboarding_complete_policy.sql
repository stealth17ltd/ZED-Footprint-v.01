-- Ensure onboarding columns exist (safe idempotent migration for cloud projects).

ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

COMMENT ON COLUMN users.onboarding_completed IS 'True once the user finishes the setup wizard.';
COMMENT ON COLUMN users.onboarding_completed_at IS 'Timestamp when onboarding was completed.';
