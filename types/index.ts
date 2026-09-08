// Core database types

export interface Company {
  id: string;
  company_name: string;
  registration_number: string;
  industry_sector: string;
  employee_count: number | null;
  location_count: number;
  primary_contact_email: string;
  billing_address: string | null;
  logo_url: string | null;
  sustainability_goals: string | null;
  eu_green_deal_commitment: boolean;
  baseline_year: number | null;
  annual_turnover_eur?: number | null;
  ets_has_installation?: boolean | null;
  ets_thermal_input_mw?: number | null;
  ets_activity_annex_i?: boolean | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  company_id: string | null;
  first_name: string;
  last_name: string;
  role: 'admin' | 'client';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  email?: string; // From auth.users
}

export interface Location {
  id: string;
  company_id: string;
  location_name: string;
  address: string | null;
  square_meters: number | null;
  employee_count: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmissionFactor {
  id: string;
  category: string;
  subcategory: string | null;
  region: string;
  value: number;
  unit: string;
  source: string | null;
  effective_date: string;
  expiry_date: string | null;
  created_at: string;
}

export interface EmissionData {
  id: string;
  company_id: string;
  location_id: string | null;
  reporting_period: string;
  scope: 1 | 2;
  category: string;
  subcategory: string | null;
  activity_value: number;
  unit: string;
  emission_factor_id: string | null;
  emission_factor_value: number;
  gwp_factor: number;
  calculated_co2e: number;
  data_source: 'manual' | 'import' | 'ocr' | 'api';
  validation_status: 'validated' | 'warning' | 'flagged';
  validation_notes: string | null;
  supporting_document_url: string | null;
  notes: string | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Report {
  id: string;
  company_id: string;
  report_type: string;
  reporting_period: string;
  generated_date: string;
  generated_by: string | null;
  format: string;
}

// Form input types
export interface EmissionDataInput {
  reporting_period: Date;
  scope: 1 | 2;
  category: string;
  subcategory?: string;
  activity_value: number;
  unit: string;
  emission_factor_id?: string;
  notes?: string;
}

export interface CompanyProfileInput {
  company_name: string;
  registration_number: string;
  industry_sector: string;
  employee_count?: number;
  primary_contact_email: string;
  billing_address?: string;
  sustainability_goals?: string;
  eu_green_deal_commitment: boolean;
  baseline_year?: number;
}

// Calculation types
export interface EmissionCalculationParams {
  activityValue: number;
  emissionFactor: number;
  gwpFactor?: number;
}

export interface ValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
}

// Dashboard types
export interface DashboardStats {
  totalEmissions: number;
  scope1Emissions: number;
  scope2Emissions: number;
  periodChange: number;
  targetProgress: number | null;
}

export interface EmissionTrend {
  month: string;
  scope1: number;
  scope2: number;
  total: number;
}

export interface CategoryBreakdown {
  category: string;
  value: number;
  percentage: number;
}

// =====================================================
// SCOPE 3 TYPES
// =====================================================

export interface ImportBatch {
  id: string;
  company_id: string;
  filename: string;
  file_hash: string | null;
  row_count: number;
  successful_count: number;
  failed_count: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_summary: Record<string, any> | null;
  imported_by: string;
  imported_at: string;
  completed_at: string | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  company_id: string;
  import_batch_id: string;
  txn_date: string;
  supplier: string;
  description: string | null;
  amount_original: number;
  currency_original: string;
  amount_base_currency: number;
  base_currency: string;
  fx_rate: number;
  expense_category_raw: string | null;
  account_code_raw: string | null;
  invoice_number: string | null;
  vat_amount: number | null;
  cost_center: string | null;
  department: string | null;
  raw_payload: Record<string, any> | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ClassificationRule {
  id: string;
  company_id: string | null;
  rule_name: string;
  priority: number;
  is_active: boolean;
  condition_type: 'contains' | 'equals' | 'regex' | 'starts_with' | 'ends_with';
  condition_field: 'supplier' | 'description' | 'expense_category' | 'account_code';
  condition_value: string;
  output_scope3_category: 1 | 4 | 5 | 6 | 7;
  output_subcategory: string | null;
  default_method: 'spend' | 'activity';
  default_factor_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  last_applied_at: string | null;
  application_count: number;
}

export interface TransactionClassification {
  id: string;
  transaction_id: string;
  scope: 3;
  scope3_category: 1 | 4 | 5 | 6 | 7;
  subcategory: string | null;
  method_tier: 'A' | 'B' | 'C' | 'D';
  factor_id: string | null;
  confidence_score: number | null;
  classified_by: 'rule' | 'user' | 'dictionary' | 'ai';
  rule_id: string | null;
  is_locked: boolean;
  notes: string | null;
  classified_at: string;
  classified_by_user: string | null;
  created_at: string;
  updated_at: string;
}

export interface Scope3ActivityEntry {
  id: string;
  company_id: string;
  reporting_period: string;
  scope3_category: 1 | 4 | 5 | 6 | 7;
  activity_type: string;
  activity_value: number;
  unit: string;
  emission_factor_id: string | null;
  emission_factor_value: number;
  method_tier: 'A' | 'B' | 'C' | 'D';
  calculated_co2e: number;
  notes: string | null;
  data_source: string;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

export interface CalculatedEmission {
  id: string;
  company_id: string;
  source_type: 'transaction' | 'activity' | 'scope1_2';
  source_id: string;
  reporting_period: string;
  scope: 1 | 2 | 3;
  scope_category: number | null;
  co2e_kg: number;
  factor_id: string | null;
  factor_version: string | null;
  method_tier: 'A' | 'B' | 'C' | 'D' | null;
  calculation_trace: Record<string, any> | null;
  calculated_at: string;
  created_at: string;
}

// Scope 3 Input Types
export interface TransactionImportInput {
  txn_date: Date | string;
  supplier: string;
  description?: string;
  amount: number;
  currency: string;
  expense_category?: string;
  account_code?: string;
  invoice_number?: string;
  vat_amount?: number;
  cost_center?: string;
  department?: string;
}

export interface CSVColumnMapping {
  txn_date: string;
  supplier: string;
  amount: string;
  currency: string;
  description?: string;
  expense_category?: string;
  account_code?: string;
  invoice_number?: string;
  vat_amount?: string;
  cost_center?: string;
  department?: string;
}

export interface ImportValidationError {
  row: number;
  field: string;
  error: string;
  value: any;
}

export interface ImportPreview {
  valid_rows: TransactionImportInput[];
  invalid_rows: ImportValidationError[];
  total_rows: number;
  valid_count: number;
  invalid_count: number;
}

export interface ClassificationRuleInput {
  rule_name: string;
  priority: number;
  condition_type: 'contains' | 'equals' | 'regex' | 'starts_with' | 'ends_with';
  condition_field: 'supplier' | 'description' | 'expense_category' | 'account_code';
  condition_value: string;
  output_scope3_category: 1 | 4 | 5 | 6 | 7;
  output_subcategory?: string;
  default_method: 'spend' | 'activity';
  default_factor_id?: string;
}

export interface Scope3Category {
  id: 1 | 4 | 5 | 6 | 7;
  name: string;
  description: string;
  icon: string;
}

// Extended Dashboard Stats for Scope 3
export interface DashboardStatsWithScope3 extends DashboardStats {
  scope3Emissions: number;
  totalEmissionsWithScope3: number;
}

export interface Scope3Breakdown {
  category: number;
  categoryName: string;
  value: number;
  percentage: number;
  methodTier: 'A' | 'B' | 'C' | 'D';
}
