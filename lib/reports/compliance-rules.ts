/**
 * Versioned compliance rule engine — Phase 2 (REG-P0-002 … REG-P0-006).
 * Separates law / EU regulation / voluntary standards; CSRD applicability by profile.
 */

import {
  type ComplianceStatus,
  summarizeCompliance,
  COMPLIANCE_RULE_VERSION,
} from './compliance-scoring';

export { COMPLIANCE_RULE_VERSION, summarizeCompliance };
export type { ComplianceStatus };

export type RequirementType =
  | 'law'
  | 'eu_regulation'
  | 'eu_directive'
  | 'reporting_standard'
  | 'voluntary_standard'
  | 'target_framework'
  | 'certification_standard'
  | 'guidance';

export const REQUIREMENT_TYPE_LABELS: Record<RequirementType, string> = {
  law: 'Закон',
  eu_regulation: 'ЕС регламент',
  eu_directive: 'ЕС директива',
  reporting_standard: 'Стандарт за отчетност',
  voluntary_standard: 'Доброволен стандарт',
  target_framework: 'Рамка за цели',
  certification_standard: 'Сертификация',
  guidance: 'Насоки',
};

/** CSRD scope rule — EU Council simplification, Feb 2026 reference profile. */
export const CSRD_APPLICABILITY_RULE = {
  ruleKey: 'csrd_mandatory_scope',
  ruleVersion: '2026-02-EU',
  effectiveFrom: '2026-02-01',
  employeeThreshold: 1000,
  turnoverThresholdEur: 450_000_000,
  sourceReference: 'CSRD (Directive 2022/2464) — EU scope simplification, Council agreement Feb 2026',
  lastLegalReview: '2026-08-18',
} as const;

export const ESRS_STANDARD_METADATA = {
  standardCode: 'ESRS_E1',
  standardVersion: '2026-07-revised',
  effectiveFrom: '2026-07-03',
  reportingYearFrom: 2026,
  sourceReference: 'Commission adoption of revised ESRS, 3 July 2026',
  reportTemplateVersion: 'ZED-ESRS-E1-v2',
  lastLegalReview: '2026-08-18',
} as const;

export type CsrdMandatoryScope = 'in_scope' | 'out_of_scope' | 'requires_review';

export interface CompanyComplianceProfile {
  employee_count?: number | null;
  /** Annual net turnover in EUR — optional until collected in company settings. */
  annual_turnover_eur?: number | null;
  industry_sector?: string | null;
  /** EU ETS screening — optional questionnaire answers (Phase 2). */
  ets_has_installation?: boolean | null;
  ets_thermal_input_mw?: number | null;
  ets_activity_annex_i?: boolean | null;
}

export interface ComplianceRuleRow {
  ruleKey: string;
  regulation: string;
  requirement: string;
  requirementType: RequirementType;
  status: ComplianceStatus;
  note: string;
  ruleVersion: string;
  sourceReference?: string;
  lastReviewDate?: string;
}

export interface ComplianceEvaluationInput {
  company: CompanyComplianceProfile;
  reportingYear: number;
  scope1Total: number;
  scope2Total: number;
  scope3Total: number;
  scope3Available: boolean;
  hasTargets: boolean;
  evidenceCoverage?: {
    scope12Entries: number;
    scope12WithEvidence: number;
    coveragePercent: number;
  };
}

export interface CsrdApplicabilityResult {
  mandatoryScope: CsrdMandatoryScope;
  summary: string;
  suggestedRoute: string;
  ruleVersion: string;
}

export interface ComplianceEvaluationResult {
  rows: ComplianceRuleRow[];
  csrd: CsrdApplicabilityResult;
  esrs: typeof ESRS_STANDARD_METADATA;
  ruleEngineVersion: string;
}

