-- Company regulatory screening fields (EU ETS questionnaire + CSRD turnover)

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS annual_turnover_eur NUMERIC,
  ADD COLUMN IF NOT EXISTS ets_has_installation BOOLEAN,
  ADD COLUMN IF NOT EXISTS ets_thermal_input_mw NUMERIC,
  ADD COLUMN IF NOT EXISTS ets_activity_annex_i BOOLEAN;

COMMENT ON COLUMN companies.annual_turnover_eur IS
  'Annual net turnover in EUR — used for CSRD mandatory scope screening.';
COMMENT ON COLUMN companies.ets_has_installation IS
  'EU ETS screening: company operates an installation covered by Directive 2003/87/EC.';
COMMENT ON COLUMN companies.ets_thermal_input_mw IS
  'EU ETS screening: total rated thermal input of combustion units (MW).';
COMMENT ON COLUMN companies.ets_activity_annex_i IS
  'EU ETS screening: installation undertakes an Annex I activity.';
