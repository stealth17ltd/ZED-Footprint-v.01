-- Add CSRD-specific fields to companies table
ALTER TABLE companies ADD COLUMN IF NOT EXISTS 
  annual_turnover NUMERIC;

ALTER TABLE companies ADD COLUMN IF NOT EXISTS 
  total_assets NUMERIC;

ALTER TABLE companies ADD COLUMN IF NOT EXISTS 
  parent_company TEXT;

ALTER TABLE companies ADD COLUMN IF NOT EXISTS 
  company_type TEXT CHECK (company_type IN ('public', 'private', 'other'));

ALTER TABLE companies ADD COLUMN IF NOT EXISTS 
  fiscal_year_end TEXT DEFAULT '12-31'; -- MM-DD format

ALTER TABLE companies ADD COLUMN IF NOT EXISTS 
  reporting_boundary TEXT; -- Description of what's included in reporting

ALTER TABLE companies ADD COLUMN IF NOT EXISTS 
  methodology_statement TEXT; -- How emissions are calculated

ALTER TABLE companies ADD COLUMN IF NOT EXISTS 
  data_quality_assessment TEXT; -- Assessment of data quality and limitations

ALTER TABLE companies ADD COLUMN IF NOT EXISTS 
  governance_structure TEXT; -- Climate governance and responsibility

ALTER TABLE companies ADD COLUMN IF NOT EXISTS 
  climate_policy TEXT; -- Company's climate policy statement

ALTER TABLE companies ADD COLUMN IF NOT EXISTS 
  external_verification BOOLEAN DEFAULT false;

ALTER TABLE companies ADD COLUMN IF NOT EXISTS 
  verification_body TEXT; -- Name of verification/audit body

ALTER TABLE companies ADD COLUMN IF NOT EXISTS 
  verification_date DATE;

-- Add comments
COMMENT ON COLUMN companies.annual_turnover IS 'Annual revenue in EUR for CSRD reporting';
COMMENT ON COLUMN companies.reporting_boundary IS 'Description of organizational and operational boundaries';
COMMENT ON COLUMN companies.methodology_statement IS 'Explanation of emission calculation methodology';
COMMENT ON COLUMN companies.data_quality_assessment IS 'Assessment of data quality, completeness, and limitations';
COMMENT ON COLUMN companies.governance_structure IS 'Description of climate governance and board oversight';
COMMENT ON COLUMN companies.climate_policy IS 'Company climate policy and commitments';