export function evaluateCsrdApplicability(
  company: CompanyComplianceProfile,
): CsrdApplicabilityResult {
  const employees = company.employee_count ?? 0;
  const turnover = company.annual_turnover_eur;
  const { employeeThreshold, turnoverThresholdEur, ruleVersion } = CSRD_APPLICABILITY_RULE;

  const employeesAbove = employees > employeeThreshold;
  const turnoverAbove =
    turnover != null ? turnover > turnoverThresholdEur : null;

  if (!employeesAbove) {
    return {
      mandatoryScope: 'out_of_scope',
      ruleVersion,
      summary: `Компанията (${employees} служители) не попада в задължителния CSRD обхват по текущите прагове (>${employeeThreshold} служители и >€${(turnoverThresholdEur / 1_000_000).toFixed(0)}M оборот).`,
      suggestedRoute: 'Доброволна климатична отчетност (ESRS E1) или VSME за SME',
    };
  }

  if (turnoverAbove === null) {
    return {
      mandatoryScope: 'requires_review',
      ruleVersion,
      summary: `Брой служители (${employees}) над прага, но липсва данни за годишен оборот — необходима е правна проверка за CSRD обхват.`,
      suggestedRoute: 'Попълнете оборот в настройките на компанията или консултирайте ESG специалист',
    };
  }

  if (employeesAbove && turnoverAbove) {
    return {
      mandatoryScope: 'in_scope',
      ruleVersion,
      summary: 'Профилът на компанията показва вероятно попадане в задължителния CSRD обхват — потребителят следва да потвърди с правен съвет.',
      suggestedRoute: 'Подготовка за ESRS отчетност и limited assurance верификация',
    };
  }

  return {
    mandatoryScope: 'out_of_scope',
    ruleVersion,
    summary: 'Един от праговете (служители или оборот) не е достигнат — вероятно извън задължителния CSRD обхват.',
    suggestedRoute: 'Доброволна ESRS E1 / VSME отчетност',
  };
}

function evaluateEuEtsScreening(
  company: CompanyComplianceProfile,
  scope1Total: number,
): Pick<ComplianceRuleRow, 'status' | 'note'> {
  const { ets_has_installation, ets_thermal_input_mw, ets_activity_annex_i } = company;

  if (ets_has_installation === false) {
    return {
      status: 'na',
      note: 'Декларирано: няма инсталация по смисъла на EU ETS — не се прилага на ниво корпорация.',
    };
  }

  if (ets_thermal_input_mw != null && ets_thermal_input_mw >= 20) {
    return {
      status: 'requires_review',
      note: `Деклариран топлинен вход ${ets_thermal_input_mw} MW (≥20 MW) — вероятно попадане в обхват; необходима е експертна оценка по Annex I.`,
    };
  }

  if (ets_activity_annex_i === true) {
    return {
      status: 'requires_review',
      note: 'Декларирана дейност по Annex I — необходима е проверка на капацитет и агрегационни правила.',
    };
  }

  if (ets_has_installation === true || ets_thermal_input_mw != null) {
    return {
      status: 'requires_review',
      note: 'Частични данни от ETS скрининга — необходима е допълнителна техническа оценка (не се използва общ корпоративен tCO₂e).',
    };
  }

  if (scope1Total > 0) {
    return {
      status: 'requires_review',
      note: 'Има Scope 1 данни (горива/инсталации), но липсва ETS въпросник — попълнете скрининга за инсталации (не се използва общ tCO₂e праг).',
    };
  }

  return {
    status: 'na',
    note: 'Няма Scope 1 данни и липсва информация за инсталации — автоматичният скрининг не може да потвърди приложимост.',
  };
}

/**
 * Evaluate all compliance rules for a company profile and emissions snapshot.
 */
