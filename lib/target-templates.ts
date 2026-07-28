// Pre-built emission target templates for Bulgarian SMBs.
// Each template describes a science-based or best-practice reduction goal.
// Clients pick one or more, review/edit the parameters, then create them.

export type TargetTemplateType = 'percentage' | 'absolute' | 'intensity';

export interface TargetTemplate {
  id: string;
  name: string;
  description: string;
  target_type: TargetTemplateType;
  scope: 1 | 2 | 3 | null;           // null = all scopes
  suggested_target_value: number;     // % reduction, absolute value, or intensity % drop
  years_to_target: number;            // how many years from baseline to target
  sbti_aligned: boolean;
  difficulty: 'easy' | 'medium' | 'ambitious';
  framework: string;                  // e.g. "SBTi", "EU CSRD", "GHG Protocol"
  rationale: string;                  // one-line explanation for the user
  tags: string[];
}

export const TARGET_TEMPLATES: TargetTemplate[] = [
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'sbti-15-scope12',
    name: 'SBTi 1.5°C — Намаление Обхват 1+2 с 42%',
    description:
      'Научнообоснована цел, съответстваща на 1.5°C сценария на Парижкото споразумение. ' +
      'SBTi изисква минимум 4.2% абсолютно намаление годишно за Обхват 1 и 2. ' +
      'Признава се от инвеститори, банки и клиенти като водещ стандарт.',
    target_type: 'percentage',
    scope: null,
    suggested_target_value: 42,
    years_to_target: 7,
    sbti_aligned: true,
    difficulty: 'ambitious',
    framework: 'SBTi / Парижко споразумение',
    rationale: '4.2% намаление/год — минималното изискване на SBTi за 1.5°C пътека',
    tags: ['SBTi', '1.5°C', 'Наука', 'Инвеститори'],
  },

  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'sbti-2c-scope12',
    name: 'SBTi Well-Below 2°C — Намаление с 25%',
    description:
      'Цел за намаление, съответстваща на "Well-Below 2°C" сценария. ' +
      'По-постижима от 1.5°C пътеката, но все още класифицирана от SBTi. ' +
      'Подходяща за компании с висока зависимост от изкопаеми горива в преходен период.',
    target_type: 'percentage',
    scope: null,
    suggested_target_value: 25,
    years_to_target: 7,
    sbti_aligned: true,
    difficulty: 'medium',
    framework: 'SBTi / Парижко споразумение',
    rationale: '2.5% намаление/год — Well-Below 2°C пътека',
    tags: ['SBTi', '2°C', 'Наука'],
  },

  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'scope2-zero',
    name: 'Нулеви Обхват 2 емисии до 2028',
    description:
      'Пълно елиминиране на Обхват 2 (ел. енергия) чрез преминаване към 100% ВЕИ. ' +
      'Постижимо чрез договор за зелена ел. енергия или собствена фотоволтаична система. ' +
      'Бърз и видим резултат с ниска инвестиция при договор.',
    target_type: 'percentage',
    scope: 2,
    suggested_target_value: 100,
    years_to_target: 3,
    sbti_aligned: false,
    difficulty: 'easy',
    framework: 'GHG Protocol / RE100',
    rationale: 'Елиминира напълно Обхват 2 чрез зелена ел. енергия',
    tags: ['ВЕИ', 'Ел. енергия', 'Бързо', 'RE100'],
  },

  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'scope1-30-2030',
    name: 'Намаление на Обхват 1 с 30% до 2030',
    description:
      'Намаляване на директните горивни емисии (отопление, транспорт, процеси) с 30% ' +
      'спрямо базова година. Съответства на европейските климатични цели за 2030 г. ' +
      'и е изискване при участие в обществени поръчки с "зелени" критерии.',
    target_type: 'percentage',
    scope: 1,
    suggested_target_value: 30,
    years_to_target: 5,
    sbti_aligned: false,
    difficulty: 'medium',
    framework: 'EU 2030 Climate Target Plan',
    rationale: 'Съответства на EU Fit for 55 — 30% намаление на Обхват 1',
    tags: ['Обхват 1', 'EU 2030', 'Горива'],
  },

  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'scope3-sbti-25',
    name: 'SBTi Обхват 3 — Намаление с 25% до 2030',
    description:
      'Цел за намаляване на емисиите от веригата на стойността (доставчици, транспорт, употреба на продукти). ' +
      'SBTi изисква покриване на ≥67% от Обхват 3 при подаване на цел. ' +
      'Предполага активна работа с доставчиците и зелени обществени поръчки.',
    target_type: 'percentage',
    scope: 3,
    suggested_target_value: 25,
    years_to_target: 7,
    sbti_aligned: true,
    difficulty: 'ambitious',
    framework: 'SBTi / GHG Protocol',
    rationale: '2.5% намаление/год — SBTi минимум за Обхват 3',
    tags: ['SBTi', 'Обхват 3', 'Верига'],
  },

  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'net-zero-2040',
    name: 'Net Zero 2040 — Пълна декарбонизация',
    description:
      'Амбициозна цел за достигане на въглеродна неутралност до 2040 г. за всички обхвати. ' +
      'Изисква дълбоко намаление (≥90%) на всички преки и косвени емисии, ' +
      'допълнено с компенсации само за остатъчни емисии. Съответства на Science Based Net-Zero Standard.',
    target_type: 'percentage',
    scope: null,
    suggested_target_value: 90,
    years_to_target: 14,
    sbti_aligned: true,
    difficulty: 'ambitious',
    framework: 'SBTi Net-Zero Standard',
    rationale: '≥90% намаление до 2040 — SBTi Net-Zero Standard',
    tags: ['Net Zero', 'SBTi', 'Дългосрочна', '2040'],
  },

  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'quick-win-10',
    name: 'Краткосрочна цел — 10% намаление за 2 години',
    description:
      'Бърза, постижима цел за демонстриране на прогрес пред клиенти и партньори. ' +
      'Постигаема чрез LED смяна, зелен договор за ел. енергия и Eco Driving. ' +
      'Подходяща за компании в началото на климатния преход.',
    target_type: 'percentage',
    scope: null,
    suggested_target_value: 10,
    years_to_target: 2,
    sbti_aligned: false,
    difficulty: 'easy',
    framework: 'GHG Protocol',
    rationale: 'Лесно постижима чрез бързи мерки без голяма инвестиция',
    tags: ['Бързо', 'Начинаещи', 'Видими резултати'],
  },

  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'eu-csrd-55',
    name: 'EU Fit for 55 — Намаление с 55% до 2030',
    description:
      'Цел, отразяваща официалната климатична цел на Европейския съюз (Fit for 55 пакет). ' +
      'Задължителна референтна точка при CSRD отчитане и при кандидатстване за европейско финансиране. ' +
      'Изисква системни промени в енергийното потребление и веригата на доставките.',
    target_type: 'percentage',
    scope: null,
    suggested_target_value: 55,
    years_to_target: 7,
    sbti_aligned: false,
    difficulty: 'ambitious',
    framework: 'EU Fit for 55 / CSRD',
    rationale: 'Официалната цел на ЕС — задължителна рамка при CSRD',
    tags: ['EU', 'CSRD', 'Fit for 55', '2030'],
  },

  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'intensity-15',
    name: 'Интензивност — 15% намаление на tCO₂e / служител',
    description:
      'Цел за намаляване на въглеродната интензивност (емисии на единица дейност) с 15%. ' +
      'Подходяща за растящи компании, при които абсолютните емисии може да нарастват ' +
      'заради бизнес растеж, но ефективността се подобрява.',
    target_type: 'intensity',
    scope: null,
    suggested_target_value: 15,
    years_to_target: 5,
    sbti_aligned: false,
    difficulty: 'medium',
    framework: 'GHG Protocol',
    rationale: 'Мери ефективността, не абсолютните емисии — подходящо при растеж',
    tags: ['Интензивност', 'Растеж', 'Ефективност'],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getTargetTemplateById(id: string): TargetTemplate | undefined {
  return TARGET_TEMPLATES.find(t => t.id === id);
}

export const DIFFICULTY_LABELS: Record<'easy' | 'medium' | 'ambitious', string> = {
  easy:      'Лесна',
  medium:    'Средна',
  ambitious: 'Амбициозна',
};

export const DIFFICULTY_COLORS: Record<'easy' | 'medium' | 'ambitious', string> = {
  easy:      'bg-green-100 text-green-700',
  medium:    'bg-amber-100 text-amber-700',
  ambitious: 'bg-red-100 text-red-700',
};

export const SCOPE_FILTER_OPTIONS = [
  { value: 'all',  label: 'Всички обхвати' },
  { value: '1',    label: 'Обхват 1' },
  { value: '2',    label: 'Обхват 2' },
  { value: '3',    label: 'Обхват 3' },
  { value: 'null', label: 'Общи (1+2+3)' },
];
