'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Shield, Download, Trash2, AlertTriangle, CheckCircle2,
  FileJson, Lock, Eye, UserX, Database, ChevronDown, ChevronUp,
  Loader2, ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

// ── GDPR rights data ───────────────────────────────────────────────────────
const GDPR_RIGHTS = [
  {
    icon: Eye,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    title: 'Право на достъп (Чл. 15)',
    desc: 'Имате право да получите копие от всички лични данни, които съхраняваме за вас и вашата организация.',
  },
  {
    icon: Download,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    title: 'Право на преносимост (Чл. 20)',
    desc: 'Можете да изтеглите данните си в машинно-четим формат (JSON) и да ги прехвърлите на друг оператор.',
  },
  {
    icon: Trash2,
    color: 'text-red-600',
    bg: 'bg-red-50',
    title: 'Право на изтриване (Чл. 17)',
    desc: 'Можете да поискате изтриване на всички ваши данни ("правото да бъдете забравени"). Тази операция е необратима.',
  },
  {
    icon: Lock,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    title: 'Право на ограничаване (Чл. 18)',
    desc: 'Имате право да поискате ограничаване на обработката на вашите данни при определени обстоятелства.',
  },
];

const DATA_RETENTION = [
  { category: 'Профилни данни',        period: 'До закриване на акаунта' },
  { category: 'Данни за емисии',        period: '10 години (CSRD изискване)' },
  { category: 'Финансови транзакции',   period: '10 години (данъчно право)' },
  { category: 'Одитни записи',          period: '7 години' },
  { category: 'Журнал за сигурност',    period: '1 година' },
];

