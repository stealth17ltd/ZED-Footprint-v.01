'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  ArrowLeft, Lightbulb, Plus, Loader2, CheckCircle, XCircle,
  Clock, PauseCircle, FileEdit, Trash2, Edit, Zap, Truck,
  Package, Recycle, Droplets, Users, MoreHorizontal, Leaf,
  TrendingDown, Calendar, User, Target, CheckSquare, Square,
  AlertCircle,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type StrategyStatus = 'draft' | 'active' | 'completed' | 'cancelled' | 'on_hold';
type StrategyCategory =
  | 'energy_efficiency' | 'renewable_energy' | 'fleet'
  | 'supply_chain' | 'waste' | 'water' | 'behavioral' | 'other';
type Priority = 'high' | 'medium' | 'low';
type InitiativeStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

interface Initiative {
  id: string;
  strategy_id: string;
  title: string;
  description: string | null;
  status: InitiativeStatus;
  assigned_to: string | null;
  due_date: string | null;
  completed_date: string | null;
  estimated_cost: number | null;
  actual_cost: number | null;
  estimated_reduction_co2e: number | null;
  actual_reduction_co2e: number | null;
  sort_order: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface Strategy {
  id: string;
  title: string;
  description: string | null;
  category: StrategyCategory;
  scope: number | null;
  priority: Priority;
  status: StrategyStatus;
  estimated_reduction_co2e: number | null;
  estimated_cost: number | null;
  actual_reduction_co2e: number | null;
  responsible_person: string | null;
  start_date: string | null;
  target_completion_date: string | null;
  actual_completion_date: string | null;
  notes: string | null;
  created_at: string;
  strategy_initiatives: Initiative[];
  emission_targets: { id: string; name: string; target_year: number } | null;
}

// ── Config maps ───────────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<StrategyCategory, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  energy_efficiency: { label: 'Енергийна ефективност', icon: Zap,            color: 'text-yellow-600', bg: 'bg-yellow-50' },
  renewable_energy:  { label: 'Възобновяема енергия',  icon: Leaf,           color: 'text-green-600',  bg: 'bg-green-50'  },
  fleet:             { label: 'Транспорт и автопарк',   icon: Truck,          color: 'text-blue-600',   bg: 'bg-blue-50'   },
  supply_chain:      { label: 'Верига на доставки',     icon: Package,        color: 'text-purple-600', bg: 'bg-purple-50' },
  waste:             { label: 'Управление на отпадъци', icon: Recycle,        color: 'text-orange-600', bg: 'bg-orange-50' },
  water:             { label: 'Водни ресурси',          icon: Droplets,       color: 'text-cyan-600',   bg: 'bg-cyan-50'   },
  behavioral:        { label: 'Поведенчески промени',   icon: Users,          color: 'text-pink-600',   bg: 'bg-pink-50'   },
  other:             { label: 'Друго',                  icon: MoreHorizontal, color: 'text-gray-600',   bg: 'bg-gray-50'   },
};

const STATUS_CONFIG: Record<StrategyStatus, { label: string; icon: React.ElementType; color: string }> = {
  draft:     { label: 'Чернова',   icon: FileEdit,    color: 'bg-gray-100 text-gray-700'   },
  active:    { label: 'Активна',   icon: Clock,       color: 'bg-blue-100 text-blue-700'   },
  completed: { label: 'Завършена', icon: CheckCircle, color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Отменена',  icon: XCircle,     color: 'bg-red-100 text-red-700'     },
  on_hold:   { label: 'На пауза',  icon: PauseCircle, color: 'bg-amber-100 text-amber-700' },
};

const INITIATIVE_STATUS_CONFIG: Record<InitiativeStatus, { label: string; color: string; dotColor: string }> = {
  pending:     { label: 'Предстои',        color: 'bg-gray-100 text-gray-700',   dotColor: 'bg-gray-400'   },
  in_progress: { label: 'В процес',        color: 'bg-blue-100 text-blue-700',   dotColor: 'bg-blue-500'   },
  completed:   { label: 'Изпълнена',       color: 'bg-green-100 text-green-700', dotColor: 'bg-green-500'  },
  cancelled:   { label: 'Отменена',        color: 'bg-red-100 text-red-700',     dotColor: 'bg-red-400'    },
};

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string }> = {
  high:   { label: 'Висок',  color: 'bg-red-100 text-red-700'     },
  medium: { label: 'Среден', color: 'bg-amber-100 text-amber-700' },
  low:    { label: 'Нисък',  color: 'bg-gray-100 text-gray-600'   },
};

