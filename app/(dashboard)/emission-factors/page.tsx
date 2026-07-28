'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  BookOpen, Search, Download, Pencil, Check, X, Filter,
  FlaskConical, Zap, Flame, Wind, Package, Truck,
  Trash2, Plane, Users, RefreshCw, Info, ShieldCheck,
  ChevronUp, ChevronDown, ArrowUpDown, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

// ── Types ──────────────────────────────────────────────────────────────────
interface EmissionFactor {
  id: string;
  category: string;
  subcategory: string | null;
  region: string | null;
  value: number;
  unit: string;
  source: string | null;
  source_name: string | null;
  source_year: number | null;
  geography: string | null;
  scope: number | null;
  scope3_category: number | null;
  method_tier: string | null;
  factor_version: string | null;
  effective_date: string | null;
  valid_from: string | null;
  valid_to: string | null;
  is_active: boolean | null;
  updated_at: string | null;
  created_at: string;
}

// ── Display config ─────────────────────────────────────────────────────────
const CATEGORY_CONFIG: Record<string, {
  label: string; icon: React.ReactNode;
  bg: string; text: string; scopeDefault: number;
}> = {
  fuel: {
    label: 'Горива',
    icon: <Flame className="h-3.5 w-3.5" />,
    bg: 'bg-orange-100', text: 'text-orange-700', scopeDefault: 1,
  },
  refrigerant: {
    label: 'Хладилни агенти',
    icon: <Wind className="h-3.5 w-3.5" />,
    bg: 'bg-cyan-100', text: 'text-cyan-700', scopeDefault: 1,
  },
  electricity: {
    label: 'Електроенергия',
    icon: <Zap className="h-3.5 w-3.5" />,
    bg: 'bg-yellow-100', text: 'text-yellow-700', scopeDefault: 2,
  },
  heating: {
    label: 'Отопление/Охлаждане',
    icon: <Zap className="h-3.5 w-3.5" />,
    bg: 'bg-blue-100', text: 'text-blue-700', scopeDefault: 2,
  },
  purchased_goods: {
    label: 'Закупени стоки/услуги',
    icon: <Package className="h-3.5 w-3.5" />,
    bg: 'bg-violet-100', text: 'text-violet-700', scopeDefault: 3,
  },
  upstream_transport: {
    label: 'Транспорт нагоре',
    icon: <Truck className="h-3.5 w-3.5" />,
    bg: 'bg-indigo-100', text: 'text-indigo-700', scopeDefault: 3,
  },
  waste: {
    label: 'Отпадъци',
    icon: <Trash2 className="h-3.5 w-3.5" />,
    bg: 'bg-gray-200', text: 'text-gray-700', scopeDefault: 3,
  },
  business_travel: {
    label: 'Командировки',
    icon: <Plane className="h-3.5 w-3.5" />,
    bg: 'bg-purple-100', text: 'text-purple-700', scopeDefault: 3,
  },
  commuting: {
    label: 'Пътувания служители',
    icon: <Users className="h-3.5 w-3.5" />,
    bg: 'bg-pink-100', text: 'text-pink-700', scopeDefault: 3,
  },
};

