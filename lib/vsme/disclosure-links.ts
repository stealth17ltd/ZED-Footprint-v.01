import type { GuidanceKey } from '@/lib/i18n/regulatory-guidance';

export interface VsmeDisclosureLinkMeta {
  href: string;
  linkLabel: string;
  guidanceKey: GuidanceKey;
}

/** Navigation + help for each VSME topic row */
export const VSME_DISCLOSURE_LINKS: Record<string, VsmeDisclosureLinkMeta> = {
  'b1-basis': {
    href: '/settings/company',
    linkLabel: 'Профил на компанията',
    guidanceKey: 'vsmeCompany',
  },
  'b3-energy-ghg': {
    href: '/data-entry',
    linkLabel: 'Въвеждане на данни',
    guidanceKey: 'vsmeEmissions',
  },
  'c3-reduction-targets': {
    href: '/targets',
    linkLabel: 'Цели',
    guidanceKey: 'vsmeTargets',
  },
  'c4-climate-transition': {
    href: '/strategies',
    linkLabel: 'Стратегии и задачи',
    guidanceKey: 'vsmeStrategies',
  },
  'b11-locations': {
    href: '/settings/locations',
    linkLabel: 'Локации',
    guidanceKey: 'vsmeLocations',
  },
  'b8-workforce': {
    href: '/settings/company',
    linkLabel: 'Профил на компанията',
    guidanceKey: 'vsmeWorkforce',
  },
  'b10-health-safety': {
    href: '#vsme-health',
    linkLabel: 'Форма по-долу',
    guidanceKey: 'vsmeHealthSafety',
  },
  'b11-governance': {
    href: '#vsme-corruption',
    linkLabel: 'Форма по-долу',
    guidanceKey: 'vsmeAntiCorruption',
  },
};

export function getVsmeDisclosureLink(id: string): VsmeDisclosureLinkMeta | undefined {
  return VSME_DISCLOSURE_LINKS[id];
}
