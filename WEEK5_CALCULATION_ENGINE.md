# ✅ Week 5: Calculation Engine - COMPLETE!

**Date**: February 27, 2026  
**Status**: ✅ Production-Ready  
**Progress**: 42% (5/12 weeks)

---

## 🎯 What We Built

The **Calculation Engine** converts classified transactions into actual CO2e emissions!

### Key Features

#### 🧮 Automatic Calculations
- **Matches transactions with emission factors** based on category
- **Calculates CO2e**: `Amount (EUR) × Emission Factor = kg CO2e`
- **Stores full calculation trace** for transparency ("show my math")
- **Batch processing** for efficiency (100s at once)

#### 📊 Calculation Summary
- **Total emissions** display (tons CO2e)
- **Breakdown by category** (Cat 1, 4, 5, 6, 7)
- **Breakdown by method tier** (A, B, C, D)
- **Coverage percentage** (how many classified transactions are calculated)

#### 🔍 Transparency
- **Full calculation trace** stored in database
- **Shows formula**: `45 EUR × 0.35 kg CO2e per EUR = 15.75 kg CO2e`
- **Links to emission factor** with source and version
- **Tracks calculation date** for audit trail

---

## 🚀 How It Works

### Step 1: Classification
```
Transaction: Microsoft 365 - 45 EUR
↓
Classification: Cat 1 (Purchased Services)
Method Tier: C (Spend-based)
```

### Step 2: Factor Matching
```
Find emission factor for:
- Category: 1 (Purchased Goods & Services)
- Tier: C (Spend-based)
- Keywords: "software", "cloud", etc.

Match: "Software Services - EXIOBASE"
Factor: 0.35 kg CO2e per EUR
```

### Step 3: Calculation
```
Calculation:
45 EUR × 0.35 kg CO2e/EUR = 15.75 kg CO2e

Store:
- Result: 15.75 kg CO2e
- Factor ID: xxx
- Factor Version: 1.0
- Method Tier: C
- Calculation Trace: { ... }
- Reporting Period: 2025-02
```

### Step 4: Aggregation
```
Total Scope 3 Emissions:
Cat 1: 8.2 tons (66%)
Cat 6: 2.1 tons (17%)
Cat 7: 1.8 tons (14%)
Cat 4: 0.3 tons (2%)
Cat 5: 0.1 tons (1%)

Total: 12.5 tons CO2e
```

---

## 🔢 Example Calculation

### Transaction
```json
{
  "supplier": "Lukoil Bulgaria",
  "description": "Fuel for company vehicles",
  "amount_base_currency": 77,
  "base_currency": "EUR",
  "txn_date": "2025-02-01"
}
```

### Classification
```json
{
  "scope3_category": 7,
  "method_tier": "C"
}
```

### Emission Factor (from database)
```json
{
  "name": "Transport - Passenger Car (Fuel)",
  "scope3_category": 7,
  "method_tier": "C",
  "co2e_per_unit": 0.28,
  "unit": "EUR",
  "source_name": "DEFRA 2024",
  "factor_version": "1.0"
}
```

### Calculation Result
```json
{
  "co2e_kg": 21.56,
  "calculation_trace": {
    "amount": 77,
    "currency": "EUR",
    "factor_value": 0.28,
    "factor_unit": "EUR",
    "factor_name": "Transport - Passenger Car (Fuel)",
    "factor_source": "DEFRA 2024",
    "calculation": "77 EUR × 0.28 kg CO2e per EUR = 21.56 kg CO2e",
    "supplier": "Lukoil Bulgaria",
    "date": "2025-02-01"
  }
}
```

---

## 📁 Files Created/Modified

### API Routes
- **`app/api/scope3/calculate/route.ts`** (NEW)
  - `POST /api/scope3/calculate` - Calculate emissions
  - `GET /api/scope3/calculate` - Get calculation summary

### UI Components
- **`app/(dashboard)/scope3/transactions/page.tsx`** (MODIFIED)
  - Added "Calculate" button
  - Added calculation summary card
  - Added state management for calculations
  - Added `fetchCalculationSummary()` function
  - Added `handleCalculate()` function

### Translations
- **`lib/i18n/bg.ts`** (MODIFIED)
  - Added 25+ calculation-related translations
  - `calculate`, `calculating`, `calculateEmissions`, etc.
  - `co2eKg`, `co2eTons`, `calculationSummary`, etc.

---

## 🎨 UI Features

### Calculation Button
```
┌─────────────────────────┐
│ 🧮 Изчисли емисии       │
└─────────────────────────┘
```