export function evaluateComplianceRules(
  input: ComplianceEvaluationInput,
): ComplianceEvaluationResult {
  const {
    company,
    scope1Total,
    scope2Total,
    scope3Total,
    scope3Available,
    hasTargets,
    evidenceCoverage,
  } = input;

  const grandTotal = scope1Total + scope2Total + scope3Total;
  const hasGoodData = scope1Total + scope2Total > 0;
  const hasScope3 = scope3Available && scope3Total > 0;
  const hasEvidence =
    (evidenceCoverage?.scope12Entries ?? 0) > 0 &&
    (evidenceCoverage?.coveragePercent ?? 0) >= 50;

  const csrd = evaluateCsrdApplicability(company);

  const csrdStatus: ComplianceStatus =
    csrd.mandatoryScope === 'in_scope'
      ? hasGoodData && hasScope3
        ? 'partial'
        : hasGoodData
          ? 'partial'
          : 'gap'
      : csrd.mandatoryScope === 'out_of_scope'
        ? hasGoodData
          ? 'partial'
          : 'gap'
        : 'requires_review';

  const csrdNote =
    csrd.mandatoryScope === 'out_of_scope'
      ? `${csrd.summary} Доброволен ESRS E1 отчет е наличен в платформата — не се третира като задължително CSRD съответствие.`
      : csrd.mandatoryScope === 'in_scope'
        ? `${csrd.summary} Данни: ${hasGoodData ? 'Scope 1+2 налични' : 'липсват Scope 1+2'}${hasScope3 ? ', Scope 3 наличен' : ''}.`
        : csrd.summary;

  const ets = evaluateEuEtsScreening(company, scope1Total);

  const rows: ComplianceRuleRow[] = [
    {
      ruleKey: 'zoos_bg',
      regulation: 'ЗООС (Закон за опазване на околната среда)',
      requirement: 'Инвентаризация на ПГ емисии и вътрешна отчетност',
      requirementType: 'law',
      status: hasGoodData ? 'compliant' : 'gap',
      note: hasGoodData
        ? 'Scope 1+2 измерени и документирани в платформата'
        : 'Необходимо е събиране на данни',
      ruleVersion: '2026-08-18',
      sourceReference: 'lex.bg ldoc/2135458102 — ЗООС',
      lastReviewDate: '2026-08-18',
    },
    {
      ruleKey: 'bg_naredba_7_1999',
      regulation: 'Наредба № 7/1999 (качество на атмосферния въздух)',
      requirement: 'Оценка и управление на качеството на атмосферния въздух',
      requirementType: 'law',
      status: 'requires_review',
      note: 'Наредба № 7 се отнася до качество на въздуха, не до мониторинг на отделни горивни инсталации — необходим е специализиран преглед за локации с значими източници.',
      ruleVersion: '2026-08-18',
      sourceReference: 'lex.bg ldoc/-549692416 — Наредба № 7/1999',
      lastReviewDate: '2026-08-18',
    },
    {
      ruleKey: 'bg_naredba_6_1999',
      regulation: 'Наредба № 6/1999 (емисии от стационарни източници)',
      requirement: 'Измерване на емисии от стационарни източници (при приложимост)',
      requirementType: 'law',
      status: scope1Total > 0 ? 'requires_review' : 'na',
      note:
        scope1Total > 0
          ? 'Има Scope 1 данни — проверете дали обектите попадат под изискванията за стационарни източници (Наредба № 6).'
          : 'Не е приложимо — няма документирани стационарни източници',
      ruleVersion: '2026-08-18',
      sourceReference: 'lex.bg ldoc/-549699583 — Наредба № 6/1999',
      lastReviewDate: '2026-08-18',
    },
    {
      ruleKey: 'eu_ets',
      regulation: 'EU ETS (Регламент за търговия с емисии)',
      requirement: 'Инсталации по Annex I — не общ корпоративен отпечатък',
      requirementType: 'eu_regulation',
      status: ets.status,
      note: ets.note,
      ruleVersion: '2026-08-18',
      sourceReference: 'Directive 2003/87/EC — installation-based scope',
      lastReviewDate: '2026-08-18',
    },
    {
      ruleKey: 'csrd_esrs',
      regulation: 'CSRD / ESRS E1 (Директива 2022/2464/ЕС)',
      requirement: 'Климатична отчетност — задължителност според профил на компанията',
      requirementType: 'eu_directive',
      status: csrdStatus,
      note: csrdNote,
      ruleVersion: CSRD_APPLICABILITY_RULE.ruleVersion,
      sourceReference: CSRD_APPLICABILITY_RULE.sourceReference,
      lastReviewDate: CSRD_APPLICABILITY_RULE.lastLegalReview,
    },
    {
      ruleKey: 'eu_taxonomy',
      regulation: 'EU Taxonomy (Регламент 2020/852)',
      requirement: 'Оценка на климатичното съответствие на дейностите',
      requirementType: 'eu_regulation',
      status: 'requires_review',
      note: 'Не е извършен автоматичен Taxonomy скрининг — препоръчва се експертна оценка',
      ruleVersion: '2026-08-18',
      sourceReference: 'Regulation (EU) 2020/852',
      lastReviewDate: '2026-08-18',
    },
    {
      ruleKey: 'ghg_protocol',
      regulation: 'GHG Protocol Corporate Standard',
      requirement: 'Scope 1, 2 и материален Scope 3 с одитен след',
      requirementType: 'reporting_standard',
      status: hasGoodData && hasScope3 ? 'partial' : hasGoodData ? 'partial' : 'gap',
      note: hasGoodData && hasScope3
        ? 'Обхватите са измерени — липсва независима верификация и пълни первични доказателства'
        : 'Scope 3 данните са непълни или липсват',
      ruleVersion: 'Corporate Standard',
      sourceReference: 'WRI/WBCSD GHG Protocol',
      lastReviewDate: '2026-08-18',
    },
    {
      ruleKey: 'sbti',
      regulation: 'SBTi (Science Based Targets initiative)',
      requirement: 'Научни обосновани цели за намаляване',
      requirementType: 'target_framework',
      status: hasTargets ? 'requires_review' : 'gap',
      note: hasTargets
        ? 'Цели са поставени в платформата — не са одобрени/верифицирани от SBTi'
        : 'Не са поставени количествени цели за намаляване',
      ruleVersion: '2026-08-18',
      sourceReference: 'SBTi Corporate Manual — voluntary framework',
      lastReviewDate: '2026-08-18',
    },
    {
      ruleKey: 'iso_14064',
      regulation: 'ISO 14064-1:2018',
      requirement: 'Документирана методология и вътрешен одит',
      requirementType: 'certification_standard',
      status: hasGoodData ? (hasEvidence ? 'partial' : 'requires_review') : 'gap',
      note: hasGoodData
        ? hasEvidence
          ? `${evidenceCoverage!.coveragePercent}% от записите имат документ — липсва документиран вътрешен одит`
          : 'Методологията е документирана чрез ZED — липсват прикачени доказателства и вътрешен одит'
        : 'Необходима е документирана методология',
      ruleVersion: '2018',
      sourceReference: 'ISO 14064-1:2018 — certification standard, not law',
      lastReviewDate: '2026-08-18',
    },
  ];

  return {
    rows,
    csrd,
    esrs: ESRS_STANDARD_METADATA,
    ruleEngineVersion: COMPLIANCE_RULE_VERSION,
  };
}

