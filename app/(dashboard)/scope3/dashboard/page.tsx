'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  Leaf, TrendingUp, Receipt, Tag, Calculator, AlertTriangle,
  CheckCircle, BarChart3, PieChart as PieChartIcon, Building2,
  ArrowRight, RefreshCw, Loader2, Star, FileText, Upload
} from 'lucide-react';

// Category colors
const CATEGORY_COLORS: Record<number, string> = {
  1: '#16a34a',
  4: '#2563eb',
  5: '#9333ea',
  6: '#ea580c',
  7: '#0891b2',
};

const CATEGORY_SHORT: Record<number, string> = {
  1: 'Кат. 1',
  4: 'Кат. 4',
  5: 'Кат. 5',
  6: 'Кат. 6',
  7: 'Кат. 7',
};

const TIER_COLORS: Record<string, string> = {
  A: '#16a34a',
  B: '#2563eb',
  C: '#ea580c',
  D: '#9ca3af',
};

interface DashboardData {
  year: string;
  summary: {
    total_co2e_tons: number;
    total_transactions: number;
    classified_transactions: number;
    unclassified_transactions: number;
    classification_rate: number;
    total_spend_eur: number;
    total_calculations: number;
  };
  by_category: Array<{
    category: number;
    label: string;
    shortLabel: string;
    co2e_tons: number;
    count: number;
    percentage: number;
  }>;
  monthly_trend: Array<{ month: string; co2e_tons: number }>;
  top_suppliers: Array<{
    supplier: string;
    co2e_tons: number;
    spend: number;
    txn_count: number;
  }>;
  method_quality: Array<{
    tier: string;
    count: number;
    co2e_kg: number;
    label: string;
  }>;
  scope_comparison: {
    scope1: number;
    scope2: number;
    scope3: number;
    total: number;
  };
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
        <p className="font-medium text-gray-900 mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }}>
            {p.name}: <strong>{p.value} т CO₂e</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Scope3DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [refreshing, setRefreshing] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2];

  useEffect(() => {
    fetchDashboard();
  }, [year]);

  const fetchDashboard = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch(`/api/scope3/dashboard?year=${year}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error('Dashboard error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-500">Зареждане на данни...</p>
        </div>
      </div>
    );
  }

  const hasEmissions = data && data.summary.total_co2e_tons > 0;
  const hasTransactions = data && data.summary.total_transactions > 0;

  // Pie data for scope comparison
  const scopeComparisonData = data ? [
    { name: 'Обхват 1', value: data.scope_comparison.scope1, color: '#16a34a' },
    { name: 'Обхват 2', value: data.scope_comparison.scope2, color: '#2563eb' },
    { name: 'Обхват 3', value: data.scope_comparison.scope3, color: '#ea580c' },
  ].filter(d => d.value > 0) : [];

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
              <Leaf className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Табло Обхват 3</h1>
              <p className="text-sm text-gray-500">
                Въглеродни емисии от веригата на стойността
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Year picker */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {years.map(y => (
                <button
                  key={y}
                  onClick={() => setYear(y.toString())}
                  className={`px-3 py-1.5 text-sm rounded-md font-medium transition-all ${
                    year === y.toString()
                      ? 'bg-white shadow text-green-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchDashboard(true)}
              disabled={refreshing}
            >
              {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-green-100 bg-gradient-to-br from-green-50 to-white">
            <CardContent className="pt-5">
              <div className="flex items-center gap-2 mb-2">
                <Leaf className="h-4 w-4 text-green-600" />
                <span className="text-xs font-medium text-green-700 uppercase tracking-wide">Общо CO₂e</span>
              </div>
              <p className="text-3xl font-bold text-green-900">
                {data?.summary.total_co2e_tons.toFixed(2) || '0.00'}
              </p>
              <p className="text-sm text-green-600 mt-1">тона CO₂e</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-2 mb-2">
                <Receipt className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Транзакции</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {data?.summary.total_transactions || 0}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {data?.summary.total_spend_eur.toLocaleString('bg-BG', { maximumFractionDigits: 0 })} EUR
              </p>
            </CardContent>
          </Card>

          <Card className={data?.summary.classification_rate === 100 ? 'border-green-200' : 'border-orange-200'}>
            <CardContent className="pt-5">
              <div className="flex items-center gap-2 mb-2">
                <Tag className="h-4 w-4 text-gray-500" />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Класифицирани</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {data?.summary.classification_rate || 0}%
              </p>
              <p className="text-sm mt-1">
                <span className="text-green-600">{data?.summary.classified_transactions || 0}</span>
                <span className="text-gray-400"> / {data?.summary.total_transactions || 0}</span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="h-4 w-4 text-gray-500" />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Изчисления</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {data?.summary.total_calculations || 0}
              </p>
              <p className="text-sm text-gray-500 mt-1">CO₂e изчисления</p>
            </CardContent>
          </Card>
        </div>

        {/* Unclassified Alert */}
        {data && data.summary.unclassified_transactions > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-orange-900">
                      {data.summary.unclassified_transactions} некласифицирани транзакции
                    </p>
                    <p className="text-sm text-orange-700">
                      Класифицирайте ги за по-точни изчисления
                    </p>
                  </div>
                </div>
                <Link href="/scope3/classify">
                  <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white">
                    Класифицирай <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {!hasTransactions ? (
          /* Empty State */
          <Card className="border-dashed border-2 border-gray-200">
            <CardContent className="py-16 text-center">
              <Leaf className="mx-auto h-14 w-14 text-gray-200 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Няма данни за {year} г.
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Импортирайте финансови транзакции, за да видите вашите Обхват 3 емисии
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link href="/invoice-import">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                    <FileText className="h-4 w-4" />
                    Импорт от фактури
                  </Button>
                </Link>
                <Link href="/scope3/import">
                  <Button className="bg-green-600 hover:bg-green-700 text-white gap-2">
                    <Upload className="h-4 w-4" />
                    Импортирай CSV
                  </Button>
                </Link>
                <Link href="/scope3/transactions">
                  <Button variant="outline">Въведи ръчно</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Row 1: Category bar + Monthly trend */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Emissions by Category */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BarChart3 className="h-4 w-4 text-green-600" />
                    Емисии по категория
                  </CardTitle>
                  <CardDescription>Обхват 3 разпределение, тона CO₂e</CardDescription>
                </CardHeader>
                <CardContent>
                  {hasEmissions ? (
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={data.by_category} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                          dataKey="shortLabel"
                          tick={{ fontSize: 11, fill: '#6b7280' }}
                        />
                        <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="co2e_tons" name="CO₂e" radius={[4, 4, 0, 0]}>
                          {data.by_category.map((entry) => (
                            <Cell
                              key={entry.category}
                              fill={CATEGORY_COLORS[entry.category] || '#16a34a'}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-60 flex items-center justify-center text-gray-400 text-sm">
                      Няма изчислени емисии.{' '}
                      <Link href="/scope3/transactions" className="text-green-600 ml-1 underline">
                        Изчисли сега
                      </Link>
                    </div>
                  )}

                  {/* Category legend */}
                  {hasEmissions && (
                    <div className="mt-3 space-y-1.5">
                      {data.by_category.map(cat => (
                        <div key={cat.category} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: CATEGORY_COLORS[cat.category] || '#16a34a' }}
                            />
                            <span className="text-gray-600 truncate max-w-[180px]">{cat.label}</span>
                          </div>
                          <div className="flex items-center gap-2 ml-2">
                            <span className="font-semibold text-gray-900">{cat.co2e_tons.toFixed(3)} т</span>
                            <Badge variant="secondary" className="text-xs px-1.5 py-0">{cat.percentage}%</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Monthly Trend */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    Месечна тенденция
                  </CardTitle>
                  <CardDescription>CO₂e емисии по месец, {year} г.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={data.monthly_trend} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="co2e_tons"
                        name="CO₂e"
                        stroke="#16a34a"
                        strokeWidth={2.5}
                        dot={{ fill: '#16a34a', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>

                  {/* Monthly summary */}
                  <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-gray-50 rounded-lg p-2.5">
                      <p className="text-gray-500">Пик</p>
                      <p className="font-bold text-gray-900 mt-0.5">
                        {Math.max(...data.monthly_trend.map(m => m.co2e_tons)).toFixed(3)} т
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2.5">
                      <p className="text-gray-500">Средно / месец</p>
                      <p className="font-bold text-gray-900 mt-0.5">
                        {(data.monthly_trend.filter(m => m.co2e_tons > 0).length > 0
                          ? data.summary.total_co2e_tons / data.monthly_trend.filter(m => m.co2e_tons > 0).length
                          : 0
                        ).toFixed(3)} т
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Row 2: Scope comparison + Method quality */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* All Scopes Pie */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <PieChartIcon className="h-4 w-4 text-green-600" />
                    Всички обхвати
                  </CardTitle>
                  <CardDescription>Обхват 1 + 2 + 3 сравнение</CardDescription>
                </CardHeader>
                <CardContent>
                  {scopeComparisonData.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie
                            data={scopeComparisonData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {scopeComparisonData.map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v: any) => [`${v.toFixed(3)} т CO₂e`]} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-1.5 mt-2">
                        {scopeComparisonData.map(s => (
                          <div key={s.name} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                              <span className="text-gray-600">{s.name}</span>
                            </div>
                            <span className="font-semibold text-gray-900">{s.value.toFixed(3)} т</span>
                          </div>
                        ))}
                        <div className="flex items-center justify-between text-xs pt-1 border-t">
                          <span className="font-medium text-gray-700">Общо</span>
                          <span className="font-bold text-gray-900">{data.scope_comparison.total.toFixed(3)} т</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="h-40 flex items-center justify-center text-gray-400 text-sm text-center">
                      <div>
                        <p>Няма данни за Обхват 1 & 2</p>
                        <Link href="/data-entry" className="text-green-600 underline text-xs mt-1 block">
                          Добави Обхват 1 & 2
                        </Link>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Method Quality */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Star className="h-4 w-4 text-yellow-500" />
                    Качество на данните
                  </CardTitle>
                  <CardDescription>Метод на изчисление (Ниво A–D)</CardDescription>
                </CardHeader>
                <CardContent>
                  {data.method_quality.length > 0 ? (
                    <div className="space-y-3 mt-2">
                      {data.method_quality.map(tier => {
                        const totalCalcs = data.summary.total_calculations || 1;
                        const pct = Math.round((tier.count / totalCalcs) * 100);
                        return (
                          <div key={tier.tier}>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <div className="flex items-center gap-2">
                                <Badge
                                  className="text-white text-xs px-2 py-0"
                                  style={{ backgroundColor: TIER_COLORS[tier.tier] || '#9ca3af' }}
                                >
                                  {tier.tier}
                                </Badge>
                                <span className="text-gray-600">{tier.count} изчисления</span>
                              </div>
                              <span className="font-semibold text-gray-900">{pct}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                              <div
                                className="h-2 rounded-full transition-all"
                                style={{
                                  width: `${pct}%`,
                                  backgroundColor: TIER_COLORS[tier.tier] || '#9ca3af'
                                }}
                              />
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5 truncate">{tier.label}</p>
                          </div>
                        );
                      })}
                      <div className="pt-2 border-t text-xs text-gray-500">
                        <p className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          Ниво A & B = по-точни данни
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Подобрете качеството чрез добавяне на специфични данни
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
                      Изчислете емисиите първо
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top Emitting Suppliers */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Building2 className="h-4 w-4 text-gray-500" />
                    Топ доставчици
                  </CardTitle>
                  <CardDescription>По CO₂e емисии</CardDescription>
                </CardHeader>
                <CardContent>
                  {data.top_suppliers.length > 0 ? (
                    <div className="space-y-2 mt-1">
                      {data.top_suppliers.slice(0, 7).map((s, i) => {
                        const maxCo2e = data.top_suppliers[0]?.co2e_tons || 1;
                        const pct = maxCo2e > 0 ? Math.round((s.co2e_tons / maxCo2e) * 100) : 0;
                        return (
                          <div key={s.supplier}>
                            <div className="flex items-center justify-between text-xs mb-0.5">
                              <span className="text-gray-700 truncate max-w-[150px] font-medium">
                                {i + 1}. {s.supplier}
                              </span>
                              <span className="font-bold text-gray-900 ml-2">
                                {s.co2e_tons > 0 ? `${s.co2e_tons.toFixed(3)} т` : `${s.spend.toFixed(0)} €`}
                              </span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                              <div
                                className="h-1.5 rounded-full bg-green-500 transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
                      Няма данни за доставчици
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Row 3: Top suppliers table */}
            {data.top_suppliers.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Building2 className="h-4 w-4 text-gray-500" />
                        Доставчици по емисии
                      </CardTitle>
                      <CardDescription>Топ {data.top_suppliers.length} доставчика за {year} г.</CardDescription>
                    </div>
                    <Link href="/scope3/classify?view=top-suppliers">
                      <Button variant="ghost" size="sm" className="text-green-700">
                        Виж всички <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">#</th>
                          <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">Доставчик</th>
                          <th className="text-right py-2 px-2 text-xs font-medium text-gray-500">Разходи (EUR)</th>
                          <th className="text-right py-2 px-2 text-xs font-medium text-gray-500">Транзакции</th>
                          <th className="text-right py-2 px-2 text-xs font-medium text-gray-500">CO₂e (тона)</th>
                          <th className="py-2 px-2 text-xs font-medium text-gray-500">Дял</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.top_suppliers.map((s, i) => {
                          const pct = data.summary.total_co2e_tons > 0
                            ? ((s.co2e_tons / data.summary.total_co2e_tons) * 100)
                            : 0;
                          return (
                            <tr key={s.supplier} className="border-b border-gray-50 hover:bg-gray-50">
                              <td className="py-2 px-2 text-gray-400 text-xs">{i + 1}</td>
                              <td className="py-2 px-2 font-medium text-gray-900">{s.supplier}</td>
                              <td className="py-2 px-2 text-right text-gray-700">
                                {s.spend.toLocaleString('bg-BG', { maximumFractionDigits: 0 })}
                              </td>
                              <td className="py-2 px-2 text-right text-gray-600">{s.txn_count}</td>
                              <td className="py-2 px-2 text-right font-bold text-green-700">
                                {s.co2e_tons > 0 ? s.co2e_tons.toFixed(3) : '—'}
                              </td>
                              <td className="py-2 px-2">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-gray-100 rounded-full h-1.5 min-w-[60px]">
                                    <div
                                      className="h-1.5 rounded-full bg-green-500"
                                      style={{ width: `${Math.min(pct, 100).toFixed(0)}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-gray-500 w-8 text-right">{pct.toFixed(0)}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: '/scope3/import', icon: Receipt, label: 'Импортирай CSV', color: 'text-blue-600' },
            { href: '/scope3/classify', icon: Tag, label: 'Класификация', color: 'text-purple-600' },
            { href: '/scope3/transactions', icon: Calculator, label: 'Изчисли емисии', color: 'text-green-600' },
            { href: '/scope3/rules', icon: CheckCircle, label: 'Правила', color: 'text-orange-600' },
          ].map(({ href, icon: Icon, label, color }) => (
            <Link key={href} href={href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer hover:border-green-200">
                <CardContent className="pt-4 pb-4 flex items-center gap-3">
                  <Icon className={`h-5 w-5 ${color}`} />
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}
