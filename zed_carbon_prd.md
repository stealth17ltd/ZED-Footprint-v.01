# Product Requirements Document (PRD)
## ZED Carbon Footprint Management System

**Document Version:** 1.0  
**Date:** October 8, 2025  
**Author:** Product Management Team  
**Status:** Draft for Review

---

## Executive Summary

ZED Carbon Footprint is an intelligent, AI-powered sustainability management platform designed specifically for small and mid-sized businesses in Bulgaria. The system enables companies to calculate their Scope 1 and Scope 2 carbon emissions in compliance with Bulgarian and EU regulations (CSRD), generate automated reduction strategies, and produce comprehensive reports that demonstrate environmental responsibility to clients and stakeholders.

**Key Differentiators:**
- Custom calculation methodology tailored to Bulgarian/EU requirements
- AI-powered strategy generation for emissions reduction
- Multi-method data collection (manual entry, OCR, file imports, system integrations)
- Beginner-friendly interface with educational guidance
- Community learning through anonymous strategy sharing

---

## 1. Product Vision & Objectives

### 1.1 Vision Statement
To empower Bulgarian businesses of all sizes to measure, understand, and reduce their carbon footprint through intelligent automation and data-driven strategies, positioning sustainability as a competitive advantage rather than a compliance burden.

### 1.2 Business Objectives
- Launch MVP within 6-8 months targeting 10-20 initial client companies
- Achieve 50+ active clients within 18-24 months
- Establish ZED as the leading Bulgarian carbon footprint management platform
- Enable 80% time savings on sustainability data collection and reporting
- Generate measurable carbon reduction outcomes for client businesses

### 1.3 Success Metrics
- Client acquisition rate
- User engagement (monthly active users, data entry frequency)
- Average carbon reduction achieved by clients (%)
- Report generation volume
- Strategy implementation rate
- Client retention rate (annual license renewals)

---

## 2. Target Audience

### 2.1 Primary Users

**Small Businesses (5-50 employees)**
- **Profile:** Limited sustainability expertise, single-location operations
- **Pain Points:** Manual tracking, lack of guidance, unclear regulations
- **Goals:** Basic compliance, cost reduction, client requirements
- **Technical Comfort:** Beginner to intermediate

**Mid-Sized Businesses (50-250 employees)**
- **Profile:** Dedicated sustainability contact, multi-location possible
- **Pain Points:** Data consolidation, complex calculations, reporting burden
- **Goals:** Regulatory compliance, competitive advantage, ESG reporting
- **Technical Comfort:** Intermediate

### 2.2 User Roles

**Administrator (ZED Team/Service Provider)**
- Creates and manages client company accounts
- Approves additional user accounts for clients
- Configures system settings and emission factors
- Provides technical support
- Has visibility across all client data (with appropriate security controls)

**Client/Employee (Business User)**
- Primary company account with ability to add approved additional users
- Full access to own company's data only
- Inputs emissions data through multiple methods
- Views dashboards and analytics
- Generates reports
- Manages reduction strategies
- Tracks progress over time

### 2.3 Geographic Focus
- **Primary Market:** Bulgaria (Sofia, Plovdiv, Varna, and other cities)
- **Language:** Bulgarian interface (English for internal documentation)
- **Compliance:** Bulgarian/EU sustainability regulations and standards

---

## 3. Core Features & Functionality

### 3.1 User Authentication & Profile Management

**Account Structure:**
- Administrator portal (ZED team)
- Client company accounts (one primary per company)
- Additional user accounts (approved by admin only)

**User Profile Fields:**
- First name, last name
- Email address (unique)
- Username
- Password (encrypted)
- Company affiliation
- Role/permissions
- Contact phone number

**Security Requirements:**
- Secure login via username/password
- Password complexity requirements
- Session management
- Account suspension capability
- Password recovery flow
- Two-factor authentication (future enhancement)

### 3.2 Company Master Data Management

**Company Information:**
- Legal company name
- Business registration number
- Industry sector/business area
- Number of employees
- Number of locations
- Primary contact information
- Billing address
- Company logo (optional)

**Sustainability Data:**
- Sustainability goals and targets
- Commitment to EU Green Deal (Y/N)
- Baseline year for comparisons
- Certification status (if any)
- Reporting period preferences

**Multi-Location Support:**
- Separate data entry per location
- Location-specific emission tracking
- Consolidated company-wide reporting
- Location comparison analytics

### 3.3 Data Collection & Input Methods

#### 3.3.1 Manual Data Entry Forms

**Scope 1 Emissions Data Entry:**
- **Company Vehicles:**
  - Vehicle type (car, van, truck, etc.)
  - Fuel type (petrol, diesel, CNG, LPG)
  - Monthly fuel consumption (liters)
  - Distance traveled (km) - optional
  - Vehicle count by type
  
- **On-Site Fuel Consumption:**
  - Natural gas for heating (m³)
  - Diesel for generators (liters)
  - LPG for equipment (kg)
  - Coal (if applicable) (kg)
  
- **Refrigerants & Industrial Gases:**
  - Refrigerant type (R-410A, R-32, etc.)
  - Quantity recharged/leaked (kg)
  - Fire suppression gases (if applicable)

**Scope 2 Emissions Data Entry:**
- **Electricity Consumption:**
  - Monthly consumption (kWh)
  - Utility provider name
  - Grid region (for location-based calculations)
  - Renewable energy percentage (if known)
  
- **Purchased Heating/Cooling:**
  - District heating (MWh)
  - District cooling (MWh)
  - Steam purchases (tons)

**Form Features:**
- Date range selection
- Location assignment (for multi-location businesses)
- Supporting documentation upload
- Notes/comments field
- Draft save capability
- Validation warnings for unusual values
- Mandatory explanation field for outlier data

#### 3.3.2 File Import System

**Excel/CSV Template Import:**
- **Phase 1 (MVP):** Standard downloadable templates
  - Bulgarian and English versions
  - Pre-formatted column headers
  - Built-in instructions
  - Example data rows
  - Auto-validation on upload
  
- **Phase 2 (Future):** Flexible mapping
  - Upload any spreadsheet format
  - AI-powered column detection
  - Drag-and-drop mapping interface
  - Save custom mapping templates
  - Bulk data import capability

**Supported File Formats:**
- Excel (.xlsx, .xls)
- CSV (.csv)
- PDF (for OCR processing)

#### 3.3.3 PDF Bill OCR Processing

