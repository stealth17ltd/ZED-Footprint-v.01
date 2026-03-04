-- Seed Global Classification Rules for Bulgarian Suppliers
-- These rules are company_id = NULL (global) and apply to all companies
-- Users can override classifications manually in the UI

-- First, make created_by nullable for global rules
ALTER TABLE classification_rules ALTER COLUMN created_by DROP NOT NULL;

-- =============================================================================
-- CATEGORY 7: EMPLOYEE COMMUTING
-- =============================================================================

-- Fuel Stations (Bulgaria)
INSERT INTO classification_rules (
  company_id,
  rule_name,
  priority,
  is_active,
  condition_type,
  condition_field,
  condition_value,
  output_scope3_category,
  output_subcategory,
  default_method,
  created_by
) VALUES
  (NULL, 'Lukoil → Employee Commuting', 15, true, 'contains', 'supplier', 'Lukoil', 7, 'fuel_commuting', 'spend', NULL),
  (NULL, 'OMV → Employee Commuting', 15, true, 'contains', 'supplier', 'OMV', 7, 'fuel_commuting', 'spend', NULL),
  (NULL, 'Shell → Employee Commuting', 15, true, 'contains', 'supplier', 'Shell', 7, 'fuel_commuting', 'spend', NULL),
  (NULL, 'Petrol → Employee Commuting', 15, true, 'contains', 'supplier', 'Petrol', 7, 'fuel_commuting', 'spend', NULL),
  (NULL, 'EKO → Employee Commuting', 15, true, 'contains', 'supplier', 'EKO', 7, 'fuel_commuting', 'spend', NULL),
  (NULL, 'Rompetrol → Employee Commuting', 15, true, 'contains', 'supplier', 'Rompetrol', 7, 'fuel_commuting', 'spend', NULL);

-- Public Transport (Sofia)
INSERT INTO classification_rules (
  company_id,
  rule_name,
  priority,
  is_active,
  condition_type,
  condition_field,
  condition_value,
  output_scope3_category,
  output_subcategory,
  default_method,
  created_by
) VALUES
  (NULL, 'Sofia Transport → Commuting', 15, true, 'contains', 'supplier', 'София', 7, 'public_transport', 'spend', NULL),
  (NULL, 'Sofia Metro → Commuting', 15, true, 'contains', 'supplier', 'Метро', 7, 'public_transport', 'spend', NULL),
  (NULL, 'Transport Card → Commuting', 15, true, 'contains', 'description', 'карта', 7, 'public_transport', 'spend', NULL);

-- =============================================================================
-- CATEGORY 6: BUSINESS TRAVEL
-- =============================================================================

-- Airlines
INSERT INTO classification_rules (
  company_id,
  rule_name,
  priority,
  is_active,
  condition_type,
  condition_field,
  condition_value,
  output_scope3_category,
  output_subcategory,
  default_method,
  created_by
) VALUES
  (NULL, 'Ryanair → Business Travel', 20, true, 'contains', 'supplier', 'Ryanair', 6, 'flights', 'spend', NULL),
  (NULL, 'Wizz Air → Business Travel', 20, true, 'contains', 'supplier', 'Wizz', 6, 'flights', 'spend', NULL),
  (NULL, 'Bulgaria Air → Business Travel', 20, true, 'contains', 'supplier', 'Bulgaria Air', 6, 'flights', 'spend', NULL),
  (NULL, 'Lufthansa → Business Travel', 20, true, 'contains', 'supplier', 'Lufthansa', 6, 'flights', 'spend', NULL),
  (NULL, 'Turkish Airlines → Business Travel', 20, true, 'contains', 'supplier', 'Turkish Airlines', 6, 'flights', 'spend', NULL),
  (NULL, 'EasyJet → Business Travel', 20, true, 'contains', 'supplier', 'EasyJet', 6, 'flights', 'spend', NULL);

