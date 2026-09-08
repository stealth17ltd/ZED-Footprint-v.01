import type { SupabaseClient } from '@supabase/supabase-js';
import type { VsmeManualDisclosures } from './disclosure-registry';

export async function fetchVsmeManualDisclosures(
  supabase: SupabaseClient,
  companyId: string,
  reportingYear: number,
): Promise<VsmeManualDisclosures | null> {
  const { data } = await supabase
    .from('vsme_manual_disclosures')
    .select('health_safety_has_policy, health_safety_description, health_safety_incidents, health_safety_responsible_person, health_safety_training_frequency, anti_corruption_has_policy, anti_corruption_description, anti_corruption_whistleblower')
    .eq('company_id', companyId)
    .eq('reporting_year', reportingYear)
    .maybeSingle();

  if (!data) return null;

  return {
    health_safety_has_policy: data.health_safety_has_policy,
    health_safety_description: data.health_safety_description,
    health_safety_incidents: data.health_safety_incidents,
    health_safety_responsible_person: data.health_safety_responsible_person,
    health_safety_training_frequency: data.health_safety_training_frequency,
    anti_corruption_has_policy: data.anti_corruption_has_policy,
    anti_corruption_description: data.anti_corruption_description,
    anti_corruption_whistleblower: data.anti_corruption_whistleblower,
  };
}
