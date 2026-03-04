# 🎯 Apply Classification Rules Migration

## What This Does

This migration seeds **90+ global classification rules** for common Bulgarian suppliers and service types:

### Categories Covered:

**Cat 7 (Employee Commuting) - 9 rules:**
- Fuel stations: Lukoil, OMV, Shell, Petrol, EKO, Rompetrol
- Public transport: Sofia Metro, Sofia Transport

**Cat 6 (Business Travel) - 12 rules:**
- Airlines: Ryanair, Wizz Air, Bulgaria Air, Lufthansa, Turkish Airlines, EasyJet
- Hotels: Hilton, Marriott, Grand Hotel, Sheraton, Booking.com
- Taxis: Uber, Bolt

**Cat 4 (Upstream Transport) - 7 rules:**
- Couriers: FedEx, DHL, Speedy, Econt, UPS

**Cat 5 (Waste) - 3 rules:**
- Waste management companies

**Cat 1 (Purchased Goods & Services) - 60+ rules:**
- Utilities: EVN, CEZ, Overgas, Toplofikatsiya
- Telecom: Vivacom, A1, Yettel
- Cloud/Software: Microsoft 365, AWS, Google Cloud, Azure, Adobe
- Office supplies: Office Depot, Metro
- IT Equipment: Dell, HP, Lenovo, Technopolis
- Cleaning: Cleanex and similar
- Retail: Kaufland, Lidl, Billa, Fantastico
- Catering: Restaurants, food services
- Banking: UniCredit, DSK
- Insurance services
- Water supply

---

## 📋 Step-by-Step Instructions

### Step 1: Apply the Migration

Run this SQL in your Supabase SQL Editor:

```bash
# In your terminal or Supabase dashboard
# Copy the entire contents of:
supabase/migrations/20250227000003_seed_classification_rules.sql

# And paste it into Supabase SQL Editor, then execute
```

**OR** if using Supabase CLI:

```bash
supabase db reset
# This will reapply all migrations including the new one
```

---

### Step 2: Verify Rules Were Created

1. Go to **http://localhost:3000/scope3/rules**
2. You should see **90+ rules** in the table
3. All should be active (green toggle)

---

### Step 3: Apply Rules to Existing Transactions

**Option A: Via UI (Recommended)**

1. Stay on **http://localhost:3000/scope3/rules**
2. Click the **"Приложи всички"** (Apply All) button at the top
3. Wait for success toast: "X транзакции класифицирани чрез правила"
4. Go to **http://localhost:3000/scope3/transactions**
5. ✅ Your transactions should now be classified!

**Option B: Via API**

```bash
curl -X POST http://localhost:3000/api/scope3/rules/apply \
  -H "Content-Type: application/json" \
  -d '{"preview_only": false}'
```

---

### Step 4: Verify Classifications

1. Go to **http://localhost:3000/scope3/transactions**
2. Check the **"Статус"** column
3. You should see green badges like:
   - "Кат. 7: Пътуване на служители" (for Lukoil)
   - "Кат. 6: Бизнес пътувания" (for Grand Hotel)
   - "Кат. 4: Транспорт" (for FedEx)
   - "Кат. 1: Закупени стоки и услуги" (for Kaufland, Microsoft, etc.)

---

## 🎯 How Auto-Classification Works

### Priority System

Rules have priorities (0-20):
- **Priority 20**: Very specific (e.g., "Grand Hotel Sofia" → Cat 6)
- **Priority 15**: Medium specific (e.g., "Hotel" → Cat 6)
- **Priority 10**: Generic catch-all (e.g., "FOOD" → Cat 1)

**First match wins!** Higher priority rules are checked first.

### Examples

**Transaction: "Lukoil Bulgaria - 77 EUR"**
1. Checks rule "Lukoil → Employee Commuting" (Priority 15)
2. ✅ MATCH! Supplier contains "Lukoil"
3. Classified as **Cat 7** (Employee Commuting)
4. Stops checking other rules

