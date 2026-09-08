'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Lightbulb, ChevronRight, TrendingDown, Zap, Truck, Trash2,
  Droplets, Users, Settings, Sun, CheckCircle2, Clock, Pause,
} from 'lucide-react';
import Link from 'next/link';

// ── Types ──────────────────────────────────────────────────────────────────
type InitiativeStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
type StrategyCategory =
  | 'energy_efficiency' | 'renewable_energy' | 'fleet'
  | 'supply_chain' | 'waste' | 'water' | 'behavioral' | 'other';
type StrategyPriority = 'high' | 'medium' | 'low';
type StrategyStatus = 'draft' | 'active' | 'completed' | 'cancelled' | 'on_hold';

interface Strategy {
  id: string;
  title: string;
  category: StrategyCategory;
  priority: StrategyPriority;
  status: StrategyStatus;
  estimated_reduction_co2e: number | null;
  strategy_initiatives: { id: string; status: InitiativeStatus }[];
}

// ── Visual config ──────────────────────────────────────────────────────────
const CATEGORY_CONFIG: Record<StrategyCategory, {
  label: string;
  icon: React.ReactNode;
  ring: string;
  bar: string;
  pill: string;
}> = {
  energy_efficiency: {
    label: 'Ен. ефективност',
    icon: <Lightbulb className="h-3.5 w-3.5" />,
    ring: '#10b981',
    bar: 'bg-emerald-500',
    pill: 'bg-emerald-100 text-emerald-700',
  },
  renewable_energy: {
    label: 'ВЕИ',
    icon: <Sun className="h-3.5 w-3.5" />,
    ring: '#f59e0b',
    bar: 'bg-amber-400',
    pill: 'bg-amber-100 text-amber-700',
  },
  fleet: {
    label: 'Автопарк',
    icon: <Truck className="h-3.5 w-3.5" />,
    ring: '#3b82f6',
    bar: 'bg-blue-500',
    pill: 'bg-blue-100 text-blue-700',
  },
  supply_chain: {
    label: 'Верига',
    icon: <Truck className="h-3.5 w-3.5" />,
    ring: '#f97316',
    bar: 'bg-orange-500',
    pill: 'bg-orange-100 text-orange-700',
  },
  waste: {
    label: 'Отпадъци',
    icon: <Trash2 className="h-3.5 w-3.5" />,
    ring: '#6b7280',
    bar: 'bg-gray-400',
    pill: 'bg-gray-100 text-gray-600',
  },
  water: {
    label: 'Вода',
    icon: <Droplets className="h-3.5 w-3.5" />,
    ring: '#06b6d4',
    bar: 'bg-cyan-500',
    pill: 'bg-cyan-100 text-cyan-700',
  },
  behavioral: {
    label: 'Поведение',
    icon: <Users className="h-3.5 w-3.5" />,
    ring: '#8b5cf6',
    bar: 'bg-violet-500',
    pill: 'bg-violet-100 text-violet-700',
  },
  other: {
    label: 'Друго',
    icon: <Settings className="h-3.5 w-3.5" />,
    ring: '#64748b',
    bar: 'bg-slate-400',
    pill: 'bg-slate-100 text-slate-600',
  },
};

const PRIORITY_CONFIG: Record<StrategyPriority, { label: string; dot: string }> = {
  high:   { label: 'Висок', dot: 'bg-red-400' },
  medium: { label: 'Среден', dot: 'bg-amber-400' },
  low:    { label: 'Нисък', dot: 'bg-green-400' },
};

// ── Completion ring (SVG) ───────────────────────────────────────────────────
function CompletionRing({ pct, color }: { pct: number; color: string }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <svg width="60" height="60" viewBox="0 0 60 60" className="shrink-0">
      <circle cx="30" cy="30" r={r} fill="none" stroke="#e5e7eb" strokeWidth="5" />
      <circle
        cx="30" cy="30" r={r} fill="none"
        stroke={color} strokeWidth="5"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        transform="rotate(-90 30 30)"
      />
      <text x="30" y="34" textAnchor="middle" fontSize="12" fontWeight="bold" fill={color}>
        {pct}%
      </text>
    </svg>
  );
}

// ── Mini progress bar ──────────────────────────────────────────────────────
function MiniBar({ done, total, barClass }: { done: number; total: number; barClass: string }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full transition-all ${barClass}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-400 shrink-0 w-8 text-right">{pct}%</span>
    </div>
  );
}

