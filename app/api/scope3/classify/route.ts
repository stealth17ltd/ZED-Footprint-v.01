import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// Schema for classification
const classificationSchema = z.object({
  transaction_id: z.string().uuid(),
  scope3_category: z.number().int().min(1).max(15),
  subcategory: z.string().optional(),
  method_tier: z.enum(['A', 'B', 'C', 'D']).default('C'),
  factor_id: z.string().uuid().optional(),
  notes: z.string().optional(),
  is_locked: z.boolean().default(false),
  create_rule: z.boolean().default(false),
  rule_name: z.string().optional(),
});

// GET: Fetch classification statistics and unclassified transactions
export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user
    const { data: user } = await supabase
      .from('users')
      .select('id, company_id, role')
      .eq('id', session.user.id)
      .single();

    if (!user || !user.company_id) {
      return NextResponse.json({ error: 'User must have a company' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'unclassified';

    // Base query for transactions
    let transactionsQuery = supabase
      .from('transactions')
      .select(`
        *,
        classification:transaction_classifications(*)
      `)
      .eq('company_id', user.company_id)
      .order('txn_date', { ascending: false });

    // Filter based on view
    if (view === 'unclassified') {
      // Get transactions without classification
      const { data: allTransactions } = await transactionsQuery;
      const unclassified = allTransactions?.filter(t => !t.classification) || [];
      
      return NextResponse.json({ 
        data: unclassified,
        total: unclassified.length 
      });
    } else if (view === 'classified') {
      // Get classified transactions
      const { data: allTransactions } = await transactionsQuery;
      const classified = allTransactions?.filter(t => t.classification) || [];
      
      return NextResponse.json({ 
        data: classified,
        total: classified.length 
      });
    } else if (view === 'top-suppliers') {
      // Get top suppliers by spend
      const { data: allTransactions } = await transactionsQuery;
      
      if (!allTransactions) {
        return NextResponse.json({ data: [], total: 0 });
      }

      // Group by supplier
      const supplierMap = new Map();
      allTransactions.forEach(txn => {
        const existing = supplierMap.get(txn.supplier) || {
          supplier: txn.supplier,
          total_spend: 0,
          transaction_count: 0,
          classified_count: 0,
          transactions: [],
        };
        
        existing.total_spend += txn.amount_base_currency;
        existing.transaction_count += 1;
        if (txn.classification) existing.classified_count += 1;
        existing.transactions.push(txn);
        
        supplierMap.set(txn.supplier, existing);
      });

      // Convert to array and sort by spend
      const topSuppliers = Array.from(supplierMap.values())
        .sort((a, b) => b.total_spend - a.total_spend)
        .slice(0, 50); // Top 50 suppliers

      return NextResponse.json({ 
        data: topSuppliers,
        total: topSuppliers.length 
      });
    }

    // Default: all transactions
    const { data: transactions, error } = await transactionsQuery;

    if (error) {
      console.error('Error fetching transactions:', error);
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }

    return NextResponse.json({ data: transactions });

  } catch (error) {
    console.error('Classification GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create or update classification
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user
    const { data: user } = await supabase
      .from('users')
      .select('id, company_id')
      .eq('id', session.user.id)
      .single();

    if (!user || !user.company_id) {
      return NextResponse.json({ error: 'User must have a company' }, { status: 400 });
    }

    const body = await request.json();
    const validated = classificationSchema.parse(body);

    // Verify transaction belongs to user's company
    const { data: transaction, error: txnError } = await supabase
      .from('transactions')
      .select('id, company_id, supplier, expense_category_raw')
      .eq('id', validated.transaction_id)
      .eq('company_id', user.company_id)
      .single();

    if (txnError || !transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Check if classification already exists
    const { data: existing } = await supabase
      .from('transaction_classifications')
      .select('id')
      .eq('transaction_id', validated.transaction_id)
      .single();

    let classificationResult;

    if (existing) {
      // Update existing classification
      const { data, error } = await supabase
        .from('transaction_classifications')
        .update({
          scope3_category: validated.scope3_category,
          subcategory: validated.subcategory || null,
          method_tier: validated.method_tier,
          factor_id: validated.factor_id || null,
          notes: validated.notes || null,
          is_locked: validated.is_locked,
          classified_by: 'user',
          classified_by_user: user.id,
          classified_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating classification:', error);
        return NextResponse.json({ error: 'Failed to update classification' }, { status: 500 });
      }

      classificationResult = data;
    } else {
      // Create new classification
      const { data, error } = await supabase
        .from('transaction_classifications')
        .insert({
          transaction_id: validated.transaction_id,
          scope3_category: validated.scope3_category,
          subcategory: validated.subcategory || null,
          method_tier: validated.method_tier,
          factor_id: validated.factor_id || null,
          notes: validated.notes || null,
          is_locked: validated.is_locked,
          classified_by: 'user',
          classified_by_user: user.id,
          confidence_score: 1.0, // User classification = 100% confidence
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating classification:', error);
        return NextResponse.json({ error: 'Failed to create classification' }, { status: 500 });
      }

      classificationResult = data;
    }

    // If user wants to create a rule from this classification
    if (validated.create_rule && validated.rule_name) {
      const { error: ruleError } = await supabase
        .from('classification_rules')
        .insert({
          company_id: user.company_id,
          rule_name: validated.rule_name,
          priority: 0,
          is_active: true,
          condition_type: 'contains',
          condition_field: 'supplier',
          condition_value: transaction.supplier,
          output_scope3_category: validated.scope3_category,
          output_subcategory: validated.subcategory || null,
          default_method: 'spend',
          default_factor_id: validated.factor_id || null,
          created_by: user.id,
        });

      if (ruleError) {
        console.error('Error creating rule:', ruleError);
        // Don't fail the request, just log
      }
    }

    return NextResponse.json({ 
      success: true,
      data: classificationResult 
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Classification POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH: Bulk classification
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user
    const { data: user } = await supabase
      .from('users')
      .select('id, company_id')
      .eq('id', session.user.id)
      .single();

    if (!user || !user.company_id) {
      return NextResponse.json({ error: 'User must have a company' }, { status: 400 });
    }

    const body = await request.json();
    const { transaction_ids, scope3_category, method_tier, is_locked } = body;

    if (!transaction_ids || !Array.isArray(transaction_ids)) {
      return NextResponse.json({ error: 'transaction_ids array required' }, { status: 400 });
    }

    // Verify all transactions belong to user's company
    const { data: transactions, error: verifyError } = await supabase
      .from('transactions')
      .select('id')
      .in('id', transaction_ids)
      .eq('company_id', user.company_id);

    if (verifyError || !transactions || transactions.length !== transaction_ids.length) {
      return NextResponse.json({ error: 'Invalid transaction IDs' }, { status: 400 });
    }

    // Prepare bulk insert/update
    const classifications = transaction_ids.map(txn_id => ({
      transaction_id: txn_id,
      scope3_category: scope3_category,
      method_tier: method_tier || 'C',
      is_locked: is_locked || false,
      classified_by: 'user',
      classified_by_user: user.id,
      confidence_score: 1.0,
    }));

    // Upsert classifications (insert or update if exists)
    const { data, error } = await supabase
      .from('transaction_classifications')
      .upsert(classifications, {
        onConflict: 'transaction_id',
        ignoreDuplicates: false,
      })
      .select();

    if (error) {
      console.error('Error bulk classifying:', error);
      return NextResponse.json({ error: 'Failed to classify transactions' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      classified_count: data?.length || 0 
    });

  } catch (error) {
    console.error('Bulk classification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
