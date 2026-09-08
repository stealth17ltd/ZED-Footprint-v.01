import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import {
  EVIDENCE_ALLOWED_MIME,
  EVIDENCE_BUCKET,
  EVIDENCE_DOCUMENT_TYPES,
  EVIDENCE_MAX_BYTES,
  evidenceStoragePath,
  type EvidenceDocumentType,
} from '@/lib/evidence/constants';

const listSchema = z.object({
  emission_id: z.string().uuid(),
});

const uploadMetaSchema = z.object({
  emission_id: z.string().uuid(),
  document_type: z.enum(
    EVIDENCE_DOCUMENT_TYPES.map((t) => t.value) as [EvidenceDocumentType, ...EvidenceDocumentType[]],
  ),
  notes: z.string().max(500).optional(),
});

export interface EvidenceDocumentRow {
  id: string;
  emission_id: string | null;
  document_type: string;
  original_filename: string;
  mime_type: string | null;
  file_size_bytes: number | null;
  notes: string | null;
  created_at: string;
}

/**
 * GET /api/evidence?emission_id=uuid
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Неоторизиран достъп' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const parsed = listSchema.safeParse({ emission_id: searchParams.get('emission_id') });
    if (!parsed.success) {
      return NextResponse.json({ error: 'emission_id е задължителен' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('evidence_documents')
      .select('id, emission_id, document_type, original_filename, mime_type, file_size_bytes, notes, created_at')
      .eq('emission_id', parsed.data.emission_id)
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ data: [] });
      }
      throw error;
    }

    return NextResponse.json({ data: data ?? [] });
  } catch (err) {
    console.error('Evidence GET error:', err);
    return NextResponse.json({ error: 'Грешка при зареждане на доказателства' }, { status: 500 });
  }
}

/**
 * POST /api/evidence — multipart: file, emission_id, document_type, notes?
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Неоторизиран достъп' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single();
    if (!userData?.company_id) {
      return NextResponse.json({ error: 'Няма свързана компания' }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const meta = uploadMetaSchema.safeParse({
      emission_id: formData.get('emission_id'),
      document_type: formData.get('document_type') ?? 'invoice',
      notes: formData.get('notes') || undefined,
    });

    if (!meta.success) {
      return NextResponse.json({ error: meta.error.issues[0]?.message ?? 'Невалидни данни' }, { status: 400 });
    }

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: 'Файлът е задължителен' }, { status: 400 });
    }

    if (file.size > EVIDENCE_MAX_BYTES) {
      return NextResponse.json({ error: 'Максимален размер: 10 MB' }, { status: 400 });
    }

    if (file.type && !EVIDENCE_ALLOWED_MIME.includes(file.type)) {
      return NextResponse.json({ error: 'Неподдържан тип файл' }, { status: 400 });
    }

    const { data: emission } = await supabase
      .from('emission_data')
      .select('id, company_id, reporting_period, supplier')
      .eq('id', meta.data.emission_id)
      .eq('company_id', userData.company_id)
      .single();

    if (!emission) {
      return NextResponse.json({ error: 'Емисионният запис не е намерен' }, { status: 404 });
    }

    const fileId = crypto.randomUUID();
    const storagePath = evidenceStoragePath(
      userData.company_id,
      meta.data.emission_id,
      fileId,
      file.name,
    );

    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadErr } = await supabase.storage
      .from(EVIDENCE_BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      });

    if (uploadErr) {
      console.error('Evidence storage upload:', uploadErr);
      return NextResponse.json(
        { error: 'Грешка при качване на файла. Проверете дали storage bucket „evidence“ съществува.' },
        { status: 500 },
      );
    }

    const { data: row, error: insertErr } = await supabase
      .from('evidence_documents')
      .insert({
        company_id: userData.company_id,
        emission_id: meta.data.emission_id,
        storage_path: storagePath,
        document_type: meta.data.document_type,
        original_filename: file.name,
        mime_type: file.type || null,
        file_size_bytes: file.size,
        reporting_period: emission.reporting_period,
        supplier: emission.supplier,
        notes: meta.data.notes ?? null,
        uploaded_by: user.id,
      })
      .select('id, emission_id, document_type, original_filename, mime_type, file_size_bytes, notes, created_at')
      .single();

    if (insertErr) {
      await supabase.storage.from(EVIDENCE_BUCKET).remove([storagePath]);
      throw insertErr;
    }

    return NextResponse.json({ data: row }, { status: 201 });
  } catch (err) {
    console.error('Evidence POST error:', err);
    return NextResponse.json({ error: 'Грешка при качване' }, { status: 500 });
  }
}
