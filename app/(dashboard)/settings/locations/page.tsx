'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  MapPin, Plus, Pencil, Trash2, Star, StarOff, Building2,
  Warehouse, Factory, ShoppingBag, Server, MoreHorizontal,
  Users, Maximize, BarChart2, Loader2, Check, X, AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

// ── Types ──────────────────────────────────────────────────────────────────
type LocationType = 'office' | 'warehouse' | 'factory' | 'retail' | 'data_center' | 'other';

interface Location {
  id: string;
  location_name: string;
  address: string | null;
  city: string | null;
  country: string | null;
  location_type: LocationType | null;
  square_meters: number | null;
  employee_count: number | null;
  is_primary: boolean | null;
  is_active: boolean | null;
  notes: string | null;
  emission_record_count: number;
  created_at: string;
}

// ── Config ─────────────────────────────────────────────────────────────────
const LOCATION_TYPE_CONFIG: Record<LocationType, {
  label: string; icon: React.ReactNode; bg: string; text: string;
}> = {
  office:      { label: 'Офис',              icon: <Building2 className="h-4 w-4" />,   bg: 'bg-blue-50',   text: 'text-blue-700' },
  warehouse:   { label: 'Склад',             icon: <Warehouse className="h-4 w-4" />,   bg: 'bg-amber-50',  text: 'text-amber-700' },
  factory:     { label: 'Производствено',    icon: <Factory className="h-4 w-4" />,     bg: 'bg-orange-50', text: 'text-orange-700' },
  retail:      { label: 'Търговски обект',   icon: <ShoppingBag className="h-4 w-4" />, bg: 'bg-green-50',  text: 'text-green-700' },
  data_center: { label: 'Дата център',       icon: <Server className="h-4 w-4" />,      bg: 'bg-violet-50', text: 'text-violet-700' },
  other:       { label: 'Друго',             icon: <MoreHorizontal className="h-4 w-4" />, bg: 'bg-gray-100', text: 'text-gray-600' },
};

const EMPTY_FORM = {
  location_name: '',
  address: '',
  city: '',
  country: 'Bulgaria',
  location_type: 'office' as LocationType,
  square_meters: '',
  employee_count: '',
  is_primary: false,
  notes: '',
};