const SUBCATEGORY_LABELS: Record<string, string> = {
  petrol: 'Бензин', diesel: 'Дизел', natural_gas: 'Природен газ',
  lpg: 'ГПГ', coal: 'Въглища',
  grid_standard: 'Стандартна мрежа', renewable: 'ВЕИ',
  district_heating: 'Централно отопление', district_cooling: 'Централно охлаждане',
  'R-410A': 'R-410A', 'R-32': 'R-32', 'R-134a': 'R-134a', 'R-404A': 'R-404A',
  road_freight: 'Автомобилен товарен', rail_freight: 'Ж.п. товарен',
  sea_freight: 'Морски товарен', air_freight: 'Въздушен товарен',
  general_waste_landfill: 'Депо — смесени',
  general_waste_incineration: 'Изгаряне — смесени',
  recycling_mixed: 'Рециклиране', organic_composting: 'Компостиране',
  hazardous_waste: 'Опасни отпадъци',
  flight_short_economy: 'Кратък полет — Икономична',
  flight_short_business: 'Кратък полет — Бизнес',
  flight_medium_economy: 'Среден полет — Икономична',
  flight_medium_business: 'Среден полет — Бизнес',
  flight_long_economy: 'Дълъг полет — Икономична',
  flight_long_premium_economy: 'Дълъг полет — Премиум Икономична',
  flight_long_business: 'Дълъг полет — Бизнес',
  flight_long_first: 'Дълъг полет — Първа класа',
  train_national: 'Влак — вътрешен', train_international: 'Влак — международен',
  hotel_night_bulgaria: 'Хотел — България',
  hotel_night_eu: 'Хотел — ЕС', hotel_night_global: 'Хотел — Глобален',
  car_rental_petrol: 'Нает авт. — Бензин', car_rental_diesel: 'Нает авт. — Дизел',
  car_rental_hybrid: 'Нает авт. — Хибрид', car_rental_electric: 'Нает авт. — Ел.',
  taxi_petrol: 'Такси — Бензин', taxi_diesel: 'Такси — Дизел',
  car_petrol_small: 'Авт. бензин — малък', car_petrol_medium: 'Авт. бензин — среден',
  car_petrol_large: 'Авт. бензин — голям', car_diesel_small: 'Авт. дизел — малък',
  car_diesel_medium: 'Авт. дизел — среден', car_hybrid: 'Авт. хибрид',
  car_electric: 'Авт. електрически', car_average: 'Авт. средно',
  metro_sofia: 'Метро — София', bus_sofia: 'Автобус — София',
  tram_sofia: 'Трамвай — София', trolleybus_sofia: 'Тролей — София',
  bus_bulgaria: 'Автобус — БГ', train_bulgaria: 'Влак — БГ',
  motorcycle: 'Мотоциклет', bicycle: 'Велосипед',
  walking: 'Пешком', remote_work: 'Работа от вкъщи',
};

