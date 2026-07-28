'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Target,
  Plus,
  Loader2,
  TrendingDown,
  CheckCircle,
  XCircle,
  AlertCircle,
  Trash2,
  Edit,
  RefreshCw,
  Bell,
  AlertTriangle,
  Award,
  TrendingUp,
  Calendar,
  Zap,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Pencil,
  X,
  Check,
  BookOpen,
} from 'lucide-react';
import {
  TARGET_TEMPLATES,
  DIFFICULTY_LABELS,
  DIFFICULTY_COLORS,
  SCOPE_FILTER_OPTIONS,
  type TargetTemplate,
} from '@/lib/target-templates';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { ForecastPoint, ForecastResult } from '@/app/api/targets/forecast/route';

interface EmissionTarget {
  id: string;
  name: string;
  description: string;
  target_type: 'absolute' | 'percentage' | 'intensity';
  scope: number | null;
  baseline_year: number;
  baseline_value: number;
  target_year: number;
  target_value: number;
  current_value: number;
  status: 'active' | 'achieved' | 'missed' | 'cancelled';
  created_at: string;
}

const TARGET_TYPE_LABELS = {
  absolute: 'Абсолютна (tCO2e)',
  percentage: 'Процентно намаление (%)',
  intensity: 'Интензивност (tCO2e/единица)',
};

const STATUS_CONFIG = {
  active:    { label: 'Активна',      color: 'bg-blue-100 text-blue-700',  icon: Target },
  achieved:  { label: 'Постигната',   color: 'bg-green-100 text-green-700', icon: CheckCircle },
  missed:    { label: 'Непостигната', color: 'bg-red-100 text-red-700',    icon: XCircle },
  cancelled: { label: 'Отменена',     color: 'bg-gray-100 text-gray-700',  icon: AlertCircle },
};

const SCOPE_LABELS: Record<number, string> = { 1: 'Обхват 1', 2: 'Обхват 2', 3: 'Обхват 3' };
const SCOPE_COLORS: Record<number, string> = {
  1: 'bg-green-100 text-green-700',
  2: 'bg-blue-100 text-blue-700',
  3: 'bg-orange-100 text-orange-700',
};

// ─── Forecast mini-chart ────────────────────────────────────────────────────

