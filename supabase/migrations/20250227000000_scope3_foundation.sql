-- =====================================================
-- SCOPE 3 FOUNDATION MIGRATION
-- Date: 2025-02-27
-- Purpose: Add Scope 3 transaction-based carbon accounting
-- =====================================================

-- =====================================================
-- 1. EXTEND EMISSION_FACTORS TABLE (Add versioning)
-- =====================================================

-- Add versioning and metadata fields to emission_factors
ALTER TABLE emission_factors
  ADD COLUMN IF NOT EXISTS factor_version TEXT DEFAULT '1.0',
  ADD COLUMN IF NOT EXISTS source_name TEXT,
  ADD COLUMN IF NOT EXISTS source_year INTEGER,
  ADD COLUMN IF NOT EXISTS geography TEXT DEFAULT 'Bulgaria',
  ADD COLUMN IF NOT EXISTS scope INTEGER CHECK (scope IN (1, 2, 3)),
  ADD COLUMN IF NOT EXISTS scope3_category INTEGER CHECK (scope3_category IN (1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15)),
  ADD COLUMN IF NOT EXISTS method_tier TEXT CHECK (method_tier IN ('A', 'B', 'C', 'D')),
  ADD COLUMN IF NOT EXISTS valid_from DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS valid_to DATE,
  ADD COLUMN IF NOT EXISTS uncertainty_rating TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Update existing factors to have scope values
UPDATE emission_factors 
SET scope = 1 
WHERE category IN ('fuel', 'refrigerant');

UPDATE emission_factors 
SET scope = 2 
WHERE category IN ('electricity', 'heating');

-- Create index for faster factor lookups
CREATE INDEX IF NOT EXISTS idx_emission_factors_scope ON emission_factors(scope);
CREATE INDEX IF NOT EXISTS idx_emission_factors_scope3_category ON emission_factors(scope3_category);
CREATE INDEX IF NOT EXISTS idx_emission_factors_active ON emission_factors(is_active);
CREATE INDEX IF NOT EXISTS idx_emission_factors_valid_dates ON emission_factors(valid_from, valid_to);

-- Add trigger for emission_factors updates
CREATE TRIGGER update_emission_factors_updated_at BEFORE UPDATE ON emission_factors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 2. IMPORT_BATCHES TABLE
-- =====================================================

CREATE TABLE import_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  filename TEXT NOT NULL,
  file_hash TEXT,
  row_count INTEGER NOT NULL DEFAULT 0,
  successful_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  error_summary JSONB,
  imported_by UUID REFERENCES users(id) NOT NULL,
  imported_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_import_batches_company_id ON import_batches(company_id);
CREATE INDEX idx_import_batches_imported_by ON import_batches(imported_by);
CREATE INDEX idx_import_batches_status ON import_batches(status);

COMMENT ON TABLE import_batches IS 'Tracks CSV import batches for transaction data';

-- =====================================================
-- 3. TRANSACTIONS TABLE
-- =====================================================

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  import_batch_id UUID REFERENCES import_batches(id) ON DELETE CASCADE NOT NULL,
  
  -- Transaction details
  txn_date DATE NOT NULL,
  supplier TEXT NOT NULL,
  description TEXT,
  
  -- Financial data
  amount_original NUMERIC NOT NULL CHECK (amount_original >= 0),
  currency_original TEXT NOT NULL DEFAULT 'BGN',
  amount_base_currency NUMERIC NOT NULL CHECK (amount_base_currency >= 0),
  base_currency TEXT NOT NULL DEFAULT 'BGN',
  fx_rate NUMERIC DEFAULT 1.0,
  
  -- Optional categorization from source system
  expense_category_raw TEXT,
  account_code_raw TEXT,
  invoice_number TEXT,
  vat_amount NUMERIC,
  cost_center TEXT,
  department TEXT,
  
  -- Store original row as JSON for audit
  raw_payload JSONB,
  
  -- Metadata
  created_by UUID REFERENCES users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_transactions_company_id ON transactions(company_id);
