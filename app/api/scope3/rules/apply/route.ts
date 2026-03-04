import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Helper function to check if transaction matches rule
function matchesRule(transaction: any, rule: any): boolean {
  const fieldValue = transaction[rule.condition_field] || '';
  const conditionValue = rule.condition_value;

  switch (rule.condition_type) {
    case 'contains':
      return fieldValue.toLowerCase().includes(conditionValue.toLowerCase());
    case 'equals':
      return fieldValue.toLowerCase() === conditionValue.toLowerCase();
    case 'regex':
      try {
        const regex = new RegExp(conditionValue, 'i');
        return regex.test(fieldValue);
      } catch (e) {
        console.error('Invalid regex:', conditionValue);
        return false;
      }
    default:
      return false;
  }
}

// POST: Apply rules to unclassified transactions
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
      .select('id, company_id, role')
      .eq('id', session.user.id)
      .single();

    if (!user || !user.company_id) {
      return NextResponse.json({ error: 'User must have a company' }, { status: 400 });
    }

    const body = await request.json();
    const { rule_id, preview_only } = body;

    // Get active rules (specific rule or all active rules)
    let rulesQuery = supabase
      .from('classification_rules')
      .select('*')
      .eq('is_active', true)
      .or(`company_id.eq.${user.company_id},company_id.is.null`)
      .order('priority', { ascending: false });

    if (rule_id) {
      rulesQuery = rulesQuery.eq('id', rule_id);
    }

    const { data: rules, error: rulesError } = await rulesQuery;

    if (rulesError || !rules || rules.length === 0) {
      return NextResponse.json({ error: 'No active rules found' }, { status: 404 });
    }

    // Get unclassified transactions
    const { data: allTransactions } = await supabase
      .from('transactions')
      .select(`
        id,
        supplier,
        description,
        expense_category_raw,
        classification:transaction_classifications(id)
      `)
      .eq('company_id', user.company_id);

    if (!allTransactions) {
      return NextResponse.json({ error: 'No transactions found' }, { status: 404 });
    }

    // Filter to only unclassified
    const unclassified = allTransactions.filter(t => !t.classification || t.classification.length === 0);

    // Apply rules
    const matches: any[] = [];
    const classificationsToCreate: any[] = [];

    for (const transaction of unclassified) {
      // Try each rule in priority order (first match wins)
      for (const rule of rules) {
        if (matchesRule(transaction, rule)) {
          matches.push({
            transaction_id: transaction.id,
            supplier: transaction.supplier,
            rule_id: rule.id,
            rule_name: rule.rule_name,
            category: rule.output_scope3_category,
          });

          if (!preview_only) {
            classificationsToCreate.push({
              transaction_id: transaction.id,
              scope3_category: rule.output_scope3_category,
              subcategory: rule.output_subcategory || null,
              method_tier: rule.default_method === 'spend' ? 'C' : 'B',
              factor_id: rule.default_factor_id || null,
              notes: `Applied by rule: ${rule.rule_name}`,
              classified_by: 'rule',
              classified_by_user: user.id,
              confidence_score: 0.8,
            });
          }

          break; // First match wins
        }
      }
    }

    // If preview only, return matches
    if (preview_only) {
      return NextResponse.json({
        preview: true,
        matches_count: matches.length,
        unclassified_count: unclassified.length,
        coverage_percent: (matches.length / unclassified.length * 100).toFixed(1),
        matches: matches.slice(0, 20), // Return first 20 for preview
      });
    }

    // Actually create classifications
    if (classificationsToCreate.length > 0) {
      const { data: created, error: createError } = await supabase
        .from('transaction_classifications')
        .insert(classificationsToCreate)
        .select();

      if (createError) {
        console.error('Error creating classifications:', createError);
        return NextResponse.json({ error: 'Failed to apply rules' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        classified_count: created?.length || 0,
        unclassified_count: unclassified.length,
        coverage_percent: ((created?.length || 0) / unclassified.length * 100).toFixed(1),
      });
    }

    return NextResponse.json({
      success: true,
      classified_count: 0,
      message: 'No transactions matched the rules',
    });
  } catch (error) {
    console.error('Apply rules error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET: Test a rule condition (preview matches)
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
      .select('id, company_id')
      .eq('id', session.user.id)
      .single();

    if (!user || !user.company_id) {
      return NextResponse.json({ error: 'User must have a company' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const condition_type = searchParams.get('condition_type');
    const condition_field = searchParams.get('condition_field');
    const condition_value = searchParams.get('condition_value');

    if (!condition_type || !condition_field || !condition_value) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Get all transactions
    const { data: transactions } = await supabase
      .from('transactions')
      .select('id, supplier, description, expense_category_raw')
      .eq('company_id', user.company_id)
      .limit(500);

    if (!transactions) {
      return NextResponse.json({ data: [], matches_count: 0 });
    }

    // Test rule
    const rule = {
      condition_type,
      condition_field,
      condition_value,
    };

    const matches = transactions.filter(t => matchesRule(t, rule));

    return NextResponse.json({
      matches_count: matches.length,
      total_count: transactions.length,
      matches: matches.slice(0, 10), // Return first 10 for preview
    });
  } catch (error) {
    console.error('Test rule error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
