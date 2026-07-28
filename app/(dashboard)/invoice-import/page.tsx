'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Upload, FileText, CheckCircle2, AlertTriangle, XCircle,
  Loader2, Trash2, ArrowRight, Sparkles, Info, ChevronDown, ChevronUp,
} from 'lucide-react';
import type { ParsedInvoice } from '@/app/api/invoices/parse/route';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type FileStatus = 'pending' | 'parsing' | 'done' | 'error';

interface FileState {
  file: File;
  status: FileStatus;
  result?: ParsedInvoice;
  error?: string;
}

interface EditableRow {
  id: string;                  // client-side only
  filename: string;
  selected: boolean;
  txn_date: string;
  supplier: string;
  description: string;
  amount_original: number | string;
  currency_original: string;
  invoice_number: string;
  overallConfidence: 'high' | 'medium' | 'low';
  method: 'ai' | 'heuristic' | 'failed';
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const CURRENCIES = ['BGN', 'EUR', 'USD', 'GBP', 'CHF'];

function confidenceColor(c: 'high' | 'medium' | 'low') {
  return c === 'high'   ? 'text-green-600' :
         c === 'medium' ? 'text-amber-600' : 'text-red-400';
}

function ConfidenceDot({ c }: { c: 'high' | 'medium' | 'low' }) {
  const col = c === 'high' ? 'bg-green-400' : c === 'medium' ? 'bg-amber-400' : 'bg-red-400';
  return <span className={`inline-block w-2 h-2 rounded-full ${col} shrink-0`} title={`Достоверност: ${c}`} />;
}

function parsedToRow(p: ParsedInvoice, idx: number): EditableRow {
  return {
    id:               `${p.filename}-${idx}`,
    filename:         p.filename,
    selected:         p.method !== 'failed',
    txn_date:         p.txn_date.value,
    supplier:         p.supplier.value,
    description:      p.description.value,
    amount_original:  p.amount_original.value,
    currency_original: p.currency_original.value,
    invoice_number:   p.invoice_number.value,
    overallConfidence: p.overallConfidence,
    method:           p.method,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Drop zone
// ─────────────────────────────────────────────────────────────────────────────

function DropZone({ onFiles }: { onFiles: (files: File[]) => void }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handle = (files: FileList | null) => {
    if (!files) return;
    const pdfs = Array.from(files).filter(f =>
      f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    );
    if (pdfs.length > 0) onFiles(pdfs);
  };

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); handle(e.dataTransfer.files); }}
      onClick={() => inputRef.current?.click()}
      className={`
        relative cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center
        transition-all duration-200 select-none
        ${dragging
          ? 'border-earth-400 bg-earth-50 scale-[1.01]'
          : 'border-gray-300 bg-gray-50 hover:border-earth-300 hover:bg-earth-50/50'
        }
      `}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf"
        className="hidden"
        onChange={e => handle(e.target.files)}
      />
      <div className="flex flex-col items-center gap-3">
        <div className={`h-16 w-16 rounded-2xl flex items-center justify-center transition-colors ${
          dragging ? 'bg-earth-200' : 'bg-gray-200'
        }`}>
          <Upload className={`h-8 w-8 ${dragging ? 'text-earth-600' : 'text-gray-400'}`} />
        </div>
        <div>
          <p className="text-base font-semibold text-gray-700">
            {dragging ? 'Пуснете файловете тук' : 'Плъзнете PDF фактури тук'}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            или <span className="text-earth-500 font-medium">изберете файлове</span> — до 30 наведнъж
          </p>
        </div>
        <p className="text-xs text-gray-400">
          Поддържа се: PDF (НАП фактури, банкови извлечения, всякакви доставчици)
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// File progress list
// ─────────────────────────────────────────────────────────────────────────────

function FileProgressList({ files }: { files: FileState[] }) {
  if (files.length === 0) return null;
  return (
    <div className="space-y-1.5">
      {files.map((f, i) => (
        <div key={i} className="flex items-center gap-3 text-sm bg-white border rounded-lg px-3 py-2">
          <FileText className="h-4 w-4 text-gray-400 shrink-0" />
          <span className="flex-1 truncate text-gray-700">{f.file.name}</span>
          <span className="text-xs text-gray-400 shrink-0">
            {(f.file.size / 1024).toFixed(0)} KB
          </span>
          {f.status === 'pending'  && <div className="w-4 h-4 rounded-full border-2 border-gray-200 shrink-0" />}
          {f.status === 'parsing'  && <Loader2 className="h-4 w-4 animate-spin text-earth-400 shrink-0" />}
          {f.status === 'done'     && <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />}
          {f.status === 'error'    && <XCircle className="h-4 w-4 text-red-400 shrink-0" />}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Editable table
// ─────────────────────────────────────────────────────────────────────────────

function EditableTable({
  rows, setRows,
}: {
  rows: EditableRow[];
  setRows: React.Dispatch<React.SetStateAction<EditableRow[]>>;
}) {
  const [expandedRaw, setExpandedRaw] = useState<string | null>(null);

  const update = (id: string, field: keyof EditableRow, value: unknown) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const remove = (id: string) => setRows(prev => prev.filter(r => r.id !== id));

  const allSelected = rows.every(r => r.selected);
  const toggleAll = () => setRows(prev => prev.map(r => ({ ...r, selected: !allSelected })));

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-3 py-3 text-left">
              <input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded" />
            </th>
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">Файл / Доверие</th>
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600">Дата</th>
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 min-w-40">Доставчик</th>
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 min-w-40">Описание</th>
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600">Сума</th>
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600">Вал.</th>
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600">Фактура №</th>
            <th className="px-3 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map(row => (
            <tr
              key={row.id}
              className={`transition-colors ${
                !row.selected ? 'opacity-40' :
                row.overallConfidence === 'low' ? 'bg-red-50/30' :
                row.overallConfidence === 'medium' ? 'bg-amber-50/30' : ''
              }`}
            >
              <td className="px-3 py-2">
                <input
                  type="checkbox"
                  checked={row.selected}
                  onChange={e => update(row.id, 'selected', e.target.checked)}
                  className="rounded"
                />
              </td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <ConfidenceDot c={row.overallConfidence} />
                  <div>
                    <p className="text-xs text-gray-600 max-w-28 truncate" title={row.filename}>
                      {row.filename}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {row.method === 'ai' && (
                        <Badge className="text-xs px-1 py-0 bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-100">
                          <Sparkles className="h-2.5 w-2.5 mr-0.5" />AI
                        </Badge>
                      )}
                      {row.method === 'heuristic' && (
                        <Badge variant="outline" className="text-xs px-1 py-0 text-gray-400">
                          Авто
                        </Badge>
                      )}
                      {row.method === 'failed' && (
                        <Badge className="text-xs px-1 py-0 bg-red-100 text-red-600 hover:bg-red-100">
                          Грешка
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-3 py-2">
                <Input
                  type="date"
                  value={row.txn_date}
                  onChange={e => update(row.id, 'txn_date', e.target.value)}
                  className={`h-8 text-xs w-36 ${!row.txn_date ? 'border-red-300' : ''}`}
                />
              </td>
              <td className="px-3 py-2">
                <Input
                  value={row.supplier}
                  onChange={e => update(row.id, 'supplier', e.target.value)}
                  placeholder="Доставчик *"
                  className={`h-8 text-xs ${!row.supplier ? 'border-red-300' : ''}`}
                />
              </td>
              <td className="px-3 py-2">
                <Input
                  value={row.description}
                  onChange={e => update(row.id, 'description', e.target.value)}
                  placeholder="Описание"
                  className="h-8 text-xs"
                />
              </td>
              <td className="px-3 py-2">
                <Input
                  type="number"
                  value={row.amount_original}
                  onChange={e => update(row.id, 'amount_original', e.target.value)}
                  placeholder="0.00"
                  className={`h-8 text-xs w-28 ${!row.amount_original ? 'border-red-300' : ''}`}
                  step="0.01"
                />
              </td>
              <td className="px-3 py-2">
                <select
                  value={row.currency_original}
                  onChange={e => update(row.id, 'currency_original', e.target.value)}
                  className="h-8 text-xs border border-gray-200 rounded-md px-1.5 bg-white w-16"
                >
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </td>
              <td className="px-3 py-2">
                <Input
                  value={row.invoice_number}
                  onChange={e => update(row.id, 'invoice_number', e.target.value)}
                  placeholder="№"
                  className="h-8 text-xs w-28"
                />
              </td>
              <td className="px-3 py-2">
                <button
                  onClick={() => remove(row.id)}
                  className="text-gray-300 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Confidence legend */}
      <div className="flex items-center gap-4 px-3 py-2 bg-gray-50 border-t text-xs text-gray-400">
        <span className="font-medium text-gray-500">Ред на ред:</span>
        <span className="flex items-center gap-1"><ConfidenceDot c="high" /> Висока достоверност</span>
        <span className="flex items-center gap-1"><ConfidenceDot c="medium" /> Средна — проверете</span>
        <span className="flex items-center gap-1"><ConfidenceDot c="low" /> Ниска — задължително коригирайте</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export default function InvoiceImportPage() {
  const [fileStates, setFileStates]   = useState<FileState[]>([]);
  const [rows, setRows]               = useState<EditableRow[]>([]);
  const [parsing, setParsing]         = useState(false);
  const [importing, setImporting]     = useState(false);
  const [aiActive, setAiActive]       = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);
  const [showTips, setShowTips]       = useState(true);

  const handleFiles = useCallback(async (files: File[]) => {
    setImportResult(null);
    const states: FileState[] = files.map(f => ({ file: f, status: 'pending' }));
    setFileStates(prev => [...prev, ...states]);
    setParsing(true);

    // Mark all as parsing
    setFileStates(prev => prev.map((s, i) =>
      i >= prev.length - files.length ? { ...s, status: 'parsing' } : s
    ));

    try {
      const form = new FormData();
      files.forEach(f => form.append('files', f));

      const res = await fetch('/api/invoices/parse', { method: 'POST', body: form });
      if (!res.ok) throw new Error('Parse API error');

      const { results, aiActive: ai } = await res.json() as {
        results: ParsedInvoice[];
        aiActive: boolean;
      };

      setAiActive(ai);

      // Mark done / error per file
      setFileStates(prev => {
        const updated = [...prev];
        const startIdx = updated.length - files.length;
        results.forEach((r, i) => {
          updated[startIdx + i] = {
            ...updated[startIdx + i],
            status: r.method === 'failed' ? 'error' : 'done',
            result: r,
            error: r.error,
          };
        });
        return updated;
      });

      // Add to editable rows
      const newRows = results.map((r, i) => parsedToRow(r, Date.now() + i));
      setRows(prev => [...prev, ...newRows]);
    } catch {
      setFileStates(prev => prev.map((s, i) =>
        i >= prev.length - files.length ? { ...s, status: 'error', error: 'Грешка при парсиране' } : s
      ));
    } finally {
      setParsing(false);
    }
  }, []);

  const selectedRows = rows.filter(r => r.selected && r.method !== 'failed');

  const handleImport = async () => {
    if (selectedRows.length === 0) return;
    setImporting(true);
    setImportResult(null);

    try {
      const res = await fetch('/api/invoices/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactions: selectedRows.map(r => ({
            txn_date:          r.txn_date,
            supplier:          r.supplier,
            description:       r.description,
            amount_original:   parseFloat(String(r.amount_original)) || 0,
            currency_original: r.currency_original,
            invoice_number:    r.invoice_number || null,
          })),
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      setImportResult({ success: result.imported, failed: result.failed ?? 0 });
      // Remove successfully imported rows
      setRows(prev => prev.filter(r => !r.selected || r.method === 'failed'));
    } catch (err) {
      setImportResult({ success: 0, failed: selectedRows.length });
    } finally {
      setImporting(false);
    }
  };

  const clearAll = () => { setFileStates([]); setRows([]); setImportResult(null); };
  const highConf  = rows.filter(r => r.overallConfidence === 'high').length;
  const needsReview = rows.filter(r => r.overallConfidence !== 'high').length;

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <FileText className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">Импорт от фактури</h1>
                {aiActive && (
                  <Badge className="bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-100 gap-1">
                    <Sparkles className="h-3 w-3" /> AI активна
                  </Badge>
                )}
                {!aiActive && (
                  <Badge variant="outline" className="text-gray-400 gap-1">
                    <Info className="h-3 w-3" /> Базова екстракция
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-500">
                Плъзнете PDF фактури — системата автоматично извлича данните
              </p>
            </div>
          </div>
          {rows.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearAll} className="text-gray-400">
              Изчисти всичко
            </Button>
          )}
        </div>

        {/* Tips (collapsible) */}
        {rows.length === 0 && (
          <Card className="border-blue-200 bg-blue-50">
            <button
              className="w-full text-left"
              onClick={() => setShowTips(s => !s)}
            >
              <CardHeader className="py-3 px-5">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                    <Info className="h-4 w-4" /> Как работи?
                  </CardTitle>
                  {showTips
                    ? <ChevronUp className="h-4 w-4 text-blue-400" />
                    : <ChevronDown className="h-4 w-4 text-blue-400" />
                  }
                </div>
              </CardHeader>
            </button>
            {showTips && (
              <CardContent className="px-5 pb-4 grid md:grid-cols-3 gap-4 text-xs text-blue-700 pt-0">
                <div className="space-y-1">
                  <p className="font-semibold">📄 Какво да качите</p>
                  <p>PDF фактури от доставчици, наемодатели, телекоми, банки — всякакви. Системата поддържа стандартния НАП формат и повечето чуждестранни формати.</p>
                </div>
                <div className="space-y-1">
                  <p className="font-semibold">🔍 Как се извличат данните</p>
                  <p>Текстът се извлича от PDF-а и се анализира автоматично. Полетата с ниска достоверност са маркирани в оранжево/червено — прегледайте ги преди импорт.</p>
                </div>
                <div className="space-y-1">
                  <p className="font-semibold">✏️ Редактиране</p>
                  <p>Всяко поле може да се редактира директно в таблицата. Само избраните редове (✓) ще бъдат импортирани като транзакции.</p>
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Drop zone */}
        <DropZone onFiles={handleFiles} />

        {/* File progress */}
        {fileStates.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
              Файлове ({fileStates.length})
            </p>
            <FileProgressList files={fileStates} />
          </div>
        )}

        {/* Import result banner */}
        {importResult && (
          <div className={`rounded-xl p-4 flex items-center gap-3 ${
            importResult.success > 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            {importResult.success > 0
              ? <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
              : <XCircle className="h-5 w-5 text-red-500 shrink-0" />
            }
            <div>
              <p className="font-semibold text-sm text-gray-800">
                {importResult.success > 0
                  ? `${importResult.success} транзакции импортирани успешно!`
                  : 'Грешка при импорт'
                }
              </p>
              {importResult.success > 0 && (
                <p className="text-xs text-gray-500 mt-0.5">
                  Вижте ги в <a href="/scope3/transactions" className="text-earth-500 underline">Транзакции Обхват 3</a> и класифицирайте ги.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Editable preview table */}
        {rows.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <p className="text-sm font-semibold text-gray-700">
                  Преглед и корекция ({rows.length} фактури)
                </p>
                {highConf > 0 && (
                  <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
                    {highConf} готови
                  </Badge>
                )}
                {needsReview > 0 && (
                  <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {needsReview} за проверка
                  </Badge>
                )}
              </div>
              <p className="text-xs text-gray-400">
                Редактирайте директно в таблицата · Червени полета са задължителни
              </p>
            </div>

            <EditableTable rows={rows} setRows={setRows} />

            {/* Import action */}
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-gray-500">
                <span className="font-semibold text-gray-800">{selectedRows.length}</span> избрани за импорт
              </p>
              <Button
                onClick={handleImport}
                disabled={importing || selectedRows.length === 0}
                className="gap-2 bg-earth-300 hover:bg-earth-400 min-w-48"
              >
                {importing
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Импортиране...</>
                  : <><ArrowRight className="h-4 w-4" /> Импортирай {selectedRows.length} транзакции</>
                }
              </Button>
            </div>
          </div>
        )}

        {/* Empty state after clearing */}
        {rows.length === 0 && fileStates.length === 0 && !parsing && (
          <div className="text-center py-4 text-sm text-gray-400">
            Все още няма качени файлове.
          </div>
        )}
      </div>
    </div>
  );
}