-- Hotels
INSERT INTO classification_rules (
  company_id,
  rule_name,
  priority,
  is_active,
  condition_type,
  condition_field,
  condition_value,
  output_scope3_category,
  output_subcategory,
  default_method,
  created_by
) VALUES
  (NULL, 'Hotel → Business Travel', 15, true, 'contains', 'supplier', 'Hotel', 6, 'accommodation', 'spend', NULL),
  (NULL, 'Hilton → Business Travel', 20, true, 'contains', 'supplier', 'Hilton', 6, 'accommodation', 'spend', NULL),
  (NULL, 'Marriott → Business Travel', 20, true, 'contains', 'supplier', 'Marriott', 6, 'accommodation', 'spend', NULL),
  (NULL, 'Grand Hotel → Business Travel', 20, true, 'contains', 'supplier', 'Grand Hotel', 6, 'accommodation', 'spend', NULL),
  (NULL, 'Sheraton → Business Travel', 20, true, 'contains', 'supplier', 'Sheraton', 6, 'accommodation', 'spend', NULL),
  (NULL, 'Booking.com → Business Travel', 20, true, 'contains', 'supplier', 'Booking', 6, 'accommodation', 'spend', NULL);

-- Taxi / Ride Services
INSERT INTO classification_rules (
  company_id,
  rule_name,
  priority,
  is_active,
  condition_type,
  condition_field,
  condition_value,
  output_scope3_category,
  output_subcategory,
  default_method,
  created_by
) VALUES
  (NULL, 'Taxi → Business Travel', 10, true, 'contains', 'supplier', 'Taxi', 6, 'ground_transport', 'spend', NULL),
  (NULL, 'Uber → Business Travel', 15, true, 'contains', 'supplier', 'Uber', 6, 'ground_transport', 'spend', NULL),
  (NULL, 'Bolt → Business Travel', 15, true, 'contains', 'supplier', 'Bolt', 6, 'ground_transport', 'spend', NULL);

-- =============================================================================
-- CATEGORY 4: UPSTREAM TRANSPORT & DISTRIBUTION
-- =============================================================================

-- Courier / Logistics
INSERT INTO classification_rules (
  company_id,
  rule_name,
  priority,
  is_active,
  condition_type,
  condition_field,
  condition_value,
  output_scope3_category,
  output_subcategory,
  default_method,
  created_by
) VALUES
  (NULL, 'FedEx → Upstream Transport', 20, true, 'contains', 'supplier', 'FedEx', 4, 'courier', 'spend', NULL),
  (NULL, 'DHL → Upstream Transport', 20, true, 'contains', 'supplier', 'DHL', 4, 'courier', 'spend', NULL),
  (NULL, 'Speedy → Upstream Transport', 20, true, 'contains', 'supplier', 'Speedy', 4, 'courier', 'spend', NULL),
  (NULL, 'Econt → Upstream Transport', 20, true, 'contains', 'supplier', 'Econt', 4, 'courier', 'spend', NULL),
  (NULL, 'UPS → Upstream Transport', 20, true, 'contains', 'supplier', 'UPS', 4, 'courier', 'spend', NULL),
  (NULL, 'Cargo → Upstream Transport', 10, true, 'contains', 'description', 'cargo', 4, 'freight', 'spend', NULL),
  (NULL, 'Transport → Upstream Transport', 10, true, 'contains', 'supplier', 'Transport', 4, 'freight', 'spend', NULL);

-- =============================================================================
-- CATEGORY 5: WASTE GENERATED IN OPERATIONS
-- =============================================================================

-- Waste Management
INSERT INTO classification_rules (
  company_id,
  rule_name,
  priority,
  is_active,
  condition_type,
  condition_field,
  condition_value,
  output_scope3_category,
  output_subcategory,
  default_method,
  created_by
) VALUES
  (NULL, 'Waste Management → Waste', 15, true, 'contains', 'supplier', 'отпадък', 5, 'waste_disposal', 'spend', NULL),
  (NULL, 'Waste Disposal → Waste', 15, true, 'contains', 'description', 'waste', 5, 'waste_disposal', 'spend', NULL),
  (NULL, 'Recycling → Waste', 15, true, 'contains', 'description', 'recycl', 5, 'recycling', 'spend', NULL);

-- =============================================================================
-- CATEGORY 1: PURCHASED GOODS & SERVICES
-- =============================================================================

-- Utilities - Electricity & Gas
INSERT INTO classification_rules (
  company_id,
  rule_name,
  priority,
  is_active,
  condition_type,
  condition_field,
  condition_value,
  output_scope3_category,
  output_subcategory,
  default_method,
  created_by
) VALUES
  (NULL, 'EVN → Utilities', 20, true, 'contains', 'supplier', 'EVN', 1, 'utilities_electricity', 'spend', NULL),
  (NULL, 'CEZ → Utilities', 20, true, 'contains', 'supplier', 'CEZ', 1, 'utilities_electricity', 'spend', NULL),
  (NULL, 'Overgas → Utilities', 20, true, 'contains', 'supplier', 'Overgas', 1, 'utilities_gas', 'spend', NULL),
  (NULL, 'Toplofikatsiya → Utilities', 20, true, 'contains', 'supplier', 'Топлофикац', 1, 'utilities_heating', 'spend', NULL);

