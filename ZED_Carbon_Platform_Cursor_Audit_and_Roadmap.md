# ZED Carbon Footprint Platform — Product Audit, Fix Plan & Development Roadmap

**Document purpose:** This is the working specification for Cursor/AI-assisted development of the existing ZED Carbon Footprint Platform.

**Prepared:** 17 August 2026  
**Language of the application:** Bulgarian  
**Implementation language:** TypeScript / Next.js 15 / React 19  
**Primary goal:** Stabilize the current product, remove data and regulatory inconsistencies, strengthen auditability, and then add the highest-value features needed for a competitive European SME carbon-management platform.

---

## 0. Instructions for Cursor

Treat this document as a **prioritized engineering/product backlog**, not as a request to rewrite the application from scratch.

### Working rules

1. **Inspect the current codebase before changing architecture.** Reuse existing tables, APIs and components where practical. Do not create duplicate systems without first proving the existing one cannot be extended safely.
2. **Do not implement all items at once.** Work in priority order: P0 → P1 → P2 → Later.
3. **Fix correctness before adding features.** Carbon totals, calculations, reports and regulatory outputs must be consistent before new AI, supplier or scenario modules are added.
4. **One source of truth for carbon numbers.** Dashboard, comparison, targets, reports, compliance and benchmark views must never calculate the same footprint independently using different logic.
5. **Preserve Bulgarian UI.** New customer-facing labels, validation messages, tooltips and help content must remain Bulgarian unless explicitly requested otherwise.
6. **Preserve RLS / tenant isolation.** Every new client-owned table must be scoped to `company_id` and protected by Supabase RLS.
7. **Do not hardcode volatile regulatory rules.** Regulatory applicability, standard versions, thresholds and methodology versions must be data-driven/versioned where possible.
8. **Do not make claims in generated reports that the software cannot prove.** If evidence, review, approval or audit controls are not actually implemented, generated PDFs must not state that they exist.
9. **Use migrations safely.** Prefer additive migrations. Avoid destructive table replacements unless a migration/backfill plan is explicitly created.
10. **Add automated tests for every P0 calculation fix.** Any bug involving totals, YoY, targets, coverage or report consistency must get regression tests.
11. **Before finishing a task, test all affected surfaces.** At minimum: API response, UI component, report generation if applicable, and RLS behavior.
12. **Update this file or a linked implementation checklist as work is completed.**

---

# 1. Product Positioning

ZED is no longer merely a carbon calculator. The existing product already supports an end-to-end sustainability workflow for SMEs:

**Measure → Validate → Analyse → Set Targets → Plan Reductions → Report**

The recommended product positioning is:

> **ZED — Carbon & Sustainability Management Platform for European SMEs**

The strongest future differentiation should be:

- easy Bulgarian/EU SME onboarding;
- Scope 1, 2 and 3 accounting;
- invoice/CSV based data collection;
- strong evidence and audit trail;
- VSME and climate reporting;
- supplier data improvement;
- practical reduction planning and ROI;
- consultant/partner management across multiple SME clients.

Do **not** try to become a full generic enterprise ESG suite immediately. The best product wedge is European SMEs, especially Bulgarian and regional companies that need defensible carbon numbers and standardized sustainability reporting without enterprise complexity.

---

# 2. Current Technical Baseline

## Stack

- Next.js 15 — App Router
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase Auth
- PostgreSQL / Supabase
- Row Level Security (RLS)
- Recharts
- PDF generation via `pdf-lib` and/or `@react-pdf/renderer`

## Current roles

### ZED Admin
- cross-company access;
- companies;
- users;
- company emissions;
- password/admin operations.

### Client
- access only to own `company_id`;
- full sustainability workflow.

### Current limitation
The role model is too coarse for real review/assurance workflows. This is addressed later in the roadmap.

---

# 3. Current Functional Surface

## 3.1 Authentication & onboarding

Already implemented:

- login;
- password reset;
- middleware/session protection;
- 7-step onboarding wizard;
- company setup;
- Scope 1 & 2 setup;
- Scope 3 setup;
- targets;
- strategies;
- onboarding completion;
- re-openable setup guide.

The onboarding is a product strength and should be preserved.

---

## 3.2 Dashboard — `/dashboard`

Current capabilities include:

- reporting year selector;
- total footprint;
- Scope 1 card;
- Scope 2 card;
- Scope 3 card;
- intensity per employee;
- YoY indicators;
- target progress;
- strategy progress;
- data quality;
- quick links/actions;
- charts and breakdowns.

The dashboard UX is already strong. Future work should prioritize **trust/provenance** rather than adding more charts.

---

## 3.3 Scope 1 & 2 data

Routes:

- `/data-entry`
- `/data-entry/list`
- `/data-entry/import`

Current activity types include:

- diesel;
- petrol;
- LPG;
- natural gas;
- heating oil;
- coal;
- refrigerants;
- electricity;
- district heating/cooling.

Current model:

> Activity data × emission factor → tCO₂e

Existing UI is intentionally simple and should remain simple. Advanced audit/provenance fields should be placed behind an expandable section instead of cluttering the main form.

---

## 3.4 Scope 3 workflow

Routes:

- `/scope3/dashboard`
- `/invoice-import`
- `/scope3/import`
- `/scope3/import/history`
- `/scope3/transactions`
- `/scope3/classify`
- `/scope3/rules`

Current flow:

> Import → Transactions → Classify → Calculate → Dashboard/Reports

Current strengths:

- PDF invoice ingestion;
- CSV import;
- financial transaction model;
- supplier/description data in transaction UI;
- classification rules;
- spend-based calculation;
- Scope 3 category summaries.

Current weakness:

The system needs stronger idempotency, methodological quality levels, applicability screening, supplier primary data and evidence provenance.

---

## 3.5 Data quality & emission factors

Routes:

- `/data-quality`
- `/emission-factors`
- `/api/audit/export`

Current data quality functionality includes:

- completeness;
- monthly coverage grid;
- scope-level scoring;
- gaps/tips.

Current emission-factor functionality includes:

- browsing/searching factors;
- editing factors;
- audit-related data.

This area should become one of the platform's main competitive strengths.

---

## 3.6 Reports

Current report types:

- Full report;
- CSRD / ESRS E1 report;
- Compliance report;
- Certificate.

The ESRS E1 PDF is visually strong and includes:

- Scope 1/2/3 summary;
- previous-year comparison;
- detailed Scope 1 activities;
- location-based Scope 2;
- Scope 3 methodology;
- monthly completeness;
- targets;
- strategies;
- methodology;
- uncertainty;
- verification statement.

The Compliance PDF includes regulatory screening and actions.

Reports are a strong product asset but currently contain several critical correctness and claims issues described below.

---

## 3.7 Targets

Route:

- `/targets`

Current features:

- absolute / percentage / intensity targets;
- scope-specific targets;
- templates;
- forecast;
- live synchronization;
- SBTi-related logic;
- progress and off-track alerts.

The UI is strong, but calculation consistency currently needs urgent work.

---

## 3.8 Strategies

Routes:

- `/strategies`
- `/strategies/[id]`

Current features:

