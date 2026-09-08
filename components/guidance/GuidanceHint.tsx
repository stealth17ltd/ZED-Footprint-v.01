'use client';

import { HelpCircle } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { regulatoryGuidance, type GuidanceKey } from '@/lib/i18n/regulatory-guidance';

interface GuidanceHintProps {
  /** Predefined key from regulatory-guidance.ts */
  guidanceKey?: GuidanceKey;
  /** Or custom title + body */
  title?: string;
  body?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
}

export function GuidanceHint({
  guidanceKey,
  title: customTitle,
  body: customBody,
  side = 'top',
  className,
}: GuidanceHintProps) {
  const entry = guidanceKey ? regulatoryGuidance[guidanceKey] : null;
  const title = customTitle ?? entry?.title ?? '';
  const body = customBody ?? entry?.body ?? '';

  if (!title && !body) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`inline-flex items-center justify-center text-gray-400 hover:text-earth-500 transition-colors align-middle ${className ?? ''}`}
          aria-label={`Помощ: ${title}`}
        >
          <HelpCircle className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent side={side} className="w-80 p-4 text-sm">
        {title && <p className="font-semibold text-gray-900 mb-1.5">{title}</p>}
        <p className="text-gray-600 leading-relaxed">{body}</p>
      </PopoverContent>
    </Popover>
  );
}

/** Label row with optional guidance popover */
export function LabelWithGuidance({
  htmlFor,
  label,
  guidanceKey,
  title,
  body,
}: {
  htmlFor?: string;
  label: string;
  guidanceKey?: GuidanceKey;
  title?: string;
  body?: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <GuidanceHint guidanceKey={guidanceKey} title={title} body={body} />
    </div>
  );
}
