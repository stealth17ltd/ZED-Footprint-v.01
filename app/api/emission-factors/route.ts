import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Неоторизиран достъп' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const scope    = searchParams.get('scope');    // '1' | '2' | '3'
    const category = searchParams.get('category'); // raw category key
    const source   = searchParams.get('source');   // source_name filter
    const search   = searchParams.get('search');   // free-text on subcategory
    const active   = searchParams.get('active');   // 'true' | 'false' | null (all)

    let query = supabase
      .from('emission_factors')
      .select(`
        id, category, subcategory, region, value, unit,
        source, source_name, source_year, geography,
        scope, scope3_category, method_tier,
        factor_version, effective_date, valid_from, valid_to,
        is_active, updated_at, created_at
      `)
      .order('category', { ascending: true })
      .order('subcategory', { ascending: true });

    if (scope)    query = query.eq('scope', parseInt(scope));
    if (category) query = query.eq('category', category);
    if (source)   query = query.eq('source_name', source);
    if (active === 'true')  query = query.eq('is_active', true);
    if (active === 'false') query = query.eq('is_active', false);
    if (search) {
      query = query.or(`subcategory.ilike.%${search}%,category.ilike.%${search}%,source.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Derive distinct categories and sources for filter dropdowns
    const allForMeta = data ?? [];
    const categories = [...new Set(allForMeta.map(f => f.category))].sort();
    const sources    = [...new Set(allForMeta.map(f => f.source_name ?? f.source).filter(Boolean))].sort();

    return NextResponse.json({
      data,
      total: (data ?? []).length,
      categories,
      sources,
    });
  } catch (err) {
    console.error('emission-factors list error:', err);
    return NextResponse.json({ error: 'Грешка при зареждане на факторите' }, { status: 500 });
  }
}