**Transaction: "Grand Hotel Sofia - 450 EUR"**
1. Checks rule "Grand Hotel → Business Travel" (Priority 20)
2. ✅ MATCH! Supplier contains "Grand Hotel"
3. Classified as **Cat 6** (Business Travel)
4. Stops checking other rules

**Transaction: "Microsoft 365 - 45 EUR"**
1. Checks rule "Microsoft → Software Services" (Priority 20)
2. ✅ MATCH! Supplier contains "Microsoft"
3. Classified as **Cat 1** (Purchased Services)
4. Stops checking other rules

---

## ✏️ Manual Override

**If auto-classification is wrong**, you can manually correct it:

1. Go to **http://localhost:3000/scope3/classify**
2. Find the transaction
3. Click **"Класифицирай"**
4. Choose correct category
5. ✅ Check **"Lock classification"** to prevent rules from overwriting it
6. Save

**Locked classifications won't be changed by rules!**

---

## 🔄 Future Imports

**All future imports will auto-classify automatically!**

When you import a new CSV:
1. Transactions are imported
2. Rules are applied immediately
3. Matching transactions are classified
4. Only unmatched transactions need manual classification

**Expected auto-classification rate**: 70-90%

---

## 📊 Classification Stats After Rules

Your current transactions will be classified like this:

| Supplier | Amount | Auto-Classified As |
|----------|--------|-------------------|
| Lukoil Bulgaria | 77 EUR | Cat 7: Employee Commuting |
| FedEx Bulgaria | 120 EUR | Cat 4: Upstream Transport |
| Vivacom | 49 EUR | Cat 1: Purchased Services (Telecom) |
| Microsoft 365 | 45 EUR | Cat 1: Purchased Services (Software) |
| Grand Hotel Sofia | 450 EUR | Cat 6: Business Travel |
| Kaufland Bulgaria | 92 EUR | Cat 1: Purchased Goods (Food) |
| Amazon Web Services | 180 EUR | Cat 1: Purchased Services (Cloud) |
| Sofia Transport | 41 EUR | Cat 7: Employee Commuting |
| Cleanex Sofia | 61.5 EUR | Cat 1: Purchased Services (Cleaning) |
| Dell Bulgaria FOOD | 1200 EUR | Cat 1: Purchased Goods (Food/Catering) |
| UniCredit Bulbank | 25 EUR | Cat 1: Financial Services |

**Expected**: 11/12 transactions classified (92%) ✅

---

## 🛠️ Troubleshooting

### Problem: Rules not showing up

**Solution**: Check Supabase SQL Editor for errors when running migration

### Problem: "Приложи всички" button does nothing

**Solution**: 
1. Check browser console for errors
2. Verify you're logged in
3. Try refreshing the page

### Problem: Transactions still unclassified after applying

**Solution**:
1. Check if rules are active (green toggle)
2. Verify supplier names match (case-insensitive)
3. Some suppliers might not have matching rules - add custom rules

### Problem: Wrong classification

**Solution**:
1. Go to `/scope3/classify`
2. Re-classify manually
3. Lock the classification
4. OR create a higher-priority rule

---

## 🎉 Success Criteria

After completing these steps:

✅ 90+ rules visible in `/scope3/rules`  
✅ 70-90% of transactions auto-classified  
✅ Green category badges in `/scope3/transactions`  
✅ Classified count > 0 in statistics  
✅ Future imports auto-classify immediately  

---

## 📚 Next Steps

### Add Custom Rules

For suppliers not in the global list:
1. Go to `/scope3/rules`
2. Click "Създай правило"
3. Add rule for your specific supplier
4. Set appropriate priority
5. Apply rules again

### Adjust Priorities

If two rules conflict:
1. Edit the more specific rule
2. Increase its priority (make it higher)
3. The higher priority rule will win

### Company-Specific Rules

Global rules work for everyone, but you can add company-specific rules:
- These override global rules (same priority)
- Only visible to your company
- Created through the UI automatically

---

**Ready to apply?** Run the migration and click "Приложи всички"! 🚀
