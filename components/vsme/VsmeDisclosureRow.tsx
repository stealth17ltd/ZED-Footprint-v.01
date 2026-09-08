'use client';

import Link from 'next/link';
import { ChevronRight, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { GuidanceHint } from '@/components/guidance/GuidanceHint';
import type { GuidanceKey } from '@/lib/i18n/regulatory-guidance';

type VsmeStatus = 'complete' | 'partial' | 'missing' | 'na';

const STATUS_CFG: Record<VsmeStatus, { label: string; cls: string; icon: typeof CheckCircle2 }> = {
  complete: { label: 'Готово', cls: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle2 },
  partial: { label: 'Частично', cls: 'bg-amber-100 text-amber-800 border-amber-200', icon: AlertTriangle },
  missing: { label: 'Липсва', cls: 'bg-red-100 text-red-800 border-red-200', icon: AlertTriangle },
  na: { label: '—', cls: 'bg-gray-100 text-gray-600 border-gray-200', icon: HelpCircle },
};

interface VsmeDisclosureRowProps {
  titleBg: string;
  hintBg: string;
  note: string;
  status: VsmeStatus;
  actionHref: string;
  actionLabel: string;
  guidanceKey: GuidanceKey;
}

function RowInner({
  titleBg, hintBg, note, status, actionLabel, guidanceKey,
}: Omit<VsmeDisclosureRowProps, 'actionHref'>) {
  const cfg = STATUS_CFG[status];
  const Icon = cfg.icon;

  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="font-medium text-gray-900 group-hover:text-earth-600 transition-colors">{titleBg}</p>
          <GuidanceHint guidanceKey={guidanceKey} />
        </div>
        <p className="text-xs text-gray-500 mt-0.5">{hintBg}</p>
        <p className="text-sm text-gray-600 mt-2">{note}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge className={`${cfg.cls} border`}>{cfg.label}</Badge>
        {status === 'complete' && <Icon className="h-4 w-4 text-green-600" />}
        <span className="text-xs font-medium text-earth-600 flex items-center gap-0.5">
          {actionLabel}
          <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
        </span>
      </div>
    </div>
  );
}

export function VsmeDisclosureRow(props: VsmeDisclosureRowProps) {
  const { actionHref, ...inner } = props;
  const className = 'group block rounded-lg border p-4 bg-white hover:bg-earth-50/50 hover:border-earth-200 transition-all cursor-pointer';

  if (actionHref.startsWith('#')) {
    return (
      <a href={actionHref} className={className}>
        <RowInner {...inner} />
      </a>
    );
  }

  return (
    <Link href={actionHref} className={className}>
      <RowInner {...inner} />
    </Link>
  );
}