- strategy catalogue/templates;
- statuses;
- initiatives checklist;
- progress;
- links to targets;
- expected tCO₂e reduction;
- categories such as energy efficiency, renewables, fleet, supply chain, waste, water and behaviour.

This is already more advanced than a basic calculator. The next step is to make strategy impact company-specific and financially meaningful.

---

## 3.9 Analysis

Routes:

- `/comparison`
- `/benchmark`

Current features:

- year-vs-year total comparison;
- Scope 1/2/3 comparison;
- stacked charts;
- monthly trend;
- benchmark against industry;
- emissions intensity per employee;
- sector score/ranking style UI.

Main concern: benchmark provenance and data consistency.

---

## 3.10 Locations

Route:

- `/settings/locations`

Current data includes:

- offices/sites;
- location type;
- employees;
- area;
- main location;
- associated emission record count.

Locations should become a first-class dimension across all calculations, analysis and reports.

---

## 3.11 Help / GDPR

Routes include:

- `/help`
- `/settings/privacy`

Current capabilities:

- help centre / FAQ;
- GDPR rights information;
- JSON export;
- account deletion workflow.

This is a product strength for SME usability.

---

# 4. P0 — Critical Correctness Problems

These items must be fixed before major feature expansion or serious external sales demos.

---

## BUG-P0-001 — Carbon totals are inconsistent across modules

### Observed problem
The same reporting periods produce different totals depending on the module.

Examples observed in the current demo data:

- Comparison page shows 2024 total around **21.72 tCO₂e** and 2025 total **20.96 tCO₂e**, interpreted as approximately **-3.5%**.
- ESRS E1 report shows 2024 total **20.41 tCO₂e** and 2025 total **20.96 tCO₂e**, interpreted as **+2.7%**.
- Target cards reference a 2024 baseline of **56.74 tCO₂e**, which is again inconsistent with both values above.
- A dashboard screenshot for 2026 shows total **9.20 tCO₂e**, Scope 1 **6.45**, Scope 2 **2.74** and Scope 3 **0.66**. Scope 1 + Scope 2 ≈ 9.19, suggesting the “total” may exclude Scope 3 even though the product description defines total footprint as Scope 1+2+3.

### Why this is critical
A carbon-management platform cannot have different versions of the same footprint. This damages trust, makes reports non-defensible and can create regulatory/reporting errors.

### Required fix
Create one authoritative carbon-calculation/aggregation layer and make all modules consume it.

Recommended conceptual service:

`CarbonLedgerService` / `FootprintService`

It should expose canonical results such as:

- `getCompanyFootprint(companyId, year, options)`
- `getScopeTotals(companyId, year, options)`
- `getMonthlyFootprint(companyId, year, options)`
- `getLocationFootprint(companyId, locationId, year, options)`
- `getCategoryBreakdown(companyId, year, options)`
- `getComparison(companyId, yearA, yearB, options)`

Dashboard, comparison, targets, reports, compliance and benchmark must all read from these canonical outputs.

### Acceptance criteria

- [ ] 2024 total is identical everywhere within display rounding tolerance.
- [ ] 2025 total is identical everywhere within display rounding tolerance.
- [ ] Scope totals reconcile exactly to the displayed total according to the selected reporting boundary.
- [ ] YoY percentage is derived from the same totals used in the UI/report.
- [ ] Dashboard “total” explicitly states whether it includes Scope 3; preferred default = Scope 1+2+3.
- [ ] Regression tests cover all affected routes/components.
- [ ] Report API and comparison API return the same canonical yearly totals.

---

## BUG-P0-002 — Scope 3 coverage can exceed 100%

### Observed problem
The transactions screen shows approximately:

- 100 total transactions;
- 100 classified;
- 120 calculations;
- “Coverage 120%”.

### Likely cause
The application appears to count calculation rows rather than uniquely covered transactions, or recalculation creates duplicate calculation records.

### Required fix
Separate the following concepts:

1. number of transactions;
2. number classified;
3. number of unique transactions successfully calculated;
4. number of calculation lines/records.

Recommended coverage formula:

`uniqueCalculatedTransactionCount / classifiedTransactionCount * 100`

Coverage must be capped naturally by correct unique counting, not by a visual `Math.min(100, ...)` workaround.

Also inspect recalculation behavior for duplicate calculation records.

### Acceptance criteria

- [ ] Coverage cannot exceed 100%.
- [ ] Recalculate is idempotent for the same transaction/method/factor version.
- [ ] UI can still show “120 calculation lines” separately if one transaction legitimately produces multiple lines.
- [ ] Unique constraints or deterministic upsert logic prevent duplicate active calculations.
- [ ] Historical recalculations are versioned rather than silently duplicated.

---

## BUG-P0-003 — Target forecast / target value bug

### Observed problem
A target with baseline **56.74 tCO₂e** and target **-15%** displays a forecast/target value of **0.00 tCO₂e**.

A -15% target should not produce zero. A simple target endpoint would be approximately:

`56.74 × 0.85 = 48.23 tCO₂e`

### Required fix
Audit the distinction between:

- baseline value;
- current value;
- target reduction percentage;
- target endpoint value;
- forecast value based on trend;
- required annual reduction.

Do not mix target endpoint with forecast.

### Acceptance criteria

- [ ] `target_value` is mathematically correct for percentage targets.
- [ ] `forecast_value` is derived from an explicit forecast model, not from the target itself.
- [ ] `-100%` is the only percentage target that naturally results in zero (unless an absolute target explicitly sets zero).
- [ ] absolute, percentage and intensity target types have independent tests.
- [ ] scope-specific targets use the correct scope baseline.
- [ ] target baseline uses the same canonical footprint service as reports/comparison.

---

## BUG-P0-004 — Report output mismatch / “Full Report” may duplicate ESRS report

### Observed problem
The uploaded `ZED-Full-Report-17-2025.pdf` and `CSRD-ESRS-E1-17-2025.pdf` appear to contain the same 9-page ESRS E1 content.

### Required investigation
Determine whether:

- the wrong generator is called for “Full Report”; or
- the uploaded demo file is stale/incorrect; or
- both report types intentionally share the same template.

### Acceptance criteria

- [ ] Each report card/type routes to the intended generator.
- [ ] Generated filename and report content match the selected report type.
- [ ] Automated smoke test verifies report header/title for each report type.

---

## BUG-P0-005 — Scope 3 report loses supplier/description data

### Observed problem
The transaction UI clearly contains supplier and description fields, e.g. suppliers such as Office 1 Superstore, Microsoft Ireland, DHL Express, etc.

However, the ESRS E1 report “top 10 calculations” table displays supplier and description as `—`.

### Required fix
Trace the report data mapping from transaction → classification → calculated emission → report DTO.

### Acceptance criteria

- [ ] Supplier is shown when present in source data.
- [ ] Description is shown when present in source data.
- [ ] If deliberately redacted, use an explicit label such as “Redacted”, not a misleading null dash.
- [ ] Report query avoids N+1 issues and remains tenant-scoped.

---

## BUG-P0-006 — Emission-factor traceability is claimed but not visible

### Observed problem
The report states that each CO₂e record is traceable to a specific emission factor, but Scope 1 and Scope 2 detail tables show `—` in the “Factor” column.