CREATE INDEX idx_transactions_import_batch_id ON transactions(import_batch_id);
CREATE INDEX idx_transactions_txn_date ON transactions(txn_date);
CREATE INDEX idx_transactions_supplier ON transactions(supplier);
CREATE INDEX idx_transactions_amount ON transactions(amount_base_currency);
CREATE INDEX idx_transactions_invoice_number ON transactions(invoice_number);

-- Unique constraint to prevent duplicates
CREATE UNIQUE INDEX idx_transactions_unique 
  ON transactions(company_id, invoice_number, txn_date, supplier, amount_original) 
  WHERE invoice_number IS NOT NULL;

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE transactions IS 'Financial transactions for Scope 3 calculations';

-- =====================================================
-- 4. CLASSIFICATION_RULES TABLE
-- =====================================================

CREATE TABLE classification_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Rule metadata
  rule_name TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  -- Condition
  condition_type TEXT NOT NULL CHECK (condition_type IN ('contains', 'equals', 'regex', 'starts_with', 'ends_with')),
  condition_field TEXT NOT NULL CHECK (condition_field IN ('supplier', 'description', 'expense_category', 'account_code')),
  condition_value TEXT NOT NULL,
  
  -- Output classification
  output_scope3_category INTEGER NOT NULL CHECK (output_scope3_category IN (1, 4, 5, 6, 7)),
  output_subcategory TEXT,
  default_method TEXT CHECK (default_method IN ('spend', 'activity')) DEFAULT 'spend',
  default_factor_id UUID REFERENCES emission_factors(id),
  
  -- Metadata
  created_by UUID REFERENCES users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_applied_at TIMESTAMPTZ,
  application_count INTEGER DEFAULT 0
);

-- Index for rule application
CREATE INDEX idx_classification_rules_company_id ON classification_rules(company_id);
CREATE INDEX idx_classification_rules_priority ON classification_rules(priority);
CREATE INDEX idx_classification_rules_active ON classification_rules(is_active);
CREATE INDEX idx_classification_rules_condition_field ON classification_rules(condition_field);

CREATE TRIGGER update_classification_rules_updated_at BEFORE UPDATE ON classification_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE classification_rules IS 'Auto-classification rules for transactions → Scope 3 categories';

-- =====================================================
-- 5. TRANSACTION_CLASSIFICATIONS TABLE
-- =====================================================

CREATE TABLE transaction_classifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Classification
  scope INTEGER NOT NULL DEFAULT 3 CHECK (scope = 3),
  scope3_category INTEGER NOT NULL CHECK (scope3_category IN (1, 4, 5, 6, 7)),
  subcategory TEXT,
  
  -- Method & factor
  method_tier TEXT NOT NULL CHECK (method_tier IN ('A', 'B', 'C', 'D')) DEFAULT 'C',
  factor_id UUID REFERENCES emission_factors(id),
  
  -- Confidence & source
  confidence_score NUMERIC CHECK (confidence_score >= 0 AND confidence_score <= 1),
  classified_by TEXT NOT NULL CHECK (classified_by IN ('rule', 'user', 'dictionary', 'ai')) DEFAULT 'user',
  rule_id UUID REFERENCES classification_rules(id),
  
  -- Lock classification to prevent re-classification
  is_locked BOOLEAN DEFAULT false,
  notes TEXT,
  
  -- Metadata
  classified_at TIMESTAMPTZ DEFAULT NOW(),
  classified_by_user UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_transaction_classifications_transaction_id ON transaction_classifications(transaction_id);
CREATE INDEX idx_transaction_classifications_scope3_category ON transaction_classifications(scope3_category);
CREATE INDEX idx_transaction_classifications_method_tier ON transaction_classifications(method_tier);
CREATE INDEX idx_transaction_classifications_confidence ON transaction_classifications(confidence_score);
CREATE INDEX idx_transaction_classifications_locked ON transaction_classifications(is_locked);

CREATE TRIGGER update_transaction_classifications_updated_at BEFORE UPDATE ON transaction_classifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE transaction_classifications IS 'Final classification mapping for each transaction';

-- =====================================================
-- 6. SCOPE3_ACTIVITY_ENTRIES TABLE
-- =====================================================

