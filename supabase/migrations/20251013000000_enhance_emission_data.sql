-- Add enhanced fields to emission_data table for more detailed tracking

ALTER TABLE emission_data
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS equipment_id TEXT,
ADD COLUMN IF NOT EXISTS supplier TEXT,
ADD COLUMN IF NOT EXISTS invoice_number TEXT,
ADD COLUMN IF NOT EXISTS measurement_method TEXT DEFAULT 'measured' CHECK (measurement_method IN ('measured', 'calculated', 'estimated')),
ADD COLUMN IF NOT EXISTS data_quality TEXT DEFAULT 'high' CHECK (data_quality IN ('high', 'medium', 'low')),
ADD COLUMN IF NOT EXISTS cost NUMERIC,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'BGN' CHECK (currency IN ('BGN', 'EUR', 'USD')),
ADD COLUMN IF NOT EXISTS responsible_person TEXT;

-- Add comments for documentation
COMMENT ON COLUMN emission_data.location IS 'Specific facility or location where the activity occurred';
COMMENT ON COLUMN emission_data.equipment_id IS 'Equipment or vehicle identification number';
COMMENT ON COLUMN emission_data.supplier IS 'Energy or fuel supplier name';
COMMENT ON COLUMN emission_data.invoice_number IS 'Invoice or reference document number for audit trail';
COMMENT ON COLUMN emission_data.measurement_method IS 'How the data was obtained: measured (from devices/invoices), calculated (from formula), or estimated';
COMMENT ON COLUMN emission_data.data_quality IS 'Quality rating: high (primary measured data), medium (secondary data), low (estimates)';
COMMENT ON COLUMN emission_data.cost IS 'Financial cost associated with the emission';
COMMENT ON COLUMN emission_data.currency IS 'Currency of the cost (BGN, EUR, USD)';
COMMENT ON COLUMN emission_data.responsible_person IS 'Person responsible for this emission source';

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_emission_data_location ON emission_data(location);
CREATE INDEX IF NOT EXISTS idx_emission_data_equipment_id ON emission_data(equipment_id);
CREATE INDEX IF NOT EXISTS idx_emission_data_supplier ON emission_data(supplier);
CREATE INDEX IF NOT EXISTS idx_emission_data_responsible_person ON emission_data(responsible_person);
CREATE INDEX IF NOT EXISTS idx_emission_data_data_quality ON emission_data(data_quality);


