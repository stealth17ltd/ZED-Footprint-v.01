'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, Legend,
} from 'recharts';
import {
  TrendingDown, TrendingUp, Minus, Loader2, AlertTriangle,
  Zap, Leaf, ArrowRight, Trophy, Target, Info,
} from 'lucide-react';
import Link from 'next/link';
import type { BenchmarkResult } from '@/app/api/benchmark/route';

// ── Grade badge ───────────────────────────────────────────────────────────────
function GradeBadge({ grade }: { grade: 'A' | 'B' | 'C' | 'D' }) {
  const styles = {
    A: 'bg-green-100 text-green-800 border-green-300',
    B: 'bg-blue-100  text-blue-800  border-blue-300',
    C: 'bg-amber-100 text-amber-800 border-amber-300',
    D: 'bg-red-100   text-red-800   border-red-300',
  };
  const labels = { A: 'Отлично', B: 'Добро', C: 'Средно', D: 'Под средното' };
  return (
    <span className={`text-5xl font-black px-5 py-2 rounded-2xl border-2 ${styles[grade]}`}>
      {grade}
    </span>
  );
}

// ── Scope bar ─────────────────────────────────────────────────────────────────
function ScopeBar({ label, actual, benchmark, color }: {
  label: string; actual: number; benchmark: number; color: string;
}) {
  const max = Math.max(actual, benchmark, 0.001);
  const worse = actual > benchmark;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-500">
        <span className="font-medium text-gray-700">{label}</span>
        <span className={worse ? 'text-red-500 font-semibold' : 'text-green-600 font-semibold'}>
          {actual.toFixed(2)} t
          {worse ? ' ▲' : ' ▼'}
        </span>
      </div>
      <div className="relative h-6 bg-gray-100 rounded-full overflow-hidden">
        {/* benchmark reference */}
        <div
          className="absolute top-0 left-0 h-full bg-gray-300 rounded-full opacity-60"
          style={{ width: `${(benchmark / max) * 100}%` }}
        />
        {/* actual */}
        <div
          className={`absolute top-0 left-0 h-full ${color} rounded-full`}
          style={{ width: `${Math.min((actual / max) * 100, 100)}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-400">
        <span>Ваши: {actual.toFixed(2)} tCO2e</span>
        <span>Бенчмарк: {benchmark.toFixed(2)} tCO2e</span>
      </div>
    </div>
  );
}

// ── Effort badge ──────────────────────────────────────────────────────────────
function EffortBadge({ effort }: { effort: 'Ниско' | 'Средно' | 'Високо' }) {
  const s = {
    'Ниско':  'bg-green-100 text-green-700',
    'Средно': 'bg-amber-100 text-amber-700',
    'Високо': 'bg-red-100 text-red-700',
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s[effort]}`}>{effort} усилие</span>;
}

// ── No data placeholder ───────────────────────────────────────────────────────
function NoDataCard({ year }: { year: number }) {
  return (
    <Card className="border-amber-200 bg-amber-50 col-span-full">
      <CardContent className="py-10 text-center space-y-4">
        <AlertTriangle className="h-10 w-10 text-amber-400 mx-auto" />
        <div>
          <p className="font-semibold text-amber-800">Няма данни за {year}г.</p>
          <p className="text-sm text-amber-600 mt-1">
            Добавете емисионни данни, за да видите сравнение с индустрията.
            Бенчмаркът се изчислява на база реалния ви отпечатък.
          </p>
        </div>
        <div className="flex justify-center gap-3">
          <Link href="/data-entry">
            <Button size="sm" className="gap-2 bg-amber-500 hover:bg-amber-600">
              <Zap className="h-4 w-4" /> Добави Обхват 1&2
            </Button>
          </Link>
          <Link href="/scope3/import">
            <Button size="sm" variant="outline" className="gap-2">
              <Leaf className="h-4 w-4" /> Импортирай Обхват 3
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function BenchmarkPage() {
  const now = new Date().getFullYear();
  const [year, setYear]   = useState(now);
  const [data, setData]   = useState<BenchmarkResult | null>(null);
  const [loading, setLoading] = useState(true);

  const yearOptions = Array.from({ length: 4 }, (_, i) => now - i);

  const load = async () => {
    setLoading(true);
    setData(null);
    try {
      const res = await fetch(`/api/benchmark?year=${year}`);
      if (res.ok) setData((await res.json()).data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [year]); // eslint-disable-line react-hooks/exhaustive-deps

  // Comparison bar chart data
  const barData = data ? [
    {
      name: 'Обхват 1',
      'Вашата компания': data.actualScope1,
      'Индустрия (медиана)': Math.round(data.benchmark.tco2e_per_employee * data.employeeCount * (data.benchmark.scope1_pct / 100) * 100) / 100,
    },
    {
      name: 'Обхват 2',
      'Вашата компания': data.actualScope2,
      'Индустрия (медиана)': Math.round(data.benchmark.tco2e_per_employee * data.employeeCount * (data.benchmark.scope2_pct / 100) * 100) / 100,
    },
    {
      name: 'Обхват 3',
      'Вашата компания': data.actualScope3,
      'Индустрия (медиана)': Math.round(data.benchmark.tco2e_per_employee * data.employeeCount * (data.benchmark.scope3_pct / 100) * 100) / 100,
    },
    {
      name: 'Общо',
      'Вашата компания': data.actualTotal,
      'Индустрия (медиана)': data.benchmarkTotal,
    },
  ] : [];

  // Scope distribution radar
  const radarData = data ? [
    { axis: 'Обхват 1', company: data.scope1ActualPct, industry: data.benchmark.scope1_pct },
    { axis: 'Обхват 2', company: data.scope2ActualPct, industry: data.benchmark.scope2_pct },
    { axis: 'Обхват 3', company: data.scope3ActualPct, industry: data.benchmark.scope3_pct },
  ] : [];

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <Trophy className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Бенчмарк</h1>
              <p className="text-sm text-gray-500">Сравнение с индустрията — {data?.sector ?? '...'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={String(year)} onValueChange={v => setYear(parseInt(v))}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={load} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Обнови'}
            </Button>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-earth-300" />
          </div>
        )}

        {!loading && data && !data.hasData && <NoDataCard year={year} />}

        {!loading && data && data.hasData && (
          <>
            {/* Hero KPI row */}
            <div className="grid md:grid-cols-4 gap-4">

              {/* Grade */}
              <Card className="flex flex-col items-center justify-center py-6 gap-3 bg-gradient-to-br from-white to-purple-50 border-purple-200">
                <GradeBadge grade={data.performanceGrade} />
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-700">Оценка</p>
                  <p className="text-xs text-gray-400">A = топ 25% в сектора</p>
                </div>
              </Card>

              {/* Percentile */}
              <Card className="flex flex-col items-center justify-center py-6 gap-2">
                <p className="text-4xl font-black text-purple-600">{data.percentileEstimate}%</p>
                <p className="text-sm font-semibold text-gray-700 text-center">По-ефективни от<br/>колеги в бранша</p>
                <p className="text-xs text-gray-400">приблизителна оценка</p>
              </Card>

              {/* vs Industry */}
              <Card className={`flex flex-col items-center justify-center py-6 gap-2 ${
                data.vsIndustryPct <= 0
                  ? 'bg-green-50 border-green-200'
                  : data.vsIndustryPct <= 30
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-1">
                  {data.vsIndustryPct < -5
                    ? <TrendingDown className="h-6 w-6 text-green-500" />
                    : data.vsIndustryPct > 5
                    ? <TrendingUp className="h-6 w-6 text-red-500" />
                    : <Minus className="h-6 w-6 text-amber-500" />
                  }
                  <span className={`text-3xl font-black ${
                    data.vsIndustryPct < 0 ? 'text-green-600' :
                    data.vsIndustryPct > 0 ? 'text-red-500' : 'text-amber-500'
                  }`}>
                    {data.vsIndustryPct > 0 ? '+' : ''}{data.vsIndustryPct}%
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-700 text-center">
                  {data.vsIndustryPct < 0 ? 'Под средното' : data.vsIndustryPct === 0 ? 'На средното' : 'Над средното'}
                </p>
                <p className="text-xs text-gray-400">спрямо медианата</p>
              </Card>

              {/* Per employee */}
              <Card className="flex flex-col items-center justify-center py-6 gap-2">
                <p className="text-3xl font-black text-gray-800">{data.actualPerEmployee.toFixed(1)}</p>
                <p className="text-sm font-semibold text-gray-700 text-center">tCO2e<br/>на служител</p>
                <p className="text-xs text-gray-400">
                  Медиана: {data.benchmark.tco2e_per_employee} t — {data.employeeCount} служители
                </p>
              </Card>
            </div>

            {/* Scope comparison bar chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-gray-700">
                  Сравнение по обхват — вашата компания vs. медиана за {data.sector}
                </CardTitle>
                <p className="text-xs text-gray-400">tCO2e за {year}г. ({data.employeeCount} служители)</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={barData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 11 }} unit=" t" />
                    <Tooltip formatter={(v: number) => [`${v.toFixed(2)} tCO2e`]} />
                    <Legend />
                    <Bar dataKey="Вашата компания" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Индустрия (медиана)" fill="#d4d4d4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Scope distribution + detail bars */}
            <div className="grid md:grid-cols-2 gap-4">

              {/* Distribution radar */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-gray-700">
                    Разпределение по обхват (%)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="axis" tick={{ fontSize: 12 }} />
                      <Radar name="Вашата компания" dataKey="company" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.3} />
                      <Radar name="Индустрия" dataKey="industry" stroke="#9ca3af" fill="#9ca3af" fillOpacity={0.2} strokeDasharray="4 4" />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Scope detail bars */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-gray-700">
                    Детайл по обхват (tCO2e)
                  </CardTitle>
                  <p className="text-xs text-gray-400">Сиво = индустриален бенчмарк</p>
                </CardHeader>
                <CardContent className="space-y-5 pt-2">
                  <ScopeBar
                    label="Обхват 1 — Директни"
                    actual={data.actualScope1}
                    benchmark={data.benchmarkTotal * (data.benchmark.scope1_pct / 100)}
                    color="bg-green-500"
                  />
                  <ScopeBar
                    label="Обхват 2 — Енергия"
                    actual={data.actualScope2}
                    benchmark={data.benchmarkTotal * (data.benchmark.scope2_pct / 100)}
                    color="bg-blue-500"
                  />
                  <ScopeBar
                    label="Обхват 3 — Верига"
                    actual={data.actualScope3}
                    benchmark={data.benchmarkTotal * (data.benchmark.scope3_pct / 100)}
                    color="bg-orange-500"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Industry context */}
            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="py-4 px-5">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-purple-500 shrink-0 mt-0.5" />
                  <div className="text-sm text-purple-800 space-y-1">
                    <p className="font-semibold">За сектор: {data.sector}</p>
                    <p>Типичните Обхват 3 категории са: <strong>{data.benchmark.top_categories.join(', ')}</strong>.</p>
                    <p>Медиана: <strong>{data.benchmark.tco2e_per_employee} tCO2e/служител</strong> общо.
                       Вашата компания: <strong>{data.actualPerEmployee.toFixed(2)} tCO2e/служител</strong>.</p>
                    <p className="text-xs text-purple-600 mt-1">
                      Данните са базирани на EU ETS, CDP SME Benchmark и GHG Protocol секторни ръководства.
                      Регионалните специфики могат да варират с ±30%.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reduction opportunities */}
            <div>
              <h2 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Target className="h-5 w-5 text-green-500" />
                Топ възможности за намаление
              </h2>
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
                {data.reductionOpportunities.map((opp, i) => (
                  <Card key={i} className="border-green-200 hover:shadow-md transition-shadow">
                    <CardContent className="pt-5 pb-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-gray-800 text-sm leading-tight">{opp.area}</p>
                        <EffortBadge effort={opp.effort} />
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">{opp.description}</p>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-lg font-bold text-green-600">
                            ~{opp.co2eSaving} t
                          </p>
                          <p className="text-xs text-gray-400">CO2e спестявания/год.</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-blue-600">{opp.potentialPct}%</p>
                          <p className="text-xs text-gray-400">потенциал</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Actions row */}
            <div className="flex flex-wrap gap-3 justify-end border-t pt-4">
              <Link href="/targets">
                <Button variant="outline" className="gap-2 text-sm">
                  <Target className="h-4 w-4" /> Постави цел за намаление
                </Button>
              </Link>
              <Link href="/reports?type=csrd">
                <Button className="gap-2 text-sm bg-earth-300 hover:bg-earth-400">
                  <ArrowRight className="h-4 w-4" /> Генерирай CSRD отчет
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
