'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { InfoTooltip } from '@/components/ui/info-tooltip';

interface EmissionsSummaryCardProps {
  title: string;
  value: number;
  unit?: string;
  previousValue?: number;
  delta?: number | null;
  deltaLabel?: string;
  target?: number;
  icon: React.ReactNode;
  tooltip?: string;
  colorClass?: string;
  iconBgClass?: string;
  showProgress?: boolean;
  totalForPercentage?: number;
  subtitle?: string;
  href?: string;
  highlight?: boolean;
  emptyLabel?: string;
}

function formatValue(value: number): string {
  if (value === 0) return '0';
  if (value >= 10000) return `${(value / 1000).toFixed(1)}K`;
  if (value >= 1000) return value.toLocaleString('bg-BG', { maximumFractionDigits: 0 });
  if (value >= 100) return value.toFixed(1);
  return value.toFixed(2);
}

export default function EmissionsSummaryCard({
  title,
  value,
  unit = 'tCO₂e',
  previousValue,
  delta,
  deltaLabel,
  icon,
  tooltip,
  colorClass = 'text-earth-400',
  iconBgClass,
  showProgress = false,
  totalForPercentage,
  subtitle,
  href,
  highlight = false,
  emptyLabel,
}: EmissionsSummaryCardProps) {
  // Effective delta: prefer explicit prop, fall back to previousValue calc
  const effectiveDelta =
    delta !== undefined
      ? delta
      : previousValue && previousValue > 0
        ? ((value - previousValue) / previousValue) * 100
        : null;

  const percentageOfTotal =
    showProgress && totalForPercentage && totalForPercentage > 0
      ? (value / totalForPercentage) * 100
      : null;

  // Derive icon background from colorClass when not provided
  const effectiveIconBgClass =
    iconBgClass ||
    (colorClass.includes('blue')
      ? 'bg-blue-50'
      : colorClass.includes('emerald')
        ? 'bg-emerald-50'
        : colorClass.includes('purple')
          ? 'bg-purple-50'
          : colorClass.includes('orange')
            ? 'bg-orange-50'
            : 'bg-[#C5E1A5]/30');

  const progressBarColor = colorClass.includes('blue')
    ? 'bg-blue-400'
    : colorClass.includes('emerald')
      ? 'bg-emerald-400'
      : 'bg-earth-200';

  const isIncrease = effectiveDelta !== null && effectiveDelta > 0;
  const isDecrease = effectiveDelta !== null && effectiveDelta < 0;

  const chipClass = isIncrease
    ? 'bg-red-50 text-red-600'
    : isDecrease
      ? 'bg-green-50 text-green-700'
      : 'bg-gray-100 text-gray-500';

  const isEmpty = value === 0 && !!emptyLabel;

  const inner = (
    <Card
      className={[
        'border transition-all duration-200',
        highlight
          ? 'border-earth-200 shadow-md bg-gradient-to-br from-[#F5F5F5] to-white'
          : 'border-gray-100 shadow-sm',
        href ? 'hover:shadow-md hover:border-gray-200 cursor-pointer' : 'hover:shadow-md',
      ].join(' ')}
    >
      <CardContent className="p-5">
        {/* Icon + trend chip */}
        <div className="flex items-start justify-between mb-4">
          <div
            className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${effectiveIconBgClass}`}
          >
            <span className={colorClass}>{icon}</span>
          </div>

          {effectiveDelta !== null && (
            <span
              className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${chipClass}`}
            >
              {isIncrease ? (
                <TrendingUp className="h-3 w-3" />
              ) : isDecrease ? (
                <TrendingDown className="h-3 w-3" />
              ) : (
                <Minus className="h-3 w-3" />
              )}
              {isIncrease ? '+' : ''}
              {effectiveDelta.toFixed(1)}%
            </span>
          )}
        </div>

        {/* Value */}
        {isEmpty ? (
          <p className="text-sm text-gray-400 font-medium mb-0.5 leading-snug">{emptyLabel}</p>
        ) : (
          <div className="flex items-baseline gap-1.5 mb-0.5">
            <span className="text-2xl font-bold text-gray-900 tabular-nums">
              {formatValue(value)}
            </span>
            <span className="text-xs text-gray-400 font-medium">{unit}</span>
          </div>
        )}

        {/* Title + tooltip */}
        <div className="flex items-center gap-1">
          <p className="text-sm text-gray-500">{title}</p>
          {tooltip && <InfoTooltip content={tooltip} />}
        </div>

        {/* Delta period label */}
        {effectiveDelta !== null && deltaLabel && (
          <p className="text-xs text-gray-400 mt-0.5">{deltaLabel}</p>
        )}

        {/* Progress bar (Scope 1 / Scope 2 share of total) */}
        {showProgress && percentageOfTotal !== null && (
          <div className="mt-3">
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full ${progressBarColor}`}
                style={{ width: `${Math.min(percentageOfTotal, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {percentageOfTotal.toFixed(0)}% от общите
            </p>
          </div>
        )}

        {/* Subtitle */}
        {subtitle && (
          <p className="text-xs text-gray-400 mt-2 truncate">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}
