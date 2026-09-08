'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import { regulatoryGuidance } from '@/lib/i18n/regulatory-guidance';

const SECTIONS = [
  regulatoryGuidance.vsme,
  regulatoryGuidance.vsmeReadiness,
] as const;

export function VsmeGuidancePanel() {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium text-indigo-900 hover:bg-indigo-50 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Info className="h-4 w-4 text-indigo-600 shrink-0" />
          Какво е VSME и как да четете тази страница?
        </span>
        {open ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-indigo-100">
          {SECTIONS.map(section => (
            <div key={section.title}>
              <p className="text-sm font-semibold text-indigo-900">{section.title}</p>
              <p className="text-xs text-indigo-800/90 leading-relaxed mt-0.5">{section.body}</p>
            </div>
          ))}
          <p className="text-xs text-indigo-700/80 pt-1 border-t border-indigo-100">
            Ако сте извън CSRD обхват, VSME е препоръчителният доброволен маршрут. Проверете и{' '}
            <strong>Регулаторен скрининг</strong> за CSRD/EU ETS.
          </p>
        </div>
      )}
    </div>
  );
}
