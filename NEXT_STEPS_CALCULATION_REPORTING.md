# 🚀 Next Steps: From Classifications to Reports

## ✅ What We Have So Far (Weeks 1-4)

### Week 1-2: Foundation
- ✅ Database schema (transactions, classifications, rules, factors)
- ✅ CSV import system
- ✅ Transaction list view
- ✅ Manual transaction entry
- ✅ Delete transactions

### Week 3-4: Classification
- ✅ Manual classification UI
- ✅ Bulk classification
- ✅ 90+ auto-classification rules
- ✅ Top suppliers view
- ✅ Classification progress tracking

---

## 🎯 What's Next: The Journey to Complete Reports

### Current Status
```
📥 Import → ✅ Classify → ❓ Calculate → ❓ Visualize → ❓ Report
```

### Goal
```
📥 Import → ✅ Classify → 🔢 Calculate → 📊 Visualize → 📄 Report
```

---

## 📋 Detailed Roadmap (Weeks 5-9)

### **WEEK 5: Calculation Engine** 🔢 [NEXT!]
**Goal**: Convert classified transactions into CO2e emissions

**What we'll build**:
1. **Calculation API** (`/api/scope3/calculate`)
   - Read classified transactions
   - Match with emission factors
   - Apply calculation formulas
   - Store results in `calculated_emissions` table

2. **Calculation Logic**:
   ```typescript
   For each classified transaction:
     1. Get transaction amount (EUR)
     2. Find matching emission factor (e.g., "Telecom services")
     3. Apply formula: CO2e = Amount × Factor
     4. Store: {
          transaction_id,
          co2e_kg,
          co2_kg, ch4_kg, n2o_kg,
          factor_used,
          calculation_method: "spend-based",
          calculated_at
        }
   ```

3. **Emission Factors Mapping**:
   - Cat 1 (Purchased Goods) → Spend-based factors (EUR → kg CO2e)
   - Cat 6 (Business Travel) → Spend-based factors
   - Cat 7 (Commuting) → Spend-based factors
   - Cat 4 (Transport) → Spend-based factors
   - Cat 5 (Waste) → Spend-based factors

4. **Example Calculation**:
   ```
   Transaction: Microsoft 365 - 45 EUR
   Classification: Cat 1 - Software Services
   Factor: 0.35 kg CO2e per EUR (EXIOBASE)
   Result: 45 × 0.35 = 15.75 kg CO2e
   ```

**Deliverables**:
- ✅ Calculation engine API
- ✅ Automated calculation on classification
- ✅ `calculated_emissions` table populated
- ✅ Calculation trace (show my math)

---

### **WEEK 6: Dashboard Visualization** 📊
**Goal**: Show emissions data visually

**What we'll build**:
1. **Dashboard Overview** (`/dashboard`)
   - Total Scope 3 emissions (tons CO2e)
   - Breakdown by category (Cat 1, 6, 7, 4, 5)
   - Month-over-month trend
   - Top 10 suppliers by emissions

2. **Charts**:
   - **Pie Chart**: Emissions by Scope 3 category
   - **Bar Chart**: Top 10 suppliers by CO2e
   - **Line Chart**: Monthly trend
   - **Stacked Bar**: Category breakdown over time

3. **Summary Cards**:
   ```
   ┌─────────────────────────┐
   │ Total Scope 3 Emissions │
   │      12.5 tons CO2e     │
   │   ↑ 5% from last month  │
   └─────────────────────────┘
   
   ┌─────────────────────────┐
   │  Cat 1: Purchased Goods │
   │      8.2 tons (66%)     │
   └─────────────────────────┘
   ```

4. **Filters**:
   - Date range selector
   - Category filter
   - Supplier filter

**Deliverables**:
- ✅ Enhanced dashboard with Scope 3 data
- ✅ Interactive charts
- ✅ Summary statistics
- ✅ Filter functionality

---

### **WEEK 7: Data Quality & Insights** 📈
**Goal**: Show calculation quality and insights

**What we'll build**:
1. **Data Quality Score**:
   ```
   Score: B+ (85%)
   
   Breakdown:
   - 70% spend-based (Tier C) → Medium quality
   - 20% activity-based (Tier B) → Good quality
   - 10% supplier-specific (Tier A) → Excellent quality
   - 0% proxy/estimate (Tier D) → Low quality
   ```

2. **Insights Panel**:
   - "Your biggest emission source is Cat 1 (66%)"
   - "Top 3 suppliers contribute 45% of emissions"
   - "Business travel increased 20% this month"
   - "Recommendation: Collect activity data for top 10 suppliers"

3. **Supplier Impact Ranking**:
   ```
   1. Microsoft 365 - 2.4 tons CO2e (19%)
   2. Amazon AWS - 1.8 tons CO2e (14%)
   3. Lukoil - 1.5 tons CO2e (12%)
   ```

