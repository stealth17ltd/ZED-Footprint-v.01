'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingDown, TrendingUp, Minus, GitCompareArrows, ArrowRight } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts';
import type { ComparisonResult } from '@/app/api/comparison/route';

// ── Delta badge ────────────────────────────────────────────────────────────

function DeltaBadge({ pct, abs }: { pct: number; abs: number }) {
  const isImproved = abs <= 0;
  const isFlat     = Math.abs(pct) < 0.5;

  if (isFlat) return (
    <span className="inline-flex items-center gap-1 text-gray-500 text-xs font-medium">
      <Minus className="h-3 w-3" /> 0%
    </span>
  );
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold ${isImproved ? 'text-green-600' : 'text-red-500'}`}>
      {isImproved
        ? <TrendingDown className="h-3.5 w-3.5" />
        : <TrendingUp   className="h-3.5 w-3.5" />
      }
      {isImproved ? '' : '+'}{pct.toFixed(1)}%
    </span>
  );
}

// ── Scope KPI card ─────────────────────────────────────────────────────────

function ScopeCard({
  label, sub, valA, valB, pct, colorA, colorB,
}: {
  label: string; sub: string;
  valA: number;  valB: number;
  pct: number;   colorA: string; colorB: string;
}) {
  const improved = valB <= valA;
  return (
    <Card className="overflow-hidden">
      <div className={`h-1 ${improved ? 'bg-green-400' : 'bg-red-400'}`} />
      <CardContent className="pt-4 pb-4">
        <p className="text-xs font-semibold text-gray-500">{label}</p>
        <p className="text-xs text-gray-400 mb-3">{sub}</p>
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-xs text-gray-400">Базова</p>
            <p className={`text-xl font-bold ${colorA}`}>{valA.toFixed(2)}</p>
            <p className="text-xs text-gray-400">tCO2e</p>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-300 mb-3" />
          <div className="text-right">
            <p className="text-xs text-gray-400">Текуща</p>
            <p className={`text-xl font-bold ${colorB}`}>{valB.toFixed(2)}</p>
            <p className="text-xs text-gray-400">tCO2e</p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t flex items-center justify-between">
          <DeltaBadge pct={pct} abs={valB - valA} />
          <span className="text-xs text-gray-400">{Math.abs(valB - valA).toFixed(2)} tCO2e</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Custom tooltip ─────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 shadow-lg rounded-lg p-3 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: <strong>{Number(entry.value).toFixed(3)}</strong> tCO2e
        </p>
      ))}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function ComparisonPage() {
  const now      = new Date().getFullYear();
  const [yearA, setYearA] = useState(now - 1);
  const [yearB, setYearB] = useState(now);
  const [data,  setData]  = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);

  const yearOptions = Array.from({ length: 8 }, (_, i) => now - i);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/comparison?yearA=${yearA}&yearB=${yearB}`);
      if (res.ok) {
        const result = await res.json();
        setData(result.data);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Stack bar data: scope 1+2+3 per year
  const stackData = data ? [
    {
      name: String(data.yearA),
      'Обхват 1': data.scope1A,
      'Обхват 2': data.scope2A,
      'Обхват 3': data.scope3A,
    },
    {
      name: String(data.yearB),
      'Обхват 1': data.scope1B,
      'Обхват 2': data.scope2B,
      'Обхват 3': data.scope3B,
    },
  ] : [];

  const catBarData = data?.topCategories.map(c => ({
    name: c.category.length > 22 ? c.category.slice(0, 20) + '…' : c.category,
    [String(data.yearA)]: c.yearA,
    [String(data.yearB)]: c.yearB,
  })) ?? [];

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
              <GitCompareArrows className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Сравнение на периоди</h1>
              <p className="text-sm text-gray-500">
                Год-за-год динамика на въглеродния отпечатък
              </p>
            </div>
          </div>

          {/* Period selector */}
          <div className="flex items-center gap-2 bg-white border rounded-lg px-4 py-2 shadow-sm">
            <Select value={String(yearA)} onValueChange={v => setYearA(parseInt(v))}>
              <SelectTrigger className="w-24 border-0 shadow-none p-0 h-auto focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
            <ArrowRight className="h-4 w-4 text-gray-400" />
            <Select value={String(yearB)} onValueChange={v => setYearB(parseInt(v))}>
              <SelectTrigger className="w-24 border-0 shadow-none p-0 h-auto focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={load} disabled={loading} className="bg-earth-300 hover:bg-earth-400 ml-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Сравни'}
            </Button>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-earth-300" />
          </div>
        )}

        {!loading && data && (
          <>
            {/* ── Grand total banner ── */}
            <Card className={`border-2 ${data.deltaTotal <= 0 ? 'border-green-200 bg-green-50' : 'border-red-100 bg-red-50'}`}>
              <CardContent className="py-5">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Общи емисии (Обхват 1+2+3)</p>
                    <div className="flex items-baseline gap-3 mt-1">
                      <span className="text-3xl font-bold text-gray-400 line-through">{data.totalA.toFixed(2)}</span>
                      <ArrowRight className="h-5 w-5 text-gray-400" />
                      <span className={`text-3xl font-bold ${data.totalB <= data.totalA ? 'text-green-600' : 'text-red-500'}`}>
                        {data.totalB.toFixed(2)}
                      </span>
                      <span className="text-sm text-gray-400">tCO2e</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <DeltaBadge pct={data.pctTotal} abs={data.deltaTotal} />
                    <p className="text-2xl font-bold mt-1 text-gray-700">
                      {data.deltaTotal > 0 ? '+' : ''}{data.deltaTotal.toFixed(2)} tCO2e
                    </p>
                    <p className="text-xs text-gray-400">
                      {data.deltaTotal <= 0 ? 'Намаляване' : 'Увеличение'} {data.yearA} → {data.yearB}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── Scope KPI cards ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ScopeCard
                label="Обхват 1"   sub="Директни горива / флот"
                valA={data.scope1A} valB={data.scope1B} pct={data.pct1}
                colorA="text-gray-600" colorB={data.scope1B <= data.scope1A ? 'text-green-600' : 'text-red-500'}
              />
              <ScopeCard
                label="Обхват 2"   sub="Закупена енергия"
                valA={data.scope2A} valB={data.scope2B} pct={data.pct2}
                colorA="text-gray-600" colorB={data.scope2B <= data.scope2A ? 'text-green-600' : 'text-red-500'}
              />
              <ScopeCard
                label="Обхват 3"   sub="Верига на стойността"
                valA={data.scope3A} valB={data.scope3B} pct={data.pct3}
                colorA="text-gray-600" colorB={data.scope3B <= data.scope3A ? 'text-green-600' : 'text-red-500'}
              />
            </div>

            {/* ── Charts row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Stacked bar */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-gray-700">
                    Структура на емисиите по обхват
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={stackData} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="Обхват 1" stackId="a" fill="#4ade80" />
                      <Bar dataKey="Обхват 2" stackId="a" fill="#60a5fa" />
                      <Bar dataKey="Обхват 3" stackId="a" fill="#fb923c" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Monthly trend */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-gray-700">
                    Месечна динамика (Обхват 1+2)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={data.monthly} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Line
                        type="monotone" dataKey="yearA" name={String(data.yearA)}
                        stroke="#94a3b8" strokeWidth={2} strokeDasharray="4 2" dot={{ r: 3 }}
                      />
                      <Line
                        type="monotone" dataKey="yearB" name={String(data.yearB)}
                        stroke="#4ade80" strokeWidth={2.5} dot={{ r: 3, fill: '#4ade80' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* ── Scope 3 category delta ── */}
            {catBarData.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-gray-700">
                    Обхват 3 — промяна по категория
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={catBarData} layout="vertical" margin={{ top: 4, right: 24, bottom: 0, left: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 10 }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={140} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey={String(data.yearA)} fill="#94a3b8" radius={[0, 2, 2, 0]} />
                      <Bar dataKey={String(data.yearB)} radius={[0, 2, 2, 0]}>
                        {catBarData.map((entry, i) => {
                          const catEntry = data.topCategories[i];
                          return <Cell key={i} fill={catEntry?.delta <= 0 ? '#4ade80' : '#fb923c'} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* ── Insight summary ── */}
            <Card className="border-blue-100 bg-blue-50">
              <CardContent className="py-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="font-semibold text-blue-800 mb-1">Най-голямо намаление</p>
                    <p className="text-blue-700">
                      {data.pct1 <= data.pct2 && data.pct1 <= data.pct3
                        ? `Обхват 1: ${data.pct1.toFixed(1)}%`
                        : data.pct2 <= data.pct3
                          ? `Обхват 2: ${data.pct2.toFixed(1)}%`
                          : `Обхват 3: ${data.pct3.toFixed(1)}%`
                      }
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-blue-800 mb-1">Тренд на намаление</p>
                    <p className="text-blue-700">
                      {data.pctTotal < 0
                        ? `↓ ${Math.abs(data.pctTotal).toFixed(1)}% подобрение — добър прогрес`
                        : data.pctTotal === 0
                          ? 'Без промяна спрямо предходната година'
                          : `↑ ${data.pctTotal.toFixed(1)}% увеличение — нужни са мерки`
                      }
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-blue-800 mb-1">SBTi 4.2% цел</p>
                    <p className="text-blue-700">
                      {data.pctTotal <= -4.2
                        ? '✓ Годишното намаление надвишава SBTi прага'
                        : `Нужно намаление: ${(4.2 + data.pctTotal).toFixed(1)}% допълнително`
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {!loading && !data && (
          <Card>
            <CardContent className="py-16 text-center">
              <GitCompareArrows className="mx-auto h-14 w-14 text-gray-300 mb-4" />
              <p className="text-gray-500">Изберете два периода и натиснете Сравни</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
