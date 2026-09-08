/**
 * VSME → XBRL taxonomy prep layer (EFRAG VSME December 2025 draft alignment).
 * Maps internal disclosure IDs to taxonomy concept QNames for future iXBRL export.
 */

import type { VsmeExportDocument } from './export-document';
import { VSME_STANDARD_VERSION } from './disclosure-registry';

export const VSME_XBRL_TAXONOMY_VERSION = VSME_STANDARD_VERSION;
export const VSME_XBRL_NAMESPACE_PREFIX = 'vsme';
export const VSME_XBRL_NAMESPACE_URI = 'https://xbrl.efrag.org/vsme/2025-12';

export type VsmeXbrlDataType =
  | 'monetary'
  | 'decimal'
  | 'string'
  | 'boolean'
  | 'integer'
  | 'enum'
  | 'date';

export interface VsmeXbrlConceptMapping {
  disclosureId: string;
  vsmeCode: string;
  conceptQName: string;
  dataType: VsmeXbrlDataType;
  unitRef?: string;
  enumDomain?: string;
}

/** Versioned concept registry — extend when EFRAG publishes final taxonomy. */
export const VSME_XBRL_CONCEPT_MAP: VsmeXbrlConceptMapping[] = [
  { disclosureId: 'b1-basis', vsmeCode: 'B1', conceptQName: 'vsme:NameOfReportingEntity', dataType: 'string' },
  { disclosureId: 'b1-basis', vsmeCode: 'B1', conceptQName: 'vsme:SectorOfActivity', dataType: 'string' },
  { disclosureId: 'b1-basis', vsmeCode: 'B1', conceptQName: 'vsme:NumberOfEmployees', dataType: 'integer' },
  { disclosureId: 'b3-energy-ghg', vsmeCode: 'B3', conceptQName: 'vsme:Scope1GHGEmissions', dataType: 'decimal', unitRef: 'tCO2e' },
  { disclosureId: 'b3-energy-ghg', vsmeCode: 'B3', conceptQName: 'vsme:Scope2GHGEmissions', dataType: 'decimal', unitRef: 'tCO2e' },
  { disclosureId: 'b3-energy-ghg', vsmeCode: 'B3', conceptQName: 'vsme:Scope3GHGEmissions', dataType: 'decimal', unitRef: 'tCO2e' },
  { disclosureId: 'b3-energy-ghg', vsmeCode: 'B3', conceptQName: 'vsme:TotalGHGEmissions', dataType: 'decimal', unitRef: 'tCO2e' },
  { disclosureId: 'c3-reduction-targets', vsmeCode: 'C3', conceptQName: 'vsme:GHGReductionTargetsDisclosed', dataType: 'boolean' },
  { disclosureId: 'c4-climate-transition', vsmeCode: 'C4', conceptQName: 'vsme:ClimateTransitionActionsDisclosed', dataType: 'boolean' },
  { disclosureId: 'b11-locations', vsmeCode: 'B11', conceptQName: 'vsme:NumberOfSites', dataType: 'integer' },
  { disclosureId: 'b8-workforce', vsmeCode: 'B8', conceptQName: 'vsme:TotalNumberOfEmployees', dataType: 'integer' },
  { disclosureId: 'b10-health-safety', vsmeCode: 'B10', conceptQName: 'vsme:HealthAndSafetyPolicyInPlace', dataType: 'boolean' },
  { disclosureId: 'b10-health-safety', vsmeCode: 'B10', conceptQName: 'vsme:NumberOfRecordableWorkRelatedIncidents', dataType: 'integer' },
  { disclosureId: 'b10-health-safety', vsmeCode: 'B10', conceptQName: 'vsme:HealthAndSafetyTrainingFrequency', dataType: 'string' },
  { disclosureId: 'b11-governance', vsmeCode: 'B11-G', conceptQName: 'vsme:AntiCorruptionPolicyInPlace', dataType: 'boolean' },
  { disclosureId: 'b11-governance', vsmeCode: 'B11-G', conceptQName: 'vsme:WhistleblowerProtectionInPlace', dataType: 'boolean' },
];

export interface VsmeXbrlFact {
  conceptQName: string;
  disclosureId: string;
  vsmeCode: string;
  value: string | number | boolean | null;
  dataType: VsmeXbrlDataType;
  unitRef?: string;
  contextRef: string;
}

export interface VsmeXbrlPrepDocument {
  schema: 'zed-vsme-xbrl-prep';
  version: '1.0';
  taxonomyVersion: typeof VSME_XBRL_TAXONOMY_VERSION;
  namespacePrefix: typeof VSME_XBRL_NAMESPACE_PREFIX;
  namespaceUri: typeof VSME_XBRL_NAMESPACE_URI;
  generatedAt: string;
  generatedBy: string;
  reportingYear: number;
  entity: {
    identifier: string;
    scheme: string;
    name: string;
  };
  context: {
    id: string;
    periodStart: string;
    periodEnd: string;
    instant?: string;
  };
  units: { id: string; measure: string }[];
  conceptMapVersion: typeof VSME_XBRL_TAXONOMY_VERSION;
  facts: VsmeXbrlFact[];
  disclosureStatus: VsmeExportDocument['readiness']['disclosures'];
}