### Required fix
Either:

A. implement and display factor provenance; or  
B. remove/soften the traceability claim until it is genuinely available.

Preferred solution = implement provenance.

### Minimum factor data to retain per calculation

- factor ID;
- factor version ID;
- factor name;
- factor value;
- factor unit;
- source organization;
- source dataset/year;
- geography;
- valid from/to;
- GWP basis if applicable;
- retrieval/import date;
- methodology version.

### Acceptance criteria

- [ ] User can open a calculation and see exact factor value/source/version.
- [ ] Generated reports can display or reference the factor used.
- [ ] Changing the factor master record does not silently change finalized historical reports/calculations.

---

# 5. P0 — Compliance & Regulatory Problems

The Compliance module is currently the highest legal/reputational risk because it produces definitive-looking statements from simplified rules.

The objective is **not** to turn Cursor into a legal adviser. The objective is to build a rule engine that is versioned, transparent, conservative and reviewable.

---

## REG-P0-001 — “100% compliance” logic is misleading

### Observed problem
The Compliance PDF shows an overall compliance index of **100%**, while the same report contains approximately:

- 4 fulfilled items;
- 3 partially fulfilled items;
- 0 gaps;
- 1 not-applicable item depending on counting logic.

The report also contains an internal counting inconsistency: the table presents seven listed regulatory/framework rows, while text refers to “8 checked regulations”.

### Required redesign
Separate:

1. **Applicability** — does the rule apply to this company?
2. **Readiness/completion** — if applicable, is the requirement fulfilled?
3. **Evidence confidence** — is the conclusion supported by uploaded/structured evidence?

Recommended statuses:

- `fulfilled`
- `partial`
- `gap`
- `not_applicable`
- `requires_review`
- `unknown`

Do not treat `partial` as equivalent to `fulfilled`.

### Preferred UI
Instead of a single “100% compliant” score:

- 4 requirements fulfilled;
- 3 actions required;
- 1 not applicable;
- regulatory readiness score only if methodology is explicitly documented.

### Acceptance criteria

- [ ] Count in summary always reconciles to displayed rows.
- [ ] `partial` never counts as full compliance.
- [ ] Not-applicable items are excluded from the compliance denominator.
- [ ] Rules can return `requires_review` when input data is insufficient.
- [ ] Report wording avoids legal certainty when the application only performs automated screening.

---

## REG-P0-002 — CSRD applicability logic must be updated and versioned

### Current issue
The existing compliance report contains older CSRD threshold wording referring to companies above roughly 250 employees / EUR 40m turnover and 2025/2026 reporting.

### Current external reference point as of 17 Aug 2026
EU-level simplification has narrowed CSRD scope; the Council's February 2026 sign-off describes thresholds of **more than 1,000 employees and above EUR 450 million net annual turnover**. The European Commission also adopted revised ESRS on **3 July 2026**.

### Required product behavior
Do not encode a static sentence in the PDF.

Build a versioned applicability rule with fields such as:

- jurisdiction;
- legal/framework key;
- rule version;
- effective from;
- effective to;
- employee threshold;
- turnover threshold;
- balance sheet threshold if applicable;
- listed/non-listed flag;
- third-country logic if later supported;
- data source/reference;
- last legal review date.

For a small demo company with 22 employees, the UX should say something like:

- Mandatory CSRD applicability: **Not in mandatory scope based on current company profile**;
- Suggested voluntary reporting route: **VSME**;
- ESRS E1 climate report: **available as voluntary/aligned climate disclosure**.

### Acceptance criteria

- [ ] CSRD output is based on company profile and current rule version.
- [ ] Rule version/date appears in compliance details.
- [ ] UI distinguishes mandatory vs voluntary reporting.
- [ ] No report calls a small SME “CSRD compliant” solely because it has Scope 1/2/3 data.

---

## REG-P0-003 — Revised ESRS version awareness

### Current issue
Generated reports reference Delegated Regulation (EU) 2023/2772 as if the disclosure structure were static.

### External reference point
The European Commission adopted revised sustainability reporting standards on 3 July 2026.

### Required fix
Introduce methodology/report-standard version metadata.

Suggested fields:

- `standard_code` — e.g. `ESRS_E1`;
- `standard_version`;
- `effective_from`;
- `reporting_year_from`;
- `source_reference`;
- `is_active`;
- `report_template_version`.

A generated report must retain which standard/template version it used.

### Acceptance criteria

- [ ] Historical reports remain reproducible.
- [ ] New reports use the correct active version for the reporting period/configuration.
- [ ] PDF footer or methodology page states standard/template version.

---

## REG-P0-004 — EU ETS applicability is oversimplified

### Current issue
The Compliance PDF essentially treats EU ETS as a generic footprint threshold check such as “>20 MW or >25 ktCO₂e/year”, then concludes non-applicability because corporate emissions are low.

### Problem
EU ETS applicability is based on covered Annex I activities and installation/capacity criteria. A simple corporate tCO₂e total is not a sufficient screening rule.

### Required redesign
Create an EU ETS screening questionnaire rather than deriving applicability from total corporate footprint.

Potential inputs:

- does the company operate an installation?;
- installation activity type;
- combustion units?;
- total rated thermal input (MW);
- production capacity;
- sector/activity code;
- aviation/shipping applicability if later relevant;
- exclusions/aggregation rules;
- evidence/source document.

Possible result states:

- likely applicable;
- likely not applicable;
- further assessment required.

### Acceptance criteria

- [ ] EU ETS result is not based solely on total company tCO₂e.
- [ ] Missing technical data returns `requires_review` rather than a confident answer.
- [ ] Report describes the screening basis.

---

## REG-P0-005 — Bulgarian air-quality regulation mapping needs review

### Current issue
The Compliance report describes Bulgarian Ordinance No. 7/1999 as if it were specifically the rule for monitoring stationary combustion installation emissions.

### External reference point
Bulgarian Ministry of Environment and Water materials identify:

- **Ordinance No. 7 of 3 May 1999** as concerning assessment and management of ambient air quality;
- **Ordinance No. 6 of 26 March 1999** as concerning measurement of harmful substance emissions released into ambient air from facilities with stationary sources.

### Required fix
Do not simply rename one line. Review the entire Bulgarian environmental compliance catalogue with a qualified specialist and make the rules versioned.

### Acceptance criteria

- [ ] Bulgarian regulation names and applicability descriptions are reviewed.
- [ ] Each regulatory rule has a source, effective date and last review date.
- [ ] Product labels clearly distinguish “automated screening” from legal advice.

---

## REG-P0-006 — “Framework” vs legally binding regulation must be separated

Current compliance rows mix items with different legal status, e.g.:

- CSRD / ESRS;
- EU ETS;
- Bulgarian law;
- GHG Protocol;
- SBTi;
- ISO 14064-1.

GHG Protocol, SBTi and ISO are not the same type of legal requirement as national/EU law.

### Required redesign
Add `requirement_type`, for example:

- `law`
- `eu_regulation`
- `eu_directive`
- `reporting_standard`
- `voluntary_standard`
- `target_framework`
- `certification_standard`
- `guidance`

UI should use wording such as **Regulatory & Standards Readiness**, not imply all items are statutory regulations.

