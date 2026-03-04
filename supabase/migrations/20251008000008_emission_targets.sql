-- Create emission_targets table for tracking reduction goals
CREATE TABLE emission_targets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) NOT NULL,
  
  -- Target details
  name TEXT NOT NULL,
  description TEXT,
  target_type TEXT NOT NULL CHECK (target_type IN ('absolute', 'percentage', 'intensity')),
  
  -- Scope (null = all scopes)
  scope INTEGER CHECK (scope IN (1, 2)),
  
  -- Target values
  baseline_year INTEGER NOT NULL,
  baseline_value NUMERIC NOT NULL, -- tCO2e for absolute, percentage for reduction
  target_year INTEGER NOT NULL,
  target_value NUMERIC NOT NULL,
  
  -- Current progress
  current_value NUMERIC DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'achieved', 'missed', 'cancelled')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure target_year > baseline_year
  CONSTRAINT valid_years CHECK (target_year > baseline_year)
);

-- Create index for faster queries
CREATE INDEX idx_emission_targets_company ON emission_targets(company_id);
CREATE INDEX idx_emission_targets_status ON emission_targets(status);

-- Enable RLS
ALTER TABLE emission_targets ENABLE ROW LEVEL SECURITY;

-- Clients can only see their company's targets
CREATE POLICY "Users can view own company targets" ON emission_targets
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- Clients can create targets for their company
CREATE POLICY "Users can create own company targets" ON emission_targets
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- Clients can update their company's targets
CREATE POLICY "Users can update own company targets" ON emission_targets
  FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- Admins can do everything
CREATE POLICY "Admins can manage all targets" ON emission_targets
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Add comments
COMMENT ON TABLE emission_targets IS 'Emission reduction targets for companies';
COMMENT ON COLUMN emission_targets.target_type IS 'absolute = reduce to X tCO2e, percentage = reduce by X%, intensity = tCO2e per unit';
COMMENT ON COLUMN emission_targets.baseline_value IS 'Starting point value for the target';
COMMENT ON COLUMN emission_targets.target_value IS 'Goal value to achieve';
COMMENT ON COLUMN emission_targets.current_value IS 'Current emissions value for tracking progress';