const SCOPE_COLORS: Record<number, string> = {
  1: 'bg-green-100 text-green-700',
  2: 'bg-blue-100 text-blue-700',
  3: 'bg-orange-100 text-orange-700',
};

// ── Empty form helpers ────────────────────────────────────────────────────────

const EMPTY_INITIATIVE = {
  title: '',
  description: '',
  assigned_to: '',
  due_date: '',
  estimated_cost: '',
  estimated_reduction_co2e: '',
  notes: '',
  status: 'pending' as InitiativeStatus,
};

// ── Initiative row ────────────────────────────────────────────────────────────

function InitiativeRow({
  initiative,
  strategyId,
  onUpdate,
  onDelete,
  onEdit,
}: {
  initiative: Initiative;
  strategyId: string;
  onUpdate: (id: string, updates: Partial<Initiative>) => void;
  onDelete: (id: string) => void;
  onEdit: (initiative: Initiative) => void;
}) {
  const cfg     = INITIATIVE_STATUS_CONFIG[initiative.status];
  const isOver  = initiative.due_date && initiative.status !== 'completed' && initiative.status !== 'cancelled'
    && new Date(initiative.due_date) < new Date();

  const toggleComplete = () => {
    const newStatus: InitiativeStatus = initiative.status === 'completed' ? 'pending' : 'completed';
    onUpdate(initiative.id, { status: newStatus });
  };

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
      initiative.status === 'completed' ? 'bg-gray-50 border-gray-200 opacity-75' : 'bg-white border-gray-200 hover:border-earth-300'
    }`}>
      <button onClick={toggleComplete} className="mt-0.5 shrink-0">
        {initiative.status === 'completed'
          ? <CheckSquare className="h-5 w-5 text-green-500" />
          : <Square className="h-5 w-5 text-gray-300 hover:text-earth-400 transition-colors" />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={`text-sm font-medium ${initiative.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
            {initiative.title}
          </p>
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${cfg.color}`}>
            {cfg.label}
          </span>
          {isOver && (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 font-medium flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> Просрочена
            </span>
          )}
        </div>

        {initiative.description && (
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{initiative.description}</p>
        )}

        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          {initiative.assigned_to && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <User className="h-3 w-3" /> {initiative.assigned_to}
            </span>
          )}
          {initiative.due_date && (
            <span className={`flex items-center gap-1 text-xs ${isOver ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
              <Calendar className="h-3 w-3" />
              {new Date(initiative.due_date).toLocaleDateString('bg-BG')}
            </span>
          )}
          {initiative.estimated_reduction_co2e != null && (
            <span className="flex items-center gap-1 text-xs text-earth-600">
              <TrendingDown className="h-3 w-3" />
              {initiative.estimated_reduction_co2e.toFixed(1)} tCO2e
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-1 shrink-0">
        {initiative.status !== 'completed' && initiative.status !== 'cancelled' && (
          <Select
            value={initiative.status}
            onValueChange={v => onUpdate(initiative.id, { status: v as InitiativeStatus })}
          >
            <SelectTrigger className="h-7 text-xs w-[120px] border-dashed">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Предстои</SelectItem>
              <SelectItem value="in_progress">В процес</SelectItem>
              <SelectItem value="completed">Изпълнена</SelectItem>
              <SelectItem value="cancelled">Отменена</SelectItem>
            </SelectContent>
          </Select>
        )}
        <button
          onClick={() => onEdit(initiative)}
          className="p-1.5 rounded text-gray-400 hover:text-earth-500 hover:bg-earth-50 transition-colors"
        >
          <Edit className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => onDelete(initiative.id)}
          className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function StrategyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [strategy, setStrategy]           = useState<Strategy | null>(null);
  const [loading, setLoading]             = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [initiativeDialog, setInitiativeDialog] = useState(false);
  const [editingInitiative, setEditingInitiative] = useState<Initiative | null>(null);
  const [savingStrategy, setSavingStrategy] = useState(false);
  const [savingInitiative, setSavingInitiative] = useState(false);

  const [strategyForm, setStrategyForm] = useState({
    title: '', description: '', status: 'draft' as StrategyStatus,
    priority: 'medium' as Priority, category: 'energy_efficiency' as StrategyCategory,
    scope: '', responsible_person: '', start_date: '',
    target_completion_date: '', estimated_reduction_co2e: '', estimated_cost: '',
    actual_reduction_co2e: '', notes: '',
  });

  const [initiativeForm, setInitiativeForm] = useState(EMPTY_INITIATIVE);

  const fetchStrategy = useCallback(async () => {
    try {
      const res = await fetch(`/api/strategies/${id}`);
      if (!res.ok) { router.push('/strategies'); return; }
      const result = await res.json();
      setStrategy(result.data);
    } catch { toast.error('Грешка при зареждане'); }
    finally   { setLoading(false); }
  }, [id, router]);

  useEffect(() => { fetchStrategy(); }, [fetchStrategy]);

  // Populate strategy edit form when dialog opens
  useEffect(() => {
    if (strategy && editDialogOpen) {
      setStrategyForm({
        title:                    strategy.title,
        description:              strategy.description ?? '',
        status:                   strategy.status,
        priority:                 strategy.priority,
        category:                 strategy.category,
        scope:                    strategy.scope?.toString() ?? '',
        responsible_person:       strategy.responsible_person ?? '',
        start_date:               strategy.start_date ?? '',
        target_completion_date:   strategy.target_completion_date ?? '',
        estimated_reduction_co2e: strategy.estimated_reduction_co2e?.toString() ?? '',
        estimated_cost:           strategy.estimated_cost?.toString() ?? '',
        actual_reduction_co2e:    strategy.actual_reduction_co2e?.toString() ?? '',
        notes:                    strategy.notes ?? '',
      });
    }
  }, [strategy, editDialogOpen]);

  // ── Strategy CRUD ─────────────────────────────────────────────────────────
  const handleSaveStrategy = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingStrategy(true);
    try {
      const payload = {
        title:                    strategyForm.title,
        description:              strategyForm.description || null,
        status:                   strategyForm.status,
        priority:                 strategyForm.priority,
        category:                 strategyForm.category,
        scope:                    strategyForm.scope ? parseInt(strategyForm.scope) : null,
        responsible_person:       strategyForm.responsible_person || null,
        start_date:               strategyForm.start_date || null,
        target_completion_date:   strategyForm.target_completion_date || null,
        estimated_reduction_co2e: strategyForm.estimated_reduction_co2e ? parseFloat(strategyForm.estimated_reduction_co2e) : null,
        estimated_cost:           strategyForm.estimated_cost ? parseFloat(strategyForm.estimated_cost) : null,
        actual_reduction_co2e:    strategyForm.actual_reduction_co2e ? parseFloat(strategyForm.actual_reduction_co2e) : null,
        notes:                    strategyForm.notes || null,
      };
      const res = await fetch(`/api/strategies/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      toast.success('Стратегията е актуализирана');
      setEditDialogOpen(false);
      fetchStrategy();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Грешка при запазване');
    } finally {
      setSavingStrategy(false);
    }
  };

  const handleDeleteStrategy = async () => {
    if (!confirm('Изтриването ще премахне всички свързани инициативи. Продължи?')) return;
    try {
      await fetch(`/api/strategies/${id}`, { method: 'DELETE' });
      toast.success('Стратегията е изтрита');
      router.push('/strategies');
    } catch { toast.error('Грешка при изтриване'); }
  };

  // ── Initiative CRUD ───────────────────────────────────────────────────────
  const openNewInitiative = () => {
    setEditingInitiative(null);
    setInitiativeForm(EMPTY_INITIATIVE);
    setInitiativeDialog(true);
  };

  const openEditInitiative = (initiative: Initiative) => {
    setEditingInitiative(initiative);
    setInitiativeForm({
      title:                    initiative.title,
      description:              initiative.description ?? '',
      assigned_to:              initiative.assigned_to ?? '',
      due_date:                 initiative.due_date ?? '',
      estimated_cost:           initiative.estimated_cost?.toString() ?? '',
      estimated_reduction_co2e: initiative.estimated_reduction_co2e?.toString() ?? '',
      notes:                    initiative.notes ?? '',
      status:                   initiative.status,
    });
    setInitiativeDialog(true);
  };

  const handleSaveInitiative = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingInitiative(true);
    try {
      const payload = {
        title:                    initiativeForm.title,
        description:              initiativeForm.description || null,
        status:                   initiativeForm.status,
        assigned_to:              initiativeForm.assigned_to || null,
        due_date:                 initiativeForm.due_date || null,
        estimated_cost:           initiativeForm.estimated_cost ? parseFloat(initiativeForm.estimated_cost) : null,
        estimated_reduction_co2e: initiativeForm.estimated_reduction_co2e ? parseFloat(initiativeForm.estimated_reduction_co2e) : null,
        notes:                    initiativeForm.notes || null,
      };

      const url    = editingInitiative
        ? `/api/strategies/${id}/initiatives/${editingInitiative.id}`
        : `/api/strategies/${id}/initiatives`;
      const method = editingInitiative ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      toast.success(editingInitiative ? 'Инициативата е актуализирана' : 'Инициативата е добавена');
      setInitiativeDialog(false);
      fetchStrategy();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Грешка при запазване');
    } finally {
      setSavingInitiative(false);
    }
  };

  const handleUpdateInitiative = async (initiativeId: string, updates: Partial<Initiative>) => {
    try {
      const res = await fetch(`/api/strategies/${id}/initiatives/${initiativeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error();
      fetchStrategy();
    } catch { toast.error('Грешка при актуализиране'); }
  };

  const handleDeleteInitiative = async (initiativeId: string) => {
    if (!confirm('Изтрий тази инициатива?')) return;
    try {
      await fetch(`/api/strategies/${id}/initiatives/${initiativeId}`, { method: 'DELETE' });
      toast.success('Инициативата е изтрита');
      fetchStrategy();
    } catch { toast.error('Грешка при изтриване'); }
  };

  // ── Derived stats ─────────────────────────────────────────────────────────
  const initiatives = strategy?.strategy_initiatives ?? [];
  const total       = initiatives.length;
  const done        = initiatives.filter(i => i.status === 'completed').length;
  const inProgress  = initiatives.filter(i => i.status === 'in_progress').length;
  const overdue     = initiatives.filter(i =>
    i.due_date && i.status !== 'completed' && i.status !== 'cancelled'
    && new Date(i.due_date) < new Date()
  ).length;
  const progress    = total > 0 ? Math.round((done / total) * 100) : 0;

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-earth-300" />
      </div>
    );
  }

  if (!strategy) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Стратегията не е намерена.</p>
        <Link href="/strategies" className="mt-4 inline-block text-earth-500 hover:underline">← Обратно</Link>
      </div>
    );
  }

  const cat    = CATEGORY_CONFIG[strategy.category];
  const sta    = STATUS_CONFIG[strategy.status];
  const pri    = PRIORITY_CONFIG[strategy.priority];
  const CatIcon = cat.icon;
  const StaIcon = sta.icon;

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* ── Back + header ── */}
        <div>
          <Link href="/strategies" className="flex items-center gap-1 text-sm text-gray-500 hover:text-earth-500 mb-4 transition-colors w-fit">
            <ArrowLeft className="h-4 w-4" /> Всички стратегии
          </Link>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className={`h-14 w-14 rounded-xl ${cat.bg} flex items-center justify-center shrink-0`}>
                <CatIcon className={`h-7 w-7 ${cat.color}`} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 leading-tight">{strategy.title}</h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
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
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                    {cat.label}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
                <Edit className="mr-2 h-4 w-4" /> Редактирай
              </Button>
              <Button
                variant="outline"
                className="text-red-500 border-red-200 hover:bg-red-50"
                onClick={handleDeleteStrategy}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* ── Description ── */}
        {strategy.description && (
          <Card>
            <CardContent className="pt-5 pb-5">
              <p className="text-sm text-gray-700 leading-relaxed">{strategy.description}</p>
            </CardContent>
          </Card>
        )}

        {/* ── Meta grid ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-earth-50 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Очаквано намаление</p>
            <p className="text-xl font-bold text-earth-600">
              {strategy.estimated_reduction_co2e != null ? `${strategy.estimated_reduction_co2e.toFixed(1)} tCO2e` : '—'}
            </p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Реализирано намаление</p>
            <p className="text-xl font-bold text-blue-600">
              {strategy.actual_reduction_co2e != null ? `${strategy.actual_reduction_co2e.toFixed(1)} tCO2e` : '—'}
            </p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Прогнозна инвестиция</p>
            <p className="text-xl font-bold text-purple-600">
              {strategy.estimated_cost != null ? `${strategy.estimated_cost.toLocaleString('bg-BG')} лв.` : '—'}
            </p>
          </div>
          <div className="bg-amber-50 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Краен срок</p>
            <p className="text-xl font-bold text-amber-600">
              {strategy.target_completion_date
                ? new Date(strategy.target_completion_date).toLocaleDateString('bg-BG', { day: 'numeric', month: 'short', year: 'numeric' })
                : '—'}
            </p>
          </div>
        </div>

        {/* ── Additional meta ── */}
        {(strategy.responsible_person || strategy.start_date || strategy.emission_targets) && (
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            {strategy.responsible_person && (
              <span className="flex items-center gap-1.5">
                <User className="h-4 w-4 text-gray-400" />
                <strong>Отговорен:</strong> {strategy.responsible_person}
              </span>
            )}
            {strategy.start_date && (
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-gray-400" />
                <strong>Старт:</strong> {new Date(strategy.start_date).toLocaleDateString('bg-BG')}
              </span>
            )}
            {strategy.emission_targets && (
              <span className="flex items-center gap-1.5">
                <Target className="h-4 w-4 text-gray-400" />
                <strong>Цел:</strong>{' '}
                <Link href="/targets" className="text-earth-500 hover:underline">
                  {strategy.emission_targets.name}
                </Link>
              </span>
            )}
          </div>
        )}

        {/* ── Initiatives section ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-earth-400" />
                Инициативи
                {total > 0 && (
                  <Badge variant="outline" className="text-xs">{done}/{total}</Badge>
                )}
              </h2>
              {total > 0 && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {inProgress > 0 && `${inProgress} в процес · `}
                  {overdue > 0 && <span className="text-red-500">{overdue} просрочени · </span>}
                  {progress}% изпълнени
                </p>
              )}
            </div>
            <Button size="sm" className="bg-earth-300 hover:bg-earth-400" onClick={openNewInitiative}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Добави
            </Button>
          </div>

          {/* Progress bar */}
          {total > 0 && (
            <div className="mb-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-earth-400 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Initiatives list */}
          {initiatives.length > 0 ? (
            <div className="space-y-2">
              {/* Active / pending first */}
              {initiatives
                .filter(i => i.status !== 'completed' && i.status !== 'cancelled')
                .map(initiative => (
                  <InitiativeRow
                    key={initiative.id}
                    initiative={initiative}
                    strategyId={id}
                    onUpdate={handleUpdateInitiative}
                    onDelete={handleDeleteInitiative}
                    onEdit={openEditInitiative}
                  />
                ))}
              {/* Completed / cancelled below */}
              {initiatives
                .filter(i => i.status === 'completed' || i.status === 'cancelled')
                .map(initiative => (
                  <InitiativeRow
                    key={initiative.id}
                    initiative={initiative}
                    strategyId={id}
                    onUpdate={handleUpdateInitiative}
                    onDelete={handleDeleteInitiative}
                    onEdit={openEditInitiative}
                  />
                ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="pt-8 pb-8 text-center">
                <CheckSquare className="mx-auto h-10 w-10 text-gray-300 mb-2" />
                <p className="text-sm text-gray-500 mb-3">
                  Нямате инициативи. Разбийте стратегията на конкретни стъпки.
                </p>
                <Button size="sm" variant="outline" onClick={openNewInitiative}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Добави инициатива
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Notes ── */}
        {strategy.notes && (
          <Card className="border-gray-200 bg-gray-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-600">Бележки</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{strategy.notes}</p>
            </CardContent>
          </Card>
        )}

      </div>

      {/* ── Edit strategy dialog ── */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[580px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редактиране на стратегия</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveStrategy} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Заглавие *</Label>
              <Input
                value={strategyForm.title}
                onChange={e => setStrategyForm({ ...strategyForm, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Описание</Label>
              <Textarea
                value={strategyForm.description}
                onChange={e => setStrategyForm({ ...strategyForm, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Категория</Label>
                <Select
                  value={strategyForm.category}
                  onValueChange={v => setStrategyForm({ ...strategyForm, category: v as StrategyCategory })}
                >
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
                <Select
                  value={strategyForm.scope || 'none'}
                  onValueChange={v => setStrategyForm({ ...strategyForm, scope: v === 'none' ? '' : v })}
                >
                  <SelectTrigger><SelectValue placeholder="Всички" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Всички</SelectItem>
                    <SelectItem value="1">Обхват 1</SelectItem>
                    <SelectItem value="2">Обхват 2</SelectItem>
                    <SelectItem value="3">Обхват 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Статус</Label>
                <Select
                  value={strategyForm.status}
                  onValueChange={v => setStrategyForm({ ...strategyForm, status: v as StrategyStatus })}
                >
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
              <div className="space-y-2">
                <Label>Приоритет</Label>
                <Select
                  value={strategyForm.priority}
                  onValueChange={v => setStrategyForm({ ...strategyForm, priority: v as Priority })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">Висок</SelectItem>
                    <SelectItem value="medium">Среден</SelectItem>
                    <SelectItem value="low">Нисък</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Очаквано намаление (tCO2e)</Label>
                <Input
                  type="number" step="0.01" min="0"
                  value={strategyForm.estimated_reduction_co2e}
                  onChange={e => setStrategyForm({ ...strategyForm, estimated_reduction_co2e: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Реализирано намаление (tCO2e)</Label>
                <Input
                  type="number" step="0.01" min="0"
                  value={strategyForm.actual_reduction_co2e}
                  onChange={e => setStrategyForm({ ...strategyForm, actual_reduction_co2e: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Прогнозна инвестиция (лв.)</Label>
                <Input
                  type="number" step="1" min="0"
                  value={strategyForm.estimated_cost}
                  onChange={e => setStrategyForm({ ...strategyForm, estimated_cost: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Отговорен</Label>
                <Input
                  value={strategyForm.responsible_person}
                  onChange={e => setStrategyForm({ ...strategyForm, responsible_person: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Начало</Label>
                <Input
                  type="date"
                  value={strategyForm.start_date}
                  onChange={e => setStrategyForm({ ...strategyForm, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Краен срок</Label>
                <Input
                  type="date"
                  value={strategyForm.target_completion_date}
                  onChange={e => setStrategyForm({ ...strategyForm, target_completion_date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Бележки</Label>
              <Textarea
                value={strategyForm.notes}
                onChange={e => setStrategyForm({ ...strategyForm, notes: e.target.value })}
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>Отказ</Button>
              <Button type="submit" disabled={savingStrategy} className="bg-earth-300 hover:bg-earth-400">
                {savingStrategy
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Запазване...</>
                  : 'Запази промените'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Initiative dialog ── */}
      <Dialog open={initiativeDialog} onOpenChange={open => { setInitiativeDialog(open); if (!open) setEditingInitiative(null); }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingInitiative ? 'Редактиране на инициатива' : 'Нова инициатива'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveInitiative} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Заглавие *</Label>
              <Input
                value={initiativeForm.title}
                onChange={e => setInitiativeForm({ ...initiativeForm, title: e.target.value })}
                placeholder="напр. Смяна на осветлението в склада"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Описание</Label>
              <Textarea
                value={initiativeForm.description}
                onChange={e => setInitiativeForm({ ...initiativeForm, description: e.target.value })}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Статус</Label>
                <Select
                  value={initiativeForm.status}
                  onValueChange={v => setInitiativeForm({ ...initiativeForm, status: v as InitiativeStatus })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Предстои</SelectItem>
                    <SelectItem value="in_progress">В процес</SelectItem>
                    <SelectItem value="completed">Изпълнена</SelectItem>
                    <SelectItem value="cancelled">Отменена</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Отговорен</Label>
                <Input
                  value={initiativeForm.assigned_to}
                  onChange={e => setInitiativeForm({ ...initiativeForm, assigned_to: e.target.value })}
                  placeholder="Иван Иванов"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Краен срок</Label>
                <Input
                  type="date"
                  value={initiativeForm.due_date}
                  onChange={e => setInitiativeForm({ ...initiativeForm, due_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Очаквано намаление (tCO2e)</Label>
                <Input
                  type="number" step="0.01" min="0"
                  value={initiativeForm.estimated_reduction_co2e}
                  onChange={e => setInitiativeForm({ ...initiativeForm, estimated_reduction_co2e: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Прогнозна цена (лв.)</Label>
              <Input
                type="number" step="1" min="0"
                value={initiativeForm.estimated_cost}
                onChange={e => setInitiativeForm({ ...initiativeForm, estimated_cost: e.target.value })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setInitiativeDialog(false)}>Отказ</Button>
              <Button type="submit" disabled={savingInitiative} className="bg-earth-300 hover:bg-earth-400">
                {savingInitiative
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Запазване...</>
                  : editingInitiative ? 'Запази' : 'Добави'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
