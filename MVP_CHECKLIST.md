# ZED Carbon Footprint - MVP Development Checklist

**Track your progress through the 24-week MVP development**

---

## 📋 How to Use This Checklist

1. Mark items as complete with `[x]` as you finish them
2. Update the progress percentage at the end of each week
3. Note any blockers or issues in the Issues section
4. Review weekly with the team

---

## Phase 1: Foundation (Weeks 1-8) 🏗️

### Week 1-2: Setup & Database Schema

**Project Initialization**
- [ ] Next.js project created with TypeScript
- [ ] Tailwind CSS configured with ZED colors
- [ ] shadcn/ui initialized
- [ ] Core dependencies installed
- [ ] Git repository initialized
- [ ] .gitignore configured correctly

**Supabase Setup**
- [ ] Docker Desktop installed and running
- [ ] Supabase CLI installed globally
- [ ] Local Supabase instance started
- [ ] .env.local created with correct keys
- [ ] Supabase Studio accessible at localhost:54323

**Database Schema**
- [ ] Initial migration file created (20251008000001_initial_schema.sql)
- [ ] `companies` table created
- [ ] `users` table created (extends auth.users)
- [ ] `locations` table created (with UNIQUE constraint)
- [ ] `emission_factors` table created
- [ ] `emission_data` table created
- [ ] Indexes created for performance
- [ ] Update timestamp triggers added
- [ ] Migration applied successfully

**Emission Factors**
- [ ] Emission factors seed file created
- [ ] Fuel emission factors seeded (petrol, diesel, gas, LPG, coal)
- [ ] Electricity emission factors seeded (Bulgarian grid)
- [ ] District heating/cooling factors seeded
- [ ] Refrigerant GWP factors seeded
- [ ] Verified data in Supabase Studio

**Progress:** ___/28 (___%)

---

### Week 3-4: Authentication System

**Row Level Security (RLS)**
- [ ] RLS migration file created (20251008000002_rls_policies.sql)
- [ ] RLS enabled on all tables
- [ ] Companies policies created (view own, admin view all)
- [ ] Users policies created (view own, view colleagues, admin manage)
- [ ] Locations policies created (view/manage own company)
- [ ] Emission data policies created (CRUD for own company)
- [ ] Emission factors policies created (read for all, admin manage)
- [ ] RLS policies tested manually in Studio
- [ ] Admin can see all data
- [ ] Client can only see own company data

**Supabase Client Setup**
- [ ] `lib/supabase/client.ts` created (browser client)
- [ ] `lib/supabase/server.ts` created (server component client)
- [ ] `lib/supabase/service.ts` created (service role client)
- [ ] TypeScript types generated from schema
- [ ] `types/supabase.ts` file created and working

**Login Page**
- [ ] Login page created at `app/(auth)/login/page.tsx`
- [ ] Email and password fields
- [ ] Form validation with Zod
- [ ] Error handling for invalid credentials
- [ ] Success redirect to dashboard
- [ ] Bulgarian text used throughout
- [ ] Responsive design (mobile/tablet/desktop)
- [ ] ZED branding (logo, colors)

**Middleware**
- [ ] `middleware.ts` created in root
- [ ] Auth check on protected routes
- [ ] Redirect to login if not authenticated
- [ ] Redirect to dashboard if already authenticated
- [ ] Middleware config set correctly

**Progress:** ___/23 (___%)

---

### Week 5-6: Company Management & Profiles

**TypeScript Types**
- [ ] `types/index.ts` created
- [ ] User interface defined
- [ ] Company interface defined
- [ ] EmissionData interface defined
- [ ] EmissionFactor interface defined
- [ ] Location interface defined

**Bulgarian Translations**
- [ ] `lib/i18n/bg.ts` created
- [ ] Auth translations added
- [ ] Common translations added
- [ ] Dashboard translations added
- [ ] Emissions translations added
- [ ] Reports translations added
- [ ] Validation translations added
- [ ] All text reviewed by native speaker

**Admin Company API**
- [ ] `app/api/admin/companies/route.ts` created
- [ ] POST endpoint for creating companies
- [ ] GET endpoint for listing companies
- [ ] Input validation with Zod
- [ ] Admin role verification
- [ ] Service role client used
- [ ] Default location created automatically
- [ ] Error handling implemented
- [ ] Tested with Postman/Thunder Client

