import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// Schema for rule creation/update
const ruleSchema = z.object({
  rule_name: z.string().min(1, 'Rule name required'),
  priority: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
  condition_type: z.enum(['contains', 'equals', 'regex']),
  condition_field: z.enum(['supplier', 'description', 'expense_category_raw']),
  condition_value: z.string().min(1, 'Condition value required'),
  output_scope3_category: z.number().int().min(1).max(15),
  output_subcategory: z.string().optional(),
  default_method: z.enum(['spend', 'activity']).default('spend'),
  default_factor_id: z.string().uuid().optional().nullable(),
});

// GET: Fetch all rules for user's company (or global rules)
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

    const { searchParams } = new URL(request.url);
    const includeGlobal = searchParams.get('include_global') === 'true';

    let query = supabase
      .from('classification_rules')
      .select('*')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (includeGlobal) {
      // Get company rules AND global rules (company_id IS NULL)
      query = query.or(`company_id.eq.${user.company_id},company_id.is.null`);
    } else {
      // Get only company rules
      query = query.eq('company_id', user.company_id);
    }

    const { data: rules, error } = await query;

    if (error) {
      console.error('Error fetching rules:', error);
      return NextResponse.json({ error: 'Failed to fetch rules' }, { status: 500 });
    }

    // Get application stats for each rule
    const rulesWithStats = await Promise.all(
      (rules || []).map(async (rule) => {
        const { count } = await supabase
          .from('transaction_classifications')
          .select('*', { count: 'exact', head: true })
          .eq('classified_by', 'rule')
          .eq('notes', `Applied by rule: ${rule.rule_name}`);

        return {
          ...rule,
          applications_count: count || 0,
        };
      })
    );

    return NextResponse.json({ data: rulesWithStats });
  } catch (error) {
    console.error('Rules GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create new rule
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
    const validated = ruleSchema.parse(body);

    // Create rule
    const { data: rule, error } = await supabase
      .from('classification_rules')
      .insert({
        company_id: user.company_id,
        rule_name: validated.rule_name,
        priority: validated.priority,
        is_active: validated.is_active,
        condition_type: validated.condition_type,
        condition_field: validated.condition_field,
        condition_value: validated.condition_value,
        output_scope3_category: validated.output_scope3_category,
        output_subcategory: validated.output_subcategory || null,
        default_method: validated.default_method,
        default_factor_id: validated.default_factor_id || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating rule:', error);
      return NextResponse.json({ error: 'Failed to create rule' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: rule });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Rules POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH: Update existing rule
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
      .select('id, company_id, role')
      .eq('id', session.user.id)
      .single();

    if (!user || !user.company_id) {
      return NextResponse.json({ error: 'User must have a company' }, { status: 400 });
    }

    const body = await request.json();
    const { rule_id, ...updates } = body;

    if (!rule_id) {
      return NextResponse.json({ error: 'rule_id required' }, { status: 400 });
    }

    // Verify rule belongs to user's company OR is a global rule that admins can edit
    const { data: existingRule } = await supabase
      .from('classification_rules')
      .select('company_id')
      .eq('id', rule_id)
      .single();

    if (!existingRule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    const isGlobalRule = existingRule.company_id === null;
    
    // Check if this is just a toggle operation (only is_active is being updated)
    const isToggleOnly = Object.keys(updates).length === 1 && 'is_active' in updates;
    
    // Allow editing if:
    // 1. Rule belongs to user's company, OR
    // 2. Rule is global AND (user is admin OR it's just a toggle)
    const canEdit = existingRule.company_id === user.company_id || 
                    (isGlobalRule && (user.role === 'admin' || isToggleOnly));
    
    if (!canEdit) {
      console.log('Permission denied:', {
        rule_id,
        isGlobalRule,
        userRole: user.role,
        isToggleOnly,
        ruleCompanyId: existingRule.company_id,
        userCompanyId: user.company_id
      });
      return NextResponse.json({ 
        error: 'Cannot modify this rule. Admins can edit global rules, or create your own company-specific rules.' 
      }, { status: 403 });
    }

    // Update rule
    const { data: rule, error } = await supabase
      .from('classification_rules')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', rule_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating rule:', error);
      return NextResponse.json({ error: 'Failed to update rule' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: rule });
  } catch (error) {
    console.error('Rules PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete a rule
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
      .select('id, company_id, role')
      .eq('id', session.user.id)
      .single();

    if (!user || !user.company_id) {
      return NextResponse.json({ error: 'User must have a company' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const rule_id = searchParams.get('rule_id');

    if (!rule_id) {
      return NextResponse.json({ error: 'rule_id required' }, { status: 400 });
    }

    // Verify rule belongs to user's company OR is a global rule that admins can delete
    const { data: existingRule } = await supabase
      .from('classification_rules')
      .select('company_id')
      .eq('id', rule_id)
      .single();

    if (!existingRule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    // Allow deleting if:
    // 1. Rule belongs to user's company, OR
    // 2. Rule is global (company_id IS NULL) and user is admin
    const isGlobalRule = existingRule.company_id === null;
    const canDelete = existingRule.company_id === user.company_id || (isGlobalRule && user.role === 'admin');
    
    if (!canDelete) {
      return NextResponse.json({ error: 'Cannot delete this rule' }, { status: 403 });
    }

    // Delete rule
    const { error } = await supabase
      .from('classification_rules')
      .delete()
      .eq('id', rule_id);

    if (error) {
      console.error('Error deleting rule:', error);
      return NextResponse.json({ error: 'Failed to delete rule' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Rules DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
