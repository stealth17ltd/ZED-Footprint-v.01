-- Add email column to users table for convenience
-- Email is stored in auth.users, but we duplicate it here for easier queries
ALTER TABLE users ADD COLUMN email TEXT UNIQUE NOT NULL DEFAULT '';

-- Update constraint to make email required
ALTER TABLE users ALTER COLUMN email DROP DEFAULT;


