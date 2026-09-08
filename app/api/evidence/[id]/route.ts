import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { EVIDENCE_BUCKET } from '@/lib/evidence/constants';

/**
 * GET /api/evidence/[id] — signed download URL (1 h)
 * DELETE /api/evidence/[id] — remove file + row
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Неоторизиран достъп' }, { status: 401 });
    }

    const { data: doc, error } = await supabase
      .from('evidence_documents')
      .select('id, storage_path, original_filename, mime_type')
      .eq('id', id)
      .single();

    if (error || !doc) {
      return NextResponse.json({ error: 'Документът не е намерен' }, { status: 404 });
    }

    const { data: signed, error: signErr } = await supabase.storage
      .from(EVIDENCE_BUCKET)
      .createSignedUrl(doc.storage_path, 3600);

    if (signErr || !signed?.signedUrl) {
      return NextResponse.json({ error: 'Грешка при генериране на линк' }, { status: 500 });
    }

    return NextResponse.json({
      url: signed.signedUrl,
      filename: doc.original_filename,
      mime_type: doc.mime_type,
    });
  } catch (err) {
    console.error('Evidence download error:', err);
    return NextResponse.json({ error: 'Грешка при изтегляне' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Неоторизиран достъп' }, { status: 401 });
    }

    const { data: doc, error } = await supabase
      .from('evidence_documents')
      .select('id, storage_path')
      .eq('id', id)
      .single();

    if (error || !doc) {
      return NextResponse.json({ error: 'Документът не е намерен' }, { status: 404 });
    }

    await supabase.storage.from(EVIDENCE_BUCKET).remove([doc.storage_path]);

    const { error: delErr } = await supabase
      .from('evidence_documents')
      .delete()
      .eq('id', id);

    if (delErr) throw delErr;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Evidence DELETE error:', err);
    return NextResponse.json({ error: 'Грешка при изтриване' }, { status: 500 });
  }
}