**Company Profile Page**
- [ ] `app/(dashboard)/settings/company/page.tsx` created
- [ ] Fetch current user's company data
- [ ] Display company information (read-only for clients)
- [ ] Edit capability for certain fields
- [ ] Logo upload functionality
- [ ] Save changes with validation
- [ ] Success/error toasts
- [ ] Responsive layout

**Progress:** ___/25 (___%)

---

### Week 7-8: Dashboard Layout & Navigation

**Main Layout**
- [ ] `app/(dashboard)/layout.tsx` created
- [ ] Auth check (server-side)
- [ ] Sidebar included
- [ ] Header included
- [ ] Main content area responsive
- [ ] Redirect to login if not authenticated

**Sidebar Component**
- [ ] `components/layout/Sidebar.tsx` created
- [ ] Navigation items defined (Dashboard, Data Entry, Reports, etc.)
- [ ] Active state highlighting
- [ ] Icons from Lucide React
- [ ] ZED logo/branding
- [ ] Bulgarian labels
- [ ] Responsive (collapsible on mobile)
- [ ] Smooth transitions

**Header Component**
- [ ] `components/layout/Header.tsx` created
- [ ] Company name display
- [ ] User profile dropdown
- [ ] Logout functionality
- [ ] Notifications icon (placeholder for Phase 2)
- [ ] Bulgarian text
- [ ] Responsive design

**Empty Dashboard Page**
- [ ] `app/(dashboard)/dashboard/page.tsx` created
- [ ] Basic layout with placeholder content
- [ ] "Coming soon" or skeleton components
- [ ] Accessible via navigation

**Progress:** ___/18 (___%)

---

## Phase 2: Core Features (Weeks 9-16) ⚙️

### Week 9-10: Emissions Calculation Engine

**Calculation Utilities**
- [ ] `lib/calculations/emissions.ts` created
- [ ] `calculateEmissions()` function implemented
- [ ] Formula: CO2e = Activity × Factor × GWP
- [ ] Rounding to 2 decimal places
- [ ] `calculateTotalEmissions()` function implemented
- [ ] Scope 1 and 2 separate calculations
- [ ] `getEmissionFactor()` function implemented
- [ ] Unit conversion function added
- [ ] JSDoc comments on all functions
- [ ] TypeScript types for all params

**Validation Utilities**
- [ ] `lib/calculations/validation.ts` created
- [ ] `validateEmissionData()` function implemented
- [ ] Range checks (negative values)
- [ ] Zero value warnings
- [ ] Unreasonably high value checks
- [ ] Period-over-period comparison (>30% change)
- [ ] Mandatory notes for flagged data
- [ ] `getValidationStatus()` function implemented
- [ ] Warning/error messages in Bulgarian

**Unit Tests**
- [ ] `lib/calculations/__tests__/emissions.test.ts` created
- [ ] Jest configured
- [ ] Test basic calculation
- [ ] Test with GWP factor (refrigerants)
- [ ] Test rounding
- [ ] Test total calculations (Scope 1 + 2)
- [ ] Test edge cases (zero, negative)
- [ ] All tests passing
- [ ] 100% coverage on calculations

**Progress:** ___/27 (___%)

---

### Week 11-12: Data Entry Forms

**Emission Data Entry Page**
- [ ] `app/(dashboard)/data-entry/page.tsx` created
- [ ] Form with React Hook Form
- [ ] Zod schema for validation
- [ ] Reporting period field (month picker)
- [ ] Scope selection (1 or 2)
- [ ] Category dropdown (populated from emission_factors)
- [ ] Activity value input (number)
- [ ] Unit display (auto-populated from factor)
- [ ] Notes textarea
- [ ] Real-time CO2e calculation preview
- [ ] Validation warnings displayed
- [ ] Submit button with loading state
- [ ] Success/error toasts in Bulgarian
- [ ] Responsive design

**Emission Factors Fetch**
- [ ] Fetch emission factors from database
- [ ] Group by scope
- [ ] Filter active factors (effective_date check)
- [ ] Display in user-friendly format

**Data Submission**
- [ ] Get current user's company_id
- [ ] Find matching emission factor
- [ ] Calculate CO2e
- [ ] Validate data
- [ ] Insert into emission_data table
- [ ] Handle validation status (validated/warning/flagged)
- [ ] Upload supporting document (if provided)
- [ ] Clear form on success
- [ ] Error handling with user-friendly messages

**Supporting Documents**
- [ ] File upload component
- [ ] Accept PDF, JPG, PNG
- [ ] Upload to Supabase Storage
- [ ] Store URL in emission_data
- [ ] Download/view functionality

**Progress:** ___/28 (___%)

