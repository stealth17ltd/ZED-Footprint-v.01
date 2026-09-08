import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchScope12Rows, getCompanyFootprint } from '@/lib/carbon/footprint-service';
import { getEvidenceCoverage, type EvidenceCoverage } from '@/lib/evidence/coverage';

export interface ScopeMonthStatus {
  month: number;   // 1-12
  label: string;
  hasScope1: boolean;
  hasScope2: boolean;
  entries: number;
}

export interface DataQualityTip {
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  action?: string;
  link?: string;
}

export interface DataQualityResult {
  year: number;
  // Scope 1+2 completeness (12 months)
  scope1Completeness: number;   // 0-100
  scope2Completeness: number;
  monthlyStatus: ScopeMonthStatus[];
  scope1Entries: number;
  scope2Entries: number;
  // Scope 3 completeness
  scope3Available: boolean;
  scope3TxTotal: number;
  scope3TxClassified: number;
  scope3TxUnclassified: number;
  scope3ClassificationRate: number;
  scope3CalculatedEntries: number;
  scope3MethodTiers: Record<string, number>;
  scope3CategoryCoverage: Record<number, number>;  // category → count of classified txs
  scope3CalcCoverage: number;                      // % classified that are also calculated
  // Targets
  hasActiveTargets: boolean;
  // Canonical footprint (FootprintService)
  footprint: {
    scope1: number;
    scope2: number;
    scope3: number;
    total: number;
  };
  // Evidence / audit trail
  evidenceCoverage: EvidenceCoverage;
  // Overall
  overallScore: number;         // 0-100 composite
  missingMonths: number[];      // months (1-12) missing BOTH scope 1 and 2
  recommendations: string[];
  tips: DataQualityTip[];       // structured, rich recommendations
}

const BG_MONTHS = ['Яну','Фев','Мар','Апр','Май','Юни','Юли','Авг','Сеп','Окт','Ное','Дек'];

const SCOPE3_CAT_NAMES: Record<number, string> = {
  1: 'Кат. 1 — Закупени стоки/услуги',
  4: 'Кат. 4 — Upstream транспорт',
  5: 'Кат. 5 — Отпадъци',
  6: 'Кат. 6 — Командировки',
  7: 'Кат. 7 — Пътуване на служители',
};

