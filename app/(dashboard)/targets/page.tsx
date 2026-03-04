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
} from 'lucide-react';
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

// ─── Main page ─────────────────────────────────────────────────────────────

export default function TargetsPage() {
  const [targets, setTargets]     = useState<EmissionTarget[]>([]);
  const [loading, setLoading]     = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
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
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
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

          <div className="flex gap-2">
            {targets.length > 0 && (
              <Button variant="outline" onClick={syncTargets} disabled={syncing}>
                <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                Синхронизирай
              </Button>
            )}
            <Dialog open={dialogOpen} onOpenChange={open => { setDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="bg-earth-300 hover:bg-earth-400">
                  <Plus className="mr-2 h-4 w-4" /> Нова цел
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
  );
}
