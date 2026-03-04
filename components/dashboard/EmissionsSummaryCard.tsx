'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, Target, AlertTriangle } from 'lucide-react';
import { InfoTooltip } from '@/components/ui/info-tooltip';

interface EmissionsSummaryCardProps {
  title: string;
  value: number;
  unit?: string;
  previousValue?: number;
  target?: number;
  icon: React.ReactNode;
  tooltip?: string;
  colorClass?: string;
  showProgress?: boolean;
  totalForPercentage?: number;
}

export default function EmissionsSummaryCard({
  title,
  value,
  unit = 'tCO₂e',
  previousValue,
  target,
  icon,
  tooltip,
  colorClass = 'text-earth-400',
  showProgress = false,
  totalForPercentage,
}: EmissionsSummaryCardProps) {
  // Calculate percentage change
  const percentageChange = previousValue && previousValue > 0
    ? ((value - previousValue) / previousValue * 100)
    : null;

  // Calculate progress to target
  const targetProgress = target && target > 0
    ? ((target - value) / target * 100)
    : null;

  // Calculate percentage of total
  const percentageOfTotal = totalForPercentage && totalForPercentage > 0
    ? (value / totalForPercentage * 100)
    : null;

  const isIncrease = percentageChange !== null && percentageChange > 0;
  const isDecrease = percentageChange !== null && percentageChange < 0;
  const isOnTarget = target !== null && value <= target;

  return (
    <Card className="border-gray-200 hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {title}
            </CardTitle>
            {tooltip && <InfoTooltip content={tooltip} />}
          </div>
          <div className={colorClass}>{icon}</div>
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold ${colorClass}`}>
          {value.toFixed(2)}
        </div>
        <p className="text-xs text-gray-500 mt-1">{unit}</p>

        {/* Percentage change indicator */}
        {percentageChange !== null && (
          <div className={`flex items-center gap-1 mt-2 text-xs ${
            isIncrease ? 'text-red-600' : isDecrease ? 'text-green-600' : 'text-gray-500'
          }`}>
            {isIncrease ? (
              <TrendingUp className="h-3 w-3" />
            ) : isDecrease ? (
              <TrendingDown className="h-3 w-3" />
            ) : (
              <Minus className="h-3 w-3" />
            )}
            <span>
              {isIncrease ? '+' : ''}{percentageChange.toFixed(1)}% спрямо предишен период
            </span>
          </div>
        )}

        {/* Progress bar for percentage of total */}
        {showProgress && percentageOfTotal !== null && (
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${colorClass.includes('blue') ? 'bg-blue-500' : 'bg-earth-300'}`}
                style={{ width: `${Math.min(percentageOfTotal, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {percentageOfTotal.toFixed(0)}% от общите
            </p>
          </div>
        )}

        {/* Target indicator */}
        {target !== null && targetProgress !== null && (
          <div className={`flex items-center gap-1 mt-2 text-xs ${
            isOnTarget ? 'text-green-600' : 'text-amber-600'
          }`}>
            {isOnTarget ? (
              <Target className="h-3 w-3" />
            ) : (
              <AlertTriangle className="h-3 w-3" />
            )}
            <span>
              {isOnTarget 
                ? `${targetProgress.toFixed(0)}% под целта` 
                : `${Math.abs(targetProgress).toFixed(0)}% над целта`
              }
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


