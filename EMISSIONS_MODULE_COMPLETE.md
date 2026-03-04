# Emissions Data Entry Module - COMPLETE ✅

## 🎉 What We Built

A complete emissions data entry and tracking system for Scope 1 & 2 carbon footprint management, following the GHG Protocol methodology.

---

## 📄 Pages Created

### 1. Data Entry Form (`/data-entry`)
**File**: `app/(dashboard)/data-entry/page.tsx`

**Features**:
- ✅ **Tab interface** for Scope 1 & 2 selection
- ✅ **Category dropdowns** with Bulgarian labels:
  - **Scope 1**: Vehicles (diesel/petrol/LPG), Natural gas, Heating oil, Coal, Refrigerants
  - **Scope 2**: Electricity, District heating, District cooling
- ✅ **Auto-populated units** based on category selection
- ✅ **Monthly reporting periods** (YYYY-MM format)
- ✅ **Activity value input** with validation
- ✅ **Notes field** for additional context
- ✅ **Help card** with usage tips
- ✅ **Automatic CO2e calculation** on submission
- ✅ **Success notification** showing calculated emissions

**URL**: `http://localhost:3000/data-entry`

---

### 2. Emissions List Page (`/data-entry/list`)
**File**: `app/(dashboard)/data-entry/list/page.tsx`

**Features**:
- ✅ **Statistics cards** showing:
  - Total emissions (tCO2e)
  - Scope 1 total
  - Scope 2 total
- ✅ **Data table** with columns:
  - Reporting period (formatted in Bulgarian)
  - Scope badge (color-coded)
  - Category name (Bulgarian labels)
  - Activity quantity with units
  - Calculated CO2e
  - Notes
- ✅ **Scope filter** dropdown (All/Scope 1/Scope 2)
- ✅ **Summary card** with aggregate statistics
- ✅ **Empty state** with call-to-action
- ✅ **Link to add new emissions**

**URL**: `http://localhost:3000/data-entry/list`

---

### 3. Enhanced Dashboard (`/dashboard`)
**File**: `app/(dashboard)/dashboard/page.tsx`

**Updates**:
- ✅ **Real-time emission totals** from database
- ✅ **Scope 1 total** card
- ✅ **Scope 2 total** card
- ✅ **Total emissions** card
- ✅ **Dynamic data** updates on page load

**URL**: `http://localhost:3000/dashboard`

---

## 🔌 API Routes

### Emissions API (`/api/emissions`)
**File**: `app/api/emissions/route.ts`

**Endpoints**:

#### POST - Create Emission Record
- ✅ **Authentication check** (must be logged in)
- ✅ **Company validation** (user must have company_id)
- ✅ **Input validation** with Zod schema
- ✅ **Automatic CO2e calculation** using emission factors
- ✅ **Bulgarian/EU emission factors** (DEFRA 2023, Bulgarian Energy Agency)
- ✅ **GWP calculation** for refrigerants
- ✅ **Stores to database** with audit trail

**Request Body**:
```json
{
  "scope": 1,
  "category": "vehicles_diesel",
  "activity_value": 150.5,
  "unit": "литри",
  "reporting_period": "2025-10",
  "notes": "Месечна консумация"
}
```

**Response**:
```json
{
  "data": {
    "id": "uuid",
    "calculated_co2e": 0.403,
    ...
  },
  "calculation": {
    "activity_value": 150.5,
    "emission_factor": 2.68,
    "gwp": 1,
    "calculated_co2e_kg": 403.34,
    "calculated_co2e_tons": 0.403
  }
}
```

#### GET - List Emission Records
- ✅ **Filter by scope** (`?scope=1`)
- ✅ **Filter by period** (`?period=2025-10`)
- ✅ **Sorted by date** (newest first)
- ✅ **Company isolation** (users see only their company data)
- ✅ **Admin access** (admins see all data)

---

## 🧮 Calculation Engine

### Formula
```
CO2e (kg) = Activity Value × Emission Factor × GWP
CO2e (tons) = CO2e (kg) / 1000
```

### Emission Factors (Bulgaria/EU)

#### Scope 1 - Vehicles
| Fuel Type | Factor (kgCO2e/liter) |
|-----------|----------------------|
| Diesel    | 2.68                |
| Petrol    | 2.31                |
| LPG       | 1.67                |

#### Scope 1 - Fuels
| Fuel Type      | Factor (kgCO2e/unit) |
|----------------|---------------------|
| Natural Gas    | 2.02 per m³        |
| Heating Oil    | 3.18 per liter     |
| Coal           | 2.42 per kg        |

