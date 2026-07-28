// Pre-built reduction strategy templates for Bulgarian SMBs.
// Each template ships with a fully pre-populated strategy and a set of initiatives.
// Clients pick one or more templates; the system creates the records automatically.

export type TemplateCategory =
  | 'energy_efficiency'
  | 'renewable_energy'
  | 'fleet'
  | 'supply_chain'
  | 'waste'
  | 'water'
  | 'behavioral'
  | 'other';

export type TemplatePriority = 'high' | 'medium' | 'low';
export type TemplateDifficulty = 'easy' | 'medium' | 'hard';

export interface TemplateInitiative {
  title: string;
  description: string;
  estimated_reduction_co2e?: number;
  estimated_cost?: number;
  due_days_from_start?: number; // offset in days from strategy start date
}

export interface StrategyTemplate {
  id: string;
  title: string;
  description: string;
  category: TemplateCategory;
  scope: 1 | 2 | 3 | null;
  priority: TemplatePriority;
  difficulty: TemplateDifficulty;
  estimated_reduction_co2e_min: number;
  estimated_reduction_co2e_max: number;
  estimated_cost_min: number;
  estimated_cost_max: number;
  typical_months: number;
  impact_label: string;  // short human-readable impact summary
  tags: string[];        // for visual chips
  initiatives: TemplateInitiative[];
}