**Deliverables**:
- ✅ Data quality scoring
- ✅ Automated insights
- ✅ Supplier impact ranking
- ✅ Improvement recommendations

---

### **WEEK 8: Enhanced PDF Reports** 📄
**Goal**: Generate professional carbon reports

**What we'll build**:
1. **Report Template**:
   ```
   ┌────────────────────────────────────┐
   │  CARBON FOOTPRINT REPORT 2026      │
   │  Company: [Your Company]           │
   │  Period: Jan - Dec 2026            │
   ├────────────────────────────────────┤
   │                                    │
   │  EXECUTIVE SUMMARY                 │
   │  Total GHG Emissions: 120 tons     │
   │  - Scope 1: 20 tons (17%)          │
   │  - Scope 2: 45 tons (38%)          │
   │  - Scope 3: 55 tons (45%)          │
   │                                    │
   │  SCOPE 3 BREAKDOWN                 │
   │  [Pie chart]                       │
   │  Cat 1: 35 tons (64%)              │
   │  Cat 6: 10 tons (18%)              │
   │  Cat 7: 8 tons (15%)               │
   │  Cat 4: 1.5 tons (3%)              │
   │  Cat 5: 0.5 tons (1%)              │
   │                                    │
   │  METHODOLOGY                       │
   │  - GHG Protocol                    │
   │  - Emission factors: EXIOBASE v3   │
   │  - Data quality: B+ (85%)          │
   │                                    │
   │  DETAILED BREAKDOWN                │
   │  [Table of emissions by category]  │
   │                                    │
   │  AUDIT TRAIL                       │
   │  [CSV export of calculations]      │
   └────────────────────────────────────┘
   ```

2. **Report Features**:
   - Company logo and branding
   - Executive summary
   - Charts and visualizations
   - Detailed breakdown tables
   - Methodology section
   - Data quality statement
   - Calculation transparency (audit trail)

3. **Export Formats**:
   - **PDF**: Client-ready report
   - **CSV**: Audit trail (all calculations)
   - **Excel**: Detailed data export

**Deliverables**:
- ✅ PDF report generation
- ✅ CSV audit export
- ✅ Excel detailed export
- ✅ Branded templates

---

### **WEEK 9: Targets & Forecasting** 🎯
**Goal**: Set and track reduction targets

**What we'll build**:
1. **Targets Page** (`/targets`)
   - Set reduction targets (e.g., "Reduce Scope 3 by 20% by 2030")
   - Track progress against targets
   - Forecast future emissions
   - Scenario modeling

2. **Target Types**:
   - Absolute reduction (e.g., "From 100 to 80 tons")
   - Intensity reduction (e.g., "Per revenue, per employee")
   - Science-based targets (SBTi methodology)

3. **Progress Tracking**:
   ```
   Target: -20% by 2030
   
   2024: 100 tons (baseline)
   2025: 95 tons (-5%) ✅ On track
   2026: 90 tons (-10%) ✅ On track
   2027: 85 tons (-15%) [Forecast]
   2030: 80 tons (-20%) [Target]
   ```

**Deliverables**:
- ✅ Targets management
- ✅ Progress tracking
- ✅ Forecasting engine
- ✅ Scenario modeling

---

## 🔢 WEEK 5 DETAILED: Calculation Engine

### Implementation Plan

#### 1. Database (Already exists!)
```sql
-- calculated_emissions table (already created in Week 1)
- transaction_id → links to transaction
- co2e_kg → total CO2 equivalent
- co2_kg, ch4_kg, n2o_kg → individual gases
- factor_id → emission factor used
- factor_value → value at time of calculation
- calculation_method → "spend-based" | "activity-based"
- data_quality_tier → A | B | C | D
- calculated_at → timestamp
```

#### 2. Calculation API
```typescript
// POST /api/scope3/calculate
// Calculates emissions for classified transactions

Input: { recalculate?: boolean }

Process:
1. Get all classified transactions without calculations
2. For each transaction:
   a. Get classification (scope3_category)
   b. Find matching emission factor
   c. Apply formula: CO2e = amount × factor
   d. Store result in calculated_emissions
3. Return summary

Output: {
  calculated_count: 150,
  total_co2e_kg: 12500,
  breakdown_by_category: {
    1: 8200,  // Cat 1
    6: 2100,  // Cat 6
    7: 1800,  // Cat 7
    4: 300,   // Cat 4
    5: 100    // Cat 5
  }
}
```

#### 3. Emission Factors Usage

We already have **~80 factors** seeded. Examples:

```sql
-- Cat 1: Telecom (for Vivacom)
factor: 0.25 kg CO2e per EUR
subcategory: 'telecommunications'

-- Cat 6: Hotels (for Grand Hotel)
factor: 1.2 kg CO2e per EUR
subcategory: 'accommodation'

-- Cat 7: Fuel (for Lukoil)
factor: 2.3 kg CO2e per liter
OR spend-based: 0.4 kg CO2e per EUR
```