/**
 * GET /api/data-quality?year=2025
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: userData } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single();
    if (!userData?.company_id) return NextResponse.json({ error: 'No company' }, { status: 400 });

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()));
    const now  = new Date();
    const currentMonth = now.getFullYear() === year ? now.getMonth() + 1 : 12;

    // ── Scope 1 & 2 (canonical fetch) ───────────────────────────────────────
    const scope12Rows = await fetchScope12Rows(supabase, userData.company_id, year);

    const monthlyStatus: ScopeMonthStatus[] = Array.from({ length: 12 }, (_, i) => {
      const m   = i + 1;
      const pad = String(m).padStart(2, '0');
      const monthEntries = scope12Rows.filter(r => r.reporting_period?.slice(5, 7) === pad);
      return {
        month:    m,
        label:    BG_MONTHS[i],
        hasScope1: monthEntries.some(r => r.scope === 1),
        hasScope2: monthEntries.some(r => r.scope === 2),
        entries:   monthEntries.length,
      };
    });

    const activableMonths    = Math.min(currentMonth, 12);
    const scope1Months       = monthlyStatus.slice(0, activableMonths).filter(m => m.hasScope1).length;
    const scope2Months       = monthlyStatus.slice(0, activableMonths).filter(m => m.hasScope2).length;
    const scope1Completeness = activableMonths > 0 ? Math.round((scope1Months / activableMonths) * 100) : 0;
    const scope2Completeness = activableMonths > 0 ? Math.round((scope2Months / activableMonths) * 100) : 0;
    const scope1Entries      = scope12Rows.filter(r => r.scope === 1).length;
    const scope2Entries      = scope12Rows.filter(r => r.scope === 2).length;
    const missingMonths      = monthlyStatus
      .slice(0, activableMonths)
      .filter(m => !m.hasScope1 && !m.hasScope2)
      .map(m => m.month);

    const [footprint, evidenceCoverage] = await Promise.all([
      getCompanyFootprint(supabase, userData.company_id, year),
      getEvidenceCoverage(supabase, userData.company_id, year),
    ]);

    // ── Scope 3 transactions ──────────────────────────────────────────────────
    const { data: txRows } = await supabase
      .from('transactions')
      .select('id')
      .eq('company_id', userData.company_id)
      .gte('txn_date', `${year}-01-01`)
      .lte('txn_date', `${year}-12-31`);

    const txIds = (txRows ?? []).map(t => t.id);

    let s3TxClassifiedCount = 0;
    const scope3CategoryCoverage: Record<number, number> = {};

    if (txIds.length > 0) {
      const { data: classified } = await supabase
        .from('transaction_classifications')
        .select('transaction_id, scope3_category')
        .in('transaction_id', txIds);

      const classifiedIds = new Set<string>();
      (classified ?? []).forEach((c: any) => {
        classifiedIds.add(c.transaction_id);
        const cat = c.scope3_category as number;
        scope3CategoryCoverage[cat] = (scope3CategoryCoverage[cat] ?? 0) + 1;
      });
      s3TxClassifiedCount = classifiedIds.size;
    }

    // ── Scope 3 calculations — filter by reporting_period, not calculated_at
    // (calculations may be run later, e.g. 2025 data calculated in 2026)
    const { data: calcRows } = await supabase
      .from('calculated_emissions')
      .select('method_tier')
      .eq('company_id', userData.company_id)
      .gte('reporting_period', `${year}-01-01`)
      .lte('reporting_period', `${year}-12-31`);

    const s3TxTotal       = txIds.length;
    const s3TxClassified  = s3TxClassifiedCount;
    const s3ClassRate     = s3TxTotal > 0 ? Math.round((s3TxClassified / s3TxTotal) * 100) : 0;
    const scope3Available = s3TxTotal > 0;

    const methodTiers: Record<string, number> = {};
    (calcRows ?? []).forEach(r => {
      const t = r.method_tier ? `Ниво ${r.method_tier}` : 'Ниво C';
      methodTiers[t] = (methodTiers[t] ?? 0) + 1;
    });

    const scope3CalcCoverage = s3TxClassified > 0
      ? Math.min(100, Math.round(((calcRows ?? []).length / s3TxClassified) * 100))
      : 0;

    // ── Active targets ────────────────────────────────────────────────────────
    const { count: targetCount } = await supabase
      .from('emission_targets')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', userData.company_id)
      .eq('status', 'active');
    const hasActiveTargets = (targetCount ?? 0) > 0;

    // ── Overall score ─────────────────────────────────────────────────────────
    const components = [scope1Completeness, scope2Completeness];
    if (scope3Available) components.push(s3ClassRate);
    if (evidenceCoverage.scope12Entries > 0) {
      components.push(evidenceCoverage.coveragePercent);
    }
    const overallScore = Math.round(components.reduce((a, b) => a + b, 0) / components.length);

    // ── Simple recommendations (backward compat) ──────────────────────────────
    const recs: string[] = [];
    if (missingMonths.length > 0) {
      recs.push(`Липсват данни за ${missingMonths.length} месец${missingMonths.length > 1 ? 'а' : ''} — добавете Обхват 1&2 записи.`);
    }
    if (scope1Completeness < 80) {
      recs.push('Обхват 1 данните са под 80% пълнота — проверете фактури за гориво и хладилни агенти.');
    }
    if (scope2Completeness < 80) {
      recs.push('Обхват 2 данните са под 80% пълнота — добавете месечните сметки за ток и топлоенергия.');
    }
    if (scope3Available && s3ClassRate < 70) {
      recs.push(`${s3TxTotal - s3TxClassified} некласифицирани транзакции намаляват точността на Обхват 3.`);
    }
    if (!scope3Available) {
      recs.push('Нямате Обхват 3 данни — импортирайте финансови транзакции за пълна картина.');
    }
    if (overallScore >= 90) {
      recs.push('Отлично качество на данните! Готови сте за одит.');
    }

    // ── Rich structured tips ──────────────────────────────────────────────────
    const tips: DataQualityTip[] = [];

    // ── Critical ──
    if (!scope3Available) {
      tips.push({
        type: 'critical',
        title: 'Нямате Обхват 3 данни',
        description: 'При повечето компании Обхват 3 съставлява 70–90% от въглеродния отпечатък. Импортирайте финансови транзакции (CSV от счетоводния ви софтуер), за да получите пълна картина.',
        action: 'Импортирай транзакции',
        link: '/scope3/import',
      });
    }

    if (missingMonths.length >= 6) {
      tips.push({
        type: 'critical',
        title: `Липсват данни за ${missingMonths.length} месеца от годината`,
        description: 'За надежден CSRD-съвместим отчет са необходими данни за всичките 12 месеца. Проверете фактурите си и добавете месечни записи за Обхват 1 (гориво, газ) и Обхват 2 (ток, топлоенергия).',
        action: 'Добави данни',
        link: '/data-entry',
      });
    }

    // ── Warnings ──
    if (scope3Available && s3ClassRate < 70) {
      tips.push({
        type: 'warning',
        title: `${s3TxTotal - s3TxClassified} некласифицирани транзакции`,
        description: 'Некласифицираните транзакции не участват в изчисленията и изкривяват картината. Прегледайте ги и добавете правила за автоматична класификация — след като ги зададете веднъж, важат за бъдещи импорти.',
        action: 'Класифицирай сега',
        link: '/scope3/classify',
      });
    }

    if (scope3Available && s3ClassRate >= 70 && scope3CalcCoverage < 80) {
      tips.push({
        type: 'warning',
        title: 'Не всички класифицирани транзакции са изчислени',
        description: `Само ${scope3CalcCoverage}% от класифицираните транзакции имат изчислени CO2e емисии. Отворете Табло Обхват 3 и натиснете "Изчисли сега", за да получите точни стойности.`,
        action: 'Изчисли емисии',
        link: '/scope3/dashboard',
      });
    }

    if (!hasActiveTargets) {
      tips.push({
        type: 'warning',
        title: 'Нямате активни цели за намаление',
        description: 'Science-Based Targets (SBTi) и CSRD ESRS E1 изискват поставяне на измерими цели за намаление. Препоръчваме цел от поне 4.2% намаление годишно, за да сте в съответствие с Парижкото споразумение.',
        action: 'Постави цел',
        link: '/targets',
      });
    }

    const tierDCount = methodTiers['Ниво D'] ?? 0;
    const totalCalcs = (calcRows ?? []).length;
    if (totalCalcs > 0 && tierDCount / totalCalcs > 0.4) {
      tips.push({
        type: 'warning',
        title: 'Голяма част от изчисленията са с ниска точност (Ниво D)',
        description: `${Math.round(tierDCount / totalCalcs * 100)}% от Обхват 3 изчисленията са базирани на прокси оценки (Ниво D), което намалява доверието в отчета. Добавете физически данни (кг, км, kWh) там, където е възможно, за да преминете към Ниво B или C.`,
      });
    }

    // ── Category gaps ──
    const coveredCats = Object.keys(scope3CategoryCoverage).map(Number);
    const ALL_CATS = [1, 4, 5, 6, 7];
    const missingCats = ALL_CATS.filter(c => !coveredCats.includes(c));

    if (scope3Available && missingCats.length > 0) {
      tips.push({
        type: 'info',
        title: `${missingCats.length} Обхват 3 категории без данни`,
        description: `Следните категории нямат транзакции: ${missingCats.map(c => SCOPE3_CAT_NAMES[c]).join(', ')}. Проверете дали тези разходи са приложими за вашия бизнес — ако са, добавете данни за по-пълен отчет.`,
        action: 'Виж транзакции',
        link: '/scope3/transactions',
      });
    }

    if (evidenceCoverage.scope12Entries > 0 && evidenceCoverage.coveragePercent < 50) {
      tips.push({
        type: 'warning',
        title: `Само ${evidenceCoverage.coveragePercent}% от записите имат документ`,
        description: `${evidenceCoverage.scope12WithEvidence} от ${evidenceCoverage.scope12Entries} емисионни записа имат прикачен източник (фактура, показание). CSRD и одит изискват проследимост до първични документи.`,
        action: 'Прикачи документи',
        link: '/data-entry/list',
      });
    }

    if (evidenceCoverage.coveragePercent >= 80 && evidenceCoverage.scope12Entries >= 6) {
      tips.push({
        type: 'success',
        title: 'Добро покритие с доказателства',
        description: `${evidenceCoverage.coveragePercent}% от Обхват 1+2 записите имат прикачен документ — подобрява одитната следа в CSRD отчетите.`,
      });
    }

    // ── Info / best practices ──
    tips.push({
      type: 'info',
      title: 'Поискайте данни от ключовите доставчици',
      description: 'Специфичните емисионни данни от доставчици (Ниво A) са до 10 пъти по-точни от разходния метод. Помолете топ 5 доставчика по стойност за техния въглероден отпечатък или EPD (Environmental Product Declaration).',
    });

    tips.push({
      type: 'info',
      title: 'Месечният ритъм намалява усилието',
      description: 'Компании, добавящи данни всеки месец, прекарват средно 10 минути на актуализация срещу 3-4 часа при годишно въвеждане. Задайте напомняне за последния ден от всеки месец.',
    });

    if (scope3Available && s3ClassRate >= 90) {
      tips.push({
        type: 'info',
        title: 'Разгледайте Обхват 3 Категория 11 — Продукти',
        description: 'При производствени компании Категория 11 (Използване на продадени продукти) може да е значителна. Тя изисква оценка на жизнения цикъл (LCA), но базова оценка може да се направи от информацията за продуктите.',
      });
    }

    // ── Successes ──
    if (scope1Completeness >= 80 && scope2Completeness >= 80) {
      tips.push({
        type: 'success',
        title: 'Обхват 1 & 2 данните са добре покрити',
        description: 'Имате достатъчно данни за генериране на надежден Обхват 1+2 отчет. Можете да генерирате PDF отчет или CSRD доклад.',
        action: 'Генерирай отчет',
        link: '/reports',
      });
    }

    if (scope3Available && s3ClassRate === 100 && scope3CalcCoverage >= 90) {
      tips.push({
        type: 'success',
        title: '100% класифицирани и изчислени транзакции',
        description: 'Всички Обхват 3 транзакции са класифицирани и изчислени. Данните ви са готови за включване в CSRD и пълен отчет Обхват 1+2+3.',
        action: 'Пълен отчет',
        link: '/reports?type=full',
      });
    }

    if (overallScore >= 85 && hasActiveTargets) {
      tips.push({
        type: 'success',
        title: 'Готови за CSRD проверка',
        description: 'Качеството на данните е достатъчно за генериране на CSRD-съвместим отчет с пълна одитна следа. Имате и активни цели за намаление — отчетът може да включва ESRS E1 прогрес.',
        action: 'CSRD Отчет',
        link: '/reports?type=csrd',
      });
    }

    const result: DataQualityResult = {
      year,
      scope1Completeness,
      scope2Completeness,
      monthlyStatus,
      scope1Entries,
      scope2Entries,
      scope3Available,
      scope3TxTotal:            s3TxTotal,
      scope3TxClassified:       s3TxClassified,
      scope3TxUnclassified:     s3TxTotal - s3TxClassified,
      scope3ClassificationRate: s3ClassRate,
      scope3CalculatedEntries:  (calcRows ?? []).length,
      scope3MethodTiers:        methodTiers,
      scope3CategoryCoverage,
      scope3CalcCoverage,
      hasActiveTargets,
      footprint: {
        scope1: footprint.scope1,
        scope2: footprint.scope2,
        scope3: footprint.scope3,
        total: footprint.total,
      },
      evidenceCoverage,
      overallScore,
      missingMonths,
      recommendations: recs,
      tips,
    };

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error('Data quality error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