#### Scope 1 - Refrigerants (with GWP)
| Refrigerant | GWP100  | Calculation |
|-------------|---------|-------------|
| R-134a      | 1,430   | kg × 1,430  |
| R-404A      | 3,922   | kg × 3,922  |

#### Scope 2 - Energy
| Energy Type       | Factor (kgCO2e/kWh) |
|-------------------|---------------------|
| Electricity       | 0.505 (Bulgaria grid) |
| District Heating  | 0.220              |
| District Cooling  | 0.185              |

**Sources**: DEFRA 2023, Bulgarian Energy Agency, IPCC AR6

---

## 🗄️ Database Schema

### Emissions Table (`emission_data`)
```sql
- id (UUID)
- company_id (UUID, references companies)
- reporting_period (DATE)
- scope (INTEGER: 1 or 2)
- category (TEXT)
- activity_value (NUMERIC)
- unit (TEXT)
- emission_factor (NUMERIC)
- calculated_co2e (NUMERIC, in metric tons)
- data_source (TEXT: 'manual', 'import', 'ocr', 'api')
- validation_status (TEXT)
- notes (TEXT)
- uploaded_by (UUID, references users)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

---

## 🎨 UI Features

### Design Elements
- ✅ **Tabbed interface** for Scope selection
- ✅ **Color-coded badges** (Scope 1: green, Scope 2: blue)
- ✅ **Auto-populated fields** (units based on category)
- ✅ **Month picker** for reporting periods
- ✅ **Number formatting** (Bulgarian locale)
- ✅ **Loading states** with spinners
- ✅ **Toast notifications** for success/error
- ✅ **Help cards** with usage tips
- ✅ **Statistics cards** with totals
- ✅ **Empty states** with call-to-action
- ✅ **Responsive design** (mobile-first)

### Bulgarian Language
- ✅ All labels in Bulgarian
- ✅ Category names translated
- ✅ Date formatting (Bulgarian locale)
- ✅ Number formatting (Bulgarian locale)
- ✅ Error messages in Bulgarian
- ✅ Help text in Bulgarian

---

## 🚀 Complete User Workflows

### Workflow 1: Add Emission Data
```
1. Login → Dashboard
2. Click "Въвеждане" in navigation
3. Select Scope (1 or 2)
4. Choose category from dropdown
   → Unit auto-fills
5. Enter activity value (quantity)
6. Select reporting period (month/year)
7. Add notes (optional)
8. Click "Запази данни"
9. ✅ Success! Shows calculated CO2e
10. Redirected or form resets for next entry
```

### Workflow 2: View Emissions
```
1. Go to /data-entry/list
2. See statistics cards (total, scope 1, scope 2)
3. View table with all records
4. Use scope filter if needed
5. See summary card with aggregates
```

### Workflow 3: Dashboard Overview
```
1. Login → Dashboard
2. See real-time totals:
   - Total emissions
   - Scope 1
   - Scope 2
