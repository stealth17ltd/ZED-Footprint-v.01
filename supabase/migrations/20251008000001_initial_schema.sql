-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Companies table
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL,
  registration_number TEXT UNIQUE NOT NULL,
  industry_sector TEXT NOT NULL,
  employee_count INTEGER,
  location_count INTEGER DEFAULT 1,
  primary_contact_email TEXT NOT NULL,
  billing_address TEXT,
  logo_url TEXT,
  sustainability_goals TEXT,
  eu_green_deal_commitment BOOLEAN DEFAULT false,
  baseline_year INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'client')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Locations table (simplified for MVP - one location per company)
-- Multi-location support deferred to Phase 2
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  location_name TEXT NOT NULL DEFAULT 'Основна локация',
  address TEXT,
  square_meters NUMERIC,
  employee_count INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Ensure one location per company for MVP
  UNIQUE(company_id)
);

-- Emission factors table (Bulgarian/EU data)
CREATE TABLE emission_factors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL,
  subcategory TEXT,
  region TEXT DEFAULT 'Bulgaria',
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  source TEXT,
  effective_date DATE NOT NULL,
  expiry_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Emission data table
CREATE TABLE emission_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  reporting_period DATE NOT NULL,
  scope INTEGER NOT NULL CHECK (scope IN (1, 2)),
  category TEXT NOT NULL,
  subcategory TEXT,
  activity_value NUMERIC NOT NULL CHECK (activity_value >= 0),
  unit TEXT NOT NULL,
  emission_factor_id UUID REFERENCES emission_factors(id),
  emission_factor_value NUMERIC NOT NULL,
  gwp_factor NUMERIC DEFAULT 1,
  calculated_co2e NUMERIC NOT NULL,
  data_source TEXT CHECK (data_source IN ('manual', 'import', 'ocr', 'api')) DEFAULT 'manual',
  validation_status TEXT DEFAULT 'validated' CHECK (validation_status IN ('validated', 'warning', 'flagged')),
  validation_notes TEXT,
  supporting_document_url TEXT,
  notes TEXT,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports table
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  report_type TEXT NOT NULL,
  reporting_period DATE NOT NULL,
  generated_date TIMESTAMPTZ DEFAULT NOW(),
  generated_by UUID REFERENCES users(id),
  format TEXT DEFAULT 'PDF'
);

-- Indexes for performance
CREATE INDEX idx_emission_data_company_id ON emission_data(company_id);
CREATE INDEX idx_emission_data_reporting_period ON emission_data(reporting_period);
CREATE INDEX idx_emission_data_scope ON emission_data(scope);
CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_locations_company_id ON locations(company_id);

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emission_data_updated_at BEFORE UPDATE ON emission_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
