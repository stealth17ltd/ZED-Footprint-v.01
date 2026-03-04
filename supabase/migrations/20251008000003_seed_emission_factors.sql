-- Seed Bulgarian emission factors (based on PRD Appendix B)
-- Note: These are illustrative - actual values should come from official Bulgarian/EU sources

-- Fuels (Scope 1)
INSERT INTO emission_factors (category, subcategory, region, value, unit, source, effective_date)
VALUES
  ('fuel', 'petrol', 'Bulgaria', 2.31, 'kg CO2e per liter', 'EU ETS', '2025-01-01'),
  ('fuel', 'diesel', 'Bulgaria', 2.68, 'kg CO2e per liter', 'EU ETS', '2025-01-01'),
  ('fuel', 'natural_gas', 'Bulgaria', 0.185, 'kg CO2e per kWh', 'EU ETS', '2025-01-01'),
  ('fuel', 'lpg', 'Bulgaria', 1.51, 'kg CO2e per liter', 'EU ETS', '2025-01-01'),
  ('fuel', 'coal', 'Bulgaria', 2.42, 'kg CO2e per kg', 'EU ETS', '2025-01-01');

-- Electricity (Scope 2)
INSERT INTO emission_factors (category, subcategory, region, value, unit, source, effective_date)
VALUES
  ('electricity', 'grid_standard', 'Bulgaria', 0.48, 'kg CO2e per kWh', 'Bulgarian Energy Authority', '2025-01-01'),
  ('electricity', 'renewable', 'Bulgaria', 0.02, 'kg CO2e per kWh', 'Bulgarian Energy Authority', '2025-01-01');

-- District heating/cooling (Scope 2)
INSERT INTO emission_factors (category, subcategory, region, value, unit, source, effective_date)
VALUES
  ('heating', 'district_heating', 'Bulgaria', 0.25, 'kg CO2e per kWh', 'Bulgarian Energy Authority', '2025-01-01'),
  ('heating', 'district_cooling', 'Bulgaria', 0.18, 'kg CO2e per kWh', 'Bulgarian Energy Authority', '2025-01-01');

-- Refrigerants (Scope 1) - GWP values
INSERT INTO emission_factors (category, subcategory, region, value, unit, source, effective_date)
VALUES
  ('refrigerant', 'R-410A', 'Global', 2088, 'GWP factor', 'IPCC AR5', '2025-01-01'),
  ('refrigerant', 'R-32', 'Global', 675, 'GWP factor', 'IPCC AR5', '2025-01-01'),
  ('refrigerant', 'R-134a', 'Global', 1430, 'GWP factor', 'IPCC AR5', '2025-01-01'),
  ('refrigerant', 'R-404A', 'Global', 3922, 'GWP factor', 'IPCC AR5', '2025-01-01');