---

# 6. P0 — PDF / Report Quality Problems

---

## PDF-P0-001 — Strategy layout overlaps on ESRS E1 page 7

### Observed problem
Strategy names/category/expected reduction text overlap in the generated PDF.

### Required fix
Audit page break/layout behavior in `@react-pdf/renderer` or current PDF library.

Consider:

- fixed row height only when content is known to fit;
- dynamic wrapping;
- `wrap={false}` at correct grouping level;
- minimum heights;
- separate lines for strategy name, category and expected impact;
- automated visual smoke test using known long Bulgarian strings.

### Acceptance criteria

- [ ] No overlapping text at A4 output.
- [ ] Long strategy names wrap correctly.
- [ ] Page breaks do not separate labels from values.

---

## PDF-P0-002 — Report claims controls that may not yet exist in product

### Observed examples
The ESRS E1 report states that:

- data is reviewed by management using a four-eyes rule;
- primary documents are archived;
- every CO₂e record has a full audit trail to a specific factor.

The currently described application roles are only Admin and Client, and a first-class evidence/review workflow is not visible in the provided screens.

### Required rule
**Generated text must be evidence-driven.**

Only state:

> “Reviewed under four-eyes control”

if a real review/approval event exists.

Only state:

> “Source document archived”

if evidence is attached/stored.

Only state:

> “Traceable to specific factor”

if the calculation snapshot has factor provenance.

### Acceptance criteria

- [ ] Compliance/report narrative is generated from actual control state.
- [ ] Missing evidence/control is shown as a gap/recommendation.
- [ ] No false assurance-style statement is generated automatically.

---

## PDF-P0-003 — ESRS wording should avoid overclaiming

Until the platform implements a complete and validated mapping for the selected ESRS version, prefer wording such as:

- “ESRS E1-aligned climate disclosure”;
- “structured with reference to ESRS E1”;
- “not independently assured”.

Avoid an unconditional statement of full regulatory compliance merely because the report contains emissions, targets and methodology.

This is especially important because ESRS versions changed in 2026.

---

# 7. Core Architecture Upgrade — Carbon Ledger / Single Source of Truth

This is the most important technical improvement.

## Objective
Every displayed or reported carbon result should be reproducible from the same immutable/versioned calculation records.

### Existing relevant tables

- `emission_data`
- `emission_factors`
- `calculated_emissions`
- `transactions`
- `transaction_classifications`
- `scope3_activity_entries`
- `locations`
- targets/strategies tables.

Do not automatically replace these. First inspect their columns and relations.

## Recommended domain model

### A. Activity record
Represents the underlying business/activity datum.

Examples:

- 1,063 kWh electricity;
- 332 L diesel;
- EUR 375 car rental transaction;
- 120 passenger-km flight;
- 10 tonnes material.

Suggested metadata:

- `id`
- `company_id`
- `location_id`
- `scope`
- `category`
- `activity_type`
- `quantity`
- `unit`
- `period_start`
- `period_end`
- `source_type`
- `source_record_id`
- `data_quality_level`
- `created_by`
- timestamps.

### B. Factor version
Do not treat emission factors as permanently mutable master rows.

Suggested structure:

- `factor_id`
- `version_id`
- `name`
- `value`
- `unit_numerator`
- `unit_denominator`
- `source_org`
- `source_dataset`
- `source_year`
- `geography`
- `valid_from`
- `valid_to`
- `gwp_basis`
- `methodology_code`
- `published_at`
- `imported_at`
- `supersedes_version_id`
- `is_active`.

### C. Calculation snapshot / ledger entry

Suggested fields:

- `id`
- `company_id`
- `activity_id`
- `scope`
- `category`
- `location_id`
- `factor_version_id`
- **factor value snapshot**
- **factor unit snapshot**
- `methodology_version`
- `activity_value_snapshot`
- `activity_unit_snapshot`
- `co2e_kg`
- `calculation_expression`
- `quality_level`
- `uncertainty_low_pct`
- `uncertainty_high_pct`
- `calculated_at`
- `calculation_version`
- `is_current`
- `supersedes_calculation_id`.

Do not rely only on a FK to a mutable factor. Store the factor value used in the calculation snapshot so historical outputs remain reproducible.

### D. Evidence

Suggested table:

`evidence_documents`

Fields:

- `id`
- `company_id`
- `activity_id` nullable;
- `transaction_id` nullable;
- `calculation_id` nullable;
- `file_path` / storage key;
- `document_type`;
- `original_filename`;
- `period`;
- `supplier`;
- `uploaded_by`;
- `uploaded_at`;
- `hash` if useful;
- `notes`.

### E. Review events

Suggested table:

`review_events`

- `id`
- `company_id`
- `entity_type`
- `entity_id`
- `action` (`submitted`, `approved`, `rejected`, `reopened`)
- `reviewer_id`
- `comment`
- timestamp.

### F. Reporting-year lock

Suggested table:

`reporting_period_locks`

- `company_id`
- `year`
- `status` (`open`, `review`, `closed`, `restated`)
- `closed_by`
- `closed_at`
- `methodology_version`
- `factor_set_version`
- `restatement_reason`.

---

# 8. P1 — Evidence & Auditability Layer

This should be implemented before major AI functionality.

## 8.1 Expandable “Advanced details” on data entry

Keep the current simple data-entry form.

Add expandable section:

**Разширени настройки**

Suggested fields:

- Location;
- Source type;
- Evidence/document;
- emission factor;
- methodology;
- data quality;
- notes.

Example customer UX:

- Activity: 1,063 kWh
- Location: Office Vidin
- Source: electricity invoice
- Evidence: `invoice_2026_03.pdf`
- Factor: BG Electricity — 2026.1
- Method: Activity-based / location-based

## 8.2 Calculation details drawer

Every emission value should provide:

**Show calculation**

Example:

`1,063 kWh × 0.505 kgCO₂e/kWh = 536.8 kgCO₂e = 0.537 tCO₂e`

Also show:

- factor source;
- factor version;
- factor year;
- methodology;
- evidence;
- user/time;
- review state.

## 8.3 Audit history

For edits:

- old value;
- new value;
- user;
- timestamp;
- reason;
- impact on footprint.

### Acceptance criteria

- [ ] Every final footprint value can be traced to activity + factor + version.
- [ ] Optional evidence can be attached at record level.
- [ ] Reports can indicate evidence coverage percentage.
- [ ] Edit history is visible to authorised users.

---

# 9. P1 — Data Quality 2.0

The current single score is useful but too opaque.

## Recommended dimensions

- completeness;
- monthly coverage;
- primary-data coverage;
- evidence coverage;
- factor specificity;
- calculation method quality;
- classification completeness;
- review/approval status;
- Scope 3 applicability coverage.

### Example output

**Overall Data Quality: 83/100**

- Completeness: 94%
- Primary data: 61%
- Evidence coverage: 72%
- Factor specificity: 88%
- Scope 3 methodology quality: 58%
- Review status: 100%

### Also expose footprint composition

- % primary activity-based;
- % supplier-specific;
- % average-data;
- % spend-based;
- % estimated;
- % without documentary evidence.

