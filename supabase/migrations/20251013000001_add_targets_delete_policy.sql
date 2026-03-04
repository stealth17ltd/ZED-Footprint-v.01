-- Add DELETE policy for emission_targets
-- Users were unable to delete their company's targets because this policy was missing

CREATE POLICY "Users can delete own company targets" ON emission_targets
  FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

COMMENT ON POLICY "Users can delete own company targets" ON emission_targets IS 'Allows users to delete emission targets for their company';


