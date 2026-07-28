'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, AlertTriangle, ChevronRight, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';
import type { DataQualityResult } from '@/app/api/data-quality/route';

function ScoreRing({ score }: { score: number }) {
  const color =
    score >= 85 ? '#22c55e' :
    score >= 60 ? '#f59e0b' :
    '#ef4444';

  const r = 22;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

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
        {score}%
      </text>
    </svg>
  );
}

function Bar({ value, color }: { value: number; color: string }) {
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
      <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${value}%` }} />
    </div>
  );
}

export default function DataQualityWidget({ year }: { year?: number }) {
  const [data, setData] = useState<DataQualityResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setData(null);
    const url = year ? `/api/data-quality?year=${year}` : '/api/data-quality';
    fetch(url)
      .then(r => r.ok ? r.json() : null)
      .then(r => r && setData(r.data))
      .finally(() => setLoading(false));
  }, [year]);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-3"><div className="h-5 bg-gray-200 rounded w-2/3" /></CardHeader>
        <CardContent><div className="h-24 bg-gray-100 rounded" /></CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const scoreColor =
    data.overallScore >= 85 ? 'text-green-600' :
    data.overallScore >= 60 ? 'text-amber-600' :
    'text-red-500';

  const hasWarnings = data.missingMonths.length > 0 || data.scope3TxUnclassified > 0;

  return (
    <Card className="border-earth-200">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-earth-400" />
            Качество на данните
          </CardTitle>
          <Link href="/data-quality">
            <button className="text-earth-400 hover:text-earth-500">
              <ChevronRight className="h-4 w-4" />
            </button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Score ring + summary */}
        <div className="flex items-center gap-4">
          <ScoreRing score={data.overallScore} />
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-bold ${scoreColor}`}>
              {data.overallScore >= 85 ? 'Отлично' :
               data.overallScore >= 60 ? 'Добро' : 'Непълно'}
            </p>
            <p className="text-xs text-gray-400">Обща оценка {data.year}</p>
            {hasWarnings && (
              <p className="text-xs text-amber-600 flex items-center gap-1 mt-0.5">
                <AlertTriangle className="h-3 w-3" />
                {data.missingMonths.length > 0 && `${data.missingMonths.length} липсв. месеца`}
                {data.missingMonths.length > 0 && data.scope3TxUnclassified > 0 && ' · '}
                {data.scope3TxUnclassified > 0 && `${data.scope3TxUnclassified} некласиф.`}
              </p>
            )}
          </div>
        </div>

        {/* Per-scope bars */}
        <div className="space-y-2 text-xs">
          <div>
            <div className="flex justify-between text-gray-600">
              <span>Обхват 1</span>
              <span className="font-medium">{data.scope1Completeness}%</span>
            </div>
            <Bar value={data.scope1Completeness}
              color={data.scope1Completeness >= 80 ? 'bg-green-400' : data.scope1Completeness >= 50 ? 'bg-amber-400' : 'bg-red-400'} />
          </div>
          <div>
            <div className="flex justify-between text-gray-600">
              <span>Обхват 2</span>
              <span className="font-medium">{data.scope2Completeness}%</span>
            </div>
            <Bar value={data.scope2Completeness}
              color={data.scope2Completeness >= 80 ? 'bg-green-400' : data.scope2Completeness >= 50 ? 'bg-amber-400' : 'bg-red-400'} />
          </div>
          {data.scope3Available && (
            <div>
              <div className="flex justify-between text-gray-600">
                <span>Обхват 3 класиф.</span>
                <span className="font-medium">{data.scope3ClassificationRate}%</span>
              </div>
              <Bar value={data.scope3ClassificationRate}
                color={data.scope3ClassificationRate >= 70 ? 'bg-blue-400' : 'bg-amber-400'} />
            </div>
          )}
        </div>

        <div className="pt-1 border-t">
          <Link href="/data-quality" className="text-xs text-earth-400 hover:text-earth-500 font-medium flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" /> Пълен анализ →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
