'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  ListChecks, Plus, Loader2, Calendar, TrendingUp, Eye, MapPin, Pencil,
  Trash2, Check, X, Building2, Truck, FileText, BarChart3, ShieldCheck,
  DollarSign, User, Filter, Database, AlertCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { MonthPicker } from '@/components/ui/month-picker';
import Link from 'next/link';

// ── Types ──────────────────────────────────────────────────────────────────
interface EmissionData {
  id: string;
  reporting_period: string;
  scope: number;
  category: string;
  activity_value: number;
  unit: string;
  calculated_co2e: number;
  notes: string | null;
  created_at: string;
  location: string | null;
  location_id: string | null;
  // Factor audit trail
  factor_source_name: string | null;
  factor_source_year: number | null;
  factor_db_id: string | null;
  equipment_id: string | null;
  supplier: string | null;
  invoice_number: string | null;
  measurement_method: string | null;
  data_quality: string | null;
  cost: number | null;
  currency: string | null;
  responsible_person: string | null;
}

interface CompanyLocation {
  id: string;
  location_name: string;
  city: string | null;
  is_primary: boolean | null;
}

// ── Category lists ─────────────────────────────────────────────────────────
const SCOPE_1_CATEGORIES = [
  { value: 'vehicles_diesel',   label: 'Превозни средства - Дизел',  unit: 'литри' },
  { value: 'vehicles_petrol',   label: 'Превозни средства - Бензин', unit: 'литри' },
  { value: 'vehicles_lpg',      label: 'Превозни средства - ГПГ',    unit: 'литри' },
  { value: 'natural_gas',       label: 'Природен газ',               unit: 'м³'   },
  { value: 'heating_oil',       label: 'Нафта за отопление',         unit: 'литри' },
  { value: 'coal',              label: 'Въглища',                    unit: 'кг'   },
  { value: 'refrigerant_r134a', label: 'Хладилен агент R-134a',      unit: 'кг'   },
  { value: 'refrigerant_r404a', label: 'Хладилен агент R-404A',      unit: 'кг'   },
];
const SCOPE_2_CATEGORIES = [
  { value: 'electricity',       label: 'Електроенергия',             unit: 'kWh' },
  { value: 'district_heating',  label: 'Топлоенергия (централно)',   unit: 'kWh' },
  { value: 'district_cooling',  label: 'Хладилна енергия (централна)', unit: 'kWh' },
];
const ALL_CATEGORIES = [...SCOPE_1_CATEGORIES, ...SCOPE_2_CATEGORIES];
const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  ALL_CATEGORIES.map(c => [c.value, c.label])
);

// ── Helpers ────────────────────────────────────────────────────────────────
const formatPeriod = (period: string) =>
  new Date(period).toLocaleDateString('bg-BG', { year: 'numeric', month: 'long' });

const QUALITY_CFG: Record<string, { label: string; cls: string }> = {
  high:   { label: 'Високо',  cls: 'bg-green-600' },
  medium: { label: 'Средно',  cls: 'bg-yellow-600' },
  low:    { label: 'Ниско',   cls: 'bg-orange-600' },
};
const METHOD_LABELS: Record<string, string> = {
  measured:   'Измерено (от уреди/фактури)',
  calculated: 'Изчислено (по формула)',
  estimated:  'Оценено (приблизително)',
};

// ── Edit form state ────────────────────────────────────────────────────────
interface EditForm {
  scope: '1' | '2';
  category: string;
  activity_value: string;
  unit: string;
  reporting_period: string;
  notes: string;
  location_id: string;
  location: string;
  equipment_id: string;
  supplier: string;
  invoice_number: string;
  measurement_method: string;
  data_quality: string;
  cost: string;
  currency: string;
  responsible_person: string;
}