---

### Week 13-14: Dashboard with Visualizations

**Dashboard Components**
- [ ] `components/dashboard/StatsCard.tsx` created
- [ ] Card with title, value, icon
- [ ] Trend indicator (up/down arrows)
- [ ] Percentage change display
- [ ] Color coding (green=good, red=bad)

**Dashboard Page**
- [ ] `app/(dashboard)/dashboard/page.tsx` updated
- [ ] Fetch current month emissions
- [ ] Calculate Scope 1, 2, and total
- [ ] Calculate month-over-month change
- [ ] 4 stats cards layout (Total, Scope 1, Scope 2, Trend)
- [ ] Responsive grid (2x2 on desktop, 1 column on mobile)

**Emission Trend Chart**
- [ ] `components/dashboard/EmissionTrendChart.tsx` created
- [ ] Recharts LineChart component
- [ ] Fetch last 12 months data
- [ ] Scope 1 line (dark green)
- [ ] Scope 2 line (light green)
- [ ] X-axis: months in Bulgarian
- [ ] Y-axis: tCO2e
- [ ] Tooltip on hover
- [ ] Responsive sizing
- [ ] Loading state
- [ ] Empty state (no data message)

**Emission Breakdown Charts**
- [ ] `components/dashboard/EmissionBreakdownChart.tsx` created
- [ ] Scope 1 vs 2 donut chart
- [ ] Category breakdown bar chart
- [ ] Color coded by earth palette
- [ ] Percentage labels
- [ ] Interactive (click to drill down - future)
- [ ] Responsive layout

**API Route for Dashboard Data**
- [ ] `app/api/dashboard/stats/route.ts` created
- [ ] GET endpoint
- [ ] Fetch current month emissions
- [ ] Fetch last 12 months for trends
- [ ] Fetch category breakdown
- [ ] Calculate all metrics
- [ ] Return structured JSON
- [ ] RLS enforced (company_id filter)

**Progress:** ___/28 (___%)

---

### Week 15-16: CSV/Excel Import

**Import Template Creation**
- [ ] Excel template created
- [ ] Bulgarian column headers
- [ ] Example data rows
- [ ] Instructions sheet
- [ ] Validation rules in Excel
- [ ] Template available for download

**Import Page**
- [ ] `app/(dashboard)/data-entry/import/page.tsx` created
- [ ] File upload component
- [ ] Accepted formats: .xlsx, .xls, .csv
- [ ] Template download button
- [ ] File validation (format, size)
- [ ] Preview before import
- [ ] Column mapping (if needed)
- [ ] Import button
- [ ] Progress indicator
- [ ] Results summary

**Import Processing**
- [ ] `app/api/emissions/import/route.ts` created
- [ ] Parse Excel/CSV file
- [ ] Validate each row
- [ ] Map to emission_data schema
- [ ] Look up emission factors
- [ ] Calculate CO2e for each entry
- [ ] Bulk insert to database
- [ ] Return success/error report
- [ ] Handle duplicate detection

**Import Library**
- [ ] Install xlsx library
- [ ] `lib/import/excel-parser.ts` created
- [ ] Parse .xlsx files
- [ ] Parse .csv files
- [ ] Validate column headers
- [ ] Convert to standard format
- [ ] Error handling for malformed files

**Progress:** ___/20 (___%)

---

## Phase 3: Reports & Polish (Weeks 17-24) 📄

### Week 17-18: PDF Report Generation

**PDF Generation Library**
- [ ] Install jsPDF
- [ ] `lib/reports/pdf-generator.ts` created
- [ ] `generateComplianceReport()` function
- [ ] Company logo in header
- [ ] Formatted tables
- [ ] Charts as images
- [ ] Footer with page numbers
- [ ] Bulgarian text rendering correctly

**Compliance Report**
- [ ] Company information section
- [ ] Reporting period
- [ ] Emissions summary table
- [ ] Scope 1, 2, total (tCO2e)
- [ ] Methodology statement
- [ ] Emission factors reference
- [ ] Data quality statement
- [ ] CSRD compliance confirmation
- [ ] Signatures section
- [ ] ZED branding

**Internal Report**
- [ ] Executive summary page
- [ ] Key metrics section
- [ ] Trend chart (last 12 months)
- [ ] Category breakdown chart
- [ ] Month-over-month comparison table
- [ ] Year-over-year comparison (if applicable)
- [ ] Data completeness indicator
- [ ] Professional formatting

