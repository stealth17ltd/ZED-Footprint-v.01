import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { TARGET_TEMPLATES } from '@/lib/target-templates';

const targetItemSchema = z.object({
  templateId:     z.string(),
  name:           z.string().min(1, 'Името е задължително'),
  description:    z.string().optional().nullable(),
  target_type:    z.enum(['absolute', 'percentage', 'intensity']),
  scope:          z.number().int().min(1).max(3).nullable().optional(),
  baseline_year:  z.number().int().min(2000).max(2100),
  baseline_value: z.number().positive('Базовата стойност трябва да е положителна'),
  target_year:    z.number().int().min(2000).max(2100),
  target_value:   z.number().min(0),
  sbti_aligned:   z.boolean().optional(),
  notes:          z.string().optional().nullable(),
});

const requestSchema = z.object({
  targets: z.array(targetItemSchema).min(1, 'Изберете поне една цел'),
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
    const { targets } = requestSchema.parse(body);

    const created: string[] = [];

    for (const item of targets) {
      const template = TARGET_TEMPLATES.find(t => t.id === item.templateId);

      if (item.target_year <= item.baseline_year) {
        return NextResponse.json(
          { error: `Цел "${item.name}": целевата година трябва да е след базовата` },
          { status: 400 },
        );
      }

      const { data: target, error } = await supabase
        .from('emission_targets')
        .insert({
          company_id:     userData.company_id,
          name:           item.name,
          description:    item.description ?? template?.description ?? null,
          target_type:    item.target_type,
          scope:          item.scope ?? null,
          baseline_year:  item.baseline_year,
          baseline_value: item.baseline_value,
          current_value:  item.baseline_value,
          target_year:    item.target_year,
          target_value:   item.target_value,
          sbti_aligned:   item.sbti_aligned ?? template?.sbti_aligned ?? false,
          notes:          item.notes ?? null,
        })
        .select('id')
        .single();

      if (error || !target) {
        console.error('Error inserting target from template:', error);
        continue;
      }

      created.push(target.id);
    }

    return NextResponse.json(
      { data: { created: created.length, targetIds: created } },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error creating targets from templates:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Грешка при създаване на цели от шаблони' },
      { status: 500 },
    );
  }
}
