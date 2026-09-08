'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import { regulatoryGuidance } from '@/lib/i18n/regulatory-guidance';

const SECTIONS = [
  regulatoryGuidance.euEts,
  regulatoryGuidance.euEtsScreening,
  regulatoryGuidance.installation,
  regulatoryGuidance.thermalInputMw,
  regulatoryGuidance.annexI,
] as const;

export function EuEtsGuidancePanel() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-blue-100 bg-blue-50/60 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium text-blue-900 hover:bg-blue-50 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Info className="h-4 w-4 text-blue-600 shrink-0" />
          Какво означават тези термини? (EU ETS, скрининг, MW, Annex I)
        </span>
        {open ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-blue-100">
          {SECTIONS.map(section => (
            <div key={section.title}>
              <p className="text-sm font-semibold text-blue-900">{section.title}</p>
              <p className="text-xs text-blue-800/90 leading-relaxed mt-0.5">{section.body}</p>
            </div>
          ))}
          <p className="text-xs text-blue-700/80 pt-1 border-t border-blue-100">
            Нуждаете се от правен преглед? Свържете се с сертификационен орган или адвокат по околна среда.
          </p>
        </div>
      )}
    </div>
  );
}
