'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, ChevronRight, TrendingDown, CheckCircle, AlertCircle, Award, Calendar } from 'lucide-react';
import Link from 'next/link';

interface EmissionTarget {
  id: string;
  name: string;
  target_type: 'absolute' | 'percentage' | 'intensity';
  scope: number | null;
  baseline_year: number;
  baseline_value: number;
  target_value: number;
  current_value: number;
  target_year: number;
  status: 'active' | 'achieved' | 'missed' | 'cancelled';
}

const SCOPE_COLORS: Record<number, string> = {
  1: 'bg-green-100 text-green-700',
  2: 'bg-blue-100 text-blue-700',
  3: 'bg-orange-100 text-orange-700',
};

export default function TargetProgressWidget() {
  const [targets, setTargets] = useState<EmissionTarget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTargets() {
      try {
        const response = await fetch('/api/targets');
        if (response.ok) {
          const result = await response.json();
          setTargets((result.data || []).filter((t: EmissionTarget) => t.status === 'active').slice(0, 3));
        }
      } catch { /* silent */ }
      finally { setLoading(false); }
    }
    fetchTargets();
  }, []);

  const calculateProgress = (target: EmissionTarget) => {
    const now           = new Date();
    const cy            = now.getFullYear();
    const cm            = now.getMonth();
    const totalMonths   = (target.target_year - target.baseline_year) * 12;
    let monthsPassed    = 0;
    if (cy > target.baseline_year) {
      monthsPassed = (cy - target.baseline_year - 1) * 12 + (cm + 1);
    }
    const timeProgress  = totalMonths > 0
      ? Math.max(0, Math.min((monthsPassed / totalMonths) * 100, 100))
      : 0;

    let emissionProgress = 0;
    if (target.target_type === 'percentage') {
      const reduction     = ((target.baseline_value - target.current_value) / target.baseline_value) * 100;
      emissionProgress    = (reduction / target.target_value) * 100;
    } else {
      const totalRed      = target.baseline_value - target.target_value;
      const currentRed    = target.baseline_value - target.current_value;
      emissionProgress    = totalRed > 0 ? (currentRed / totalRed) * 100 : 0;
    }
    emissionProgress = Math.min(Math.max(emissionProgress, 0), 100);
    const isOnTrack  = emissionProgress >= timeProgress || target.status === 'achieved';

    // SBTi alignment check
    const totalYears         = target.target_year - target.baseline_year;
    const targetAbs          = target.target_type === 'percentage'
      ? target.baseline_value * (1 - target.target_value / 100)
      : target.target_value;
    const reductionPerYear   = totalYears > 0 ? (target.baseline_value - targetAbs) / totalYears : 0;
    const annualRate         = target.baseline_value > 0 ? (reductionPerYear / target.baseline_value) * 100 : 0;
    const isSBTiAligned      = annualRate >= 4.2;

    const yearsLeft = Math.max(0, target.target_year - cy);

    return { progress: emissionProgress, timeProgress, isOnTrack, isSBTiAligned, yearsLeft };
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-3">
          <div className="h-5 bg-gray-200 rounded w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-20 bg-gray-100 rounded" />
            <div className="h-20 bg-gray-100 rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (targets.length === 0) {
    return (
      <Card className="border-earth-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Target className="h-4 w-4 text-earth-400" />
            Цели за намаляване
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Target className="mx-auto h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500 mb-3">Нямате активни цели</p>
            <Link href="/targets">
              <Button size="sm" className="bg-earth-300 hover:bg-earth-400">Създай цел</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const onTrackCount = targets.filter(t => calculateProgress(t).isOnTrack).length;

  return (
    <Card className="border-earth-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Target className="h-4 w-4 text-earth-400" />
            Цели за намаляване
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              onTrackCount === targets.length ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {onTrackCount}/{targets.length} в графика
            </span>
            <Link href="/targets">
              <Button variant="ghost" size="sm" className="text-earth-400 hover:text-earth-500">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {targets.map(target => {
          const { progress, timeProgress, isOnTrack, isSBTiAligned, yearsLeft } = calculateProgress(target);

          return (
            <div key={target.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-medium text-gray-700 truncate max-w-[160px]">{target.name}</span>
                  {target.scope && (
                    <span className={`text-xs px-1.5 py-0 rounded-full shrink-0 ${SCOPE_COLORS[target.scope]}`}>
                      S{target.scope}
                    </span>
                  )}
                  {isSBTiAligned && (
                    <Award className="h-3.5 w-3.5 text-emerald-500 shrink-0" aria-label="SBTi aligned" />
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {isOnTrack
                    ? <CheckCircle className="h-4 w-4 text-green-500" />
                    : <AlertCircle className="h-4 w-4 text-amber-500" />
                  }
                  <span className={`font-semibold ${isOnTrack ? 'text-green-600' : 'text-amber-600'}`}>
                    {progress.toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Stacked progress bars */}
              <div className="relative w-full bg-gray-200 rounded-full h-2.5">
                {/* Time marker */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-gray-500 rounded z-10"
                  style={{ left: `${timeProgress}%` }}
                  title={`Изминало време: ${timeProgress.toFixed(0)}%`}
                />
                {/* Emission progress */}
                <div
                  className={`h-2.5 rounded-full transition-all ${isOnTrack ? 'bg-earth-400' : 'bg-amber-500'}`}
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="flex justify-between text-xs text-gray-400">
                <span>
                  {target.target_type === 'percentage'
                    ? `Цел: -${target.target_value}%`
                    : `Цел: ${target.target_value.toFixed(1)} tCO2e`
                  }
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {yearsLeft > 0 ? `${yearsLeft} год. оставащи` : target.target_year}
                </span>
              </div>
            </div>
          );
        })}

        <div className="pt-1 border-t">
          <Link href="/targets" className="text-xs text-earth-400 hover:text-earth-500 font-medium flex items-center gap-1">
            <TrendingDown className="h-3 w-3" />
            Прогнози и детайли →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
