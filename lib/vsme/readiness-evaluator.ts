import {
  VSME_DISCLOSURES,
  VSME_STANDARD_VERSION,
  type VsmeDisclosureResult,
  type VsmeDisclosureStatus,
  type VsmeManualDisclosures,
  type VsmeReadinessSummary,
} from './disclosure-registry';
import { getVsmeDisclosureLink } from './disclosure-links';
import type { GuidanceKey } from '@/lib/i18n/regulatory-guidance';

export interface VsmeEvaluationInput {
  reportingYear: number;
  company: {
    company_name?: string | null;
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
  hasScope12Data: boolean;
  hasScope3Data: boolean;
  activeTargetCount: number;
  activeStrategyCount: number;
  locationCount: number;
  manual: VsmeManualDisclosures | null;
}

function scoreStatus(status: VsmeDisclosureStatus): number {
  switch (status) {
    case 'complete': return 1;
    case 'partial': return 0.5;
    case 'missing': return 0;
    case 'na': return 1;
    default: return 0;
  }
}

function manualHealthStatus(m: VsmeManualDisclosures | null): VsmeDisclosureStatus {
  if (!m) return 'missing';
  const hasCore = m.health_safety_has_policy === true && Boolean(m.health_safety_description?.trim());
  const hasExtra = Boolean(m.health_safety_responsible_person?.trim())
    || Boolean(m.health_safety_training_frequency?.trim());
  if (hasCore && hasExtra) return 'complete';
  if (hasCore || m.health_safety_has_policy !== null || m.health_safety_description) return 'partial';
  return 'missing';
}

function manualCorruptionStatus(m: VsmeManualDisclosures | null): VsmeDisclosureStatus {
  if (!m) return 'missing';
  const hasCore = m.anti_corruption_has_policy === true && Boolean(m.anti_corruption_description?.trim());
  if (hasCore && m.anti_corruption_whistleblower === true) return 'complete';
  if (hasCore || m.anti_corruption_has_policy !== null || m.anti_corruption_description) return 'partial';
  return 'missing';
}

export function evaluateVsmeReadiness(input: VsmeEvaluationInput): VsmeReadinessSummary {
  const disclosures: VsmeDisclosureResult[] = [];

  const push = (
    id: string,
    status: VsmeDisclosureStatus,
    note: string,
  ) => {
    const def = VSME_DISCLOSURES.find(d => d.id === id);
    const link = getVsmeDisclosureLink(id);
    if (!def || !link) return;
    disclosures.push({
      id: def.id,
      code: def.code,
      categoryBg: def.categoryBg,
      titleBg: def.titleBg,
      hintBg: def.hintBg,
      status,
      note,
      actionHref: link.href,
      actionLabel: link.linkLabel,
      guidanceKey: link.guidanceKey,
      manual: def.manual,
    });
  };

  const hasProfile = Boolean(
    input.company.company_name &&
    input.company.industry_sector &&
    input.company.employee_count,
  );
  push(
    'b1-basis',
    hasProfile ? 'complete' : 'partial',
    hasProfile ? 'Профилът е попълнен' : 'Добавете сектор и брой служители',
  );

  const hasGhg = input.hasScope12Data || input.hasScope3Data;
  const ghgComplete = input.hasScope12Data && input.footprint.total > 0;
  push(
    'b3-energy-ghg',
    !hasGhg ? 'missing' : ghgComplete ? 'complete' : 'partial',
    !hasGhg
      ? 'Няма данни за емисии'
      : ghgComplete
        ? `Общо ${input.footprint.total.toFixed(2)} tCO₂e (Обхват 1+2+3)`
        : 'Добавете данни за Обхват 1&2',
  );

  push(
    'b8-workforce',
    input.company.employee_count ? 'complete' : 'missing',
    input.company.employee_count
      ? `${input.company.employee_count} служители`
      : 'Въведете брой служители',
  );

  push(
    'b11-locations',
    input.locationCount > 0 ? 'complete' : 'partial',
    input.locationCount > 0
      ? `${input.locationCount} ${input.locationCount === 1 ? 'локация' : 'локации'}`
      : 'Добавете обекти, ако имате повече от една локация',
  );

  push(
    'c3-reduction-targets',
    input.activeTargetCount > 0 && input.company.baseline_year
      ? 'complete'
      : input.activeTargetCount > 0 || input.company.baseline_year
        ? 'partial'
        : 'missing',
    input.activeTargetCount > 0
      ? `${input.activeTargetCount} активни цели`
      : 'Задайте поне една цел',
  );

  push(
    'c4-climate-transition',
    input.activeStrategyCount > 0 ? 'complete' : 'missing',
    input.activeStrategyCount > 0
      ? `${input.activeStrategyCount} ${input.activeStrategyCount === 1 ? 'стратегия' : 'стратегии'}`
      : 'Добавете стратегии от каталога',
  );

  const hsStatus = manualHealthStatus(input.manual);
  push(
    'b10-health-safety',
    hsStatus,
    hsStatus === 'complete'
      ? 'Политика и описание са попълнени'
      : hsStatus === 'partial'
        ? 'Попълнете формата по-долу'
        : 'Попълнете формата по-долу на тази страница',
  );

  const acStatus = manualCorruptionStatus(input.manual);
  push(
    'b11-governance',
    acStatus,
    acStatus === 'complete'
      ? 'Политика и описание са попълнени'
      : acStatus === 'partial'
        ? 'Попълнете формата по-долу'
        : 'Попълнете формата по-долу на тази страница',
  );

  const applicable = disclosures.filter(d => d.status !== 'na');
  const complete = applicable.filter(d => d.status === 'complete').length;
  const partial = applicable.filter(d => d.status === 'partial').length;
  const missing = applicable.filter(d => d.status === 'missing').length;

  const readinessScore = applicable.length === 0
    ? 0
    : Math.round(
      (applicable.reduce((sum, d) => sum + scoreStatus(d.status), 0) / applicable.length) * 100,
    );

  const outOfCsrdMandatory = (input.company.employee_count ?? 0) < 1000;

  return {
    standardVersion: VSME_STANDARD_VERSION,
    reportingYear: input.reportingYear,
    readinessScore,
    complete,
    partial,
    missing,
    na: disclosures.length - applicable.length,
    applicableTotal: applicable.length,
    disclosures,
    manual: input.manual,
    suggestedRoute: outOfCsrdMandatory
      ? 'Подходящ доброволен маршрут за МСП извън задължителен CSRD обхват'
      : 'Може да се използва като подготовка преди пълен ESRS отчет',
  };
}
