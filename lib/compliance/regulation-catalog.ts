/**
 * Regulation catalog — official sources + in-app actions per compliance rule.
 * Enriches the rule engine rows for interactive UI (not legal advice).
 */

export interface RegulationAction {
  id: string;
  label: string;
  href: string;
  description: string;
  /** external = opens official legal text in new tab */
  external?: boolean;
}

export interface OfficialSource {
  label: string;
  url: string;
}

export interface RegulationCatalogEntry {
  ruleKey: string;
  officialTitle: string;
  /** Primary official text (lex.bg, EUR-Lex, etc.) */
  officialUrl: string;
  /** Additional authoritative sources */
  officialSources?: OfficialSource[];
  officialSourceLabel?: string;
  summaryBg: string;
  actions: RegulationAction[];
}

/** lex.bg consolidated document URL — use ldoc IDs, not legacy /laws/doc/ paths. */
export function lexBgUrl(ldocId: string | number): string {
  return `https://lex.bg/laws/ldoc/${ldocId}`;
}

export const REGULATION_CATALOG: Record<string, RegulationCatalogEntry> = {
  zoos_bg: {
    ruleKey: 'zoos_bg',
    officialTitle: 'Закон за опазване на околната среда (ЗООС)',
    officialUrl: lexBgUrl(2135458102),
    officialSourceLabel: 'lex.bg',
    officialSources: [
      { label: 'lex.bg — консолидиран текст', url: lexBgUrl(2135458102) },
    ],
    summaryBg: 'Задължава предприятията да следят и документират емисии от парникови газове.',
    actions: [
      { id: 'emissions', label: 'Въведи емисии', href: '/data-entry', description: 'Scope 1 и 2 данни за инвентаризация' },
      { id: 'report', label: 'Генерирай отчет', href: '/reports', description: 'PDF отчет за вътрешна отчетност' },
      { id: 'help', label: 'Насоки', href: '/help', description: 'Как ZED покрива ЗООС изискванията' },
    ],
  },
  bg_naredba_7_1999: {
    ruleKey: 'bg_naredba_7_1999',
    officialTitle: 'Наредба № 7 от 3.05.1999 г. за оценка и управление качеството на атмосферния въздух',
    officialUrl: lexBgUrl(-549692416),
    officialSourceLabel: 'lex.bg',
    officialSources: [
      { label: 'lex.bg — пълен текст', url: lexBgUrl(-549692416) },
      { label: 'Апис — legislation.apis.bg', url: 'https://legislation.apis.bg/doc/21866/0/' },
      { label: 'МОСВ — нормативни актове', url: 'https://www.moew.government.bg/bg/vuzduh/kachestvo-na-atmosferniya-vuzduh/normativni-aktove/' },
    ],
    summaryBg: 'Определя показатели и процедури за оценка на качеството на атмосферния въздух — не е същото като инвентаризация на корпоративен въглероден отпечатък.',
    actions: [
      { id: 'locations', label: 'Преглед на локации', href: '/settings/locations', description: 'Идентифицирайте обекти с потенциални източници' },
      { id: 'scope1', label: 'Scope 1 данни', href: '/data-entry', description: 'Документирайте горива и стационарни източници' },
    ],
  },
  bg_naredba_6_1999: {
    ruleKey: 'bg_naredba_6_1999',
    officialTitle: 'Наредба № 6 от 26.03.1999 г. за реда и начина за измерване на емисиите от неподвижни източници',
    officialUrl: lexBgUrl(-549699583),
    officialSourceLabel: 'lex.bg',
    officialSources: [
      { label: 'lex.bg — пълен текст', url: lexBgUrl(-549699583) },
      { label: 'Апис — legislation.apis.bg', url: 'https://legislation.apis.bg/doc/21830/0/' },
    ],
    summaryBg: 'Урежда измервания на емисии от стационарни (неподвижни) източници — приложимо при горивни инсталации над определени прагове.',
    actions: [
      { id: 'locations', label: 'Преглед на локации', href: '/settings/locations', description: 'Проверете кои обекти имат стационарни източници' },
      { id: 'scope1', label: 'Въведи Scope 1', href: '/data-entry', description: 'Природен газ, нафта, въглища и др.' },
      { id: 'list', label: 'Списък записи', href: '/data-entry/list', description: 'Преглед и доказателства по запис' },
    ],
  },
  eu_ets: {
    ruleKey: 'eu_ets',
    officialTitle: 'Директива 2003/87/EC — EU ETS',
    officialUrl: 'https://eur-lex.europa.eu/legal-content/BG/TXT/?uri=CELEX:32003L0087',
    officialSourceLabel: 'EUR-Lex',
    officialSources: [
      { label: 'EUR-Lex (български)', url: 'https://eur-lex.europa.eu/legal-content/BG/TXT/?uri=CELEX:32003L0087' },
      { label: 'EUR-Lex (English)', url: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32003L0087' },
    ],
    summaryBg: 'Търговия с емисии на ниво инсталация (Annex I) — не се оценява по общ корпоративен tCO₂e.',
    actions: [
      { id: 'ets', label: 'EU ETS въпросник', href: '/settings/company#eu-ets', description: 'Декларирайте инсталации и капацитет MW' },
      { id: 'locations', label: 'Локации', href: '/settings/locations', description: 'Обекти с производствена дейност' },
    ],
  },
  csrd_esrs: {
    ruleKey: 'csrd_esrs',
    officialTitle: 'Директива (ЕС) 2022/2464 (CSRD) и ESRS E1',
    officialUrl: 'https://eur-lex.europa.eu/legal-content/BG/TXT/?uri=CELEX:32022L2464',
    officialSourceLabel: 'EUR-Lex',
    officialSources: [
      { label: 'EUR-Lex — CSRD', url: 'https://eur-lex.europa.eu/legal-content/BG/TXT/?uri=CELEX:32022L2464' },
    ],
    summaryBg: 'Корпоративна sustainability отчетност — задължителност според размер на компанията.',
    actions: [
      { id: 'company', label: 'Профил на компанията', href: '/settings/company', description: 'Оборот и брой служители за CSRD скрининг' },
      { id: 'vsme', label: 'VSME готовност', href: '/vsme', description: 'SME доброволна отчетност' },
      { id: 'csrd', label: 'CSRD отчет', href: '/reports?type=csrd', description: 'ESRS E1 PDF' },
    ],
  },
  eu_taxonomy: {
    ruleKey: 'eu_taxonomy',
    officialTitle: 'Регламент (ЕС) 2020/852 (EU Taxonomy)',
    officialUrl: 'https://eur-lex.europa.eu/legal-content/BG/TXT/?uri=CELEX:32020R0852',
    officialSourceLabel: 'EUR-Lex',
    officialSources: [
      { label: 'EUR-Lex — Taxonomy', url: 'https://eur-lex.europa.eu/legal-content/BG/TXT/?uri=CELEX:32020R0852' },
    ],
    summaryBg: 'Класификация на икономически дейности по климатични критерии.',
    actions: [
      { id: 'strategies', label: 'Стратегии', href: '/strategies', description: 'Документирайте зелени инвестиции и мерки' },
    ],
  },
  ghg_protocol: {
    ruleKey: 'ghg_protocol',
    officialTitle: 'GHG Protocol Corporate Standard',
    officialUrl: 'https://ghgprotocol.org/corporate-standard',
    officialSourceLabel: 'ghgprotocol.org',
    officialSources: [
      { label: 'GHG Protocol', url: 'https://ghgprotocol.org/corporate-standard' },
    ],
    summaryBg: 'Международен стандарт за корпоративна инвентаризация на парникови газове.',
    actions: [
      { id: 'scope12', label: 'Scope 1 & 2', href: '/data-entry', description: 'Директни и енергийни емисии' },
      { id: 'scope3', label: 'Scope 3', href: '/scope3/dashboard', description: 'Стойностна верига' },
      { id: 'quality', label: 'Качество на данни', href: '/data-quality', description: 'Пълнота и доказателства' },
    ],
  },
  sbti: {
    ruleKey: 'sbti',
    officialTitle: 'Science Based Targets initiative (SBTi)',
    officialUrl: 'https://sciencebasedtargets.org/',
    officialSourceLabel: 'sciencebasedtargets.org',
    officialSources: [
      { label: 'SBTi — официален сайт', url: 'https://sciencebasedtargets.org/' },
      { label: 'SBTi Corporate Net-Zero Standard', url: 'https://sciencebasedtargets.org/net-zero' },
    ],
    summaryBg: 'Доброволна рамка за научно обосновани цели за намаляване — не е закон.',
    actions: [
      { id: 'targets', label: 'Постави цели', href: '/targets', description: 'SBTi шаблони и 4.2%/год проверка' },
      { id: 'comparison', label: 'Сравнение', href: '/comparison', description: 'Проверка спрямо SBTi праг' },
    ],
  },
  iso_14064: {
    ruleKey: 'iso_14064',
    officialTitle: 'ISO 14064-1:2018',
    officialUrl: 'https://www.iso.org/standard/66453.html',
    officialSourceLabel: 'iso.org',
    officialSources: [
      { label: 'ISO.org', url: 'https://www.iso.org/standard/66453.html' },
    ],
    summaryBg: 'Стандарт за верификация на GHG инвентаризация — изисква методология и одит.',
    actions: [
      { id: 'quality', label: 'Качество на данни', href: '/data-quality', description: 'Оценка на пълнота и доказателства' },
      { id: 'list', label: 'Доказателства', href: '/data-entry/list', description: 'Прикачете фактури и документи' },
      { id: 'compliance', label: 'PDF одит', href: '/reports?type=compliance', description: 'Отчет за съответствие' },
    ],
  },
};

export function getRegulationCatalog(ruleKey: string): RegulationCatalogEntry | null {
  return REGULATION_CATALOG[ruleKey] ?? null;
}

export function enrichComplianceRow(row: { ruleKey: string }) {
  const catalog = getRegulationCatalog(row.ruleKey);
  if (!catalog) return { catalog: null, actions: [] as RegulationAction[] };
  return {
    catalog: {
      officialTitle: catalog.officialTitle,
      officialUrl: catalog.officialUrl,
      officialSourceLabel: catalog.officialSourceLabel,
      officialSources: catalog.officialSources ?? [{ label: catalog.officialSourceLabel ?? 'Официален източник', url: catalog.officialUrl }],
      summaryBg: catalog.summaryBg,
    },
    actions: catalog.actions,
  };
}
