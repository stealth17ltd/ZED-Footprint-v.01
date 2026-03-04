-- Fix RLS infinite recursion by using security definer functions

-- Drop all existing users policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can view company colleagues" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can manage users" ON users;

-- Drop the old function if it exists
DROP FUNCTION IF EXISTS get_user_company_id(UUID);

-- Create a security definer function to check if current user is admin
-- This bypasses RLS, preventing infinite recursion
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Create a security definer function to get current user's company_id
-- This bypasses RLS, preventing infinite recursion
CREATE OR REPLACE FUNCTION get_my_company_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT company_id FROM users WHERE id = auth.uid() LIMIT 1;
$$;

-- Now create the policies using these functions

-- 1. Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT
  USING (id = auth.uid());

-- 2. Admins can view all users (using the security definer function)
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT
  USING (is_admin());

-- 3. Users can view colleagues in same company
CREATE POLICY "Users can view company colleagues" ON users
  FOR SELECT
  USING (
    company_id = get_my_company_id()
    AND company_id IS NOT NULL
  );

-- 4. Admins can manage all users
CREATE POLICY "Admins can manage users" ON users
  FOR ALL
  USING (is_admin());