**Utility Bill Recognition:**
- Upload utility bills (electricity, gas, water)
- Automatic text extraction using OCR
- Smart field detection:
  - Account number
  - Billing period
  - Consumption amount
  - Unit of measurement
  - Supplier name
  
**User Workflow:**
1. Upload PDF bill
2. System extracts data automatically
3. User reviews and confirms accuracy
4. Corrections possible before saving
5. PDF stored as supporting documentation

**Technical Requirements:**
- OCR accuracy >90%
- Support for Bulgarian and English bills
- Multiple PDF format compatibility
- Error handling for poor quality scans

#### 3.3.4 System Integrations (Future Phase)

**Accounting System Integrations:**
- Microinvest API connection
- SAP data import
- Microsoft Dynamics integration
- Custom API endpoints for other systems

**Utility Provider APIs:**
- Direct meter reading import (where available)
- Automated monthly data sync
- Bulgarian utility provider partnerships

**Data Sync Features:**
- Scheduled automatic imports
- Manual sync trigger option
- Conflict resolution interface
- Audit trail for imported data

### 3.4 Carbon Footprint Calculation Engine

#### 3.4.1 Calculation Methodology

**Custom Bulgarian/EU Approach:**
- Based on GHG Protocol Scope 1 & 2 framework
- Adapted for Bulgarian national grid emission factors
- Compliant with CSRD reporting requirements
- Annual updates for emission factor changes

**Emission Factor Database:**
- Bulgarian electricity grid factors (by region if applicable)
- Fuel combustion factors (petrol, diesel, natural gas, etc.)
- Refrigerant GWP (Global Warming Potential) values
- Industry-specific adjustment factors
- Regular updates from official EU/Bulgarian sources

**Calculation Formula:**
```
Total Carbon Footprint (tCO2e) = 
  Σ (Activity Data × Emission Factor × GWP)
```

**Scope Breakdown:**
- Scope 1 Direct Emissions (tCO2e)
- Scope 2 Location-Based Emissions (tCO2e)
- Scope 2 Market-Based Emissions (if renewable energy contracts exist)
- Total Combined Emissions

#### 3.4.2 Data Validation & Quality Control

**Automated Validation Rules:**
- Range checks (e.g., consumption within expected limits)
- Period-over-period comparison (flag >30% changes)
- Industry benchmark comparison (optional)
- Unit consistency verification
- Completeness checks (missing data alerts)

**Warning System:**
- Yellow warning: Data seems unusual, please verify
- Orange warning: Data significantly different from previous period, explanation required
- Red error: Invalid data format or impossible values
- Green confirmation: Data accepted and validated

**Explanation Requirement:**
- Mandatory text field for flagged data
- Examples: "New equipment installed," "Seasonal increase," "Location expansion"
- Admin review queue for unusual patterns

#### 3.4.3 Calculation Transparency

**User-Facing Information:**
- Show which emission factors were used
- Display calculation methodology
- Link to source documentation
- Changelog for emission factor updates
- "How is this calculated?" tooltips throughout interface

---

### 3.5 Dashboard & Visualization

#### 3.5.1 Main Dashboard Layout

**Design Principles:**
- Clean, minimalist style with green/earth tones
- Responsive design (desktop, tablet, mobile browsers)
- Bulgarian language interface
- High contrast for accessibility
- Logical grouping of related information

**Dashboard Components (Top to Bottom):**

1. **Hero Section - Current Status**
   - Large, clear total carbon footprint number (tCO2e)
   - Visual indicator: Green (improving), Yellow (stable), Red (increasing)
   - Comparison to previous period (%, arrow up/down)
   - Progress toward annual target (if set)

2. **Action Items Panel**
   - Number of pending data entries
   - Upcoming deadlines (e.g., "Monthly data due in 3 days")
   - Active strategies in progress (count)
   - New AI recommendations available (count)
   - Quick action buttons: "Add Data," "View Strategies," "Generate Report"

3. **Emissions Trend Graph**
   - Line chart showing last 12 months
   - Scope 1 and Scope 2 as separate lines
   - Interactive: hover for exact values
   - Color-coded: Scope 1 (darker green), Scope 2 (lighter green)
   - Option to toggle between monthly/quarterly/annual view

4. **Emission Breakdown**
   - Donut chart: Scope 1 vs Scope 2 proportion
   - Bar chart: By category (vehicles, electricity, heating, etc.)
   - Interactive: click to drill down into details
   - Percentage contribution labels

5. **Active Strategies Progress**
   - List of top 3-5 current reduction initiatives
   - Progress bars showing completion %
   - Estimated CO2 savings vs. actual savings
   - Status indicators: Planned, In Progress, Completed

6. **Alerts & Notifications**
   - System messages (e.g., "New emission factors available")
   - Regulatory updates relevant to Bulgaria/EU
   - Data quality alerts
   - Celebration messages (e.g., "You've reduced emissions by 15% this quarter!")

#### 3.5.2 Detailed Analytics Views

**Emissions by Category:**
- Detailed breakdown charts
- Month-over-month comparison tables
- Year-over-year trends
- Exportable data tables

**Location Comparison (Multi-Location Businesses):**
- Side-by-side location performance
- Emissions per employee by location
- Emissions per square meter by location
- Best performing location highlights

**Benchmarking Dashboard:**
- Anonymous comparison to similar businesses
- Industry average indicators
- Percentile ranking (e.g., "Your emissions are in the top 30% for manufacturing")
- Best practice insights from high performers

#### 3.5.3 Data Visualization Standards

**Chart Types:**
- Line charts: Trends over time
- Bar charts: Category comparisons
- Donut/pie charts: Proportion breakdowns (use sparingly)
- Heatmaps: Location or time-based intensity
- Progress bars: Strategy completion, goal achievement

