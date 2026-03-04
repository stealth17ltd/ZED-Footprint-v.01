import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// Schema for manual transaction creation
const manualTransactionSchema = z.object({
  txn_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  supplier: z.string().min(1, 'Supplier required'),
  description: z.string().optional(),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3, 'Currency must be 3 letters'),
  expense_category_raw: z.string().optional(),
  invoice_number: z.string().optional(),
});

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

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batch_id');
    const limit = parseInt(searchParams.get('limit') || '100');

    // Build query
    let query = supabase
      .from('transactions')
      .select(`
        *,
        import_batch:import_batches(filename, imported_at),
        classification:transaction_classifications(
          scope3_category,
          method_tier,
          is_locked
        )
      `)
      .order('txn_date', { ascending: false })
      .limit(limit);

    // RLS will handle company filtering automatically
    // But we can add explicit filter for clarity
    if (user.role !== 'admin' && user.company_id) {
      query = query.eq('company_id', user.company_id);
    }

    // Filter by batch if specified
    if (batchId) {
      query = query.eq('import_batch_id', batchId);
    }

    const { data: transactions, error } = await query;

    if (error) {
      console.error('Error fetching transactions:', error);
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }

    return NextResponse.json({ data: transactions });

  } catch (error) {
    console.error('Get transactions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create manual transaction
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
    const validated = manualTransactionSchema.parse(body);

    // Currency conversion to EUR (base currency)
    const fxRates: Record<string, number> = {
      'EUR': 1.0,
      'USD': 1.08,
      'GBP': 1.17,
      'CHF': 0.95,
    };

    const baseCurrency = 'EUR';
    const fxRate = fxRates[validated.currency] || 1.0;
    const amountBaseCurrency = validated.amount * fxRate;

    // Create manual transaction (no import batch)
    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert({
        company_id: user.company_id,
        import_batch_id: null, // Manual entry has no batch
        txn_date: validated.txn_date,
        supplier: validated.supplier,
        description: validated.description || null,
        amount: validated.amount,
        currency: validated.currency,
        amount_base_currency: amountBaseCurrency,
        base_currency: baseCurrency,
        expense_category_raw: validated.expense_category_raw || null,
        invoice_number: validated.invoice_number || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating transaction:', error);
      return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
    }

    // Try to auto-classify with rules
    try {
      const { data: rules } = await supabase
        .from('classification_rules')
        .select('*')
        .eq('is_active', true)
        .or(`company_id.eq.${user.company_id},company_id.is.null`)
        .order('priority', { ascending: false });

      if (rules && rules.length > 0) {
        const matchesRule = (txn: any, rule: any): boolean => {
          const fieldValue = txn[rule.condition_field] || '';
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
                return false;
              }
            default:
              return false;
          }
        };

        // Try to match with rules
        for (const rule of rules) {
          if (matchesRule(transaction, rule)) {
            await supabase
              .from('transaction_classifications')
              .insert({
                transaction_id: transaction.id,
                scope3_category: rule.output_scope3_category,
                subcategory: rule.output_subcategory || null,
                method_tier: rule.default_method === 'spend' ? 'C' : 'B',
                factor_id: rule.default_factor_id || null,
                notes: `Auto-classified by rule: ${rule.rule_name}`,
                classified_by: 'rule',
                classified_by_user: user.id,
                confidence_score: 0.8,
              });
            break; // First match wins
          }
        }
      }
    } catch (ruleError) {
      // Don't fail transaction creation if auto-classification fails
      console.error('Error auto-classifying manual transaction:', ruleError);
    }

    return NextResponse.json({ success: true, data: transaction });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Create transaction error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete transaction(s)
export async function DELETE(request: Request) {
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
    const transactionId = searchParams.get('id');
    const batchId = searchParams.get('batch_id');

    // Delete single transaction
    if (transactionId) {
      // First delete classifications (cascade)
      await supabase
        .from('transaction_classifications')
        .delete()
        .eq('transaction_id', transactionId);

      // Then delete transaction
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionId)
        .eq('company_id', user.company_id);

      if (error) {
        console.error('Error deleting transaction:', error);
        return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Transaction deleted' });
    }

    // Delete all transactions from a batch
    if (batchId) {
      // Get all transaction IDs from this batch
      const { data: transactions } = await supabase
        .from('transactions')
        .select('id')
        .eq('import_batch_id', batchId)
        .eq('company_id', user.company_id);

      if (transactions && transactions.length > 0) {
        const transactionIds = transactions.map(t => t.id);

        // Delete classifications
        await supabase
          .from('transaction_classifications')
          .delete()
          .in('transaction_id', transactionIds);

        // Delete transactions
        const { error } = await supabase
          .from('transactions')
          .delete()
          .eq('import_batch_id', batchId)
          .eq('company_id', user.company_id);

        if (error) {
          console.error('Error deleting batch transactions:', error);
          return NextResponse.json({ error: 'Failed to delete transactions' }, { status: 500 });
        }

        // Delete the batch itself
        await supabase
          .from('import_batches')
          .delete()
          .eq('id', batchId)
          .eq('company_id', user.company_id);

        return NextResponse.json({ 
          success: true, 
          message: `${transactions.length} transactions deleted` 
        });
      }

      return NextResponse.json({ success: true, message: 'No transactions found' });
    }

    return NextResponse.json({ error: 'Missing id or batch_id parameter' }, { status: 400 });

  } catch (error) {
    console.error('Delete transaction error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
