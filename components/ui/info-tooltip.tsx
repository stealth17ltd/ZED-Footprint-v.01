'use client';

import * as React from 'react';
import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface InfoTooltipProps {
  content: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  size?: 'sm' | 'md' | 'lg';
}

export function InfoTooltip({ content, side = 'top', size = 'sm' }: InfoTooltipProps) {
  const iconSize = size === 'sm' ? 'h-4 w-4' : size === 'md' ? 'h-5 w-5' : 'h-6 w-6';
  
  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center justify-center text-gray-400 hover:text-earth-400 transition-colors"
            onClick={(e) => e.preventDefault()}
          >
            <HelpCircle className={iconSize} />
          </button>
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs bg-gray-900 text-white p-3">
          <p className="text-sm leading-relaxed">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}