**Location**: Top right of transactions page  
**Color**: Green (eco-friendly)  
**Behavior**: 
- Click to calculate all unCalculated classified transactions
- Shows spinner while calculating
- Success toast with summary

### Calculation Summary Card
```
┌──────────────────────────────────────────────────────┐
│ 🌿 Изчислени емисии               🧮 Преизчисли     │
│                                                       │
│  Общо емисии        Изчисления      Покритие         │
│    12.5                 145            100%          │
│  тона CO2e          транзакции                       │
│                                                       │
│  По категория:                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ Кат. 1   │  │ Кат. 6   │  │ Кат. 7   │          │
│  │  8.2 т   │  │  2.1 т   │  │  1.8 т   │          │
│  └──────────┘  └──────────┘  └──────────┘          │
└──────────────────────────────────────────────────────┘
```

**Features**:
- **Gradient background** (green-emerald)
- **3 main metrics**: Total, Count, Coverage
- **Category breakdown** with visual cards
- **Recalculate button** in top right
- **Auto-refreshes** after calculation

---

## 🔧 API Endpoints

### POST /api/scope3/calculate

**Calculate CO2e emissions for classified transactions**

**Request Body** (optional):
```json
{
  "period": "2025-01",     // Monthly: "YYYY-MM" or Yearly: "YYYY"
  "recalculate": false     // If true, recalculate existing
}
```

**Response**:
```json
{
  "success": true,
  "calculated": 42,              // New calculations
  "skipped": 3,                  // Already calculated
  "total_transactions": 45,
  "total_co2e_kg": 12456.78,
  "total_co2e_tons": 12.46
}
```

**Logic**:
1. Fetch all classified transactions (filtered by period if specified)
2. For each transaction:
   - Check if already calculated (skip if `recalculate=false`)
   - Find matching emission factor (category + tier + keywords)
   - Calculate: `amount × factor = co2e_kg`
   - Store in `calculated_emissions` table
3. Return summary

---

### GET /api/scope3/calculate

**Get calculation summary for company**

**Query Params**:
- `period` (optional): "2025-01" or "2025"

**Response**:
```json
{
  "total_co2e_kg": 12456.78,
  "total_co2e_tons": 12.46,
  "total_calculations": 145,
  "by_category": [
    { "category": 1, "co2e_kg": 8234.56, "count": 98 },
    { "category": 6, "co2e_kg": 2100.22, "count": 25 },
    { "category": 7, "co2e_kg": 1800.00, "count": 20 },
    { "category": 4, "co2e_kg": 300.00, "count": 2 }
  ],
  "by_tier": [
    { "tier": "C", "co2e_kg": 11500.00, "count": 140 },
    { "tier": "B", "co2e_kg": 956.78, "count": 5 }
  ],
  "period": "all"
}
```

---

## 🧠 Factor Matching Logic

The system uses a **smart matching algorithm** to find the best emission factor:

### Priority 1: Keyword Match
```typescript
// Match supplier/description keywords
Text: "microsoft 365 subscription"
Factor Keywords: ["microsoft", "software", "cloud"]
Result: MATCH ✅
```

### Priority 2: Tier Match
```typescript
// Match category + tier
Category: 1 (Purchased Goods & Services)
Tier: C (Spend-based)
Result: Find first factor with category=1 AND tier=C
```

### Priority 3: Default
```typescript
// Use default factor for category
Category: 1
Result: Use first available factor for category 1 (usually Tier C)
```

### Example
```
Transaction: "FedEx courier service - 120 EUR"
Classification: Category 4, Tier C

Matching Process:
1. Check keywords: "fedex" → No specific match
2. Check tier: Category 4 + Tier C → ✅ "Transport & Distribution - Spend-based"
3. Use factor: 0.45 kg CO2e per EUR

Calculation: 120 × 0.45 = 54 kg CO2e
```

---

## 📊 Database Schema

