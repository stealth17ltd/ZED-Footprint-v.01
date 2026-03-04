# ZED Carbon Footprint - Complete Development Guide

## Table of Contents
1. [Project Overview & Decisions](#project-overview--decisions)
2. [Project Setup](#project-setup)
3. [Phase 1: Foundation (Weeks 1-8)](#phase-1-foundation)
4. [Phase 2: Core Features (Weeks 9-16)](#phase-2-core-features)
5. [Phase 3: Reports & Polish (Weeks 17-24)](#phase-3-reports--polish)
6. [Testing & Local Deployment](#testing--local-deployment)
7. [Maintenance & Updates](#maintenance--updates)

---

## Project Overview & Decisions

### Key Decisions for MVP
Based on PRD analysis and team decisions:

✅ **CONFIRMED FOR MVP:**
- Single location per company (multi-location in Phase 2)
- Manual data entry + Excel/CSV import only
- PDF reports (compliance, internal, certificates)
- Local development with Supabase
- Service-based pricing model
- Bulgarian language only

❌ **DEFERRED TO PHASE 2:**
- PDF OCR processing → **Google Cloud Vision API** (chosen for excellent Bulgarian support)
- AI-powered strategy generation → OpenAI API
- Multi-location support
- Cloud deployment (Vercel)

❌ **DEFERRED TO PHASE 3+:**
- System integrations (Microinvest, SAP)
- Scope 3 emissions
- Mobile apps

### Technology Stack Confirmed
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL) - Local for MVP
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod
- **OCR (Phase 2)**: Google Cloud Vision API
- **AI (Phase 2)**: OpenAI GPT-4

---

## Project Setup

### Step 1: Initialize Next.js Project

```bash
# Create Next.js project with TypeScript and Tailwind
npx create-next-app@latest zed-carbon --typescript --tailwind --app --use-npm

cd zed-carbon

# Install core dependencies
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install react-hook-form @hookform/resolvers zod
npm install recharts lucide-react date-fns
npm install sonner # Toast notifications
npm install @tanstack/react-query # Server state management

# Install shadcn/ui
npx shadcn-ui@latest init

# Install dev dependencies
npm install -D @types/node @types/react
```

### Step 2: Configure Supabase (Local Development)

For MVP, we'll use Supabase locally with Docker. This allows full development without cloud costs.

```bash
# Install Supabase CLI globally
npm install -g supabase

# Initialize Supabase in your project
supabase init

# Start local Supabase instance (requires Docker Desktop)
supabase start
```

**After `supabase start` completes, you'll see:**
```
API URL: http://localhost:54321
DB URL: postgresql://postgres:postgres@localhost:54322/postgres
Studio URL: http://localhost:54323
Anon key: eyJh... (long key)
Service role key: eyJh... (long key)
```

**Create `.env.local`:**
```env
# Local Supabase (from supabase start output)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... # Use the anon key from output
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... # Use service role key from output

# Phase 2 only - leave empty for MVP
OPENAI_API_KEY=
GOOGLE_CLOUD_VISION_API_KEY=
```

**Add to `.gitignore`:**
```
.env.local
.env*.local
```

**Supabase Studio Access:**
- Open http://localhost:54323 in your browser
- Visual database management
- View tables, run SQL queries, manage RLS policies
- Test authentication flows

**Important Commands:**
```bash
# Stop local Supabase
supabase stop

# Reset database (WARNING: deletes all data)
supabase db reset

# View logs
supabase logs

# Generate TypeScript types from your schema
supabase gen types typescript --local > types/supabase.ts
```

### Step 3: Configure Tailwind with ZED Colors

**Update `tailwind.config.ts`:**
```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        earth: {
          50: '#F5F5F5',
          100: '#C5E1A5',
          200: '#8BC34A',
          300: '#4A7729',
          400: '#2D5016',
        },
        brown: {
          500: '#6D4C41',
        },
        alert: {
          amber: '#FFA726',
          red: '#E53935',
          green: '#388E3C',
        },
      },
    },
  },
  plugins: [],
}
export default config
```

### Step 4: Project Structure Setup

```bash
# Create directory structure
mkdir -p app/\(auth\)/login
mkdir -p app/\(auth\)/register
mkdir -p app/\(dashboard\)/dashboard
mkdir -p app/\(dashboard\)/data-entry
mkdir -p app/\(dashboard\)/reports
mkdir -p app/\(dashboard\)/strategies
mkdir -p app/\(dashboard\)/settings
mkdir -p app/api/emissions
mkdir -p app/api/companies
mkdir -p app/api/strategies
mkdir -p app/api/reports
mkdir -p components/ui
mkdir -p components/dashboard
mkdir -p components/forms
mkdir -p components/charts
mkdir -p components/layout
mkdir -p lib/supabase
mkdir -p lib/calculations
mkdir -p lib/emissions
mkdir -p lib/utils
mkdir -p lib/i18n
mkdir -p types
mkdir -p supabase/migrations
```

### Step 5: Install shadcn/ui Components

```bash
# Install commonly used components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add form
npx shadcn-ui@latest add select
npx shadcn-ui@latest add table
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add skeleton
npx shadcn-ui@latest add tooltip
npx shadcn-ui@latest add calendar
```

---

## Phase 1: Foundation (Weeks 1-8)

### Week 1-2: Database Schema & Authentication

#### Task 1.1: Create Core Database Tables

**Create `supabase/migrations/20251008000001_initial_schema.sql`:**

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Companies table
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL,
  registration_number TEXT UNIQUE NOT NULL,
  industry_sector TEXT NOT NULL,
  employee_count INTEGER,
  location_count INTEGER DEFAULT 1,
  primary_contact_email TEXT NOT NULL,
  billing_address TEXT,
  logo_url TEXT,
  sustainability_goals TEXT,
  eu_green_deal_commitment BOOLEAN DEFAULT false,
  baseline_year INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'client')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Locations table (simplified for MVP - one location per company)
-- Multi-location support deferred to Phase 2
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  location_name TEXT NOT NULL DEFAULT 'Основна локация',
  address TEXT,
  square_meters NUMERIC,
  employee_count INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Ensure one location per company for MVP
  UNIQUE(company_id)
);

-- Emission factors table (Bulgarian/EU data)
CREATE TABLE emission_factors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL,
  subcategory TEXT,
  region TEXT DEFAULT 'Bulgaria',
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  source TEXT,
  effective_date DATE NOT NULL,
  expiry_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Emission data table
CREATE TABLE emission_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  reporting_period DATE NOT NULL,
  scope INTEGER NOT NULL CHECK (scope IN (1, 2)),
  category TEXT NOT NULL,
  subcategory TEXT,
  activity_value NUMERIC NOT NULL CHECK (activity_value >= 0),
  unit TEXT NOT NULL,
  emission_factor_id UUID REFERENCES emission_factors(id),
  emission_factor_value NUMERIC NOT NULL,
  gwp_factor NUMERIC DEFAULT 1,
  calculated_co2e NUMERIC NOT NULL,
  data_source TEXT CHECK (data_source IN ('manual', 'import', 'ocr', 'api')) DEFAULT 'manual',
  validation_status TEXT DEFAULT 'validated' CHECK (validation_status IN ('validated', 'warning', 'flagged')),
  validation_notes TEXT,
  supporting_document_url TEXT,
  notes TEXT,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_emission_data_company_id ON emission_data(company_id);
CREATE INDEX idx_emission_data_reporting_period ON emission_data(reporting_period);
CREATE INDEX idx_emission_data_scope ON emission_data(scope);
CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_locations_company_id ON locations(company_id);

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emission_data_updated_at BEFORE UPDATE ON emission_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### Task 1.2: Set Up Row Level Security (RLS)

**Create `supabase/migrations/20251008000002_rls_policies.sql`:**

```sql
-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE emission_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE emission_factors ENABLE ROW LEVEL SECURITY;

-- Companies policies
-- Clients can view their own company
CREATE POLICY "Users can view own company" ON companies
  FOR SELECT
  USING (
    id IN (SELECT company_id FROM users WHERE id = auth.uid())
  );

-- Admins can view all companies
CREATE POLICY "Admins can view all companies" ON companies
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can insert/update companies
CREATE POLICY "Admins can manage companies" ON companies
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Users policies
-- Users can view their own record
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT
  USING (id = auth.uid());

-- Users can view colleagues in same company
CREATE POLICY "Users can view company colleagues" ON users
  FOR SELECT
  USING (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
  );

-- Admins can view all users
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can manage users
CREATE POLICY "Admins can manage users" ON users
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Locations policies
-- Users can view their company's locations
CREATE POLICY "Users can view company locations" ON locations
  FOR SELECT
  USING (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
  );

-- Users can manage their company's locations
CREATE POLICY "Users can manage company locations" ON locations
  FOR ALL
  USING (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
  );

-- Emission data policies
-- Users can view their company's emission data
CREATE POLICY "Users can view company emissions" ON emission_data
  FOR SELECT
  USING (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
  );

-- Users can insert their company's emission data
CREATE POLICY "Users can add company emissions" ON emission_data
  FOR INSERT
  WITH CHECK (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
  );

-- Users can update their company's emission data
CREATE POLICY "Users can update company emissions" ON emission_data
  FOR UPDATE
  USING (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
  );

-- Emission factors policies (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view emission factors" ON emission_factors
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Admins can manage emission factors
CREATE POLICY "Admins can manage emission factors" ON emission_factors
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );
```

#### Task 1.3: Seed Initial Emission Factors

**Create `supabase/migrations/20251008000003_seed_emission_factors.sql`:**

```sql
-- Seed Bulgarian emission factors (based on PRD Appendix B)
-- Note: These are illustrative - actual values should come from official Bulgarian/EU sources

-- Fuels (Scope 1)
INSERT INTO emission_factors (category, subcategory, region, value, unit, source, effective_date)
VALUES
  ('fuel', 'petrol', 'Bulgaria', 2.31, 'kg CO2e per liter', 'EU ETS', '2025-01-01'),
  ('fuel', 'diesel', 'Bulgaria', 2.68, 'kg CO2e per liter', 'EU ETS', '2025-01-01'),
  ('fuel', 'natural_gas', 'Bulgaria', 0.185, 'kg CO2e per kWh', 'EU ETS', '2025-01-01'),
  ('fuel', 'lpg', 'Bulgaria', 1.51, 'kg CO2e per liter', 'EU ETS', '2025-01-01'),
  ('fuel', 'coal', 'Bulgaria', 2.42, 'kg CO2e per kg', 'EU ETS', '2025-01-01');

-- Electricity (Scope 2)
INSERT INTO emission_factors (category, subcategory, region, value, unit, source, effective_date)
VALUES
  ('electricity', 'grid_standard', 'Bulgaria', 0.48, 'kg CO2e per kWh', 'Bulgarian Energy Authority', '2025-01-01'),
  ('electricity', 'renewable', 'Bulgaria', 0.02, 'kg CO2e per kWh', 'Bulgarian Energy Authority', '2025-01-01');

-- District heating/cooling (Scope 2)
INSERT INTO emission_factors (category, subcategory, region, value, unit, source, effective_date)
VALUES
  ('heating', 'district_heating', 'Bulgaria', 0.25, 'kg CO2e per kWh', 'Bulgarian Energy Authority', '2025-01-01'),
  ('heating', 'district_cooling', 'Bulgaria', 0.18, 'kg CO2e per kWh', 'Bulgarian Energy Authority', '2025-01-01');

-- Refrigerants (Scope 1) - GWP values
INSERT INTO emission_factors (category, subcategory, region, value, unit, source, effective_date)
VALUES
  ('refrigerant', 'R-410A', 'Global', 2088, 'GWP factor', 'IPCC AR5', '2025-01-01'),
  ('refrigerant', 'R-32', 'Global', 675, 'GWP factor', 'IPCC AR5', '2025-01-01'),
  ('refrigerant', 'R-134a', 'Global', 1430, 'GWP factor', 'IPCC AR5', '2025-01-01'),
  ('refrigerant', 'R-404A', 'Global', 3922, 'GWP factor', 'IPCC AR5', '2025-01-01');
```

#### Task 1.4: Apply Migrations

```bash
# Push migrations to Supabase
supabase db push

# Generate TypeScript types
supabase gen types typescript --local > types/supabase.ts
```

#### Task 1.5: Create Supabase Client Utilities

**Create `lib/supabase/client.ts`:**

```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

export const createClient = () => createClientComponentClient<Database>();
```

**Create `lib/supabase/server.ts`:**

```typescript
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

export const createServerClient = () => {
  return createServerComponentClient<Database>({ cookies });
};
```

**Create `lib/supabase/service.ts`:**

```typescript
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Service role client - use only in API routes for admin operations
export const createServiceClient = () => {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
};
```

### Week 3-4: Authentication System

#### Task 2.1: Create Type Definitions

**Create `types/index.ts`:**

```typescript
export interface User {
  id: string;
  company_id: string | null;
  first_name: string;
  last_name: string;
  role: 'admin' | 'client';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  company_name: string;
  registration_number: string;
  industry_sector: string;
  employee_count: number | null;
  location_count: number;
  primary_contact_email: string;
  billing_address: string | null;
  logo_url: string | null;
  sustainability_goals: string | null;
  eu_green_deal_commitment: boolean;
  baseline_year: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmissionData {
  id: string;
  company_id: string;
  location_id: string | null;
  reporting_period: string;
  scope: 1 | 2;
  category: string;
  subcategory: string | null;
  activity_value: number;
  unit: string;
  emission_factor_id: string | null;
  emission_factor_value: number;
  gwp_factor: number;
  calculated_co2e: number;
  data_source: 'manual' | 'import' | 'ocr' | 'api';
  validation_status: 'validated' | 'warning' | 'flagged';
  validation_notes: string | null;
  supporting_document_url: string | null;
  notes: string | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmissionFactor {
  id: string;
  category: string;
  subcategory: string | null;
  region: string;
  value: number;
  unit: string;
  source: string | null;
  effective_date: string;
  expiry_date: string | null;
  created_at: string;
}
```

#### Task 2.2: Create Bulgarian Text Resources

**Create `lib/i18n/bg.ts`:**

```typescript
export const bg = {
  auth: {
    login: 'Вход',
    logout: 'Изход',
    email: 'Имейл',
    password: 'Парола',
    rememberMe: 'Запомни ме',
    forgotPassword: 'Забравена парола?',
    loginButton: 'Влез',
    loginError: 'Грешен имейл или парола',
    loginSuccess: 'Успешен вход',
  },
  common: {
    save: 'Запази',
    cancel: 'Откажи',
    delete: 'Изтрий',
    edit: 'Редактирай',
    add: 'Добави',
    search: 'Търси',
    filter: 'Филтрирай',
    export: 'Експортирай',
    loading: 'Зареждане...',
    error: 'Възникна грешка',
    success: 'Успешно',
  },
  dashboard: {
    title: 'Табло',
    totalFootprint: 'Общ въглероден отпечатък',
    scope1: 'Обхват 1',
    scope2: 'Обхват 2',
    trend: 'Тенденция',
    thisMonth: 'Този месец',
    lastMonth: 'Миналия месец',
    yearToDate: 'От началото на годината',
  },
  emissions: {
    addData: 'Добави данни',
    reportingPeriod: 'Отчетен период',
    category: 'Категория',
    activityValue: 'Стойност',
    unit: 'Мерна единица',
    calculatedEmissions: 'Изчислени емисии',
    scope1Categories: {
      vehicles: 'Превозни средства',
      onSiteFuel: 'Гориво на място',
      refrigerants: 'Хладилни агенти',
    },
    scope2Categories: {
      electricity: 'Електричество',
      districtHeating: 'Топлофикация',
      districtCooling: 'Охлаждане',
    },
  },
  reports: {
    generate: 'Генерирай доклад',
    complianceReport: 'Доклад за съответствие',
    internalReport: 'Вътрешен доклад',
    certificate: 'Сертификат',
    dateRange: 'Период',
    downloadPDF: 'Изтегли PDF',
    downloadExcel: 'Изтегли Excel',
  },
  validation: {
    required: 'Това поле е задължително',
    positiveNumber: 'Стойността трябва да е положителна',
    invalidEmail: 'Невалиден имейл адрес',
    unusualValue: 'Стойността е необичайна. Моля, проверете.',
    significantChange: 'Значителна промяна спрямо предишния период. Моля, добавете обяснение.',
  },
};

export type TranslationKey = typeof bg;
```

#### Task 2.3: Create Login Page

**Create `app/(auth)/login/page.tsx`:**

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { bg } from '@/lib/i18n/bg';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success(bg.auth.loginSuccess);
      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      console.error('Login error:', error);
      toast.error(bg.auth.loginError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-earth-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-earth-300 rounded-full flex items-center justify-center">
              <span className="text-2xl text-white font-bold">ZED</span>
            </div>
          </div>
          <CardTitle className="text-2xl text-center">
            ZED Carbon Footprint
          </CardTitle>
          <p className="text-center text-sm text-gray-600">
            Управление на въглеродния отпечатък
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{bg.auth.email}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{bg.auth.password}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-earth-300 hover:bg-earth-400"
              disabled={loading}
            >
              {loading ? bg.common.loading : bg.auth.loginButton}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

#### Task 2.4: Create Middleware for Auth Protection

**Create `middleware.ts` in root:**

```typescript
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Redirect to login if not authenticated
  if (!session && !req.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Redirect to dashboard if authenticated and trying to access login
  if (session && req.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
};
```

### Week 5-6: Company Management & User Profiles

#### Task 3.1: Create Admin API for Company Creation

**Create `app/api/admin/companies/route.ts`:**

```typescript
import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { z } from 'zod';

const createCompanySchema = z.object({
  company_name: z.string().min(1),
  registration_number: z.string().min(1),
  industry_sector: z.string().min(1),
  employee_count: z.number().positive().optional(),
  primary_contact_email: z.string().email(),
  billing_address: z.string().optional(),
  eu_green_deal_commitment: z.boolean().default(false),
  baseline_year: z.number().optional(),
});

export async function POST(request: Request) {
  try {
    const supabase = createServiceClient();
    
    // Verify admin role
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate input
    const body = await request.json();
    const validatedData = createCompanySchema.parse(body);

    // Create company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert(validatedData)
      .select()
      .single();

    if (companyError) throw companyError;

    // Create default location
    await supabase.from('locations').insert({
      company_id: company.id,
      location_name: 'Основна локация',
      is_active: true,
    });

    return NextResponse.json({ data: company });
  } catch (error) {
    console.error('Error creating company:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const supabase = createServiceClient();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    const { data, error } = await supabase
      .from('companies')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .order('company_name')
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

#### Task 3.2: Create Company Profile Page

**Create `app/(dashboard)/settings/company/page.tsx`:**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Company } from '@/types';
import { bg } from '@/lib/i18n/bg';

export default function CompanyProfilePage() {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchCompany();
  }, []);

  const fetchCompany = async () => {
    try {
      // Get current user's company
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (userData?.company_id) {
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .eq('id', userData.company_id)
          .single();

        if (error) throw error;
        setCompany(data);
      }
    } catch (error) {
      console.error('Error fetching company:', error);
      toast.error('Грешка при зареждане на данните');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Зареждане...</div>;
  }

  if (!company) {
    return <div>Няма намерена компания</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Профил на компанията</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Основна информация</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Име на компанията</Label>
              <Input value={company.company_name} disabled />
            </div>
            <div>
              <Label>ЕИК</Label>
              <Input value={company.registration_number} disabled />
            </div>
            <div>
              <Label>Сектор</Label>
              <Input value={company.industry_sector} disabled />
            </div>
            <div>
              <Label>Брой служители</Label>
              <Input value={company.employee_count || '-'} disabled />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Цели за устойчивост</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            {company.sustainability_goals || 'Не са дефинирани цели'}
          </p>
          <div className="mt-4">
            <Label>Ангажимент към EU Green Deal</Label>
            <p className="text-sm">
              {company.eu_green_deal_commitment ? 'Да' : 'Не'}
            </p>
          </div>
          <div className="mt-4">
            <Label>Базова година</Label>
            <p className="text-sm">{company.baseline_year || '-'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Week 7-8: Dashboard Layout & Navigation

#### Task 4.1: Create Main Layout Component

**Create `app/(dashboard)/layout.tsx`:**

```typescript
import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen flex bg-earth-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
```

#### Task 4.2: Create Sidebar Component

**Create `components/layout/Sidebar.tsx`:**

```typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  TrendingUp,
  Settings,
  HelpCircle,
  PlusCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Табло', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Добави данни', href: '/data-entry', icon: PlusCircle },
  { name: 'Доклади', href: '/reports', icon: FileText },
  { name: 'Стратегии', href: '/strategies', icon: TrendingUp },
  { name: 'Настройки', href: '/settings', icon: Settings },
  { name: 'Помощ', href: '/help', icon: HelpCircle },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-earth-300 rounded-full flex items-center justify-center">
            <span className="text-white font-bold">ZED</span>
          </div>
          <div>
            <h2 className="font-bold text-lg">ZED Carbon</h2>
            <p className="text-xs text-gray-500">Footprint Manager</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors',
                isActive
                  ? 'bg-earth-200 text-earth-400 font-medium'
                  : 'text-gray-600 hover:bg-earth-50'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          © 2025 ZED Carbon Footprint
        </p>
      </div>
    </div>
  );
}
```

#### Task 4.3: Create Header Component

**Create `components/layout/Header.tsx`:**

```typescript
'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { bg } from '@/lib/i18n/bg';

export default function Header() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success(bg.auth.logout);
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Грешка при излизане');
    }
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div>
        <h1 className="text-xl font-semibold">Добре дошли</h1>
      </div>

      <div className="flex items-center space-x-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <User className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Моят профил</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/settings')}>
              Настройки
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              {bg.auth.logout}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
```

---

## Phase 2: Core Features (Weeks 9-16)

### Week 9-10: Emissions Calculation Engine

#### Task 5.1: Create Calculation Utilities

**Create `lib/calculations/emissions.ts`:**

```typescript
import { EmissionFactor } from '@/types';

export interface CalculationParams {
  activityValue: number;
  emissionFactor: number;
  gwpFactor?: number;
  unit: string;
}

export interface CalculationResult {
  co2e: number;
  scope: 1 | 2;
  breakdown: {
    activityValue: number;
    emissionFactor: number;
    gwpFactor: number;
    calculatedCO2e: number;
    unit: string;
  };
}

/**
 * Calculate CO2e emissions based on activity data and emission factors
 * Formula: CO2e = Activity Value × Emission Factor × GWP Factor
 * 
 * @param params - Calculation parameters
 * @returns Calculated CO2e in metric tons
 */
export function calculateEmissions(params: CalculationParams): number {
  const { activityValue, emissionFactor, gwpFactor = 1 } = params;
  
  // Formula: CO2e = Activity × Emission Factor × GWP
  const result = activityValue * emissionFactor * gwpFactor;
  
  // Round to 2 decimal places
  return Math.round(result * 100) / 100;
}

/**
 * Calculate total emissions for a reporting period
 */
export function calculateTotalEmissions(
  emissionDataArray: Array<{
    calculated_co2e: number;
    scope: 1 | 2;
  }>
): {
  scope1: number;
  scope2: number;
  total: number;
} {
  const scope1 = emissionDataArray
    .filter((e) => e.scope === 1)
    .reduce((sum, e) => sum + e.calculated_co2e, 0);

  const scope2 = emissionDataArray
    .filter((e) => e.scope === 2)
    .reduce((sum, e) => sum + e.calculated_co2e, 0);

  return {
    scope1: Math.round(scope1 * 100) / 100,
    scope2: Math.round(scope2 * 100) / 100,
    total: Math.round((scope1 + scope2) * 100) / 100,
  };
}

/**
 * Get appropriate emission factor for given category and subcategory
 */
export async function getEmissionFactor(
  category: string,
  subcategory: string,
  factors: EmissionFactor[]
): Promise<EmissionFactor | null> {
  const now = new Date();
  
  // Find active emission factor
  const factor = factors.find(
    (f) =>
      f.category === category &&
      f.subcategory === subcategory &&
      new Date(f.effective_date) <= now &&
      (!f.expiry_date || new Date(f.expiry_date) >= now)
  );
  
  return factor || null;
}

/**
 * Convert units if necessary
 */
export function convertUnit(
  value: number,
  fromUnit: string,
  toUnit: string
): number {
  // MWh to kWh
  if (fromUnit === 'MWh' && toUnit === 'kWh') {
    return value * 1000;
  }
  
  // m³ to kWh for natural gas (assuming 10.55 kWh per m³)
  if (fromUnit === 'm³' && toUnit === 'kWh') {
    return value * 10.55;
  }
  
  // Add more conversions as needed
  
  return value;
}
```

#### Task 5.2: Create Validation Utilities

**Create `lib/calculations/validation.ts`:**

```typescript
export interface ValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
}

