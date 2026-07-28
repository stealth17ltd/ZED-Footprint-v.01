'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  ShieldCheck, AlertTriangle, CheckCircle2, XCircle,
  Loader2, ArrowRight, TrendingUp, Database, Leaf,
  Info, Zap, Target, BookOpen, Users, CalendarCheck,
} from 'lucide-react';
import Link from 'next/link';
import type { DataQualityResult, ScopeMonthStatus, DataQualityTip } from '@/app/api/data-quality/route';

// ── Score circle ───────────────────────────────────────────────────────────
function ScoreCircle({ score }: { score: number }) {
  const color =
    score >= 85 ? '#22c55e' :
    score >= 60 ? '#f59e0b' :
    '#ef4444';
  const r = 42, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <svg width="110" height="110" viewBox="0 0 110 110">
      <circle cx="55" cy="55" r={r} fill="none" stroke="#e5e7eb" strokeWidth="8" />
      <circle
        cx="55" cy="55" r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round" transform="rotate(-90 55 55)"
      />
      <text x="55" y="52" textAnchor="middle" fontSize="22" fontWeight="bold" fill={color}>{score}%</text>
      <text x="55" y="68" textAnchor="middle" fontSize="10" fill="#6b7280">Оценка</text>
    </svg>
  );
}

// ── Month cell ─────────────────────────────────────────────────────────────
function MonthCell({ month, future }: { month: ScopeMonthStatus; future: boolean }) {
  const both   = month.hasScope1 && month.hasScope2;
  const partial = (month.hasScope1 || month.hasScope2) && !both;
  const empty  = !month.hasScope1 && !month.hasScope2;

  return (
    <div
      title={`${month.label}: S1=${month.hasScope1 ? '✓' : '✗'} S2=${month.hasScope2 ? '✓' : '✗'} (${month.entries} записа)`}
      className={`flex flex-col items-center gap-1 rounded-lg p-2 border text-xs ${
        future ? 'bg-gray-50 border-gray-100 text-gray-300' :
        both    ? 'bg-green-50 border-green-200 text-green-700' :
        partial ? 'bg-amber-50 border-amber-200 text-amber-700' :
                  'bg-red-50 border-red-200 text-red-600'
      }`}
    >
      <span className="font-semibold">{month.label}</span>
      {!future && (
        both    ? <CheckCircle2 className="h-4 w-4" /> :
        partial ? <AlertTriangle className="h-4 w-4" /> :
                  <XCircle className="h-4 w-4" />
      )}
      {!future && <span>{month.entries}</span>}
    </div>
  );
}

// ── Progress bar ───────────────────────────────────────────────────────────
function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="w-full bg-gray-100 rounded-full h-3">
      <div className={`h-3 rounded-full transition-all ${color}`} style={{ width: `${value}%` }} />
    </div>
  );
}