### calculated_emissions Table
```sql
CREATE TABLE calculated_emissions (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  
  -- Source
  source_type TEXT CHECK (source_type IN ('transaction', 'activity', 'scope1_2')),
  source_id UUID,  -- Reference to financial_transactions.id
  
  -- Period
  reporting_period DATE,  -- First of month (e.g., 2025-02-01)
  
  -- Scope
  scope INTEGER CHECK (scope IN (1, 2, 3)),
  scope_category INTEGER,  -- Scope 3 category (1-15)
  
  -- Result
  co2e_kg NUMERIC,
  
  -- Trace
  factor_id UUID REFERENCES emission_factors(id),
  factor_version TEXT,
  method_tier TEXT CHECK (method_tier IN ('A', 'B', 'C', 'D')),
  calculation_trace JSONB,  -- Full "show my math" data
  
  -- Metadata
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### calculation_trace JSONB Structure
```json
{
  "transaction_id": "xxx-xxx-xxx",
  "amount": 77,
  "currency": "EUR",
  "factor_value": 0.28,
  "factor_unit": "EUR",
  "factor_name": "Transport - Passenger Car (Fuel)",
  "factor_source": "DEFRA 2024",
  "category": 7,
  "method_tier": "C",
  "calculation": "77 EUR × 0.28 kg CO2e per EUR = 21.56 kg CO2e",
  "supplier": "Lukoil Bulgaria",
  "description": "Fuel for company vehicles",
  "date": "2025-02-01"
}
```

---

## 🧪 Testing

### Test 1: Calculate Emissions
```
1. Go to http://localhost:3000/scope3/transactions
2. Ensure you have classified transactions
3. Click "Изчисли емисии" button
4. ✅ Success toast appears
5. ✅ Calculation summary card appears
6. ✅ Shows total tons CO2e
7. ✅ Shows breakdown by category
```

### Test 2: View Calculation Summary
```
1. After calculation, check the green summary card
2. ✅ Shows total emissions in tons
3. ✅ Shows number of calculations
4. ✅ Shows coverage percentage
5. ✅ Shows breakdown by category (Cat 1, 6, 7, etc.)
6. ✅ Each category shows tons CO2e
```

### Test 3: Recalculate
```
1. Click "Преизчисли" in the summary card
2. ✅ Button shows spinner
3. ✅ "Всички транзакции вече са изчислени" message
4. ✅ Summary updates (if any new transactions)
```

### Test 4: Calculation Skips Already Calculated
```
1. Calculate once
2. Note the number calculated
3. Calculate again
4. ✅ Message says "X пропуснати" (skipped)
5. ✅ No duplicate calculations created
```

---

## 💡 Key Achievements

### 1. Automatic CO2e Calculation
- **Before**: No emissions data, just financial transactions
- **After**: Full CO2e emissions breakdown by category
- **Impact**: Can now create reports and set targets!

### 2. Transparency
- **Full calculation trace** stored for every emission
- **Audit-ready** with factor sources and versions
- **"Show my math"** capability for any calculation

### 3. Smart Factor Matching
- **Keyword-based** matching for accuracy
- **Tier-aware** matching (A, B, C, D)
- **Fallback logic** ensures every transaction gets calculated

### 4. Performance
- **Batch processing** (100 transactions at once)
- **Duplicate prevention** (skip already calculated)
- **Efficient queries** with proper indexing

---

## 📈 What's Unlocked Now

With the Calculation Engine complete, you can now:

✅ **See total Scope 3 emissions** in tons CO2e  
✅ **Breakdown by category** (which categories contribute most)  
✅ **Breakdown by method** (quality of data: Tier A/B/C/D)  
✅ **Track over time** (monthly/yearly reporting periods)  
✅ **Generate reports** (coming Week 8)  
✅ **Set reduction targets** (coming Week 9)  
✅ **Create visualizations** (coming Week 6)  

---

## 🔜 Next Steps: Week 6 - Dashboard Visualization

Now that we have calculations, let's **visualize them**!

### What We'll Build
- **📊 Emissions chart** (trend over time)
- **🥧 Category pie chart** (which categories contribute most)
- **📈 Month-over-month comparison**
- **🎯 Target progress** (if targets are set)
- **🏆 Top emitters** (suppliers, categories)

### Why This Matters
- **Visual insights** are easier to understand than numbers
- **Spot trends** and anomalies quickly
- **Make decisions** based on visual data
- **Impress stakeholders** with professional dashboards

**Time to implement**: 1-2 days  
**Complexity**: Medium  

---

## 🎊 Congratulations!

You've completed **42% of the Scope 3 system**!

### Working Features:
✅ Import transactions (CSV + manual)  
✅ Auto-classify with 90+ rules  
✅ Manual classification  
✅ Edit classifications  
✅ **Calculate CO2e emissions** ⭐ NEW!  
✅ **View emission summaries** ⭐ NEW!  
✅ Delete/manage data  

### Coming Next:
🔜 Dashboard visualization  
🔜 PDF reports  
🔜 Targets & forecasting  

---

## 📚 Documentation

- `WEEKS_1-4_COMPLETE_SUMMARY.md` - Weeks 1-4 summary
- `WEEK5_CALCULATION_ENGINE.md` - This file (Week 5)
- `NEXT_STEPS_CALCULATION_REPORTING.md` - Original Week 5-9 roadmap

---

**Ready for Week 6? Let's build those beautiful dashboards!** 📊✨