export interface EmissionDataInput {
  activityValue: number;
  category: string;
  reportingPeriod: Date;
  notes?: string;
}

export interface PreviousData {
  activityValue: number;
  reportingPeriod: Date;
}

/**
 * Validate emission data entry
 */
export function validateEmissionData(
  data: EmissionDataInput,
  previousData?: PreviousData
): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Range checks
  if (data.activityValue < 0) {
    errors.push('Стойността не може да бъде отрицателна');
  }

  if (data.activityValue === 0) {
    warnings.push('Стойността е нула. Проверете дали това е правилно.');
  }

  // Unreasonably high values (category-specific)
  const maxValues: Record<string, number> = {
    electricity: 1000000, // kWh per month
    petrol: 50000, // liters per month
    diesel: 50000,
    natural_gas: 100000, // kWh per month
  };

  const maxValue = maxValues[data.category];
  if (maxValue && data.activityValue > maxValue) {
    warnings.push(
      `Стойността е необичайно висока за категория ${data.category}. Моля, проверете.`
    );
  }

  // Period-over-period comparison
  if (previousData) {
    const changePercent = Math.abs(
      ((data.activityValue - previousData.activityValue) /
        previousData.activityValue) *
        100
    );

    if (changePercent > 30) {
      warnings.push(
        `Данните се различават с ${changePercent.toFixed(
          1
        )}% от предишния период. Моля, предоставете обяснение.`
      );
    }
  }

  // Require notes for flagged data
  if (warnings.length > 0 && !data.notes) {
    errors.push(
      'Задължително обяснение за необичайни стойности'
    );
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors,
  };
}