const SOURCE_BADGES: Record<string, { bg: string; text: string }> = {
  'EU ETS':                    { bg: 'bg-blue-100',   text: 'text-blue-700' },
  'Bulgarian Energy Authority':{ bg: 'bg-green-100',  text: 'text-green-700' },
  'IPCC AR5':                  { bg: 'bg-red-100',    text: 'text-red-700' },
  'DEFRA':                     { bg: 'bg-purple-100', text: 'text-purple-700' },
  'DEFRA 2024':                { bg: 'bg-purple-100', text: 'text-purple-700' },
  'EXIOBASE':                  { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  'EXIOBASE v3':               { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  'Sofia Metro':               { bg: 'bg-teal-100',   text: 'text-teal-700' },
  'Sofia Transport':           { bg: 'bg-teal-100',   text: 'text-teal-700' },
  'N/A':                       { bg: 'bg-gray-100',   text: 'text-gray-500' },
};

const METHOD_TIER: Record<string, { label: string; bg: string; text: string }> = {
  A: { label: 'A — Измерен',    bg: 'bg-green-100',  text: 'text-green-700' },
  B: { label: 'B — Активност',  bg: 'bg-blue-100',   text: 'text-blue-700' },
  C: { label: 'C — Разходен',   bg: 'bg-amber-100',  text: 'text-amber-700' },
  D: { label: 'D — Нормативен', bg: 'bg-gray-100',   text: 'text-gray-600' },
};

const SCOPE3_LABELS: Record<number, string> = {
  1: 'Кат.1 — Закупени стоки', 4: 'Кат.4 — Транспорт',
  5: 'Кат.5 — Отпадъци', 6: 'Кат.6 — Командировки',
  7: 'Кат.7 — Пътувания',
};

const SCOPE_COLORS: Record<number, { bg: string; text: string; ring: string }> = {
  1: { bg: 'bg-green-100',  text: 'text-green-700',  ring: 'ring-green-300' },
  2: { bg: 'bg-blue-100',   text: 'text-blue-700',   ring: 'ring-blue-300' },
  3: { bg: 'bg-orange-100', text: 'text-orange-700', ring: 'ring-orange-300' },
};

// ── Helpers ────────────────────────────────────────────────────────────────
function formatValue(v: number, unit: string) {
  if (unit === 'GWP factor') return v.toLocaleString('bg-BG');
  if (v === 0) return '0';
  if (v < 0.01) return v.toFixed(4);
  if (v < 1) return v.toFixed(3);
  return v.toFixed(2);
}

function getSourceKey(f: EmissionFactor) {
  return f.source_name ?? f.source ?? '';
}

function getCategoryConfig(cat: string) {
  return CATEGORY_CONFIG[cat] ?? {
    label: cat, icon: <FlaskConical className="h-3.5 w-3.5" />,
    bg: 'bg-gray-100', text: 'text-gray-600', scopeDefault: 1,
  };
}

type SortKey = 'category' | 'subcategory' | 'value' | 'source' | 'scope';
type SortDir = 'asc' | 'desc';

// ── Main page ──────────────────────────────────────────────────────────────
export default function EmissionFactorsPage() {
  const supabaseClient = createClient();

  const [factors, setFactors]     = useState<EmissionFactor[]>([]);
  const [loading, setLoading]     = useState(true);
  const [isAdmin, setIsAdmin]     = useState(false);

  // Filters
  const [scopeTab,   setScopeTab]   = useState<'all' | '1' | '2' | '3'>('all');
  const [search,     setSearch]     = useState('');
  const [catFilter,  setCatFilter]  = useState('all');
  const [srcFilter,  setSrcFilter]  = useState('all');
  const [showActive, setShowActive] = useState<'all' | 'active' | 'inactive'>('active');

  // Sort
  const [sortKey, setSortKey] = useState<SortKey>('category');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // Edit dialog
  const [editFactor, setEditFactor] = useState<EmissionFactor | null>(null);
  const [editValue,  setEditValue]  = useState('');
  const [editUnit,   setEditUnit]   = useState('');
  const [editSrc,    setEditSrc]    = useState('');
  const [saving,     setSaving]     = useState(false);

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      // Check admin
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (user) {
        const { data: ud } = await supabaseClient.from('users')
          .select('role').eq('id', user.id).single();
        setIsAdmin(ud?.role === 'admin');
      }
      // Fetch all (client-side filtering)
      const res = await fetch('/api/emission-factors');
      if (res.ok) {
        const json = await res.json();
        setFactors(json.data ?? []);
      }
      setLoading(false);
    }
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived filter options ────────────────────────────────────────────────
  const categories = useMemo(
    () => [...new Set(factors.map(f => f.category))].sort(),
    [factors],
  );
  const sources = useMemo(
    () => [...new Set(factors.map(f => getSourceKey(f)).filter(Boolean))].sort(),
    [factors],
  );

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total: factors.length,
    s1: factors.filter(f => f.scope === 1).length,
    s2: factors.filter(f => f.scope === 2).length,
    s3: factors.filter(f => f.scope === 3).length,
    active: factors.filter(f => f.is_active !== false).length,
  }), [factors]);

  // ── Filtered + sorted ─────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...factors];

    if (scopeTab !== 'all') list = list.filter(f => f.scope === parseInt(scopeTab));
    if (catFilter !== 'all') list = list.filter(f => f.category === catFilter);
    if (srcFilter !== 'all') list = list.filter(f => getSourceKey(f) === srcFilter);
    if (showActive === 'active')   list = list.filter(f => f.is_active !== false);
    if (showActive === 'inactive') list = list.filter(f => f.is_active === false);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(f =>
        (f.subcategory ?? '').toLowerCase().includes(q) ||
        (f.category ?? '').toLowerCase().includes(q) ||
        (SUBCATEGORY_LABELS[f.subcategory ?? ''] ?? '').toLowerCase().includes(q) ||
        (getCategoryConfig(f.category).label).toLowerCase().includes(q) ||
        String(f.value).includes(q) ||
        (f.source ?? '').toLowerCase().includes(q),
      );
    }

    // Sort
    list.sort((a, b) => {
      let av: string | number = '';
      let bv: string | number = '';
      if (sortKey === 'category')    { av = a.category;    bv = b.category; }
      if (sortKey === 'subcategory') { av = a.subcategory ?? ''; bv = b.subcategory ?? ''; }
      if (sortKey === 'value')       { av = a.value;        bv = b.value; }
      if (sortKey === 'source')      { av = getSourceKey(a); bv = getSourceKey(b); }
      if (sortKey === 'scope')       { av = a.scope ?? 0;   bv = b.scope ?? 0; }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [factors, scopeTab, catFilter, srcFilter, showActive, search, sortKey, sortDir]);

  // ── Sort toggle ───────────────────────────────────────────────────────────
  const toggleSort = useCallback((key: SortKey) => {
    setSortKey(prev => {
      if (prev === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
      else { setSortDir('asc'); }
      return key;
    });
  }, []);

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ArrowUpDown className="h-3 w-3 opacity-30 ml-1 inline" />;
    return sortDir === 'asc'
      ? <ChevronUp   className="h-3 w-3 ml-1 inline" />
      : <ChevronDown className="h-3 w-3 ml-1 inline" />;
  }

  // ── CSV export ────────────────────────────────────────────────────────────
  function handleExportCSV() {
    const headers = ['ID','Категория','Подкатегория','Обхват','Обхват3 Кат.','Стойност','Единица','Метод','Регион','Изт. год.','Версия','Активен'];
    const rows = filtered.map(f => [
      f.id,
      getCategoryConfig(f.category).label,
      SUBCATEGORY_LABELS[f.subcategory ?? ''] ?? f.subcategory ?? '',
      f.scope ?? '',
      f.scope3_category ?? '',
      f.value,
      f.unit,
      f.method_tier ?? '',
      f.source ?? f.source_name ?? '',
      f.source_year ?? '',
      f.factor_version ?? '',
      f.is_active !== false ? 'Да' : 'Не',
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));

    const csv = [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `emission_factors_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV изтеглен успешно');
  }

  // ── Admin save ────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!editFactor) return;
    const val = parseFloat(editValue);
    if (isNaN(val) || val < 0) { toast.error('Невалидна стойност'); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/emission-factors/${editFactor.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: val, unit: editUnit, source: editSrc }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setFactors(prev => prev.map(f => f.id === editFactor.id
        ? { ...f, value: val, unit: editUnit, source: editSrc, updated_at: json.data?.updated_at ?? f.updated_at }
        : f,
      ));
      toast.success('Факторът е актуализиран');
      setEditFactor(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Грешка при запис');
    } finally {
      setSaving(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  const scopeTabs = [
    { key: 'all', label: 'Всички', count: stats.total },
    { key: '1',   label: 'Обхват 1', count: stats.s1 },
    { key: '2',   label: 'Обхват 2', count: stats.s2 },
    { key: '3',   label: 'Обхват 3', count: stats.s3 },
  ] as const;

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-10 w-10 rounded-xl bg-earth-50 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-earth-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Библиотека с емисионни фактори</h1>
            </div>
            <p className="text-sm text-gray-500 ml-13">
              Всички фактори, използвани за изчисляване на CO₂e · GHG Protocol · DEFRA 2024 · EXIOBASE v3
            </p>
          </div>
          <Button
            variant="outline"
            className="gap-2 shrink-0"
            onClick={handleExportCSV}
            disabled={loading}
          >
            <Download className="h-4 w-4" /> Изтегли CSV
          </Button>
        </div>

        {/* ── Stats cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Общо фактори', value: stats.total, color: 'text-gray-800', bg: 'bg-gray-50' },
            { label: 'Обхват 1',     value: stats.s1,    color: 'text-green-700', bg: 'bg-green-50' },
            { label: 'Обхват 2',     value: stats.s2,    color: 'text-blue-700',  bg: 'bg-blue-50' },
            { label: 'Обхват 3',     value: stats.s3,    color: 'text-orange-700',bg: 'bg-orange-50' },
            { label: 'Активни',      value: stats.active, color: 'text-emerald-700', bg: 'bg-emerald-50' },
          ].map(s => (
            <div key={s.label} className={`rounded-xl border p-4 text-center ${s.bg}`}>
              <p className={`text-2xl font-bold ${s.color}`}>{loading ? '—' : s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Scope tabs ── */}
        <div className="flex gap-1 border-b pb-0">
          {scopeTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setScopeTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg border transition-colors ${
                scopeTab === tab.key
                  ? 'bg-white border-b-white text-earth-500 border-gray-200 -mb-px'
                  : 'text-gray-500 hover:text-gray-700 border-transparent'
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                scopeTab === tab.key ? 'bg-earth-100 text-earth-600' : 'bg-gray-100 text-gray-500'
              }`}>
                {loading ? '…' : tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* ── Filters row ── */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-48">
                <Label className="text-xs text-gray-500 mb-1 block">Търсене</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="напр. дизел, бензин, хотел..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-8 text-sm"
                  />
                </div>
              </div>

              <div className="min-w-44">
                <Label className="text-xs text-gray-500 mb-1 block">Категория</Label>
                <Select value={catFilter} onValueChange={setCatFilter}>
                  <SelectTrigger className="text-sm">
                    <Filter className="h-3.5 w-3.5 mr-1 text-gray-400" />
                    <SelectValue placeholder="Всички категории" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Всички категории</SelectItem>
                    {categories.map(c => (
                      <SelectItem key={c} value={c}>
                        {getCategoryConfig(c).label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-44">
                <Label className="text-xs text-gray-500 mb-1 block">Източник</Label>
                <Select value={srcFilter} onValueChange={setSrcFilter}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Всички източници" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Всички източници</SelectItem>
                    {sources.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-36">
                <Label className="text-xs text-gray-500 mb-1 block">Статус</Label>
                <Select value={showActive} onValueChange={v => setShowActive(v as typeof showActive)}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Активни</SelectItem>
                    <SelectItem value="all">Всички</SelectItem>
                    <SelectItem value="inactive">Неактивни</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(search || catFilter !== 'all' || srcFilter !== 'all' || showActive !== 'active') && (
                <Button
                  variant="ghost" size="sm"
                  className="text-gray-400 gap-1"
                  onClick={() => { setSearch(''); setCatFilter('all'); setSrcFilter('all'); setShowActive('active'); }}
                >
                  <X className="h-3.5 w-3.5" /> Изчисти
                </Button>
              )}

              <div className="ml-auto text-xs text-gray-400 self-end pb-1">
                {loading ? (
                  <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Зарежда...</span>
                ) : (
                  `${filtered.length} резултата`
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Methodology note ── */}
        <div className="flex items-start gap-2 rounded-lg bg-earth-50 border border-earth-100 px-4 py-3">
          <Info className="h-4 w-4 text-earth-400 mt-0.5 shrink-0" />
          <p className="text-xs text-earth-700 leading-relaxed">
            <span className="font-semibold">Методология:</span> Обхват 1&2 използват специфични национални фактори (EU ETS, АЕЕ България).
            Обхват 3 използва spend-based EEIO фактори (EXIOBASE v3) и activity-based фактори (DEFRA 2024) в зависимост от метода.
            GWP = 100-год. потенциал за глобално затопляне по IPCC AR5.
            {isAdmin && <span className="ml-2 font-semibold text-amber-700">⚙️ Admin: можете да редактирате стойностите директно.</span>}
          </p>
        </div>

        {/* ── Table ── */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-earth-400" />
              Фактори за изчисляване
            </CardTitle>
            <span className="text-xs text-gray-400">
              Последна актуализация: DEFRA 2024 · EXIOBASE 2023
            </span>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Зарежда библиотеката...</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <BookOpen className="mx-auto h-10 w-10 text-gray-200 mb-3" />
                <p className="text-sm text-gray-400">Няма фактори, отговарящи на филтрите</p>
                <Button variant="ghost" size="sm" className="mt-2 text-earth-400"
                  onClick={() => { setSearch(''); setCatFilter('all'); setSrcFilter('all'); setScopeTab('all'); }}>
                  <RefreshCw className="h-3.5 w-3.5 mr-1" /> Изчисти филтрите
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide whitespace-nowrap cursor-pointer hover:text-earth-500"
                          onClick={() => toggleSort('category')}>
                        Категория <SortIcon col="category" />
                      </th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide whitespace-nowrap cursor-pointer hover:text-earth-500"
                          onClick={() => toggleSort('subcategory')}>
                        Подкатегория <SortIcon col="subcategory" />
                      </th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide whitespace-nowrap cursor-pointer hover:text-earth-500"
                          onClick={() => toggleSort('scope')}>
                        Обхват <SortIcon col="scope" />
                      </th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide whitespace-nowrap cursor-pointer hover:text-earth-500"
                          onClick={() => toggleSort('value')}>
                        Стойност <SortIcon col="value" />
                      </th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">
                        Единица
                      </th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">
                        Метод
                      </th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide cursor-pointer hover:text-earth-500"
                          onClick={() => toggleSort('source')}>
                        Източник <SortIcon col="source" />
                      </th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">
                        Регион
                      </th>
                      {isAdmin && (
                        <th className="text-center px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">
                          Редактирай
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map(factor => {
                      const cat      = getCategoryConfig(factor.category);
                      const srcKey   = getSourceKey(factor);
                      const srcBadge = SOURCE_BADGES[srcKey] ?? { bg: 'bg-gray-100', text: 'text-gray-600' };
                      const scopeC   = SCOPE_COLORS[factor.scope ?? 0] ?? { bg: 'bg-gray-100', text: 'text-gray-500', ring: '' };
                      const tierC    = factor.method_tier ? METHOD_TIER[factor.method_tier] : null;
                      const isInactive = factor.is_active === false;

                      return (
                        <tr
                          key={factor.id}
                          className={`transition-colors hover:bg-gray-50 ${isInactive ? 'opacity-50' : ''}`}
                        >
                          {/* Category */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md font-medium ${cat.bg} ${cat.text}`}>
                              {cat.icon}
                              {cat.label}
                            </span>
                          </td>

                          {/* Subcategory */}
                          <td className="px-4 py-3">
                            <span className="font-medium text-gray-700">
                              {SUBCATEGORY_LABELS[factor.subcategory ?? ''] ?? factor.subcategory ?? '—'}
                            </span>
                            {factor.scope3_category && (
                              <p className="text-xs text-gray-400 mt-0.5">
                                {SCOPE3_LABELS[factor.scope3_category] ?? `Кат.${factor.scope3_category}`}
                              </p>
                            )}
                          </td>

                          {/* Scope */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            {factor.scope ? (
                              <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-semibold ${scopeC.bg} ${scopeC.text}`}>
                                S{factor.scope}
                              </span>
                            ) : '—'}
                          </td>

                          {/* Value */}
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <span className="font-bold text-gray-800 tabular-nums">
                              {formatValue(factor.value, factor.unit)}
                            </span>
                          </td>

                          {/* Unit */}
                          <td className="px-4 py-3 text-xs text-gray-500 max-w-[160px]">
                            <span className="font-mono">{factor.unit}</span>
                          </td>

                          {/* Method */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            {tierC ? (
                              <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${tierC.bg} ${tierC.text}`}>
                                {tierC.label}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-300">—</span>
                            )}
                          </td>

                          {/* Source */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex flex-col gap-0.5">
                              <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${srcBadge.bg} ${srcBadge.text}`}>
                                {srcKey || '—'}
                              </span>
                              {factor.source_year && (
                                <span className="text-xs text-gray-400">{factor.source_year}</span>
                              )}
                            </div>
                          </td>

                          {/* Region */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-xs text-gray-500">
                              {factor.geography ?? factor.region ?? '—'}
                            </span>
                          </td>

                          {/* Edit (admin) */}
                          {isAdmin && (
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => {
                                  setEditFactor(factor);
                                  setEditValue(String(factor.value));
                                  setEditUnit(factor.unit);
                                  setEditSrc(factor.source ?? '');
                                }}
                                className="p-1.5 rounded-md hover:bg-amber-50 hover:text-amber-600 text-gray-300 transition-colors"
                                title="Редактирай"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Source legend ── */}
        <Card className="border-gray-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Легенда — източници и методи</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs text-gray-600">
              <div className="space-y-1.5">
                <p className="font-semibold text-gray-700">Официални източници</p>
                {[
                  { src: 'EU ETS',  desc: 'EU Emissions Trading System — горива Обхват 1' },
                  { src: 'Bulgarian Energy Authority', desc: 'АЕЕ — ток и топлоенергия (Обхват 2)' },
                  { src: 'IPCC AR5', desc: 'IPCC 5-ти отчет — GWP на хладилни агенти' },
                ].map(r => (
                  <div key={r.src} className="flex items-start gap-2">
                    <span className={`shrink-0 px-1.5 py-0.5 rounded-full font-medium text-xs ${SOURCE_BADGES[r.src]?.bg} ${SOURCE_BADGES[r.src]?.text}`}>{r.src}</span>
                    <span className="text-gray-500">{r.desc}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-1.5">
                <p className="font-semibold text-gray-700">Обхват 3 източници</p>
                {[
                  { src: 'DEFRA 2024', desc: 'UK Department for Environment — Обхват 3 activity-based' },
                  { src: 'EXIOBASE',   desc: 'EXIOBASE v3 — EEIO spend-based фактори за ЕС' },
                ].map(r => (
                  <div key={r.src} className="flex items-start gap-2">
                    <span className={`shrink-0 px-1.5 py-0.5 rounded-full font-medium text-xs ${SOURCE_BADGES[r.src]?.bg ?? 'bg-gray-100'} ${SOURCE_BADGES[r.src]?.text ?? 'text-gray-600'}`}>{r.src}</span>
                    <span className="text-gray-500">{r.desc}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-1.5">
                <p className="font-semibold text-gray-700">Нива на метода (GHG Protocol)</p>
                {Object.entries(METHOD_TIER).map(([key, tier]) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className={`shrink-0 px-1.5 py-0.5 rounded-full font-medium text-xs ${tier.bg} ${tier.text}`}>{tier.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* ── Admin edit dialog ── */}
      <Dialog open={!!editFactor} onOpenChange={open => { if (!open && !saving) setEditFactor(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-4 w-4 text-amber-500" />
              Редактирай фактор
            </DialogTitle>
          </DialogHeader>

          {editFactor && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg bg-gray-50 border px-4 py-3 text-sm space-y-0.5">
                <p className="font-semibold text-gray-800">
                  {getCategoryConfig(editFactor.category).label}
                  {editFactor.subcategory && ` — ${SUBCATEGORY_LABELS[editFactor.subcategory] ?? editFactor.subcategory}`}
                </p>
                <p className="text-xs text-gray-400">ID: {editFactor.id}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Стойност *</Label>
                  <Input
                    type="number"
                    step="any"
                    min="0"
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    className="font-mono"
                    disabled={saving}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Единица *</Label>
                  <Input
                    value={editUnit}
                    onChange={e => setEditUnit(e.target.value)}
                    className="font-mono text-sm"
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Референтен документ</Label>
                <Input
                  placeholder="напр. DEFRA 2025, EU ETS..."
                  value={editSrc}
                  onChange={e => setEditSrc(e.target.value)}
                  disabled={saving}
                />
              </div>

              <div className="rounded-lg bg-amber-50 border border-amber-100 px-3 py-2 text-xs text-amber-700">
                Промяната засяга всички бъдещи изчисления.
                Предишните записи запазват стойността, с която са изчислени.
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditFactor(null)} disabled={saving}>
              <X className="h-4 w-4 mr-1" /> Отказ
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-amber-500 hover:bg-amber-600 text-white gap-2">
              {saving
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Записва...</>
                : <><Check className="h-4 w-4" /> Запази</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
