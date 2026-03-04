# ZED Carbon Footprint - MVP Scope Definition

**Version:** 1.0  
**Date:** October 8, 2025  
**Status:** Confirmed and Locked

---

## Executive Summary

This document defines the **Minimum Viable Product (MVP)** scope for ZED Carbon Footprint Management System. The MVP focuses on core carbon calculation and reporting functionality for Bulgarian SMBs with **single-location operations**, enabling them to track Scope 1 & 2 emissions, generate compliance reports, and meet basic CSRD requirements.

**Target Timeline:** 6 months (24 weeks)  
**Target Clients:** 10-20 pilot companies  
**Development Environment:** Local (Supabase + Next.js)  
**Deployment:** Local/staging only (cloud deployment in Phase 3)

---

## Key Decisions

### ✅ INCLUDED IN MVP

| Feature | Rationale | Priority |
|---------|-----------|----------|
| **Single location per company** | Simplifies MVP, covers 70% of target market | MUST HAVE |
| **Manual data entry only** | Core functionality, no external dependencies | MUST HAVE |
| **Excel/CSV import** | 80% time savings for clients | MUST HAVE |
| **Scope 1 & 2 emissions only** | Covers CSRD minimum requirements | MUST HAVE |
| **PDF reports** | Essential for compliance and stakeholders | MUST HAVE |
| **Bulgarian language only** | Primary market focus | MUST HAVE |
| **Local development** | Faster iteration, no cloud costs during MVP | MUST HAVE |
| **Service-based pricing** | Higher perceived value, better for SMBs | BUSINESS |

### ❌ DEFERRED TO PHASE 2

| Feature | Reason for Deferral | Timeline |
|---------|-------------------|----------|
| **PDF OCR processing** | Complex integration, not critical for MVP | Phase 2 (Month 7-8) |
| **AI strategy generation** | Nice-to-have, manual recommendations sufficient | Phase 2 (Month 7-8) |
| **Multi-location support** | Adds complexity, serves only 30% of market | Phase 2 (Month 9-10) |
| **Benchmarking** | Requires critical mass of users | Phase 2 (Month 9-10) |
| **Community features** | Needs user base first | Phase 2 (Month 11-12) |

### ❌ DEFERRED TO PHASE 3+

| Feature | Reason for Deferral | Timeline |
|---------|-------------------|----------|
| **Cloud deployment** | Local testing sufficient for MVP | Phase 3 |
| **System integrations** | Partnership agreements needed | Phase 3 |
| **Scope 3 emissions** | Complex, not required by regulations yet | Phase 4+ |
| **Mobile apps** | Web responsive sufficient | Phase 4+ |
| **English language** | Bulgarian market focus | Phase 3+ |

---

## Technology Stack (Confirmed)

### Frontend
- **Framework:** Next.js 14 with App Router
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS with ZED custom colors
- **UI Components:** shadcn/ui
- **State Management:** React Context + React Query
- **Forms:** React Hook Form + Zod validation
- **Charts:** Recharts
- **Icons:** Lucide React

### Backend
- **Runtime:** Node.js with TypeScript
- **API:** Next.js API Routes
- **Database:** Supabase (PostgreSQL) - Local via Docker
- **Authentication:** Supabase Auth
- **File Storage:** Supabase Storage (for CSV imports, PDFs)

### Development Tools
- **Version Control:** Git + GitHub
- **Testing:** Jest + React Testing Library
- **Linting:** ESLint + Prettier
- **Type Generation:** Supabase CLI

### Phase 2 Additions
- **OCR:** Google Cloud Vision API (chosen for excellent Bulgarian support)
- **AI:** OpenAI GPT-4 (for strategy generation)

### Phase 3 Additions
- **Hosting:** Vercel (frontend)
- **Database:** Supabase Cloud (production)
- **Monitoring:** Sentry + Vercel Analytics

---

## Functional Scope

### 1. User Authentication & Management ✅

**MUST HAVE:**
- Email/password authentication via Supabase Auth
- Two user roles: Admin (ZED team) and Client (company users)
- Profile management (name, email, company affiliation)
- Password reset flow
- Secure session management
- Row Level Security (RLS) for all data

**NOT IN MVP:**
- Two-factor authentication
- SSO/SAML integration
- Multiple users per company (only primary contact for MVP)
- User activity logs

---

### 2. Company Master Data ✅

**MUST HAVE:**
- Company creation by Admin only
- Core company information:
  - Legal name
  - Registration number (EИК)
  - Industry sector
  - Employee count
  - Primary contact email
  - Billing address
  - Sustainability goals (text field)
  - EU Green Deal commitment (Y/N)
  - Baseline year
- **Single location per company** (default: "Основна локация")
- Company logo upload (optional)
- View/edit company profile