// ── Main widget ────────────────────────────────────────────────────────────
export default function StrategiesProgressWidget() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/strategies')
      .then(r => r.ok ? r.json() : { data: [] })
      .then(r => setStrategies(r.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── Loading skeleton ───────────────────────────────────────────────────
  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-3">
          <div className="h-5 bg-gray-200 rounded w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="h-14 w-14 bg-gray-100 rounded-full" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-10 bg-gray-100 rounded" />)}
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────────
  if (strategies.length === 0) {
    return (
      <Card className="border-earth-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-earth-400" />
            Стратегии и планиране
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="mx-auto h-12 w-12 rounded-full bg-amber-50 flex items-center justify-center mb-3">
              <Lightbulb className="h-6 w-6 text-amber-400" />
            </div>
            <p className="text-sm text-gray-500 mb-1 font-medium">Все още няма стратегии</p>
            <p className="text-xs text-gray-400 mb-4">Изберете от 12 готови шаблона</p>
            <Link href="/strategies">
              <Button size="sm" className="bg-earth-300 hover:bg-earth-400 text-white">
                Избери стратегии
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Compute stats ──────────────────────────────────────────────────────
  const active     = strategies.filter(s => s.status === 'active');
  const completed  = strategies.filter(s => s.status === 'completed');
  const draft      = strategies.filter(s => s.status === 'draft');
  const onHold     = strategies.filter(s => s.status === 'on_hold');

  const allInitiatives = strategies.flatMap(s => s.strategy_initiatives ?? []);
  const doneInit = allInitiatives.filter(i => i.status === 'completed').length;
  const totalInit = allInitiatives.length;
  const initPct = totalInit > 0 ? Math.round((doneInit / totalInit) * 100) : 0;

  const totalReduction = strategies.reduce(
    (sum, s) => sum + (s.estimated_reduction_co2e ?? 0), 0,
  );

  // Ring color by completion
  const ringColor =
    initPct >= 70 ? '#10b981' :
    initPct >= 35 ? '#f59e0b' :
    '#6b7280';

  // Top 3 active (most initiatives)
  const topStrategies = [...active]
    .sort((a, b) => (b.strategy_initiatives?.length ?? 0) - (a.strategy_initiatives?.length ?? 0))
    .slice(0, 3);

  // Category breakdown (active)
  const categoryCounts: Partial<Record<StrategyCategory, number>> = {};
  active.forEach(s => {
    categoryCounts[s.category] = (categoryCounts[s.category] ?? 0) + 1;
  });
  const topCategories = Object.entries(categoryCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4) as [StrategyCategory, number][];

  return (
    <Card className="border-earth-200">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            Стратегии и планиране
          </CardTitle>
          <div className="flex items-center gap-1.5">
            {completed.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                {completed.length} завършени
              </span>
            )}
            <Link href="/strategies">
              <Button variant="ghost" size="sm" className="text-earth-400 hover:text-earth-500 h-7 w-7 p-0">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">

        {/* ── Ring + summary ── */}
        <div className="flex items-center gap-4">
          <CompletionRing pct={initPct} color={ringColor} />
          <div className="flex-1 min-w-0 space-y-1">
            <p className="text-sm font-bold text-gray-800">
              {active.length > 0
                ? `${active.length} активн${active.length === 1 ? 'а' : 'и'} стратеги${active.length === 1 ? 'я' : 'и'}`
                : 'Няма активни'}
            </p>
            <p className="text-xs text-gray-400">
              {doneInit}/{totalInit} инициативи изпълнени
            </p>
            {totalReduction > 0 && (
              <p className="text-xs text-emerald-600 flex items-center gap-1 font-medium">
                <TrendingDown className="h-3 w-3" />
                ~{totalReduction.toFixed(0)} tCO₂e очаквано
              </p>
            )}
          </div>
        </div>

        {/* ── Status chips ── */}
        {(draft.length > 0 || onHold.length > 0) && (
          <div className="flex gap-1.5 flex-wrap">
            {draft.length > 0 && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                <Clock className="h-3 w-3" /> {draft.length} чернова
              </span>
            )}
            {onHold.length > 0 && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">
                <Pause className="h-3 w-3" /> {onHold.length} на пауза
              </span>
            )}
          </div>
        )}

        {/* ── Top active strategies ── */}
        {topStrategies.length > 0 && (
          <div className="space-y-2.5">
            {topStrategies.map(strategy => {
              const cfg   = CATEGORY_CONFIG[strategy.category] ?? CATEGORY_CONFIG.other;
              const prio  = PRIORITY_CONFIG[strategy.priority];
              const inits = strategy.strategy_initiatives ?? [];
              const done  = inits.filter(i => i.status === 'completed').length;

              return (
                <Link key={strategy.id} href={`/strategies/${strategy.id}`} className="block group">
                  <div className="rounded-lg border border-gray-100 p-2.5 hover:border-gray-200 hover:bg-gray-50 transition-all">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`shrink-0 inline-flex items-center justify-center h-5 w-5 rounded-md ${cfg.pill}`}>
                          {cfg.icon}
                        </span>
                        <span className="text-xs font-medium text-gray-700 truncate leading-4">
                          {strategy.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className={`inline-block h-2 w-2 rounded-full ${prio.dot}`} title={prio.label} />
                        {done === inits.length && inits.length > 0 && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        )}
                      </div>
                    </div>
                    {inits.length > 0 && (
                      <MiniBar done={done} total={inits.length} barClass={cfg.bar} />
                    )}
                    {inits.length === 0 && (
                      <p className="text-xs text-gray-400">Без инициативи</p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* ── Category breakdown chips ── */}
        {topCategories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {topCategories.map(([cat, count]) => {
              const cfg = CATEGORY_CONFIG[cat];
              return (
                <span
                  key={cat}
                  className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${cfg.pill}`}
                >
                  {cfg.icon}
                  {cfg.label} ({count})
                </span>
              );
            })}
          </div>
        )}

        {/* ── Footer link ── */}
        <div className="pt-1 border-t">
          <Link href="/strategies" className="text-xs text-earth-400 hover:text-earth-500 font-medium flex items-center gap-1">
            <Zap className="h-3 w-3" />
            Управлявай всички стратегии →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
