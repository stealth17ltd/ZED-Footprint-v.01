# ZED Carbon Footprint — Technology Stack

Short overview of languages, frameworks, databases, and APIs used in this project.

## Languages

| Language | Usage |
|----------|--------|
| **TypeScript** | Primary language — app, API routes, libs, types |
| **SQL** | PostgreSQL schema, migrations, RLS policies |
| **JavaScript (ESM)** | Utility scripts (`scripts/*.mjs`) |
| **Bulgarian (bg)** | Primary UI copy via `lib/i18n/bg.ts` |

## Frontend

| Technology | Role |
|------------|------|
| **Next.js 15** (App Router) | React framework, SSR, routing, API routes |
| **React 19** | UI components |
| **Tailwind CSS 4** | Styling |
| **shadcn/ui + Radix UI** | Accessible UI primitives (dialogs, selects, tabs, etc.) |
| **Lucide React** | Icons |
| **Recharts** | Dashboard charts |
| **React Hook Form + Zod** | Forms and validation |
| **TanStack React Query** | Server state / data fetching |
| **Sonner** | Toast notifications |

## Backend

| Technology | Role |
|------------|------|
| **Next.js Route Handlers** | REST-style API under `app/api/*` |
| **Node.js** | Runtime (serverless-friendly) |
| **Zod** | Request/body validation in API routes |

## Database & data layer

| Technology | Role |
|------------|------|
| **Supabase** | Hosted PostgreSQL + Auth + Storage |
| **PostgreSQL** | Primary database (via Supabase) |
| **Row Level Security (RLS)** | Multi-tenant isolation by `company_id` |
| **Supabase migrations** | Versioned schema in `supabase/migrations/` |
| **pg** (dev) | Direct migration runner (`npm run db:migrate`) |

## Authentication & security

| Technology | Role |
|------------|------|
| **Supabase Auth** | Email/password, sessions, password recovery |
| **@supabase/ssr** | Server/client Supabase clients in Next.js |
| **Middleware** | Route protection (`middleware.ts`) |

## File & report generation

| Library | Role |
|---------|------|
| **pdf-lib + @pdf-lib/fontkit** | VSME, CSRD, compliance PDFs |
| **@react-pdf/renderer** | React-based PDF reports |
| **jspdf + jspdf-autotable** | Legacy/simple PDF output |
| **xlsx** | Excel import/export (emissions template, VSME export) |
| **pdf-parse** | Invoice PDF text extraction |
| **Supabase Storage** | Evidence documents (planned/used for attachments) |

## Internal API surface (Next.js)

Grouped route areas under `app/api/`:

- **Emissions** — Scope 1/2 CRUD, import, templates, calculation snapshots
- **Scope 3** — Transactions, classification, import, dashboard
- **Targets & strategies** — Goals, forecasts, reduction initiatives
- **Reports** — Full, CSRD, compliance, certificate, VSME PDF
- **VSME** — Readiness, manual disclosures, JSON/Excel export
- **Compliance** — Regulatory screening evaluation
- **Evidence** — Document metadata and uploads
- **Companies & locations** — Profile, EU ETS fields, sites
- **Admin** — Users, companies (admin role)
- **GDPR** — Export and delete
- **Invoices** — Parse/import (Scope 3 assist)
- **Onboarding, audit, benchmark, data-quality**

## External APIs & services

| Service | Status | Purpose |
|---------|--------|---------|
| **Supabase** | Active | Database, auth, storage |
| **Google Fonts (CDN)** | Active | Roboto for PDF generation |
| **OpenAI API** | Optional | Invoice parsing enhancement (`OPENAI_API_KEY`) |
| **Google Cloud Vision** | Optional / Phase 2 | OCR for invoices (`GOOGLE_CLOUD_VISION_API_KEY`) |
| **lex.bg / EUR-Lex / legislation.apis.bg** | Links only | Official regulation references in compliance UI |

## DevOps & tooling

| Tool | Role |
|------|------|
| **npm** | Package manager |
| **Turbopack** | Next.js dev/build bundler |
| **Git + GitHub** | Version control — `stealth17ltd/ZED-Footprint-v.01` |
| **Vercel** (target) | Deployment per project rules |
| **TypeScript 5** | Static typing (`strict` mode) |

## Architecture summary

```
Browser (React + Tailwind)
        ↓
Next.js App Router (pages + API routes)
        ↓
Supabase (PostgreSQL + Auth + Storage)
        ↓
Optional: OpenAI / Google Vision (invoice OCR)
```

---

*Last updated: September 2026*
