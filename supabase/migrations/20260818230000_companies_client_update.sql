-- Allow client users to update their own company profile (not just admins)

CREATE POLICY "Clients can update own company" ON companies
  FOR UPDATE
  USING (
    id IN (SELECT company_id FROM users WHERE id = auth.uid())
  )
  WITH CHECK (
    id IN (SELECT company_id FROM users WHERE id = auth.uid())
  );

COMMENT ON POLICY "Clients can update own company" ON companies IS
  'Client users can edit their company master data from settings/profile.';
