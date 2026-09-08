-- Evidence documents MVP — link files to emission records for audit trail

CREATE TABLE IF NOT EXISTS evidence_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  emission_id UUID REFERENCES emission_data(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  calculation_id UUID REFERENCES calculated_emissions(id) ON DELETE SET NULL,
  storage_path TEXT NOT NULL,
  document_type TEXT NOT NULL DEFAULT 'invoice'
    CHECK (document_type IN ('invoice', 'meter_reading', 'contract', 'photo', 'spreadsheet', 'other')),
  original_filename TEXT NOT NULL,
  mime_type TEXT,
  file_size_bytes BIGINT,
  reporting_period DATE,
  supplier TEXT,
  notes TEXT,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT evidence_linked_entity CHECK (
    emission_id IS NOT NULL OR transaction_id IS NOT NULL OR calculation_id IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_evidence_documents_company ON evidence_documents(company_id);
CREATE INDEX IF NOT EXISTS idx_evidence_documents_emission ON evidence_documents(emission_id);
CREATE INDEX IF NOT EXISTS idx_evidence_documents_period ON evidence_documents(reporting_period);

ALTER TABLE evidence_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view company evidence" ON evidence_documents
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users insert company evidence" ON evidence_documents
  FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Users delete company evidence" ON evidence_documents
  FOR DELETE USING (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE TRIGGER update_evidence_documents_updated_at
  BEFORE UPDATE ON evidence_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Supabase Storage bucket (private, company-scoped paths: {company_id}/{emission_id}/...)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'evidence',
  'evidence',
  false,
  10485760,
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Company members read evidence files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'evidence'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Company members upload evidence files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'evidence'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Company members delete evidence files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'evidence'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

COMMENT ON TABLE evidence_documents IS 'Uploaded source documents linked to emission/transaction records';