**Sustainability Certificate**
- [ ] Certificate template designed
- [ ] Company name and logo
- [ ] "ZED Carbon Footprint Certified" badge
- [ ] Total footprint value (large, prominent)
- [ ] Reporting year
- [ ] Sustainability statement
- [ ] Beautiful design (printable)
- [ ] A4 format

**Report API Route**
- [ ] `app/api/reports/generate/route.ts` created
- [ ] POST endpoint
- [ ] Parameters: companyId, startDate, endDate, reportType
- [ ] Fetch company data
- [ ] Fetch emissions data for period
- [ ] Calculate totals
- [ ] Generate appropriate PDF
- [ ] Return PDF as download
- [ ] Save report record to database
- [ ] Error handling

**Progress:** ___/29 (___%)

---

### Week 19-20: Reports UI & Download

**Reports Page**
- [ ] `app/(dashboard)/reports/page.tsx` created
- [ ] Report type selector (3 types)
- [ ] Date range picker
- [ ] Preview section
- [ ] Generate button
- [ ] Loading state during generation
- [ ] Download button
- [ ] Email button (send via email)
- [ ] Report history list
- [ ] Regenerate previous reports

**Report History**
- [ ] `reports` table query
- [ ] List of previously generated reports
- [ ] Sort by date (newest first)
- [ ] Re-download capability
- [ ] Delete old reports
- [ ] Pagination if many reports

**Email Functionality**
- [ ] Email sending service setup (optional for MVP)
- [ ] Email template in Bulgarian
- [ ] Attach PDF to email
- [ ] Send to primary contact email
- [ ] Confirmation toast

**Progress:** ___/15 (___%)

---

### Week 21-22: Educational Features & Polish

**Tooltips System**
- [ ] `components/ui/InfoTooltip.tsx` created
- [ ] "?" icon with hover/click
- [ ] Tooltip content in Bulgarian
- [ ] Positioned correctly (top/bottom/left/right)
- [ ] Accessible (keyboard navigation)

**Tooltip Content**
- [ ] "What is Scope 1?" - on Scope 1 sections
- [ ] "What is Scope 2?" - on Scope 2 sections
- [ ] "What is tCO2e?" - on emissions displays
- [ ] "What is CSRD?" - on compliance info
- [ ] "Emission factors" - on calculation sections
- [ ] "How to find data on bills" - on data entry
- [ ] Category-specific tooltips (vehicles, electricity, etc.)

**Help Section**
- [ ] `app/(dashboard)/help/page.tsx` created
- [ ] FAQ list
- [ ] Common questions answered
- [ ] Contact support form
- [ ] Links to Bulgarian/EU regulatory sources
- [ ] Video tutorials (placeholders for Phase 2)
- [ ] Search functionality (optional)

**Onboarding (Optional)**
- [ ] Welcome modal on first login
- [ ] Quick tour of main features
- [ ] Skip button
- [ ] "Don't show again" checkbox

**UI Polish**
- [ ] Consistent spacing throughout
- [ ] Loading skeletons on all async content
- [ ] Error states styled consistently
- [ ] Empty states with helpful messages
- [ ] Success animations (subtle)
- [ ] Hover states on all interactive elements
- [ ] Focus states for accessibility
- [ ] Smooth transitions

**Bulgarian Language Review**
- [ ] All text reviewed by native speaker
- [ ] Grammar corrections applied
- [ ] Terminology consistency checked
- [ ] Proper character encoding (UTF-8)

**Progress:** ___/28 (___%)

---

### Week 23-24: Testing, Bug Fixes & Pilot Prep

**Unit Testing**
- [ ] Jest configured properly
- [ ] All calculation functions tested
- [ ] Validation functions tested
- [ ] Utility functions tested
- [ ] 90%+ code coverage on critical paths

**Integration Testing**
- [ ] Complete workflow tested:
  - [ ] Login
  - [ ] View dashboard
  - [ ] Add emission data (manual)
  - [ ] Import CSV
  - [ ] View updated dashboard
  - [ ] Generate all 3 report types
  - [ ] Download reports
  - [ ] Logout
- [ ] Admin workflow tested:
  - [ ] Create company
  - [ ] View all companies
  - [ ] Manage emission factors
  - [ ] View any company data

**RLS Testing**
- [ ] Client user can only see own company
- [ ] Client cannot see other companies
- [ ] Admin can see all companies
- [ ] Admin can manage all data
- [ ] No data leakage between companies
- [ ] Tested with multiple test accounts

