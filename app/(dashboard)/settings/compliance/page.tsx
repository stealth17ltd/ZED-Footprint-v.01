'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import {
  ShieldCheck, FileText, Building2, Loader2, ChevronRight, AlertTriangle,
  CheckCircle2, HelpCircle, ExternalLink, BookOpen,
} from 'lucide-react';
import { EuEtsGuidancePanel } from '@/components/guidance/EuEtsGuidancePanel';
import { GuidanceHint } from '@/components/guidance/GuidanceHint';
import { regulatoryGuidance } from '@/lib/i18n/regulatory-guidance';
import { ComplianceRegulationCard } from '@/components/compliance/ComplianceRegulationCard';
import type { RegulationAction } from '@/lib/compliance/regulation-catalog';
import type { ComplianceStatus } from '@/lib/reports/compliance-scoring';

interface ComplianceRow {
  ruleKey: string;
  regulation: string;
  requirement: string;
  requirementTypeLabel: string;
  status: ComplianceStatus;
  note: string;
  ruleVersion: string;
  catalog?: {
    officialTitle: string;
    officialUrl?: string;
    officialSourceLabel?: string;
    officialSources?: { label: string; url: string }[];
    summaryBg: string;
  } | null;
  actions?: RegulationAction[];
}

interface ActionPlanItem {
  priority: number;
  action: string;
  regulation: string;
  timeline: string;
  impact: 'висок' | 'среден' | 'нисък';
}

interface EvaluateResponse {
  company: string;
  reportingYear: number;
  ruleEngineVersion: string;
  csrd: {
    mandatoryScope: string;
    summary: string;
    suggestedRoute: string;
    ruleVersion: string;
  };
  esrs: {
    standardCode: string;
    standardVersion: string;
    sourceReference: string;
  };
  summary: {
    readinessScore: number;
    fulfilled: number;
    partial: number;
    requiresReview: number;
    gap: number;
    applicableTotal: number;
  };
  rows: ComplianceRow[];
  actionPlan?: ActionPlanItem[];
}

const CSRD_SCOPE_LABEL: Record<string, string> = {
  in_scope: 'Вероятно в задължителен CSRD обхват',
  out_of_scope: 'Извън задължителен CSRD обхват',
  requires_review: 'CSRD обхват — необходим преглед',
};

export default function ComplianceScreeningPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(String(currentYear));
  const [data, setData] = useState<EvaluateResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/compliance/evaluate?year=${year}`);
      if (res.ok) {
        const json = await res.json();
        setData(json.data ?? null);
      }
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !data) {
    return <PageSkeleton />;
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-emerald-100 flex items-center justify-center">
            <ShieldCheck className="h-6 w-6 text-emerald-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              Регулаторен скрининг
              <GuidanceHint guidanceKey="screening" />
            </h1>
            <p className="text-sm text-gray-500">
              Автоматична оценка по закони, ЕС изисквания и доброволни стандарти — не е правен съвет
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Link href="/reports?type=compliance">
            <Button className="bg-emerald-700 hover:bg-emerald-800 gap-2">
              <FileText className="h-4 w-4" />
              PDF отчет
            </Button>
          </Link>
        </div>
      </div>

      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-emerald-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Индекс на готовност</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-emerald-700">{data.summary.readinessScore}%</p>
                <p className="text-xs text-gray-500 mt-1">
                  {data.summary.fulfilled} изпълнени от {data.summary.applicableTotal} приложими
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">CSRD обхват</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-semibold text-gray-900">
                  {CSRD_SCOPE_LABEL[data.csrd.mandatoryScope] ?? data.csrd.mandatoryScope}
                </p>
                <p className="text-xs text-gray-500 mt-2 line-clamp-3">{data.csrd.summary}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Версия на правила</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-mono text-gray-800">v{data.ruleEngineVersion}</p>
                <p className="text-xs text-gray-500 mt-1">
                  ESRS {data.esrs.standardVersion} · CSRD {data.csrd.ruleVersion}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-amber-200 bg-amber-50/40">
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-start gap-3">
                <HelpCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm text-gray-700 space-y-1">
                  <p>
                    <strong>{regulatoryGuidance.euEts.title}</strong> — {regulatoryGuidance.euEts.body}
                  </p>
                  <p>
                    <strong>EU ETS</strong> се оценява по данни от{' '}
                    <Link href="/settings/company" className="text-emerald-700 underline font-medium">
                      настройки на компанията
                    </Link>
                    , не по общ корпоративен tCO₂e.
                  </p>
                  <p className="text-xs text-gray-500">
                    Препоръчителен маршрут: {data.csrd.suggestedRoute}
                  </p>
                </div>
              </div>
              <EuEtsGuidancePanel />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Проверени изисквания ({data.rows.length})</CardTitle>
              <CardDescription>
                Типове: закон · ЕС директива · стандарт · доброволна рамка
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.rows.map((row) => (
                <ComplianceRegulationCard
                  key={row.ruleKey}
                  ruleKey={row.ruleKey}
                  regulation={row.regulation}
                  requirement={row.requirement}
                  requirementTypeLabel={row.requirementTypeLabel}
                  status={row.status}
                  note={row.note}
                  catalog={row.catalog}
                  actions={row.actions}
                />
              ))}
            </CardContent>
          </Card>

          {data.actionPlan && data.actionPlan.length > 0 && (
            <Card className="border-indigo-200">
              <CardHeader>
                <CardTitle className="text-base">Препоръчани следващи стъпки</CardTitle>
                <CardDescription>
                  Действия в платформата на база текущия скрининг — не са правен съвет
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.actionPlan.map((item, idx) => (
                  <div key={idx} className="flex gap-3 rounded-lg border border-gray-100 p-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                      {item.priority}
                    </span>
                    <div>
                      <p className="text-sm text-gray-900">{item.action}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {item.regulation} · {item.timeline} · {item.impact} приоритет
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="flex flex-wrap gap-3 text-sm">
            <Link href="/settings/company" className="inline-flex items-center gap-1 text-emerald-700 hover:underline">
              <Building2 className="h-4 w-4" /> EU ETS въпросник
              <ChevronRight className="h-3 w-3" />
            </Link>
            <Link href="/vsme" className="inline-flex items-center gap-1 text-indigo-700 hover:underline">
              <BookOpen className="h-4 w-4" /> VSME готовност
              <ChevronRight className="h-3 w-3" />
            </Link>
            <Link href="/reports?type=compliance" className="inline-flex items-center gap-1 text-emerald-700 hover:underline">
              <ExternalLink className="h-4 w-4" /> Генерирай PDF отчет за съответствие
            </Link>
          </div>
        </>
      )}

      {!data && !loading && (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <AlertTriangle className="h-8 w-8 mx-auto mb-3 text-amber-500" />
            Неуспешно зареждане на скрининга. Опитайте отново.
            <Button variant="outline" className="mt-4" onClick={load}>Опитай пак</Button>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-gray-400 flex items-center gap-1">
        <CheckCircle2 className="h-3 w-3" />
        Същите правила се използват в PDF „Отчет за съответствие“ от секция Отчети.
      </p>
    </div>
  );
}
