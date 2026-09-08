import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCompanyFootprint } from '@/lib/carbon/footprint-service';
import { getEvidenceCoverage } from '@/lib/evidence/coverage';
import {
  evaluateComplianceRules,
  summarizeCompliance,
  REQUIREMENT_TYPE_LABELS,
  buildComplianceActionPlan,
} from '@/lib/reports/compliance-rules';
import { enrichComplianceRow } from '@/lib/compliance/regulation-catalog';

/**
 * GET /api/compliance/evaluate?year=2025
 * JSON preview of compliance rule engine (Phase 2).
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Неоторизиран достъп' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!userData?.company_id) {
      return NextResponse.json({ error: 'Няма свързана компания' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()));

    const { data: company } = await supabase
      .from('companies')
      .select('company_name, employee_count, industry_sector, annual_turnover_eur, ets_has_installation, ets_thermal_input_mw, ets_activity_annex_i')
      .eq('id', userData.company_id)
      .single();

    const footprint = await getCompanyFootprint(supabase, userData.company_id, year);
    const evidenceCoverage = await getEvidenceCoverage(supabase, userData.company_id, year);

    const { count: scope3Count } = await supabase
      .from('calculated_emissions')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', userData.company_id)
      .eq('scope', 3)
      .gte('reporting_period', `${year}-01-01`)
      .lte('reporting_period', `${year}-12-31`);

    const { count: targetCount } = await supabase
      .from('emission_targets')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', userData.company_id)
      .eq('status', 'active');

    const evalInput = {
      company: {
        employee_count: company?.employee_count,
        annual_turnover_eur: company?.annual_turnover_eur,
        industry_sector: company?.industry_sector,
        ets_has_installation: company?.ets_has_installation,
        ets_thermal_input_mw: company?.ets_thermal_input_mw,
        ets_activity_annex_i: company?.ets_activity_annex_i,
      },
      reportingYear: year,
      scope1Total: footprint.scope1,
      scope2Total: footprint.scope2,
      scope3Total: footprint.scope3,
      scope3Available: (scope3Count ?? 0) > 0,
      hasTargets: (targetCount ?? 0) > 0,
      evidenceCoverage,
    };

    const evaluation = evaluateComplianceRules(evalInput);
    const summary = summarizeCompliance(evaluation.rows);
    const actionPlan = buildComplianceActionPlan(evalInput);

    return NextResponse.json({
      data: {
        company: company?.company_name,
        reportingYear: year,
        csrd: evaluation.csrd,
        esrs: evaluation.esrs,
        ruleEngineVersion: evaluation.ruleEngineVersion,
        summary,
        actionPlan,
        rows: evaluation.rows.map((r) => {
          const enriched = enrichComplianceRow(r);
          return {
            ...r,
            requirementTypeLabel: REQUIREMENT_TYPE_LABELS[r.requirementType],
            catalog: enriched.catalog,
            actions: enriched.actions,
          };
        }),
      },
    });
  } catch (err) {
    console.error('compliance evaluate error:', err);
    return NextResponse.json({ error: 'Грешка при оценка на съответствието' }, { status: 500 });
  }
}
