-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE emission_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE emission_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Companies policies
-- Clients can view their own company
CREATE POLICY "Users can view own company" ON companies
  FOR SELECT
  USING (
    id IN (SELECT company_id FROM users WHERE id = auth.uid())
  );

-- Admins can view all companies
CREATE POLICY "Admins can view all companies" ON companies
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can insert/update companies
CREATE POLICY "Admins can manage companies" ON companies
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Users policies
-- Users can view their own record
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT
  USING (id = auth.uid());

-- Users can view colleagues in same company
CREATE POLICY "Users can view company colleagues" ON users
  FOR SELECT
  USING (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
  );

-- Admins can view all users
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can manage users
CREATE POLICY "Admins can manage users" ON users
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Locations policies
-- Users can view their company's locations
CREATE POLICY "Users can view company locations" ON locations
  FOR SELECT
  USING (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
  );

-- Users can manage their company's locations
CREATE POLICY "Users can manage company locations" ON locations
  FOR ALL
  USING (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
  );

-- Emission data policies
-- Users can view their company's emission data
CREATE POLICY "Users can view company emissions" ON emission_data
  FOR SELECT
  USING (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
  );

-- Users can insert their company's emission data
CREATE POLICY "Users can add company emissions" ON emission_data
  FOR INSERT
  WITH CHECK (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
  );

-- Users can update their company's emission data
CREATE POLICY "Users can update company emissions" ON emission_data
  FOR UPDATE
  USING (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
  );

-- Emission factors policies (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view emission factors" ON emission_factors
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Admins can manage emission factors
CREATE POLICY "Admins can manage emission factors" ON emission_factors
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Reports policies
-- Users can view their company's reports
CREATE POLICY "Users can view company reports" ON reports
  FOR SELECT
  USING (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
  );

-- Users can create reports for their company
CREATE POLICY "Users can create company reports" ON reports
  FOR INSERT
  WITH CHECK (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
  );
