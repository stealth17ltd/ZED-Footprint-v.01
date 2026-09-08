'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import {
  ExternalLink, ChevronDown, ChevronUp, ArrowRight, BookOpen,
} from 'lucide-react';
import { useState } from 'react';
import type { ComplianceStatus } from '@/lib/reports/compliance-scoring';
import type { RegulationAction, OfficialSource } from '@/lib/compliance/regulation-catalog';

const STATUS_CFG: Record<ComplianceStatus, { label: string; cls: string }> = {
  compliant: { label: 'Изпълнено', cls: 'bg-green-100 text-green-800 border-green-200' },
  partial: { label: 'Частично', cls: 'bg-amber-100 text-amber-800 border-amber-200' },
  requires_review: { label: 'Преглед', cls: 'bg-orange-100 text-orange-800 border-orange-200' },
  gap: { label: 'Пропуск', cls: 'bg-red-100 text-red-800 border-red-200' },
  na: { label: 'Не се прилага', cls: 'bg-gray-100 text-gray-600 border-gray-200' },
};

export interface ComplianceRegulationCardProps {
  ruleKey: string;
  regulation: string;
  requirement: string;
  requirementTypeLabel: string;
  status: ComplianceStatus;
  note: string;
  catalog?: {
    officialTitle: string;
    officialUrl?: string;
    officialSourceLabel?: string;
    officialSources?: OfficialSource[];
    summaryBg: string;
  } | null;
  actions?: RegulationAction[];
}

function OfficialSourceLink({ source }: { source: OfficialSource }) {
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      title={source.url}
      className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50/80 px-2.5 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-100 hover:border-emerald-300 transition-colors"
    >
      <BookOpen className="h-3.5 w-3.5 shrink-0" />
      <span>{source.label}</span>
      <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
    </a>
  );
}

export function ComplianceRegulationCard({
  regulation,
  requirement,
  requirementTypeLabel,
  status,
  note,
  catalog,
  actions = [],
}: ComplianceRegulationCardProps) {
  const [expanded, setExpanded] = useState(false);
  const st = STATUS_CFG[status];
  const hasActions = actions.length > 0;
  const sources = catalog?.officialSources?.length
    ? catalog.officialSources
    : catalog?.officialUrl
      ? [{ label: catalog.officialSourceLabel ?? 'Официален текст', url: catalog.officialUrl }]
      : [];

  return (
    <div className="rounded-lg border border-gray-100 overflow-hidden hover:border-gray-200 transition-colors">
      <div className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <span className="text-xs text-gray-400 uppercase tracking-wide">
              {requirementTypeLabel}
            </span>
            <h3 className="font-medium text-gray-900 text-sm">{regulation}</h3>
            {catalog?.officialTitle && catalog.officialTitle !== regulation && (
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2" title={catalog.officialTitle}>
                {catalog.officialTitle}
              </p>
            )}
          </div>
          <Badge variant="outline" className={st.cls}>{st.label}</Badge>
        </div>

        <p className="text-xs text-gray-600 mb-1">{requirement}</p>
        <p className="text-xs text-gray-500">{note}</p>

        <div className="flex flex-wrap items-center gap-2 mt-3">
          {sources.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {sources.map((source) => (
                <OfficialSourceLink key={`${source.label}-${source.url}`} source={source} />
              ))}
            </div>
          )}
          {hasActions && (
            <button
              type="button"
              onClick={() => setExpanded(v => !v)}
              className="inline-flex items-center gap-1 text-xs font-medium text-indigo-700 hover:text-indigo-900"
            >
              {expanded ? (
                <>Скрий действия <ChevronUp className="h-3.5 w-3.5" /></>
              ) : (
                <>Какво мога да направя? <ChevronDown className="h-3.5 w-3.5" /></>
              )}
            </button>
          )}
        </div>
      </div>

      {expanded && hasActions && (
        <div className="border-t border-gray-100 bg-gray-50/80 px-4 py-3 space-y-3">
          {catalog?.summaryBg && (
            <p className="text-xs text-gray-600 leading-relaxed">{catalog.summaryBg}</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {actions.filter(a => !a.external).map((action) => (
              <Link
                key={action.id}
                href={action.href}
                className="group flex items-start gap-2 rounded-md border border-white bg-white p-3 hover:border-emerald-200 hover:shadow-sm transition-all"
              >
                <ArrowRight className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{action.label}</p>
                  <p className="text-xs text-gray-500">{action.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
