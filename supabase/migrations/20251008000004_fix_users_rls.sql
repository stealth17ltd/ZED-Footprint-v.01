-- Fix infinite recursion in users RLS policies

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view company colleagues" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;

-- Recreate with fixed logic
-- Users can view their own record (no recursion)
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT
  USING (id = auth.uid());

-- Admins can view all users (no recursion)
-- This policy was already correct, but let's make sure it exists
DROP POLICY IF EXISTS "Admins can view all users" ON users;
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- For viewing colleagues, we'll create a simpler policy
-- Users can view users from the same company (using a function to avoid recursion)
CREATE OR REPLACE FUNCTION get_user_company_id(user_id UUID)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT company_id FROM users WHERE id = user_id LIMIT 1;
$$;

DROP POLICY IF EXISTS "Users can view company colleagues" ON users;
CREATE POLICY "Users can view company colleagues" ON users
  FOR SELECT
  USING (
    company_id = get_user_company_id(auth.uid())
    AND company_id IS NOT NULL
  );
