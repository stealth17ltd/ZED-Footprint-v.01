# ZED Carbon Footprint - Quick Start Guide

**For developers starting on this project - read this first!**

---

## 📁 Documentation Overview

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **README.md** | Project overview (to be created) | First time viewing project |
| **MVP_SCOPE.md** | What's in/out of MVP | Before starting any feature |
| **DEVELOPMENT_GUIDE.md** | Step-by-step implementation | Daily development reference |
| **.cursorrules** | Coding standards & patterns | Auto-loaded by Cursor IDE |
| **zed_carbon_prd.md** | Complete product requirements | Detailed feature specs |

---

## 🚀 Get Started in 15 Minutes

### Prerequisites
- Node.js 18+ installed
- Docker Desktop installed and running
- Git installed
- Code editor (VS Code/Cursor recommended)

### Setup Steps

```bash
# 1. Create Next.js project
npx create-next-app@latest zed-carbon --typescript --tailwind --app --use-npm
cd zed-carbon

# 2. Install dependencies
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install react-hook-form @hookform/resolvers zod
npm install recharts lucide-react date-fns sonner
npm install @tanstack/react-query

# 3. Install Supabase CLI
npm install -g supabase

# 4. Initialize and start Supabase
supabase init
supabase start  # Takes 2-3 minutes first time

# 5. Save the output keys to .env.local
# Create .env.local with the keys from supabase start output

# 6. Install shadcn/ui
npx shadcn-ui@latest init

# 7. Start development
npm run dev
```

**Open:**
- App: http://localhost:3000
- Supabase Studio: http://localhost:54323

---

## 🎯 MVP Scope (What to Build)

### ✅ IN MVP (24 weeks)
- Single location per company
- Manual data entry + CSV import
- Scope 1 & 2 emissions only
- Bulgarian language only
- Dashboard with charts
- 3 PDF reports (compliance, internal, certificate)
- Local Supabase development

### ❌ NOT in MVP (Phase 2+)
- PDF OCR (Phase 2 - Google Cloud Vision)
- AI strategies (Phase 2 - OpenAI)
- Multi-location (Phase 2)
- Cloud deployment (Phase 3)
- System integrations (Phase 3)

---

## 🏗️ Architecture

```
zed-carbon/
├── app/
│   ├── (auth)/login/          # Login page
│   ├── (dashboard)/
│   │   ├── dashboard/         # Main dashboard
│   │   ├── data-entry/        # Add emissions data
│   │   ├── reports/           # Generate reports
│   │   ├── strategies/        # Phase 2
│   │   └── settings/          # Company profile
│   └── api/
│       ├── emissions/         # CRUD emissions
│       ├── companies/         # Company management
│       └── reports/           # PDF generation
├── components/
│   ├── ui/                    # shadcn components
│   ├── dashboard/             # Dashboard widgets
│   ├── forms/                 # Data entry forms
│   ├── charts/                # Recharts components
│   └── layout/                # Sidebar, Header
├── lib/
│   ├── supabase/              # DB clients
│   ├── calculations/          # Emission calculations
│   ├── i18n/                  # Bulgarian translations
│   └── utils/                 # Helpers
├── types/                     # TypeScript types
└── supabase/
    └── migrations/            # Database schema
```

---

## 🗄️ Database Schema (Simplified)

```sql
companies
  ├── id
  ├── company_name
  ├── registration_number (EИК)
  ├── industry_sector
  ├── employee_count
  └── baseline_year

users (extends Supabase auth.users)
  ├── id
  ├── company_id → companies
  ├── first_name, last_name
  └── role (admin/client)

locations (1 per company in MVP)
  ├── id
  ├── company_id → companies (UNIQUE)
  └── location_name

emission_factors
  ├── category (fuel, electricity, refrigerant)
  ├── subcategory (petrol, diesel, natural_gas)
  ├── value (emission factor)
  └── unit (kg CO2e per liter/kWh)

emission_data
  ├── company_id → companies
  ├── reporting_period (month)
  ├── scope (1 or 2)
  ├── category
  ├── activity_value (liters, kWh, etc.)
  ├── calculated_co2e
  └── validation_status
```

**RLS is enabled on ALL tables!**

---

## 🧮 Core Calculation

```typescript
// Formula: CO2e = Activity × Emission Factor × GWP
const co2e = activityValue * emissionFactor * gwpFactor;

// Example: 100 liters petrol
const co2e = 100 * 2.31 * 1 = 231 kg CO2e = 0.231 tCO2e
```

---

## 🇧🇬 Bulgarian Language

**All UI text in Bulgarian:**
```typescript
// lib/i18n/bg.ts
export const bg = {
  auth: { login: 'Вход', logout: 'Изход' },
  dashboard: { title: 'Табло' },
  emissions: {
    scope1: 'Обхват 1',
    scope2: 'Обхват 2',
    addData: 'Добави данни',
  },
};
```

**Key Terms:**
- Carbon Footprint = Въглероден отпечатък
- Scope 1/2 = Обхват 1/2
- tCO2e = tCO2e (no translation)
- Certification body = Сертификационен орган

---

## 🎨 Design System

**Colors:**
```css
/* Earth green palette */
--earth-400: #2D5016  /* Primary dark green */
--earth-300: #4A7729  /* Primary green */
--earth-200: #8BC34A  /* Light green */
--earth-100: #C5E1A5  /* Very light green */
--earth-50:  #F5F5F5  /* Background */

/* Alerts */
--alert-red: #E53935
--alert-amber: #FFA726
--alert-green: #388E3C
```

