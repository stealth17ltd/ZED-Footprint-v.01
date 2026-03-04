import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Calendar, BarChart3, PieChart, Factory, Zap, Target, Activity, Leaf, ArrowRight, Receipt } from 'lucide-react';
import Link from 'next/link';
import EmissionsChart from '@/components/dashboard/EmissionsChart';
import ScopeBreakdownChart from '@/components/dashboard/ScopeBreakdownChart';
import CategoryBreakdownChart from '@/components/dashboard/CategoryBreakdownChart';
import MonthlyTrendChart from '@/components/dashboard/MonthlyTrendChart';
import EmissionsSummaryCard from '@/components/dashboard/EmissionsSummaryCard';
import TargetProgressWidget from '@/components/dashboard/TargetProgressWidget';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { ZedLogo } from '@/components/ui/zed-logo';

// Category labels
const CATEGORY_LABELS: Record<string, string> = {
  'vehicles_diesel': 'Превозни средства - Дизел',
  'vehicles_petrol': 'Превозни средства - Бензин',
  'vehicles_lpg': 'Превозни средства - ГПГ',
  'natural_gas': 'Природен газ',
  'heating_oil': 'Нафта за отопление',
  'coal': 'Въглища',
  'refrigerant_r134a': 'Хладилен агент R-134a',
  'refrigerant_r404a': 'Хладилен агент R-404A',
  'electricity': 'Електроенергия',
  'district_heating': 'Топлоенергия',
  'district_cooling': 'Хладилна енергия',
};

