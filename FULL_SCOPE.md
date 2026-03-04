1) Purpose
Problem

SMEs are increasingly required to provide carbon footprint information to clients, banks, and procurement processes, but they:

don’t track carbon activity at granular level,

don’t have internal ESG staff,

only have finance data (invoices/expenses).

Solution

A carbon platform that:

computes Scope 1–2 from activity entries (already implemented),

computes Scope 3 primarily from financial transactions (invoices/expenses),

provides clear “show my math” transparency,

generates client-ready reports and audit exports,

keeps the process fast: first-time setup ≤ 60 minutes, monthly updates ≤ 10 minutes.

Success metrics (product outcomes)

Time-to-first-report: median ≤ 60 min

Monthly reporting friction: median ≤ 10 min

% transactions auto-classified: ≥ 70% after first month

Report completion (Scopes 1–3 with at least SME categories): ≥ 80% of customers

Support tickets per customer per month: ≤ 1

2) Target users & roles
User types

Client Admin (SME owner/CEO/ops manager)

wants “get me a report quickly and credibly”

Client Accountant / Finance person

has invoices, categories, exports

Consultant (optional role)

manages multiple client companies

Platform Admin

manages companies/users, factor library, QA, support

Roles & permissions

Admin: global access, factor management, user/company management

Company Admin: full access to company data, reporting, settings

Company Member: data entry + imports; limited settings

Read-only: view dashboards/reports only (optional)

3) Scope & non-goals
In scope (MVP+)

Scope 3 categories for SMEs (the “killer 5”):

Cat 1 Purchased goods & services

Cat 4 Upstream transport & distribution

Cat 5 Waste generated in operations

Cat 6 Business travel

Cat 7 Employee commuting

Finance-first Scope 3 via CSV import + rule-based classification

“Method ladder” (data quality tiers)

Factor library with versioning + sources

Transparent calculation trace per emission line

Reporting export (PDF + audit CSV)

Out of scope (initially)

Full 15 Scope 3 categories

Product-level LCA modeling

Real-time IoT measurement

Complex assurance workflows / auditor portal

Supplier-specific EPD parsing automation

AI document OCR ingestion (can come later)

4) Core product concept
Key concept

Carbon accounting for SMEs is estimated from finance + minimal surveys. The product is primarily:

an ingestion pipeline for spend/transactions,

a classification engine,

an emission-factor engine,

a calculation engine,

a reporting engine with audit trail.

Scope 3 “method ladder” (data quality)

For each Scope 3 category, the system chooses best available method:

Tier A (Best): Supplier-specific factor/data
Tier B: Physical activity (kg, ton-km, passenger-km, kWh, etc.)
Tier C: Spend-based factor (EEIO)
Tier D: Proxy / default estimate (last resort)

Product must show tier + assumption on every line item and in report summary.

5) User journeys (end-to-end)
Journey A: First-time setup for an SME

Create company (already exists)

Choose reporting period (year) + currency + sector

Import finance data (CSV)

System auto-classifies transactions to Scope 3 categories

User reviews a “Classification Review” screen:

fix obvious mistakes

create rules (“always map Supplier X to Category Y”)

System calculates Scope 3 emissions

System prompts micro-survey for missing categories (travel/commuting/waste if absent from finance)

Dashboard shows total emissions (Scopes 1–3)

Generate report (PDF) + audit export (CSV)

Acceptance criteria

User can obtain a credible Scope 1–3 footprint without manual line-by-line entry.

Report includes calculation sources + assumptions.

Journey B: Monthly update (fast workflow)

Import new month CSV (or add new rows)

Auto-classification applies saved rules

User checks “What’s new / what changed”

System recalculates, shows deltas (month-over-month)

Export updated report

Acceptance criteria

80%+ of new transactions auto-classified after month 1.

Journey C: Consultant managing multiple clients (optional)

Switch company context

Run imports + classification review per client

Export reports

6) Functional requirements
6.1 Finance data ingestion (Scope 3 foundation)
Feature: CSV Import Wizard

Inputs (minimum required columns):

transaction_date

supplier_name / counterparty

description (optional but helpful)

amount

currency

Optional columns:

expense category / account code

invoice number

VAT

cost center / department

Wizard steps

Upload CSV

Map CSV columns to required fields

Validate rows (date parse, numeric amount, currency)

Show preview + row count

Import into “transactions” table

Rules

Keep original raw record + normalized record

