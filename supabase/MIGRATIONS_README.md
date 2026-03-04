# Database Migrations

## How to Apply Migrations to Your Supabase Project

Since you're using Supabase Cloud (not local Docker), you need to run these migrations manually in the Supabase SQL Editor.

### Steps:

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/YOUR_PROJECT_ID

2. Navigate to **SQL Editor** in the left sidebar

3. Run the migrations **in order**:

#### Migration 1: Initial Schema
- Open: `supabase/migrations/20251008000001_initial_schema.sql`
- Copy all contents
- Paste in SQL Editor
- Click "Run" or press Ctrl+Enter
- ✅ Should see: "Success. No rows returned"

#### Migration 2: RLS Policies  
- Open: `supabase/migrations/20251008000002_rls_policies.sql`
- Copy all contents
- Paste in SQL Editor
- Click "Run"
- ✅ Should see: "Success. No rows returned"

#### Migration 3: Seed Emission Factors
- Open: `supabase/migrations/20251008000003_seed_emission_factors.sql`
- Copy all contents
- Paste in SQL Editor
- Click "Run"
- ✅ Should see: "INSERT 0 13" (13 rows inserted)

### Verify Migrations

After running all migrations, verify the tables were created:

```sql
-- Run this in SQL Editor to check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see:
- companies
- emission_data
- emission_factors
- locations
- reports
- users

### Create Your First Admin User

After migrations, you need to:

1. Sign up in the app (or create user in Supabase Auth dashboard)
2. Then run this SQL to make yourself an admin:

```sql
-- Replace YOUR_USER_ID with your actual auth user ID
-- Find it in: Authentication > Users > copy the ID column
INSERT INTO users (id, first_name, last_name, role, is_active)
VALUES (
  'YOUR_USER_ID',
  'Your',
  'Name',
  'admin',
  true
);
```

### Troubleshooting

**Error: "extension uuid-ossp does not exist"**
- Enable the extension: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`

**Error: "relation auth.users does not exist"**
- This shouldn't happen in Supabase Cloud (auth schema exists by default)

**Error: "permission denied"**
- Make sure you're logged in as the project owner/admin

### Next Steps

After migrations are applied, you can:
1. Start the Next.js dev server: `npm run dev`
2. Create your first company
3. Start entering emission data

---

---

## NEW: Scope 3 Migrations (2025-02-27)

### Migration 12: Scope 3 Foundation
**File:** `20250227000000_scope3_foundation.sql`

**What it does:**
- Extends `emission_factors` table with versioning (factor_version, source_name, geography, scope3_category, method_tier, valid dates)
- Creates 6 new tables for Scope 3:
  - `import_batches` - Track CSV import batches
  - `transactions` - Financial transactions for Scope 3
  - `classification_rules` - Auto-classification rules
  - `transaction_classifications` - Transaction → category mapping
  - `scope3_activity_entries` - Survey data (travel, commuting, etc.)
  - `calculated_emissions` - Materialized emission results
- Updates `emission_data` to support Scope 3
- Updates `reports` table with Scope 3 fields

**Run this:**
```sql
-- Copy and paste contents of 20250227000000_scope3_foundation.sql
```

### Migration 13: Scope 3 RLS Policies
**File:** `20250227000001_scope3_rls_policies.sql`

**What it does:**
- Adds Row Level Security policies for all 6 new tables
- Ensures company data isolation for Scope 3 data
- Admins can see all data, users see only their company

**Run this:**
```sql
-- Copy and paste contents of 20250227000001_scope3_rls_policies.sql
```

### Migration 14: Seed Scope 3 Emission Factors
**File:** `20250227000002_seed_scope3_factors.sql`

**What it does:**
- Seeds ~80 Scope 3 emission factors:
  - **Cat 1:** 23 spend-based factors (office supplies, services, materials)
  - **Cat 4:** 6 transport factors (road, rail, sea, air freight)
  - **Cat 5:** 6 waste factors (landfill, recycling, composting)
  - **Cat 6:** 23 business travel factors (flights, hotels, car rental)
  - **Cat 7:** 22 commuting factors (car, metro, bus, tram)
- Sources: EXIOBASE v3 (EU), DEFRA 2024, Bulgarian data

**Run this:**
```sql
-- Copy and paste contents of 20250227000002_seed_scope3_factors.sql
```

✅ **Expected result:** `INSERT 0 80` (80 emission factors inserted)

---

## Verify Scope 3 Setup

After running all 3 new migrations, verify:

```sql
-- Check all tables exist (should show 13 tables now)
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Expected tables:
-- calculated_emissions (NEW)
-- classification_rules (NEW)
-- companies
-- emission_data
-- emission_factors
-- import_batches (NEW)
-- locations
-- reports
-- scope3_activity_entries (NEW)
-- transaction_classifications (NEW)
-- transactions (NEW)
-- users

-- Check Scope 3 factors were seeded
SELECT 
  scope3_category, 
  COUNT(*) as factor_count
FROM emission_factors 
WHERE scope = 3
GROUP BY scope3_category
ORDER BY scope3_category;

-- Expected output:
-- Cat 1: 23 factors
-- Cat 4: 6 factors
-- Cat 5: 6 factors
-- Cat 6: 23 factors
-- Cat 7: 22 factors
```

---

## Future Migrations

When adding new migrations:
- Name format: `YYYYMMDDHHMMSS_description.sql`
- Run them in chronological order
- Document changes here