**Typography:**
- Font: Inter or Open Sans
- Body: 14px minimum
- Headings: Bold, hierarchical
- Line height: 1.5

**Icons:** Lucide React (green accents)

---

## 🔒 Security Checklist

- [ ] RLS policies on all tables
- [ ] Input validation with Zod
- [ ] GDPR compliant data handling
- [ ] Company data isolation (can only see own data)
- [ ] Admin role checks in API routes
- [ ] Sensitive data in .env.local (not committed)
- [ ] HTTPS in production (Phase 3)

---

## 🧪 Testing Strategy

```bash
# Run tests
npm test

# Test calculations
lib/calculations/__tests__/emissions.test.ts

# Test RLS policies
# Use Supabase Studio to test with different users
```

**Test Cases:**
1. ✅ Calculations match manual calculations
2. ✅ Users can only see own company data
3. ✅ Admin can see all companies
4. ✅ Validation catches unusual values
5. ✅ Reports generate successfully

---

## 📊 Daily Workflow

```bash
# Morning
supabase start          # Start local DB
npm run dev             # Start Next.js

# Development
# - Make code changes
# - Test in browser (localhost:3000)
# - Check Supabase Studio (localhost:54323)

# Database changes
supabase migration new feature_name
# Edit migration file
supabase db reset       # Apply migrations
supabase gen types typescript --local > types/supabase.ts

# Evening
git add .
git commit -m "feat: add feature"
supabase stop          # Stop DB (or leave running)
```

---

## 🐛 Common Issues & Solutions

**Issue: Supabase won't start**
```bash
# Solution: Check Docker is running
docker ps

# If not running, start Docker Desktop
# Then try: supabase stop && supabase start
```

**Issue: RLS blocking queries**
```bash
# Solution: Check you're using correct client
# - API routes: use service role client
# - Frontend: use anon key client with user auth
```

**Issue: TypeScript errors**
```bash
# Solution: Regenerate types
supabase gen types typescript --local > types/supabase.ts
```

**Issue: Calculation errors**
```bash
# Solution: Check emission factors are loaded
# Run: supabase db reset
# Verify: SELECT * FROM emission_factors;
```

---

## 📞 Getting Help

1. **Read the docs:** MVP_SCOPE.md → DEVELOPMENT_GUIDE.md
2. **Check `.cursorrules`:** Coding standards and patterns
3. **Supabase docs:** https://supabase.com/docs
4. **Next.js docs:** https://nextjs.org/docs
5. **PRD:** zed_carbon_prd.md for detailed specs

---

## 🎯 Week 1 Goals

- [ ] Set up Next.js + Supabase local
- [ ] Create database schema
- [ ] Apply RLS policies
- [ ] Seed emission factors
- [ ] Create login page
- [ ] Test authentication

**Follow DEVELOPMENT_GUIDE.md Phase 1 step-by-step!**

---

## 🏁 MVP Completion Checklist

### Core Features
- [ ] User authentication working
- [ ] Company creation (admin only)
- [ ] Manual data entry form
- [ ] CSV import functionality
- [ ] Dashboard with 2 charts
- [ ] All 3 report types generate PDFs
- [ ] Validation working correctly
- [ ] Tooltips on all major sections

### Quality
- [ ] All calculations tested
- [ ] RLS policies tested
- [ ] Bulgarian text reviewed by native speaker
- [ ] Responsive on mobile/tablet/desktop
- [ ] Performance targets met (<2s page load)
- [ ] Zero critical bugs

### Documentation
- [ ] Code comments in place
- [ ] API routes documented
- [ ] Database schema documented
- [ ] README updated

---

## 🚢 Ready to Ship Criteria

1. **Pilot Testing:** 3-5 companies using for 1 month
2. **User Feedback:** >80% satisfaction
3. **Data Quality:** No calculation errors
4. **Performance:** All pages <2s load time
5. **Security:** RLS audit passed
6. **Support:** <5 tickets per company per month

---

## 📈 Success Metrics

**Technical:**
- Page load: <2 seconds ✅
- API response: <1 second ✅
- Report generation: <30 seconds ✅
- Zero data leaks between companies ✅

**Business:**
- 10-20 pilot companies ✅
- Time to first report: <7 days ✅
- Monthly data entry: <10 minutes ✅
- User satisfaction: >80% ✅

---

## 🎓 Learning Resources

**Next.js:**
- https://nextjs.org/learn
- App Router: https://nextjs.org/docs/app

**Supabase:**
- https://supabase.com/docs/guides/getting-started
- RLS: https://supabase.com/docs/guides/auth/row-level-security

**TypeScript:**
- https://www.typescriptlang.org/docs/

**Recharts:**
- https://recharts.org/en-US/examples

---

## 💡 Pro Tips

1. **Read MVP_SCOPE.md first** - Don't build features not in MVP!
2. **Use Supabase Studio** - Visual DB management is faster
3. **Test RLS early** - Security is easier to add early than later
4. **Keep Bulgarian consistent** - Use bg.ts for all text
5. **Follow .cursorrules** - Cursor AI will use these patterns
6. **Commit often** - Small commits are easier to debug
7. **Ask questions** - Better to ask than build wrong feature

---

**Good luck building ZED Carbon Footprint! 🌱**

*For detailed implementation, see DEVELOPMENT_GUIDE.md*