Deduplicate: same invoice number+date+amount+supplier (configurable)

Store import batch metadata (who imported, when, file hash)

Acceptance criteria

Import handles 10k rows without breaking UX (pagination + background processing if needed)

User sees row-level error reasons (bad date, missing amount, etc.)

6.2 Classification engine (transactions → Scope 3 mapping)
Feature: Auto-classify transactions

Goal: assign each transaction to:

Scope: 3

Scope 3 category: (1,4,5,6,7)

Subcategory: (your internal taxonomy)

Method tier (C or D by default unless physical provided)

Factor reference (links to emission factor)

Classification approaches (ordered)

Explicit mapping: if transaction already tagged by user

Rule-based mapping: “supplier contains”, “category equals”, “account code equals”

Dictionary mapping: known suppliers (e.g., airlines → travel)

Fallback mapping: “Uncategorized Scope 3”

Feature: Classification Review Screen

A queue UI that shows:

transactions not classified

transactions with low confidence

top suppliers by spend
User actions:

assign category/subcategory

choose method (spend-based vs activity-based if user knows quantity)

create a rule based on this assignment (checkbox “apply to future”)

Rule system requirements

Rule types:

contains text (supplier/description)

equals (expense category/account code)

regex (optional advanced)

Rule priority (first match wins or weighted)

Rule scoping:

per company

global templates (admin-provided starter rules)

Acceptance criteria

User can classify 80% of spend by reviewing top 20 suppliers.

6.3 Activity-based inputs (for travel/commuting/transport) — minimal forms
Feature: Micro-surveys (gap fillers)

If finance data doesn’t cover these well, collect minimal estimates:

Business travel (Cat 6)

Form options:

Flights: number + distance band OR city pairs (optional)

Train: passenger-km or number of trips + distance

Hotels: nights by region

Car rental: km or spend

MVP: allow either:

spend-based (total travel spend) OR

simple activity (distance bands)

Employee commuting (Cat 7)

Form:

number of employees

average commute distance (one way)

working days per month (default)

mode split (%) car/public transport/remote/etc.

Upstream transport (Cat 4)

Form:

ton-km (best) OR

shipments count + avg distance + transport mode OR

spend-based shipping

Waste (Cat 5)

Form:

waste type (general, recycling, organic, hazardous)

mass (kg/ton) OR spend-based if mass unknown

Acceptance criteria

Survey completion ≤ 15 minutes for SME

6.4 Emission factor library (Scope 3 extension)
Feature: Factor management

You already have emission_factors. Extend it so factors can support:

spend-based factors: kgCO2e / currency unit (e.g., kgCO2e / EUR)

travel factors: kgCO2e / passenger-km, per flight band, etc.

freight factors: kgCO2e / ton-km (by mode)

waste factors: kgCO2e / kg waste by type

Requirements: Factor versioning & provenance

Each factor has:

factor_id (immutable)

source_name

source_year

geography

category applicability (Scope 3 category/subcategory)

unit (denominator)

value (kgCO2e per unit)

uncertainty rating (optional)

valid_from / valid_to

version tag

Behavior

Reports store factor_id and factor_version used at generation time.

If factors update later, old reports remain reproducible.

Acceptance criteria

“Show my math” always includes factor source + version.

6.5 Calculation engine (Scope 3)
Calculation rules

Every emission line item results in:

CO2e value (kg or t)

method tier (A/B/C/D)

factor used

conversion steps

Spend-based (Tier C)
CO2e = amount * spend_factor

Activity-based (Tier B)
CO2e = activity_value * factor

Supplier-specific (Tier A, later)
CO2e = supplier_provided_value (validated + referenced)

Currency handling

Store company base currency

If imported transaction is different currency:

convert using monthly average FX rate (factor table or FX table)

store both original and normalized amount + rate used

Acceptance criteria

For any emission output, system can regenerate the same value with same inputs.

6.6 Data quality scoring (critical “legitimacy” UX)
Feature: Data Quality Grade

Provide:

grade per category

grade for total inventory

distribution by method tier (A/B/C/D)

“improve recommendations” based on hotspots

Example

“Category 1 is 90% spend-based (Tier C). Improve by collecting supplier footprints for top 10 suppliers.”

Acceptance criteria

Report includes method coverage summary + limitations section.

6.7 Reporting engine
Report types (MVP)

Client-ready ESG footprint summary (PDF)

Company details + boundary

Scopes 1–3 totals