### Critical requirement
Score methodology must be explicit and versioned. Never invent a precision-looking score without documenting how it is calculated.

---

# 10. P1 — Scope 2 Market-Based Accounting

The existing report already supports **location-based** Scope 2 and mentions future contractual instruments.

Complete this feature.

## Required concepts

For electricity:

- location-based result;
- market-based result;
- supplier-specific factor;
- residual mix where appropriate;
- Guarantee of Origin / EAC;
- PPA / green tariff;
- coverage period;
- covered MWh/kWh;
- instrument ownership/retirement evidence;
- Scope 2 quality criteria state.

### UI example

**Scope 2 — 2026**

- Location-based: 5.93 tCO₂e
- Market-based: 1.82 tCO₂e
- Renewable contractual coverage: 72%
- 2 active contractual instruments

### Important calculation rule
A green electricity contract must **not** automatically set location-based Scope 2 to zero. Location-based and market-based results are separate.

### External methodology reference
Current GHG Protocol Scope 2 guidance requires dual reporting in markets where product/supplier-specific contractual data is available and defines quality criteria for contractual instruments.

---

# 11. P1 — Scope 3 Applicability Screening

GHG Protocol Scope 3 uses **15 categories**. The SME UI should not force every user to manually manage all 15.

## Add onboarding/screening wizard

Questions should determine which categories are potentially applicable.

Examples:

- purchased goods/services?;
- capital goods?;
- fuel/energy related activities?;
- upstream transport?;
- waste?;
- business travel?;
- employee commuting?;
- upstream leased assets?;
- downstream transport?;
- processing/use/end-of-life of sold products?;
- downstream leased assets?;
- franchises?;
- investments?

## Result

- Applicable: 6/15
- Measured: 3/6
- Not applicable: 9/15
- Requires review: 0/15

This is superior to a vague “3 of 5 planned categories”.

---

# 12. P1 — VSME Module

This is one of the highest-value additions for the target SME market.

## Why

The European Commission recommended the Voluntary Sustainability Reporting Standard for non-listed SMEs (VSME), and EFRAG provides a digital template and XBRL taxonomy/converter.

ZED already contains much of the infrastructure required:

- company profile;
- sites/locations;
- employees;
- energy;
- Scope 1/2/3;
- targets;
- strategies;
- reporting engine.

## New route suggestion

- `/vsme`
- `/vsme/readiness`
- `/reports/vsme`

## VSME readiness UX

Example:

**VSME readiness — 82%**

- B3 Energy & GHG emissions — complete
- C3 GHG reduction targets — complete
- workforce disclosures — incomplete
- health & safety disclosures — incomplete
- anti-corruption/bribery disclosure — missing

Do not assume exact disclosure IDs in code without implementing against the current official VSME version. Create a versioned mapping layer.

## Outputs

Phase 1:

- human-readable PDF;
- structured JSON export;
- Excel-compatible export if practical.

Phase 2:

- XBRL/iXBRL mapping compatible with the official VSME taxonomy or an export that can be transformed to it.

## Important architecture

Create a disclosure registry rather than hardcoding each field directly into one giant React form.

Potential model:

- `reporting_standards`
- `disclosures`
- `disclosure_versions`
- `company_disclosure_values`
- `disclosure_evidence`
- `disclosure_status`

---

# 13. P1 — Review, Approval & Reporting-Year Close

The application currently has Admin/Client roles but reports imply management review controls.

Make review a real system feature.

## Workflow

`Draft → Submitted → Reviewed/Approved → Locked`

Potential actions:

- submit month/record;
- approve/reject;
- add review comment;
- reopen;
- close reporting year;
- restate year.

## Year close

When a year is closed:

- current calculation versions are frozen;
- factor versions are snapshotted;
- report versions are reproducible;
- normal edits are blocked;
- changes require a restatement workflow.

## Restatement

Store:

- reason;
- previous total;
- revised total;
- affected records;
- user;
- date;
- materiality note.

---

# 14. P1/P2 — Internal Company Roles

Recommended roles:

| Role | Core permissions |
|---|---|
| Company Admin | full company access |
| Sustainability Manager | data, calculations, targets, reports |
| Data Contributor | create/edit assigned data |
| Reviewer | review/approve records |
| Finance | transaction/Scope 3 access |
| Auditor | read-only + evidence/audit trail |
| External Consultant | configurable client access |

Do not necessarily create separate Supabase auth concepts for every role if a permission table is cleaner.

Recommended approach:

- role + permissions;
- company membership table;
- optional location restriction;
- optional module restriction.

---

# 15. P2 — Supplier Management & Supplier Portal

This is the next major Scope 3 maturity step.

## New workflow

> Estimate → Prioritise supplier → Request primary data → Review supplier submission → Replace/upgrade estimate

## Suggested routes

- `/suppliers`
- `/suppliers/[id]`
- `/supplier-requests`
- external magic-link portal `/external/supplier-request/[token]`

## Supplier list fields

- supplier;
- annual spend;
- estimated emissions;
- Scope 3 categories;
- current method;
- quality level;
- primary data status;
- last request;
- response status.

## Supplier request form

Possible requested data:

- reporting year;
- company Scope 1;
- Scope 2;
- company revenue/production denominator if needed;
- product/service footprint;
- PCF document;
- methodology;
- assurance status;
- renewable energy;
- SBTi target status;
- supporting document upload.

Use magic-link access where possible so supplier users do not need full ZED accounts.

## Data hierarchy

Support progression such as:

`Spend-based (C) → average/physical data (B) → supplier-specific/verified data (A)`

The exact A/B/C definitions must be documented and versioned by ZED.

---

# 16. P2 — Strategy Engine Upgrade

Current catalogue ranges such as “LED can save ~3–15 tCO₂e/year” are useful as generic templates but should not become a company-specific claim automatically.

## New two-stage model

### Stage 1 — Template potential

Display generic range clearly labeled:

**Typical potential:** 3–15 tCO₂e/year

### Stage 2 — Company-specific estimate

Ask for required inputs.

For LED example:

- number of fixtures;
- current wattage;
- proposed wattage;
- operating hours;
- electricity factor;
- implementation percentage.

Then calculate company-specific reduction.

If inputs are missing, say:

> “Insufficient data for company-specific estimate.”

Do not infer a precise 8 tCO₂e saving from a catalogue template alone.

---

# 17. P2 — Scenario & ROI Engine

This feature moves ZED from reporting historical emissions to supporting management decisions.

## Scenario examples

- 50% fleet electrification;
- 100% green electricity contractual coverage;
- solar PV installation;
- LED retrofit;
- HVAC optimisation;
- lower business travel;
- supplier switch;
- recycled-material substitution.

## Scenario output

### Carbon

- current baseline;
- projected Scope 1 impact;
- projected Scope 2 impact;
- projected Scope 3 impact;
- net annual reduction;
- target gap after scenario.

### Financial

- CAPEX;
- annual OPEX change;
- annual energy/fuel saving;
- simple payback;
- optional NPV/discounted cash flow later;
- EUR per tCO₂e reduced.

## Important design
Scenarios must **not overwrite actual emissions data**. They are separate projections.

Suggested tables:

- `scenarios`
- `scenario_assumptions`
- `scenario_results`
- `scenario_versions`