-- Telecommunications
INSERT INTO classification_rules (
  company_id,
  rule_name,
  priority,
  is_active,
  condition_type,
  condition_field,
  condition_value,
  output_scope3_category,
  output_subcategory,
  default_method,
  created_by
) VALUES
  (NULL, 'Vivacom → Telecom Services', 20, true, 'contains', 'supplier', 'Vivacom', 1, 'telecommunications', 'spend', NULL),
  (NULL, 'A1 → Telecom Services', 20, true, 'contains', 'supplier', 'A1', 1, 'telecommunications', 'spend', NULL),
  (NULL, 'Yettel → Telecom Services', 20, true, 'contains', 'supplier', 'Yettel', 1, 'telecommunications', 'spend', NULL),
  (NULL, 'Telenor → Telecom Services', 20, true, 'contains', 'supplier', 'Telenor', 1, 'telecommunications', 'spend', NULL);

-- Software & Cloud Services
INSERT INTO classification_rules (
  company_id,
  rule_name,
  priority,
  is_active,
  condition_type,
  condition_field,
  condition_value,
  output_scope3_category,
  output_subcategory,
  default_method,
  created_by
) VALUES
  (NULL, 'Microsoft → Software Services', 20, true, 'contains', 'supplier', 'Microsoft', 1, 'software_services', 'spend', NULL),
  (NULL, 'Amazon Web Services → Cloud', 20, true, 'contains', 'supplier', 'Amazon Web Services', 1, 'cloud_services', 'spend', NULL),
  (NULL, 'AWS → Cloud Services', 20, true, 'contains', 'supplier', 'AWS', 1, 'cloud_services', 'spend', NULL),
  (NULL, 'Google Cloud → Cloud Services', 20, true, 'contains', 'supplier', 'Google Cloud', 1, 'cloud_services', 'spend', NULL),
  (NULL, 'Azure → Cloud Services', 20, true, 'contains', 'supplier', 'Azure', 1, 'cloud_services', 'spend', NULL),
  (NULL, 'Adobe → Software Services', 20, true, 'contains', 'supplier', 'Adobe', 1, 'software_services', 'spend', NULL),
  (NULL, 'Salesforce → Software Services', 20, true, 'contains', 'supplier', 'Salesforce', 1, 'software_services', 'spend', NULL);

-- Office Supplies & Equipment
INSERT INTO classification_rules (
  company_id,
  rule_name,
  priority,
  is_active,
  condition_type,
  condition_field,
  condition_value,
  output_scope3_category,
  output_subcategory,
  default_method,
  created_by
) VALUES
  (NULL, 'Office Depot → Office Supplies', 20, true, 'contains', 'supplier', 'Office Depot', 1, 'office_supplies', 'spend', NULL),
  (NULL, 'Metro → Office Supplies', 15, true, 'contains', 'supplier', 'Metro', 1, 'office_supplies', 'spend', NULL),
  (NULL, 'Technopolis → IT Equipment', 20, true, 'contains', 'supplier', 'Technopolis', 1, 'it_equipment', 'spend', NULL),
  (NULL, 'Dell → IT Equipment', 20, true, 'contains', 'supplier', 'Dell', 1, 'it_equipment', 'spend', NULL),
  (NULL, 'HP → IT Equipment', 20, true, 'contains', 'supplier', 'HP', 1, 'it_equipment', 'spend', NULL),
  (NULL, 'Lenovo → IT Equipment', 20, true, 'contains', 'supplier', 'Lenovo', 1, 'it_equipment', 'spend', NULL);

-- Cleaning Services
INSERT INTO classification_rules (
  company_id,
  rule_name,
  priority,
  is_active,
  condition_type,
  condition_field,
  condition_value,
  output_scope3_category,
  output_subcategory,
  default_method,
  created_by
) VALUES
  (NULL, 'Cleaning Services → Purchased Services', 15, true, 'contains', 'supplier', 'Clean', 1, 'cleaning_services', 'spend', NULL),
  (NULL, 'Почистване → Purchased Services', 15, true, 'contains', 'description', 'почист', 1, 'cleaning_services', 'spend', NULL);

