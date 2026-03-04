import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/scope3/calculate
 * Calculate CO2e emissions for classified transactions
 * 
 * Body (optional):
 * - period: "2025-01" (specific month) or "2025" (full year)
 * - recalculate: boolean (recalculate existing)
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's company
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.company_id) {
      return NextResponse.json({ error: 'User company not found' }, { status: 400 });
    }

    const companyId = userData.company_id;
    const body = await req.json().catch(() => ({}));
    const { period, recalculate = false } = body;

    // Build query for classified transactions
    let query = supabase
      .from('transactions')
      .select(`
        id,
        txn_date,
        supplier,
        description,
        amount_base_currency,
        base_currency,
        import_batch_id,
        transaction_classifications!inner (
          id,
          scope3_category,
          method_tier,
          is_locked
        )
      `)
      .eq('company_id', companyId)
      .not('transaction_classifications', 'is', null);

    // Filter by period if specified
    if (period) {
      if (period.includes('-')) {
        // Monthly: "2025-01"
        const [year, month] = period.split('-');
        const startDate = `${year}-${month}-01`;
        const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];
        query = query.gte('txn_date', startDate).lte('txn_date', endDate);
      } else {
        // Yearly: "2025"
        query = query.gte('txn_date', `${period}-01-01`).lte('txn_date', `${period}-12-31`);
      }
    }

    const { data: transactions, error: txnError } = await query;

    if (txnError) {
      console.error('Error fetching transactions:', txnError);
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }

    if (!transactions || transactions.length === 0) {
      return NextResponse.json({ 
        message: 'No classified transactions to calculate',
        calculated: 0,
        skipped: 0,
        total_co2e_kg: 0
      });
    }

    // Get active emission factors for Scope 3
    const { data: factors, error: factorsError } = await supabase
      .from('emission_factors')
      .select('*')
      .eq('scope', 3)
      .eq('is_active', true);

    if (factorsError) {
      console.error('Error fetching factors:', factorsError);
      return NextResponse.json({ error: 'Failed to fetch emission factors' }, { status: 500 });
    }

    console.log(`Found ${factors?.length || 0} active Scope 3 emission factors`);
    
    if (!factors || factors.length === 0) {
      return NextResponse.json({ 
        error: 'No emission factors found for Scope 3. Please seed emission factors first.',
        message: 'Run the seed_scope3_factors.sql migration'
      }, { status: 400 });
    }

    let calculated = 0;
    let skipped = 0;
    let totalCo2eKg = 0;
    const calculations = [];

    // Process each transaction
    for (const txn of transactions) {
      const classification = Array.isArray(txn.transaction_classifications) 
        ? txn.transaction_classifications[0] 
        : txn.transaction_classifications;

      if (!classification) {
        skipped++;
        continue;
      }

      // Check if already calculated (unless recalculate is true)
      if (!recalculate) {
        const { data: existing } = await supabase
          .from('calculated_emissions')
          .select('id')
          .eq('source_type', 'transaction')
          .eq('source_id', txn.id)
          .single();

        if (existing) {
          skipped++;
          continue;
        }
      }

      // Find matching emission factor
      const factor = findBestFactor(
        factors || [],
        classification.scope3_category,
        classification.method_tier,
        txn.supplier,
        txn.description
      );

      if (!factor) {
        console.warn(`No emission factor found for transaction ${txn.id}, category ${classification.scope3_category}, tier ${classification.method_tier}`);
        skipped++;
        continue;
      }

      // Validate factor has required fields
      if (!factor.value || isNaN(parseFloat(factor.value.toString()))) {
        console.warn(`Invalid emission factor value for transaction ${txn.id}, factor ${factor.id}: ${factor.value}`);
        skipped++;
        continue;
      }

      // Calculate CO2e
      const amountEur = txn.amount_base_currency;
      const factorValue = parseFloat(factor.value?.toString() || '0');
      const co2eKg = amountEur * factorValue;

      // Skip if calculation results in invalid value
      if (!co2eKg || isNaN(co2eKg) || co2eKg <= 0) {
        console.warn(`Invalid calculation result for transaction ${txn.id}: ${amountEur} × ${factorValue} = ${co2eKg}`);
        skipped++;
        continue;
      }

      // Prepare calculation trace for "show my math"
      const calculationTrace = {
        transaction_id: txn.id,
        amount: amountEur,
        currency: txn.base_currency,
        factor_value: factorValue,
        factor_unit: factor.unit,
        factor_name: factor.subcategory || factor.category,
        factor_source: factor.source_name || factor.source,
        category: classification.scope3_category,
        method_tier: classification.method_tier,
        calculation: `${amountEur} ${txn.base_currency} × ${factorValue} kg CO2e per ${factor.unit} = ${co2eKg.toFixed(2)} kg CO2e`,
        supplier: txn.supplier,
        description: txn.description,
        date: txn.txn_date,
      };

      calculations.push({
        company_id: companyId,
        source_type: 'transaction',
        source_id: txn.id,
        reporting_period: txn.txn_date.substring(0, 7) + '-01', // First of month
        scope: 3,
        scope_category: classification.scope3_category,
        co2e_kg: co2eKg,
        factor_id: factor.id,
        factor_version: factor.factor_version,
        method_tier: classification.method_tier,
        calculation_trace: calculationTrace,
      });

      totalCo2eKg += co2eKg;
      calculated++;
    }

    // Delete existing calculations if recalculating
    if (recalculate && calculations.length > 0) {
      const transactionIds = transactions.map(t => t.id);
      await supabase
        .from('calculated_emissions')
        .delete()
        .eq('company_id', companyId)
        .eq('source_type', 'transaction')
        .in('source_id', transactionIds);
    }

    // Insert calculations in batches
    if (calculations.length > 0) {
      const batchSize = 100;
      for (let i = 0; i < calculations.length; i += batchSize) {
        const batch = calculations.slice(i, i + batchSize);
        const { error: insertError } = await supabase
          .from('calculated_emissions')
          .insert(batch);

        if (insertError) {
          console.error('Error inserting calculations:', insertError);
          return NextResponse.json({ 
            error: 'Failed to save calculations',
            details: insertError.message 
          }, { status: 500 });
        }
      }
    }

    return NextResponse.json({
      success: true,
      calculated,
      skipped,
      total_transactions: transactions.length,
      total_co2e_kg: Math.round(totalCo2eKg * 100) / 100,
      total_co2e_tons: Math.round(totalCo2eKg / 1000 * 100) / 100,
    });

  } catch (error) {
    console.error('Error calculating emissions:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET /api/scope3/calculate
 * Get calculation summary for company
 * 
 * Query params:
 * - period: "2025-01" or "2025" (optional)
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.company_id) {
      return NextResponse.json({ error: 'User company not found' }, { status: 400 });
    }

    const companyId = userData.company_id;
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period');

    // Build base query
    let query = supabase
      .from('calculated_emissions')
      .select('*')
      .eq('company_id', companyId)
      .eq('scope', 3);

    // Filter by period
    if (period) {
      if (period.includes('-')) {
        // Monthly
        query = query.eq('reporting_period', `${period}-01`);
      } else {
        // Yearly
        query = query.gte('reporting_period', `${period}-01-01`)
                     .lte('reporting_period', `${period}-12-31`);
      }
    }

    const { data: emissions, error: emissionsError } = await query;

    if (emissionsError) {
      console.error('Error fetching emissions:', emissionsError);
      return NextResponse.json({ error: 'Failed to fetch emissions' }, { status: 500 });
    }

    // Calculate summary
    const totalCo2eKg = emissions?.reduce((sum, e) => sum + parseFloat(e.co2e_kg.toString()), 0) || 0;
    
    // Group by category
    const byCategory = emissions?.reduce((acc: any, e) => {
      const cat = e.scope_category || 0;
      if (!acc[cat]) {
        acc[cat] = { category: cat, co2e_kg: 0, count: 0 };
      }
      acc[cat].co2e_kg += parseFloat(e.co2e_kg.toString());
      acc[cat].count += 1;
      return acc;
    }, {}) || {};

    // Group by method tier
    const byTier = emissions?.reduce((acc: any, e) => {
      const tier = e.method_tier || 'Unknown';
      if (!acc[tier]) {
        acc[tier] = { tier, co2e_kg: 0, count: 0 };
      }
      acc[tier].co2e_kg += parseFloat(e.co2e_kg.toString());
      acc[tier].count += 1;
      return acc;
    }, {}) || {};

    return NextResponse.json({
      total_co2e_kg: Math.round(totalCo2eKg * 100) / 100,
      total_co2e_tons: Math.round(totalCo2eKg / 1000 * 100) / 100,
      total_calculations: emissions?.length || 0,
      by_category: Object.values(byCategory),
      by_tier: Object.values(byTier),
      period: period || 'all',
    });

  } catch (error) {
    console.error('Error fetching calculation summary:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Helper: Find best matching emission factor
 * Priority:
 * 1. Exact match: category + supplier/description keyword
 * 2. Category + tier match
 * 3. Category + default tier C
 */
function findBestFactor(
  factors: any[],
  category: number,
  tier: string,
  supplier: string,
  description: string | null
): any | null {
  // Filter by category
  const categoryFactors = factors.filter(f => f.scope3_category === category);
  
  if (categoryFactors.length === 0) {
    console.warn(`No factors found for category ${category}. Available categories: ${[...new Set(factors.map(f => f.scope3_category))].join(', ')}`);
    return null;
  }

  console.log(`Found ${categoryFactors.length} factors for category ${category}`);

  // Try to find supplier/description keyword match
  const text = `${supplier} ${description || ''}`.toLowerCase();
  const keywordMatch = categoryFactors.find(f => {
    if (!f.keywords) return false;
    const keywords = Array.isArray(f.keywords) ? f.keywords : [];
    return keywords.some((kw: string) => text.includes(kw.toLowerCase()));
  });

  if (keywordMatch) {
    console.log(`Keyword match found for "${supplier}"`);
    return keywordMatch;
  }

  // Match by tier
  const tierMatch = categoryFactors.find(f => f.method_tier === tier);
  if (tierMatch) {
    console.log(`Tier ${tier} match found for category ${category}`);
    return tierMatch;
  }

  // Default: first factor for category (usually tier C - spend-based)
  console.log(`Using default factor for category ${category}`);
  return categoryFactors[0] || null;
}