---

# 18. P2 — Consultant / Partner Workspace

This is strategically important for ZED's business model.

The current Admin panel is not the same as a consultant workspace.

## Goal
Allow one ZED consultant / partner to manage dozens of SME clients efficiently.

## Suggested route

- `/partner`
- `/partner/clients`
- `/partner/tasks`

## Example portfolio table

| Client | Year | Data completeness | Scope 3 | Targets | Report | Attention |
|---|---:|---:|---:|---|---|---|
| Stealth 17 | 2026 | 83% | 100% | Off-track | Ready | 2 actions |
| ABC | 2026 | 62% | 44% | Missing | Not ready | 8 actions |
| XYZ | 2026 | 97% | 91% | On-track | Ready | None |

## Useful actions

- request missing data;
- leave comment;
- review record;
- approve year;
- generate report;
- open client workspace;
- see overdue tasks;
- see unclassified transactions.

This enables ZED to sell through:

- ESG consultants;
- ISO consultants;
- accounting firms;
- advisory firms;
- white-label partners later.

---

# 19. P2 — Multi-location as a Core Reporting Dimension

Locations already exist. Now propagate them everywhere.

## Required behavior

Every relevant activity/transaction/calculation should support `location_id` where meaningful.

Enable:

- total by location;
- Scope breakdown by location;
- intensity per m²;
- intensity per employee;
- intensity per production unit;
- monthly comparison between sites;
- location-specific targets;
- location-specific evidence/owners.

## Avoid
Do not force a meaningless location onto purely corporate Scope 3 transactions. Support `location_id = null` or corporate allocation rules.

---

# 20. P2/Later — Group Structure & Consolidation

For larger customers:

`Group → Legal Entity → Location → Activity`

Support organisational boundary methods such as:

- operational control;
- financial control;
- equity share.

This requires careful methodology and should only follow after the ledger is stable.

---

# 21. Benchmark — Methodology & Trust Improvements

The current benchmark UI is attractive but can overstate precision.

## Current risk
Labels such as:

- “A”;
- “92% more efficient than peers”;
- “83% below median”

look authoritative unless benchmark provenance is transparent.

## Required metadata
Every benchmark should expose:

- source;
- dataset version/year;
- geography;
- sector mapping;
- sample size;
- scope boundary included;
- intensity denominator;
- statistical method;
- ZED methodology version.

## Grade handling
If “A” is a ZED-created rating, label it:

**ZED Benchmark Rating: A**

and document the grading formula.

Prefer percentile language where possible:

> “Top 25% of the selected benchmark sample.”

## Guardrails
Warn that inter-company carbon comparisons can be distorted by different organisational boundaries, Scope 3 coverage and methodologies.

---

# 22. Targets & SBTi — Version Awareness

Current application has SBTi checks. These should not be hardcoded as one timeless annual-reduction rule.

## External reference point as of Aug 2026
SBTi states that companies setting targets in 2026 use the current Corporate Net-Zero Standard v1.3.1, while validation under Version 2.0 opens in early 2027.

## Required architecture

Store:

- framework;
- framework version;
- target type;
- validation status;
- validation date;
- SBTi target ID/reference if supplied;
- methodology assumptions.

## UX distinction

- **ZED alignment check** ≠ **SBTi validated**.

Never show the SBTi badge in a way that implies official SBTi validation unless the customer has provided validation status/evidence.

---

# 23. Report Naming & Product Claims

## Recommended UI naming

Current “CSRD report” should preferably become:

**ESRS E1 — Climate Report**

Subtitle:

> Climate disclosure aligned/structured with reference to the selected ESRS E1 version.

Why:

A full CSRD sustainability statement is broader than climate/GHG reporting. ZED currently has a strong climate module, not a complete all-topic ESRS implementation.

## Future if full ESRS is built
A full CSRD/ESRS module would require, among other things:

- double materiality assessment;
- governance disclosures;
- policies/actions/targets/metrics beyond climate;
- applicable topical standards;
- datapoint mapping;
- evidence and controls;
- digital tagging;
- assurance readiness.

This is a later product expansion, not the current core roadmap.

---

# 24. Product Carbon Footprint — Later

Useful for manufacturing customers, but not before trust/audit/VSME/supplier work.

Potential MVP:

- products;
- BOM/material quantities;
- manufacturing energy allocation;
- transport;
- packaging;
- cradle-to-gate boundary;
- kgCO₂e per product;
- scenario comparison.

Do not call this a full LCA engine unless the methodology and lifecycle boundaries actually support that claim.

---

# 25. CBAM — Later / Premium Vertical

CBAM can be a valuable paid add-on for relevant importers but should remain separate from the core SME carbon-accounting workflow.

Potential objects:

- import record;
- CN code;
- country of origin;
- installation/supplier;
- quantity;
- embedded direct emissions;
- embedded indirect emissions where applicable;
- carbon price paid abroad;
- certificate/liability estimate;
- reporting period.

Only implement after specialist regulatory design.

---

# 26. AI — Use AI for Work, Not Decoration

Do **not** prioritise a generic sustainability chatbot.

High-value AI uses later:

## A. Invoice extraction

Extract:

- supplier;
- invoice date;
- fuel/energy/material quantity;
- units;
- currency;
- line description;
- confidence score.

Always require review before import when confidence is low.

## B. Classification assistant

Suggest Scope 3 category and factor based on supplier/description.

Output confidence and rationale.

## C. Anomaly detection

Example:

> Natural gas use in March is 84% above the 12-month baseline.

## D. Missing-data assistant

Example:

> April electricity data is missing for the Varna location.

## E. Carbon analyst narrative

Generate management commentary from canonical ledger data, not from disconnected calculations.

## F. Reduction recommendations

Only generate recommendations grounded in company data and clearly distinguish generic recommendations from quantified scenarios.

---

# 27. Recommended API / Service Boundaries

Exact folder names should follow the current project structure, but conceptually separate:

## Carbon domain

- calculation engine;
- factor resolution;
- ledger;
- footprint aggregation;
- uncertainty/quality.

## Reporting domain

- report DTO builder;
- standard mappings;
- PDF rendering;
- report snapshots/versions.

## Compliance domain

- applicability engine;
- rule versioning;
- readiness/evidence;
- legal-framework metadata.

## Scope 3 domain

- import;
- transaction normalization;
- classification;
- supplier data;
- calculation.

## Target/scenario domain

- baselines;
- target endpoints;
- forecast;
- scenarios;
- strategies.

Do not allow React page components to contain business-critical carbon formulas.

---

# 28. Recommended New/Extended Database Concepts

Before creating any of these, inspect existing equivalents.

Potential additions:

- `emission_factor_versions`
- `calculation_ledger` or improved `calculated_emissions`
- `evidence_documents`
- `review_events`
- `reporting_period_locks`
- `methodology_versions`
- `report_snapshots`
- `regulatory_rules`
- `regulatory_rule_versions`
- `regulatory_assessments`
- `company_memberships`
- `permissions`
- `suppliers`
- `supplier_data_requests`
- `supplier_submissions`
- `scope3_applicability`
- `energy_contractual_instruments`
- `scenarios`
- `scenario_assumptions`
- `scenario_results`
- `reporting_standards`
- `disclosures`
- `company_disclosure_values`

