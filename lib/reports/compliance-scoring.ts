/**
 * Conservative, evidence-aware compliance scoring for regulatory screening reports.
 * Partial / requires_review never count as fulfilled.
 */

export type ComplianceStatus =
  | 'compliant'
  | 'partial'
  | 'gap'
  | 'na'
  | 'requires_review';

export const COMPLIANCE_RULE_VERSION = '2026-08-18';

export interface ComplianceRowInput {
  status: ComplianceStatus;
}

export interface ComplianceSummary {
  totalRows: number;
  fulfilled: number;
  partial: number;
  gap: number;
  notApplicable: number;
  requiresReview: number;
  applicableTotal: number;
  /** Fulfilled ÷ applicable (partial excluded). */
  readinessScore: number;
  actionsRequired: number;
}

export function summarizeCompliance(rows: ComplianceRowInput[]): ComplianceSummary {
  const fulfilled = rows.filter((r) => r.status === 'compliant').length;
  const partial = rows.filter((r) => r.status === 'partial').length;
  const gap = rows.filter((r) => r.status === 'gap').length;
  const notApplicable = rows.filter((r) => r.status === 'na').length;
  const requiresReview = rows.filter((r) => r.status === 'requires_review').length;
  const applicableTotal = rows.filter((r) => r.status !== 'na').length;
  const actionsRequired = partial + gap + requiresReview;
  const readinessScore =
    applicableTotal > 0 ? Math.round((fulfilled / applicableTotal) * 100) : 0;

  return {
    totalRows: rows.length,
    fulfilled,
    partial,
    gap,
    notApplicable,
    requiresReview,
    applicableTotal,
    readinessScore,
    actionsRequired,
  };
}

export function readinessLabel(score: number): string {
  if (score >= 75) return 'Добра регулаторна готовност — продължете подобренията';
  if (score >= 50) return 'Умерена готовност — нужни са допълнителни действия';
  if (score >= 25) return 'Ниска готовност — необходими са приоритетни мерки';
  return 'Начална готовност — необходима е систематична подготовка';
}

export function readinessBarHint(score: number): string {
  if (score >= 75) return 'Повечето приложими изисквания са изпълнени';
  if (score >= 50) return 'Значителна част от изискванията изисква доработка';
  return 'Необходими са действия по множество изисквания';
}