3. All values calculated from actual data
```

---

## 🧪 Testing Guide

### Test 1: Add Scope 1 Emission (Vehicles)
1. Go to `/data-entry`
2. Ensure "Обхват 1" tab is selected
3. Select "Превозни средства - Дизел"
4. Enter activity value: `100`
5. Unit should show: `литри`
6. Select current month
7. Add note: "Test vehicle fuel"
8. Click "Запази данни"
9. ✅ Success toast should show: "...CO2e: 0.27 тона"
10. ✅ Form should reset

**Expected Calculation:**
- 100 liters × 2.68 kgCO2e/liter = 268 kg = 0.268 tons

### Test 2: Add Scope 2 Emission (Electricity)
1. Click "Обхват 2" tab
2. Select "Електроенергия"
3. Enter: `1000` kWh
4. Click "Запази данни"
5. ✅ Should show: "...CO2e: 0.51 тона"

**Expected Calculation:**
- 1000 kWh × 0.505 kgCO2e/kWh = 505 kg = 0.505 tons

### Test 3: Add Refrigerant (with GWP)
1. Select "Обхват 1" tab
2. Choose "Хладилен агент R-134a"
3. Enter: `1` kg
4. Click "Запази данни"
5. ✅ Should show: "...CO2e: 1.43 тона"

**Expected Calculation:**
- 1 kg × 1 × 1430 GWP = 1430 kg = 1.43 tons

### Test 4: View Emissions List
1. Add 3-4 different emissions
2. Go to `/data-entry/list`
3. ✅ Should show all records in table
4. ✅ Statistics cards should show correct totals
5. ✅ Summary card should show aggregates

### Test 5: Filter by Scope
1. In emissions list, use scope filter
2. Select "Обхват 1"
3. ✅ Table should show only Scope 1 records
4. ✅ Statistics should recalculate

### Test 6: Dashboard Updates
1. Add some emissions
2. Go to `/dashboard`
3. ✅ Total emissions should reflect real data
4. ✅ Scope 1 and 2 cards should show correct totals

---

## 📝 Files Created

```
app/
├── (dashboard)/
│   ├── data-entry/
│   │   ├── page.tsx              ⭐ NEW - Data entry form
│   │   └── list/
│   │       └── page.tsx          ⭐ NEW - Emissions list
│   ├── dashboard/
│   │   └── page.tsx              📝 UPDATED - Real totals
│   └── layout.tsx                📝 UPDATED - Added navigation link
├── api/
│   └── emissions/
│       └── route.ts              ⭐ NEW - POST/GET endpoints
```

---

## ✅ Features Complete

### Data Entry
- [x] Scope 1 & 2 category selection
- [x] 11 emission categories (8 Scope 1, 3 Scope 2)
- [x] Activity value input with validation
- [x] Monthly reporting periods
- [x] Notes field
- [x] Bulgarian language throughout

### Calculations
- [x] Automatic CO2e calculation
- [x] Bulgarian/EU emission factors
- [x] GWP calculation for refrigerants
- [x] Conversion to metric tons
- [x] Calculation transparency

### Data Management
- [x] Store emissions in database
- [x] Company isolation (RLS)
- [x] Audit trail (uploaded_by, timestamps)
- [x] List all emissions
- [x] Filter by scope/period
- [x] Statistics and aggregates

### Dashboard
- [x] Real-time emission totals
- [x] Scope 1 breakdown
- [x] Scope 2 breakdown
- [x] Dynamic updates

### UI/UX
- [x] Tabbed interface
- [x] Category-specific units
- [x] Loading states
- [x] Toast notifications
- [x] Help cards
- [x] Empty states
- [x] Responsive design
- [x] Bulgarian formatting

---

## 🎯 MVP Status

### ✅ COMPLETED (from PRD)
- [x] Manual data entry for Scope 1 & 2
- [x] Vehicles (fuel types)
- [x] On-site fuel combustion
- [x] Refrigerants with GWP
- [x] Electricity consumption
- [x] District heating/cooling
- [x] Calculation engine (GHG Protocol compliant)
- [x] Bulgarian/EU emission factors
- [x] Dashboard with totals
- [x] Validation (positive numbers, required fields)
- [x] Single location support (MVP scope)
- [x] Bulgarian language interface

### ❌ NOT IN MVP (Future Phases)
- [ ] Excel/CSV import (Phase 2)
- [ ] PDF OCR processing (Phase 2)
- [ ] Period-over-period alerts (Phase 2)
- [ ] Multi-location support (Phase 2)
- [ ] Scope 3 emissions (Future)
- [ ] AI strategy generation (Phase 2)
- [ ] Reports generation (Next step)

---

## 🔄 Next Recommended Steps

Now that emissions data entry is complete, you can:

1. **Reports Module** ⭐ (High priority)
   - Generate compliance reports
   - PDF export
   - CSRD-aligned formatting
   
2. **Charts & Visualizations**
   - Line chart (trend over time)
   - Donut chart (Scope 1 vs 2)
   - Bar chart (by category)
   
3. **Excel/CSV Import**
   - Template download
   - File upload
   - Data validation
   
4. **User Management**
   - Invite users
   - Assign to companies
   - Role management

---

## 🎉 Success!

You now have a **production-ready emissions data entry system** with:
- ✅ Complete data entry forms (Scope 1 & 2)
- ✅ Automatic CO2e calculations
- ✅ Bulgarian/EU emission factors
- ✅ GHG Protocol compliant
- ✅ Data list and filtering
- ✅ Dashboard integration
- ✅ Bulgarian language throughout
- ✅ Beautiful, intuitive UI
- ✅ Proper validation and error handling

**This is the CORE of your carbon footprint app!** 🌱

---

**Status**: ✅ **COMPLETE AND READY FOR TESTING**  
**Date**: 2025-10-08  
**Module**: Emissions Data Entry (Scope 1 & 2)


