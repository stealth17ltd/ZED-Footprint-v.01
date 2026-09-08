import type { SupabaseClient } from '@supabase/supabase-js';

export interface EvidenceCoverage {
  scope12Entries: number;
  scope12WithEvidence: number;
  coveragePercent: number;
}

/**
 * Share of Scope 1+2 emission_data rows in a year that have ≥1 evidence document.
 */
export async function getEvidenceCoverage(
  supabase: SupabaseClient,
  companyId: string,
  year: number,
): Promise<EvidenceCoverage> {
  const { data: entries, error: entriesErr } = await supabase
    .from('emission_data')
    .select('id')
    .eq('company_id', companyId)
    .gte('reporting_period', `${year}-01-01`)
    .lte('reporting_period', `${year}-12-31`);

  if (entriesErr) throw entriesErr;

  const entryIds = (entries ?? []).map((e) => e.id);
  if (entryIds.length === 0) {
    return { scope12Entries: 0, scope12WithEvidence: 0, coveragePercent: 0 };
  }

  const { data: evidence, error: evErr } = await supabase
    .from('evidence_documents')
    .select('emission_id')
    .eq('company_id', companyId)
    .in('emission_id', entryIds);

  if (evErr) {
    // Table may not exist before migration — treat as zero coverage
    if (evErr.code === '42P01') {
      return {
        scope12Entries: entryIds.length,
        scope12WithEvidence: 0,
        coveragePercent: 0,
      };
    }
    throw evErr;
  }

  const withEvidence = new Set(
    (evidence ?? []).map((e) => e.emission_id).filter(Boolean),
  ).size;

  return {
    scope12Entries: entryIds.length,
    scope12WithEvidence: withEvidence,
    coveragePercent: Math.round((withEvidence / entryIds.length) * 100),
  };
}
