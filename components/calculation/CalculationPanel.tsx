'use client';

import { useCallback, useEffect, useState } from 'react';
import { Calculator, History, Loader2, Database, AlertCircle } from 'lucide-react';
import type { CalculationSnapshotRow } from '@/lib/carbon/calculation-snapshot';

interface CalculationPanelProps {
  emissionId: string;
  compact?: boolean;
}

interface CalculationResponse {
  current: CalculationSnapshotRow | null;
  history: CalculationSnapshotRow[];
}

function sourceBadge(type: 'database' | 'fallback') {
  if (type === 'database') {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
        <Database className="h-3 w-3" /> База данни
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
      <AlertCircle className="h-3 w-3" /> Резервен фактор
    </span>
  );
}

export default function CalculationPanel({ emissionId, compact = false }: CalculationPanelProps) {
  const [data, setData] = useState<CalculationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/emissions/${emissionId}/calculation`);
      if (res.ok) {
        const json = await res.json();
        setData(json.data ?? null);
      }
    } catch {
      /* silent — table may not exist yet */
    } finally {
      setLoading(false);
    }
  }, [emissionId]);

  useEffect(() => {
    load();
  }, [load]);

  const snap = data?.current;

  return (
    <div className={`rounded-lg border border-teal-100 bg-teal-50/50 ${compact ? 'p-3' : 'p-4'} space-y-3`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Calculator className="h-4 w-4 text-teal-600" />
          <h3 className="font-semibold text-gray-900 text-sm">Изчисление и одитна следа</h3>
          {snap && (
            <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">
              v{snap.calculation_version}
            </span>
          )}
        </div>
        {(data?.history.length ?? 0) > 1 && (
          <button
            type="button"
            onClick={() => setShowHistory(h => !h)}
            className="text-xs text-teal-700 hover:text-teal-800 flex items-center gap-1"
          >
            <History className="h-3 w-3" />
            {showHistory ? 'Скрий история' : `История (${data!.history.length})`}
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Зареждане...
        </div>
      ) : !snap ? (
        <p className="text-xs text-gray-500">
          Няма запазено изчисление. След миграцията пуснете{' '}
          <code className="text-teal-700">npm run backfill:snapshots</code> или редактирайте записа за нов snapshot.
        </p>
      ) : (
        <>
          <div className="bg-white rounded-md border border-teal-100 p-3 space-y-2">
            <p className="text-sm font-mono text-gray-800 leading-relaxed">
              {snap.calculation_expression}
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {sourceBadge(snap.factor_source_type)}
              {snap.factor_source_name && (
                <span className="text-xs text-gray-500">
                  {snap.factor_source_name}
                  {snap.factor_source_year ? ` · ${snap.factor_source_year}` : ''}
                </span>
              )}
            </div>
          </div>

          {!compact && (
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-gray-500 mb-0.5">Ефективен фактор</p>
                <p className="font-medium">{snap.effective_factor} {snap.factor_unit}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-0.5">Методология</p>
                <p className="font-medium">{snap.methodology_version}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-0.5">Изчислено на</p>
                <p className="font-medium">
                  {new Date(snap.calculated_at).toLocaleString('bg-BG')}
                </p>
              </div>
              <div>
                <p className="text-gray-500 mb-0.5">Резултат</p>
                <p className="font-medium text-teal-700">{Number(snap.co2e_tons).toFixed(4)} tCO₂e</p>
              </div>
            </div>
          )}

          {showHistory && data && data.history.length > 1 && (
            <div className="space-y-2 pt-2 border-t border-teal-100">
              <p className="text-xs font-medium text-gray-600">Предишни версии</p>
              {data.history
                .filter(h => !h.is_current)
                .map(h => (
                  <div key={h.id} className="text-xs bg-white/80 rounded p-2 border border-gray-100">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-gray-700">v{h.calculation_version}</span>
                      <span className="text-gray-400">
                        {new Date(h.calculated_at).toLocaleDateString('bg-BG')}
                      </span>
                    </div>
                    <p className="font-mono text-gray-600 truncate">{h.calculation_expression}</p>
                  </div>
                ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