/**
 * Get validation status based on validation result
 */
export function getValidationStatus(
  result: ValidationResult
): 'validated' | 'warning' | 'flagged' {
  if (!result.valid) return 'flagged';
  if (result.warnings.length > 0) return 'warning';
  return 'validated';
}
```

### Week 11-12: Data Entry Forms

#### Task 6.1: Create Emission Data Entry Form

**Create `app/(dashboard)/data-entry/page.tsx`:**

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { calculateEmissions } from '@/lib/calculations/emissions';
import { validateEmissionData } from '@/lib/calculations/validation';
import { EmissionFactor } from '@/types';
import { bg } from '@/lib/i18n/bg';

const emissionDataSchema = z.object({
  reportingPeriod: z.string(),
  scope: z.enum(['1', '2']),
  category: z.string().min(1, 'Изберете категория'),
  activityValue: z.number().positive('Стойността трябва да е положителна'),
  unit: z.string().min(1),
  notes: z.string().optional(),
});

type EmissionDataForm = z.infer<typeof emissionDataSchema>;

export default function DataEntryPage() {
  const [emissionFactors, setEmissionFactors] = useState<EmissionFactor[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [calculatedCO2e, setCalculatedCO2e] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<EmissionDataForm>({
    resolver: zodResolver(emissionDataSchema),
  });

  const activityValue = watch('activityValue');
  const category = watch('category');

  useEffect(() => {
    fetchEmissionFactors();
  }, []);

  useEffect(() => {
    if (activityValue && category) {
      calculatePreview();
    }
  }, [activityValue, category]);

  const fetchEmissionFactors = async () => {
    try {
      const { data, error } = await supabase
        .from('emission_factors')
        .select('*')
        .order('category');

      if (error) throw error;
      setEmissionFactors(data);
    } catch (error) {
      console.error('Error fetching emission factors:', error);
    }
  };

  const calculatePreview = () => {
    const factor = emissionFactors.find(
      (f) => `${f.category}_${f.subcategory}` === category
    );

    if (factor && activityValue) {
      const co2e = calculateEmissions({
        activityValue: parseFloat(activityValue.toString()),
        emissionFactor: factor.value,
        gwpFactor: 1,
        unit: factor.unit,
      });
      setCalculatedCO2e(co2e);
    }
  };

  const onSubmit = async (data: EmissionDataForm) => {
    setLoading(true);

    try {
      // Get current user's company
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: userData } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!userData?.company_id) throw new Error('No company found');

      // Find emission factor
      const factor = emissionFactors.find(
        (f) => `${f.category}_${f.subcategory}` === data.category
      );

      if (!factor) throw new Error('Emission factor not found');

      // Calculate emissions
      const co2e = calculateEmissions({
        activityValue: data.activityValue,
        emissionFactor: factor.value,
        unit: factor.unit,
      });

      // Validate data
      const validation = validateEmissionData({
        activityValue: data.activityValue,
        category: data.category,
        reportingPeriod: new Date(data.reportingPeriod),
        notes: data.notes,
      });

      if (!validation.valid) {
        throw new Error(validation.errors.join(', '));
      }

      // Insert emission data
      const { error: insertError } = await supabase
        .from('emission_data')
        .insert({
          company_id: userData.company_id,
          reporting_period: data.reportingPeriod,
          scope: parseInt(data.scope),
          category: factor.category,
          subcategory: factor.subcategory,
          activity_value: data.activityValue,
          unit: data.unit,
          emission_factor_id: factor.id,
          emission_factor_value: factor.value,
          gwp_factor: 1,
          calculated_co2e: co2e,
          data_source: 'manual',
          validation_status: validation.warnings.length > 0 ? 'warning' : 'validated',
          validation_notes: validation.warnings.join('; '),
          notes: data.notes,
          uploaded_by: user.id,
        });

      if (insertError) throw insertError;

      toast.success('Данните са запазени успешно!');
      
      // Show warnings if any
      if (validation.warnings.length > 0) {
        validation.warnings.forEach((warning) => toast.warning(warning));
      }
    } catch (error) {
      console.error('Error saving emission data:', error);
      toast.error('Грешка при запазване на данните');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Добавяне на данни за емисии</h1>

      <Card>
        <CardHeader>
          <CardTitle>Нови данни</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reportingPeriod">
                  Отчетен период
                </Label>
                <Input
                  id="reportingPeriod"
                  type="month"
                  {...register('reportingPeriod')}
                />
                {errors.reportingPeriod && (
                  <p className="text-sm text-red-500">
                    {errors.reportingPeriod.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="scope">Обхват</Label>
                <Select {...register('scope')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Изберете обхват" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Обхват 1</SelectItem>
                    <SelectItem value="2">Обхват 2</SelectItem>
                  </SelectContent>
                </Select>
                {errors.scope && (
                  <p className="text-sm text-red-500">
                    {errors.scope.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Категория</Label>
                <Select {...register('category')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Изберете категория" />
                  </SelectTrigger>
                  <SelectContent>
                    {emissionFactors.map((factor) => (
                      <SelectItem
                        key={factor.id}
                        value={`${factor.category}_${factor.subcategory}`}
                      >
                        {factor.category} - {factor.subcategory}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-sm text-red-500">
                    {errors.category.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="activityValue">Стойност</Label>
                <Input
                  id="activityValue"
                  type="number"
                  step="0.01"
                  {...register('activityValue', { valueAsNumber: true })}
                />
                {errors.activityValue && (
                  <p className="text-sm text-red-500">
                    {errors.activityValue.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Бележки</Label>
              <Textarea
                id="notes"
                placeholder="Добавете бележки или обяснения..."
                {...register('notes')}
              />
            </div>

            {calculatedCO2e !== null && (
              <div className="p-4 bg-earth-50 rounded-lg">
                <p className="text-sm text-gray-600">Изчислени емисии</p>
                <p className="text-2xl font-bold text-earth-400">
                  {calculatedCO2e.toFixed(2)} kg CO2e
                </p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-earth-300 hover:bg-earth-400"
              disabled={loading}
            >
              {loading ? 'Запазване...' : 'Запази данните'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Week 13-14: Dashboard with Visualizations

#### Task 7.1: Create Dashboard Stats Component

**Create `components/dashboard/StatsCard.tsx`:**

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: LucideIcon;
  trend?: 'up' | 'down';
}

export default function StatsCard({
  title,
  value,
  change,
  icon: Icon,
  trend,
}: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        <Icon className="w-4 h-4 text-earth-300" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <p
            className={`text-xs ${
              trend === 'down' ? 'text-alert-green' : 'text-alert-amber'
            }`}
          >
            {change > 0 ? '+' : ''}
            {change}% спрямо миналия месец
          </p>
        )}
      </CardContent>
    </Card>
  );
}
```