#### 4. Calculation Examples

**Example 1: Software (Microsoft 365)**
```
Transaction: 45 EUR
Factor: 0.35 kg CO2e / EUR
Calculation: 45 × 0.35 = 15.75 kg CO2e
```

**Example 2: Hotel (Grand Hotel Sofia)**
```
Transaction: 450 EUR
Factor: 1.2 kg CO2e / EUR
Calculation: 450 × 1.2 = 540 kg CO2e
```

**Example 3: Fuel (Lukoil)**
```
Transaction: 77 EUR
Factor: 0.4 kg CO2e / EUR (spend-based)
Calculation: 77 × 0.4 = 30.8 kg CO2e
```

#### 5. Calculation Trace (Transparency)

Every calculation stores:
```json
{
  "transaction_id": "uuid",
  "amount": 45,
  "currency": "EUR",
  "classification": "Cat 1 - Software Services",
  "factor_id": "uuid",
  "factor_name": "IT Services - Software",
  "factor_value": 0.35,
  "factor_unit": "kg CO2e per EUR",
  "factor_source": "EXIOBASE v3.8",
  "calculation": "45 EUR × 0.35 = 15.75 kg CO2e",
  "co2e_kg": 15.75,
  "method": "spend-based",
  "tier": "C",
  "calculated_at": "2026-02-27T12:00:00Z"
}
```

---

## 📊 Expected Results After Week 5

### Dashboard Will Show:

```
┌─────────────────────────┐  ┌─────────────────────────┐
│ Total Scope 3 Emissions │  │   Classified            │
│      12.5 tons CO2e     │  │   100% (15 txns)        │
│   €2,500 total spend    │  │   ✅ All calculated     │
└─────────────────────────┘  └─────────────────────────┘

Breakdown by Category:
━━━━━━━━━━━━━━━━━━━━━━
Cat 1: ████████████████░░░░ 8.2 tons (66%)
Cat 6: ████░░░░░░░░░░░░░░░░ 2.1 tons (17%)
Cat 7: ███░░░░░░░░░░░░░░░░░ 1.8 tons (14%)
Cat 4: █░░░░░░░░░░░░░░░░░░░ 0.3 tons (2%)
Cat 5: ░░░░░░░░░░░░░░░░░░░░ 0.1 tons (1%)

Top Suppliers by Emissions:
━━━━━━━━━━━━━━━━━━━━━━
1. Microsoft 365    2.4 tons (19%)
2. Amazon AWS       1.8 tons (14%)
3. Lukoil Bulgaria  1.5 tons (12%)
4. Grand Hotel      1.2 tons (10%)
5. FedEx Bulgaria   0.8 tons (6%)
```

---

## 🎯 Priority: What Should We Do First?

### Option A: Calculation Engine (Recommended) ⭐
**Why**: You can't visualize or report without calculations!

**Steps**:
1. Create calculation API
2. Run calculations on existing transactions
3. Add "Calculate" button to dashboard
4. Show total CO2e in dashboard

**Time**: 1-2 days

---

### Option B: Enhanced Dashboard First
**Why**: See empty state, prepare UI for calculations

**Steps**:
1. Add Scope 3 section to dashboard
2. Show "No calculations yet" message
3. Add charts (empty for now)
4. Then do calculations (Week 5)

**Time**: 1 day, then Week 5

---

## 🚀 Recommendation: Start Week 5 (Calculations) Now!

**Why go straight to calculations?**
1. ✅ We have classified transactions
2. ✅ We have emission factors
3. ✅ We have the database structure
4. ✅ It's the logical next step

**What we need**:
- Create `/api/scope3/calculate` endpoint
- Match classifications to factors
- Run calculations
- Store results
- Show totals in dashboard

**After this, everything else (charts, reports, targets) becomes easy!**

---

## 📝 Summary

### Current Progress: 33% (4/12 weeks)
```
✅ Week 1: Database
✅ Week 2: Import
✅ Week 3: Classification UI
✅ Week 4: Auto-Rules
🔜 Week 5: Calculation Engine ← YOU ARE HERE
⏳ Week 6: Dashboard
⏳ Week 7: Data Quality
⏳ Week 8: PDF Reports
⏳ Week 9: Targets
```

### What You Can Do Now:
1. ✅ Import transactions
2. ✅ Auto-classify with rules
3. ✅ Manually classify
4. ✅ Edit classifications (new!)
5. ✅ View transaction list
6. ✅ Delete transactions

### What's Coming Next:
1. 🔢 **Calculate CO2e** from classified transactions
2. 📊 **Visualize** emissions in dashboard
3. 📄 **Generate reports** (PDF, CSV)
4. 🎯 **Set targets** and track progress

---

**Ready to start Week 5 (Calculation Engine)?** 🚀
