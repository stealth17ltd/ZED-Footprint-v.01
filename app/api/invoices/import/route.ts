import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DEFAULT_CURRENCY, FX_TO_EUR, convertToEUR } from '@/lib/constants/currency';

interface IncomingTransaction {
  txn_date: string;
  supplier: string;
  description: string;
  amount_original: number;
  currency_original: string;
  invoice_number?: string | null;
}

/**
 * POST /api/invoices/import
 * Body: { transactions: IncomingTransaction[] }
 * Creates an import_batch record, then inserts all transactions.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single();
    if (!userData?.company_id) {
      return NextResponse.json({ error: 'No company' }, { status: 400 });
    }

    const body = await request.json();
    const transactions: IncomingTransaction[] = body.transactions ?? [];

    if (transactions.length === 0) {
      return NextResponse.json({ error: 'No transactions provided' }, { status: 400 });
    }
    if (transactions.length > 30) {
      return NextResponse.json({ error: 'Max 30 per batch' }, { status: 400 });
    }

    // Validate required fields
    const valid = transactions.filter(t =>
      t.txn_date && t.supplier?.trim() && t.amount_original > 0
    );
    const failed = transactions.length - valid.length;

    if (valid.length === 0) {
      return NextResponse.json({ error: 'All rows are missing required fields' }, { status: 400 });
    }

    // Create import batch
    const { data: batch, error: batchErr } = await supabase
      .from('import_batches')
      .insert({
        company_id:       userData.company_id,
        filename:         `invoice_ocr_${new Date().toISOString().slice(0, 10)}.pdf`,
        row_count:        valid.length,
        status:           'processing',
        imported_by:      user.id,
      })
      .select('id')
      .single();

    if (batchErr || !batch) {
      throw new Error('Failed to create import batch');
    }

    // Build transaction rows
    const rows = valid.map(t => ({
      company_id:          userData.company_id,
      import_batch_id:     batch.id,
      txn_date:            t.txn_date,
      supplier:            t.supplier.trim().slice(0, 255),
      description:         (t.description ?? '').trim().slice(0, 500),
      amount_original:     t.amount_original,
      currency_original:   t.currency_original ?? DEFAULT_CURRENCY,
      amount_base_currency: convertToEUR(t.amount_original, t.currency_original ?? DEFAULT_CURRENCY),
      base_currency:       DEFAULT_CURRENCY,
      fx_rate:             FX_TO_EUR[t.currency_original ?? DEFAULT_CURRENCY] ?? 1,
      invoice_number:      t.invoice_number ?? null,
      created_by:          user.id,
    }));

    const { error: insertErr } = await supabase.from('transactions').insert(rows);

    if (insertErr) throw insertErr;

    // Mark batch complete
    await supabase
      .from('import_batches')
      .update({ status: 'completed', successful_count: rows.length, failed_count: failed, completed_at: new Date().toISOString() })
      .eq('id', batch.id);

    return NextResponse.json({ imported: rows.length, failed, batchId: batch.id });
  } catch (err) {
    console.error('Invoice import error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
