'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import {
  BookOpen, HelpCircle,
  FileText, ShieldCheck, Download, Loader2, Save,
  HeartPulse, Scale,
} from 'lucide-react';
import { VsmeGuidancePanel } from '@/components/guidance/VsmeGuidancePanel';
import { GuidanceHint, LabelWithGuidance } from '@/components/guidance/GuidanceHint';
import { VsmeDisclosureRow } from '@/components/vsme/VsmeDisclosureRow';
import type { GuidanceKey } from '@/lib/i18n/regulatory-guidance';
import { toast } from 'sonner';

type VsmeStatus = 'complete' | 'partial' | 'missing' | 'na';

interface DisclosureRow {
  id: string;
  categoryBg: string;
  titleBg: string;
  hintBg: string;
  status: VsmeStatus;
  note: string;
  actionHref: string;
  actionLabel: string;
  guidanceKey: GuidanceKey;
  manual: boolean;
}

interface ManualForm {
  health_safety_has_policy: boolean | null;
  health_safety_description: string;
  health_safety_incidents: string;
  health_safety_responsible_person: string;
  health_safety_training_frequency: string;
  anti_corruption_has_policy: boolean | null;
  anti_corruption_description: string;
  anti_corruption_whistleblower: boolean | null;
}

interface ReadinessResponse {
  companyName: string;
  standardVersion: string;
  reportingYear: number;
  readinessScore: number;
  complete: number;
  partial: number;
  missing: number;
  suggestedRoute: string;
  disclosures: DisclosureRow[];
  manual: ManualForm | null;
}

const CATEGORY_ORDER = ['Климат и енергия', 'Компания', 'Хора и локации', 'Управление'];

function TriStateSelect({
  value, onChange, id,
}: {
  value: boolean | null;
  onChange: (v: boolean | null) => void;
  id: string;
}) {
  return (
    <Select
      value={value === true ? 'yes' : value === false ? 'no' : 'unknown'}
      onValueChange={v => onChange(v === 'yes' ? true : v === 'no' ? false : null)}
    >
      <SelectTrigger id={id} className="max-w-xs">
        <SelectValue placeholder="Изберете..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="unknown">Не е попълнено</SelectItem>
        <SelectItem value="yes">Да</SelectItem>
        <SelectItem value="no">Не</SelectItem>
      </SelectContent>
    </Select>
  );
}

const EMPTY_MANUAL: ManualForm = {
  health_safety_has_policy: null,
  health_safety_description: '',
  health_safety_incidents: '',
  health_safety_responsible_person: '',
  health_safety_training_frequency: '',
  anti_corruption_has_policy: null,
  anti_corruption_description: '',
  anti_corruption_whistleblower: null,
};

