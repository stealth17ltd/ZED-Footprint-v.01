import type { SupabaseClient } from '@supabase/supabase-js';

interface Scope3CalcRow {
  scope_category: number;
  co2e_kg: number;
  method_tier: string;
  calculation_trace?: Record<string, unknown> | null;
  source_type?: string | null;
  source_id?: string | null;
}

interface TransactionRow {
  id: string;
  supplier: string | null;
  description: string | null;
  amount_original: number | null;
  currency_original: string | null;
  txn_date: string | null;
}

/**
 * Ensures Scope 3 report rows include supplier/description in calculation_trace
 * by joining source transactions when trace metadata is incomplete.
 */
export async function enrichScope3CalculationsForReport(
  supabase: SupabaseClient,
  rows: Scope3CalcRow[],
): Promise<Scope3CalcRow[]> {
  if (!rows.length) return [];

  const txIds = rows
    .filter((r) => r.source_type === 'transaction' && r.source_id)
    .map((r) => r.source_id as string);

  let txMap: Record<string, TransactionRow> = {};
  if (txIds.length > 0) {
    const { data: txData } = await supabase
      .from('transactions')
      .select('id, supplier, description, amount_original, currency_original, txn_date')
      .in('id', txIds);

    for (const tx of txData ?? []) {
      txMap[tx.id] = tx;
    }
  }

  return rows.map((row) => {
    const trace = (row.calculation_trace ?? {}) as Record<string, unknown>;
    const tx = row.source_id ? txMap[row.source_id] : undefined;

    const enrichedTrace = {
      ...trace,
      supplier: trace.supplier ?? tx?.supplier ?? undefined,
      description: trace.description ?? tx?.description ?? undefined,
      amount: trace.amount ?? tx?.amount_original ?? undefined,
      currency: trace.currency ?? tx?.currency_original ?? undefined,
      date: trace.date ?? tx?.txn_date ?? undefined,
    };

    return { ...row, calculation_trace: enrichedTrace };
  });
}