function ForecastChart({ forecast, targetAbsolute }: { forecast: ForecastResult; targetAbsolute: number }) {
  const data = forecast.forecastPoints;

  const customTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-gray-200 shadow-lg rounded-lg p-3 text-xs">
        <p className="font-semibold text-gray-700 mb-1">{label}</p>
        {payload.map((entry: any) => (
          entry.value != null && (
            <p key={entry.name} style={{ color: entry.color }}>
              {entry.name}: <span className="font-bold">{Number(entry.value).toFixed(3)}</span> tCO2e
            </p>
          )
        ))}
      </div>
    );
  };

  return (
    <div className="mt-4">
      <p className="text-xs font-medium text-gray-500 mb-2">Прогнозна траектория (tCO2e)</p>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 4, right: 12, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="year" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip content={customTooltip} />
          <Legend iconType="line" wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />

          {/* Required reduction path */}
          <Line
            type="monotone"
            dataKey="required"
            name="Необходим път"
            stroke="#22c55e"
            strokeWidth={2}
            dot={false}
            strokeDasharray="5 3"
          />
          {/* Historical actuals */}
          <Line
            type="monotone"
            dataKey="actual"
            name="Измерени"
            stroke="#3b82f6"
            strokeWidth={2.5}
            dot={{ r: 4, fill: '#3b82f6' }}
            connectNulls={false}
          />
          {/* Trend projection */}
          <Line
            type="monotone"
            dataKey="projected"
            name="Прогноза"
            stroke="#f97316"
            strokeWidth={2}
            strokeDasharray="4 2"
            dot={false}
          />
          {/* Target line */}
          <ReferenceLine
            y={targetAbsolute}
            stroke="#16a34a"
            strokeDasharray="8 4"
            label={{ value: 'Цел', position: 'insideTopRight', fontSize: 10, fill: '#16a34a' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Summary KPI card ──────────────────────────────────────────────────────

function KpiCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className={`rounded-xl p-4 ${color}`}>
      <p className="text-xs font-medium text-gray-600 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

// ─── Target template types ────────────────────────────────────────────────

interface TargetReviewItem {
  templateId:     string;
  name:           string;
  description:    string;
  target_type:    'absolute' | 'percentage' | 'intensity';
  scope:          string;
  baseline_year:  string;
  baseline_value: string;
  target_year:    string;
  target_value:   string;
  notes:          string;
}

function buildTargetReviewItem(template: TargetTemplate, currentYear: number): TargetReviewItem {
  return {
    templateId:     template.id,
    name:           template.name,
    description:    template.description,
    target_type:    template.target_type,
    scope:          template.scope?.toString() ?? '',
    baseline_year:  currentYear.toString(),
    baseline_value: '',
    target_year:    (currentYear + template.years_to_target).toString(),
    target_value:   template.suggested_target_value.toString(),
    notes:          '',
  };
}

// ─── Template card (browse step) ─────────────────────────────────────────────

const SCOPE_COLORS_PILL: Record<string, string> = {
  '1':    'bg-green-100 text-green-700',
  '2':    'bg-blue-100 text-blue-700',
  '3':    'bg-orange-100 text-orange-700',
  'null': 'bg-purple-100 text-purple-700',
};

function TargetTemplateCard({
  template,
  selected,
  onToggle,
}: {
  template: TargetTemplate;
  selected: boolean;
  onToggle: () => void;
}) {
  const scopeLabel = template.scope != null
    ? `Обхват ${template.scope}`
    : '1 + 2 + 3';
  const scopeKey   = template.scope?.toString() ?? 'null';

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
        selected
          ? 'border-earth-400 bg-earth-50 shadow-md ring-2 ring-earth-200'
          : 'border-gray-200 bg-white hover:border-earth-300 hover:shadow-sm'
      }`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900 leading-snug">{template.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">{template.framework}</p>
        </div>
        <div className={`h-6 w-6 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
          selected ? 'bg-earth-400 border-earth-400' : 'border-gray-300 bg-white'
        }`}>
          {selected && <Check className="h-3.5 w-3.5 text-white" />}
        </div>
      </div>

      {/* Rationale */}
      <p className="text-xs text-gray-600 line-clamp-2 mb-3">{template.rationale}</p>

      {/* Chips */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        <span className="text-xs px-2 py-0.5 rounded-full bg-earth-50 text-earth-700 font-medium border border-earth-200">
          {template.target_type === 'percentage' ? `-${template.suggested_target_value}%` :
           template.target_type === 'intensity'  ? `-${template.suggested_target_value}% интензивност` :
           `${template.suggested_target_value} tCO₂e`}
          {' '}/{' '}{template.years_to_target} год.
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SCOPE_COLORS_PILL[scopeKey]}`}>
          {scopeLabel}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DIFFICULTY_COLORS[template.difficulty]}`}>
          {DIFFICULTY_LABELS[template.difficulty]}
        </span>
        {template.sbti_aligned && (
          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-700">
            SBTi ✓
          </span>
        )}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1">
        {template.tags.slice(0, 3).map(tag => (
          <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{tag}</span>
        ))}
      </div>
    </button>
  );
}

// ─── Two-step Target Template Picker ─────────────────────────────────────────

function TargetTemplatePicker({
  open,
  onClose,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  onApply: (items: TargetReviewItem[]) => void;
}) {
  const currentYear = new Date().getFullYear();

  const [step, setStep]             = useState<'browse' | 'review'>('browse');
  const [selected, setSelected]     = useState<Set<string>>(new Set());
  const [scopeFilter, setScopeFilter] = useState<string>('all');
  const [reviewItems, setReviewItems] = useState<TargetReviewItem[]>([]);
  const [applying, setApplying]     = useState(false);
  const [fetchingIdx, setFetchingIdx] = useState<number | null>(null);

  const handleClose = () => {
    setStep('browse');
    setSelected(new Set());
    setReviewItems([]);
    onClose();
  };

  const filtered = TARGET_TEMPLATES.filter(t => {
    if (scopeFilter === 'all')  return true;
    if (scopeFilter === 'null') return t.scope == null;
    return t.scope?.toString() === scopeFilter;
  });

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const goToReview = () => {
    if (selected.size === 0) { toast.warning('Изберете поне един шаблон'); return; }
    const items = TARGET_TEMPLATES
      .filter(t => selected.has(t.id))
      .map(t => buildTargetReviewItem(t, currentYear));
    setReviewItems(items);
    setStep('review');
  };

  const updateReviewItem = (idx: number, field: keyof TargetReviewItem, value: string) => {
    setReviewItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const removeReviewItem = (idx: number) => {
    const updated = reviewItems.filter((_, i) => i !== idx);
    if (updated.length === 0) { setStep('browse'); return; }
    setReviewItems(updated);
    setSelected(new Set(updated.map(i => i.templateId)));
  };

  // Fetch baseline value from emissions data for a specific review item
  const fetchBaseline = async (idx: number) => {
    const item = reviewItems[idx];
    if (!item.baseline_year || item.baseline_year.length !== 4) {
      toast.warning('Въведете валидна базова година'); return;
    }
    setFetchingIdx(idx);
    try {
      let total = 0;
      if (item.scope === '3') {
        const res = await fetch('/api/scope3/dashboard');
        if (res.ok) {
          const result = await res.json();
          total = result.data?.totalCo2eKg ? result.data.totalCo2eKg / 1000 : 0;
        }
      } else {
        const start = `${item.baseline_year}-01-01`;
        const end   = `${item.baseline_year}-12-31`;
        const res   = await fetch(`/api/emissions?start=${start}&end=${end}`);
        if (res.ok) {
          const result = await res.json();
          const emissions = result.data || [];
          if (!item.scope) {
            total = emissions.reduce((s: number, e: { calculated_co2e?: number }) => s + (e.calculated_co2e || 0), 0);
          } else {
            total = emissions
              .filter((e: { scope?: number }) => e.scope === parseInt(item.scope))
              .reduce((s: number, e: { calculated_co2e?: number }) => s + (e.calculated_co2e || 0), 0);
          }
        }
      }
      if (total > 0) {
        updateReviewItem(idx, 'baseline_value', total.toFixed(2));
        toast.success(`Базова стойност: ${total.toFixed(2)} tCO₂e`);
      } else {
        toast.info('Няма данни за избрания период — въведете ръчно');
      }
    } catch { toast.error('Грешка при зареждане'); }
    finally   { setFetchingIdx(null); }
  };

  const handleCreate = async () => {
    // Validate baseline values
    const missing = reviewItems.findIndex(i => !i.baseline_value || isNaN(parseFloat(i.baseline_value)));
    if (missing !== -1) {
      toast.error(`Въведете базова стойност за "${reviewItems[missing].name}"`);
      return;
    }
    setApplying(true);
    await onApply(reviewItems);
    setApplying(false);
    setSelected(new Set());
    setReviewItems([]);
    setStep('browse');
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">

      {/* Top bar */}
      <div className="border-b bg-white px-6 py-4 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          {step === 'review' && (
            <button onClick={() => setStep('browse')} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors mr-1">
              <ArrowLeft className="h-5 w-5 text-gray-500" />
            </button>
          )}
          <div className="h-9 w-9 rounded-lg bg-earth-100 flex items-center justify-center">
            {step === 'browse' ? <Sparkles className="h-5 w-5 text-earth-400" /> : <Pencil className="h-5 w-5 text-earth-400" />}
          </div>
          <div>
            {step === 'browse' ? (
              <>
                <h2 className="text-lg font-bold text-gray-900">Шаблони за цели</h2>
                <p className="text-xs text-gray-500">Изберете научнообосновани цели, след това редактирайте параметрите</p>
              </>
            ) : (
              <>
                <h2 className="text-lg font-bold text-gray-900">Преглед и редакция</h2>
                <p className="text-xs text-gray-500">Въведете базовите стойности и коригирайте параметрите</p>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 text-xs text-gray-500">
            <span className={`flex items-center gap-1 font-medium ${step === 'browse' ? 'text-earth-500' : 'text-gray-400'}`}>
              <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 'browse' ? 'bg-earth-400 text-white' : 'bg-gray-200 text-gray-500'}`}>1</span>
              Избор
            </span>
            <ArrowRight className="h-3 w-3 text-gray-300" />
            <span className={`flex items-center gap-1 font-medium ${step === 'review' ? 'text-earth-500' : 'text-gray-400'}`}>
              <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 'review' ? 'bg-earth-400 text-white' : 'bg-gray-200 text-gray-500'}`}>2</span>
              Редакция
            </span>
          </div>
          <button onClick={handleClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* ── BROWSE STEP ── */}
      {step === 'browse' && (
        <>
          {/* Scope filter */}
          <div className="border-b bg-gray-50 px-6 py-3 flex items-center gap-2 overflow-x-auto shrink-0">
            {SCOPE_FILTER_OPTIONS.concat([{ value: 'sbti', label: 'SBTi ✓' }]).map(f => (
              <button
                key={f.value}
                onClick={() => setScopeFilter(f.value)}
                className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                  scopeFilter === f.value
                    ? 'bg-earth-400 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-earth-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Template grid */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {TARGET_TEMPLATES
                .filter(t => {
                  if (scopeFilter === 'all')  return true;
                  if (scopeFilter === 'sbti') return t.sbti_aligned;
                  if (scopeFilter === 'null') return t.scope == null;
                  return t.scope?.toString() === scopeFilter;
                })
                .map(template => (
                  <TargetTemplateCard
                    key={template.id}
                    template={template}
                    selected={selected.has(template.id)}
                    onToggle={() => toggle(template.id)}
                  />
                ))}
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t bg-white px-6 py-4 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] shrink-0">
            <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-6">
                {selected.size > 0 ? (
                  <>
                    <div>
                      <p className="text-xs text-gray-500">Избрани цели</p>
                      <p className="text-xl font-bold text-gray-900">{selected.size}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Включва SBTi</p>
                      <p className="text-sm font-bold text-emerald-600">
                        {TARGET_TEMPLATES.filter(t => selected.has(t.id) && t.sbti_aligned).length > 0 ? '✓ Да' : '—'}
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-500">Изберете шаблони от горе</p>
                )}
              </div>
              <Button
                onClick={goToReview}
                disabled={selected.size === 0}
                className="bg-earth-400 hover:bg-earth-500 gap-2 min-w-[200px]"
              >
                <Pencil className="h-4 w-4" />
                Прегледай и редактирай
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}

      {/* ── REVIEW STEP ── */}
      {step === 'review' && (
        <>
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
            <div className="max-w-4xl mx-auto space-y-4">
              <p className="text-sm text-gray-500">
                Въведете базовата стойност на емисиите (tCO₂e) за базовата година — или заредете автоматично от данните.
              </p>

              {reviewItems.map((item, idx) => {
                const template   = TARGET_TEMPLATES.find(t => t.id === item.templateId)!;
                const scopeLabel = template.scope != null ? `Обхват ${template.scope}` : '1+2+3';
                const scopeKey   = template.scope?.toString() ?? 'null';
                const isFetching = fetchingIdx === idx;

                const baselineYear = parseInt(item.baseline_year) || currentYear;
                const targetYear   = parseInt(item.target_year)   || currentYear + template.years_to_target;
                const years        = targetYear - baselineYear;
                const baselineVal  = parseFloat(item.baseline_value);
                const targetVal    = parseFloat(item.target_value);

                // Live SBTi check (percentage type only)
                let sbtiNote = '';
                if (item.target_type === 'percentage' && years > 0 && targetVal > 0) {
                  const annualRate = targetVal / years;
                  const threshold  = template.scope === 3 ? 2.5 : 4.2;
                  sbtiNote = annualRate >= threshold
                    ? `✓ ${annualRate.toFixed(1)}% / год — SBTi съвместимо`
                    : `⚠ ${annualRate.toFixed(1)}% / год — под SBTi прага (${threshold}%)`;
                }

                return (
                  <div key={item.templateId} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    {/* Header */}
                    <div className="px-5 py-3 flex items-center justify-between bg-gray-50 border-b border-gray-200">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Target className="h-4 w-4 text-earth-400 shrink-0" />
                        <span className="text-sm font-semibold text-gray-800">{template.framework}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SCOPE_COLORS_PILL[scopeKey]}`}>
                          {scopeLabel}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DIFFICULTY_COLORS[template.difficulty]}`}>
                          {DIFFICULTY_LABELS[template.difficulty]}
                        </span>
                        {template.sbti_aligned && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-700">SBTi ✓</span>
                        )}
                      </div>
                      <button
                        onClick={() => removeReviewItem(idx)}
                        className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" /> Премахни
                      </button>
                    </div>

                    <div className="p-5 space-y-4">
                      {/* Name */}
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500">Наименование на целта</Label>
                        <Input
                          value={item.name}
                          onChange={e => updateReviewItem(idx, 'name', e.target.value)}
                          className="text-sm font-medium"
                        />
                      </div>

                      {/* Row 1: baseline year | baseline value (with fetch) | target year | target value */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-500">Базова година</Label>
                          <Input
                            type="number" min="2000" max="2100"
                            value={item.baseline_year}
                            onChange={e => updateReviewItem(idx, 'baseline_year', e.target.value)}
                            className="text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-500">
                            Базова стойност (tCO₂e) <span className="text-red-500">*</span>
                          </Label>
                          <div className="flex gap-1.5">
                            <Input
                              type="number" step="0.01" min="0"
                              value={item.baseline_value}
                              onChange={e => updateReviewItem(idx, 'baseline_value', e.target.value)}
                              placeholder="Зареди →"
                              className={`text-sm flex-1 ${!item.baseline_value ? 'border-amber-300 focus:ring-amber-300' : ''}`}
                            />
                            <Button
                              type="button" variant="outline" size="sm"
                              onClick={() => fetchBaseline(idx)}
                              disabled={isFetching}
                              className="shrink-0 px-2"
                              title="Зареди от данните"
                            >
                              {isFetching
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : <RefreshCw className="h-3.5 w-3.5" />}
                            </Button>
                          </div>
                          {!item.baseline_value && (
                            <p className="text-[10px] text-amber-600">Задължително — натиснете → за авто-зареждане</p>
                          )}
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-500">Целева година</Label>
                          <Input
                            type="number" min="2000" max="2100"
                            value={item.target_year}
                            onChange={e => updateReviewItem(idx, 'target_year', e.target.value)}
                            className="text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-500">
                            {item.target_type === 'percentage' ? 'Намаление (%)' :
                             item.target_type === 'intensity'  ? 'Намаление (%)' : 'Целева стойност (tCO₂e)'}
                          </Label>
                          <Input
                            type="number" step="0.1" min="0"
                            value={item.target_value}
                            onChange={e => updateReviewItem(idx, 'target_value', e.target.value)}
                            className="text-sm"
                          />
                          {sbtiNote && (
                            <p className={`text-[10px] font-medium ${sbtiNote.startsWith('✓') ? 'text-green-600' : 'text-amber-600'}`}>
                              {sbtiNote}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Row 2: type | scope */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-500">Тип цел</Label>
                          <Select
                            value={item.target_type}
                            onValueChange={v => updateReviewItem(idx, 'target_type', v)}
                          >
                            <SelectTrigger className="text-sm h-9"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">Процентно намаление</SelectItem>
                              <SelectItem value="absolute">Абсолютна стойност</SelectItem>
                              <SelectItem value="intensity">Интензивност</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-500">Обхват</Label>
                          <Select
                            value={item.scope || 'all'}
                            onValueChange={v => updateReviewItem(idx, 'scope', v === 'all' ? '' : v)}
                          >
                            <SelectTrigger className="text-sm h-9"><SelectValue placeholder="Всички" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Всички обхвати</SelectItem>
                              <SelectItem value="1">Обхват 1</SelectItem>
                              <SelectItem value="2">Обхват 2</SelectItem>
                              <SelectItem value="3">Обхват 3</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Calculated tCO2e target preview */}
                      {item.target_type === 'percentage' && baselineVal > 0 && targetVal > 0 && (
                        <div className="bg-earth-50 rounded-lg px-4 py-2.5 text-xs text-earth-800 flex items-center gap-2">
                          <TrendingDown className="h-4 w-4 text-earth-500 shrink-0" />
                          Целева абсолютна стойност:{' '}
                          <strong>{(baselineVal * (1 - targetVal / 100)).toFixed(2)} tCO₂e</strong>
                          {' '}(намаление от {((baselineVal * targetVal) / 100).toFixed(2)} tCO₂e)
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Confirm bar */}
          <div className="border-t bg-white px-6 py-4 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] shrink-0">
            <div className="max-w-4xl mx-auto flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-xs text-gray-500">Цели за създаване</p>
                  <p className="text-xl font-bold text-gray-900">{reviewItems.length}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">SBTi съвместими</p>
                  <p className="text-sm font-bold text-emerald-600">
                    {TARGET_TEMPLATES.filter(t => reviewItems.some(i => i.templateId === t.id) && t.sbti_aligned).length}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={() => setStep('browse')}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Назад
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={applying || reviewItems.length === 0}
                  className="bg-earth-400 hover:bg-earth-500 gap-2 min-w-[180px]"
                >
                  {applying
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Създаване...</>
                    : <><CheckCircle className="h-4 w-4" /> Създай {reviewItems.length} цели</>}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────

export default function TargetsPage() {
  const [targets, setTargets]     = useState<EmissionTarget[]>([]);
  const [loading, setLoading]     = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [syncing, setSyncing]     = useState(false);
  const [fetchingBaseline, setFetchingBaseline] = useState(false);
  const [editingTarget, setEditingTarget] = useState<EmissionTarget | null>(null);
  const [forecasts, setForecasts] = useState<Record<string, ForecastResult>>({});
  const [loadingForecast, setLoadingForecast] = useState<Record<string, boolean>>({});
  const [expandedForecast, setExpandedForecast] = useState<Record<string, boolean>>({});

  const currentYear = new Date().getFullYear();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    target_type: 'percentage' as 'absolute' | 'percentage' | 'intensity',
    scope: '' as string,
    baseline_year: currentYear.toString(),
    baseline_value: '',
    target_year: (currentYear + 5).toString(),
    target_value: '',
  });

  useEffect(() => { fetchTargets(); }, []);

  const fetchTargets = async () => {
    try {
      const res = await fetch('/api/targets');
      if (res.ok) {
        const result = await res.json();
        setTargets(result.data || []);
      }
    } catch { toast.error('Грешка при зареждане на целите'); }
    finally   { setLoading(false); }
  };

  const loadForecast = useCallback(async (targetId: string) => {
    if (forecasts[targetId] || loadingForecast[targetId]) return;
    setLoadingForecast(prev => ({ ...prev, [targetId]: true }));
    try {
      const res = await fetch(`/api/targets/forecast?targetId=${targetId}`);
      if (res.ok) {
        const result = await res.json();
        setForecasts(prev => ({ ...prev, [targetId]: result.data }));
      }
    } catch { /* silent */ }
    finally { setLoadingForecast(prev => ({ ...prev, [targetId]: false })); }
  }, [forecasts, loadingForecast]);

  useEffect(() => {
    targets
      .filter(t => t.status === 'active')
      .forEach(t => loadForecast(t.id));
  }, [targets]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchBaselineValue = async (year: string, scope: string) => {
    if (!year || year.length !== 4) return;
    setFetchingBaseline(true);
    try {
      if (scope === '3') {
        // Scope 3 baseline from calculated_emissions
        const res = await fetch(`/api/scope3/dashboard`);
        if (res.ok) {
          const result = await res.json();
          const total = result.data?.totalCo2eKg ? result.data.totalCo2eKg / 1000 : 0;
          if (total > 0) {
            setFormData(prev => ({ ...prev, baseline_value: total.toFixed(2) }));
            toast.success(`Обхват 3 база ${year}: ${total.toFixed(2)} tCO2e`);
          } else {
            toast.info('Няма Обхват 3 данни — въведете ръчно');
          }
        }
      } else {
        const start = `${year}-01-01`;
        const end   = `${year}-12-31`;
        const res   = await fetch(`/api/emissions?start=${start}&end=${end}`);
        if (!res.ok) throw new Error();
        const result  = await res.json();
        const emissions = result.data || [];
        let total = 0;
        if (!scope || scope === 'all') {
          total = emissions.reduce((s: number, e: any) => s + (e.calculated_co2e || 0), 0);
        } else {
          total = emissions
            .filter((e: any) => e.scope === parseInt(scope))
            .reduce((s: number, e: any) => s + (e.calculated_co2e || 0), 0);
        }
        if (total > 0) {
          setFormData(prev => ({ ...prev, baseline_value: total.toFixed(2) }));
          toast.success(`Заредени емисии за ${year}: ${total.toFixed(2)} tCO2e`);
        } else {
          toast.info(`Няма данни за ${year}`);
        }
      }
    } catch { toast.error('Грешка при зареждане на базова стойност'); }
    finally   { setFetchingBaseline(false); }
  };

  const syncTargets = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/targets/sync', { method: 'POST' });
      if (!res.ok) throw new Error();
      const result = await res.json();
      toast.success(`Актуализирани ${result.data?.targetsUpdated || 0} цели`);
      setForecasts({});
      fetchTargets();
    } catch { toast.error('Грешка при синхронизиране'); }
    finally   { setSyncing(false); }
  };

  const handleApplyTemplates = async (items: TargetReviewItem[]) => {
    try {
      const payload = {
        targets: items.map(item => ({
          templateId:     item.templateId,
          name:           item.name,
          description:    item.description || null,
          target_type:    item.target_type,
          scope:          item.scope ? parseInt(item.scope) : null,
          baseline_year:  parseInt(item.baseline_year),
          baseline_value: parseFloat(item.baseline_value),
          target_year:    parseInt(item.target_year),
          target_value:   parseFloat(item.target_value),
        })),
      };
      const res = await fetch('/api/targets/from-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      const result = await res.json();
      toast.success(`Създадени ${result.data.created} цели успешно!`);
      setTemplatePickerOpen(false);
      setForecasts({});
      fetchTargets();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Грешка при създаване');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '', description: '', target_type: 'percentage', scope: '',
      baseline_year: currentYear.toString(), baseline_value: '',
      target_year: (currentYear + 5).toString(), target_value: '',
    });
    setEditingTarget(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description || null,
        target_type: formData.target_type,
        scope: formData.scope && formData.scope !== 'all' ? parseInt(formData.scope) : null,
        baseline_year:  parseInt(formData.baseline_year),
        baseline_value: parseFloat(formData.baseline_value),
        target_year:    parseInt(formData.target_year),
        target_value:   parseFloat(formData.target_value),
      };
      const url    = editingTarget ? `/api/targets/${editingTarget.id}` : '/api/targets';
      const method = editingTarget ? 'PATCH' : 'POST';
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      toast.success(editingTarget ? 'Целта е актуализирана' : 'Целта е създадена успешно');
      setDialogOpen(false);
      resetForm();
      setForecasts({});
      fetchTargets();
    } catch (err: any) { toast.error(err.message || 'Грешка при запазване'); }
    finally             { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Сигурни ли сте, че искате да изтриете тази цел?')) return;
    try {
      const res = await fetch(`/api/targets/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Целта е изтрита');
      fetchTargets();
    } catch { toast.error('Грешка при изтриване'); }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/targets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      toast.success('Статусът е актуализиран');
      fetchTargets();
    } catch { toast.error('Грешка при актуализиране'); }
  };

  const openEditDialog = (target: EmissionTarget) => {
    setEditingTarget(target);
    setFormData({
      name: target.name,
      description: target.description || '',
      target_type: target.target_type,
      scope: target.scope?.toString() || '',
      baseline_year:  target.baseline_year.toString(),
      baseline_value: target.baseline_value.toString(),
      target_year:    target.target_year.toString(),
      target_value:   target.target_value.toString(),
    });
    setDialogOpen(true);
  };

  // ── Progress calculation (month-precise) ─────────────────────────────────
  const calculateProgress = (target: EmissionTarget) => {
    const now          = new Date();
    const cy           = now.getFullYear();
    const cm           = now.getMonth();
    const totalMonths  = (target.target_year - target.baseline_year) * 12;
    let monthsPassed   = 0;
    if (cy > target.baseline_year) {
      monthsPassed = (cy - target.baseline_year - 1) * 12 + (cm + 1);
    }
    const timeProgress = totalMonths > 0
      ? Math.max(0, Math.min((monthsPassed / totalMonths) * 100, 100))
      : 0;

    let emissionProgress = 0;
    let reduction        = 0;
    if (target.target_type === 'percentage') {
      reduction        = ((target.baseline_value - target.current_value) / target.baseline_value) * 100;
      emissionProgress = (reduction / target.target_value) * 100;
    } else {
      const totalRed   = target.baseline_value - target.target_value;
      const currentRed = target.baseline_value - target.current_value;
      reduction        = currentRed;
      emissionProgress = totalRed > 0 ? (currentRed / totalRed) * 100 : 0;
    }
    emissionProgress = Math.min(Math.max(emissionProgress, 0), 100);
    const isOnTrack  = emissionProgress >= timeProgress || target.status === 'achieved';

    return {
      progress: emissionProgress,
      reduction,
      timeProgress,
      monthsPassed,
      totalMonths,
      isOnTrack,
      yearsPassed: Math.floor(monthsPassed / 12),
      totalYears:  Math.floor(totalMonths / 12),
    };
  };

  // ── Portfolio summary stats ───────────────────────────────────────────────
  const activeTargets  = targets.filter(t => t.status === 'active');
  const onTrackCount   = activeTargets.filter(t => calculateProgress(t).isOnTrack).length;
  const achievedCount  = targets.filter(t => t.status === 'achieved').length;
  const avgProgress    = activeTargets.length > 0
    ? activeTargets.reduce((s, t) => s + calculateProgress(t).progress, 0) / activeTargets.length
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-earth-300" />
      </div>
    );
  }

  return (
    <>
      <TargetTemplatePicker
        open={templatePickerOpen}
        onClose={() => setTemplatePickerOpen(false)}
        onApply={handleApplyTemplates}
      />

    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-earth-100 flex items-center justify-center">
              <Target className="h-6 w-6 text-earth-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Цели & Прогнози</h1>
              <p className="text-sm text-gray-500">
                Задайте научно обосновани цели и проследявайте траекторията на емисиите
              </p>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {targets.length > 0 && (
              <Button variant="outline" onClick={syncTargets} disabled={syncing}>
                <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                Синхронизирай
              </Button>
            )}
            <Button
              className="bg-earth-400 hover:bg-earth-500 gap-2"
              onClick={() => setTemplatePickerOpen(true)}
            >
              <Sparkles className="h-4 w-4" /> Избери от шаблони
            </Button>
            <Dialog open={dialogOpen} onOpenChange={open => { setDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" /> Ръчно
                </Button>
              </DialogTrigger>

              <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                  <DialogTitle>{editingTarget ? 'Редактиране на цел' : 'Нова цел за намаляване'}</DialogTitle>
                  <DialogDescription>
                    Дефинирайте измерима цел за въглероден отпечатък. SBTi изисква ≥ 4.2% намаление годишно.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Название на целта *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="напр. Намаляване Обхват 1+2 с 30% до 2030"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Описание</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Методология, бележки..."
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Тип цел *</Label>
                      <Select
                        value={formData.target_type}
                        onValueChange={(v: 'absolute' | 'percentage' | 'intensity') =>
                          setFormData({ ...formData, target_type: v })
                        }
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Процентно намаление</SelectItem>
                          <SelectItem value="absolute">Абсолютна стойност</SelectItem>
                          <SelectItem value="intensity">Интензивност</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Обхват</Label>
                      <Select
                        value={formData.scope || 'all'}
                        onValueChange={v => {
                          const s = v === 'all' ? '' : v;
                          setFormData({ ...formData, scope: s });
                          if (formData.baseline_year.length === 4) fetchBaselineValue(formData.baseline_year, s);
                        }}
                      >
                        <SelectTrigger><SelectValue placeholder="Всички" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Всички обхвати</SelectItem>
                          <SelectItem value="1">Обхват 1</SelectItem>
                          <SelectItem value="2">Обхват 2</SelectItem>
                          <SelectItem value="3">Обхват 3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Базова година *</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number" min="2000" max="2100"
                          value={formData.baseline_year}
                          onChange={e => {
                            setFormData({ ...formData, baseline_year: e.target.value });
                            if (e.target.value.length === 4) fetchBaselineValue(e.target.value, formData.scope);
                          }}
                          required className="flex-1"
                        />
                        <Button
                          type="button" variant="outline" size="sm"
                          onClick={() => fetchBaselineValue(formData.baseline_year, formData.scope)}
                          disabled={fetchingBaseline || formData.baseline_year.length !== 4}
                          title="Зареди от системата"
                        >
                          {fetchingBaseline ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Целева година *</Label>
                      <Input
                        type="number" min="2000" max="2100"
                        value={formData.target_year}
                        onChange={e => setFormData({ ...formData, target_year: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>
                        Базова стойност *
                        {formData.target_type === 'percentage' ? ' (tCO2e)' : ''}
                      </Label>
                      <div className="relative">
                        <Input
                          type="number" step="0.01" min="0"
                          value={formData.baseline_value}
                          onChange={e => setFormData({ ...formData, baseline_value: e.target.value })}
                          placeholder={fetchingBaseline ? 'Зареждане...' : 'Автоматично'}
                          required disabled={fetchingBaseline}
                        />
                        {fetchingBaseline && (
                          <div className="absolute inset-y-0 right-3 flex items-center">
                            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">Автоматично от данните за базовата година</p>
                    </div>
                    <div className="space-y-2">
                      <Label>
                        Целева стойност *
                        {formData.target_type === 'percentage' ? ' (%)' : ' (tCO2e)'}
                      </Label>
                      <Input
                        type="number" step="0.01" min="0"
                        value={formData.target_value}
                        onChange={e => setFormData({ ...formData, target_value: e.target.value })}
                        placeholder={formData.target_type === 'percentage' ? 'напр. 30' : ''}
                        required
                      />
                      {formData.baseline_value && formData.target_value && formData.target_type === 'percentage' && (
                        (() => {
                          const years   = parseInt(formData.target_year) - parseInt(formData.baseline_year);
                          const rate    = years > 0 ? (parseFloat(formData.target_value) / years) : 0;
                          const aligned = rate >= 4.2;
                          return (
                            <p className={`text-xs font-medium ${aligned ? 'text-green-600' : 'text-amber-600'}`}>
                              {rate.toFixed(1)}% / год — {aligned ? '✓ SBTi съвместимо' : '⚠ Под SBTi прага (4.2%)'}
                            </p>
                          );
                        })()
                      )}
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Отказ</Button>
                    <Button type="submit" disabled={saving} className="bg-earth-300 hover:bg-earth-400">
                      {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Запазване...</> : (editingTarget ? 'Актуализирай' : 'Създай цел')}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* ── Portfolio Summary KPIs ── */}
        {targets.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard label="Активни цели"    value={activeTargets.length.toString()}        color="bg-blue-50"   />
            <KpiCard label="В графика"        value={`${onTrackCount} / ${activeTargets.length}`} color="bg-green-50"  sub={activeTargets.length > 0 ? `${Math.round((onTrackCount / activeTargets.length) * 100)}% успеваемост` : undefined} />
            <KpiCard label="Постигнати"       value={achievedCount.toString()}              color="bg-earth-50"  />
            <KpiCard label="Среден прогрес"   value={`${avgProgress.toFixed(0)}%`}          color="bg-purple-50" sub="на емисиите" />
          </div>
        )}

        {/* ── Off-Track Alerts ── */}
        {activeTargets.some(t => !calculateProgress(t).isOnTrack) && (
          <Card className="border-amber-300 bg-amber-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-amber-800">
                <Bell className="h-5 w-5" /> Известия за изоставащи цели
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeTargets.map(target => {
                  const { progress, timeProgress, isOnTrack } = calculateProgress(target);
                  if (isOnTrack) return null;
                  return (
                    <div key={target.id} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-amber-200">
                      <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium text-amber-900">{target.name}</p>
                        <p className="text-sm text-amber-700 mt-1">
                          Прогрес: {progress.toFixed(0)}% при {timeProgress.toFixed(0)}% изминало време.
                          {progress < timeProgress - 20 && ' Необходими са спешни мерки.'}
                        </p>
                      </div>
                      <a href={`#target-${target.id}`} className="text-amber-600 hover:text-amber-800 text-sm font-medium whitespace-nowrap">
                        Виж →
                      </a>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Targets ── */}
        {targets.length > 0 ? (
          <div className="grid gap-6">
            {targets.map(target => {
              const { progress, reduction, timeProgress, isOnTrack, monthsPassed, totalMonths } = calculateProgress(target);
              const StatusIcon   = STATUS_CONFIG[target.status].icon;
              const fc           = forecasts[target.id];
              const fcLoading    = loadingForecast[target.id];
              const fcExpanded   = expandedForecast[target.id] ?? false;
              const targetAbs    = fc?.targetAbsoluteValue
                ?? (target.target_type === 'percentage'
                  ? target.baseline_value * (1 - target.target_value / 100)
                  : target.target_value);
              const yearsLeft    = Math.max(0, target.target_year - currentYear);
              const annualNeeded = yearsLeft > 0
                ? (target.current_value - targetAbs) / yearsLeft
                : 0;

              return (
                <Card key={target.id} id={`target-${target.id}`} className="overflow-hidden scroll-mt-6">
                  {/* Status stripe */}
                  <div className={`h-1.5 ${
                    target.status === 'achieved' ? 'bg-green-500' :
                    target.status === 'missed'   ? 'bg-red-500' :
                    target.status === 'cancelled'? 'bg-gray-400' :
                    isOnTrack ? 'bg-earth-400' : 'bg-amber-500'
                  }`} />

                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2 flex-wrap">
                          {target.name}
                          <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_CONFIG[target.status].color}`}>
                            <StatusIcon className="inline h-3 w-3 mr-1" />
                            {STATUS_CONFIG[target.status].label}
                          </span>
                          {target.scope && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${SCOPE_COLORS[target.scope]}`}>
                              {SCOPE_LABELS[target.scope]}
                            </span>
                          )}
                          {fc?.isSBTiAligned && (
                            <Badge className="text-xs bg-emerald-100 text-emerald-700 border-emerald-300">
                              <Award className="mr-1 h-3 w-3" /> SBTi
                            </Badge>
                          )}
                          {fc && !fc.willAchieve && target.status === 'active' && (
                            <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                              <TrendingUp className="mr-1 h-3 w-3" /> Риск от неизпълнение
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {target.description || TARGET_TYPE_LABELS[target.target_type]}
                        </CardDescription>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(target)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost" size="sm"
                          onClick={() => handleDelete(target.id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    {/* ── KPI row ── */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500">Базова ({target.baseline_year})</p>
                        <p className="text-lg font-bold text-gray-700">{target.baseline_value.toFixed(2)}</p>
                        <p className="text-xs text-gray-400">tCO2e</p>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-gray-500">Текуща</p>
                        <p className="text-lg font-bold text-blue-600">{target.current_value.toFixed(2)}</p>
                        <p className="text-xs text-gray-400">tCO2e</p>
                      </div>
                      <div className="text-center p-3 bg-earth-50 rounded-lg">
                        <p className="text-xs text-gray-500">Цел ({target.target_year})</p>
                        <p className="text-lg font-bold text-earth-400">
                          {target.target_type === 'percentage' ? `-${target.target_value}%` : targetAbs.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-400">{target.target_type === 'percentage' ? '' : 'tCO2e'}</p>
                      </div>
                      <div className={`text-center p-3 rounded-lg ${isOnTrack ? 'bg-green-50' : 'bg-amber-50'}`}>
                        <p className="text-xs text-gray-500">Прогрес</p>
                        <p className={`text-lg font-bold ${isOnTrack ? 'text-green-600' : 'text-amber-600'}`}>
                          {progress.toFixed(0)}%
                        </p>
                        <p className="text-xs text-gray-400">Время: {timeProgress.toFixed(0)}%</p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <p className="text-xs text-gray-500">Нужно / год</p>
                        <p className="text-lg font-bold text-purple-600">
                          {annualNeeded > 0 ? `-${annualNeeded.toFixed(2)}` : '✓'}
                        </p>
                        <p className="text-xs text-gray-400">{annualNeeded > 0 ? 'tCO2e' : 'постигнато'}</p>
                      </div>
                    </div>

                    {/* ── Progress bars ── */}
                    <div className="space-y-2 mb-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-gray-600">Намаляване на емисии</span>
                          <span className={`text-xs font-medium ${isOnTrack ? 'text-green-600' : 'text-amber-600'}`}>
                            {progress.toFixed(1)}% {isOnTrack ? '✓ В графика' : '⚠ Изоставане'}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all ${
                              target.status === 'achieved' ? 'bg-green-500' :
                              target.status === 'missed'   ? 'bg-red-500' :
                              isOnTrack ? 'bg-earth-400' : 'bg-amber-500'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-gray-600">Изминало време</span>
                          <span className="text-xs text-gray-500">
                            {monthsPassed} / {totalMonths} месеца ({timeProgress.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="h-2 rounded-full bg-gray-400 transition-all" style={{ width: `${timeProgress}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* ── Forecast metrics row ── */}
                    {fc && (
                      <div className="grid grid-cols-3 gap-3 mb-3 p-3 bg-gray-50 rounded-lg text-center">
                        <div>
                          <p className="text-xs text-gray-500">Намаление / год</p>
                          <p className="text-sm font-bold text-gray-700">{fc.annualReductionRate.toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Прогнозна стойност {target.target_year}</p>
                          <p className={`text-sm font-bold ${fc.willAchieve ? 'text-green-600' : 'text-red-500'}`}>
                            {fc.projectedFinal.toFixed(2)} tCO2e
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Оставащи години</p>
                          <p className="text-sm font-bold text-gray-700 flex items-center justify-center gap-1">
                            <Calendar className="h-3 w-3" />{yearsLeft}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* ── Forecast chart toggle ── */}
                    {target.status === 'active' && (
                      <div className="border-t pt-3">
                        <button
                          className="flex items-center gap-1 text-xs text-earth-400 hover:text-earth-500 font-medium"
                          onClick={() => setExpandedForecast(prev => ({ ...prev, [target.id]: !fcExpanded }))}
                        >
                          {fcExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          {fcExpanded ? 'Скрий прогнозата' : 'Покажи прогнозна графика'}
                        </button>

                        {fcExpanded && (
                          fcLoading
                            ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-earth-300" /></div>
                            : fc
                              ? <ForecastChart forecast={fc} targetAbsolute={fc.targetAbsoluteValue} />
                              : <p className="text-xs text-gray-400 mt-2">Няма достатъчно данни за прогноза</p>
                        )}
                      </div>
                    )}

                    {/* ── Status actions ── */}
                    {target.status === 'active' && (
                      <div className="flex gap-2 mt-3 pt-3 border-t">
                        <Button
                          size="sm" variant="outline"
                          className="text-green-600 border-green-300 hover:bg-green-50"
                          onClick={() => handleStatusChange(target.id, 'achieved')}
                        >
                          <CheckCircle className="mr-1 h-4 w-4" /> Маркирай като постигната
                        </Button>
                        <Button
                          size="sm" variant="outline" className="text-gray-600"
                          onClick={() => handleStatusChange(target.id, 'cancelled')}
                        >
                          Отмени
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border-earth-200 bg-earth-50">
            <CardContent className="pt-12 pb-12 text-center">
              <Target className="mx-auto h-16 w-16 text-earth-300 mb-4" />
              <h2 className="text-xl font-bold text-earth-400 mb-2">Нямате зададени цели</h2>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Създайте цели за намаляване на емисиите, за да проследявате прогреса към по-устойчиво бъдеще.
              </p>
              <Button className="bg-earth-300 hover:bg-earth-400" onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Създай първа цел
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ── SBTi Info card ── */}
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="pt-5 pb-5">
            <div className="flex gap-3">
              <Zap className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-emerald-900">
                <p className="font-semibold mb-1">Science Based Targets (SBTi)</p>
                <p className="text-emerald-800">
                  SBTi препоръчва намаление от поне <strong>4.2% годишно</strong> за Обхват 1+2 (1.5°C пътека)
                  и <strong>2.5% годишно</strong> за Обхват 3. Целите с badge <em>SBTi</em> изпълняват тези критерии.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
    </>
  );
}
