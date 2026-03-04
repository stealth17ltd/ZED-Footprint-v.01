# ZED Carbon Footprint Management System

An AI-powered sustainability management platform for Bulgarian SMBs to calculate Scope 1 & 2 carbon emissions, generate reduction strategies, and produce compliance reports aligned with Bulgarian/EU CSRD regulations.

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Supabase account (cloud)
- Your Supabase credentials in `.env.local`

### Setup (First Time)

1. **Install dependencies** (if not done):
```bash
npm install
```

2. **Apply database migrations** (CRITICAL - DO THIS FIRST):
   - Open [Supabase SQL Editor](https://supabase.com/dashboard)
   - Run migrations from `supabase/migrations/` in order
   - See `supabase/MIGRATIONS_README.md` for detailed instructions

3. **Create admin user** (in Supabase SQL Editor):
```sql
INSERT INTO users (id, first_name, last_name, role, is_active)
VALUES ('YOUR_AUTH_USER_ID', 'Your', 'Name', 'admin', true);
```

4. **Start development**:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Current Status

✅ Project initialized  
✅ Supabase connected  
✅ Migrations created  
⚠️ **ACTION REQUIRED**: Apply migrations to your Supabase database  

See **[SETUP_STATUS.md](./SETUP_STATUS.md)** for detailed status and next steps.

---

## 📚 Documentation

### Essential Guides
- **[SETUP_STATUS.md](./SETUP_STATUS.md)** - Current setup status and immediate next steps
- **[DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)** - Complete step-by-step guide (2,351 lines)
- **[QUICK_START.md](./QUICK_START.md)** - Quick reference (426 lines)

### Planning Documents
- **[MVP_SCOPE.md](./MVP_SCOPE.md)** - Feature scope and user stories (639 lines)
- **[MVP_CHECKLIST.md](./MVP_CHECKLIST.md)** - 325-point development checklist
- **[zed_carbon_prd.md](./zed_carbon_prd.md)** - Product Requirements Document

### Development Standards
- **[.cursorrules](./.cursorrules)** - Code standards, patterns, Bulgarian implementation

---

## 🏗️ Technology Stack

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- Recharts (data visualization)

### Backend
- Next.js API Routes
- Supabase (PostgreSQL)
- Row Level Security (RLS)

### Tools
- React Hook Form + Zod
- TanStack Query
- date-fns
- Sonner (notifications)

---

## 📂 Project Structure

```
app/
├── (auth)/              # Authentication pages
├── (dashboard)/         # Dashboard pages (protected)
└── api/                 # API routes

components/
├── ui/                  # shadcn/ui components
├── dashboard/           # Dashboard components
├── forms/               # Form components
└── layout/              # Layout components

lib/
├── supabase/            # Supabase clients
├── calculations/        # Emission calculations
├── i18n/                # Bulgarian translations
└── utils/               # Utilities

supabase/
└── migrations/          # Database migrations (RUN THESE!)

types/                   # TypeScript types
```

---

## 🗄️ Database Schema

Main tables:
- `companies` - Company master data
- `users` - User profiles (extends auth.users)
- `locations` - Company locations (1 per company in MVP)
- `emission_data` - Scope 1 & 2 emission records
- `emission_factors` - Bulgarian/EU emission factors
- `reports` - Generated reports

All tables have Row Level Security (RLS) enabled.

---

## 🌍 Bulgarian Language

All user-facing text is in Bulgarian. Translations are in `lib/i18n/bg.ts`.

Key terminology:
- Въглероден отпечатък = Carbon Footprint
- Обхват 1/2 = Scope 1/2
- tCO₂e = tCO₂e (technical term, no translation)

---

## 📋 MVP Features

✅ **Included in MVP:**
- User authentication (Admin + Client roles)
- Company profile management
- Manual data entry (Scope 1 & 2)
- Excel/CSV import
- Emission calculations (Bulgarian factors)
- Dashboard with visualizations
- Compliance reports (PDF)
- Bulgarian language interface
- GDPR compliance

❌ **Deferred to Phase 2:**
- PDF OCR (Google Cloud Vision)
- AI strategy generation (OpenAI)
- Multi-location support
- Cloud deployment

---

## 🔐 Security

- Row Level Security (RLS) on all tables
- Company data isolation
- Admin vs Client role separation
- Secure password handling (Supabase Auth)
- HTTPS only in production

---

## 🧪 Testing

```bash
# Unit tests (when implemented)
npm run test

# Type checking
npx tsc --noEmit

# Linting
npm run lint
```

---

## 📝 Development Workflow

See [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) for the complete 10-week development plan.

Current phase: **Week 1-2 - Database & Authentication**

---

## 🆘 Support

See troubleshooting section in [SETUP_STATUS.md](./SETUP_STATUS.md).

---

## 📄 License

Proprietary - ZED Team