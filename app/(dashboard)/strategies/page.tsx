'use client';

import { useEffect, useState, useCallback } from 'react';
import { formatMoney } from '@/lib/constants/currency';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Lightbulb, Plus, Loader2, CheckCircle, XCircle, Clock,
  PauseCircle, FileEdit, Trash2, ChevronRight, Leaf,
  Zap, Truck, Package, Recycle, Droplets, Users, MoreHorizontal,
  TrendingDown, ListChecks, Filter, Sparkles, Check, X,
  ArrowRight, BookOpen, ArrowLeft, Pencil,
} from 'lucide-react';
import {
  STRATEGY_TEMPLATES,
  DIFFICULTY_LABELS,
  DIFFICULTY_COLORS,
  type StrategyTemplate,
  type TemplateCategory,
} from '@/lib/strategy-templates';
import { PageSkeleton } from '@/components/ui/page-skeleton';

// ── Types ─────────────────────────────────────────────────────────────────────

type StrategyStatus = 'draft' | 'active' | 'completed' | 'cancelled' | 'on_hold';
type StrategyCategory =
  | 'energy_efficiency' | 'renewable_energy' | 'fleet'
  | 'supply_chain' | 'waste' | 'water' | 'behavioral' | 'other';
type Priority = 'high' | 'medium' | 'low';

interface Initiative { id: string; status: string; }

interface Strategy {
  id: string;
  title: string;
  description: string | null;
  category: StrategyCategory;
  scope: number | null;
  priority: Priority;
  status: StrategyStatus;
  estimated_reduction_co2e: number | null;
  responsible_person: string | null;
  target_completion_date: string | null;
  actual_reduction_co2e: number | null;
  strategy_initiatives: Initiative[];
  emission_targets: { id: string; name: string } | null;
}

interface EmissionTarget { id: string; name: string; }

// ── Config maps ───────────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<StrategyCategory, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  energy_efficiency: { label: 'Енергийна ефективност', icon: Zap,            color: 'text-yellow-600', bg: 'bg-yellow-50',  border: 'border-yellow-200' },
  renewable_energy:  { label: 'Възобновяема енергия',  icon: Leaf,           color: 'text-green-600',  bg: 'bg-green-50',   border: 'border-green-200'  },
  fleet:             { label: 'Транспорт и автопарк',   icon: Truck,          color: 'text-blue-600',   bg: 'bg-blue-50',    border: 'border-blue-200'   },
  supply_chain:      { label: 'Верига на доставки',     icon: Package,        color: 'text-purple-600', bg: 'bg-purple-50',  border: 'border-purple-200' },
  waste:             { label: 'Управление на отпадъци', icon: Recycle,        color: 'text-orange-600', bg: 'bg-orange-50',  border: 'border-orange-200' },
  water:             { label: 'Водни ресурси',          icon: Droplets,       color: 'text-cyan-600',   bg: 'bg-cyan-50',    border: 'border-cyan-200'   },
  behavioral:        { label: 'Поведенчески промени',   icon: Users,          color: 'text-pink-600',   bg: 'bg-pink-50',    border: 'border-pink-200'   },
  other:             { label: 'Друго',                  icon: MoreHorizontal, color: 'text-gray-600',   bg: 'bg-gray-50',    border: 'border-gray-200'   },
};

const STATUS_CONFIG: Record<StrategyStatus, { label: string; icon: React.ElementType; color: string }> = {
  draft:     { label: 'Чернова',    icon: FileEdit,    color: 'bg-gray-100 text-gray-700'   },
  active:    { label: 'Активна',    icon: Clock,       color: 'bg-blue-100 text-blue-700'   },
  completed: { label: 'Завършена',  icon: CheckCircle, color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Отменена',   icon: XCircle,     color: 'bg-red-100 text-red-700'     },
  on_hold:   { label: 'На пауза',   icon: PauseCircle, color: 'bg-amber-100 text-amber-700' },
};

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string }> = {
  high:   { label: 'Висок',   color: 'bg-red-100 text-red-700'     },
  medium: { label: 'Среден',  color: 'bg-amber-100 text-amber-700' },
  low:    { label: 'Нисък',   color: 'bg-gray-100 text-gray-600'   },
};

const SCOPE_COLORS: Record<number, string> = {
  1: 'bg-green-100 text-green-700',
  2: 'bg-blue-100 text-blue-700',
  3: 'bg-orange-100 text-orange-700',
};