**NOT IN MVP:**
- Multiple locations
- Location-specific tracking
- Certification status tracking
- Custom fields

---

### 3. Emission Data Collection ✅

**MUST HAVE:**

**Scope 1 - Direct Emissions:**
- Company vehicles:
  - Fuel type (petrol, diesel, CNG, LPG)
  - Monthly consumption (liters)
  - Vehicle count (optional)
- On-site fuel:
  - Natural gas (m³ or kWh)
  - Diesel for generators (liters)
  - LPG for equipment (kg)
  - Coal (kg) - if applicable
- Refrigerants:
  - Refrigerant type (R-410A, R-32, R-134a, etc.)
  - Quantity recharged/leaked (kg)

**Scope 2 - Indirect Emissions:**
- Electricity:
  - Monthly consumption (kWh)
  - Utility provider (text)
  - Renewable energy percentage (optional)
- District heating (kWh or MWh)
- District cooling (kWh or MWh)

**Data Entry Methods:**
1. **Manual form entry** (primary method)
2. **Excel/CSV import** (using provided template)

**Features:**
- Month/year selection for reporting period
- Supporting document upload (PDF, image of bill)
- Notes/comments field
- Draft save capability
- Real-time CO2e calculation preview
- Validation warnings for unusual values
- Mandatory explanation for flagged data (>30% variance)

**NOT IN MVP:**
- PDF OCR auto-extraction
- Flexible CSV mapping (only fixed template)
- API-based data import
- Bulk delete/edit operations
- Data export

---

### 4. Carbon Footprint Calculation Engine ✅

**MUST HAVE:**
- GHG Protocol Scope 1 & 2 compliant methodology
- Bulgarian/EU emission factors database
- Calculation formula: `CO2e = Activity Value × Emission Factor × GWP Factor`
- Separate calculations for:
  - Scope 1 total (tCO2e)
  - Scope 2 total (tCO2e)
  - Combined total (tCO2e)
- Real-time calculation on data entry
- Calculation transparency:
  - Show which emission factors used
  - Display methodology
  - Link to source documentation

**Emission Factors Included:**
- Fuels: Petrol, Diesel, Natural Gas, LPG, Coal
- Electricity: Bulgarian grid standard (by year)
- Refrigerants: GWP values for common types
- District heating/cooling

**NOT IN MVP:**
- Location-based vs. market-based Scope 2
- Industry-specific adjustment factors
- Custom emission factors
- Historical factor version tracking

---

### 5. Data Validation & Quality Control ✅

**MUST HAVE:**
- Automated validation rules:
  - Range checks (negative values blocked)
  - Zero values warning
  - Unreasonably high values flagged
  - Period-over-period comparison (>30% change)
- Warning levels:
  - 🟢 Green: Validated
  - 🟡 Yellow: Warning - unusual value
  - 🔴 Red: Flagged - requires explanation
- Mandatory explanation field for flagged data
- Admin review queue (simple list view)

**NOT IN MVP:**
- Industry benchmark comparison
- Machine learning anomaly detection
- Automated correction suggestions

---

### 6. Dashboard & Visualizations ✅

**MUST HAVE:**

**Hero Section:**
- Total carbon footprint (large, prominent)
- Visual indicator: Green/Yellow/Red trend
- Comparison to previous month (% change)
- Progress toward annual target (if set)

**Stats Cards (4 cards):**
1. Total emissions (tCO2e)
2. Scope 1 emissions (tCO2e)
3. Scope 2 emissions (tCO2e)
4. Trend direction (increasing/decreasing)

**Charts (2 main charts):**
1. **Emissions Trend** (Line chart)
   - Last 12 months
   - Scope 1 and 2 as separate lines
   - Interactive hover for exact values
2. **Emissions Breakdown** (Donut + Bar chart)
   - Scope 1 vs 2 proportion (donut)
   - By category (bar chart)

**Action Items Panel:**
- Pending data entries count
- Upcoming deadlines
- Quick action buttons: "Add Data", "Generate Report"

**NOT IN MVP:**
- Location comparison
- Benchmarking charts
- Strategy progress section
- Alerts & notifications center
- Custom dashboard layouts

---

### 7. Reporting System ✅

**MUST HAVE - Three Report Types:**

**1. Compliance Report (PDF)**
- Company information header with logo
- Reporting period
- Scope 1, 2, and total emissions (tCO2e)
- Methodology statement (GHG Protocol reference)
- Emission factors used
- Data quality statement
- Bulgarian/EU compliance confirmation
- Audit trail summary
- ZED branding footer

**2. Internal Report (PDF)**
- Executive summary (1 page)
- Key metrics: Total, Scope 1, Scope 2
- Trend charts (last 6-12 months)
- Breakdown by category
- Month-over-month comparison table
- Year-over-year comparison (if >1 year data)
- Data completeness indicator

