/**
 * Apply pending Supabase migrations to a remote Postgres database.
 *
 * Usage:
 *   Set DATABASE_URL in .env.local (Supabase → Settings → Database → Connection string → URI)
 *   node scripts/apply-migrations.mjs
 *
 * Applies migrations not yet recorded in supabase_migrations.schema_migrations.
 */
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const migrationsDir = join(root, 'supabase', 'migrations');

function loadEnvLocal() {
  try {
    const raw = readFileSync(join(root, '.env.local'), 'utf8');
    for (const line of raw.split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const i = t.indexOf('=');
      if (i === -1) continue;
      const key = t.slice(0, i).trim();
      const val = t.slice(i + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    /* optional */
  }
}

loadEnvLocal();

const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
if (!databaseUrl) {
  console.error(
    'Missing DATABASE_URL. Add it to .env.local from Supabase → Settings → Database → Connection string (URI).',
  );
  process.exit(1);
}

const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.sql'))
  .sort();

const client = new pg.Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });

async function ensureMigrationsTable() {
  await client.query(`
    CREATE SCHEMA IF NOT EXISTS supabase_migrations;
    CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
      version text PRIMARY KEY,
      name text,
      inserted_at timestamptz DEFAULT now()
    );
  `);
}

async function appliedVersions() {
  const { rows } = await client.query(
    'SELECT version FROM supabase_migrations.schema_migrations',
  );
  return new Set(rows.map((r) => r.version));
}

async function main() {
  await client.connect();
  await ensureMigrationsTable();
  const done = await appliedVersions();

  let count = 0;
  for (const file of files) {
    const version = file.split('_')[0];
    if (done.has(version)) {
      console.log(`skip  ${file}`);
      continue;
    }

    const sql = readFileSync(join(migrationsDir, file), 'utf8');
    console.log(`apply ${file} ...`);
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query(
        `INSERT INTO supabase_migrations.schema_migrations (version, name)
         VALUES ($1, $2) ON CONFLICT (version) DO NOTHING`,
        [version, file],
      );
      await client.query('COMMIT');
      console.log(`  ok   ${file}`);
      count++;
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`  fail ${file}:`, err.message);
      process.exit(1);
    }
  }

  await client.end();
  console.log(count ? `\nApplied ${count} migration(s).` : '\nAll migrations already applied.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
