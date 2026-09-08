import type { SupabaseClient } from '@supabase/supabase-js';
import { getCompanyFootprint } from '@/lib/carbon/footprint-service';
import { fetchVsmeManualDisclosures } from './manual-disclosures';
import { evaluateVsmeReadiness } from './readiness-evaluator';
import type { VsmeReadinessSummary } from './disclosure-registry';

export interface VsmeReportBundle extends VsmeReadinessSummary {
  company: {
    company_name: string;
    registration_number?: string | null;
    industry_sector?: string | null;
    employee_count?: number | null;
    baseline_year?: number | null;
  };
  footprint: {
    scope1: number;
    scope2: number;
    scope3: number;
    total: number;
  };
  strategies: { title: string; status: string; category: string }[];
  targets: { name: string; target_value: number; target_year: number }[];
}

export async function buildVsmeReportBundle(
  supabase: SupabaseClient,
  companyId: string,
  reportingYear: number,
): Promise<VsmeReportBundle | null> {
  const { data: company } = await supabase
    .from('companies')
    .select('company_name, registration_number, industry_sector, employee_count, baseline_year')
    .eq('id', companyId)
    .single();

  if (!company) return null;

  const footprint = await getCompanyFootprint(supabase, companyId, reportingYear);
  const manual = await fetchVsmeManualDisclosures(supabase, companyId, reportingYear);

  const { count: scope12Count } = await supabase
    .from('emission_data')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .gte('reporting_period', `${reportingYear}-01-01`)
    .lte('reporting_period', `${reportingYear}-12-31`);

  const { count: scope3Count } = await supabase
    .from('calculated_emissions')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .eq('scope', 3)
    .gte('reporting_period', `${reportingYear}-01-01`)
    .lte('reporting_period', `${reportingYear}-12-31`);

  const { count: targetCount } = await supabase
    .from('emission_targets')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .eq('status', 'active');

  const { count: strategyCount } = await supabase
    .from('reduction_strategies')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .in('status', ['active', 'completed']);

  const { count: locationCount } = await supabase
    .from('locations')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .eq('is_active', true);

  const { data: strategies } = await supabase
    .from('reduction_strategies')
    .select('title, status, category')
    .eq('company_id', companyId)
    .in('status', ['active', 'completed'])
    .order('created_at', { ascending: false })
    .limit(20);

  const { data: targets } = await supabase
    .from('emission_targets')
    .select('name, target_value, target_year')
    .eq('company_id', companyId)
    .eq('status', 'active')
    .limit(20);

  const readiness = evaluateVsmeReadiness({
    reportingYear,
    company,
    footprint,
    hasScope12Data: (scope12Count ?? 0) > 0,
    hasScope3Data: (scope3Count ?? 0) > 0,
    activeTargetCount: targetCount ?? 0,
    activeStrategyCount: strategyCount ?? 0,
    locationCount: locationCount ?? 0,
    manual,
  });

  return {
    ...readiness,
    company,
    footprint,
    strategies: strategies ?? [],
    targets: targets ?? [],
  };
}