**3. Sustainability Certificate (PDF)**
- Professional certificate design
- Company name and logo
- "ZED Carbon Footprint Certified" badge
- Total carbon footprint value
- Reporting year
- Sustainability commitment statement
- Printable A4 format
- Shareable via email/download

**Report Features:**
- On-demand generation (<30 seconds)
- Date range selection
- PDF download
- Direct email sending (future)
- Report generation history

**NOT IN MVP:**
- Excel/CSV export of reports
- Custom report builder
- Scheduled automated reports
- Shareable public links
- Multi-language reports

---

### 8. Educational Features ✅

**MUST HAVE:**

**Contextual Tooltips:**
- "?" icons throughout interface
- Explain terminology in Bulgarian:
  - What is Scope 1?
  - What is Scope 2?
  - What is tCO2e?
  - What is CSRD?
  - What are emission factors?
- Data entry guidance (where to find data on bills)
- Calculation examples

**Help Section:**
- Basic FAQ page
- Contact support form
- Links to Bulgarian/EU regulatory sources

**NOT IN MVP:**
- Video tutorials
- Interactive onboarding wizard
- Best practices library
- Case studies
- Webinar integration

---

### 9. Settings & Administration ✅

**MUST HAVE:**

**Admin Functions:**
- Create new company accounts
- Manage emission factors database
- View all companies list
- Basic user management
- System settings

**Client Functions:**
- View/edit company profile
- Change password
- Update contact information
- View subscription status (display only)

**NOT IN MVP:**
- User role customization
- Permissions management
- Audit logs
- API key management
- White-label settings

---

## Data Model (MVP Simplified)

### Core Tables

**companies**
- id, company_name, registration_number, industry_sector
- employee_count, primary_contact_email, billing_address
- logo_url, sustainability_goals, eu_green_deal_commitment
- baseline_year, is_active, created_at, updated_at

**users**
- id (FK to auth.users), company_id (FK)
- first_name, last_name, role (admin/client)
- is_active, created_at, updated_at

**locations** (simplified for MVP)
- id, company_id (FK), location_name (default: "Основна локация")
- address, square_meters, employee_count
- is_active, created_at, updated_at
- **UNIQUE constraint on company_id** (one location per company)

**emission_factors**
- id, category, subcategory, region, value, unit
- source, effective_date, expiry_date, created_at

**emission_data**
- id, company_id (FK), location_id (FK)
- reporting_period, scope (1 or 2), category, subcategory
- activity_value, unit, emission_factor_id (FK)
- emission_factor_value, gwp_factor, calculated_co2e
- data_source (manual/import), validation_status
- validation_notes, supporting_document_url, notes
- uploaded_by (FK), created_at, updated_at

**reports** (simple tracking)
- id, company_id (FK), report_type, reporting_period
- generated_date, generated_by (FK), format

---

## User Stories (MVP Priority)

### As an Admin (ZED Team Member)

1. ✅ I can create a new company account with basic information
2. ✅ I can view a list of all companies
3. ✅ I can manage emission factors in the database
4. ✅ I can view any company's emissions data
5. ✅ I can access admin-only functions

### As a Client (Company User)

1. ✅ I can log in securely to access my company's data
2. ✅ I can view my company profile and edit certain fields
3. ✅ I can manually enter monthly emission data for Scope 1 & 2
4. ✅ I can upload CSV/Excel files with emission data
5. ✅ I can see real-time CO2e calculations as I enter data
6. ✅ I can receive validation warnings for unusual data
7. ✅ I can view my company's carbon footprint on a dashboard
8. ✅ I can see trend charts for the past 12 months
9. ✅ I can generate a compliance report as a PDF
10. ✅ I can generate an internal report with charts
11. ✅ I can generate a sustainability certificate
12. ✅ I can download reports to share with stakeholders
13. ✅ I can access help tooltips throughout the system
14. ✅ I can use the system entirely in Bulgarian

---

## Non-Functional Requirements

### Performance ✅
- Page load: <2 seconds
- API response: <1 second
- Report generation: <30 seconds
- Dashboard refresh: <3 seconds

### Security ✅
- All data encrypted in transit (HTTPS)
- Passwords hashed (Supabase default)
- Row Level Security on all tables
- Company data isolation enforced at DB level
- GDPR compliance measures

### Accessibility ✅
- WCAG 2.1 AA compliance
- Color contrast ratio ≥4.5:1
- Keyboard navigation support
- Screen reader compatible
- Responsive design (desktop, tablet, mobile browsers)

### Browser Support ✅
- Chrome (latest)
- Firefox (latest)
- Edge (latest)
- Safari (latest)