---

# 29. Data Invariants to Enforce

These should become tests and, where practical, database constraints.

1. Scope coverage percentages cannot exceed 100%.
2. Total footprint must equal the configured sum of included scopes.
3. Scope totals must equal category totals within rounding tolerance.
4. Year-over-year delta must derive from the displayed yearly totals.
5. Percentage target of -15% cannot have target endpoint 0 unless baseline is 0.
6. One active current calculation per activity/method/factor version unless explicitly multi-component.
7. Historical finalized calculations cannot be silently mutated by factor edits.
8. A closed reporting year cannot be edited without restatement/reopening.
9. A report snapshot stores its calculation/factor/methodology version.
10. A compliance status cannot be “fulfilled” if required data is unknown.
11. A report cannot claim evidence/review if there is no corresponding record.
12. `company_id` must be present and RLS-protected for all tenant-owned records.

---

# 30. Testing Strategy

## Unit tests

- unit conversion;
- factor selection;
- Scope 1 calculations;
- Scope 2 location-based;
- Scope 2 market-based later;
- spend-based Scope 3;
- target endpoint math;
- YoY delta;
- coverage;
- uncertainty/quality score;
- regulatory rule evaluator.

## Integration tests

For a seeded company/year, assert that:

- dashboard total;
- comparison total;
- target baseline;
- report total;
- compliance footprint;

all match the same canonical fixture.

## PDF tests

- text smoke tests for report title/year/company;
- strategy section long-string test;
- multi-page table pagination;
- visual regression if tooling allows.

## RLS tests

- Client A cannot read Client B records;
- reviewer/consultant access matches membership/permissions;
- supplier magic links only access intended request.

---

# 31. UI/UX Guidance

The visual system is already clean and should not be redesigned wholesale.

## Keep

- top navigation structure;
- compact cards;
- Bulgarian terminology;
- onboarding;
- catalogue-driven strategies;
- simple initial data-entry forms;
- accessible help.

## Improve

### A. Trust indicators
Add subtle metadata where useful:

- data coverage;
- primary-data share;
- last updated;
- reviewed/approved state;
- method badge;
- factor version.

### B. Do not overload primary forms
Use drawers/accordions for evidence, methodology and calculation details.

### C. Use warnings for estimation
Examples:

- “Spend-based estimate”;
- “Low data quality”;
- “No evidence attached”;
- “Supplier-specific data available”.

### D. Distinguish actual vs forecast
Never use the same visual treatment for:

- actual emissions;
- target line;
- forecast;
- scenario result;
- expected strategy reduction.

---

# 32. Recommended Delivery Roadmap

## Sprint / Phase 0 — Production stability

- [ ] Resolve existing Next.js 15 async-params type errors.
- [ ] Verify production migrations and `DATABASE_URL` process.
- [ ] Configure production Supabase auth redirect URLs.
- [ ] Add basic CI: typecheck, lint, tests, build.

## Sprint / Phase 1 — Trust Layer (highest priority)

- [ ] BUG-P0-001 canonical totals / Carbon Ledger service.
- [ ] BUG-P0-002 Scope 3 coverage / recalc idempotency.
- [ ] BUG-P0-003 target math.
- [ ] BUG-P0-004 report type routing.
- [ ] BUG-P0-005 supplier/description mapping.
- [ ] BUG-P0-006 factor provenance.
- [ ] PDF strategy overlap.
- [ ] emission factor versioning.
- [ ] evidence attachment MVP.
- [ ] calculation detail drawer.
- [ ] regression test suite.

## Sprint / Phase 2 — Compliance correctness

- [ ] redesign compliance scoring/statuses;
- [ ] update/version CSRD applicability rules;
- [ ] standard-version metadata;
- [ ] EU ETS screening questionnaire;
- [ ] review Bulgarian legal mappings;
- [ ] separate law vs standards/frameworks;
- [ ] evidence-driven compliance text;
- [ ] rename/clarify ESRS E1 report positioning.

## Sprint / Phase 3 — EU SME differentiator

- [ ] VSME data model;
- [ ] VSME readiness;
- [ ] VSME PDF;
- [ ] structured export;
- [ ] Scope 3 applicability screening;
- [ ] Scope 2 market-based / GoO/EAC support;
- [ ] Data Quality 2.0.

## Sprint / Phase 4 — Assurance & workflow

- [ ] company memberships/roles;
- [ ] submit/review/approve workflow;
- [ ] audit history;
- [ ] reporting-year close;
- [ ] restatement;
- [ ] auditor read-only access;
- [ ] report snapshots.

## Sprint / Phase 5 — Scope 3 supplier maturity

- [ ] supplier master;
- [ ] supplier ranking by emissions/spend;
- [ ] supplier data requests;
- [ ] magic-link supplier portal;
- [ ] supplier evidence;
- [ ] replace/upgrade spend estimates with primary data.

## Sprint / Phase 6 — Reduction intelligence

- [ ] company-specific strategy calculators;
- [ ] scenario engine;
- [ ] CAPEX/OPEX;
- [ ] savings/payback;
- [ ] target-gap simulation.

## Sprint / Phase 7 — Scale

- [ ] consultant/partner workspace;
- [ ] cross-client tasks;
- [ ] external API;
- [ ] ERP/accounting integration framework.

## Later

- [ ] AI extraction/classification/anomaly detection;
- [ ] Product Carbon Footprint;
- [ ] CBAM module;
- [ ] broader ESRS/CSRD suite if commercially justified;
- [ ] advanced group consolidation.

---

# 33. Priority Matrix

| Item | Priority | Value | Risk if ignored |
|---|---|---|---|
| Canonical Carbon Ledger | P0 | Very high | Critical trust failure |
| Cross-module total fixes | P0 | Very high | Critical |
| Target math | P0 | High | High |
| Scope 3 coverage/idempotency | P0 | High | High |
| Factor versioning | P0 | Very high | Audit/reproducibility failure |
| Evidence/audit provenance | P0/P1 | Very high | Weak assurance |
| Compliance rule overhaul | P0 | Very high | Legal/reputational risk |
| PDF correctness | P0 | High | Customer-facing quality risk |
| VSME | P1 | Very high | Missed SME differentiation |
| Scope 2 market-based | P1 | High | Methodology gap |
| Scope 3 screening | P1 | High | Incomplete inventory design |
| Review/year close | P1 | High | Weak controls |
| Supplier portal | P2 | Very high | Scope 3 maturity ceiling |
| Scenario + ROI | P2 | Very high | Limited management value |
| Consultant workspace | P2 | Very high | Limits business scalability |
| AI | Later | Medium/high | Not required for core trust |
| PCF | Later | High for manufacturing | Scope expansion |
| CBAM | Later | High for specific customers | Specialist vertical |

---

# 34. External Methodology / Regulatory Facts to Keep Versioned

This section is included so implementation does not rely on stale assumptions. These are reference points as of **17 August 2026** and should be revalidated when regulatory code is changed.

## CSRD / ESRS