function emissionToForm(e: EmissionData): EditForm {
  return {
    scope:              String(e.scope) as '1' | '2',
    category:           e.category,
    activity_value:     String(e.activity_value),
    unit:               e.unit,
    reporting_period:   e.reporting_period.slice(0, 7),
    notes:              e.notes ?? '',
    location_id:        e.location_id ?? '',
    location:           e.location ?? '',
    equipment_id:       e.equipment_id ?? '',
    supplier:           e.supplier ?? '',
    invoice_number:     e.invoice_number ?? '',
    measurement_method: e.measurement_method ?? 'measured',
    data_quality:       e.data_quality ?? 'high',
    cost:               e.cost != null ? String(e.cost) : '',
    currency:           e.currency ?? 'BGN',
    responsible_person: e.responsible_person ?? '',
  };
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function EmissionsListPage() {
  const router = useRouter();

  const [emissions,      setEmissions]      = useState<EmissionData[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [locations,      setLocations]      = useState<CompanyLocation[]>([]);
  const [scopeFilter,    setScopeFilter]    = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');

  // Details dialog
  const [detailsOpen, setDetailsOpen]           = useState(false);
  const [selectedEmission, setSelectedEmission] = useState<EmissionData | null>(null);

  // Edit dialog
  const [editOpen,  setEditOpen]  = useState(false);
  const [editTarget, setEditTarget] = useState<EmissionData | null>(null);
  const [editForm,   setEditForm]   = useState<EditForm | null>(null);
  const [saving,     setSaving]     = useState(false);

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // ── Load ──────────────────────────────────────────────────────────────────
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/api/emissions';
      if (scopeFilter !== 'all') url += `?scope=${scopeFilter}`;
      const [emRes, locRes] = await Promise.all([
        fetch(url),
        fetch('/api/locations'),
      ]);
      const emJson  = emRes.ok  ? await emRes.json()  : { data: [] };
      const locJson = locRes.ok ? await locRes.json() : { data: [] };
      setEmissions(emJson.data ?? []);
      setLocations((locJson.data ?? []).filter((l: CompanyLocation & { is_active: boolean | null }) => l.is_active !== false));
    } catch (err) {
      toast.error('Грешка при зареждане');
    } finally {
      setLoading(false);
    }
  }, [scopeFilter]);

  useEffect(() => { reload(); }, [reload]);

  // ── Filtering ─────────────────────────────────────────────────────────────
  const filtered = emissions.filter(e => {
    if (locationFilter === '__no_location__') return !e.location_id && !e.location;
    if (locationFilter !== 'all') return e.location_id === locationFilter;
    return true;
  });

  // ── Stats ─────────────────────────────────────────────────────────────────
  const total   = filtered.reduce((s, e) => s + e.calculated_co2e, 0);
  const scope1  = filtered.filter(e => e.scope === 1).reduce((s, e) => s + e.calculated_co2e, 0);
  const scope2  = filtered.filter(e => e.scope === 2).reduce((s, e) => s + e.calculated_co2e, 0);

  // ── Edit handlers ─────────────────────────────────────────────────────────
  function openEdit(e: EmissionData) {
    setEditTarget(e);
    setEditForm(emissionToForm(e));
    setEditOpen(true);
  }

  function handleScopeChange(scope: '1' | '2') {
    if (!editForm) return;
    setEditForm(f => f ? { ...f, scope, category: '', unit: '' } : f);
  }

  function handleCategoryChange(cat: string) {
    if (!editForm) return;
    const allCats = editForm.scope === '1' ? SCOPE_1_CATEGORIES : SCOPE_2_CATEGORIES;
    const found = allCats.find(c => c.value === cat);
    setEditForm(f => f ? { ...f, category: cat, unit: found?.unit ?? f.unit } : f);
  }

  async function handleSave() {
    if (!editTarget || !editForm) return;
    if (!editForm.category) { toast.error('Изберете категория'); return; }
    if (!editForm.activity_value || parseFloat(editForm.activity_value) <= 0) {
      toast.error('Въведете валидна стойност');
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        scope:              parseInt(editForm.scope),
        category:           editForm.category,
        activity_value:     parseFloat(editForm.activity_value),
        unit:               editForm.unit,
        reporting_period:   editForm.reporting_period,
        notes:              editForm.notes || null,
        location:           editForm.location_id ? editForm.location : (editForm.location || null),
        location_id:        editForm.location_id || null,
        equipment_id:       editForm.equipment_id || null,
        supplier:           editForm.supplier || null,
        invoice_number:     editForm.invoice_number || null,
        measurement_method: editForm.measurement_method,
        data_quality:       editForm.data_quality,
        cost:               editForm.cost ? parseFloat(editForm.cost) : null,
        currency:           editForm.currency,
        responsible_person: editForm.responsible_person || null,
      };

      const res = await fetch(`/api/emissions/${editTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success('Записът е актуализиран');
      setEditOpen(false);
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Грешка при запис');
    } finally {
      setSaving(false);
    }
  }

  // ── Delete handler ────────────────────────────────────────────────────────
  async function handleDelete(id: string) {
    const res = await fetch(`/api/emissions/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Записът е изтрит'); setDeleteId(null); reload(); }
    else { toast.error('Грешка при изтриване'); }
  }

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-earth-300" />
      </div>
    );
  }

  const currentCats = editForm?.scope === '1' ? SCOPE_1_CATEGORIES : SCOPE_2_CATEGORIES;

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-earth-100 flex items-center justify-center">
              <ListChecks className="h-6 w-6 text-earth-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Въглеродни емисии</h1>
              <p className="text-sm text-gray-500">Обхват 1 & 2 — всички въведени записи</p>
            </div>
          </div>
          <Button onClick={() => router.push('/data-entry')} className="bg-earth-300 hover:bg-earth-400">
            <Plus className="mr-2 h-4 w-4" /> Добави емисия
          </Button>
        </div>

        {/* ── KPI row ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Общо емисии',   value: total,  subtitle: `${filtered.length} записа`,      color: 'text-earth-400' },
            { label: 'Обхват 1',      value: scope1, subtitle: 'Директни емисии',                color: 'text-gray-900'  },
            { label: 'Обхват 2',      value: scope2, subtitle: 'Индиректни емисии',              color: 'text-gray-900'  },
          ].map(({ label, value, subtitle, color }) => (
            <Card key={label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">{label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${color}`}>{value.toFixed(2)}</div>
                <p className="text-xs text-gray-500 mt-1">{subtitle} · tCO₂e</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Table card ── */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <CardTitle>Списък с емисии</CardTitle>
                <CardDescription>Всички записи, сортирани по период</CardDescription>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="h-4 w-4 text-gray-400" />
                {locations.length > 0 && (
                  <Select value={locationFilter} onValueChange={setLocationFilter}>
                    <SelectTrigger className="w-48 h-9 text-sm">
                      <MapPin className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
                      <SelectValue placeholder="Всички локации" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Всички локации</SelectItem>
                      {locations.map(l => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.location_name}{l.city ? ` — ${l.city}` : ''}
                          {l.is_primary ? ' ★' : ''}
                        </SelectItem>
                      ))}
                      <SelectItem value="__no_location__">Без локация</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                <Select value={scopeFilter} onValueChange={setScopeFilter}>
                  <SelectTrigger className="w-40 h-9 text-sm">
                    <SelectValue placeholder="Филтър..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Всички обхвати</SelectItem>
                    <SelectItem value="1">Обхват 1</SelectItem>
                    <SelectItem value="2">Обхват 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {filtered.length === 0 ? (
              <div className="text-center py-12">
                <ListChecks className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  {emissions.length === 0 ? 'Няма въведени емисии' : 'Няма резултати при тези филтри'}
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  {emissions.length === 0 ? 'Започнете като добавите първата емисия' : 'Опитайте с различни филтри'}
                </p>
                {emissions.length === 0 && (
                  <Button onClick={() => router.push('/data-entry')} className="mt-4 bg-earth-300 hover:bg-earth-400">
                    <Plus className="mr-2 h-4 w-4" /> Добави емисия
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Период</TableHead>
                      <TableHead>Обхват</TableHead>
                      <TableHead>Категория</TableHead>
                      <TableHead>Локация</TableHead>
                      <TableHead className="text-right">Количество</TableHead>
                      <TableHead className="text-right">CO₂e (t)</TableHead>
                      <TableHead className="text-center">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(e => (
                      <TableRow key={e.id} className="group">
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            {formatPeriod(e.reporting_period)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={e.scope === 1 ? 'bg-earth-300' : 'bg-blue-500'}>
                            Обхват {e.scope}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-900">
                          {CATEGORY_LABELS[e.category] ?? e.category}
                        </TableCell>
                        <TableCell>
                          {e.location ? (
                            <span className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                              <MapPin className="h-3 w-3" /> {e.location}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium">
                          {e.activity_value.toLocaleString('bg-BG')} {e.unit}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-sm font-bold text-earth-400">
                            {e.calculated_co2e.toFixed(3)}
                          </span>
                          {e.factor_db_id ? (
                            <span
                              title={`${e.factor_source_name ?? 'DB'}${e.factor_source_year ? ` · ${e.factor_source_year}` : ''}`}
                              className="ml-1.5 inline-flex items-center text-green-600 opacity-70"
                            >
                              <Database className="h-3 w-3" />
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => { setSelectedEmission(e); setDetailsOpen(true); }}
                              className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                              title="Преглед"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openEdit(e)}
                              className="p-1.5 rounded hover:bg-earth-50 text-gray-500 hover:text-earth-500"
                              title="Редактирай"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteId(e.id)}
                              className="p-1.5 rounded hover:bg-red-50 text-gray-500 hover:text-red-500"
                              title="Изтрий"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Summary bar ── */}
        {filtered.length > 0 && (
          <Card className="border-earth-200 bg-earth-50">
            <CardContent className="pt-5">
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-earth-400 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-earth-900 mb-2">Обобщение</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div><p className="text-earth-700">Общо записи</p>
                      <p className="text-lg font-bold text-earth-900">{filtered.length}</p></div>
                    <div><p className="text-earth-700">Общо емисии</p>
                      <p className="text-lg font-bold text-earth-900">{total.toFixed(2)} tCO₂e</p></div>
                    <div><p className="text-earth-700">Средно на запис</p>
                      <p className="text-lg font-bold text-earth-900">{(total / filtered.length).toFixed(2)} tCO₂e</p></div>
                    <div><p className="text-earth-700">Последен период</p>
                      <p className="text-lg font-bold text-earth-900">{formatPeriod(filtered[0].reporting_period)}</p></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      </div>

      {/* ═══ DETAILS DIALOG ═══════════════════════════════════════════════════ */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedEmission && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-earth-400">
                  <Eye className="h-5 w-5" /> Детайли за емисия
                </DialogTitle>
                <DialogDescription>Пълна информация за въведения запис</DialogDescription>
              </DialogHeader>
              <div className="space-y-5 mt-3">
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold text-gray-900">Основна информация</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Отчетен период</p>
                      <p className="text-sm font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-earth-400" />
                        {formatPeriod(selectedEmission.reporting_period)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Обхват</p>
                      <Badge className={selectedEmission.scope === 1 ? 'bg-earth-300' : 'bg-blue-500'}>
                        Обхват {selectedEmission.scope}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Категория</p>
                    <p className="text-sm font-medium">{CATEGORY_LABELS[selectedEmission.category] ?? selectedEmission.category}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Количество</p>
                      <p className="text-sm font-medium">{selectedEmission.activity_value.toLocaleString('bg-BG')} {selectedEmission.unit}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Емисии CO₂e</p>
                      <p className="text-lg font-bold text-earth-400">{selectedEmission.calculated_co2e.toFixed(4)} tCO₂e</p>
                    </div>
                  </div>

                  {/* Factor audit badge */}
                  <div className="pt-2 mt-1">
                    {selectedEmission.factor_db_id ? (
                      <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200 font-medium">
                        <Database className="h-3 w-3" />
                        Фактор: {selectedEmission.factor_source_name ?? 'База данни'}
                        {selectedEmission.factor_source_year && ` · ${selectedEmission.factor_source_year}`}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200 font-medium">
                        <AlertCircle className="h-3 w-3" />
                        Стандартен фактор (стар запис)
                      </span>
                    )}
                  </div>
                </div>

                {(selectedEmission.location || selectedEmission.equipment_id ||
                  selectedEmission.supplier || selectedEmission.invoice_number ||
                  selectedEmission.responsible_person) && (
                  <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                    <h3 className="font-semibold text-gray-900">Детайлна информация</h3>
                    {selectedEmission.location && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-blue-600 mt-0.5" />
                        <div><p className="text-xs text-gray-500">Локация/Обект</p>
                          <p className="text-sm font-medium">{selectedEmission.location}</p></div>
                      </div>
                    )}
                    {selectedEmission.equipment_id && (
                      <div className="flex items-start gap-2">
                        <Truck className="h-4 w-4 text-blue-600 mt-0.5" />
                        <div><p className="text-xs text-gray-500">Оборудване/Превозно средство</p>
                          <p className="text-sm font-medium">{selectedEmission.equipment_id}</p></div>
                      </div>
                    )}
                    {selectedEmission.supplier && (
                      <div className="flex items-start gap-2">
                        <Building2 className="h-4 w-4 text-blue-600 mt-0.5" />
                        <div><p className="text-xs text-gray-500">Доставчик</p>
                          <p className="text-sm font-medium">{selectedEmission.supplier}</p></div>
                      </div>
                    )}
                    {selectedEmission.invoice_number && (
                      <div className="flex items-start gap-2">
                        <FileText className="h-4 w-4 text-blue-600 mt-0.5" />
                        <div><p className="text-xs text-gray-500">Номер на фактура</p>
                          <p className="text-sm font-medium">{selectedEmission.invoice_number}</p></div>
                      </div>
                    )}
                    {selectedEmission.responsible_person && (
                      <div className="flex items-start gap-2">
                        <User className="h-4 w-4 text-blue-600 mt-0.5" />
                        <div><p className="text-xs text-gray-500">Отговорно лице</p>
                          <p className="text-sm font-medium">{selectedEmission.responsible_person}</p></div>
                      </div>
                    )}
                  </div>
                )}

                {(selectedEmission.measurement_method || selectedEmission.data_quality) && (
                  <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Качество на данните</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedEmission.measurement_method && (
                        <div className="flex items-start gap-2">
                          <BarChart3 className="h-4 w-4 text-green-600 mt-0.5" />
                          <div><p className="text-xs text-gray-500">Метод на измерване</p>
                            <p className="text-sm font-medium">{METHOD_LABELS[selectedEmission.measurement_method] ?? selectedEmission.measurement_method}</p></div>
                        </div>
                      )}
                      {selectedEmission.data_quality && (
                        <div className="flex items-start gap-2">
                          <ShieldCheck className="h-4 w-4 text-green-600 mt-0.5" />
                          <div><p className="text-xs text-gray-500">Качество</p>
                            <Badge className={QUALITY_CFG[selectedEmission.data_quality]?.cls ?? 'bg-gray-400'}>
                              {QUALITY_CFG[selectedEmission.data_quality]?.label ?? selectedEmission.data_quality}
                            </Badge>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedEmission.cost != null && (
                  <div className="bg-amber-50 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <DollarSign className="h-4 w-4 text-amber-600 mt-0.5" />
                      <div><p className="text-xs text-gray-500 mb-1">Финансови разходи</p>
                        <p className="text-lg font-bold text-amber-800">
                          {selectedEmission.cost.toLocaleString('bg-BG', { minimumFractionDigits: 2 })} {selectedEmission.currency ?? 'BGN'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedEmission.notes && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Забележки</h3>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedEmission.notes}</p>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 border-t">
                  <p className="text-xs text-gray-400">Създадена: {new Date(selectedEmission.created_at).toLocaleString('bg-BG')}</p>
                  <Button variant="outline" size="sm" onClick={() => { setDetailsOpen(false); openEdit(selectedEmission); }}>
                    <Pencil className="h-3.5 w-3.5 mr-1.5" /> Редактирай
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══ EDIT DIALOG ══════════════════════════════════════════════════════ */}
      <Dialog open={editOpen} onOpenChange={open => { if (!saving) setEditOpen(open); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-earth-500">
              <Pencil className="h-4 w-4" /> Редактирай запис
            </DialogTitle>
            <DialogDescription>
              Промените ще преизчислят автоматично CO₂e стойността
            </DialogDescription>
          </DialogHeader>

          {editForm && (
            <div className="space-y-5 py-2">
              {/* Scope selector */}
              <div className="flex gap-2">
                {(['1', '2'] as const).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleScopeChange(s)}
                    disabled={saving}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      editForm.scope === s
                        ? 'bg-earth-100 border-earth-300 text-earth-700'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    Обхват {s} — {s === '1' ? 'Директни' : 'Индиректни'}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Category */}
                <div className="space-y-1.5 md:col-span-2">
                  <Label>Категория <span className="text-red-500">*</span></Label>
                  <Select value={editForm.category} onValueChange={handleCategoryChange} disabled={saving}>
                    <SelectTrigger><SelectValue placeholder="Изберете категория..." /></SelectTrigger>
                    <SelectContent>
                      {currentCats.map(c => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Activity value */}
                <div className="space-y-1.5">
                  <Label>Количество <span className="text-red-500">*</span></Label>
                  <Input
                    type="number" step="0.01" min="0"
                    value={editForm.activity_value}
                    onChange={e => setEditForm(f => f ? { ...f, activity_value: e.target.value } : f)}
                    disabled={saving}
                  />
                </div>

                {/* Unit (auto) */}
                <div className="space-y-1.5">
                  <Label>Единица</Label>
                  <Input value={editForm.unit} disabled className="bg-gray-50" />
                </div>

                {/* Reporting period */}
                <div className="space-y-1.5 md:col-span-2">
                  <Label>Отчетен период <span className="text-red-500">*</span></Label>
                  <MonthPicker
                    value={editForm.reporting_period}
                    onChange={v => setEditForm(f => f ? { ...f, reporting_period: v } : f)}
                    placeholder="Изберете период"
                  />
                </div>

                {/* Location */}
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-blue-500" /> Локация</Label>
                  {locations.length > 0 ? (
                    <Select
                      value={editForm.location_id || '__manual__'}
                      onValueChange={v => {
                        if (v === '__manual__') {
                          setEditForm(f => f ? { ...f, location_id: '', location: '' } : f);
                        } else {
                          const loc = locations.find(l => l.id === v);
                          setEditForm(f => f ? { ...f, location_id: v, location: loc?.location_name ?? '' } : f);
                        }
                      }}
                      disabled={saving}
                    >
                      <SelectTrigger><SelectValue placeholder="Изберете локация..." /></SelectTrigger>
                      <SelectContent>
                        {locations.map(l => (
                          <SelectItem key={l.id} value={l.id}>
                            {l.location_name}{l.city ? ` — ${l.city}` : ''}{l.is_primary ? ' ★' : ''}
                          </SelectItem>
                        ))}
                        <SelectItem value="__manual__">Въведи ръчно</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={editForm.location}
                      onChange={e => setEditForm(f => f ? { ...f, location: e.target.value } : f)}
                      placeholder="напр. Склад София..."
                      disabled={saving}
                    />
                  )}
                  {locations.length > 0 && !editForm.location_id && (
                    <Input
                      value={editForm.location}
                      onChange={e => setEditForm(f => f ? { ...f, location: e.target.value } : f)}
                      placeholder="напр. Склад София..."
                      disabled={saving}
                      className="mt-1"
                    />
                  )}
                </div>

                {/* Equipment */}
                <div className="space-y-1.5">
                  <Label>Оборудване/Превозно средство</Label>
                  <Input
                    value={editForm.equipment_id}
                    onChange={e => setEditForm(f => f ? { ...f, equipment_id: e.target.value } : f)}
                    placeholder="напр. СА 1234 АВ..."
                    disabled={saving}
                  />
                </div>

                {/* Supplier */}
                <div className="space-y-1.5">
                  <Label>Доставчик</Label>
                  <Input
                    value={editForm.supplier}
                    onChange={e => setEditForm(f => f ? { ...f, supplier: e.target.value } : f)}
                    placeholder="напр. ЧЕЗ, Булгаргаз..."
                    disabled={saving}
                  />
                </div>

                {/* Invoice */}
                <div className="space-y-1.5">
                  <Label>Номер на фактура</Label>
                  <Input
                    value={editForm.invoice_number}
                    onChange={e => setEditForm(f => f ? { ...f, invoice_number: e.target.value } : f)}
                    placeholder="напр. INV-2025-001"
                    disabled={saving}
                  />
                </div>

                {/* Responsible person */}
                <div className="space-y-1.5">
                  <Label>Отговорно лице</Label>
                  <Input
                    value={editForm.responsible_person}
                    onChange={e => setEditForm(f => f ? { ...f, responsible_person: e.target.value } : f)}
                    placeholder="напр. Иван Петров"
                    disabled={saving}
                  />
                </div>

                {/* Measurement method */}
                <div className="space-y-1.5">
                  <Label>Метод на измерване</Label>
                  <Select value={editForm.measurement_method} onValueChange={v => setEditForm(f => f ? { ...f, measurement_method: v } : f)} disabled={saving}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="measured">Измерено (от уреди/фактури)</SelectItem>
                      <SelectItem value="calculated">Изчислено (по формула)</SelectItem>
                      <SelectItem value="estimated">Оценено (приблизително)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Data quality */}
                <div className="space-y-1.5">
                  <Label>Качество на данните</Label>
                  <Select value={editForm.data_quality} onValueChange={v => setEditForm(f => f ? { ...f, data_quality: v } : f)} disabled={saving}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">Високо (първични данни)</SelectItem>
                      <SelectItem value="medium">Средно (вторични данни)</SelectItem>
                      <SelectItem value="low">Ниско (оценки)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Cost */}
                <div className="space-y-1.5">
                  <Label>Разходи</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number" step="0.01"
                      value={editForm.cost}
                      onChange={e => setEditForm(f => f ? { ...f, cost: e.target.value } : f)}
                      placeholder="Сума..."
                      disabled={saving}
                      className="flex-1"
                    />
                    <Select value={editForm.currency} onValueChange={v => setEditForm(f => f ? { ...f, currency: v } : f)} disabled={saving}>
                      <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BGN">BGN</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1.5 md:col-span-2">
                  <Label>Забележки</Label>
                  <Textarea
                    rows={2}
                    value={editForm.notes}
                    onChange={e => setEditForm(f => f ? { ...f, notes: e.target.value } : f)}
                    placeholder="Допълнителна информация..."
                    disabled={saving}
                    className="resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>
              <X className="h-4 w-4 mr-1" /> Отказ
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-earth-300 hover:bg-earth-400 gap-2">
              {saving
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Записва...</>
                : <><Check className="h-4 w-4" /> Запази промените</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ DELETE CONFIRM ═══════════════════════════════════════════════════ */}
      <Dialog open={!!deleteId} onOpenChange={open => { if (!open) setDeleteId(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <DialogTitle className="text-red-700">Изтрий запис?</DialogTitle>
            </div>
            <DialogDescription>
              Тази операция е необратима. Записът и свързаните изчисления ще бъдат изтрити окончателно.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Отказ</Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && handleDelete(deleteId)}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" /> Изтрий
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