Scope 3 categories included (with note “MVP categories”)

Method summary (tiers)

Emission factor sources

Top emission drivers

Notes/assumptions

Audit export (CSV/Excel)

Every transaction line mapped → category → factor → calculation → CO2e

Include:

import batch id

rule id used (if any)

factor id/version

method tier

timestamps

user overrides

Acceptance criteria

An auditor/large client can trace any number back to a raw transaction and factor.

7) Data model (conceptual, not code)

You already have: companies, users, locations, emission_data (Scopes 1–2), emission_factors, reports.

Add these entities:

7.1 transactions

Stores normalized finance rows.
Fields:

id

company_id

import_batch_id

txn_date

supplier

description

amount_original, currency_original

amount_base_currency, base_currency

expense_category_raw (optional)

account_code_raw (optional)

raw_payload_json

created_by, created_at

7.2 import_batches

id, company_id, filename, file_hash, row_count, imported_by, imported_at, status

7.3 classification_rules

id, company_id

priority

condition_type (contains/equals/regex)

condition_field (supplier/description/category/account_code)

condition_value

output_scope3_category

output_subcategory

default_method (spend/activity)

default_factor_id

created_by, created_at

7.4 transaction_classifications

Stores final mapping for each transaction (so you can re-run rules without losing history).

id, transaction_id

scope (3)

scope3_category, subcategory

method_tier

factor_id

confidence (optional)

classified_by (rule/user/system)

rule_id (nullable)

notes

locked (bool)

classified_at

7.5 scope3_activity_entries (optional)

For survey/activity forms that aren’t tied to a transaction.

id, company_id, period

category (6/7/4/5)

activity_type

activity_value, unit

factor_id

method_tier (B)

notes

7.6 calculated_emissions

Materialized calculation results (optional but recommended for performance).

id, source_type (transaction/activity/scope1_2)

source_id

period

scope, scope_category

co2e_kg

factor_id, factor_version

method_tier

calculation_trace_json

created_at

8) UX screens (exact screens to build)
8.1 Scope 3 navigation

Add new sections:

Scope 3 → Imports

Scope 3 → Classification

Scope 3 → Surveys

Scope 3 → Results

Reports

8.2 Import screen

Upload CSV

Map columns step

Validation step

Import confirmation + batch history list

8.3 Classification screen (core value UI)

Tabs:

“Unclassified”

“Low confidence”

“Top spend suppliers”

“Rules”

Bulk actions:

assign category

apply rule

choose factor

Search/filter: supplier, category, date range

Show “estimated CO2e impact” preview

8.4 Survey screens

Business travel form

Commuting form

Waste form

Upstream transport form
Each with:

“simple mode” default

“advanced mode” optional

8.5 Results screen

Scope 3 totals

Breakdown by category

Method tier distribution

Top suppliers by emissions

“Improve data quality” suggestions

8.6 Report generator

Choose period

Toggle include categories

Generate PDF

Download audit CSV

9) Non-functional requirements
Security

RLS enforced for transactions, rules, classifications, reports

Immutable audit log for:

factor updates

rule changes

report generation

Soft delete only for important records

Performance

Import 10k rows, classify within acceptable time

Cache/memoize factor lookups

Background recalculation (optional) but user must see progress

Localization

Bulgarian UI (already)

Store units, currency formatting, date formatting accordingly

Report language Bulgarian + optional English export later

Reliability & traceability

Every reported number must be explainable:

show inputs

show factor

show conversion

10) Acceptance criteria checklist (clarity + “obvious to build”)

A build is considered “complete” when:

Ingestion

 User can upload CSV and import transactions with validation.

 Import batches are stored with metadata and are reproducible.

Classification

 System auto-classifies using rules.

 User can override classification and lock it.

 User can create rules from overrides.

 Future imports reuse rules automatically.

Factors

 Factors are versioned and linked to calculations.

 Updating factors does not break old reports.

Calculations

 Each transaction or activity generates a CO2e result with full trace.

 Currency conversion is consistent and stored.

Scope 3 Coverage

 Product supports the 5 SME Scope 3 categories end-to-end.

 Micro-surveys exist for travel/commuting/waste/transport gaps.

Reporting

 PDF summary includes totals, breakdown, methods, sources, limitations.

 Audit export includes line-item mapping and factor IDs.

Trust

 Every number in the UI can be traced back to a raw record + factor.

 Data quality tiers are displayed and summarized.