const TEMPLATE_CATEGORY_FILTERS: Array<{ value: TemplateCategory | 'all'; label: string }> = [
  { value: 'all',               label: 'Всички' },
  { value: 'energy_efficiency', label: 'Енергия' },
  { value: 'renewable_energy',  label: 'ВЕИ' },
  { value: 'fleet',             label: 'Транспорт' },
  { value: 'supply_chain',      label: 'Доставки' },
  { value: 'waste',             label: 'Отпадъци' },
  { value: 'water',             label: 'Вода' },
  { value: 'behavioral',        label: 'Поведение' },
];

// ── Helper ────────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className={`rounded-xl p-4 ${color}`}>
      <p className="text-xs font-medium text-gray-600 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

// ── Template card (inside picker) ─────────────────────────────────────────────

function TemplateCard({
  template,
  selected,
  onToggle,
}: {
  template: StrategyTemplate;
  selected: boolean;
  onToggle: () => void;
}) {
  const cat = CATEGORY_CONFIG[template.category as StrategyCategory];
  const CatIcon = cat.icon;

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
        selected
          ? 'border-earth-400 bg-earth-50 shadow-md ring-2 ring-earth-200'
          : `border-gray-200 bg-white hover:border-earth-300 hover:shadow-sm ${cat.border}`
      }`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`h-9 w-9 rounded-lg ${cat.bg} flex items-center justify-center shrink-0`}>
            <CatIcon className={`h-5 w-5 ${cat.color}`} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 leading-snug">{template.title}</p>
            <p className="text-xs text-gray-500">{cat.label}</p>
          </div>
        </div>
        <div className={`h-6 w-6 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
          selected ? 'bg-earth-400 border-earth-400' : 'border-gray-300 bg-white'
        }`}>
          {selected && <Check className="h-3.5 w-3.5 text-white" />}
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-gray-600 line-clamp-2 mb-3">{template.description}</p>

      {/* Stats row */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        <span className="text-xs px-2 py-0.5 rounded-full bg-earth-50 text-earth-700 font-medium border border-earth-200">
          ~{template.impact_label}
        </span>
        {template.scope && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SCOPE_COLORS[template.scope]}`}>
            Обхват {template.scope}
          </span>
        )}
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DIFFICULTY_COLORS[template.difficulty]}`}>
          {DIFFICULTY_LABELS[template.difficulty]}
        </span>
      </div>

      {/* Initiatives preview */}
      <div className="flex items-center gap-1 text-xs text-gray-500">
        <ListChecks className="h-3.5 w-3.5 text-gray-400" />
        <span>{template.initiatives.length} предварително зададени задачи</span>
        <span className="mx-1">·</span>
        <span>{template.typical_months} мес.</span>
      </div>
    </button>
  );
}

// ── Strategy card (existing strategy on list page) ───────────────────────────

function StrategyCard({ strategy, onDelete }: { strategy: Strategy; onDelete: (id: string) => void }) {
  const cat     = CATEGORY_CONFIG[strategy.category];
  const sta     = STATUS_CONFIG[strategy.status];
  const pri     = PRIORITY_CONFIG[strategy.priority];
  const CatIcon = cat.icon;
  const StaIcon = sta.icon;

  const initiatives = strategy.strategy_initiatives ?? [];
  const total       = initiatives.length;
  const done        = initiatives.filter(i => i.status === 'completed').length;
  const progress    = total > 0 ? Math.round((done / total) * 100) : 0;

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm('Сигурни ли сте, че искате да изтриете тази стратегия?')) return;
    onDelete(strategy.id);
  };

  return (
    <Link href={`/strategies/${strategy.id}`}>
      <Card className="group hover:shadow-md transition-all border hover:border-earth-300 cursor-pointer h-full">
        <div className={`h-1 rounded-t-xl ${
          strategy.priority === 'high'   ? 'bg-red-400' :
          strategy.priority === 'medium' ? 'bg-amber-400' : 'bg-gray-300'
        }`} />

        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className={`h-9 w-9 rounded-lg ${cat.bg} flex items-center justify-center shrink-0`}>
              <CatIcon className={`h-5 w-5 ${cat.color}`} />
            </div>
            <button
              onClick={handleDelete}
              className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <CardTitle className="text-base mt-2 leading-snug line-clamp-2">{strategy.title}</CardTitle>
          {strategy.description && (
            <CardDescription className="line-clamp-2 text-xs">{strategy.description}</CardDescription>
          )}
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${sta.color}`}>
              <StaIcon className="h-3 w-3" /> {sta.label}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${pri.color}`}>
              {pri.label}
            </span>
            {strategy.scope && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SCOPE_COLORS[strategy.scope]}`}>
                Обхват {strategy.scope}
              </span>
            )}
          </div>

          {strategy.estimated_reduction_co2e != null && (
            <div className="flex items-center gap-1.5 text-xs text-earth-600">
              <TrendingDown className="h-3.5 w-3.5" />
              <span className="font-medium">~{strategy.estimated_reduction_co2e.toFixed(1)} tCO2e</span>
              <span className="text-gray-400">очаквано</span>
            </div>
          )}

          {total > 0 && (
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <ListChecks className="h-3 w-3" /> Инициативи
                </span>
                <span className="text-xs font-medium text-gray-700">{done}/{total}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div className="h-1.5 rounded-full bg-earth-400 transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {strategy.target_completion_date && (
            <p className="text-xs text-gray-400">
              Краен срок: {new Date(strategy.target_completion_date).toLocaleDateString('bg-BG')}
            </p>
          )}

          <div className="flex items-center justify-end pt-1">
            <span className="text-xs text-earth-500 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
              Детайли <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// ── Template Picker overlay ───────────────────────────────────────────────────

