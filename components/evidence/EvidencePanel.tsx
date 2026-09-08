'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { EVIDENCE_DOCUMENT_TYPES } from '@/lib/evidence/constants';
import { FileText, Upload, Download, Trash2, Loader2, Paperclip } from 'lucide-react';
import { toast } from 'sonner';
import type { EvidenceDocumentRow } from '@/app/api/evidence/route';

interface EvidencePanelProps {
  emissionId: string;
  compact?: boolean;
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function EvidencePanel({ emissionId, compact = false }: EvidencePanelProps) {
  const [documents, setDocuments] = useState<EvidenceDocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [documentType, setDocumentType] = useState<string>('invoice');
  const [notes, setNotes] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/evidence?emission_id=${emissionId}`);
      if (res.ok) {
        const json = await res.json();
        setDocuments(json.data ?? []);
      }
    } catch {
      toast.error('Грешка при зареждане на доказателства');
    } finally {
      setLoading(false);
    }
  }, [emissionId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('emission_id', emissionId);
      fd.append('document_type', documentType);
      if (notes.trim()) fd.append('notes', notes.trim());

      const res = await fetch('/api/evidence', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Upload failed');

      setDocuments((prev) => [json.data, ...prev]);
      setNotes('');
      if (fileRef.current) fileRef.current.value = '';
      toast.success('Документът е прикачен');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Грешка при качване');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (id: string) => {
    try {
      const res = await fetch(`/api/evidence/${id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      window.open(json.url, '_blank', 'noopener,noreferrer');
    } catch {
      toast.error('Грешка при изтегляне');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Изтриване на прикачения документ?')) return;
    try {
      const res = await fetch(`/api/evidence/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      toast.success('Документът е изтрит');
    } catch {
      toast.error('Грешка при изтриване');
    }
  };

  const typeLabel = (value: string) =>
    EVIDENCE_DOCUMENT_TYPES.find((t) => t.value === value)?.label ?? value;

  return (
    <div className={`rounded-lg border border-purple-100 bg-purple-50/50 ${compact ? 'p-3' : 'p-4'} space-y-3`}>
      <div className="flex items-center gap-2">
        <Paperclip className="h-4 w-4 text-purple-600" />
        <h3 className="font-semibold text-gray-900 text-sm">Доказателства / документи</h3>
        {documents.length > 0 && (
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
            {documents.length}
          </span>
        )}
      </div>

      {!compact && (
        <p className="text-xs text-gray-500">
          Прикачете фактура, показание от уред или друг източник — нужни за одитна следа и CSRD отчети.
        </p>
      )}

      <div className={`grid gap-2 ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-3'}`}>
        <div>
          <Label className="text-xs text-gray-500">Тип документ</Label>
          <Select value={documentType} onValueChange={setDocumentType}>
            <SelectTrigger className="h-9 mt-1 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EVIDENCE_DOCUMENT_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {!compact && (
          <div className="sm:col-span-2">
            <Label className="text-xs text-gray-500">Бележка (опционално)</Label>
            <Input
              className="h-9 mt-1 bg-white"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="напр. Фактура ЧЕЗ март 2025"
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept=".pdf,.png,.jpg,.jpeg,.webp,.csv,.xlsx,.xls"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleUpload(f);
          }}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="bg-white"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <Upload className="h-4 w-4 mr-1" />
          )}
          Прикачи файл
        </Button>
        <span className="text-xs text-gray-400">PDF, изображения, CSV/Excel · max 10 MB</span>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
          <Loader2 className="h-3 w-3 animate-spin" /> Зареждане...
        </div>
      ) : documents.length === 0 ? (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded px-2 py-1.5">
          Няма прикачени документи — одитната следа е непълна.
        </p>
      ) : (
        <ul className="space-y-2">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center justify-between gap-2 bg-white rounded-md border px-3 py-2 text-sm"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-4 w-4 text-purple-500 shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium truncate">{doc.original_filename}</p>
                  <p className="text-xs text-gray-400">
                    {typeLabel(doc.document_type)} · {formatBytes(doc.file_size_bytes)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleDownload(doc.id)}>
                  <Download className="h-4 w-4" />
                </Button>
                <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => handleDelete(doc.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
