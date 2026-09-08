import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCompanyFootprint } from '@/lib/carbon/footprint-service';

/**
 * Syncs emission targets with actual emission data
 * This calculates the current year's emissions and updates active targets
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Неоторизиран достъп' }, { status: 401 });
    }

    // Get user's company
    const { data: userData } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!userData?.company_id) {
      return NextResponse.json({ error: 'Няма свързана компания' }, { status: 400 });
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Calculate how many months have passed in the current year
    const monthsPassedThisYear = currentMonth + 1;

    const ytdFootprint = await getCompanyFootprint(supabase, userData.company_id, currentYear);

    const projectionFactor = monthsPassedThisYear > 0 ? 12 / monthsPassedThisYear : 1;
    const totalEmissions  = ytdFootprint.total  * projectionFactor;
    const scope1Emissions = ytdFootprint.scope1 * projectionFactor;
    const scope2Emissions = ytdFootprint.scope2 * projectionFactor;
    const scope3Emissions = ytdFootprint.scope3 * projectionFactor;

    // Get active targets
    const { data: targets, error: targetsError } = await supabase
      .from('emission_targets')
      .select('*')
      .eq('company_id', userData.company_id)
      .eq('status', 'active');

    if (targetsError) throw targetsError;

    // Update each target's current_value
    const updates = [];
    for (const target of targets || []) {
      let currentValue = totalEmissions;
      
      // If target is scope-specific, use that scope's total
      if (target.scope === 1) {
        currentValue = scope1Emissions;
      } else if (target.scope === 2) {
        currentValue = scope2Emissions;
      } else if (target.scope === 3) {
        currentValue = scope3Emissions;
      }

      updates.push(
        supabase
          .from('emission_targets')
          .update({ 
            current_value: currentValue,
            updated_at: new Date().toISOString()
          })
          .eq('id', target.id)
      );
    }

    // Execute all updates
    await Promise.all(updates);

    const isFullYear = currentMonth === 11; // December (0-indexed)
    const statusMessage = isFullYear 
      ? `${updates.length} цели актуализирани (пълна година)`
      : `${updates.length} цели актуализирани (прогноза базирана на ${monthsPassedThisYear} месец${monthsPassedThisYear > 1 ? 'а' : ''})`;

    return NextResponse.json({ 
      success: true, 
      message: statusMessage,
      data: {
        totalEmissions,
        scope1Emissions,
        scope2Emissions,
        scope3Emissions,
        targetsUpdated: updates.length,
        isProjection: !isFullYear,
        monthsIncluded: monthsPassedThisYear,
        projectionFactor: isFullYear ? 1 : projectionFactor
      }
    });
  } catch (error) {
    console.error('Error syncing targets:', error);
    return NextResponse.json(
      { error: 'Грешка при синхронизиране на целите' },
      { status: 500 }
    );
  }
}

