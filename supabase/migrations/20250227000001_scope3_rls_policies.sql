-- =====================================================
-- SCOPE 3 ROW LEVEL SECURITY POLICIES
-- Date: 2025-02-27
-- Purpose: RLS policies for Scope 3 tables
-- =====================================================

-- =====================================================
-- HELPER FUNCTION: Check if user is admin
-- =====================================================

-- This function already exists from previous migrations, but adding here for clarity
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 1. IMPORT_BATCHES POLICIES
-- =====================================================

ALTER TABLE import_batches ENABLE ROW LEVEL SECURITY;

-- Admins can see all batches
CREATE POLICY "Admins can view all import batches"
  ON import_batches FOR SELECT
  USING (is_admin());

-- Users can view their company's batches
CREATE POLICY "Users can view own company import batches"
  ON import_batches FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- Users can create batches for their company
CREATE POLICY "Users can create import batches"
  ON import_batches FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- Users can update their company's batches (for status updates)
CREATE POLICY "Users can update own company import batches"
  ON import_batches FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- =====================================================
-- 2. TRANSACTIONS POLICIES
-- =====================================================

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Admins can see all transactions
CREATE POLICY "Admins can view all transactions"
  ON transactions FOR SELECT
  USING (is_admin());

-- Users can view their company's transactions
CREATE POLICY "Users can view own company transactions"
  ON transactions FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- Users can insert transactions for their company
CREATE POLICY "Users can insert transactions"
  ON transactions FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- Users can update their company's transactions
CREATE POLICY "Users can update own company transactions"
  ON transactions FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- Users can delete their company's transactions
CREATE POLICY "Users can delete own company transactions"
  ON transactions FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- =====================================================
-- 3. CLASSIFICATION_RULES POLICIES
-- =====================================================

ALTER TABLE classification_rules ENABLE ROW LEVEL SECURITY;

-- Admins can see all rules (including global templates)
CREATE POLICY "Admins can view all classification rules"
  ON classification_rules FOR SELECT
  USING (is_admin());

-- Users can view their company's rules + global rules (company_id IS NULL)
CREATE POLICY "Users can view own company and global rules"
  ON classification_rules FOR SELECT
  USING (
    company_id IS NULL OR
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- Users can create rules for their company
CREATE POLICY "Users can create classification rules"
  ON classification_rules FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- Users can update their company's rules
CREATE POLICY "Users can update own company rules"
  ON classification_rules FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- Users can delete their company's rules
CREATE POLICY "Users can delete own company rules"
  ON classification_rules FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- Admins can create global rules (company_id IS NULL)
CREATE POLICY "Admins can create global rules"
  ON classification_rules FOR INSERT
  WITH CHECK (is_admin() AND company_id IS NULL);

-- =====================================================
-- 4. TRANSACTION_CLASSIFICATIONS POLICIES
-- =====================================================

ALTER TABLE transaction_classifications ENABLE ROW LEVEL SECURITY;

-- Admins can see all classifications
CREATE POLICY "Admins can view all transaction classifications"
  ON transaction_classifications FOR SELECT
  USING (is_admin());

-- Users can view classifications for their company's transactions
CREATE POLICY "Users can view own company transaction classifications"
  ON transaction_classifications FOR SELECT
  USING (
    transaction_id IN (
      SELECT id FROM transactions WHERE company_id IN (
        SELECT company_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Users can create classifications for their company's transactions
CREATE POLICY "Users can create transaction classifications"
  ON transaction_classifications FOR INSERT
  WITH CHECK (
    transaction_id IN (
      SELECT id FROM transactions WHERE company_id IN (
        SELECT company_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Users can update classifications for their company's transactions
CREATE POLICY "Users can update transaction classifications"
  ON transaction_classifications FOR UPDATE
  USING (
    transaction_id IN (
      SELECT id FROM transactions WHERE company_id IN (
        SELECT company_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Users can delete classifications for their company's transactions
CREATE POLICY "Users can delete transaction classifications"
  ON transaction_classifications FOR DELETE
  USING (
    transaction_id IN (
      SELECT id FROM transactions WHERE company_id IN (
        SELECT company_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- =====================================================
-- 5. SCOPE3_ACTIVITY_ENTRIES POLICIES
-- =====================================================

ALTER TABLE scope3_activity_entries ENABLE ROW LEVEL SECURITY;

-- Admins can see all activity entries
CREATE POLICY "Admins can view all scope3 activity entries"
  ON scope3_activity_entries FOR SELECT
  USING (is_admin());

-- Users can view their company's activity entries
CREATE POLICY "Users can view own company scope3 activity entries"
  ON scope3_activity_entries FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- Users can insert activity entries for their company
CREATE POLICY "Users can insert scope3 activity entries"
  ON scope3_activity_entries FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- Users can update their company's activity entries
CREATE POLICY "Users can update own company scope3 activity entries"
  ON scope3_activity_entries FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- Users can delete their company's activity entries
CREATE POLICY "Users can delete own company scope3 activity entries"
  ON scope3_activity_entries FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- =====================================================
-- 6. CALCULATED_EMISSIONS POLICIES
-- =====================================================

ALTER TABLE calculated_emissions ENABLE ROW LEVEL SECURITY;

-- Admins can see all calculated emissions
CREATE POLICY "Admins can view all calculated emissions"
  ON calculated_emissions FOR SELECT
  USING (is_admin());

-- Users can view their company's calculated emissions
CREATE POLICY "Users can view own company calculated emissions"
  ON calculated_emissions FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- System can insert calculated emissions (via service role)
CREATE POLICY "System can insert calculated emissions"
  ON calculated_emissions FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- 7. EMISSION_FACTORS POLICIES (Updated)
-- =====================================================

-- Emission factors are globally readable (no company_id)
-- But only admins can modify

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view emission factors" ON emission_factors;
DROP POLICY IF EXISTS "Admins can manage emission factors" ON emission_factors;

-- All authenticated users can view emission factors
CREATE POLICY "Users can view emission factors"
  ON emission_factors FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Admins can insert emission factors
CREATE POLICY "Admins can insert emission factors"
  ON emission_factors FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- Admins can update emission factors
CREATE POLICY "Admins can update emission factors"
  ON emission_factors FOR UPDATE
  TO authenticated
  USING (is_admin());

-- Admins can delete emission factors (soft delete recommended)
CREATE POLICY "Admins can delete emission factors"
  ON emission_factors FOR DELETE
  TO authenticated
  USING (is_admin());

-- =====================================================
-- DONE
-- =====================================================
