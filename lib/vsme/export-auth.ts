import type { SupabaseClient, User } from '@supabase/supabase-js';

export interface VsmeExportContext {
  supabase: SupabaseClient;
  user: User;
  companyId: string;
  generatedBy: string;
}

export async function resolveVsmeExportContext(
  supabase: SupabaseClient,
): Promise<{ ok: true; ctx: VsmeExportContext } | { ok: false; status: number; error: string }> {
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return { ok: false, status: 401, error: 'Неоторизиран достъп' };
  }

  const { data: userData } = await supabase
    .from('users')
    .select('company_id, first_name, last_name')
    .eq('id', user.id)
    .single();

  if (!userData?.company_id) {
    return { ok: false, status: 400, error: 'Няма свързана компания' };
  }

  const generatedBy = `${userData.first_name ?? ''} ${userData.last_name ?? ''}`.trim() || user.email || 'Unknown';

  return {
    ok: true,
    ctx: {
      supabase,
      user,
      companyId: userData.company_id,
      generatedBy,
    },
  };
}