#### Task 7.2: Create Dashboard Page

**Create `app/(dashboard)/dashboard/page.tsx`:**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import StatsCard from '@/components/dashboard/StatsCard';
import EmissionTrendChart from '@/components/dashboard/EmissionTrendChart';
import EmissionBreakdownChart from '@/components/dashboard/EmissionBreakdownChart';
import { TrendingDown, Zap, Fuel, Activity } from 'lucide-react';
import { calculateTotalEmissions } from '@/lib/calculations/emissions';

export default function DashboardPage() {
  const [totalEmissions, setTotalEmissions] = useState({ scope1: 0, scope2: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!userData?.company_id) return;

      // Fetch current month's emissions
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const { data: emissions, error } = await supabase
        .from('emission_data')
        .select('calculated_co2e, scope')
        .eq('company_id', userData.company_id)
        .gte('reporting_period', firstDayOfMonth.toISOString().split('T')[0]);

      if (error) throw error;

      const totals = calculateTotalEmissions(emissions);
      setTotalEmissions(totals);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Зареждане...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Табло</h1>
        <p className="text-gray-600">Преглед на вашия въглероден отпечатък</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard
          title="Общ отпечатък"
          value={`${totalEmissions.total.toFixed(2)} t`}
          icon={Activity}
          change={-8.5}
          trend="down"
        />
        <StatsCard
          title="Обхват 1"
          value={`${totalEmissions.scope1.toFixed(2)} t`}
          icon={Fuel}
        />
        <StatsCard
          title="Обхват 2"
          value={`${totalEmissions.scope2.toFixed(2)} t`}
          icon={Zap}
        />
        <StatsCard
          title="Тенденция"
          value="Намаляване"
          icon={TrendingDown}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EmissionTrendChart companyId={userData?.company_id} />
        <EmissionBreakdownChart companyId={userData?.company_id} />
      </div>
    </div>
  );
}
```

---

## Phase 3: Reports & Polish (Weeks 17-24)

### Week 17-18: Report Generation System

#### Task 8.1: Create PDF Report Generator

**Create `lib/reports/pdf-generator.ts`:**

```typescript
import { jsPDF } from 'jspdf';
import { Company, EmissionData } from '@/types';