-- Retail & Supermarkets
INSERT INTO classification_rules (
  company_id,
  rule_name,
  priority,
  is_active,
  condition_type,
  condition_field,
  condition_value,
  output_scope3_category,
  output_subcategory,
  default_method,
  created_by
) VALUES
  (NULL, 'Kaufland → Purchased Goods', 20, true, 'contains', 'supplier', 'Kaufland', 1, 'food_beverage', 'spend', NULL),
  (NULL, 'Lidl → Purchased Goods', 20, true, 'contains', 'supplier', 'Lidl', 1, 'food_beverage', 'spend', NULL),
  (NULL, 'Billa → Purchased Goods', 20, true, 'contains', 'supplier', 'Billa', 1, 'food_beverage', 'spend', NULL),
  (NULL, 'Fantastico → Purchased Goods', 20, true, 'contains', 'supplier', 'Fantastico', 1, 'food_beverage', 'spend', NULL);

-- Catering & Restaurants
INSERT INTO classification_rules (
  company_id,
  rule_name,
  priority,
  is_active,
  condition_type,
  condition_field,
  condition_value,
  output_scope3_category,
  output_subcategory,
  default_method,
  created_by
) VALUES
  (NULL, 'Restaurant → Purchased Goods', 10, true, 'contains', 'supplier', 'Restaurant', 1, 'food_beverage', 'spend', NULL),
  (NULL, 'Catering → Purchased Goods', 10, true, 'contains', 'description', 'cater', 1, 'food_beverage', 'spend', NULL),
  (NULL, 'FOOD → Purchased Goods', 10, true, 'contains', 'supplier', 'FOOD', 1, 'food_beverage', 'spend', NULL);

-- Water Supply
INSERT INTO classification_rules (
  company_id,
  rule_name,
  priority,
  is_active,
  condition_type,
  condition_field,
  condition_value,
  output_scope3_category,
  output_subcategory,
  default_method,
  created_by
) VALUES
  (NULL, 'Sofiyska Voda → Water Supply', 20, true, 'contains', 'supplier', 'Вода', 1, 'water_supply', 'spend', NULL),
  (NULL, 'Water Supply → Water', 15, true, 'contains', 'description', 'water', 1, 'water_supply', 'spend', NULL);

-- Insurance
INSERT INTO classification_rules (
  company_id,
  rule_name,
  priority,
  is_active,
  condition_type,
  condition_field,
  condition_value,
  output_scope3_category,
  output_subcategory,
  default_method,
  created_by
) VALUES
  (NULL, 'Insurance → Professional Services', 10, true, 'contains', 'supplier', 'Insurance', 1, 'insurance', 'spend', NULL),
  (NULL, 'Застраховка → Professional Services', 10, true, 'contains', 'description', 'застрахов', 1, 'insurance', 'spend', NULL);

-- Banking & Financial Services
INSERT INTO classification_rules (
  company_id,
  rule_name,
  priority,
  is_active,
  condition_type,
  condition_field,
  condition_value,
  output_scope3_category,
  output_subcategory,
  default_method,
  created_by
) VALUES
  (NULL, 'Bank → Financial Services', 10, true, 'contains', 'supplier', 'Bank', 1, 'financial_services', 'spend', NULL),
  (NULL, 'UniCredit → Financial Services', 15, true, 'contains', 'supplier', 'UniCredit', 1, 'financial_services', 'spend', NULL),
  (NULL, 'DSK → Financial Services', 15, true, 'contains', 'supplier', 'DSK', 1, 'financial_services', 'spend', NULL);

-- =============================================================================
-- SUMMARY
-- =============================================================================
-- Total rules created: ~90 rules covering:
-- - Cat 7 (Commuting): 9 rules
-- - Cat 6 (Business Travel): 12 rules
-- - Cat 4 (Transport): 7 rules
-- - Cat 5 (Waste): 3 rules
-- - Cat 1 (Purchased Goods & Services): ~60 rules
--
-- All rules are GLOBAL (company_id = NULL) and apply to all companies
-- Users can manually override any classification in the UI
-- Priority system ensures specific matches (e.g., "Grand Hotel Sofia") 
-- take precedence over generic matches (e.g., "Hotel")
