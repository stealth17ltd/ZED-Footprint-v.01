/**
 * Remove "Демо данни YYYY-MM" notes from all emission_data rows.
 * Usage: npm run clean:demo-notes
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function loadEnvLocal() {
  const raw = readFileSync(join(root, '.env.local'), 'utf8');
  for (const line of raw.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    process.env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
}

loadEnvLocal();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const DEMO_PATTERN = /^Демо [Дд]анни \d{4}-\d{2}$/;

async function main() {
  const { data: rows, error } = await supabase
    .from('emission_data')
    .select('id, notes')
    .not('notes', 'is', null);

  if (error) throw error;

  const toClean = (rows ?? []).filter((r) => r.notes && DEMO_PATTERN.test(r.notes.trim()));

  if (toClean.length === 0) {
    console.log('No demo notes found — nothing to clean.');
    return;
  }

  console.log(`Clearing demo notes on ${toClean.length} record(s)...`);

  const { error: updErr } = await supabase
    .from('emission_data')
    .update({ notes: null })
    .in('id', toClean.map((r) => r.id));

  if (updErr) throw updErr;

  console.log(`Done — cleared notes on ${toClean.length} emission record(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