export default async function DashboardPage() {
  const supabase = await createClient();
  
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  // Fetch user data
  const { data: userData } = await supabase
    .from('users')
    .select('*, company:companies(*)')
    .eq('id', session.user.id)
    .single();

  // Fetch emission data for the user's company
  let emissionsData: any[] = [];
  if (userData?.company_id) {
    const { data } = await supabase
      .from('emission_data')
      .select('*')
      .eq('company_id', userData.company_id)
      .order('reporting_period', { ascending: false });
    
    emissionsData = data || [];
  }

  // Calculate totals
  const totalEmissions = emissionsData.reduce((sum, item) => sum + (item.calculated_co2e || 0), 0);
  const scope1Total = emissionsData
    .filter(item => item.scope === 1)
    .reduce((sum, item) => sum + (item.calculated_co2e || 0), 0);
  const scope2Total = emissionsData
    .filter(item => item.scope === 2)
    .reduce((sum, item) => sum + (item.calculated_co2e || 0), 0);

  // Calculate by category
  const categoryTotals = emissionsData.reduce((acc: any, item) => {
    const category = item.category || 'other';
    acc[category] = (acc[category] || 0) + (item.calculated_co2e || 0);
    return acc;
  }, {});

  // Get monthly data for chart
  const monthlyData = emissionsData.reduce((acc: any, item) => {
    const month = new Date(item.reporting_period).toLocaleString('bg-BG', { year: 'numeric', month: 'short' });
    if (!acc[month]) {
      acc[month] = { month, scope1: 0, scope2: 0, total: 0 };
    }
    if (item.scope === 1) {
      acc[month].scope1 += item.calculated_co2e || 0;
    } else {
      acc[month].scope2 += item.calculated_co2e || 0;
    }
    acc[month].total += item.calculated_co2e || 0;
    return acc;
  }, {});

  const chartData = Object.values(monthlyData).reverse().slice(-12); // Last 12 months

  // Calculate statistics for enhanced display
  const avgMonthlyEmissions = chartData.length > 0 
    ? (chartData as any[]).reduce((sum, item) => sum + item.total, 0) / chartData.length 
    : 0;
  
  // Get top emission categories
  const sortedCategories = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 5);

  // Calculate quarter data
  const currentQuarter = Math.floor(new Date().getMonth() / 3) + 1;
  const quarterData = emissionsData.filter(item => {
    const itemQuarter = Math.floor(new Date(item.reporting_period).getMonth() / 3) + 1;
    return itemQuarter === currentQuarter;
  });
  const quarterTotal = quarterData.reduce((sum, item) => sum + (item.calculated_co2e || 0), 0);

  // Recent emissions
  const recentEmissions = emissionsData.slice(0, 5);

  // Calculate percentage change (mock for now)
  const hasData = emissionsData.length > 0;
  const percentageChange = hasData ? ((Math.random() - 0.5) * 20).toFixed(1) : '0';
  const isIncrease = parseFloat(percentageChange) > 0;

  // Fetch Scope 3 summary
  let scope3Summary = null;
  if (userData?.company_id) {
    const year = new Date().getFullYear();
    const { data: scope3Emissions } = await supabase
      .from('calculated_emissions')
      .select('co2e_kg, scope_category')
      .eq('company_id', userData.company_id)
      .eq('scope', 3)
      .gte('reporting_period', `${year}-01-01`)
      .lte('reporting_period', `${year}-12-31`);

    if (scope3Emissions && scope3Emissions.length > 0) {
      const totalKg = scope3Emissions.reduce((sum, e) => sum + parseFloat(e.co2e_kg.toString()), 0);
      const byCategory: Record<number, number> = {};
      scope3Emissions.forEach(e => {
        const cat = e.scope_category || 0;
        byCategory[cat] = (byCategory[cat] || 0) + parseFloat(e.co2e_kg.toString());
      });
      const topCategory = Object.entries(byCategory).sort(([, a], [, b]) => b - a)[0];
      scope3Summary = {
        total_co2e_tons: Math.round(totalKg / 1000 * 1000) / 1000,
        calculations: scope3Emissions.length,
        top_category: topCategory ? parseInt(topCategory[0]) : null,
      };
    }

    const { data: txnCount } = await supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', userData.company_id);
    
    if (!scope3Summary) {
      scope3Summary = { total_co2e_tons: 0, calculations: 0, top_category: null, txn_count: (txnCount as any)?.count || 0 };
    } else {
      (scope3Summary as any).txn_count = (txnCount as any)?.count || 0;
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-earth-400 mb-2">
              Табло за управление
            </h1>
            <p className="text-gray-600">
              Добре дошли, {userData?.first_name} {userData?.last_name}
            </p>
          </div>
          {userData?.company && (
            <div className="text-right">
              <p className="text-sm text-gray-500">Компания</p>
              <p className="font-semibold text-gray-900">{userData.company.company_name}</p>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <EmissionsSummaryCard
            title="Общо емисии"
            value={totalEmissions}
            icon={<Target className="h-5 w-5" />}
            tooltip="Общият въглероден отпечатък на вашата организация, измерен в тонове CO₂ еквивалент (tCO₂e). Включва директни (Обхват 1) и индиректни (Обхват 2) емисии."
            colorClass="text-earth-400"
          />
          <EmissionsSummaryCard
            title="Обхват 1 - Директни"
            value={scope1Total}
            icon={<Factory className="h-5 w-5" />}
            tooltip="Директни емисии от източници, притежавани или контролирани от организацията: служебни превозни средства, гориво на място, хладилни агенти."
            colorClass="text-earth-300"
            showProgress
            totalForPercentage={totalEmissions}
          />
          <EmissionsSummaryCard
            title="Обхват 2 - Индиректни"
            value={scope2Total}
            icon={<Zap className="h-5 w-5" />}
            tooltip="Индиректни емисии от закупена енергия: електричество от мрежата, централно отопление и охлаждане."
            colorClass="text-blue-600"
            showProgress
            totalForPercentage={totalEmissions}
          />
          <EmissionsSummaryCard
            title="Средно месечно"
            value={avgMonthlyEmissions}
            icon={<Activity className="h-5 w-5" />}
            tooltip="Средната стойност на месечните емисии за периода с налични данни."
            colorClass="text-gray-700"
          />
        </div>

        {/* Scope 3 Widget */}
        <Card className="border-green-200 bg-gradient-to-r from-green-50 via-emerald-50 to-white overflow-hidden">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-green-600 flex items-center justify-center flex-shrink-0">
                  <Leaf className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-0.5">
                    Обхват 3 — Верига на стойността
                  </p>
                  {scope3Summary && scope3Summary.total_co2e_tons > 0 ? (
                    <div className="flex items-baseline gap-3">
                      <p className="text-2xl font-bold text-green-900">
                        {scope3Summary.total_co2e_tons} т CO₂e
                      </p>
                      <p className="text-sm text-green-600">
                        от {scope3Summary.calculations} изчисления
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-600 text-sm">
                      {(scope3Summary as any)?.txn_count > 0
                        ? `${(scope3Summary as any).txn_count} транзакции — изчислете емисиите`
                        : 'Импортирайте транзакции, за да започнете'
                      }
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {scope3Summary && scope3Summary.total_co2e_tons > 0 && (
                  <Link
                    href="/scope3/dashboard"
                    className="flex items-center gap-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Виж табло
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
                <Link
                  href={scope3Summary && scope3Summary.total_co2e_tons > 0 ? '/scope3/transactions' : '/scope3/import'}
                  className="flex items-center gap-1 px-4 py-2 border border-green-300 hover:bg-green-50 text-green-700 rounded-lg text-sm font-medium transition-colors"
                >
                  {scope3Summary && scope3Summary.total_co2e_tons > 0 ? (
                    <><Receipt className="h-4 w-4" /> Транзакции</>
                  ) : (
                    <><Receipt className="h-4 w-4" /> Импортирай</>
                  )}
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Target Progress Widget */}
        <TargetProgressWidget />

        {hasData ? (
          <>
            {/* Charts Section - 3 in a row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Bar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-earth-400" />
                    Месечни емисии
                  </CardTitle>
                  <CardDescription>
                    Сравнение по месеци
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <EmissionsChart data={chartData as any[]} />
                </CardContent>
              </Card>

              {/* Scope Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-earth-400" />
                    Разпределение по обхват
                  </CardTitle>
                  <CardDescription>
                    Обхват 1 vs Обхват 2
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScopeBreakdownChart scope1={scope1Total} scope2={scope2Total} />
                </CardContent>
              </Card>

              {/* Category Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-earth-400" />
                    Разпределение по категория
                  </CardTitle>
                  <CardDescription>
                    По вид източник
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CategoryBreakdownChart data={categoryTotals} labels={CATEGORY_LABELS} />
                </CardContent>
              </Card>
            </div>

            {/* Main Trend Chart - Full Width */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-earth-400" />
                      Тенденция на емисиите
                    </CardTitle>
                    <CardDescription>
                      Месечно разпределение на Обхват 1 и Обхват 2 емисии
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <InfoTooltip content="Графиката показва месечните емисии, разделени по обхват. Зелената зона е Обхват 1 (директни), синята е Обхват 2 (индиректни)." />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <MonthlyTrendChart data={chartData as any[]} />
              </CardContent>
            </Card>

            {/* Recent Emissions */}
            <Card>
              <CardHeader>
                <CardTitle>Последни въведени емисии</CardTitle>
                <CardDescription>
                  Най-новите {recentEmissions.length} записа
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentEmissions.map((emission) => (
                    <div key={emission.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {CATEGORY_LABELS[emission.category] || emission.category}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(emission.reporting_period).toLocaleDateString('bg-BG', { year: 'numeric', month: 'long' })}
                          {' • '}
                          {emission.activity_value} {emission.unit}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-earth-400">
                          {emission.calculated_co2e.toFixed(2)} tCO₂e
                        </p>
                        <p className="text-xs text-gray-500">
                          Обхват {emission.scope}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <Link 
                  href="/data-entry/list" 
                  className="block text-center mt-4 text-sm text-earth-400 hover:text-earth-500 font-medium"
                >
                  Виж всички записи →
                </Link>
              </CardContent>
            </Card>
          </>
        ) : (
          /* Empty State */
          <Card className="border-earth-200 bg-gradient-to-br from-earth-50 to-white">
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <div className="flex justify-center mb-4">
                  <ZedLogo size="xl" />
                </div>
                <h2 className="text-2xl font-bold text-earth-400 mb-2">
                  Добре дошли във вашето табло!
                </h2>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Започнете да проследявате въглеродния си отпечатък като добавите данни за емисиите на вашата компания.
                </p>
                <Link 
                  href="/data-entry"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-earth-300 hover:bg-earth-400 text-white rounded-lg font-medium transition-colors"
                >
                  <Target className="h-5 w-5" />
                  Добави първа емисия
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}