- EU sustainability reporting scope/rules changed significantly through the simplification process.
- Council sign-off in February 2026 describes narrowed CSRD scope using >1,000 employees and >EUR 450m net annual turnover thresholds.
- European Commission adopted revised sustainability reporting standards on 3 July 2026.

**Engineering implication:** never hardcode old 250 employee / EUR 40m logic into static PDF text.

## VSME

- European Commission adopted a recommendation on voluntary sustainability reporting for SMEs on 30 July 2025.
- EFRAG provides a VSME Digital Template and XBRL taxonomy/converter.

**Engineering implication:** VSME should have a versioned disclosure registry and export layer.

## GHG Protocol Scope 3

- Corporate Value Chain Scope 3 framework contains 15 upstream/downstream categories.

**Engineering implication:** support applicability screening across 15 categories, while keeping SME UX simple.

## GHG Protocol Scope 2

- Current guidance distinguishes location-based and market-based accounting and contains quality criteria for contractual instruments.
- Dual reporting is relevant where product/supplier-specific contractual data is available.

**Engineering implication:** green contracts/GoOs affect market-based treatment; do not erase location-based accounting.

## SBTi

- Companies setting targets in 2026 are directed to the current Corporate Net-Zero Standard v1.3.1.
- Validation under Corporate Net-Zero Standard v2.0 opens in early 2027.

**Engineering implication:** SBTi alignment logic must be versioned and must not imply official validation.

## EU ETS

- Applicability depends on covered installation activities and capacity/Annex I criteria, not merely a low/high corporate footprint total.

**Engineering implication:** use a questionnaire/rule engine and `requires_review` state.

## Bulgarian stationary-source / air-quality rules

- Bulgarian MOEW identifies Ordinance No. 7/1999 as concerning assessment/management of ambient air quality.
- MOEW materials identify Ordinance No. 6/1999 as concerning measurement of harmful emissions from facilities with stationary sources.

**Engineering implication:** current compliance catalogue needs expert legal review and version metadata.

---

# 35. Current Report-Specific Findings

## Compliance Report

Observed issues:

- overall “100%” despite partial items;
- row count vs “8 checked regulations” mismatch;
- outdated CSRD applicability wording;
- oversimplified EU ETS threshold logic;
- questionable Bulgarian Ordinance mapping;
- mixes laws, standards and voluntary frameworks as equivalent “regulations”.

## ESRS E1 Report

Strengths:

- professional visual design;
- clear executive summary;
- Scope 1 detailed activities;
- Scope 2 location-based disclosure;
- Scope 3 method/uncertainty;
- monthly completeness;
- targets and strategies;
- methodology section;
- verification disclaimer.

Observed issues:

- 2024 comparison number conflicts with comparison module;
- Scope 3 supplier/description fields missing despite existing UI data;
- emission factor column is blank while report claims traceability;
- strategy layout overlaps;
- statements about four-eyes review/evidence/audit trail may exceed implemented controls;
- “in accordance with ESRS E1” wording should be reviewed against actual version/mapping;
- report methodology should include explicit factor/methodology versions.

## Full Report

Verify generator mapping because the provided output appears identical to the ESRS E1 report.

---

# 36. Definition of “Competitive v1”

ZED should be considered a strong commercially defensible SME product when the following are true:

### Trust
- one canonical footprint everywhere;
- versioned factors;
- evidence/provenance;
- reproducible reports;
- no >100% coverage;
- no contradictory YoY values.

### Methodology
- Scope 1/2/3 calculations documented;
- Scope 2 location + market-based;
- Scope 3 applicability across 15 categories;
- transparent quality levels;
- standard versions tracked.

### Reporting
- strong GHG report;
- ESRS E1 climate report with correct positioning;
- VSME module;
- compliance screening that is conservative and versioned.

### Workflow
- review/approval;
- year close/restatement;
- evidence;
- auditor access.

### Action
- company-specific strategies;
- target tracking;
- scenario/ROI engine.

### Scope 3 maturity
- supplier master;
- supplier requests;
- primary-data upgrades.

### Scale
- consultant workspace;
- multiple client management;
- API/integration foundation.

---

# 37. Product Areas That Are NOT Immediate Priorities

Do not spend the next development cycle primarily on:

- more dashboard charts;
- mobile apps;
- generic chatbot;
- carbon offset marketplace;
- full enterprise ESG suite;
- dozens of ERP integrations before stable API/data model;
- full LCA engine;
- broad CBAM build before core trust;
- decorative AI features.

The application already has enough breadth. The next competitive advantage comes from **depth, consistency, evidence, reporting correctness and workflow**.

---

# 38. Suggested First Cursor Execution Plan

When this document is handed to Cursor, begin with this sequence:

## Task 1 — Map all current calculation sources

Find every place where total emissions or YoY values are calculated:

- dashboard APIs/components;
- comparison API;
- target sync/forecast API;
- report generator;
- compliance generator;
- benchmark;
- Scope 3 dashboard;
- any helper functions.

Produce a dependency map before modifying logic.

## Task 2 — Reproduce the known inconsistencies

Using the existing `stealth17` seed, create tests/assertions for:

- 2024 total;
- 2025 total;
- 2026 total;
- Scope 1/2/3 totals;
- YoY;
- target baselines;
- Scope 3 coverage.

Do not “fix” seed data merely to make tests pass until the root cause is understood.

## Task 3 — Introduce canonical footprint aggregation

Refactor all consumers to one service.

Do not redesign PDF/UI yet.

## Task 4 — Fix Scope 3 recalculation and coverage

Make recalc idempotent and distinguish transactions from calculation lines.

## Task 5 — Fix target math

Add tests for all target types.

## Task 6 — Fix report mappings/layout

- report type routing;
- supplier/description;
- factor data;
- strategy overlap;
- totals.

## Task 7 — Add factor versioning / calculation snapshots

Design migration and backfill existing demo data.

## Task 8 — Add evidence MVP

Use Supabase Storage if consistent with current architecture.

## Task 9 — Rebuild Compliance scoring/rules

Do not preserve misleading 100% logic.

## Task 10 — Start VSME only after P0 tests are green

---

# 39. Final Product Principle

The core rule for future development should be:

> **Every number must be explainable. Every report must be reproducible. Every compliance statement must show its basis. Every recommendation must distinguish generic guidance from company-specific calculation.**

ZED already has enough functional breadth to be a serious carbon-management product. The highest-value work now is not adding random features; it is turning the existing breadth into a trusted, auditable and regulation-aware platform, and then layering VSME, supplier engagement and scenario/ROI functionality on top.

---

# 40. Source Basis for This Audit

This specification was prepared from:

- the current platform overview supplied by the product owner;
- screenshots of dashboard, data entry, Scope 3 transactions/import, targets, strategies, benchmark, help, locations, onboarding and GDPR pages;
- generated Compliance Report for Stealth 17 Ltd, 2025;
- generated CSRD / ESRS E1 Climate Report for Stealth 17 Ltd, 2025;
- generated Full Report supplied for the same company/year;
- current official reference material from the European Commission, Council of the EU, EFRAG, GHG Protocol, SBTi and Bulgarian Ministry of Environment and Water as checked on 17 August 2026.

**Important:** Regulatory references must be rechecked before future production releases. This document is a product/engineering specification, not legal advice.