export const STRATEGY_TEMPLATES: StrategyTemplate[] = [
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'led-lighting',
    title: 'Преминаване към LED осветление',
    description:
      'Замяна на остарялото флуоресцентно и халогенно осветление с LED технология. ' +
      'Намалява консумацията на електроенергия с 50–70% за осветление и намалява разходите за поддръжка.',
    category: 'energy_efficiency',
    scope: 2,
    priority: 'high',
    difficulty: 'easy',
    estimated_reduction_co2e_min: 3,
    estimated_reduction_co2e_max: 15,
    estimated_cost_min: 2000,
    estimated_cost_max: 10000,
    typical_months: 3,
    impact_label: '3 – 15 tCO₂e / год',
    tags: ['Бързо изпълнение', 'Ниска цена', 'Обхват 2'],
    initiatives: [
      {
        title: 'Одит на текущото осветление',
        description: 'Направете инвентаризация на всички осветителни тела — тип, мощност, брой часове работа.',
        due_days_from_start: 14,
      },
      {
        title: 'Събиране на оферти от доставчици',
        description: 'Изискайте минимум 3 оферти за LED подмяна от сертифицирани електро-доставчици.',
        due_days_from_start: 30,
      },
      {
        title: 'Монтаж на LED осветление',
        description: 'Изпълнение на монтажа по утвърдена оферта, включително изхвърляне на старите лампи.',
        due_days_from_start: 60,
      },
      {
        title: 'Проследяване на икономии',
        description: 'Сравнете консумацията на ел. енергия преди и след подмяната и документирайте резултатите.',
        due_days_from_start: 90,
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'renewable-electricity-contract',
    title: 'Договор за зелена електроенергия',
    description:
      'Подписване на договор за 100% електроенергия от възобновяеми източници (ВЕИ) с доставчик, ' +
      'издаващ гаранции за произход (GoO/RECS). Най-бързият начин за намаляване на Обхват 2 емисии.',
    category: 'renewable_energy',
    scope: 2,
    priority: 'high',
    difficulty: 'easy',
    estimated_reduction_co2e_min: 15,
    estimated_reduction_co2e_max: 80,
    estimated_cost_min: 0,
    estimated_cost_max: 5000,
    typical_months: 2,
    impact_label: '15 – 80 tCO₂e / год',
    tags: ['Висок ефект', 'Без инвестиция', 'Обхват 2'],
    initiatives: [
      {
        title: 'Изчислете текущите Обхват 2 емисии',
        description: 'Определете базовото потребление на ел. енергия за последната година (кВтч и tCO₂e).',
        due_days_from_start: 7,
      },
      {
        title: 'Потърсете ВЕИ доставчици в България',
        description: 'Проучете лицензирани доставчици на зелена ел. енергия — CEZ, EVN Green, Енергo Про, Bulenergie и др.',
        due_days_from_start: 21,
      },
      {
        title: 'Подпишете договор за зелена енергия',
        description: 'Договорете условия, уверете се, че доставчикът издава гаранции за произход (GoO).',
        due_days_from_start: 45,
      },
      {
        title: 'Документирайте GoO сертификатите',
        description: 'Запазете сертификатите за произход за годишния CSRD/GHG отчет.',
        due_days_from_start: 60,
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'solar-panels',
    title: 'Инсталиране на фотоволтаична система',
    description:
      'Монтаж на покривни соларни панели за производство на собствена чиста електроенергия. ' +
      'Намалява разходите за ел. енергия в дългосрочен план и позволява отчитане на пряко намалена Обхват 2.',
    category: 'renewable_energy',
    scope: 2,
    priority: 'medium',
    difficulty: 'hard',
    estimated_reduction_co2e_min: 10,
    estimated_reduction_co2e_max: 60,
    estimated_cost_min: 15000,
    estimated_cost_max: 120000,
    typical_months: 6,
    impact_label: '10 – 60 tCO₂e / год',
    tags: ['Дългосрочна инвестиция', 'Субсидии', 'Обхват 2'],
    initiatives: [
      {
        title: 'Технически анализ на покрива',
        description: 'Оценете наклон, ориентация, носимост и сенки. Наемете сертифициран проектант.',
        due_days_from_start: 30,
      },
      {
        title: 'Проучване на субсидии и финансиране',
        description: 'Проверете програмите на МОСВ, ОПОС, ЕБВР и търговски банкови кредити за ВЕИ инсталации.',
        due_days_from_start: 30,
      },
      {
        title: 'Избор на изпълнител и подписване на договор',
        description: 'Набавете минимум 3 оферти. Изисквайте гаранция за производителност минимум 25 г.',
        due_days_from_start: 90,
      },
      {
        title: 'Получаване на разрешителни',
        description: 'Съгласувайте с общината и ЕРП за присъединяване към мрежата (нет-митъринг).',
        due_days_from_start: 120,
      },
      {
        title: 'Монтаж и въвеждане в експлоатация',
        description: 'Монтаж на панели, инвертори и мониторинг система.',
        due_days_from_start: 180,
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'fleet-optimization',
    title: 'Оптимизация и електрификация на автопарка',
    description:
      'Намаляване на горивни емисии чрез маршрутна оптимизация, смяна на шофьорски навици ' +
      'и постепенна замяна на дизелови/бензинови превозни средства с електрически или хибридни.',
    category: 'fleet',
    scope: 1,
    priority: 'high',
    difficulty: 'medium',
    estimated_reduction_co2e_min: 8,
    estimated_reduction_co2e_max: 45,
    estimated_cost_min: 1000,
    estimated_cost_max: 80000,
    typical_months: 12,
    impact_label: '8 – 45 tCO₂e / год',
    tags: ['Обхват 1', 'Автопарк', 'Eco Driving'],
    initiatives: [
      {
        title: 'Одит на автопарка и горивно потребление',
        description: 'Документирайте всички МПС, тип гориво, пробег и разход за последната година.',
        due_days_from_start: 14,
      },
      {
        title: 'Въвеждане на Eco Driving обучение',
        description: 'Обучете шофьорите в техники за икономично шофиране (до 15% по-малко гориво).',
        due_days_from_start: 45,
      },
      {
        title: 'Внедряване на маршрутна оптимизация',
        description: 'Използвайте GPS/TMS система за оптимизиране на маршрути и намаляване на празен пробег.',
        due_days_from_start: 60,
      },
      {
        title: 'Планиране на замяна с електрически МПС',
        description: 'Идентифицирайте кои МПС могат да бъдат заменени с EV при следващата смяна.',
        due_days_from_start: 120,
      },
      {
        title: 'Монтаж на зарядни станции (при избор на EV)',
        description: 'Инсталирайте зарядна инфраструктура в базата при закупуване на електрически МПС.',
        due_days_from_start: 270,
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'building-insulation-hvac',
    title: 'Изолация на сградата и HVAC оптимизация',
    description:
      'Подобряване на топлоизолацията на стени, покрив и прозорци, заедно с ' +
      'инсталиране на интелигентни термостати и модернизация на отоплително/охладителна система.',
    category: 'energy_efficiency',
    scope: 1,
    priority: 'medium',
    difficulty: 'hard',
    estimated_reduction_co2e_min: 5,
    estimated_reduction_co2e_max: 30,
    estimated_cost_min: 8000,
    estimated_cost_max: 60000,
    typical_months: 9,
    impact_label: '5 – 30 tCO₂e / год',
    tags: ['Обхват 1 & 2', 'Сгради', 'Комфорт'],
    initiatives: [
      {
        title: 'Енергиен одит на сградата',
        description: 'Поръчайте сертифициран енергиен одит (клас на ефективност, топлинни загуби, препоръки).',
        due_days_from_start: 30,
      },
      {
        title: 'Инсталиране на смарт термостати',
        description: 'Монтирайте програмируеми термостати с зонно управление. Бърза окупаемост (1–2 г.).',
        due_days_from_start: 60,
      },
      {
        title: 'Изолация на покрив и стени',
        description: 'Изпълнете препоръките от одита — приоритет: покрив и таван (60% от топлинните загуби).',
        due_days_from_start: 180,
      },
      {
        title: 'Смяна на дограма (при необходимост)',
        description: 'Подменете прозорци и врати с трипластово стъкло при нисък енергиен клас.',
        due_days_from_start: 270,
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'business-travel-reduction',
    title: 'Намаляване на командировъчни пътувания',
    description:
      'Въвеждане на политика за видеоконференции вместо физически срещи, ' +
      'приоритет на влак пред самолет за пътувания до 6 часа и намаляване на нощувките.',
    category: 'behavioral',
    scope: 1,
    priority: 'medium',
    difficulty: 'easy',
    estimated_reduction_co2e_min: 2,
    estimated_reduction_co2e_max: 12,
    estimated_cost_min: 200,
    estimated_cost_max: 2000,
    typical_months: 3,
    impact_label: '2 – 12 tCO₂e / год',
    tags: ['Без инвестиция', 'Обхват 1 & 3', 'Политика'],
    initiatives: [
      {
        title: 'Одит на командировъчните пътувания',
        description: 'Анализирайте всички пътувания от последната година — дестинация, вид транспорт, цел.',
        due_days_from_start: 14,
      },
      {
        title: 'Въвеждане на видеоконферентна политика',
        description: 'Запишете правило: видео среща по подразбиране; физическа само при ясна бизнес необходимост.',
        due_days_from_start: 30,
      },
      {
        title: 'Лицензи за видеоконферентен инструмент',
        description: 'Осигурете подходяща платформа (Teams, Zoom, Google Meet) за целия екип.',
        due_days_from_start: 30,
      },
      {
        title: 'Проследяване и отчитане на намалението',
        description: 'Сравнете тримесечните разходи и CO₂e след въвеждане на политиката с предходния период.',
        due_days_from_start: 90,
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'waste-recycling',
    title: 'Програма за разделно събиране и рециклиране',
    description:
      'Внедряване на системно разделно събиране на отпадъци (хартия, пластмаса, метал, електроника) ' +
      'и намаляване на отпадъците за депониране. Намалява Обхват 3 емисии и разходи за извозване.',
    category: 'waste',
    scope: 3,
    priority: 'low',
    difficulty: 'easy',
    estimated_reduction_co2e_min: 1,
    estimated_reduction_co2e_max: 8,
    estimated_cost_min: 500,
    estimated_cost_max: 3000,
    typical_months: 3,
    impact_label: '1 – 8 tCO₂e / год',
    tags: ['Лесно', 'Обхват 3', 'Отпадъци'],
    initiatives: [
      {
        title: 'Одит на генерираните отпадъци',
        description: 'Определете видовете и количествата отпадъци — кое може да се рециклира.',
        due_days_from_start: 14,
      },
      {
        title: 'Монтаж на контейнери за разделно събиране',
        description: 'Инсталирайте цветни контейнери на ключови места в офиса/обекта.',
        due_days_from_start: 30,
      },
      {
        title: 'Обучение на персонала',
        description: 'Кратко обучение + табели кое отпадъче отива в кой контейнер.',
        due_days_from_start: 45,
      },
      {
        title: 'Договор с лицензиран рециклиращ оператор',
        description: 'Подпишете договор за редовно вземане на разделно събраните отпадъци.',
        due_days_from_start: 60,
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'green-procurement',
    title: 'Зелени обществени поръчки и доставки',
    description:
      'Въвеждане на критерии за въглероден отпечатък при избор на доставчици и продукти. ' +
      'Предпочитайте доставчици с по-ниски емисии, сертификати ISO 14001 или собствени климатични цели.',
    category: 'supply_chain',
    scope: 3,
    priority: 'medium',
    difficulty: 'medium',
    estimated_reduction_co2e_min: 5,
    estimated_reduction_co2e_max: 40,
    estimated_cost_min: 500,
    estimated_cost_max: 3000,
    typical_months: 6,
    impact_label: '5 – 40 tCO₂e / год',
    tags: ['Обхват 3', 'Доставчици', 'CSRD'],
    initiatives: [
      {
        title: 'Картографиране на ключови доставчици',
        description: 'Идентифицирайте топ 10 доставчика по разходи — те генерират >80% от Обхват 3 Cat.1.',
        due_days_from_start: 21,
      },
      {
        title: 'Изпращане на въпросник за CO₂ към доставчиците',
        description: 'Попитайте доставчиците за техния въглероден отпечатък и климатични ангажименти.',
        due_days_from_start: 45,
      },
      {
        title: 'Добавяне на климатични критерии в процедурите за избор',
        description: 'Включете CO₂ критерии или ISO 14001 сертификат като тегловен критерий при оценка.',
        due_days_from_start: 90,
      },
      {
        title: 'Преглед и актуализация на договори',
        description: 'Добавете клауза за климатична отчетност в новите договори с доставчици.',
        due_days_from_start: 180,
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'employee-commuting',
    title: 'Програма за устойчив транспорт на служителите',
    description:
      'Насърчаване на служителите да използват обществен транспорт, велосипед или споделено пътуване ' +
      'вместо лично МПС. Намалява Обхват 3 Категория 7 (служебен транспорт).',
    category: 'behavioral',
    scope: 3,
    priority: 'low',
    difficulty: 'easy',
    estimated_reduction_co2e_min: 2,
    estimated_reduction_co2e_max: 15,
    estimated_cost_min: 1000,
    estimated_cost_max: 6000,
    typical_months: 4,
    impact_label: '2 – 15 tCO₂e / год',
    tags: ['Обхват 3', 'Служители', 'Транспорт'],
    initiatives: [
      {
        title: 'Анкета за транспортните навици на служителите',
        description: 'Разберете как пристигат служителите на работа — разстояние, вид транспорт.',
        due_days_from_start: 14,
      },
      {
        title: 'Субсидиране на карти за обществен транспорт',
        description: 'Предложете частично или пълно покриване на разходите за градски транспорт.',
        due_days_from_start: 45,
      },
      {
        title: 'Велосипедна инфраструктура',
        description: 'Осигурете сигурно паркиране за велосипеди + душове (ако е приложимо).',
        due_days_from_start: 60,
      },
      {
        title: 'Политика за дистанционна работа',
        description: 'Формализирайте дните за работа от вкъщи, особено за служители с дълъг маршрут.',
        due_days_from_start: 60,
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'water-efficiency',
    title: 'Ефективно използване на водните ресурси',
    description:
      'Намаляване на потреблението на вода чрез одит, отстраняване на течове, ' +
      'инсталиране на икономични арматури и (при възможност) улавяне на дъждовна вода.',
    category: 'water',
    scope: 1,
    priority: 'low',
    difficulty: 'easy',
    estimated_reduction_co2e_min: 0.5,
    estimated_reduction_co2e_max: 4,
    estimated_cost_min: 300,
    estimated_cost_max: 4000,
    typical_months: 3,
    impact_label: '0.5 – 4 tCO₂e / год',
    tags: ['Вода', 'Ниска цена', 'Обхват 1'],
    initiatives: [
      {
        title: 'Одит на водното потребление',
        description: 'Проследете месечните разходи за вода по обекти, идентифицирайте аномалии.',
        due_days_from_start: 14,
      },
      {
        title: 'Проверка и ремонт на течове',
        description: 'Проверете всички чешми, тоалетни и тръби. Отстранете течовете веднага.',
        due_days_from_start: 30,
      },
      {
        title: 'Монтаж на икономични аератори и пулверизатори',
        description: 'Сменете старата арматура с модели с нисък дебит (до 40% по-малко вода).',
        due_days_from_start: 60,
      },
      {
        title: 'Монтиране на водомери по обекти',
        description: 'Поставете подводомери за точно проследяване на потреблението по зони.',
        due_days_from_start: 90,
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'refrigerant-management',
    title: 'Управление на хладилни агенти (F-газове)',
    description:
      'Проверка и ремонт на херметичността на хладилното и климатично оборудване, ' +
      'постепенна замяна на F-газове с висок GWP с нискоемисионни алтернативи.',
    category: 'energy_efficiency',
    scope: 1,
    priority: 'high',
    difficulty: 'medium',
    estimated_reduction_co2e_min: 3,
    estimated_reduction_co2e_max: 35,
    estimated_cost_min: 1500,
    estimated_cost_max: 20000,
    typical_months: 6,
    impact_label: '3 – 35 tCO₂e / год',
    tags: ['Обхват 1', 'F-газове', 'GWP'],
    initiatives: [
      {
        title: 'Инвентаризация на хладилното оборудване',
        description: 'Документирайте всяко устройство — тип газ, количество, GWP стойност.',
        due_days_from_start: 14,
      },
      {
        title: 'Проверка за течове от сертифициран техник',
        description: 'Наемете сертифициран F-газ техник за проверка на херметичността.',
        due_days_from_start: 30,
      },
      {
        title: 'Ремонт на установени течове',
        description: 'Отстранете всички течове и зарядете с регенериран хладилен агент.',
        due_days_from_start: 60,
      },
      {
        title: 'План за замяна с нискоемисионни алтернативи',
        description: 'При следваща смяна изберете оборудване с HFO или натурални хладилни агенти (R290, CO₂).',
        due_days_from_start: 180,
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'digital-paperless',
    title: 'Дигитализация и намаляване на хартията',
    description:
      'Преминаване към безхартиен работен процес чрез електронни документи, ' +
      'е-подпис и дигитални фактури. Намалява разходи, CO₂ и складово пространство.',
    category: 'behavioral',
    scope: 3,
    priority: 'low',
    difficulty: 'easy',
    estimated_reduction_co2e_min: 0.5,
    estimated_reduction_co2e_max: 5,
    estimated_cost_min: 200,
    estimated_cost_max: 3000,
    typical_months: 3,
    impact_label: '0.5 – 5 tCO₂e / год',
    tags: ['Дигитализация', 'Хартия', 'Лесно'],
    initiatives: [
      {
        title: 'Одит на употребата на хартия',
        description: 'Измерете месечния разход на хартия, мастило и принтерна поддръжка.',
        due_days_from_start: 14,
      },
      {
        title: 'Въвеждане на е-подпис и електронни документи',
        description: 'Внедрете инструмент за е-подпис (DocuSign, Adobe Sign или еквивалент) за договори.',
        due_days_from_start: 30,
      },
      {
        title: 'Политика "Print last resort"',
        description: 'Въведете правило: печат само при неизбежна нужда. Зададете двустранен печат по подразбиране.',
        due_days_from_start: 30,
      },
      {
        title: 'Дигитализация на архива',
        description: 'Сканирайте важните хартиени документи и преминете към облачно съхранение.',
        due_days_from_start: 90,
      },
    ],
  },
];

// ── Helper to get a template by ID ───────────────────────────────────────────
export function getTemplateById(id: string): StrategyTemplate | undefined {
  return STRATEGY_TEMPLATES.find(t => t.id === id);
}

// ── Difficulty labels ─────────────────────────────────────────────────────────
export const DIFFICULTY_LABELS: Record<TemplateDifficulty, string> = {
  easy:   'Лесно',
  medium: 'Средно',
  hard:   'Сложно',
};

export const DIFFICULTY_COLORS: Record<TemplateDifficulty, string> = {
  easy:   'bg-green-100 text-green-700',
  medium: 'bg-amber-100 text-amber-700',
  hard:   'bg-red-100 text-red-700',
};
