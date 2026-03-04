import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema for transaction import
const transactionSchema = z.object({
  txn_date: z.string().or(z.date()),
  supplier: z.string().min(1, 'Supplier is required'),
  description: z.string().optional(),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().min(3).max(3, 'Currency must be 3 letters (e.g., BGN, EUR, USD)'),
  expense_category: z.string().optional(),
  account_code: z.string().optional(),
  invoice_number: z.string().optional(),
  vat_amount: z.number().optional(),
  cost_center: z.string().optional(),
  department: z.string().optional(),
});

type TransactionInput = z.infer<typeof transactionSchema>;

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

    // Get user and company
    const { data: user } = await supabase
      .from('users')
      .select('id, company_id, first_name, last_name')
      .eq('id', session.user.id)
      .single();

    if (!user || !user.company_id) {
      return NextResponse.json(
        { error: 'User must be assigned to a company' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { filename, transactions, file_hash } = body;

    if (!filename || !transactions || !Array.isArray(transactions)) {
      return NextResponse.json(
        { error: 'Invalid request body. Expected filename and transactions array.' },
        { status: 400 }
      );
    }

    // Step 1: Create import batch
    const { data: batch, error: batchError } = await supabase
      .from('import_batches')
      .insert({
        company_id: user.company_id,
        filename: filename,
        file_hash: file_hash || null,
        row_count: transactions.length,
        successful_count: 0,
        failed_count: 0,
        status: 'processing',
        imported_by: user.id,
      })
      .select()
      .single();

    if (batchError || !batch) {
      console.error('Error creating import batch:', batchError);
      return NextResponse.json(
        { error: 'Failed to create import batch' },
        { status: 500 }
      );
    }

    // Step 2: Validate and process transactions
    const validTransactions: any[] = [];
    const errors: any[] = [];

    for (let i = 0; i < transactions.length; i++) {
      const row = transactions[i];
      
      try {
        // Validate with Zod
        const validated = transactionSchema.parse(row);
        
        // Parse date
        const txnDate = typeof validated.txn_date === 'string' 
          ? new Date(validated.txn_date) 
          : validated.txn_date;

        // Currency conversion to EUR (base currency)
        // In production, integrate with ECB API or similar for real-time rates
        const fxRates: Record<string, number> = {
          'EUR': 1.0,
          'USD': 1.08,    // USD to EUR (approximate)
          'GBP': 1.17,    // GBP to EUR (approximate)
          'CHF': 0.95,    // CHF to EUR (approximate)
        };

        const baseCurrency = 'EUR';
        const fxRate = fxRates[validated.currency] || 1.0;
        const amountBaseCurrency = validated.amount * fxRate;

        validTransactions.push({
          company_id: user.company_id,
          import_batch_id: batch.id,
          txn_date: txnDate.toISOString().split('T')[0],
          supplier: validated.supplier,
          description: validated.description || null,
          amount_original: validated.amount,
          currency_original: validated.currency,
          amount_base_currency: amountBaseCurrency,
          base_currency: baseCurrency,
          fx_rate: fxRate,
          expense_category_raw: validated.expense_category || null,
          account_code_raw: validated.account_code || null,
          invoice_number: validated.invoice_number || null,
          vat_amount: validated.vat_amount || null,
          cost_center: validated.cost_center || null,
          department: validated.department || null,
          raw_payload: row,
          created_by: user.id,
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          errors.push({
            row: i + 1,
            errors: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
          });
        } else {
          errors.push({
            row: i + 1,
            errors: ['Unknown validation error'],
          });
        }
      }
    }

    // Step 3: Bulk insert valid transactions
    let insertedCount = 0;
    if (validTransactions.length > 0) {
      const { data: inserted, error: insertError } = await supabase
        .from('transactions')
        .insert(validTransactions)
        .select();

      if (insertError) {
        console.error('Error inserting transactions:', insertError);
        
        // Update batch status to failed
        await supabase
          .from('import_batches')
          .update({
            status: 'failed',
            failed_count: transactions.length,
            error_summary: { error: insertError.message },
            completed_at: new Date().toISOString(),
          })
          .eq('id', batch.id);

        return NextResponse.json(
          { error: 'Failed to insert transactions', details: insertError.message },
          { status: 500 }
        );
      }

      insertedCount = inserted?.length || 0;

      // Step 3.5: Auto-apply classification rules to newly imported transactions
      if (inserted && inserted.length > 0) {
        try {
          // Get active rules for this company (and global rules)
          const { data: rules } = await supabase
            .from('classification_rules')
            .select('*')
            .eq('is_active', true)
            .or(`company_id.eq.${user.company_id},company_id.is.null`)
            .order('priority', { ascending: false });

          if (rules && rules.length > 0) {
            const classificationsToCreate = [];

            // Helper function to check if transaction matches rule
            const matchesRule = (transaction: any, rule: any): boolean => {
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
                    return false;
                  }
                default:
                  return false;
              }
            };

            // Apply rules to each inserted transaction
            for (const transaction of inserted) {
              // Try each rule in priority order (first match wins)
              for (const rule of rules) {
                if (matchesRule(transaction, rule)) {
                  classificationsToCreate.push({
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

            // Insert classifications if any matches found
            if (classificationsToCreate.length > 0) {
              await supabase
                .from('transaction_classifications')
                .insert(classificationsToCreate);
            }
          }
        } catch (ruleError) {
          // Don't fail import if rules fail - just log
          console.error('Error auto-classifying:', ruleError);
        }
      }
    }

    // Step 4: Update batch status
    const { error: updateError } = await supabase
      .from('import_batches')
      .update({
        status: 'completed',
        successful_count: insertedCount,
        failed_count: errors.length,
        error_summary: errors.length > 0 ? { errors } : null,
        completed_at: new Date().toISOString(),
      })
      .eq('id', batch.id);

    if (updateError) {
      console.error('Error updating batch status:', updateError);
    }

    return NextResponse.json({
      success: true,
      batch_id: batch.id,
      total_rows: transactions.length,
      successful: insertedCount,
      failed: errors.length,
      errors: errors.slice(0, 10), // Return first 10 errors only
    });

  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET: List import batches
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

    // Admin can see all batches, users see only their company's batches
    let query = supabase
      .from('import_batches')
      .select(`
        *,
        imported_by_user:users!import_batches_imported_by_fkey(first_name, last_name)
      `)
      .order('imported_at', { ascending: false })
      .limit(50);

    // RLS will handle filtering by company_id automatically
    // But we can add explicit filter for clarity
    if (user.role !== 'admin' && user.company_id) {
      query = query.eq('company_id', user.company_id);
    }

    const { data: batches, error } = await query;

    if (error) {
      console.error('Error fetching import batches:', error);
      return NextResponse.json({ error: 'Failed to fetch import batches' }, { status: 500 });
    }

    return NextResponse.json({ data: batches });

  } catch (error) {
    console.error('Get batches error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