// ── Location card ──────────────────────────────────────────────────────────
function LocationCard({
  loc,
  onEdit,
  onSetPrimary,
  onDeactivate,
}: {
  loc: Location;
  onEdit: (l: Location) => void;
  onSetPrimary: (id: string) => void;
  onDeactivate: (id: string) => void;
}) {
  const type   = loc.location_type ?? 'other';
  const cfg    = LOCATION_TYPE_CONFIG[type] ?? LOCATION_TYPE_CONFIG.other;
  const isGone = !loc.is_active;

  return (
    <Card className={`border transition-shadow hover:shadow-md ${isGone ? 'opacity-50' : ''} ${loc.is_primary ? 'border-earth-300 ring-1 ring-earth-200' : 'border-gray-200'}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          {/* Icon + name */}
          <div className="flex items-start gap-3 min-w-0">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg} ${cfg.text}`}>
              {cfg.icon}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-gray-900 text-sm truncate">{loc.location_name}</h3>
                {loc.is_primary && (
                  <Badge className="text-xs bg-earth-100 text-earth-600 border-earth-200 hover:bg-earth-100">
                    <Star className="h-2.5 w-2.5 mr-1" /> Основна
                  </Badge>
                )}
                {isGone && (
                  <Badge variant="outline" className="text-xs text-gray-400 border-gray-200">Неактивна</Badge>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {[loc.address, loc.city, loc.country].filter(Boolean).join(', ') || 'Без адрес'}
              </p>
              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium mt-1.5 ${cfg.bg} ${cfg.text}`}>
                {cfg.icon} {cfg.label}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          {!isGone && (
            <div className="flex gap-1 shrink-0">
              <button
                onClick={() => onEdit(loc)}
                className="p-1.5 rounded-md text-gray-400 hover:text-earth-500 hover:bg-earth-50 transition-colors"
                title="Редактирай"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              {!loc.is_primary && (
                <button
                  onClick={() => onSetPrimary(loc.id)}
                  className="p-1.5 rounded-md text-gray-400 hover:text-amber-500 hover:bg-amber-50 transition-colors"
                  title="Направи основна"
                >
                  <StarOff className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                onClick={() => onDeactivate(loc.id)}
                className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Деактивирай"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100">
          <div className="text-center">
            <p className="text-base font-bold text-gray-800">{loc.emission_record_count}</p>
            <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
              <BarChart2 className="h-3 w-3" /> Записи
            </p>
          </div>
          <div className="text-center">
            <p className="text-base font-bold text-gray-800">
              {loc.employee_count ?? '—'}
            </p>
            <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
              <Users className="h-3 w-3" /> Служители
            </p>
          </div>
          <div className="text-center">
            <p className="text-base font-bold text-gray-800">
              {loc.square_meters ? `${loc.square_meters} м²` : '—'}
            </p>
            <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
              <Maximize className="h-3 w-3" /> Площ
            </p>
          </div>
        </div>

        {loc.notes && (
          <p className="text-xs text-gray-400 mt-3 italic border-t pt-3">{loc.notes}</p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function LocationsPage() {
  const [locations, setLocations]   = useState<Location[]>([]);
  const [loading, setLoading]       = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Location | null>(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const [deactivateId, setDeactivateId] = useState<string | null>(null);

  // ── Load ──────────────────────────────────────────────────────────────────
  const reload = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/locations');
    if (res.ok) {
      const json = await res.json();
      setLocations(json.data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  // ── Open dialog ───────────────────────────────────────────────────────────
  function openCreate() {
    setEditTarget(null);
    setForm({ ...EMPTY_FORM, is_primary: locations.length === 0 });
    setDialogOpen(true);
  }

  function openEdit(loc: Location) {
    setEditTarget(loc);
    setForm({
      location_name:  loc.location_name,
      address:        loc.address ?? '',
      city:           loc.city ?? '',
      country:        loc.country ?? 'Bulgaria',
      location_type:  loc.location_type ?? 'office',
      square_meters:  loc.square_meters != null ? String(loc.square_meters) : '',
      employee_count: loc.employee_count != null ? String(loc.employee_count) : '',
      is_primary:     loc.is_primary ?? false,
      notes:          loc.notes ?? '',
    });
    setDialogOpen(true);
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!form.location_name.trim()) { toast.error('Въведете име на локацията'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        square_meters:  form.square_meters  ? parseFloat(form.square_meters)  : null,
        employee_count: form.employee_count ? parseInt(form.employee_count)    : null,
        address:  form.address  || null,
        city:     form.city     || null,
        notes:    form.notes    || null,
      };

      const url    = editTarget ? `/api/locations/${editTarget.id}` : '/api/locations';
      const method = editTarget ? 'PATCH' : 'POST';
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success(editTarget ? 'Локацията е актуализирана' : 'Локацията е създадена');
      setDialogOpen(false);
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Грешка при запис');
    } finally {
      setSaving(false);
    }
  }

  // ── Set primary ───────────────────────────────────────────────────────────
  async function handleSetPrimary(id: string) {
    const res = await fetch(`/api/locations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_primary: true }),
    });
    if (res.ok) { toast.success('Основната локация е обновена'); reload(); }
    else { toast.error('Грешка при актуализиране'); }
  }

  // ── Deactivate ────────────────────────────────────────────────────────────
  async function handleDeactivate(id: string) {
    const res = await fetch(`/api/locations/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Локацията е деактивирана'); setDeactivateId(null); reload(); }
    else { toast.error('Грешка при деактивиране'); }
  }

  const activeLocs   = locations.filter(l => l.is_active !== false);
  const inactiveLocs = locations.filter(l => l.is_active === false);
  const totalEmRec   = locations.reduce((s, l) => s + l.emission_record_count, 0);
  const totalEmp     = activeLocs.reduce((s, l) => s + (l.employee_count ?? 0), 0);

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Локации</h1>
            </div>
            <p className="text-sm text-gray-500">
              Управлявайте обектите на вашата компания — офиси, складове, заводи
            </p>
          </div>
          <Button onClick={openCreate} className="bg-earth-300 hover:bg-earth-400 gap-2 shrink-0">
            <Plus className="h-4 w-4" /> Нова локация
          </Button>
        </div>

        {/* ── Summary stats ── */}
        {!loading && locations.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Активни локации', value: activeLocs.length, color: 'text-blue-700', bg: 'bg-blue-50' },
              { label: 'Записи за емисии', value: totalEmRec,        color: 'text-earth-600', bg: 'bg-earth-50' },
              { label: 'Общо служители',   value: totalEmp || '—',   color: 'text-purple-700', bg: 'bg-purple-50' },
            ].map(s => (
              <div key={s.label} className={`rounded-xl border p-4 text-center ${s.bg}`}>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Зарежда локациите...</span>
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && locations.length === 0 && (
          <Card className="border-dashed border-2 border-gray-200">
            <CardContent className="py-16 text-center">
              <div className="mx-auto h-14 w-14 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                <MapPin className="h-7 w-7 text-blue-400" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">Добавете първата си локация</h3>
              <p className="text-sm text-gray-500 mb-5 max-w-xs mx-auto">
                Всяка локация може да има собствени записи за емисии — идеално за компании с офиси в различни градове или сгради.
              </p>
              <Button onClick={openCreate} className="bg-earth-300 hover:bg-earth-400 gap-2">
                <Plus className="h-4 w-4" /> Добави локация
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ── Active locations grid ── */}
        {!loading && activeLocs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeLocs.map(loc => (
              <LocationCard
                key={loc.id}
                loc={loc}
                onEdit={openEdit}
                onSetPrimary={handleSetPrimary}
                onDeactivate={id => setDeactivateId(id)}
              />
            ))}
          </div>
        )}

        {/* ── Inactive locations ── */}
        {!loading && inactiveLocs.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Неактивни локации ({inactiveLocs.length})
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inactiveLocs.map(loc => (
                <LocationCard
                  key={loc.id}
                  loc={loc}
                  onEdit={openEdit}
                  onSetPrimary={handleSetPrimary}
                  onDeactivate={id => setDeactivateId(id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Info box ── */}
        {!loading && activeLocs.length > 0 && (
          <Card className="border-earth-100 bg-earth-50/50">
            <CardContent className="py-4 px-5">
              <p className="text-xs text-earth-700 leading-relaxed">
                <span className="font-semibold">💡 Съвет:</span> При въвеждане на данни за емисии изберете конкретна локация.
                Това позволява разграничаване на отпечатъка по обект — идеално за CSRD отчитане на мулти-сайт компании.
                Основната локация е предварително избрана в формата за въвеждане.
              </p>
            </CardContent>
          </Card>
        )}

      </div>

      {/* ── Create / Edit dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={open => { if (!saving) setDialogOpen(open); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-600" />
              {editTarget ? 'Редактирай локация' : 'Нова локация'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-sm font-medium">Наименование <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="напр. Офис София — Бизнес Парк"
                  value={form.location_name}
                  onChange={e => setForm(f => ({ ...f, location_name: e.target.value }))}
                  disabled={saving}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Тип локация</Label>
                <Select
                  value={form.location_type}
                  onValueChange={v => setForm(f => ({ ...f, location_type: v as LocationType }))}
                  disabled={saving}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(LOCATION_TYPE_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>
                        <span className="flex items-center gap-2">{cfg.icon} {cfg.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Град</Label>
                <Input
                  placeholder="напр. София, Пловдив..."
                  value={form.city}
                  onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                  disabled={saving}
                />
              </div>

              <div className="col-span-2 space-y-1.5">
                <Label className="text-sm font-medium">Адрес</Label>
                <Input
                  placeholder="напр. бул. България 102"
                  value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  disabled={saving}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Служители на локацията</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="напр. 25"
                  value={form.employee_count}
                  onChange={e => setForm(f => ({ ...f, employee_count: e.target.value }))}
                  disabled={saving}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Площ (м²)</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="напр. 450"
                  value={form.square_meters}
                  onChange={e => setForm(f => ({ ...f, square_meters: e.target.value }))}
                  disabled={saving}
                />
              </div>

              <div className="col-span-2 space-y-1.5">
                <Label className="text-sm font-medium">Бележки</Label>
                <Textarea
                  rows={2}
                  placeholder="Допълнителна информация..."
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  disabled={saving}
                  className="resize-none text-sm"
                />
              </div>

              <div className="col-span-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_primary"
                  checked={form.is_primary}
                  onChange={e => setForm(f => ({ ...f, is_primary: e.target.checked }))}
                  disabled={saving}
                  className="h-4 w-4 rounded border-gray-300 text-earth-400"
                />
                <Label htmlFor="is_primary" className="text-sm cursor-pointer">
                  Задай като основна локация
                  <span className="ml-1 text-xs text-gray-400">(предварително избрана при въвеждане)</span>
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              <X className="h-4 w-4 mr-1" /> Отказ
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-earth-300 hover:bg-earth-400 gap-2">
              {saving
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Записва...</>
                : <><Check className="h-4 w-4" /> {editTarget ? 'Запази' : 'Създай'}</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Deactivate confirmation ── */}
      <Dialog open={!!deactivateId} onOpenChange={open => { if (!open) setDeactivateId(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <DialogTitle className="text-red-700">Деактивирай локация</DialogTitle>
            </div>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Локацията ще бъде деактивирана. Всички записи за емисии, свързани с нея, ще бъдат запазени.
            Може да я реактивирате по-късно.
          </p>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeactivateId(null)}>Отказ</Button>
            <Button variant="destructive" onClick={() => deactivateId && handleDeactivate(deactivateId)} className="gap-2">
              <Trash2 className="h-4 w-4" /> Деактивирай
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