// ── Types for the review step ─────────────────────────────────────────────────

interface ReviewItem {
  templateId: string;
  title: string;
  scope: string;
  priority: Priority;
  estimated_reduction_co2e: string;
  estimated_cost: string;
  responsible_person: string;
  start_date: string;
  target_completion_date: string;
  notes: string;
}

function buildReviewItem(template: StrategyTemplate, globalStartDate: string): ReviewItem {
  const start  = new Date(globalStartDate);
  const target = new Date(start);
  target.setMonth(target.getMonth() + template.typical_months);

  return {
    templateId:               template.id,
    title:                    template.title,
    scope:                    template.scope?.toString() ?? '',
    priority:                 template.priority,
    estimated_reduction_co2e: (
      (template.estimated_reduction_co2e_min + template.estimated_reduction_co2e_max) / 2
    ).toFixed(1),
    estimated_cost: Math.round(
      (template.estimated_cost_min + template.estimated_cost_max) / 2,
    ).toString(),
    responsible_person:     '',
    start_date:             globalStartDate,
    target_completion_date: target.toISOString().split('T')[0],
    notes:                  '',
  };
}

// ── Template Picker (two-step: Browse → Review) ───────────────────────────────

function TemplatePicker({
  open,
  onClose,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  onApply: (items: ReviewItem[]) => void;
}) {
  const [step, setStep]                 = useState<'browse' | 'review'>('browse');
  const [selected, setSelected]         = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState<TemplateCategory | 'all'>('all');
  const [globalStartDate, setGlobalStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [reviewItems, setReviewItems]   = useState<ReviewItem[]>([]);
  const [applying, setApplying]         = useState(false);

  // Reset on close
  const handleClose = () => {
    setStep('browse');
    setSelected(new Set());
    setReviewItems([]);
    onClose();
  };

  const filtered = categoryFilter === 'all'
    ? STRATEGY_TEMPLATES
    : STRATEGY_TEMPLATES.filter(t => t.category === categoryFilter);

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Move to review step — pre-fill editable fields from template defaults
  const goToReview = () => {
    if (selected.size === 0) { toast.warning('Изберете поне един шаблон'); return; }
    const items = STRATEGY_TEMPLATES
      .filter(t => selected.has(t.id))
      .map(t => buildReviewItem(t, globalStartDate));
    setReviewItems(items);
    setStep('review');
  };

  // Update a single field on a review item
  const updateReviewItem = (idx: number, field: keyof ReviewItem, value: string) => {
    setReviewItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const removeReviewItem = (idx: number) => {
    const updated = reviewItems.filter((_, i) => i !== idx);
    if (updated.length === 0) {
      setStep('browse');
      return;
    }
    setReviewItems(updated);
    setSelected(new Set(updated.map(i => i.templateId)));
  };

  const handleCreate = async () => {
    setApplying(true);
    await onApply(reviewItems);
    setApplying(false);
    setSelected(new Set());
    setReviewItems([]);
    setStep('browse');
  };

  if (!open) return null;

  // ── Browse totals
  const selectedTemplates = STRATEGY_TEMPLATES.filter(t => selected.has(t.id));
  const totalReductionMin = selectedTemplates.reduce((s, t) => s + t.estimated_reduction_co2e_min, 0);
  const totalReductionMax = selectedTemplates.reduce((s, t) => s + t.estimated_reduction_co2e_max, 0);

  // ── Review totals
  const reviewReduction = reviewItems.reduce((s, i) => s + (parseFloat(i.estimated_reduction_co2e) || 0), 0);
  const reviewCost      = reviewItems.reduce((s, i) => s + (parseFloat(i.estimated_cost) || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">

      {/* ── Universal top bar ── */}
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
                <h2 className="text-lg font-bold text-gray-900">Каталог от стратегии</h2>
                <p className="text-xs text-gray-500">Изберете шаблони, след това прегледайте и редактирайте параметрите</p>
              </>
            ) : (
              <>
                <h2 className="text-lg font-bold text-gray-900">Преглед и редакция</h2>
                <p className="text-xs text-gray-500">Коригирайте параметрите преди създаване</p>
              </>
            )}
          </div>
        </div>

        {/* Step indicator */}
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

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {step === 'browse' && (
        <>
          {/* Category filter */}
          <div className="border-b bg-gray-50 px-6 py-3 flex items-center gap-2 overflow-x-auto shrink-0">
            {TEMPLATE_CATEGORY_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setCategoryFilter(f.value as TemplateCategory | 'all')}
                className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                  categoryFilter === f.value
                    ? 'bg-earth-400 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-earth-300'
                }`}
              >
                {f.label}
                {f.value !== 'all' && (
                  <span className="ml-1 opacity-60">
                    ({STRATEGY_TEMPLATES.filter(t => t.category === f.value).length})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Template grid */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map(template => (
                <TemplateCard
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
                      <p className="text-xs text-gray-500">Избрани</p>
                      <p className="text-xl font-bold text-gray-900">{selected.size}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Очаквано намаление</p>
                      <p className="text-sm font-bold text-earth-600">
                        {totalReductionMin.toFixed(0)}–{totalReductionMax.toFixed(0)} tCO₂e / год
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-500">Изберете шаблони от горе</p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-gray-600 whitespace-nowrap">Начална дата</Label>
                  <Input
                    type="date"
                    value={globalStartDate}
                    onChange={e => setGlobalStartDate(e.target.value)}
                    className="w-36 text-xs h-8"
                  />
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
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {step === 'review' && (
        <>
          {/* Review list */}
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
            <div className="max-w-4xl mx-auto space-y-4">
              <p className="text-sm text-gray-500 mb-2">
                Коригирайте параметрите на всяка стратегия. Инициативите се генерират автоматично след създаване.
              </p>

              {reviewItems.map((item, idx) => {
                const template = STRATEGY_TEMPLATES.find(t => t.id === item.templateId)!;
                const cat      = CATEGORY_CONFIG[template.category as StrategyCategory];
                const CatIcon  = cat.icon;

                return (
                  <div key={item.templateId} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    {/* Card header */}
                    <div className={`px-5 py-3 flex items-center justify-between ${cat.bg} border-b ${cat.border}`}>
                      <div className="flex items-center gap-2.5">
                        <CatIcon className={`h-5 w-5 ${cat.color} shrink-0`} />
                        <span className="text-sm font-semibold text-gray-800">{cat.label}</span>
                        {template.scope && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SCOPE_COLORS[template.scope]}`}>
                            Обхват {template.scope}
                          </span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DIFFICULTY_COLORS[template.difficulty]}`}>
                          {DIFFICULTY_LABELS[template.difficulty]}
                        </span>
                      </div>
                      <button
                        onClick={() => removeReviewItem(idx)}
                        className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" /> Премахни
                      </button>
                    </div>

                    {/* Editable fields */}
                    <div className="p-5 space-y-4">
                      {/* Title */}
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500">Заглавие</Label>
                        <Input
                          value={item.title}
                          onChange={e => updateReviewItem(idx, 'title', e.target.value)}
                          className="text-sm font-medium"
                        />
                      </div>

                      {/* Row 1: reduction | cost | scope | priority */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-500">Намаление (tCO₂e/год)</Label>
                          <Input
                            type="number" step="0.1" min="0"
                            value={item.estimated_reduction_co2e}
                            onChange={e => updateReviewItem(idx, 'estimated_reduction_co2e', e.target.value)}
                            className="text-sm"
                          />
                          <p className="text-[10px] text-gray-400">
                            Диапазон: {template.estimated_reduction_co2e_min}–{template.estimated_reduction_co2e_max}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-500">Инвестиция (EUR)</Label>
                          <Input
                            type="number" step="100" min="0"
                            value={item.estimated_cost}
                            onChange={e => updateReviewItem(idx, 'estimated_cost', e.target.value)}
                            className="text-sm"
                          />
                          <p className="text-[10px] text-gray-400">
                            Диапазон: {template.estimated_cost_min.toLocaleString('bg-BG')}–{template.estimated_cost_max.toLocaleString('bg-BG')} EUR
                          </p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-500">Обхват</Label>
                          <Select
                            value={item.scope || 'none'}
                            onValueChange={v => updateReviewItem(idx, 'scope', v === 'none' ? '' : v)}
                          >
                            <SelectTrigger className="text-sm h-9"><SelectValue placeholder="Всички" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Всички</SelectItem>
                              <SelectItem value="1">Обхват 1</SelectItem>
                              <SelectItem value="2">Обхват 2</SelectItem>
                              <SelectItem value="3">Обхват 3</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-500">Приоритет</Label>
                          <Select
                            value={item.priority}
                            onValueChange={v => updateReviewItem(idx, 'priority', v)}
                          >
                            <SelectTrigger className="text-sm h-9"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="high">Висок</SelectItem>
                              <SelectItem value="medium">Среден</SelectItem>
                              <SelectItem value="low">Нисък</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Row 2: start date | end date | responsible */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-500">Начална дата</Label>
                          <Input
                            type="date"
                            value={item.start_date}
                            onChange={e => updateReviewItem(idx, 'start_date', e.target.value)}
                            className="text-sm h-9"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-500">Краен срок</Label>
                          <Input
                            type="date"
                            value={item.target_completion_date}
                            onChange={e => updateReviewItem(idx, 'target_completion_date', e.target.value)}
                            className="text-sm h-9"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-500">Отговорно лице</Label>
                          <Input
                            value={item.responsible_person}
                            onChange={e => updateReviewItem(idx, 'responsible_person', e.target.value)}
                            placeholder="Иван Иванов"
                            className="text-sm h-9"
                          />
                        </div>
                      </div>

                      {/* Initiatives preview */}
                      <div className="bg-gray-50 rounded-lg px-4 py-2.5 flex items-center gap-2">
                        <ListChecks className="h-4 w-4 text-gray-400 shrink-0" />
                        <p className="text-xs text-gray-500">
                          {template.initiatives.length} инициативи ще бъдат създадени автоматично:{' '}
                          <span className="text-gray-700 font-medium">
                            {template.initiatives.map(i => i.title).join(' · ')}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom confirm bar */}
          <div className="border-t bg-white px-6 py-4 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] shrink-0">
            <div className="max-w-4xl mx-auto flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-xs text-gray-500">Стратегии за създаване</p>
                  <p className="text-xl font-bold text-gray-900">{reviewItems.length}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Общо намаление</p>
                  <p className="text-sm font-bold text-earth-600">{reviewReduction.toFixed(1)} tCO₂e / год</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Обща инвестиция</p>
                  <p className="text-sm font-bold text-gray-700">{formatMoney(reviewCost)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={() => setStep('browse')}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Назад
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={applying || reviewItems.length === 0}
                  className="bg-earth-400 hover:bg-earth-500 gap-2 min-w-[200px]"
                >
                  {applying ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Създаване...</>
                  ) : (
                    <><CheckCircle className="h-4 w-4" /> Създай {reviewItems.length} стратегии</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ onOpenTemplates, onOpenCustom }: { onOpenTemplates: () => void; onOpenCustom: () => void }) {
  return (
    <div className="max-w-3xl mx-auto text-center py-16 space-y-8">
      <div>
        <div className="h-16 w-16 rounded-2xl bg-earth-100 flex items-center justify-center mx-auto mb-4">
          <Lightbulb className="h-8 w-8 text-earth-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Нямате стратегии</h2>
        <p className="text-gray-500 max-w-md mx-auto">
          Изберете готови шаблони или създайте своя стратегия ръчно.
        </p>
      </div>

      {/* Two big option cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
        <button
          onClick={onOpenTemplates}
          className="group rounded-2xl border-2 border-earth-200 bg-earth-50 p-6 hover:border-earth-400 hover:shadow-lg transition-all text-left"
        >
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-earth-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-base mb-1">Избери от каталога</p>
              <p className="text-sm text-gray-600">
                {STRATEGY_TEMPLATES.length} готови шаблона с предварително зададени инициативи, срокове и очаквани резултати.
              </p>
              <p className="text-xs text-earth-600 font-medium mt-2 flex items-center gap-1">
                Препоръчваме <ArrowRight className="h-3.5 w-3.5" />
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={onOpenCustom}
          className="group rounded-2xl border-2 border-gray-200 bg-white p-6 hover:border-gray-300 hover:shadow-md transition-all text-left"
        >
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <FileEdit className="h-6 w-6 text-gray-500" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-base mb-1">Създай ръчно</p>
              <p className="text-sm text-gray-600">
                Напишете своя стратегия с персонализирани детайли, специфични за вашата компания.
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* Preview of templates */}
      <div>
        <p className="text-xs text-gray-400 mb-3">Примерни шаблони от каталога</p>
        <div className="flex flex-wrap gap-2 justify-center">
          {STRATEGY_TEMPLATES.slice(0, 6).map(t => {
            const CatIcon = CATEGORY_CONFIG[t.category as StrategyCategory].icon;
            return (
              <span key={t.id} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-gray-100 text-gray-700">
                <CatIcon className="h-3.5 w-3.5" />
                {t.title}
              </span>
            );
          })}
          <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-gray-100 text-gray-500">
            +{STRATEGY_TEMPLATES.length - 6} още...
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Main form state ───────────────────────────────────────────────────────────

const EMPTY_FORM = {
  title: '', description: '', category: 'energy_efficiency' as StrategyCategory,
  scope: '', priority: 'medium' as Priority, status: 'draft' as StrategyStatus,
  target_id: '', estimated_reduction_co2e: '', estimated_cost: '',
  responsible_person: '', start_date: '', target_completion_date: '', notes: '',
};

// ── Main page ─────────────────────────────────────────────────────────────────

export default function StrategiesPage() {
  const [strategies, setStrategies]   = useState<Strategy[]>([]);
  const [targets, setTargets]         = useState<EmissionTarget[]>([]);
  const [loading, setLoading]         = useState(true);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [customDialogOpen, setCustomDialogOpen]     = useState(false);
  const [saving, setSaving]           = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [formData, setFormData]       = useState(EMPTY_FORM);

  const fetchStrategies = useCallback(async () => {
    try {
      const res = await fetch('/api/strategies');
      if (res.ok) {
        const result = await res.json();
        setStrategies(result.data || []);
      }
    } catch { toast.error('Грешка при зареждане на стратегиите'); }
    finally { setLoading(false); }
  }, []);

  const fetchTargets = useCallback(async () => {
    try {
      const res = await fetch('/api/targets');
      if (res.ok) {
        const result = await res.json();
        setTargets(result.data || []);
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchStrategies(); fetchTargets(); }, [fetchStrategies, fetchTargets]);

  // Apply templates (receives fully-edited ReviewItems from the two-step picker)
  const handleApplyTemplates = async (items: ReviewItem[]) => {
    try {
      const payload = {
        templates: items.map(item => ({
          templateId:               item.templateId,
          title:                    item.title,
          scope:                    item.scope ? parseInt(item.scope) : null,
          priority:                 item.priority,
          estimated_reduction_co2e: item.estimated_reduction_co2e ? parseFloat(item.estimated_reduction_co2e) : null,
          estimated_cost:           item.estimated_cost ? parseFloat(item.estimated_cost) : null,
          responsible_person:       item.responsible_person || null,
          start_date:               item.start_date || null,
          target_completion_date:   item.target_completion_date || null,
          notes:                    item.notes || null,
        })),
      };
      const res = await fetch('/api/strategies/from-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      const result = await res.json();
      toast.success(`Създадени ${result.data.created} стратегии с всички инициативи!`);
      setTemplatePickerOpen(false);
      fetchStrategies();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Грешка при създаване');
    }
  };

  // Custom create
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title:                    formData.title,
        description:              formData.description || null,
        category:                 formData.category,
        scope:                    formData.scope ? parseInt(formData.scope) : null,
        priority:                 formData.priority,
        status:                   formData.status,
        target_id:                formData.target_id || null,
        estimated_reduction_co2e: formData.estimated_reduction_co2e ? parseFloat(formData.estimated_reduction_co2e) : null,
        estimated_cost:           formData.estimated_cost ? parseFloat(formData.estimated_cost) : null,
        responsible_person:       formData.responsible_person || null,
        start_date:               formData.start_date || null,
        target_completion_date:   formData.target_completion_date || null,
        notes:                    formData.notes || null,
      };
      const res = await fetch('/api/strategies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      toast.success('Стратегията е създадена успешно');
      setCustomDialogOpen(false);
      setFormData(EMPTY_FORM);
      fetchStrategies();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Грешка при запазване');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/strategies/${id}`, { method: 'DELETE' });
      toast.success('Стратегията е изтрита');
      fetchStrategies();
    } catch { toast.error('Грешка при изтриване'); }
  };

  // Filter & stats
  const filtered      = filterStatus === 'all' ? strategies : strategies.filter(s => s.status === filterStatus);
  const activeCount   = strategies.filter(s => s.status === 'active').length;
  const completedCount = strategies.filter(s => s.status === 'completed').length;
  const totalReduction = strategies.reduce((sum, s) => sum + (s.actual_reduction_co2e ?? s.estimated_reduction_co2e ?? 0), 0);
  const totalInitiatives = strategies.reduce((sum, s) => sum + (s.strategy_initiatives?.length ?? 0), 0);
  const doneInitiatives  = strategies.reduce((sum, s) => sum + (s.strategy_initiatives?.filter(i => i.status === 'completed').length ?? 0), 0);

  if (loading) {
    return <PageSkeleton statCards={4} />;
  }

  return (
    <>
      {/* ── Template picker overlay ── */}
      <TemplatePicker
        open={templatePickerOpen}
        onClose={() => setTemplatePickerOpen(false)}
        onApply={handleApplyTemplates}
      />

      <div className="p-8">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* ── Header ── */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-earth-100 flex items-center justify-center">
                <Lightbulb className="h-6 w-6 text-earth-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Стратегии и планиране</h1>
                <p className="text-sm text-gray-500">Планирайте и проследявайте инициативи за намаляване на въглеродния отпечатък</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                className="bg-earth-400 hover:bg-earth-500 gap-2"
                onClick={() => setTemplatePickerOpen(true)}
              >
                <Sparkles className="h-4 w-4" /> Избери от каталога
              </Button>

              <Dialog open={customDialogOpen} onOpenChange={open => { setCustomDialogOpen(open); if (!open) setFormData(EMPTY_FORM); }}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Plus className="h-4 w-4" /> Ръчно
                  </Button>
                </DialogTrigger>

                <DialogContent className="sm:max-w-[580px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Нова стратегия (ръчно)</DialogTitle>
                    <DialogDescription>Описвайте стратегията, изберете категория и задайте целеви параметри.</DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label>Заглавие *</Label>
                      <Input
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        placeholder="напр. Преминаване към LED осветление"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Описание</Label>
                      <Textarea
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Категория *</Label>
                        <Select value={formData.category} onValueChange={v => setFormData({ ...formData, category: v as StrategyCategory })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {(Object.entries(CATEGORY_CONFIG) as [StrategyCategory, typeof CATEGORY_CONFIG[StrategyCategory]][]).map(([key, cfg]) => (
                              <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Обхват</Label>
                        <Select value={formData.scope || 'none'} onValueChange={v => setFormData({ ...formData, scope: v === 'none' ? '' : v })}>
                          <SelectTrigger><SelectValue placeholder="Всички" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Всички обхвати</SelectItem>
                            <SelectItem value="1">Обхват 1</SelectItem>
                            <SelectItem value="2">Обхват 2</SelectItem>
                            <SelectItem value="3">Обхват 3</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Приоритет</Label>
                        <Select value={formData.priority} onValueChange={v => setFormData({ ...formData, priority: v as Priority })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">Висок</SelectItem>
                            <SelectItem value="medium">Среден</SelectItem>
                            <SelectItem value="low">Нисък</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Статус</Label>
                        <Select value={formData.status} onValueChange={v => setFormData({ ...formData, status: v as StrategyStatus })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Чернова</SelectItem>
                            <SelectItem value="active">Активна</SelectItem>
                            <SelectItem value="on_hold">На пауза</SelectItem>
                            <SelectItem value="completed">Завършена</SelectItem>
                            <SelectItem value="cancelled">Отменена</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {targets.length > 0 && (
                      <div className="space-y-2">
                        <Label>Свързана цел</Label>
                        <Select value={formData.target_id || 'none'} onValueChange={v => setFormData({ ...formData, target_id: v === 'none' ? '' : v })}>
                          <SelectTrigger><SelectValue placeholder="Без свързана цел" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Без свързана цел</SelectItem>
                            {targets.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Очаквано намаление (tCO2e)</Label>
                        <Input type="number" step="0.01" min="0" value={formData.estimated_reduction_co2e} onChange={e => setFormData({ ...formData, estimated_reduction_co2e: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Прогнозна инвестиция (EUR)</Label>
                        <Input type="number" step="1" min="0" value={formData.estimated_cost} onChange={e => setFormData({ ...formData, estimated_cost: e.target.value })} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Отговорно лице</Label>
                      <Input value={formData.responsible_person} onChange={e => setFormData({ ...formData, responsible_person: e.target.value })} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Начална дата</Label>
                        <Input type="date" value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Краен срок</Label>
                        <Input type="date" value={formData.target_completion_date} onChange={e => setFormData({ ...formData, target_completion_date: e.target.value })} />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setCustomDialogOpen(false)}>Отказ</Button>
                      <Button type="submit" disabled={saving} className="bg-earth-300 hover:bg-earth-400">
                        {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Запазване...</> : 'Създай стратегия'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* ── KPIs (only when strategies exist) ── */}
          {strategies.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KpiCard label="Активни стратегии" value={activeCount.toString()} color="bg-blue-50" />
              <KpiCard label="Завършени" value={completedCount.toString()} color="bg-green-50" />
              <KpiCard label="Общо намаление" value={`${totalReduction.toFixed(1)} tCO2e`} sub="прогнозно / реално" color="bg-earth-50" />
              <KpiCard label="Инициативи" value={`${doneInitiatives}/${totalInitiatives}`} sub="изпълнени" color="bg-purple-50" />
            </div>
          )}

          {/* ── Content ── */}
          {strategies.length === 0 ? (
            <EmptyState
              onOpenTemplates={() => setTemplatePickerOpen(true)}
              onOpenCustom={() => setCustomDialogOpen(true)}
            />
          ) : (
            <>
              {/* Filter bar */}
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="h-4 w-4 text-gray-400" />
                {(['all', 'draft', 'active', 'on_hold', 'completed', 'cancelled'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                      filterStatus === s ? 'bg-earth-400 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {s === 'all' ? 'Всички' : STATUS_CONFIG[s as StrategyStatus].label}
                    {s !== 'all' && <span className="ml-1.5 opacity-70">({strategies.filter(st => st.status === s).length})</span>}
                  </button>
                ))}
              </div>

              {/* Grid */}
              {filtered.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filtered.map(strategy => (
                    <StrategyCard key={strategy.id} strategy={strategy} onDelete={handleDelete} />
                  ))}
                </div>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="pt-12 pb-12 text-center">
                    <Filter className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                    <p className="text-gray-500">Няма стратегии с избрания статус</p>
                    <button onClick={() => setFilterStatus('all')} className="mt-2 text-sm text-earth-500 hover:underline">
                      Покажи всички
                    </button>
                  </CardContent>
                </Card>
              )}

              {/* Hint to add more from catalog */}
              <Card className="border-earth-200 bg-gradient-to-r from-earth-50 to-green-50">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-5 w-5 text-earth-600 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-earth-900">Добавете още стратегии от каталога</p>
                        <p className="text-xs text-earth-700">{STRATEGY_TEMPLATES.length} готови шаблона с предварително зададени инициативи</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="border-earth-300 text-earth-700 hover:bg-earth-100 gap-2" onClick={() => setTemplatePickerOpen(true)}>
                      <Sparkles className="h-4 w-4" /> Отвори каталога
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </>
  );
}