export interface ComplianceReportData {
  company: Company;
  reportingPeriod: { start: Date; end: Date };
  emissions: EmissionData[];
  totalScope1: number;
  totalScope2: number;
  totalCombined: number;
}

export async function generateComplianceReport(
  data: ComplianceReportData
): Promise<Blob> {
  const pdf = new jsPDF();

  // Add company logo if available
  // pdf.addImage(data.company.logo_url, 'PNG', 10, 10, 50, 20);

  // Title
  pdf.setFontSize(20);
  pdf.text('Доклад за съответствие', 105, 40, { align: 'center' });
  pdf.setFontSize(14);
  pdf.text('Доклад за въглеродния отпечатък', 105, 50, { align: 'center' });

  // Company information
  pdf.setFontSize(12);
  pdf.text(`Компания: ${data.company.company_name}`, 20, 70);
  pdf.text(`ЕИК: ${data.company.registration_number}`, 20, 80);
  pdf.text(
    `Период: ${formatDate(data.reportingPeriod.start)} - ${formatDate(
      data.reportingPeriod.end
    )}`,
    20,
    90
  );

  // Emissions summary
  pdf.setFontSize(14);
  pdf.text('Резюме на емисиите', 20, 110);
  pdf.setFontSize(12);
  pdf.text(
    `Обхват 1 (Директни емисии): ${data.totalScope1.toFixed(2)} tCO2e`,
    20,
    120
  );
  pdf.text(
    `Обхват 2 (Индиректни емисии): ${data.totalScope2.toFixed(2)} tCO2e`,
    20,
    130
  );
  pdf.setFontSize(14);
  pdf.text(
    `Общо: ${data.totalCombined.toFixed(2)} tCO2e`,
    20,
    140
  );

  // Methodology statement
  pdf.setFontSize(10);
  pdf.text('Методология:', 20, 160);
  pdf.text(
    'Изчисленията са направени в съответствие с GHG Protocol Scope 1 & 2.',
    20,
    170
  );
  pdf.text(
    'Използвани са емисионни фактори от официални български и EU източници.',
    20,
    180
  );

  // Footer
  pdf.setFontSize(8);
  pdf.text(
    `Генериран от ZED Carbon Footprint на ${new Date().toLocaleDateString(
      'bg-BG'
    )}`,
    105,
    280,
    { align: 'center' }
  );

  return pdf.output('blob');
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('bg-BG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
```

#### Task 8.2: Create Reports API Route

**Create `app/api/reports/generate/route.ts`:**

```typescript
import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { generateComplianceReport } from '@/lib/reports/pdf-generator';
import { calculateTotalEmissions } from '@/lib/calculations/emissions';

export async function POST(request: Request) {
  try {
    const supabase = createServiceClient();
    const body = await request.json();
    const { companyId, startDate, endDate, reportType } = body;

    // Validate input
    if (!companyId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Fetch company data
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (companyError) throw companyError;

    // Fetch emissions data
    const { data: emissions, error: emissionsError } = await supabase
      .from('emission_data')
      .select('*')
      .eq('company_id', companyId)
      .gte('reporting_period', startDate)
      .lte('reporting_period', endDate);

    if (emissionsError) throw emissionsError;

    // Calculate totals
    const totals = calculateTotalEmissions(emissions);

    // Generate PDF
    const pdfBlob = await generateComplianceReport({
      company,
      reportingPeriod: {
        start: new Date(startDate),
        end: new Date(endDate),
      },
      emissions,
      totalScope1: totals.scope1,
      totalScope2: totals.scope2,
      totalCombined: totals.total,
    });

    // Convert blob to buffer
    const buffer = Buffer.from(await pdfBlob.arrayBuffer());

    // Save report record
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .insert({
        company_id: companyId,
        report_type: reportType,
        reporting_period: startDate,
        format: 'PDF',
      })
      .select()
      .single();

    if (reportError) throw reportError;

    // Return PDF
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="compliance-report-${companyId}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## Testing & Local Deployment

### Unit Testing Setup

**Install testing dependencies:**
```bash
npm install -D jest @testing-library/react @testing-library/jest-dom jest-environment-jsdom
```

**Create `jest.config.js`:**
```javascript
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  preset: 'ts-jest',
};

module.exports = createJestConfig(customJestConfig);
```

**Create `jest.setup.js`:**
```javascript
import '@testing-library/jest-dom';
```

**Example test: `lib/calculations/__tests__/emissions.test.ts`:**
```typescript
import { calculateEmissions, calculateTotalEmissions } from '../emissions';

describe('Emissions Calculations', () => {
  describe('calculateEmissions', () => {
    it('should calculate CO2e correctly', () => {
      const result = calculateEmissions({
        activityValue: 100,
        emissionFactor: 2.31,
        gwpFactor: 1,
        unit: 'liters',
      });

      expect(result).toBe(231);
    });

    it('should apply GWP factor for refrigerants', () => {
      const result = calculateEmissions({
        activityValue: 1,
        emissionFactor: 1,
        gwpFactor: 2088,
        unit: 'kg',
      });

      expect(result).toBe(2088);
    });

    it('should round to 2 decimal places', () => {
      const result = calculateEmissions({
        activityValue: 10.12345,
        emissionFactor: 2.31,
        unit: 'liters',
      });

      expect(result).toBe(23.39);
    });
  });

  describe('calculateTotalEmissions', () => {
    it('should sum scope 1 and scope 2 correctly', () => {
      const emissionData = [
        { calculated_co2e: 100, scope: 1 as const },
        { calculated_co2e: 50, scope: 1 as const },
        { calculated_co2e: 200, scope: 2 as const },
      ];

      const result = calculateTotalEmissions(emissionData);

      expect(result.scope1).toBe(150);
      expect(result.scope2).toBe(200);
      expect(result.total).toBe(350);
    });
  });
});
```

### Local Development Workflow

**Daily Development:**
```bash
# 1. Start Supabase (if not running)
supabase start

# 2. Start Next.js dev server
npm run dev

# 3. Open browser
# - App: http://localhost:3000
# - Supabase Studio: http://localhost:54323

# 4. When done
supabase stop
```

**Database Changes:**
```bash
# Create a new migration
supabase migration new add_new_feature

# Edit the migration file in supabase/migrations/
# Then apply it
supabase db reset  # This runs all migrations

# Generate updated types
supabase gen types typescript --local > types/supabase.ts
```

**Testing with Real Data:**
```bash
# Seed database with test data
# Create supabase/seed.sql
supabase db reset  # Runs migrations + seed.sql
```

### Git Workflow

```bash
# Initialize repository
git init
git add .
git commit -m "Initial commit - ZED Carbon MVP"
git branch -M main

# Push to GitHub (optional)
git remote add origin https://github.com/your-username/zed-carbon.git
git push -u origin main
```

### Future: Cloud Deployment (Phase 3)

**When ready to deploy:**
1. Create Supabase Cloud project at supabase.com
2. Run migrations on cloud project
3. Deploy to Vercel
4. Update environment variables

**Deferred to Phase 3** to focus on MVP features first.

---

## Maintenance & Updates

### Regular Updates

**Monthly:**
- Check for new emission factors from Bulgarian/EU sources
- Update emission_factors table
- Review user feedback and bug reports
- Monitor system performance

**Quarterly:**
- Review and update calculation methodology
- Security audit
- Performance optimization
- User training and support

**Annually:**
- Major emission factor update
- Compliance with new regulations (CSRD updates)
- Feature roadmap review
- User satisfaction survey

### Monitoring

**Set up monitoring:**
```bash
# Install Sentry for error tracking
npm install @sentry/nextjs

# Configure in sentry.config.js
```

**Key metrics to monitor:**
- Error rates
- API response times
- Database query performance
- User engagement metrics
- Report generation success rate

---

## Conclusion

This guide provides a comprehensive roadmap for building the ZED Carbon Footprint Management System. Follow each phase sequentially, ensuring proper testing and documentation along the way.

**Key Success Factors:**
1. ✅ Maintain strict RLS policies for data security
2. ✅ Test calculations thoroughly against known values
3. ✅ Keep Bulgarian language consistent and accurate
4. ✅ Focus on user experience and simplicity
5. ✅ Document all code and architectural decisions
6. ✅ Regular updates to emission factors
7. ✅ Continuous user feedback and iteration

**Remember:** The MVP focus is on Scope 1 & 2 emissions with manual data entry. AI strategies, OCR, and advanced features come in Phase 2.

Good luck building ZED Carbon Footprint! 🌱
