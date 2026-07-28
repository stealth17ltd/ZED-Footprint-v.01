import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { z } from 'zod';

const deleteSchema = z.object({
  confirmation: z.literal('ИЗТРИЙ ДАННИТЕ МИ', {
    errorMap: () => ({ message: 'Напишете точно: ИЗТРИЙ ДАННИТЕ МИ' }),
  }),
  reason: z.string().max(500).optional().nullable(),
});

/**
 * DELETE /api/gdpr/delete
 *
 * GDPR Article 17 — Right to Erasure ("Right to be Forgotten").
 *
 * Requires JSON body: { confirmation: "ИЗТРИЙ ДАННИТЕ МИ", reason?: string }
 *
 * Deletes (in order):
 *  1. strategy_initiatives  → cascade via strategy_id FK
 *  2. reduction_strategies
 *  3. emission_targets
 *  4. calculated_emissions
 *  5. transactions
 *  6. emission_data
 *  7. reports
 *  8. users (profile row + auth.users)
 *  9. company
 *
 * All user sessions are terminated after the auth user is deleted.
 */
export async function DELETE(request: Request) {
  try {
    // ── Auth ────────────────────────────────────────────────────────────────
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Неоторизиран достъп' }, { status: 401 });
    }

    // ── Validate body ───────────────────────────────────────────────────────
    const body = await request.json().catch(() => ({}));
    const parsed = deleteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    // ── Resolve company ─────────────────────────────────────────────────────
    const { data: userData } = await supabase
      .from('users')
      .select('company_id, role')
      .eq('id', user.id)
      .single();

    if (!userData?.company_id) {
      return NextResponse.json({ error: 'Няма свързана компания' }, { status: 400 });
    }

    // Prevent admin accounts from self-deleting via this endpoint
    if (userData.role === 'admin') {
      return NextResponse.json(
        { error: 'Администраторски акаунти не могат да бъдат изтрити чрез потребителски портал' },
        { status: 403 },
      );
    }

    const cid = userData.company_id;

    // ── Use service client for cascading deletes ────────────────────────────
    const service = createServiceClient();

    // 1. strategy_initiatives are cascade-deleted via FK when strategies are deleted
    const { error: e1 } = await service
      .from('reduction_strategies')
      .delete()
      .eq('company_id', cid);
    if (e1) throw new Error(`strategies: ${e1.message}`);

    // 2. Emission targets
    const { error: e2 } = await service
      .from('emission_targets')
      .delete()
      .eq('company_id', cid);
    if (e2) throw new Error(`targets: ${e2.message}`);

    // 3. Calculated emissions (Scope 3)
    const { error: e3 } = await service
      .from('calculated_emissions')
      .delete()
      .eq('company_id', cid);
    if (e3) throw new Error(`calculated_emissions: ${e3.message}`);

    // 4. Transactions
    const { error: e4 } = await service
      .from('transactions')
      .delete()
      .eq('company_id', cid);
    if (e4) throw new Error(`transactions: ${e4.message}`);

    // 5. Emission data (Scope 1 & 2)
    const { error: e5 } = await service
      .from('emission_data')
      .delete()
      .eq('company_id', cid);
    if (e5) throw new Error(`emission_data: ${e5.message}`);

    // 6. Reports
    const { error: e6 } = await service
      .from('reports')
      .delete()
      .eq('company_id', cid);
    if (e6) throw new Error(`reports: ${e6.message}`);

    // 7. Delete all user profile rows for the company
    const { error: e7 } = await service
      .from('users')
      .delete()
      .eq('company_id', cid);
    if (e7) throw new Error(`users: ${e7.message}`);

    // 8. Delete the company itself
    const { error: e8 } = await service
      .from('companies')
      .delete()
      .eq('id', cid);
    if (e8) throw new Error(`company: ${e8.message}`);

    // 9. Delete auth.users entry (terminates all sessions automatically)
    const { error: authDeleteErr } = await service.auth.admin.deleteUser(user.id);
    if (authDeleteErr) throw new Error(`auth.deleteUser: ${authDeleteErr.message}`);

    return NextResponse.json(
      { message: 'Всички данни са изтрити успешно. Акаунтът е закрит.' },
      { status: 200 },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Неизвестна грешка';
    console.error('GDPR delete error:', msg);
    return NextResponse.json(
      { error: `Грешка при изтриване: ${msg}` },
      { status: 500 },
    );
  }
}
