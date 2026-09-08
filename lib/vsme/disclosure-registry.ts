/**
 * VSME disclosure registry — versioned mapping layer (EFRAG VSME).
 */

import type { GuidanceKey } from '@/lib/i18n/regulatory-guidance';

export const VSME_STANDARD_VERSION = '2025-12-EFRAG';

export type VsmeDisclosureStatus = 'complete' | 'partial' | 'missing' | 'na';

export type VsmeCategoryBg = 'Климат и енергия' | 'Компания' | 'Хора и локации' | 'Управление';

export interface VsmeDisclosureDefinition {
  id: string;
  categoryBg: VsmeCategoryBg;
  /** Internal VSME code — used in exports only */
  code: string;
  titleBg: string;
  hintBg: string;
  manual: boolean;
}

export const VSME_DISCLOSURES: VsmeDisclosureDefinition[] = [
  {
    id: 'b1-basis',
    categoryBg: 'Компания',
    code: 'B1',
    titleBg: 'Данни за компанията',
    hintBg: 'Име, сектор и основни параметри за отчета',
    manual: false,
  },
  {
    id: 'b3-energy-ghg',
    categoryBg: 'Климат и енергия',
    code: 'B3',
    titleBg: 'Емисии и енергия',
    hintBg: 'Въглероден отпечатък — Обхват 1, 2 и 3',
    manual: false,
  },
  {
    id: 'c3-reduction-targets',
    categoryBg: 'Климат и енергия',
    code: 'C3',
    titleBg: 'Цели за намаляване',
    hintBg: 'Количествени цели и базова година',
    manual: false,
  },
  {
    id: 'c4-climate-transition',
    categoryBg: 'Климат и енергия',
    code: 'C4',
    titleBg: 'Стратегии и действия',
    hintBg: 'Конкретни мерки за намаляване на емисиите',
    manual: false,
  },
  {
    id: 'b11-locations',
    categoryBg: 'Хора и локации',
    code: 'B11',
    titleBg: 'Локации и обекти',
    hintBg: 'Обекти, от които идват емисиите',
    manual: false,
  },
  {
    id: 'b8-workforce',
    categoryBg: 'Хора и локации',
    code: 'B8',
    titleBg: 'Служители',
    hintBg: 'Брой и структура на персонала',
    manual: false,
  },
  {
    id: 'b10-health-safety',
    categoryBg: 'Хора и локации',
    code: 'B10',
    titleBg: 'Здраве и безопасност на работа',
    hintBg: 'Политика и инциденти — попълва се ръчно по-долу',
    manual: true,
  },
  {
    id: 'b11-governance',
    categoryBg: 'Управление',
    code: 'B11-G',
    titleBg: 'Корупция и подкуп',
    hintBg: 'Политика и мерки — попълва се ръчно по-долу',
    manual: true,
  },
];

export interface VsmeManualDisclosures {
  health_safety_has_policy: boolean | null;
  health_safety_description: string | null;
  health_safety_incidents: number | null;
  health_safety_responsible_person: string | null;
  health_safety_training_frequency: string | null;
  anti_corruption_has_policy: boolean | null;
  anti_corruption_description: string | null;
  anti_corruption_whistleblower: boolean | null;
}

export interface VsmeDisclosureResult {
  id: string;
  code: string;
  categoryBg: VsmeCategoryBg;
  titleBg: string;
  hintBg: string;
  status: VsmeDisclosureStatus;
  note: string;
  actionHref: string;
  actionLabel: string;
  guidanceKey: GuidanceKey;
  manual: boolean;
}

export interface VsmeReadinessSummary {
  standardVersion: typeof VSME_STANDARD_VERSION;
  reportingYear: number;
  readinessScore: number;
  complete: number;
  partial: number;
  missing: number;
  na: number;
  applicableTotal: number;
  disclosures: VsmeDisclosureResult[];
  suggestedRoute: string;
  manual: VsmeManualDisclosures | null;
}