export function buildVsmeXbrlPrepDocument(
  exportDoc: VsmeExportDocument,
): VsmeXbrlPrepDocument {
  const year = exportDoc.reportingYear;
  const contextId = `CY${year}`;
  const manual = exportDoc.manualDisclosures;

  const facts: VsmeXbrlFact[] = [
    {
      conceptQName: 'vsme:NameOfReportingEntity',
      disclosureId: 'b1-basis',
      vsmeCode: 'B1',
      value: exportDoc.company.company_name ?? null,
      dataType: 'string',
      contextRef: contextId,
    },
    {
      conceptQName: 'vsme:SectorOfActivity',
      disclosureId: 'b1-basis',
      vsmeCode: 'B1',
      value: exportDoc.company.industry_sector ?? null,
      dataType: 'string',
      contextRef: contextId,
    },
    {
      conceptQName: 'vsme:NumberOfEmployees',
      disclosureId: 'b8-workforce',
      vsmeCode: 'B8',
      value: exportDoc.company.employee_count ?? null,
      dataType: 'integer',
      contextRef: contextId,
    },
    {
      conceptQName: 'vsme:Scope1GHGEmissions',
      disclosureId: 'b3-energy-ghg',
      vsmeCode: 'B3',
      value: exportDoc.emissions.scope1_tco2e,
      dataType: 'decimal',
      unitRef: 'tCO2e',
      contextRef: contextId,
    },
    {
      conceptQName: 'vsme:Scope2GHGEmissions',
      disclosureId: 'b3-energy-ghg',
      vsmeCode: 'B3',
      value: exportDoc.emissions.scope2_tco2e,
      dataType: 'decimal',
      unitRef: 'tCO2e',
      contextRef: contextId,
    },
    {
      conceptQName: 'vsme:Scope3GHGEmissions',
      disclosureId: 'b3-energy-ghg',
      vsmeCode: 'B3',
      value: exportDoc.emissions.scope3_tco2e,
      dataType: 'decimal',
      unitRef: 'tCO2e',
      contextRef: contextId,
    },
    {
      conceptQName: 'vsme:TotalGHGEmissions',
      disclosureId: 'b3-energy-ghg',
      vsmeCode: 'B3',
      value: exportDoc.emissions.total_tco2e,
      dataType: 'decimal',
      unitRef: 'tCO2e',
      contextRef: contextId,
    },
    {
      conceptQName: 'vsme:GHGReductionTargetsDisclosed',
      disclosureId: 'c3-reduction-targets',
      vsmeCode: 'C3',
      value: exportDoc.targets.length > 0,
      dataType: 'boolean',
      contextRef: contextId,
    },
    {
      conceptQName: 'vsme:ClimateTransitionActionsDisclosed',
      disclosureId: 'c4-climate-transition',
      vsmeCode: 'C4',
      value: exportDoc.strategies.length > 0,
      dataType: 'boolean',
      contextRef: contextId,
    },
    {
      conceptQName: 'vsme:HealthAndSafetyPolicyInPlace',
      disclosureId: 'b10-health-safety',
      vsmeCode: 'B10',
      value: manual?.health_safety_has_policy ?? null,
      dataType: 'boolean',
      contextRef: contextId,
    },
    {
      conceptQName: 'vsme:NumberOfRecordableWorkRelatedIncidents',
      disclosureId: 'b10-health-safety',
      vsmeCode: 'B10',
      value: manual?.health_safety_incidents ?? null,
      dataType: 'integer',
      contextRef: contextId,
    },
    {
      conceptQName: 'vsme:HealthAndSafetyTrainingFrequency',
      disclosureId: 'b10-health-safety',
      vsmeCode: 'B10',
      value: manual?.health_safety_training_frequency ?? null,
      dataType: 'string',
      contextRef: contextId,
    },
    {
      conceptQName: 'vsme:AntiCorruptionPolicyInPlace',
      disclosureId: 'b11-governance',
      vsmeCode: 'B11-G',
      value: manual?.anti_corruption_has_policy ?? null,
      dataType: 'boolean',
      contextRef: contextId,
    },
    {
      conceptQName: 'vsme:WhistleblowerProtectionInPlace',
      disclosureId: 'b11-governance',
      vsmeCode: 'B11-G',
      value: manual?.anti_corruption_whistleblower ?? null,
      dataType: 'boolean',
      contextRef: contextId,
    },
  ];

  return {
    schema: 'zed-vsme-xbrl-prep',
    version: '1.0',
    taxonomyVersion: VSME_XBRL_TAXONOMY_VERSION,
    namespacePrefix: VSME_XBRL_NAMESPACE_PREFIX,
    namespaceUri: VSME_XBRL_NAMESPACE_URI,
    generatedAt: exportDoc.generatedAt,
    generatedBy: exportDoc.generatedBy,
    reportingYear: year,
    entity: {
      identifier: exportDoc.company.registration_number ?? exportDoc.company.company_name ?? 'unknown',
      scheme: 'BG-UIC',
      name: exportDoc.company.company_name ?? 'Unknown',
    },
    context: {
      id: contextId,
      periodStart: `${year}-01-01`,
      periodEnd: `${year}-12-31`,
    },
    units: [{ id: 'tCO2e', measure: 'tCO2e' }],
    conceptMapVersion: VSME_XBRL_TAXONOMY_VERSION,
    facts,
    disclosureStatus: exportDoc.readiness.disclosures,
  };
}
