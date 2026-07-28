import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { STRATEGY_TEMPLATES } from '@/lib/strategy-templates';

// Each item carries a templateId plus user-edited overrides.
const templateItemSchema = z.object({
  templateId:               z.string(),
  title:                    z.string().min(1),
  scope:                    z.number().int().min(1).max(3).nullable().optional(),
  priority:                 z.enum(['high', 'medium', 'low']),
  estimated_reduction_co2e: z.number().min(0).nullable().optional(),
  estimated_cost:           z.number().min(0).nullable().optional(),
  responsible_person:       z.string().optional().nullable(),
  start_date:               z.string().optional().nullable(),
  target_completion_date:   z.string().optional().nullable(),
  notes:                    z.string().optional().nullable(),
});

const requestSchema = z.object({
  templates: z.array(templateItemSchema).min(1, 'Изберете поне един шаблон'),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Неоторизиран достъп' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!userData?.company_id) {
      return NextResponse.json({ error: 'Няма свързана компания' }, { status: 400 });
    }

    const body = await request.json();
    const { templates } = requestSchema.parse(body);

    const created: string[] = [];

    for (const item of templates) {
      const template = STRATEGY_TEMPLATES.find(t => t.id === item.templateId);
      if (!template) continue;

      const base = item.start_date ? new Date(item.start_date) : new Date();

      const { data: strategy, error: strategyError } = await supabase
        .from('reduction_strategies')
        .insert({
          company_id:               userData.company_id,
          title:                    item.title,
          description:              template.description,
          category:                 template.category,
          scope:                    item.scope ?? template.scope,
          priority:                 item.priority,
          status:                   'draft',
          estimated_reduction_co2e: item.estimated_reduction_co2e ?? (template.estimated_reduction_co2e_min + template.estimated_reduction_co2e_max) / 2,
          estimated_cost:           item.estimated_cost ?? (template.estimated_cost_min + template.estimated_cost_max) / 2,
          responsible_person:       item.responsible_person ?? null,
          start_date:               item.start_date ?? base.toISOString().split('T')[0],
          target_completion_date:   item.target_completion_date ?? null,
          notes:                    item.notes ?? null,
          is_ai_generated:          false,
        })
        .select('id')
        .single();

      if (strategyError || !strategy) continue;

      if (template.initiatives.length > 0) {
        const initiativeRows = template.initiatives.map((initiative, idx) => {
          const dueDate = new Date(base);
          if (initiative.due_days_from_start) {
            dueDate.setDate(dueDate.getDate() + initiative.due_days_from_start);
          }
          return {
            strategy_id:              strategy.id,
            title:                    initiative.title,
            description:              initiative.description,
            status:                   'pending',
            due_date:                 initiative.due_days_from_start ? dueDate.toISOString().split('T')[0] : null,
            estimated_reduction_co2e: initiative.estimated_reduction_co2e ?? null,
            estimated_cost:           initiative.estimated_cost ?? null,
            sort_order:               idx,
          };
        });

        await supabase.from('strategy_initiatives').insert(initiativeRows);
      }

      created.push(strategy.id);
    }

    return NextResponse.json(
      { data: { created: created.length, strategyIds: created } },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error creating strategies from templates:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Грешка при създаване на стратегии от шаблони' },
      { status: 500 },
    );
  }
}
