import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  BarChart3,
  PieChart,
  Factory,
  Zap,
  Target,
  Leaf,
  Globe2,
  Users,
  ArrowRight,
  Plus,
  Upload,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import EmissionsChart from '@/components/dashboard/EmissionsChart';
import ScopeBreakdownChart from '@/components/dashboard/ScopeBreakdownChart';
import CategoryBreakdownChart from '@/components/dashboard/CategoryBreakdownChart';
import MonthlyTrendChart from '@/components/dashboard/MonthlyTrendChart';
import EmissionsSummaryCard from '@/components/dashboard/EmissionsSummaryCard';
import TargetProgressWidget from '@/components/dashboard/TargetProgressWidget';
import DataQualityWidget from '@/components/dashboard/DataQualityWidget';
import StrategiesProgressWidget from '@/components/dashboard/StrategiesProgressWidget';
import YearSelector from '@/components/dashboard/YearSelector';
import { InfoTooltip } from '@/components/ui/info-tooltip';

const CATEGORY_LABELS: Record<string, string> = {
  vehicles_diesel: 'Превозни средства - Дизел',
  vehicles_petrol: 'Превозни средства - Бензин',
  vehicles_lpg: 'Превозни средства - ГПГ',
  natural_gas: 'Природен газ',
  heating_oil: 'Нафта за отопление',
  coal: 'Въглища',
  refrigerant_r134a: 'Хладилен агент R-134a',
  refrigerant_r404a: 'Хладилен агент R-404A',
  electricity: 'Електроенергия',
  district_heating: 'Топлоенергия',
  district_cooling: 'Хладилна енергия',
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect('/login');

  // Fetch user + company
  const { data: userData } = await supabase
    .from('users')
    .select('*, company:companies(*)')
    .eq('id', session.user.id)
    .single();

  // Fetch all emission data for this company
  let emissionsData: any[] = [];
  if (userData?.company_id) {
    const { data } = await supabase
      .from('emission_data')
      .select('*')
      .eq('company_id', userData.company_id)
      .order('reporting_period', { ascending: false });
    emissionsData = data || [];
  }

  // ── Year selection ───────────────────────────────────────────────────────────
  const params = await searchParams;
  const nowYear = new Date().getFullYear();

  // Collect years that have data
  const dataYears = [
    ...new Set(
      emissionsData.map((i) => new Date(i.reporting_period).getFullYear()),
    ),
  ].sort((a, b) => b - a); // newest first

  // Always include the current real year
  if (!dataYears.includes(nowYear)) dataYears.unshift(nowYear);

  // Resolve selected year from URL param, default to current real year
  const selectedYear =
    params.year && dataYears.includes(parseInt(params.year))
      ? parseInt(params.year)
      : nowYear;

  const prevYear = selectedYear - 1;

  // For the current year, compare only months elapsed so far (fair comparison).
  // For past years, compare the full year against the full year before it.
  const isCurrentYear = selectedYear === nowYear;
  const currentMonthIndex = new Date().getMonth(); // 0-11

  // ── Year-over-year calculations ─────────────────────────────────────────────
  const ytdData = emissionsData.filter(
    (i) => new Date(i.reporting_period).getFullYear() === selectedYear,
  );
  // Same months previous year for a fair comparison
  const prevYearData = emissionsData.filter((i) => {
    const d = new Date(i.reporting_period);
    if (d.getFullYear() !== prevYear) return false;
    return isCurrentYear ? d.getMonth() <= currentMonthIndex : true;
  });

  const sum = (arr: any[]) =>
    arr.reduce((s, i) => s + (i.calculated_co2e || 0), 0);

  const ytdTotal = sum(ytdData);
  const ytdScope1 = sum(ytdData.filter((i) => i.scope === 1));
  const ytdScope2 = sum(ytdData.filter((i) => i.scope === 2));

  const prevTotal = sum(prevYearData);
  const prevScope1 = sum(prevYearData.filter((i) => i.scope === 1));
  const prevScope2 = sum(prevYearData.filter((i) => i.scope === 2));

  const yoyTotal = prevTotal > 0 ? ((ytdTotal - prevTotal) / prevTotal) * 100 : null;
  const yoyScope1 = prevScope1 > 0 ? ((ytdScope1 - prevScope1) / prevScope1) * 100 : null;
  const yoyScope2 = prevScope2 > 0 ? ((ytdScope2 - prevScope2) / prevScope2) * 100 : null;

  // Intensity per employee
  const employeeCount: number | null = userData?.company?.employee_count || null;
  const intensityPerEmployee =
    employeeCount && ytdTotal > 0
      ? parseFloat((ytdTotal / employeeCount).toFixed(3))
      : null;

  // Category breakdown (all time for chart)
  const categoryTotals = emissionsData.reduce((acc: any, item) => {
    const cat = item.category || 'other';
    acc[cat] = (acc[cat] || 0) + (item.calculated_co2e || 0);
    return acc;
  }, {});

  // Monthly chart data (last 12 months)
  const monthlyMap = emissionsData.reduce((acc: any, item) => {
    const month = new Date(item.reporting_period).toLocaleString('bg-BG', {
      year: 'numeric',
      month: 'short',
    });
    if (!acc[month]) acc[month] = { month, scope1: 0, scope2: 0, total: 0 };
    if (item.scope === 1) acc[month].scope1 += item.calculated_co2e || 0;
    else acc[month].scope2 += item.calculated_co2e || 0;
    acc[month].total += item.calculated_co2e || 0;
    return acc;
  }, {});
  const chartData = (Object.values(monthlyMap) as any[]).reverse().slice(-12);

  const hasData = emissionsData.length > 0;

  // Recent entries
  const recentEmissions = emissionsData.slice(0, 5);

  // ── Scope 3 summary ─────────────────────────────────────────────────────────
  let scope3Summary: {
    total_co2e_tons: number;
    calculations: number;
    top_category: number | null;
    txn_count: number;
  } = { total_co2e_tons: 0, calculations: 0, top_category: null, txn_count: 0 };

  if (userData?.company_id) {
    const { data: scope3Emissions } = await supabase
      .from('calculated_emissions')
      .select('co2e_kg, scope_category')
      .eq('company_id', userData.company_id)
      .eq('scope', 3)
      .gte('reporting_period', `${selectedYear}-01-01`)
      .lte('reporting_period', `${selectedYear}-12-31`);

    if (scope3Emissions && scope3Emissions.length > 0) {
      const totalKg = scope3Emissions.reduce(
        (s, e) => s + parseFloat(e.co2e_kg.toString()),
        0,
      );
      const byCategory: Record<number, number> = {};
      scope3Emissions.forEach((e) => {
        const cat = e.scope_category || 0;
        byCategory[cat] = (byCategory[cat] || 0) + parseFloat(e.co2e_kg.toString());
      });
      const topEntry = Object.entries(byCategory).sort(([, a], [, b]) => b - a)[0];
      scope3Summary.total_co2e_tons = Math.round((totalKg / 1000) * 1000) / 1000;
      scope3Summary.calculations = scope3Emissions.length;
      scope3Summary.top_category = topEntry ? parseInt(topEntry[0]) : null;
    }

    const { count: txnCount } = await supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', userData.company_id);
    scope3Summary.txn_count = txnCount || 0;
  }

  // ── Insight sentence ─────────────────────────────────────────────────────────
  type InsightType = 'good' | 'warn' | 'neutral';
  const insight: { text: string; type: InsightType } | null = (() => {
    if (!hasData) return null;
    if (yoyTotal !== null) {
      if (yoyTotal <= -5)
        return {
          text: `Емисиите са намалели с ${Math.abs(yoyTotal).toFixed(1)}% спрямо ${prevYear} г. — отличен напредък`,
          type: 'good',
        };
      if (yoyTotal >= 10)
        return {
          text: `Емисиите са нараснали с ${yoyTotal.toFixed(1)}% спрямо ${prevYear} г. — прегледайте основните източници`,
          type: 'warn',
        };
      if (yoyTotal > 0)
        return {
          text: `Леко нарастване от +${yoyTotal.toFixed(1)}% спрямо ${prevYear} г.`,
          type: 'neutral',
        };
      return {
        text: `Стабилни емисии спрямо ${prevYear} г. (${yoyTotal.toFixed(1)}%)`,
        type: 'neutral',
      };
    }
    return {
      text: `${ytdTotal.toFixed(1)} tCO₂e регистрирани за ${selectedYear} г.`,
      type: 'neutral',
    };
  })();

  const insightColorClass =
    insight?.type === 'good'
      ? 'text-emerald-700'
      : insight?.type === 'warn'
        ? 'text-amber-700'
        : 'text-gray-500';

  const InsightIcon =
    insight?.type === 'good'
      ? TrendingDown
      : insight?.type === 'warn'
        ? TrendingUp
        : Minus;

  const deltaLabel = prevTotal > 0 ? `vs ${prevYear}` : undefined;

  // Scope 3 card subtitle
  const scope3Subtitle =
    scope3Summary.total_co2e_tons > 0
      ? `${scope3Summary.calculations} изчисления · виж детайли`
      : scope3Summary.txn_count > 0
        ? `${scope3Summary.txn_count} транзакции — изчисли`
        : 'Импортирай транзакции →';

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <h1 className="text-2xl font-bold text-gray-900">Табло за управление</h1>
              <YearSelector years={dataYears} selectedYear={selectedYear} />
            </div>
            {insight ? (
              <p className={`text-sm flex items-center gap-1.5 ${insightColorClass}`}>
                <InsightIcon className="h-3.5 w-3.5 flex-shrink-0" />
                {insight.text}
              </p>
            ) : (
              <p className="text-sm text-gray-500">
                Добре дошли, {userData?.first_name}! Добавете данни, за да видите анализ.
              </p>
            )}
          </div>

          {userData?.company && (
            <div className="text-right hidden sm:block">
              <p className="text-xs text-gray-400">Организация</p>
              <p className="font-semibold text-gray-800 text-sm">{userData.company.company_name}</p>
            </div>
          )}
        </div>

        {/* ── 5 KPI cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">

          {/* Total YTD */}
          <EmissionsSummaryCard
            title={`Общо ${selectedYear}`}
            value={ytdTotal}
            icon={<Leaf className="h-5 w-5" />}
            tooltip="Общият въглероден отпечатък за текущата година (Обхват 1 + 2). Измерен в тонове CO₂ еквивалент (tCO₂e)."
            iconBgClass="bg-[#C5E1A5]/30"
            colorClass="text-earth-400"
            delta={yoyTotal}
            deltaLabel={deltaLabel}
            highlight
            emptyLabel={!hasData ? 'Все още няма данни' : undefined}
          />

          {/* Scope 1 */}
          <EmissionsSummaryCard
            title="Обхват 1 — Директни"
            value={ytdScope1}
            icon={<Factory className="h-5 w-5" />}
            tooltip="Директни емисии от собствени източници: превозни средства, гориво, хладилни агенти."
            iconBgClass="bg-orange-50"
            colorClass="text-orange-600"
            delta={yoyScope1}
            deltaLabel={deltaLabel}
            showProgress
            totalForPercentage={ytdTotal}
          />

          {/* Scope 2 */}
          <EmissionsSummaryCard
            title="Обхват 2 — Индиректни"
            value={ytdScope2}
            icon={<Zap className="h-5 w-5" />}
            tooltip="Индиректни емисии от закупена енергия: електричество, централно отопление и охлаждане."
            iconBgClass="bg-blue-50"
            colorClass="text-blue-600"
            delta={yoyScope2}
            deltaLabel={deltaLabel}
            showProgress
            totalForPercentage={ytdTotal}
          />

          {/* Scope 3 */}
          <EmissionsSummaryCard
            title="Обхват 3 — Верига"
            value={scope3Summary.total_co2e_tons}
            icon={<Globe2 className="h-5 w-5" />}
            tooltip="Индиректни емисии по веригата на стойността: закупени стоки, транспорт, бизнес пътувания и др."
            iconBgClass="bg-emerald-50"
            colorClass="text-emerald-600"
            subtitle={scope3Subtitle}
            href={
              scope3Summary.total_co2e_tons > 0
                ? '/scope3/dashboard'
                : scope3Summary.txn_count > 0
                  ? '/scope3/classify'
                  : '/scope3/import'
            }
            emptyLabel={scope3Summary.total_co2e_tons === 0 ? scope3Subtitle : undefined}
          />

          {/* Intensity per employee */}
          <EmissionsSummaryCard
            title="Интензитет"
            value={intensityPerEmployee ?? 0}
            unit="tCO₂e / служ."
            icon={<Users className="h-5 w-5" />}
            tooltip="Въглероден интензитет на служител за текущата година. Изчислява се от общите Обхват 1+2 емисии спрямо броя на служителите."
            iconBgClass="bg-purple-50"
            colorClass="text-purple-600"
            emptyLabel={
              !intensityPerEmployee
                ? employeeCount
                  ? 'Няма данни за емисии'
                  : 'Добави брой служители'
                : undefined
            }
            subtitle={
              intensityPerEmployee && employeeCount
                ? `${employeeCount} служители · ${selectedYear}`
                : undefined
            }
            href={!employeeCount ? '/settings/company' : undefined}
          />
        </div>

        {/* ── Targets · Strategies · Data Quality ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <TargetProgressWidget />
          <StrategiesProgressWidget />
          <DataQualityWidget year={selectedYear} />
        </div>

        {hasData ? (
          <>
            {/* ── Charts (3 columns) ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BarChart3 className="h-4 w-4 text-earth-400" />
                    Месечни емисии
                  </CardTitle>
                  <CardDescription>Последните 12 месеца</CardDescription>
                </CardHeader>
                <CardContent>
                  <EmissionsChart data={chartData} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <PieChart className="h-4 w-4 text-earth-400" />
                    По обхват
                  </CardTitle>
                  <CardDescription>Обхват 1 vs Обхват 2</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScopeBreakdownChart scope1={ytdScope1} scope2={ytdScope2} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BarChart3 className="h-4 w-4 text-earth-400" />
                    По категория
                  </CardTitle>
                  <CardDescription>По вид източник</CardDescription>
                </CardHeader>
                <CardContent>
                  <CategoryBreakdownChart data={categoryTotals} labels={CATEGORY_LABELS} />
                </CardContent>
              </Card>
            </div>

            {/* ── Trend chart (full width) ── */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Calendar className="h-4 w-4 text-earth-400" />
                      Тенденция на емисиите
                    </CardTitle>
                    <CardDescription>
                      Месечно разпределение на Обхват 1 и Обхват 2
                    </CardDescription>
                  </div>
                  <InfoTooltip content="Зелената зона е Обхват 1 (директни), синята е Обхват 2 (индиректни)." />
                </div>
              </CardHeader>
              <CardContent>
                <MonthlyTrendChart data={chartData} />
              </CardContent>
            </Card>

            {/* ── Recent entries ── */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Последни записи</CardTitle>
                    <CardDescription>Най-новите {recentEmissions.length} записа</CardDescription>
                  </div>
                  <Link
                    href="/data-entry/list"
                    className="flex items-center gap-1 text-xs text-earth-400 hover:text-earth-500 font-medium"
                  >
                    Виж всички <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {recentEmissions.map((emission) => (
                    <div
                      key={emission.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 text-sm truncate">
                          {CATEGORY_LABELS[emission.category] || emission.category}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(emission.reporting_period).toLocaleDateString('bg-BG', {
                            year: 'numeric',
                            month: 'long',
                          })}
                          {' · '}
                          {emission.activity_value} {emission.unit}
                        </p>
                      </div>
                      <div className="text-right ml-4 flex-shrink-0">
                        <p className="font-bold text-earth-400 text-sm">
                          {(emission.calculated_co2e || 0).toFixed(2)} tCO₂e
                        </p>
                        <p className="text-xs text-gray-400">Обхват {emission.scope}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          /* ── Empty state ── */
          <div className="space-y-4">
            <p className="text-sm font-medium text-gray-500 px-1">Започнете в 3 стъпки:</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  href: '/data-entry',
                  icon: <Plus className="h-6 w-6 text-earth-400" />,
                  iconBg: 'bg-[#C5E1A5]/30',
                  title: 'Въведи емисии',
                  desc: 'Добави ръчно данни за Обхват 1 и 2 — гориво, електричество, хладилни агенти.',
                  cta: 'Добави запис',
                  ctaClass: 'text-earth-400 hover:text-earth-500',
                },
                {
                  href: '/scope3/import',
                  icon: <Upload className="h-6 w-6 text-blue-600" />,
                  iconBg: 'bg-blue-50',
                  title: 'Импортирай Обхват 3',
                  desc: 'Качи CSV с транзакции от счетоводен софтуер — ние автоматично ги класифицираме.',
                  cta: 'Импортирай CSV',
                  ctaClass: 'text-blue-600 hover:text-blue-700',
                },
                {
                  href: '/targets',
                  icon: <Target className="h-6 w-6 text-purple-600" />,
                  iconBg: 'bg-purple-50',
                  title: 'Постави цели',
                  desc: 'Дефинирай цели за намаляване и проследявай напредъка спрямо базова година.',
                  cta: 'Създай цел',
                  ctaClass: 'text-purple-600 hover:text-purple-700',
                },
              ].map(({ href, icon, iconBg, title, desc, cta, ctaClass }) => (
                <Link key={href} href={href}>
                  <Card className="border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-200 h-full cursor-pointer">
                    <CardContent className="p-5">
                      <div className={`h-11 w-11 rounded-xl flex items-center justify-center mb-4 ${iconBg}`}>
                        {icon}
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1 text-sm">{title}</h3>
                      <p className="text-xs text-gray-500 mb-4 leading-relaxed">{desc}</p>
                      <span className={`text-xs font-semibold flex items-center gap-1 ${ctaClass}`}>
                        {cta} <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