// ── Tip card ───────────────────────────────────────────────────────────────
function TipCard({ tip }: { tip: DataQualityTip }) {
  const styles: Record<DataQualityTip['type'], { border: string; bg: string; icon: React.ReactNode; badge: string }> = {
    critical: {
      border: 'border-red-200',
      bg: 'bg-red-50',
      icon: <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />,
      badge: 'bg-red-100 text-red-700',
    },
    warning: {
      border: 'border-amber-200',
      bg: 'bg-amber-50',
      icon: <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />,
      badge: 'bg-amber-100 text-amber-700',
    },
    info: {
      border: 'border-blue-200',
      bg: 'bg-blue-50',
      icon: <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />,
      badge: 'bg-blue-100 text-blue-700',
    },
    success: {
      border: 'border-green-200',
      bg: 'bg-green-50',
      icon: <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />,
      badge: 'bg-green-100 text-green-700',
    },
  };

  const s = styles[tip.type];
  const labelMap = { critical: 'Критично', warning: 'Внимание', info: 'Съвет', success: 'Успех' };

  return (
    <div className={`rounded-lg border p-4 ${s.border} ${s.bg} flex flex-col gap-2`}>
      <div className="flex items-start gap-2">
        {s.icon}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-800">{tip.title}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${s.badge}`}>
              {labelMap[tip.type]}
            </span>
          </div>
          <p className="text-xs text-gray-600 mt-1 leading-relaxed">{tip.description}</p>
        </div>
      </div>
      {tip.action && tip.link && (
        <div className="pl-6">
          <Link href={tip.link}>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
              <ArrowRight className="h-3 w-3" />
              {tip.action}
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function DataQualityPage() {
  const now = new Date().getFullYear();
  const [year, setYear]    = useState(now);
  const [data, setData]    = useState<DataQualityResult | null>(null);
  const [loading, setLoading] = useState(false);

  const yearOptions = Array.from({ length: 5 }, (_, i) => now - i);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/data-quality?year=${year}`);
      if (res.ok) setData((await res.json()).data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const currentMonth = new Date().getFullYear() === year ? new Date().getMonth() + 1 : 12;

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-earth-100 flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-earth-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Качество на данните</h1>
              <p className="text-sm text-gray-500">Пълнота, пропуски и одитна проследимост</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={String(year)} onValueChange={v => { setYear(parseInt(v)); setData(null); }}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={load} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Зареди'}
            </Button>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-earth-300" />
          </div>
        )}

        {!loading && data && (
          <>
            {/* Overall score + scope breakdown */}
            <div className="grid md:grid-cols-4 gap-4">
              <Card className="flex flex-col items-center justify-center py-4">
                <ScoreCircle score={data.overallScore} />
                <p className={`font-bold mt-2 ${
                  data.overallScore >= 85 ? 'text-green-600' :
                  data.overallScore >= 60 ? 'text-amber-600' : 'text-red-500'
                }`}>
                  {data.overallScore >= 85 ? 'Отлично' :
                   data.overallScore >= 60 ? 'Добро' : 'Непълно'}
                </p>
                <p className="text-xs text-gray-400">Обща оценка {data.year}</p>
              </Card>

              <Card>
                <CardContent className="pt-5 pb-4 space-y-3">
                  <p className="text-xs font-semibold text-green-700 flex items-center gap-1">
                    <Database className="h-3.5 w-3.5" /> ОБХВАТ 1 — Директни
                  </p>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-800">{data.scope1Completeness}%</p>
                    <p className="text-xs text-gray-400">{data.scope1Entries} записа</p>
                  </div>
                  <ProgressBar value={data.scope1Completeness}
                    color={data.scope1Completeness >= 80 ? 'bg-green-400' : 'bg-amber-400'} />
                  <p className="text-xs text-gray-500">
                    {data.monthlyStatus.slice(0, currentMonth).filter(m => m.hasScope1).length}/{currentMonth} месеца с данни
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-5 pb-4 space-y-3">
                  <p className="text-xs font-semibold text-blue-700 flex items-center gap-1">
                    <Database className="h-3.5 w-3.5" /> ОБХВАТ 2 — Енергия
                  </p>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-800">{data.scope2Completeness}%</p>
                    <p className="text-xs text-gray-400">{data.scope2Entries} записа</p>
                  </div>
                  <ProgressBar value={data.scope2Completeness}
                    color={data.scope2Completeness >= 80 ? 'bg-green-400' : 'bg-amber-400'} />
                  <p className="text-xs text-gray-500">
                    {data.monthlyStatus.slice(0, currentMonth).filter(m => m.hasScope2).length}/{currentMonth} месеца с данни
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-5 pb-4 space-y-3">
                  <p className="text-xs font-semibold text-orange-700 flex items-center gap-1">
                    <Leaf className="h-3.5 w-3.5" /> ОБХВАТ 3 — Верига
                  </p>
                  {data.scope3Available ? (
                    <>
                      <div className="text-center">
                        <p className="text-3xl font-bold text-gray-800">{data.scope3ClassificationRate}%</p>
                        <p className="text-xs text-gray-400">{data.scope3TxClassified}/{data.scope3TxTotal} транзакции</p>
                      </div>
                      <ProgressBar value={data.scope3ClassificationRate}
                        color={data.scope3ClassificationRate >= 70 ? 'bg-blue-400' : 'bg-amber-400'} />
                      <p className="text-xs text-gray-500">
                        {data.scope3CalculatedEntries} изчислени записа
                      </p>
                    </>
                  ) : (
                    <div className="text-center py-2">
                      <p className="text-sm text-gray-400">Няма данни</p>
                      <Link href="/scope3/import">
                        <Button size="sm" variant="outline" className="mt-2 text-xs">
                          Импортирай транзакции
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Monthly calendar heatmap */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-gray-700">
                  Месечна пълнота {data.year} — Обхват 1 & 2
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
                  {data.monthlyStatus.map(m => (
                    <MonthCell key={m.month} month={m} future={m.month > currentMonth} />
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-200 inline-block" /> Пълно (S1+S2)</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-200 inline-block" /> Частично</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-200 inline-block" /> Липсва</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-100 inline-block" /> Бъдещ месец</span>
                </div>
              </CardContent>
            </Card>

            {/* Scope 3 method tier breakdown */}
            {data.scope3Available && Object.keys(data.scope3MethodTiers).length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-gray-700">
                    Обхват 3 — разпределение по метод
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(data.scope3MethodTiers).map(([tier, count]) => (
                      <div key={tier} className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">{tier}</p>
                        <p className="text-2xl font-bold text-gray-700">{count}</p>
                        <p className="text-xs text-gray-400">изчисления</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 p-3 bg-blue-50 rounded text-xs text-blue-700">
                    <strong>Метод легенда:</strong> Ниво A = специфичен доставчик (най-точно) · Ниво B = физическа активност · Ниво C = разходен метод (EEIO) · Ниво D = прокси/оценка
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recommendations (existing compact list) */}
            {data.recommendations.length > 0 && (
              <Card className={
                data.overallScore >= 85 ? 'border-green-200 bg-green-50' :
                data.overallScore >= 60 ? 'border-amber-200 bg-amber-50' :
                'border-red-200 bg-red-50'
              }>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Препоръки за подобряване
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {data.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        {data.overallScore >= 85
                          ? <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                          : <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                        }
                        {rec}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Scope 3 category coverage */}
            {data.scope3Available && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Leaf className="h-4 w-4 text-orange-500" />
                    Обхват 3 — покритие по категории
                  </CardTitle>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Петте ключови категории за МСП (GHG Protocol)
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                    {[1, 4, 5, 6, 7].map(cat => {
                      const count = data.scope3CategoryCoverage[cat] ?? 0;
                      const labels: Record<number, { short: string; icon: string }> = {
                        1: { short: 'Закупени стоки', icon: '🛒' },
                        4: { short: 'Транспорт', icon: '🚛' },
                        5: { short: 'Отпадъци', icon: '♻️' },
                        6: { short: 'Командировки', icon: '✈️' },
                        7: { short: 'Пътуване', icon: '🚌' },
                      };
                      const l = labels[cat];
                      const present = count > 0;
                      return (
                        <div
                          key={cat}
                          className={`rounded-lg p-3 text-center border transition-colors ${
                            present
                              ? 'bg-green-50 border-green-200'
                              : 'bg-gray-50 border-dashed border-gray-200'
                          }`}
                        >
                          <div className="text-2xl mb-1">{l.icon}</div>
                          <p className="text-xs font-semibold text-gray-700 leading-tight">{l.short}</p>
                          <p className="text-xs text-gray-400 mt-0.5">Кат. {cat}</p>
                          {present ? (
                            <Badge className="mt-1.5 text-xs bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
                              {count} транз.
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="mt-1.5 text-xs text-gray-400 border-dashed">
                              Без данни
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-400 mt-3">
                    Липсващите категории не означават непременно пропуск — зависи от естеството на бизнеса ви.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* CSRD readiness checklist */}
            <Card className="border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  CSRD готовност — контролен списък
                </CardTitle>
                <p className="text-xs text-blue-600 mt-0.5">
                  Индиректните изисквания от клиенти и партньори вече са реалност — дори преди формалните срокове (2028).
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { label: 'Обхват 1 данни (поне 80% от месеците)', ok: data.scope1Completeness >= 80 },
                    { label: 'Обхват 2 данни (поне 80% от месеците)', ok: data.scope2Completeness >= 80 },
                    { label: 'Обхват 3 транзакции импортирани', ok: data.scope3Available },
                    { label: 'Обхват 3 транзакции класифицирани (>70%)', ok: data.scope3ClassificationRate >= 70 },
                    { label: 'Обхват 3 емисии изчислени', ok: data.scope3CalculatedEntries > 0 },
                    { label: 'Активни цели за намаление', ok: data.hasActiveTargets },
                    { label: 'Обща оценка за качество ≥ 70%', ok: data.overallScore >= 70 },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 py-1.5 border-b border-blue-50 last:border-0">
                      {item.ok
                        ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                        : <XCircle className="h-4 w-4 text-gray-300 shrink-0" />
                      }
                      <span className={`text-sm ${item.ok ? 'text-gray-700' : 'text-gray-400'}`}>
                        {item.label}
                      </span>
                      {item.ok && (
                        <Badge className="ml-auto text-xs bg-green-50 text-green-600 border-green-200 hover:bg-green-50">
                          ✓
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
                  <strong>Контекст:</strong> След Omnibus пакета (2025), CSRD формално важи за компании над 1,000 служители.
                  Но клиентите и партньорите им ще изискват ESG данни от доставчиците (МСП) <em>много по-рано</em>.
                  Препоръчваме данните ви да са готови до края на {data.year + 1}г.
                </div>
              </CardContent>
            </Card>

            {/* Rich tips & action cards */}
            {data.tips && data.tips.length > 0 && (
              <div>
                <h2 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-earth-400" />
                  Детайлни съвети и следващи стъпки
                </h2>
                <div className="grid md:grid-cols-2 gap-3">
                  {data.tips.map((tip, i) => (
                    <TipCard key={i} tip={tip} />
                  ))}
                </div>
              </div>
            )}

            {/* Industry benchmarks info */}
            <Card className="border-gray-200 bg-gray-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Индустриален контекст и полезно знание
                </CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-3 gap-4 text-xs text-gray-600">
                <div className="space-y-1">
                  <p className="font-semibold text-gray-700 flex items-center gap-1">
                    <span className="text-base">📊</span> Типичен отпечатък на МСП
                  </p>
                  <p>Обхват 1: 5–15% от общите емисии</p>
                  <p>Обхват 2: 10–25% (зависи от сектора)</p>
                  <p>Обхват 3: <strong>60–85%</strong> — доминира почти винаги</p>
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-gray-700 flex items-center gap-1">
                    <span className="text-base">🎯</span> SBTi изисквания
                  </p>
                  <p>Минимум <strong>4.2% намаление/год.</strong> за 1.5°C сценарий</p>
                  <p>Обхват 3 цели задължителни ако &gt;40% от общото</p>
                  <p>Базова година — обикновено последните 3 години</p>
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-gray-700 flex items-center gap-1">
                    <span className="text-base">📅</span> Ключови срокове
                  </p>
                  <p>Клиентски ESG заявки: <strong>вече сега</strong></p>
                  <p>CSRD (МСП котирани): от 2028г.</p>
                  <p>VSME доброволен стандарт: наличен от 2025г.</p>
                </div>
              </CardContent>
            </Card>

            {/* Quick link to reports */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <CalendarCheck className="h-3.5 w-3.5" />
                Последно обновено: {new Date().toLocaleDateString('bg-BG')}
              </div>
              <Link href="/reports">
                <Button variant="outline" className="gap-2">
                  <ArrowRight className="h-4 w-4" /> Генерирай PDF отчет
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
