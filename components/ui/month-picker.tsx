'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const MONTHS_BG = [
  'Януари', 'Февруари', 'Март', 'Април',
  'Май', 'Юни', 'Юли', 'Август',
  'Септември', 'Октомври', 'Ноември', 'Декември'
];

const MONTHS_BG_SHORT = [
  'Яну', 'Фев', 'Мар', 'Апр',
  'Май', 'Юни', 'Юли', 'Авг',
  'Сеп', 'Окт', 'Ное', 'Дек'
];

interface MonthPickerProps {
  value?: string; // YYYY-MM format
  onChange?: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export function MonthPicker({ 
  value, 
  onChange, 
  className,
  placeholder = 'Изберете период'
}: MonthPickerProps) {
  const [open, setOpen] = React.useState(false);
  
  // Parse current value or use current date
  const currentDate = value ? new Date(value + '-01') : new Date();
  const [viewYear, setViewYear] = React.useState(currentDate.getFullYear());
  
  const selectedYear = value ? parseInt(value.split('-')[0]) : null;
  const selectedMonth = value ? parseInt(value.split('-')[1]) - 1 : null;

  const handleMonthSelect = (monthIndex: number) => {
    const newValue = `${viewYear}-${String(monthIndex + 1).padStart(2, '0')}`;
    onChange?.(newValue);
    setOpen(false);
  };

  const handlePrevYear = () => setViewYear(y => y - 1);
  const handleNextYear = () => setViewYear(y => y + 1);

  const displayValue = value 
    ? `${MONTHS_BG[parseInt(value.split('-')[1]) - 1]} ${value.split('-')[0]}`
    : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          {displayValue}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <div className="p-3">
          {/* Year Navigation */}
          <div className="flex items-center justify-between mb-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handlePrevYear}
              className="h-7 w-7"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-semibold text-sm">{viewYear}</span>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleNextYear}
              className="h-7 w-7"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Month Grid */}
          <div className="grid grid-cols-4 gap-2">
            {MONTHS_BG_SHORT.map((month, index) => {
              const isSelected = selectedYear === viewYear && selectedMonth === index;
              const isCurrent = new Date().getFullYear() === viewYear && new Date().getMonth() === index;
              
              return (
                <Button
                  key={month}
                  variant={isSelected ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "h-9 text-xs",
                    isSelected && "bg-earth-300 hover:bg-earth-400 text-white",
                    isCurrent && !isSelected && "border border-earth-300 text-earth-400"
                  )}
                  onClick={() => handleMonthSelect(index)}
                >
                  {month}
                </Button>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="flex justify-between mt-4 pt-3 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={() => {
                onChange?.('');
                setOpen(false);
              }}
            >
              Изчисти
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-earth-400"
              onClick={() => {
                const now = new Date();
                const newValue = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                onChange?.(newValue);
                setViewYear(now.getFullYear());
                setOpen(false);
              }}
            >
              Този месец
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Helper to format period for display
export function formatPeriodBg(period: string): string {
  if (!period) return '';
  const [year, month] = period.split('-');
  return `${MONTHS_BG[parseInt(month) - 1]} ${year}`;
}


