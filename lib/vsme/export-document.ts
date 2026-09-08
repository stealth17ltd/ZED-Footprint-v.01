import type { VsmeReportBundle } from './report-bundle';
import { VSME_STANDARD_VERSION } from './disclosure-registry';

export interface VsmeExportDocument {
  schema: 'zed-vsme-export';
  version: '1.0';
  standard: typeof VSME_STANDARD_VERSION;
  generatedAt: string;
  generatedBy: string;
  reportingYear: number;
  company: VsmeReportBundle['company'];
  emissions: {
    scope1_tco2e: number;
    scope2_tco2e: number;
    scope3_tco2e: number;
    total_tco2e: number;
  };
  targets: VsmeReportBundle['targets'];
  strategies: VsmeReportBundle['strategies'];
  manualDisclosures: VsmeReportBundle['manual'];
  readiness: {
    scorePercent: number;
    complete: number;
    partial: number;
    missing: number;
    disclosures: {
      id: string;
      vsmeCode: string;
      title: string;
      category: string;
      status: string;
      note: string;
    }[];
  };
}

export function buildVsmeExportDocument(
  bundle: VsmeReportBundle,
  reportingYear: number,
  generatedBy: string,
): VsmeExportDocument {
  return {
    schema: 'zed-vsme-export',
    version: '1.0',
    standard: VSME_STANDARD_VERSION,
    generatedAt: new Date().toISOString(),
    generatedBy,
    reportingYear,
    company: bundle.company,
    emissions: {
      scope1_tco2e: bundle.footprint.scope1,
      scope2_tco2e: bundle.footprint.scope2,
      scope3_tco2e: bundle.footprint.scope3,
      total_tco2e: bundle.footprint.total,
    },
    targets: bundle.targets,
    strategies: bundle.strategies,
    manualDisclosures: bundle.manual,
    readiness: {
      scorePercent: bundle.readinessScore,
      complete: bundle.complete,
      partial: bundle.partial,
      missing: bundle.missing,
      disclosures: bundle.disclosures.map(d => ({
        id: d.id,
        vsmeCode: d.code,
        title: d.titleBg,
        category: d.categoryBg,
        status: d.status,
        note: d.note,
      })),
    },
  };
}

export function vsmeSafeFilename(companyName: string | null | undefined): string {
  return (companyName ?? 'Company')
    .replace(/[\u0400-\u04FF]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'Company';
}