export default function VsmeReadinessPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(String(currentYear));
  const [data, setData] = useState<ReadinessResponse | null>(null);
  const [manual, setManual] = useState<ManualForm>(EMPTY_MANUAL);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [readinessRes, manualRes] = await Promise.all([
        fetch(`/api/vsme/readiness?year=${year}`),
        fetch(`/api/vsme/manual?year=${year}`),
      ]);

      if (readinessRes.ok) {
        const json = await readinessRes.json();
        setData(json.data ?? null);
      }

      if (manualRes.ok) {
        const json = await manualRes.json();
        const m = json.data;
        setManual(m ? {
          health_safety_has_policy: m.health_safety_has_policy,
          health_safety_description: m.health_safety_description ?? '',
          health_safety_incidents: m.health_safety_incidents != null ? String(m.health_safety_incidents) : '',
          health_safety_responsible_person: m.health_safety_responsible_person ?? '',
          health_safety_training_frequency: m.health_safety_training_frequency ?? '',
          anti_corruption_has_policy: m.anti_corruption_has_policy,
          anti_corruption_description: m.anti_corruption_description ?? '',
          anti_corruption_whistleblower: m.anti_corruption_whistleblower ?? null,
        } : { ...EMPTY_MANUAL });
      }
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => { load(); }, [load]);

  const saveManual = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/vsme/manual', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reporting_year: parseInt(year),
          health_safety_has_policy: manual.health_safety_has_policy,
          health_safety_description: manual.health_safety_description || null,
          health_safety_incidents: manual.health_safety_incidents ? parseInt(manual.health_safety_incidents) : null,
          health_safety_responsible_person: manual.health_safety_responsible_person || null,
          health_safety_training_frequency: manual.health_safety_training_frequency || null,
          anti_corruption_has_policy: manual.anti_corruption_has_policy,
          anti_corruption_description: manual.anti_corruption_description || null,
          anti_corruption_whistleblower: manual.anti_corruption_whistleblower,
        }),
      });
      if (!res.ok) throw new Error('save failed');
      toast.success('Данните са запазени');
      load();
    } catch {
      toast.error('Грешка при запазване');
    } finally {
      setSaving(false);
    }
  };

  const exportPdf = async () => {
    setExportingPdf(true);
    try {
      const res = await fetch('/api/reports/vsme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportingYear: parseInt(year) }),
      });
      if (!res.ok) throw new Error('pdf failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `VSME-${year}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF отчетът е изтеглен');
    } catch {
      toast.error('Грешка при генериране на PDF');
    } finally {
      setExportingPdf(false);
    }
  };

  if (loading && !data) return <PageSkeleton />;

  const grouped = CATEGORY_ORDER.map(cat => ({
    category: cat,
    items: (data?.disclosures ?? []).filter(d => d.categoryBg === cat),
  })).filter(g => g.items.length > 0);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-earth-400 flex items-center gap-2">
            <BookOpen className="h-7 w-7" />
            VSME готовност
            <GuidanceHint guidanceKey="vsme" />
          </h1>
          <p className="text-gray-500 mt-1 text-sm max-w-xl">
            Проверка колко от доброволните изисквания за МСП вече покривате с данните в платформата.
            Не е задължителен отчет — помага при банки, клиенти и подготовка за CSRD.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[currentYear, currentYear - 1, currentYear - 2].map(y => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" asChild>
            <a href={`/api/vsme/export?year=${year}`} download>
              <Download className="h-4 w-4 mr-1" /> JSON
            </a>
          </Button>
          <Button size="sm" className="bg-indigo-700 hover:bg-indigo-800" onClick={exportPdf} disabled={exportingPdf}>
            {exportingPdf ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <FileText className="h-4 w-4 mr-1" />}
            PDF отчет
          </Button>
        </div>
      </div>

      {data && (
        <>
          <VsmeGuidancePanel />

          <div className="grid sm:grid-cols-4 gap-4">
            <Card className="sm:col-span-1 border-emerald-200 bg-emerald-50">
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-emerald-700">{data.readinessScore}%</p>
                <p className="text-xs text-emerald-600 mt-1">обща готовност</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex justify-around text-center">
                <div>
                  <p className="text-xl font-bold text-green-700">{data.complete}</p>
                  <p className="text-xs text-gray-500">готови</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-amber-600">{data.partial}</p>
                  <p className="text-xs text-gray-500">частични</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-red-600">{data.missing}</p>
                  <p className="text-xs text-gray-500">липсващи</p>
                </div>
              </CardContent>
            </Card>
            <Card className="sm:col-span-2">
              <CardContent className="pt-5 text-sm text-gray-600">
                <p className="font-medium text-gray-800 mb-1">{data.suggestedRoute}</p>
                <p className="text-xs text-gray-400">{data.companyName} · {year} г.</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-wrap gap-3 text-sm">
            <Link href="/settings/compliance" className="text-emerald-700 hover:underline flex items-center gap-1">
              <ShieldCheck className="h-4 w-4" /> Регулаторен скрининг
            </Link>
            <Link href="/help" className="text-gray-600 hover:underline flex items-center gap-1">
              <HelpCircle className="h-4 w-4" /> Помощ
            </Link>
          </div>

          {grouped.map(group => (
            <Card key={group.category}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-earth-500">{group.category}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {group.items.map(row => (
                  <VsmeDisclosureRow
                    key={row.id}
                    titleBg={row.titleBg}
                    hintBg={row.hintBg}
                    note={row.note}
                    status={row.status}
                    actionHref={row.actionHref}
                    actionLabel={row.status === 'complete' ? 'Преглед' : row.actionLabel}
                    guidanceKey={row.guidanceKey}
                  />
                ))}
              </CardContent>
            </Card>
          ))}

          <Card className="border-indigo-200">
            <CardHeader>
              <CardTitle className="text-lg">Допълнителни теми — попълнете ръчно</CardTitle>
              <CardDescription>
                Социални и управленски теми не идват от емисионните данни. Кликнете ред „Здраве“ или „Корупция“
                по-горе, за да скролирате директно тук.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div id="vsme-health" className="scroll-mt-24 space-y-4 p-5 rounded-xl bg-rose-50/60 border border-rose-100">
                <div className="flex items-center gap-2">
                  <HeartPulse className="h-5 w-5 text-rose-600" />
                  <p className="font-semibold text-gray-900">Здраве и безопасност на работа</p>
                  <GuidanceHint guidanceKey="vsmeHealthSafety" />
                </div>
                <p className="text-xs text-rose-800/80">
                  Пример: политика по БЗР, отговорник, периодичен инструктаж (месечно, на 3 месеца…), регистър на инциденти.
                </p>
                <div className="space-y-2">
                  <LabelWithGuidance label="Имате ли писмена политика по БЗР?" guidanceKey="vsmeHealthSafety" />
                  <TriStateSelect
                    id="hs_policy"
                    value={manual.health_safety_has_policy}
                    onChange={v => setManual(m => ({ ...m, health_safety_has_policy: v }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hs_responsible">Отговорник по здраве и безопасност</Label>
                  <Input
                    id="hs_responsible"
                    value={manual.health_safety_responsible_person}
                    onChange={e => setManual(m => ({ ...m, health_safety_responsible_person: e.target.value }))}
                    placeholder="Име или длъжност, напр. „Техн. директор“"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hs_desc">Какви мерки прилагате?</Label>
                  <Textarea
                    id="hs_desc"
                    value={manual.health_safety_description}
                    onChange={e => setManual(m => ({ ...m, health_safety_description: e.target.value }))}
                    placeholder="Инструктажи при постъпване, защитно оборудване, прегледи, застраховка..."
                    rows={4}
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hs_incidents">Регистрирани инциденти за {year} г.</Label>
                    <Input
                      id="hs_incidents"
                      type="number"
                      min="0"
                      value={manual.health_safety_incidents}
                      onChange={e => setManual(m => ({ ...m, health_safety_incidents: e.target.value }))}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hs_training">Колко често провеждате БЗР инструктаж?</Label>
                    <Input
                      id="hs_training"
                      list="hs_training_presets"
                      value={manual.health_safety_training_frequency}
                      onChange={e => setManual(m => ({ ...m, health_safety_training_frequency: e.target.value }))}
                      placeholder="напр. месечно, на 3 месеца, при постъпване..."
                    />
                    <datalist id="hs_training_presets">
                      <option value="месечно" />
                      <option value="на всеки 3 месеца" />
                      <option value="на всеки 6 месеца" />
                      <option value="годишно" />
                      <option value="при постъпване на работа" />
                      <option value="не се провежда" />
                    </datalist>
                    <p className="text-xs text-gray-500">Можете да изберете от списъка или да въведете свой период.</p>
                  </div>
                </div>
              </div>

              <div id="vsme-corruption" className="scroll-mt-24 space-y-4 p-5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2">
                  <Scale className="h-5 w-5 text-slate-700" />
                  <p className="font-semibold text-gray-900">Корупция и подкуп</p>
                  <GuidanceHint guidanceKey="vsmeAntiCorruption" />
                </div>
                <p className="text-xs text-slate-600">
                  Пример: кодекс на етика, правила за подаръци и конфликт на интереси, канал за анонимни сигнали.
                </p>
                <div className="space-y-2">
                  <LabelWithGuidance label="Имате ли политика срещу корупция и подкуп?" guidanceKey="vsmeAntiCorruption" />
                  <TriStateSelect
                    id="ac_policy"
                    value={manual.anti_corruption_has_policy}
                    onChange={v => setManual(m => ({ ...m, anti_corruption_has_policy: v }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ac_desc">Описание на политиката</Label>
                  <Textarea
                    id="ac_desc"
                    value={manual.anti_corruption_description}
                    onChange={e => setManual(m => ({ ...m, anti_corruption_description: e.target.value }))}
                    placeholder="Кодекс на поведение, одобрение на договори, обучение на служители..."
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ac_whistle">Имате ли канал за сигнали (whistleblowing)?</Label>
                  <TriStateSelect
                    id="ac_whistle"
                    value={manual.anti_corruption_whistleblower}
                    onChange={v => setManual(m => ({ ...m, anti_corruption_whistleblower: v }))}
                  />
                </div>
              </div>

              <Button onClick={saveManual} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Запази допълнителните теми
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