/** Map engine rows to legacy PDF table shape (+ type label prefix). */
export function toComplianceTableRows(rows: ComplianceRuleRow[]) {
  return rows.map((r) => ({
    regulation: `[${REQUIREMENT_TYPE_LABELS[r.requirementType]}] ${r.regulation}`,
    requirement: r.requirement,
    status: r.status,
    note: r.note,
  }));
}

export function buildComplianceActionPlan(input: ComplianceEvaluationInput): Array<{
  priority: number;
  action: string;
  regulation: string;
  timeline: string;
  impact: 'висок' | 'среден' | 'нисък';
}> {
  const { scope3Available, scope3Total, hasTargets, company } = input;
  const hasScope3 = scope3Available && scope3Total > 0;
  const csrd = evaluateCsrdApplicability(company);
  const actions: Array<{
    priority: number;
    action: string;
    regulation: string;
    timeline: string;
    impact: 'висок' | 'среден' | 'нисък';
  }> = [];

  if (csrd.mandatoryScope === 'out_of_scope') {
    actions.push({
      priority: 1,
      action: 'Разгледайте доброволна VSME / ESRS E1 отчетност — компанията е извън задължителния CSRD обхват',
      regulation: 'CSRD / VSME',
      timeline: '1-3 месеца',
      impact: 'среден',
    });
  }

  if (!hasScope3) {
    actions.push({
      priority: actions.length + 1,
      action: 'Импортирайте финансови транзакции за изчисляване на Scope 3 емисии',
      regulation: 'GHG Protocol / ESRS E1',
      timeline: '1-2 месеца',
      impact: 'висок',
    });
  }

  if (!hasTargets) {
    actions.push({
      priority: actions.length + 1,
      action: 'Поставете количествена цел за намаляване (препоръка: -30% до 2030 г.)',
      regulation: 'SBTi / ESRS E1-4',
      timeline: '1-3 месеца',
      impact: 'висок',
    });
  }

  if (company.ets_has_installation == null && input.scope1Total > 0) {
    actions.push({
      priority: actions.length + 1,
      action: 'Попълнете EU ETS скрининг за инсталации (капацитет MW, Annex I дейност)',
      regulation: 'EU ETS',
      timeline: '2-4 седмици',
      impact: 'висок',
    });
  }

  actions.push({
    priority: actions.length + 1,
    action: 'Преминете към 100% ВЕИ тарифа за електроенергия — намалява Scope 2',
    regulation: 'ESRS E1-6',
    timeline: '1-6 месеца',
    impact: 'висок',
  });

  return actions;
}