**Performance Testing**
- [ ] Page load times measured
- [ ] All pages <2 seconds
- [ ] API responses <1 second
- [ ] Report generation <30 seconds
- [ ] Dashboard refresh <3 seconds
- [ ] Large dataset tested (1000+ entries)

**Security Audit**
- [ ] All API routes check authentication
- [ ] Admin routes verify admin role
- [ ] Input validation on all forms
- [ ] SQL injection tested (RLS + Supabase protection)
- [ ] XSS tested (React escaping)
- [ ] CSRF protection verified (Next.js built-in)
- [ ] No sensitive data in console logs
- [ ] .env.local not committed to git

**Bug Fixes**
- [ ] Critical bugs fixed (0 remaining)
- [ ] High priority bugs fixed
- [ ] Medium priority bugs triaged
- [ ] Known issues documented

**Pilot Preparation**
- [ ] Demo environment set up
- [ ] Test data created (3 sample companies)
- [ ] User documentation written
- [ ] Admin guide created
- [ ] Support process defined
- [ ] Feedback form created

**Final Polish**
- [ ] All console errors fixed
- [ ] All console warnings addressed
- [ ] Code cleanup (remove commented code, debug logs)
- [ ] README updated
- [ ] Documentation complete
- [ ] Git history clean (no sensitive data)

**Progress:** ___/48 (___%)

---

## Overall MVP Progress

### Summary

**Phase 1:** ___/94 items (___%)  
**Phase 2:** ___/111 items (___%)  
**Phase 3:** ___/120 items (___%)  

**TOTAL MVP:** ___/325 items (___%)

---

## 🐛 Issues & Blockers

### Week 1-2
- [ ] Issue: ___________________
  - Status: ___________________
  - Owner: ___________________
  - Resolution: ___________________

### Week 3-4
- [ ] Issue: ___________________
  - Status: ___________________
  - Owner: ___________________
  - Resolution: ___________________

### Week 5-6
- [ ] Issue: ___________________
  - Status: ___________________
  - Owner: ___________________
  - Resolution: ___________________

### Week 7-8
- [ ] Issue: ___________________
  - Status: ___________________
  - Owner: ___________________
  - Resolution: ___________________

*(Continue for all weeks)*

---

## 📊 Weekly Progress Reports

### Week 1: ___ / ___ / 2025
- **Completed:** 
- **In Progress:** 
- **Blockers:** 
- **Next Week:** 

### Week 2: ___ / ___ / 2025
- **Completed:** 
- **In Progress:** 
- **Blockers:** 
- **Next Week:** 

*(Continue for all 24 weeks)*

---

## 🎯 MVP Launch Readiness

### Pre-Launch Checklist

**Technical**
- [ ] All MVP features complete
- [ ] Zero critical bugs
- [ ] Performance targets met
- [ ] Security audit passed
- [ ] RLS policies verified
- [ ] Calculation accuracy verified
- [ ] All tests passing

**Content**
- [ ] Bulgarian language reviewed
- [ ] Help content complete
- [ ] Tooltips comprehensive
- [ ] Error messages user-friendly

**Documentation**
- [ ] User guide written
- [ ] Admin guide written
- [ ] API documentation (if needed)
- [ ] Support documentation
- [ ] Troubleshooting guide

**Business**
- [ ] 3-5 pilot companies identified
- [ ] Pilot agreement signed
- [ ] Pricing finalized
- [ ] Support process established
- [ ] Feedback mechanism ready

**Training**
- [ ] Internal team trained
- [ ] Demo video created
- [ ] Pilot company training scheduled
- [ ] Support team ready

### Launch Date: ___ / ___ / 2026

---

## 🎉 Success Metrics (Track Post-Launch)

### Month 1
- [ ] Pilot companies: ___ / 10
- [ ] Active users: ___
- [ ] Data entries: ___
- [ ] Reports generated: ___
- [ ] Support tickets: ___
- [ ] User satisfaction: ___/5

### Month 2
- [ ] Pilot companies: ___ / 15
- [ ] Active users: ___
- [ ] Data entries: ___
- [ ] Reports generated: ___
- [ ] Support tickets: ___
- [ ] User satisfaction: ___/5

### Month 3
- [ ] Pilot companies: ___ / 20
- [ ] Active users: ___
- [ ] Data entries: ___
- [ ] Reports generated: ___
- [ ] Support tickets: ___
- [ ] User satisfaction: ___/5

---

**Last Updated:** ___ / ___ / ___  
**Completed By:** ___________________  
**Status:** 🟡 In Progress | 🟢 Complete | 🔴 Blocked