**Color Palette:**
- Primary: Earth green (#2D5016, #4A7729)
- Secondary: Light green (#8BC34A, #C5E1A5)
- Accents: Natural brown (#6D4C41)
- Neutral: White, light gray (#F5F5F5)
- Alerts: Amber (#FFA726), Red (#E53935)
- Success: Deep green (#388E3C)

**Accessibility:**
- WCAG 2.1 AA compliance
- High contrast ratios (minimum 4.5:1)
- Color-blind friendly palettes
- Alternative text for all visuals
- Keyboard navigation support
- Screen reader compatibility

---

### 3.6 AI-Powered Strategy Generation

#### 3.6.1 Strategy Analysis Engine

**Data Analysis:**
- Identify emission hotspots (highest contributors)
- Detect inefficiencies (vs. industry benchmarks)
- Analyze trends (increasing/decreasing categories)
- Consider company size, industry, location
- Review successful strategies from similar businesses

**AI Recommendation Generation:**
- Fully automated based on company data
- Updated monthly as new data is entered
- Prioritized by impact potential (high, medium, low)
- Categorized by timeframe (short, medium, long-term)
- Sorted by implementation complexity

#### 3.6.2 Strategy Library & Matching

**Strategy Categories:**
- Energy efficiency (lighting, HVAC, equipment)
- Renewable energy adoption (solar, wind contracts)
- Vehicle fleet optimization (electric vehicles, routing)
- Behavioral changes (remote work, energy awareness)
- Operational improvements (process optimization, waste reduction)
- Supplier engagement (for future Scope 3)

**Strategy Details:**
- Title and description
- Estimated CO2 reduction (tCO2e/year)
- Implementation timeframe (weeks/months)
- Complexity level (simple, moderate, complex)
- Prerequisites (if any)
- Success metrics
- Links to Bulgarian suppliers/providers (where relevant)

**Example AI-Generated Recommendations:**

1. **"Switch to LED Lighting in Production Area"**
   - Estimated reduction: 2.3 tCO2e/year
   - Timeframe: 1-2 months
   - Complexity: Simple
   - Rationale: "Your electricity consumption is 30% higher than similar manufacturing businesses. LED retrofits typically reduce lighting energy by 60%."

2. **"Optimize Delivery Vehicle Routes"**
   - Estimated reduction: 4.1 tCO2e/year
   - Timeframe: Immediate
   - Complexity: Simple
   - Rationale: "Your vehicle fuel consumption suggests inefficient routing. Route optimization software can reduce fuel use by 10-15%."

3. **"Install Solar Panels (20 kW system)"**
   - Estimated reduction: 8.5 tCO2e/year
   - Timeframe: 6-12 months
   - Complexity: Complex
   - Rationale: "Based on your roof area and electricity consumption, a solar installation could offset 35% of your Scope 2 emissions."

#### 3.6.3 Strategy Management Workflow

**User Actions:**
1. View AI-generated recommendations
2. Mark strategies as:
   - **Planned:** Considering for future
   - **In Progress:** Currently implementing
   - **Completed:** Finished implementation
   - **Not Applicable:** Dismissed with reason
3. Track progress with notes and updates
4. Upload supporting documentation
5. Report actual CO2 savings achieved

**Progress Tracking:**
- Start date, target completion date
- Status updates (text entries)
- Responsible person assignment
- Budget tracking (optional, no cost estimates provided by system)
- Actual vs. estimated savings comparison
- Photo uploads (e.g., new LED lights installed)

**Community Learning:**
- Anonymized successful strategies shared across platform
- "Businesses like yours achieved X% reduction by doing Y"
- Success story highlights (with company permission)
- Best practice library

---

### 3.7 Reporting & Documentation

#### 3.7.1 Report Types

**1. Compliance Reports (Essential)**

**Basic Emissions Summary:**
- Company information header
- Reporting period
- Total Scope 1 emissions (tCO2e)
- Total Scope 2 emissions (tCO2e)
- Combined total emissions
- Methodology statement (GHG Protocol compliant)
- Emission factor sources cited
- Data quality statement

**Bulgarian/EU Compliance Statement:**
- Confirmation of compliance with CSRD requirements (for applicable businesses)
- Reference to Bulgarian sustainability regulations
- Declaration of methodology alignment
- Prepared by / Reviewed by signatures

**Audit Trail Documentation:**
- Complete data entry log
- Who entered what data and when
- Data source documentation (uploaded bills, etc.)
- Validation flags and resolutions
- Calculation methodology details
- Emission factors used with effective dates

**2. Internal Reports (Business Value)**

**Monthly/Quarterly Emissions Dashboard Report:**
- Executive summary (1 page)
- Key metrics: Total emissions, change vs. previous period
- Visual charts: Trends, breakdowns, comparisons
- Emission hotspot analysis
- Data completeness indicator
- Generated in PDF format

**Year-over-Year Comparison Report:**
- Annual emissions by year (table and chart)
- Percentage change analysis
- Scope 1 vs. Scope 2 trends
- Breakdown by category over years
- Location performance (if multi-location)
- Commentary on major changes

**Emission Hotspot Analysis Report:**
- Ranking of emission sources by contribution
- Top 5 emission categories highlighted
- Comparison to industry benchmarks
- Specific recommendations for each hotspot
- Estimated reduction potential
- Priority action matrix

**3. Stakeholder Reports (Competitive Advantage)**

**Executive Summary (One-Page):**
- Company logo and name
- Reporting period
- Total carbon footprint (large, prominent)
- Key achievements (e.g., "15% reduction vs. last year")
- Top 3 active reduction strategies
- Visual appeal: charts, icons, minimal text
- Branded ZED footer

**Client-Facing Sustainability Certificate:**
- Professional certificate design
- Company name and logo
- "ZED Carbon Footprint Certified" badge
- Carbon footprint value and reporting year
- Statement of commitment to sustainability
- QR code linking to public summary (optional)
- Shareable via email, social media, website
- Printable PDF (A4 size)

**Reduction Progress Report:**
- Narrative format with visuals
- Starting baseline vs. current emissions
- Strategies implemented (completed only)
- Actual CO2 savings achieved
- Financial savings (if user provides cost data)
- Environmental impact translation (e.g., "equivalent to planting X trees")
- Future goals and targets
- Professional formatting for external sharing

#### 3.7.2 Report Generation Features

**On-Demand Generation:**
- User selects report type
- Chooses date range/period
- Selects location(s) to include (if applicable)
- Clicks "Generate Report"
- Processing time: <30 seconds for standard reports

**Export Formats:**
- **PDF:** All report types (primary format)
- **Excel (.xlsx):** Data tables, emissions by category, raw data export
- **CSV:** Raw emissions data for further analysis

**Sharing Capabilities:**
- Direct email from platform
- Download to local device
- Generate shareable link (with expiration date and password protection)
- Print-optimized layout

**Report Scheduling (Future Enhancement):**
- Automated monthly report generation
- Email delivery to specified recipients
- Quarterly stakeholder reports

**Customization Options:**
- Add company logo
- Choose color scheme (within brand guidelines)
- Include/exclude specific sections
- Add custom text sections
- Language selection (Bulgarian default, English future)

---

### 3.8 Educational & Guidance Features

#### 3.8.1 Built-in Help System

**Contextual Tooltips:**
- Hover/click "?" icons throughout interface
- Explain terminology (e.g., "What is Scope 1?")
- Describe Bulgarian/EU requirements
- Provide data entry guidance
- Show calculation examples

**Tooltip Coverage:**
- All emission categories
- Data input fields
- Report types
- Strategy recommendations
- Regulatory references
- Carbon footprint metrics

**Example Tooltips:**
- "Scope 1 Emissions: Direct greenhouse gas emissions from sources your company owns or controls, such as company vehicles and on-site fuel burning."
- "CSRD: Corporate Sustainability Reporting Directive - EU regulation requiring certain companies to report sustainability information."
- "tCO2e: Tons of carbon dioxide equivalent - a standard unit that combines all greenhouse gases into one comparable value."

#### 3.8.2 Guided Workflows

**First-Time User Onboarding:**
- Welcome screen with video or interactive tour
- Step-by-step setup wizard:
  1. Complete company profile
  2. Set sustainability goals
  3. Enter first month's data (guided)
  4. Review first carbon footprint calculation
  5. Explore dashboard features
- Progress indicator (e.g., "Step 2 of 5")
- Skip option for advanced users

**Data Entry Wizards:**
- "Add Monthly Data" guided flow
- Category-by-category prompts
- Visual aids (icons, images)
- Tips for finding data on bills
- Validation as you go
- Summary review before submission

#### 3.8.3 Regulatory Guidance

**Bulgarian/EU Requirements Explainer:**
- Summary of CSRD requirements
- Who needs to comply and when
- What data is required
- How ZED helps meet requirements
- Links to official Bulgarian/EU sources

**Updates & Alerts:**
- Notification when regulations change
- Plain-language explanation of impact
- What actions users need to take
- Deadline reminders
- Archive of regulatory updates

#### 3.8.4 Best Practices Library

**Topics Covered:**
- How to collect emissions data effectively
- Working with utility providers
- Engaging employees in sustainability
- Setting realistic reduction targets
- Communicating sustainability achievements
- Bulgarian-specific resources and contacts

**Content Formats:**
- Text articles
- Video tutorials (future)
- Downloadable guides (PDF)
- FAQs
- Case studies from successful clients

---

### 3.9 Benchmarking & Community Features

#### 3.9.1 Anonymous Benchmarking

**Industry Comparisons:**
- Emissions per employee
- Emissions per revenue (if user provides revenue data)
- Emissions per square meter
- Category-specific benchmarks (e.g., vehicle efficiency)

**Data Presentation:**
- "Your Business: X tCO2e | Industry Average: Y tCO2e"
- Percentile indicator (e.g., "You're in the top 25% of performers")
- Visual gauge chart
- Trend comparison (improving faster/slower than industry)

**Privacy Protection:**
- All comparisons fully anonymized
- Minimum 5 companies required for benchmark display
- No individual company identification possible
- User consent required to include their data in benchmarks

#### 3.9.2 Strategy Sharing Community

**Success Story Database:**
- Browse strategies implemented by other businesses
- Filter by industry, company size, strategy type
- See actual results achieved (anonymized)
- Implementation tips and lessons learned
- "Like" or "Want to try" indicators

**Contribution Options:**
- Share completed strategies (anonymously or with company name)
- Rate strategy effectiveness
- Add implementation notes
- Upload photos (optional, with approval)

**Moderation:**
- Admin review before strategies go live
- Quality standards enforcement
- Spam/inappropriate content filtering

**Example Community Insight:**
"15 manufacturing businesses in Bulgaria reduced emissions by an average of 12% by switching to LED lighting. Payback period: 18 months."

---

## 4. Technical Architecture

### 4.1 System Architecture

**Deployment Model:** Cloud-based SaaS (Software as a Service)

**Technology Stack Recommendations:**

**Frontend:**
- React.js or Vue.js (modern, responsive)
- Tailwind CSS or Material-UI for components
- Chart.js or Recharts for data visualization
- Responsive design framework
- Progressive Web App (PWA) capabilities

**Backend:**
- Node.js with Express.js OR Python with Django/FastAPI
- RESTful API architecture
- Microservices architecture (future scalability)

**Database:**
- PostgreSQL (primary relational database)
- Redis (caching layer for performance)
- Document storage for PDFs and files

**AI/ML Components:**
- Python-based ML services
- TensorFlow or PyTorch for strategy recommendation engine
- OpenCV or Tesseract for OCR processing
- Natural Language Processing for text extraction

**Hosting & Infrastructure:**
- Bulgarian data center OR EU-region cloud (AWS, Google Cloud, Azure)
- GDPR-compliant hosting provider
- Load balancing for scalability
- Automated backup systems (daily)
- Disaster recovery plan

**Security:**
- SSL/TLS encryption for all data in transit
- AES-256 encryption for data at rest
- OAuth 2.0 or JWT for authentication
- Role-based access control (RBAC)
- Regular security audits
- Penetration testing (annually)
- GDPR compliance measures

### 4.2 Data Model (Conceptual)

**Core Entities:**

**Company:**
- CompanyID (PK)
- CompanyName
- RegistrationNumber
- Industry
- EmployeeCount
- CreatedDate
- SubscriptionStatus
- PrimaryContactUserID (FK)

**User:**
- UserID (PK)
- CompanyID (FK)
- FirstName, LastName
- Email (unique)
- Username
- PasswordHash
- Role (Admin/Client)
- IsActive
- CreatedDate
- LastLoginDate

**Location:**
- LocationID (PK)
- CompanyID (FK)
- LocationName
- Address
- SquareMeters
- EmployeeCount
- IsActive

**EmissionData:**
- DataID (PK)
- CompanyID (FK)
- LocationID (FK)
- ReportingPeriod (Month/Year)
- Scope (1 or 2)
- Category (Vehicle, Electricity, Heating, etc.)
- ActivityValue (numeric)
- Unit (liters, kWh, m³, etc.)
- EmissionFactor
- CalculatedCO2e
- DataSource (Manual, Import, OCR, API)
- UploadedBy (UserID)
- UploadedDate
- ValidationStatus
- Notes

**Strategy:**
- StrategyID (PK)
- CompanyID (FK)
- StrategyTitle
- Description
- Category
- EstimatedReduction (tCO2e)
- Status (Planned, InProgress, Completed, NotApplicable)
- StartDate
- TargetCompletionDate
- ActualCompletionDate
- ActualReduction (tCO2e)
- IsSharedCommunity (boolean)
- CreatedDate

**Report:**
- ReportID (PK)
- CompanyID (FK)
- ReportType
- ReportingPeriod
- GeneratedDate
- GeneratedBy (UserID)
- FilePath
- Format (PDF, Excel, CSV)

**EmissionFactor:**
- FactorID (PK)
- Category
- SubCategory
- Region (Bulgaria/EU)
- Value
- Unit
- Source
- EffectiveDate
- ExpiryDate

### 4.3 Integration Points

**Current Integrations (MVP):**
- Email service (SMTP for notifications)
- PDF generation library
- OCR service API
- Cloud storage for file uploads

**Future Integrations:**
- Microinvest API
- SAP Business One connector
- Bulgarian utility provider APIs
- Payment gateway (for subscription billing)
- SMS notifications (optional)

### 4.4 Performance Requirements

**Response Times:**
- Page load: <2 seconds
- Data entry form submission: <1 second
- Report generation: <30 seconds
- Dashboard refresh: <3 seconds
- OCR processing: <10 seconds per document

**Scalability:**
- Support 50 concurrent users initially
- Scale to 500 concurrent users (Year 2)
- Database capacity: 100,000 emission records minimum
- File storage: 1TB initially, expandable

**Availability:**
- Uptime target: 99.5% (excluding planned maintenance)
- Planned maintenance windows: Monthly, off-peak hours
- Backup frequency: Daily automated backups
- Recovery Time Objective (RTO): 4 hours
- Recovery Point Objective (RPO): 24 hours

### 4.5 Security & Compliance

**GDPR Compliance:**
- Data processing agreement with clients
- Privacy policy (Bulgarian and English)
- User consent management
- Right to access personal data
- Right to erasure ("right to be forgotten")
- Data portability (export user data)
- Breach notification procedures
- Data Protection Impact Assessment (DPIA)
- DPO (Data Protection Officer) designation

**Data Security Measures:**
- End-to-end encryption
- Regular security patches
- Vulnerability scanning
- Access logging and monitoring
- Multi-factor authentication (future)
- IP whitelisting option for enterprise clients
- Session timeout (30 minutes inactivity)

**Audit Trail:**
- All data changes logged
- User activity tracking
- System event logging
- Retention: 7 years minimum (for audit purposes)

---

## 5. User Interface Design Guidelines

### 5.1 Design Principles

**Visual Identity:**
- Clean, minimalist aesthetic
- Green/earth tone color palette
- Nature-inspired imagery where appropriate
- Professional and trustworthy feel
- Accessible to non-technical users

**Layout Standards:**
- Responsive grid system (desktop, tablet, mobile)
- Consistent navigation (top bar + sidebar)
- Breadcrumb navigation for deep pages
- Sticky header with quick actions
- Footer with help links and contact

**Typography:**
- Sans-serif primary font (e.g., Inter, Open Sans)
- Clear hierarchy (headings, body, captions)
- Minimum 14px for body text (accessibility)
- Line height 1.5 for readability

**Iconography:**
- Consistent icon set (e.g., Feather Icons, Lucide)
- Green accent icons
- Tooltips on hover
- Meaningful, not decorative

### 5.2 Key Screen Layouts

**Login Screen:**
- Centered login form
- Company logo (ZED Carbon Footprint)
- Username and password fields
- "Remember me" checkbox
- "Forgot password?" link
- Nature background image (subtle)

**Main Dashboard:**
- Top navigation bar: Logo, Company Name, User Profile, Notifications, Logout
- Left sidebar: Dashboard, Add Data, Reports, Strategies, Settings, Help
- Main content area: Dashboard widgets (as described in 3.5.1)
- Right sidebar (optional): Quick tips, upcoming deadlines

**Data Entry Form:**
- Progress indicator (if multi-step)
- Category selection (tabs or dropdown)
- Form fields with inline validation
- Upload button for supporting docs
- Save as draft / Submit buttons
- Help sidebar with relevant tips

**Reports Page:**
- Report type selection (cards or dropdown)
- Date range picker
- Preview pane
- Generate button (prominent)
- Report history list
- Download/share options

**Strategies Page:**
- Filter tabs: All, Recommended, In Progress, Completed
- Strategy cards with:
  - Title and description
  - Impact estimate (CO2e)
  - Status indicator
  - Action buttons (Start, Update, Complete)
- Detailed view modal for each strategy

### 5.3 Responsive Design

**Breakpoints:**
- Mobile: <768px
- Tablet: 768px - 1024px
- Desktop: >1024px

**Mobile Adaptations:**
- Collapsible sidebar (hamburger menu)
- Stacked dashboard widgets
- Touch-friendly buttons (min 44px height)
- Simplified charts (essential data only)
- Bottom navigation bar for quick access

**Tablet Adaptations:**
- Hybrid layout (sidebar visible on landscape)
- Adaptive grid (2 columns instead of 3)
- Full-featured charts

### 5.4 Accessibility (WCAG 2.1 AA)

**Visual:**
- Color contrast ratio ≥4.5:1
- Text resizing up to 200% without loss of functionality
- No information conveyed by color alone
- Focus indicators on all interactive elements
- Alternative text for all images and charts

**Navigation:**
- Keyboard navigation support (Tab, Enter, Escape)
- Skip to main content link
- Logical tab order
- Accessible form labels
- Error messages clearly associated with fields

**Screen Reader Support:**
- Semantic HTML markup
- ARIA labels where needed
- Descriptive link text
- Table headers for data tables
- Live regions for dynamic content updates

---

## 6. Development Phases & Milestones

### 6.1 Phase 1: MVP (Months 1-6)

**Month 1-2: Foundation**
- Requirements finalization and design mockups
- Technical architecture setup
- Development environment configuration
- Database schema design
- User authentication system
- Basic admin portal

**Month 3-4: Core Features**
- Company and user profile management
- Manual data entry forms (Scope 1 & 2)
- Calculation engine with Bulgarian/EU emission factors
- Basic dashboard with key visualizations
- Data validation system

**Month 5-6: Reports & Polish**
- Compliance report generation
- Internal report templates
- Client-facing certificate design
- Excel/CSV template system
- Bulgarian language implementation
- User testing and bug fixes
- Security audit
- Beta testing with 3-5 pilot companies

**MVP Feature Set:**
- ✓ User authentication (Admin + Client roles)
- ✓ Company master data management
- ✓ Manual data entry (Scope 1 & 2)
- ✓ Excel/CSV template import
- ✓ Carbon footprint calculation (Bulgarian/EU methodology)
- ✓ Main dashboard with visualizations
- ✓ Basic compliance reports
- ✓ Internal reports (monthly summary, year-over-year)
- ✓ Client-facing sustainability certificate
- ✓ Contextual tooltips and help
- ✓ Bulgarian language interface
- ✓ GDPR compliance measures

### 6.2 Phase 2: Enhanced Features (Months 7-12)

**Months 7-8: AI Strategy Engine**
- AI recommendation algorithm development
- Strategy library creation
- Strategy management workflow
- Progress tracking features
- Community sharing framework

**Months 9-10: Advanced Data Collection**
- PDF OCR implementation
- Flexible file mapping system
- Multi-location support enhancements
- Data quality analytics
- Benchmarking system

**Months 11-12: Stakeholder Features**
- Executive summary report design
- Reduction progress report
- Enhanced visualizations
- Dark mode option
- Mobile optimization improvements

**Phase 2 Additions:**
- ✓ AI-powered strategy recommendations
- ✓ Strategy implementation tracking
- ✓ PDF bill OCR processing
- ✓ Flexible CSV/Excel mapping
- ✓ Multi-location consolidated reporting
- ✓ Anonymous benchmarking
- ✓ Community strategy sharing
- ✓ Executive summary reports
- ✓ Enhanced mobile experience

### 6.3 Phase 3: Enterprise & Integration (Months 13-18)

**Months 13-15: System Integrations**
- Microinvest API integration
- SAP connector development
- Accounting system adapters
- Automated data sync capabilities
- API documentation for third parties

**Months 16-18: Advanced Features**
- CSRD-compliant full reporting (for larger clients)
- Custom report builder
- Audit-ready documentation packages
- Advanced forecasting models
- White-label options for consultants
- English language interface option

**Phase 3 Additions:**
- ✓ Accounting system integrations (Microinvest, SAP)
- ✓ Automated data import scheduling
- ✓ Full CSRD compliance reports
- ✓ Custom report builder
- ✓ Predictive analytics and forecasting
- ✓ Multi-language support (English)
- ✓ Advanced user roles and permissions
- ✓ White-label capabilities

### 6.4 Future Roadmap (18+ Months)

**Scope 3 Expansion:**
- Supply chain emissions tracking
- Business travel calculations
- Employee commuting
- Purchased goods and services
- Waste disposal

**Advanced AI Features:**
- Predictive emissions modeling
- Anomaly detection
- Automated optimization suggestions
- Natural language query interface
- Chatbot support assistant

**Mobile Applications:**
- Native iOS app
- Native Android app
- Offline data entry capability
- Push notifications

**Ecosystem Expansion:**
- Supplier engagement portal
- Public sustainability badges for websites
- Integration marketplace
- Consultant network program

---

## 7. Business Model & Pricing Strategy

### 7.1 Revenue Model

**Primary Model:** Annual License / Service-Based

**Pricing Structure Options:**

**Option A: Annual License per Company**
- Single annual fee per company
- Unlimited users within company
- All locations included
- All features included (no tiers)
- Support and updates included
- Price scales with company size (small/medium)

**Option B: Service-Based (Recommended for Launch)**
- Annual subscription includes:
  - Software access
  - Setup and onboarding support
  - Data quality review (quarterly)
  - Regulatory compliance updates
  - Email/phone support
  - Annual strategy consultation
- Positions ZED as a service provider, not just software
- Higher perceived value
- Justifies premium pricing

**Recommended Launch Pricing (Indicative):**
- Small businesses (5-50 employees): 2,000-3,500 BGN/year
- Mid-sized businesses (50-250 employees): 4,000-8,000 BGN/year
- Custom pricing for larger organizations

**Payment Terms:**
- Annual payment (preferred)
- Quarterly payment option (+10% total)
- 30-day money-back guarantee
- Multi-year discount (10% for 2-year commitment)

### 7.2 Value Proposition

**For Small Businesses:**
- "Achieve sustainability compliance in hours, not weeks"
- "Win more clients by demonstrating environmental responsibility"
- "Reduce operational costs through AI-guided efficiency improvements"

**For Mid-Sized Businesses:**
- "Comprehensive sustainability management in one platform"
- "Meet CSRD requirements with confidence"
- "Turn sustainability data into competitive advantage"

**ROI Arguments:**
- Time savings: 80% reduction in data collection and reporting time
- Cost avoidance: Prevent regulatory penalties
- Revenue impact: Meet tender requirements, attract ESG-conscious clients
- Operational savings: Energy efficiency recommendations pay for themselves

### 7.3 Sales & Marketing Strategy

**Target Channels:**
- Direct sales (ZED sales team)
- Sustainability consultants (partner network)
- Industry associations (manufacturing, retail, logistics)
- Government programs (green business initiatives)

**Marketing Tactics:**
- Content marketing (sustainability blog, guides)
- Case studies from pilot clients
- Webinars on Bulgarian/EU compliance
- Trade show presence
- LinkedIn advertising (B2B targeting)
- Referral program (discount for referrals)

**Client Acquisition Goals:**
- Year 1: 10-20 clients (pilot + early adopters)
- Year 2: 50 clients (scaling phase)
- Year 3: 150+ clients (market establishment)

---

## 8. Success Criteria & KPIs

### 8.1 Product Success Metrics

**User Engagement:**
- Monthly active users: >80% of licensed companies
- Average data entries per month per company: ≥1
- Dashboard views per user per month: ≥4
- Report generations per company per quarter: ≥2

**Feature Adoption:**
- Companies using AI strategies: >60%
- Strategies marked "In Progress" or "Completed": ≥3 per company
- Companies using file import: >40%
- Companies generating client-facing certificates: >70%

**Quality Metrics:**
- Data validation flag resolution rate: >95%
- Average time to first report: <7 days from signup
- User-reported bugs: <5 per month (post-launch)
- System uptime: >99.5%

### 8.2 Business Success Metrics

**Revenue:**
- Annual Recurring Revenue (ARR) growth: >100% Year 1 to Year 2
- Customer Acquisition Cost (CAC): <6,000 BGN
- Customer Lifetime Value (LTV): >18,000 BGN
- LTV:CAC ratio: >3:1

**Customer Success:**
- Client retention rate: >85% annual renewal
- Net Promoter Score (NPS): >40
- Customer satisfaction (CSAT): >4.2/5
- Average carbon reduction achieved by clients: >8% year-over-year

**Market Position:**
- Market share in Bulgarian carbon footprint software: >30% (Year 3)
- Brand awareness in target industries: >60% (Year 2)
- Number of strategy implementations: >500 cumulative (Year 2)

### 8.3 Impact Metrics

**Environmental Impact:**
- Total CO2e reduction facilitated: >1,000 tons cumulative (Year 2)
- Average client emission reduction: 10-15% within first year
- Percentage of clients meeting sustainability targets: >70%

**Social Impact:**
- Businesses empowered with sustainability tools: 50+ (Year 2)
- Educational content views: >10,000 (Year 2)
- Community strategies shared: >200 (Year 2)

---

## 9. Risk Management & Mitigation

### 9.1 Technical Risks

**Risk: OCR Accuracy Issues**
- Impact: High (affects user experience and data quality)
- Probability: Medium
- Mitigation: 
  - User review and correction workflow
  - Continuous OCR model training
  - Manual entry fallback option
  - Clear user expectations about accuracy

**Risk: Calculation Methodology Disputes**
- Impact: High (credibility and compliance)
- Probability: Low
- Mitigation:
  - Third-party methodology validation
  - Clear documentation of approach
  - Regular updates based on official sources
  - Transparent calculation display

**Risk: Data Security Breach**
- Impact: Critical (GDPR violations, reputation damage)
- Probability: Low
- Mitigation:
  - Regular security audits
  - Penetration testing
  - Encryption standards
  - Incident response plan
  - Cyber insurance

**Risk: System Scalability Issues**
- Impact: Medium (user experience degradation)
- Probability: Medium
- Mitigation:
  - Cloud-based architecture (elastic scaling)
  - Performance monitoring
  - Load testing before major releases
  - Gradual client onboarding

### 9.2 Business Risks

**Risk: Low Market Adoption**
- Impact: High (revenue, viability)
- Probability: Medium
- Mitigation:
  - Pilot program with early adopters
  - Strong value proposition refinement
  - Partnership with sustainability consultants
  - Flexible pricing models
  - Aggressive referral program

**Risk: Regulatory Changes**
- Impact: Medium (product updates required)
- Probability: High (EU regulations evolving)
- Mitigation:
  - Regulatory monitoring service
  - Flexible calculation engine
  - Rapid update capability
  - Communication plan for clients
  - Buffer in development roadmap

**Risk: Competitor Entry**
- Impact: Medium (market share, pricing pressure)
- Probability: Medium
- Mitigation:
  - First-mover advantage (speed to market)
  - Bulgarian-specific features (local focus)
  - Strong customer relationships
  - Continuous innovation
  - Community network effects

**Risk: Economic Downturn**
- Impact: High (reduced client budgets)
- Probability: Medium
- Mitigation:
  - Emphasize ROI and cost savings
  - Flexible payment terms
  - Essential compliance positioning
  - Client success focus (retention)
  - Diversified client base

### 9.3 Operational Risks

**Risk: Key Personnel Departure**
- Impact: High (development delays, knowledge loss)
- Probability: Medium
- Mitigation:
  - Documentation standards
  - Knowledge sharing sessions
  - Competitive compensation
  - Succession planning
  - Cross-training

**Risk: Insufficient Support Capacity**
- Impact: Medium (customer satisfaction)
- Probability: Medium
- Mitigation:
  - Self-service help resources
  - Automated onboarding
  - Support ticket system
  - Scalable support model
  - Community forums (future)

---

## 10. Assumptions & Dependencies

### 10.1 Key Assumptions

**Market Assumptions:**
- Bulgarian businesses will invest 2,000-8,000 BGN/year for sustainability software
- 10-15% of target market (small/mid businesses) will adopt carbon tracking within 2 years
- CSRD requirements will expand to smaller businesses, creating demand
- Clients value AI-powered recommendations and time savings

**Technical Assumptions:**
- Bulgarian utility bills have consistent formats enabling OCR
- Cloud infrastructure will reliably scale to 50+ concurrent users
- AI recommendation engine can achieve >70% user satisfaction
- Emission factor data will remain publicly available from official sources

**Business Assumptions:**
- Annual license model provides sufficient recurring revenue
- 85% client retention rate is achievable
- Word-of-mouth and referrals will drive 30%+ of new clients
- Initial 10-20 clients can be acquired through direct outreach

### 10.2 External Dependencies

**Regulatory Dependencies:**
- Bulgarian government emission factor data publication
- EU CSRD implementation timeline and scope
- Stability of GHG Protocol methodology
- GDPR enforcement consistency

**Technology Dependencies:**
- Cloud provider uptime and performance (AWS/Google Cloud/Azure)
- Third-party OCR service availability and accuracy
- Email service provider reliability
- Payment gateway functionality (for billing)

**Market Dependencies:**
- Availability of sustainability consultants as partners
- Interest from industry associations
- Government incentives for green business practices
- Client companies' willingness to share data for benchmarking

**Resource Dependencies:**
- Availability of experienced developers (React, Python, ML)
- Access to Bulgarian-speaking UX designers
- Sustainability domain expertise for content creation
- Legal counsel for GDPR compliance verification

---

## 11. Open Questions & Future Considerations

### 11.1 Open Questions for Resolution

1. **Pricing Validation:**
   - What is the optimal price point for small vs. mid-sized businesses?
   - Should we offer monthly payment options despite preference for annual?
   - Is there demand for a free tier (limited features) to drive adoption?

2. **Feature Prioritization:**
   - Should multi-location support be in MVP or Phase 2?
   - Is OCR essential for MVP or can it wait for Phase 2?
   - Do clients need API access for custom integrations early on?

3. **Go-to-Market Strategy:**
   - Should we partner with accounting firms that serve our target market?
   - Is a freemium model viable to accelerate market penetration?
   - Should we offer white-label licensing to consultants from day 1?

4. **Technical Decisions:**
   - Which cloud provider offers best Bulgarian data center options?
   - Should we build OCR in-house or use third-party service?
   - Is a microservices architecture necessary for MVP or monolith sufficient?

5. **Regulatory Compliance:**
   - Do we need legal certification of our calculation methodology?
   - Should we pursue ISO 14064 alignment certification?
   - What level of audit trail is legally required vs. nice-to-have?

### 11.2 Future Considerations

**Product Evolution:**
- When to add Scope 3 emissions (supply chain)?
- Should we expand to other sustainability metrics (water, waste)?
- Is there a market for consumer-facing carbon footprint tools?
- Should we build a marketplace for sustainability service providers?

**Market Expansion:**
- Can this be expanded to other EU markets (Romania, Greece)?
- Is there demand for industry-specific versions (e.g., hospitality, logistics)?
- Should we target enterprise clients (250+ employees) with custom features?

**Business Model:**
- Would a per-user pricing model be more scalable long-term?
- Is there potential for transaction-based revenue (e.g., carbon credit marketplace)?
- Should we offer premium consulting services beyond software?

**Technology Innovation:**
- Integration with IoT sensors for real-time emissions monitoring?
- Blockchain for immutable audit trails and carbon credits?
- Mobile app for on-the-go data entry by field staff?
- AI chatbot for natural language queries and support?

---

## 12. Appendices

### Appendix A: Glossary of Terms

**Carbon Footprint:** Total greenhouse gas emissions caused by an organization, expressed as carbon dioxide equivalent (CO2e).

**CO2e (Carbon Dioxide Equivalent):** Standard unit for measuring carbon footprints, combining all greenhouse gases into a single metric based on their global warming potential.

**CSRD (Corporate Sustainability Reporting Directive):** EU regulation requiring companies to report on sustainability matters, including environmental impact.

**Emission Factor:** Coefficient that quantifies emissions per unit of activity (e.g., kg CO2 per liter of gasoline).

**GHG (Greenhouse Gas):** Gases that trap heat in the atmosphere, including CO2, methane, nitrous oxide, and fluorinated gases.

**GHG Protocol:** International standard for measuring and managing greenhouse gas emissions.

**GDPR (General Data Protection Regulation):** EU regulation on data protection and privacy.

**Scope 1 Emissions:** Direct emissions from sources owned or controlled by the organization.

**Scope 2 Emissions:** Indirect emissions from purchased electricity, heating, cooling, and steam.

**Scope 3 Emissions:** All other indirect emissions in the value chain (not covered in ZED MVP).

**tCO2e:** Metric tons of carbon dioxide equivalent.

### Appendix B: Sample Emission Factors (Illustrative)

*Note: These are examples only. Actual emission factors will be sourced from official Bulgarian/EU databases.*

**Fuels:**
- Petrol: 2.31 kg CO2e per liter
- Diesel: 2.68 kg CO2e per liter
- Natural Gas: 0.185 kg CO2e per kWh
- LPG: 1.51 kg CO2e per liter

**Electricity:**
- Bulgarian Grid (2024): 0.48 kg CO2e per kWh (varies by year and region)
- Renewable Energy: 0.02 kg CO2e per kWh

**Refrigerants:**
- R-410A: GWP 2,088
- R-32: GWP 675
- R-134a: GWP 1,430

### Appendix C: Regulatory References

**EU Regulations:**
- Corporate Sustainability Reporting Directive (CSRD) - Directive (EU) 2022/2464
- EU Taxonomy Regulation - Regulation (EU) 2020/852
- European Green Deal
- Carbon Border Adjustment Mechanism (CBAM)

**International Standards:**
- GHG Protocol Corporate Accounting and Reporting Standard
- ISO 14064-1:2018 (Greenhouse gases specification)
- ISO 14067:2018 (Carbon footprint of products)

**Bulgarian Legislation:**
- Bulgarian Accountancy Act (amended 2024)
- Environmental Protection Act
- Climate Change Mitigation Act

### Appendix D: Competitive Landscape

**International Players:**
- Plan A (Germany) - Comprehensive ESG platform
- Watershed (US) - Carbon accounting and reduction
- Persefoni (US) - Climate management software
- Normative (Sweden) - Carbon accounting automation

**Potential Bulgarian Competitors:**
- Limited local carbon footprint software currently
- Oxygen platform (mentioned in project docs) - general ESG
- Sustainability consultants offering manual services
- Excel-based tracking (DIY solutions)

**ZED Differentiation:**
- Bulgarian-specific emission factors and compliance
- Bulgarian language interface
- Beginner-friendly with AI guidance
- Affordable pricing for SMBs
- Local support and consulting

### Appendix E: Technology Evaluation Matrix

**Cloud Providers:**
| Provider | Bulgarian Data Center | GDPR Compliance | Cost | Scalability | Recommendation |
|----------|---------------------|-----------------|------|-------------|----------------|
| AWS | Via EU regions | ✓ | Medium | Excellent | High |
| Google Cloud | Via EU regions | ✓ | Medium | Excellent | High |
| Azure | Via EU regions | ✓ | Medium-High | Excellent | Medium |
| Local BG Provider | ✓ | ✓ | Low-Medium | Good | Medium |

**OCR Solutions:**
| Solution | Accuracy | Language Support | Cost | Integration | Recommendation |
|----------|----------|-----------------|------|-------------|----------------|
| Google Cloud Vision | High | Bulgarian ✓ | Pay-per-use | Easy API | High |
| AWS Textract | High | Bulgarian ✓ | Pay-per-use | Easy API | High |
| Tesseract (Open Source) | Medium | Bulgarian ✓ | Free | Self-hosted | Medium |
| ABBYY Cloud | Very High | Bulgarian ✓ | Higher cost | API | Medium |

---

## 13. Approval & Sign-Off

**Document Prepared By:**
Product Management Team  
Date: October 8, 2025

**Review & Approval Required From:**
- [ ] Product Owner / CEO
- [ ] Technical Lead / CTO
- [ ] Design Lead
- [ ] Marketing Director
- [ ] Legal/Compliance Officer (GDPR)
- [ ] Finance Director (pricing validation)

**Next Steps:**
1. Review and feedback collection (2 weeks)
2. PRD finalization with stakeholder input
3. Design mockups and prototyping
4. Technical architecture detailed design
5. Development sprint planning
6. Pilot client identification and engagement

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Oct 8, 2025 | Product Team | Initial draft for stakeholder review |


## Code Edit
- Never delete functional code while implementing a new feature unless you are told so

---

**End of Product Requirements Document**

*This PRD is a living document and will be updated as the product evolves through development and market feedback.*