// ── Main page ──────────────────────────────────────────────────────────────
export default function PrivacySettingsPage() {
  const router = useRouter();

  // Export state
  const [exporting, setExporting] = useState(false);

  // Delete state
  const [deleteOpen, setDeleteOpen]     = useState(false);
  const [confirmText, setConfirmText]   = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [deleting, setDeleting]         = useState(false);

  // Accordion state
  const [retentionOpen, setRetentionOpen] = useState(false);

  // ── Handlers ──────────────────────────────────────────────────────────────
  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch('/api/gdpr/export');
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Грешка при експорт');
      }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      const cd   = res.headers.get('Content-Disposition') ?? '';
      const fnMatch = cd.match(/filename="?([^"]+)"?/);
      a.href     = url;
      a.download = fnMatch?.[1] ?? 'gdpr_export.json';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Данните са изтеглени успешно');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Грешка при изтегляне');
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete() {
    if (confirmText !== 'ИЗТРИЙ ДАННИТЕ МИ') return;
    setDeleting(true);
    try {
      const res = await fetch('/api/gdpr/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmation: 'ИЗТРИЙ ДАННИТЕ МИ',
          reason: deleteReason || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? 'Грешка при изтриване');
      toast.success('Акаунтът е закрит. Пренасочване...');
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Грешка при изтриване');
      setDeleting(false);
    }
  }

  const canDelete = confirmText === 'ИЗТРИЙ ДАННИТЕ МИ';

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Shield className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Поверителност & GDPR</h1>
              <p className="text-sm text-gray-500">Управление на вашите лични данни съгласно GDPR</p>
            </div>
          </div>
        </div>

        {/* ── GDPR Rights overview ── */}
        <Card className="border-blue-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="h-4 w-4 text-blue-600" />
              Вашите права по GDPR
            </CardTitle>
            <CardDescription>
              Регламент (ЕС) 2016/679 — Обща регламентация за защита на данните
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {GDPR_RIGHTS.map(right => (
                <div key={right.title} className="flex gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50/50">
                  <div className={`h-8 w-8 shrink-0 rounded-lg flex items-center justify-center ${right.bg}`}>
                    <right.icon className={`h-4 w-4 ${right.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800 leading-tight">{right.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{right.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── Data export ── */}
        <Card className="border-emerald-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileJson className="h-4 w-4 text-emerald-600" />
              Изтегли своите данни
            </CardTitle>
            <CardDescription>
              Получете пълно копие на всички данни, свързани с вашата компания
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-4 space-y-2">
              <p className="text-sm font-medium text-emerald-800">Какво ще получите:</p>
              <ul className="text-xs text-emerald-700 space-y-1">
                {[
                  'Профил на компанията и потребителите',
                  'Всички данни за емисии (Обхват 1, 2 и 3)',
                  'Транзакции и изчисления',
                  'Цели за намаляване на емисиите',
                  'Стратегии и инициативи',
                  'Генерирани отчети',
                ].map(item => (
                  <li key={item} className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
                <Database className="h-3 w-3" />
                Формат: JSON · UTF-8 кодиране · Включени всички полета
              </p>
            </div>

            <Button
              onClick={handleExport}
              disabled={exporting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              {exporting
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Подготвяне...</>
                : <><Download className="h-4 w-4" /> Изтегли данните (JSON)</>
              }
            </Button>
          </CardContent>
        </Card>

        {/* ── Data retention ── */}
        <Card>
          <CardHeader
            className="pb-3 cursor-pointer select-none"
            onClick={() => setRetentionOpen(prev => !prev)}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="h-4 w-4 text-gray-500" />
                Срокове за съхранение на данни
              </CardTitle>
              {retentionOpen
                ? <ChevronUp className="h-4 w-4 text-gray-400" />
                : <ChevronDown className="h-4 w-4 text-gray-400" />
              }
            </div>
          </CardHeader>
          {retentionOpen && (
            <CardContent className="pt-0">
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                    <tr>
                      <th className="text-left px-4 py-2.5 font-semibold">Категория данни</th>
                      <th className="text-left px-4 py-2.5 font-semibold">Срок на съхранение</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {DATA_RETENTION.map(row => (
                      <tr key={row.category} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 text-gray-700">{row.category}</td>
                        <td className="px-4 py-2.5 text-gray-500">{row.period}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                * Минималните срокове са определени от CSRD, данъчното законодателство и одиторски изисквания.
                Можете да поискате изтриване в рамките на законово допустимото.
              </p>
            </CardContent>
          )}
        </Card>

        {/* ── Legal basis ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-gray-500" />
              Правно основание за обработка
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600">
            <p>
              <span className="font-semibold text-gray-800">Изпълнение на договор</span> — обработваме данните ви
              за предоставяне на услугите по изчисляване на въглероден отпечатък.
            </p>
            <p>
              <span className="font-semibold text-gray-800">Законово задължение</span> — съхранението на данни за
              емисии произтича от задължения по CSRD (Директива 2022/2464/ЕС).
            </p>
            <p>
              <span className="font-semibold text-gray-800">Легитимен интерес</span> — подобряване на продукта
              на база анонимизирани, обобщени данни.
            </p>
            <a
              href="https://eur-lex.europa.eu/legal-content/BG/TXT/?uri=CELEX%3A32016R0679"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1"
            >
              <ExternalLink className="h-3 w-3" />
              Пълен текст на GDPR (EUR-Lex)
            </a>
          </CardContent>
        </Card>

        {/* ── Danger zone: Delete ── */}
        <Card className="border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-4 w-4" />
              Зона на опасност — Изтриване на акаунт
            </CardTitle>
            <CardDescription className="text-red-600/80">
              Тази операция е необратима. Всички данни ще бъдат перманентно изтрити.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-red-50 border border-red-100 p-4 mb-4 space-y-1">
              <p className="text-sm font-semibold text-red-800">Какво ще бъде изтрито:</p>
              <ul className="text-xs text-red-700 space-y-0.5">
                {[
                  'Профил на компанията и всички потребители',
                  'Всички данни за емисии и изчисления',
                  'Транзакции, цели и стратегии',
                  'Генерирани отчети',
                  'Достъпът до платформата ще бъде прекратен незабавно',
                ].map(item => (
                  <li key={item} className="flex items-center gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-red-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <Button
              variant="outline"
              className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 gap-2"
              onClick={() => setDeleteOpen(true)}
            >
              <UserX className="h-4 w-4" />
              Заяви изтриване на акаунт
            </Button>
          </CardContent>
        </Card>

      </div>

      {/* ── Delete confirmation dialog ── */}
      <Dialog open={deleteOpen} onOpenChange={open => { if (!deleting) setDeleteOpen(open); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <DialogTitle className="text-red-700">Потвърди изтриване</DialogTitle>
            </div>
            <DialogDescription className="text-left leading-relaxed">
              Тази операция е <strong>необратима</strong>. Всички данни на компанията и потребителите ще
              бъдат перманентно изтрити. Акаунтът ви ще бъде закрит незабавно.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Reason (optional) */}
            <div className="space-y-1.5">
              <Label className="text-sm">Причина за изтриване <span className="text-gray-400">(по избор)</span></Label>
              <Textarea
                placeholder="Напр. Приключване на дейност, смяна на платформа..."
                value={deleteReason}
                onChange={e => setDeleteReason(e.target.value)}
                rows={2}
                className="text-sm resize-none"
                disabled={deleting}
              />
            </div>

            {/* Confirmation phrase */}
            <div className="space-y-1.5">
              <Label className="text-sm">
                За да потвърдите, напишете точно:
                <code className="ml-1 px-1.5 py-0.5 bg-gray-100 text-red-700 rounded text-xs font-mono font-bold">
                  ИЗТРИЙ ДАННИТЕ МИ
                </code>
              </Label>
              <Input
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder="ИЗТРИЙ ДАННИТЕ МИ"
                className={`font-mono text-sm ${canDelete ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
                disabled={deleting}
              />
            </div>

            {canDelete && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                <p className="text-xs text-red-700 font-medium">
                  Ако продължите, всички данни ще бъдат изтрити перманентно.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => { setDeleteOpen(false); setConfirmText(''); setDeleteReason(''); }}
              disabled={deleting}
            >
              Отказ
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={!canDelete || deleting}
              className="gap-2"
            >
              {deleting
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Изтриване...</>
                : <><Trash2 className="h-4 w-4" /> Изтрий всичко</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