### Data Retention ✅
- Emissions data: Indefinite (for trend analysis)
- Reports: 7 years (audit requirements)
- User activity: 90 days

---

## Success Criteria for MVP Launch

### Technical Success ✅
- [ ] All core features implemented and tested
- [ ] Zero critical bugs
- [ ] <5 known minor bugs
- [ ] All RLS policies working correctly
- [ ] Calculation accuracy verified (test cases passed)
- [ ] Performance targets met
- [ ] Security audit passed

### Business Success ✅
- [ ] 10-20 pilot companies onboarded
- [ ] 80%+ user satisfaction rating
- [ ] <5 support tickets per company per month
- [ ] Average time to first report: <7 days
- [ ] 90%+ data entry completion rate
- [ ] Positive feedback on Bulgarian language quality

### User Experience Success ✅
- [ ] Users can complete full workflow without support
- [ ] <10 minutes to enter monthly data (manual)
- [ ] <5 minutes to generate report
- [ ] Intuitive navigation (measured by user testing)
- [ ] Accessible to non-technical users

---

## Out of Scope (Explicitly Excluded from MVP)

### Features
- ❌ PDF OCR processing
- ❌ AI-powered strategy recommendations
- ❌ Multi-location support
- ❌ Benchmarking against other companies
- ❌ Community strategy sharing
- ❌ Advanced forecasting/predictions
- ❌ Carbon offset marketplace
- ❌ Supply chain (Scope 3) emissions
- ❌ Real-time IoT sensor integration
- ❌ Mobile native apps
- ❌ Blockchain audit trails

### Integrations
- ❌ Microinvest API
- ❌ SAP connector
- ❌ Accounting system integrations
- ❌ Utility provider APIs
- ❌ Payment gateway (manual billing)

### Advanced Admin
- ❌ White-label/multi-tenant architecture
- ❌ Advanced user roles and permissions
- ❌ API for third-party developers
- ❌ Webhook notifications

---

## MVP Timeline

### Phase 1: Foundation (Weeks 1-8)
- Weeks 1-2: Next.js + Supabase setup, database schema
- Weeks 3-4: Authentication system, RLS policies
- Weeks 5-6: Company management, user profiles
- Weeks 7-8: Dashboard layout, navigation

### Phase 2: Core Features (Weeks 9-16)
- Weeks 9-10: Calculation engine, validation logic
- Weeks 11-12: Manual data entry forms
- Weeks 13-14: Dashboard with visualizations
- Weeks 15-16: CSV/Excel import functionality

### Phase 3: Reports & Polish (Weeks 17-24)
- Weeks 17-18: PDF report generation (all 3 types)
- Weeks 19-20: Educational tooltips, help section
- Weeks 21-22: Testing, bug fixes, performance optimization
- Weeks 23-24: Pilot user testing, final polish

**Total: 24 weeks (6 months)**

---

## Post-MVP Roadmap

### Phase 2: Enhanced Features (Months 7-12)
- Google Cloud Vision API integration for PDF OCR
- OpenAI GPT-4 integration for AI strategy generation
- Multi-location support
- Benchmarking system
- Community features

### Phase 3: Enterprise & Cloud (Months 13-18)
- Deploy to Vercel + Supabase Cloud
- System integrations (Microinvest, SAP)
- Advanced reporting
- English language support
- White-label options

### Phase 4: Scale (Months 18+)
- Scope 3 emissions
- Mobile apps
- Predictive analytics
- Carbon marketplace integration

---

## Risk Mitigation

### Technical Risks
- **Calculation accuracy:** Unit test all calculations, verify against manual calculations
- **Data security:** Strict RLS policies, regular security reviews
- **Performance:** Monitor query performance, optimize early

### Business Risks
- **User adoption:** Pilot program with 3-5 friendly companies first
- **Bulgarian language quality:** Native speaker review all text
- **Regulatory changes:** Build flexible calculation engine

### Resource Risks
- **Development time:** Focus ruthlessly on MVP scope only
- **Emission factor data:** Establish reliable Bulgarian/EU sources early
- **Support burden:** Excellent documentation and tooltips to reduce support needs

---

## Sign-Off

**Approved by:**
- [ ] Product Owner
- [ ] Technical Lead
- [ ] Design Lead
- [ ] Business Stakeholder

**Date:** _________________

**Next Steps:**
1. Begin Phase 1: Foundation (Week 1)
2. Set up development environment
3. Follow DEVELOPMENT_GUIDE.md step-by-step
4. Weekly progress reviews

---

**Document History**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Oct 8, 2025 | Product Team | Initial MVP scope definition |

---

*This MVP scope is locked for the initial 6-month development period. Any scope changes require formal approval and timeline adjustments.*