CREATE TABLE scope3_activity_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  
  -- Period
  reporting_period DATE NOT NULL,
  
  -- Category
  scope3_category INTEGER NOT NULL CHECK (scope3_category IN (1, 4, 5, 6, 7)),
  activity_type TEXT NOT NULL,
  
  -- Activity data
  activity_value NUMERIC NOT NULL CHECK (activity_value >= 0),
  unit TEXT NOT NULL,
  
  -- Calculation
  emission_factor_id UUID REFERENCES emission_factors(id),
  emission_factor_value NUMERIC NOT NULL,
  method_tier TEXT NOT NULL CHECK (method_tier IN ('A', 'B', 'C', 'D')) DEFAULT 'B',
  calculated_co2e NUMERIC NOT NULL,
  
  -- Metadata
  notes TEXT,
  data_source TEXT DEFAULT 'survey',
  uploaded_by UUID REFERENCES users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_scope3_activity_entries_company_id ON scope3_activity_entries(company_id);
CREATE INDEX idx_scope3_activity_entries_period ON scope3_activity_entries(reporting_period);
CREATE INDEX idx_scope3_activity_entries_category ON scope3_activity_entries(scope3_category);

CREATE TRIGGER update_scope3_activity_entries_updated_at BEFORE UPDATE ON scope3_activity_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE scope3_activity_entries IS 'Activity-based Scope 3 data from surveys (travel, commuting, etc.)';

-- =====================================================
-- 7. CALCULATED_EMISSIONS TABLE
-- =====================================================

CREATE TABLE calculated_emissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  
  -- Source
  source_type TEXT NOT NULL CHECK (source_type IN ('transaction', 'activity', 'scope1_2')),
  source_id UUID NOT NULL,
  
  -- Period
  reporting_period DATE NOT NULL,
  
  -- Scope
  scope INTEGER NOT NULL CHECK (scope IN (1, 2, 3)),
  scope_category INTEGER,
  
  -- Calculation
  co2e_kg NUMERIC NOT NULL,
  factor_id UUID REFERENCES emission_factors(id),
  factor_version TEXT,
  method_tier TEXT CHECK (method_tier IN ('A', 'B', 'C', 'D')),
  
  -- Store calculation trace for "show my math"
  calculation_trace JSONB,
  
  -- Metadata
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_calculated_emissions_company_id ON calculated_emissions(company_id);
CREATE INDEX idx_calculated_emissions_period ON calculated_emissions(reporting_period);
CREATE INDEX idx_calculated_emissions_scope ON calculated_emissions(scope);
CREATE INDEX idx_calculated_emissions_source ON calculated_emissions(source_type, source_id);

COMMENT ON TABLE calculated_emissions IS 'Materialized emission calculations with audit trail';

-- =====================================================
-- 8. UPDATE REPORTS TABLE
-- =====================================================

-- Add fields for Scope 3 reporting
ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS scopes_included INTEGER[] DEFAULT ARRAY[1, 2],
  ADD COLUMN IF NOT EXISTS scope3_categories_included INTEGER[],
  ADD COLUMN IF NOT EXISTS factor_versions_used JSONB,
  ADD COLUMN IF NOT EXISTS calculation_methodology TEXT,
  ADD COLUMN IF NOT EXISTS data_quality_grade TEXT,
  ADD COLUMN IF NOT EXISTS file_url TEXT,
  ADD COLUMN IF NOT EXISTS audit_export_url TEXT;

COMMENT ON COLUMN reports.factor_versions_used IS 'Locked factor versions for reproducibility';

-- =====================================================
-- 9. UPDATE EMISSION_DATA TABLE (Extend to Scope 3)
-- =====================================================

-- Allow Scope 3 in emission_data for unified querying
ALTER TABLE emission_data
  DROP CONSTRAINT IF EXISTS emission_data_scope_check;

ALTER TABLE emission_data
  ADD CONSTRAINT emission_data_scope_check CHECK (scope IN (1, 2, 3));

-- Add method tier to emission_data
ALTER TABLE emission_data
  ADD COLUMN IF NOT EXISTS method_tier TEXT CHECK (method_tier IN ('A', 'B', 'C', 'D')) DEFAULT 'B';

-- =====================================================
-- DONE
-- =====================================================
