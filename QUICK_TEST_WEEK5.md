# 🧪 Quick Test Guide - Week 5 Calculation Engine

## ✅ What We Just Built

1. **Edit classifications** from classify page (blue tag icon)
2. **Calculate CO2e emissions** from classified transactions
3. **View calculation summary** with totals and breakdown

---

## 🎯 Quick Test Steps

### Test 1: Edit Classification from Classify Page
```
1. Go to: http://localhost:3000/scope3/classify
2. Click "Classified" tab
3. Find any classified transaction
4. Click the blue tag icon (🏷️) in the "Actions" column
5. ✅ Dialog opens with current classification pre-filled
6. Change the category
7. Click "Актуализирай"
8. ✅ Success! Classification updated
```

### Test 2: Calculate Emissions
```
1. Go to: http://localhost:3000/scope3/transactions
2. Make sure you have some classified transactions
3. Click green "Изчисли емисии" button (top right)
4. ✅ Wait for success toast
5. ✅ Green summary card appears showing:
   - Total emissions (tons CO2e)
   - Number of calculations
   - Coverage percentage
   - Breakdown by category
```

### Test 3: View Calculation Summary
```
1. After calculating, check the green summary card
2. ✅ Shows total like "12.5 тона CO2e"
3. ✅ Shows category breakdown (Cat 1, Cat 6, Cat 7, etc.)
4. ✅ Each category shows its emissions
5. ✅ "Recalculate" button in top right
```

### Test 4: Recalculate
```
1. Click "Преизчисли" in the summary card
2. ✅ Shows "Всички транзакции вече са изчислени"
3. ✅ (Unless you added new transactions)
```

---

## 📊 What You Should See

### Before Calculation
```
Transactions page:
- 4 stat cards (Total, Amount, Classified, Unclassified)
- Orange alert if unclassified transactions exist
- Green "Изчисли емисии" button
- Transaction list
```

### After Calculation
```
Transactions page:
- 4 stat cards (same as before)
- ✅ NEW: Green gradient summary card with:
  ┌────────────────────────────────────┐
  │ 🌿 Изчислени емисии   🧮 Преизчисли │
  │                                     │
  │  12.5           145        100%     │
  │  тона CO2e   транзакции             │
  │                                     │
  │  По категория:                      │
  │  [Кат. 1: 8.2т] [Кат. 6: 2.1т] ... │
  └────────────────────────────────────┘
- Transaction list (same)
```

---

## 🔧 Technical Details

### New API Endpoint
- `POST /api/scope3/calculate` - Calculate emissions
- `GET /api/scope3/calculate` - Get summary

### How It Works
```
1. Fetch classified transactions
2. For each transaction:
   - Find matching emission factor (by category + tier)
   - Calculate: Amount × Factor = CO2e
   - Store in calculated_emissions table
3. Return summary with totals
```

### Example Calculation
```
Transaction: Lukoil - 77 EUR
Classification: Cat 7 (Commuting), Tier C
Emission Factor: 0.28 kg CO2e per EUR
Calculation: 77 × 0.28 = 21.56 kg CO2e
```

---

## 🎯 Expected Results

### If Everything Works
✅ No TypeScript errors  
✅ Calculate button appears (green)  
✅ Click calculate → success toast  
✅ Summary card appears (green gradient)  
✅ Shows total tons CO2e  
✅ Shows breakdown by category  
✅ Recalculate button works  

### Common Issues & Fixes

**Issue**: "No emission factors found"
- **Fix**: Make sure you ran `20250227000002_seed_scope3_factors.sql`

**Issue**: "Грешка при изчисление"
- **Fix**: Check browser console for details
- **Fix**: Make sure transactions are classified first

**Issue**: Calculate button grayed out
- **Fix**: It's calculating, wait for toast

**Issue**: No summary card appears
- **Fix**: Make sure calculation succeeded
- **Fix**: Refresh the page

---

## 📈 Progress Tracker

| Feature | Status | Test Result |
|---------|--------|-------------|
| Edit classification from classify page | ✅ Added | ⏳ Test now |
| Calculate button | ✅ Added | ⏳ Test now |
| Calculation API | ✅ Created | ⏳ Test now |
| Summary card | ✅ Added | ⏳ Test now |
| Category breakdown | ✅ Added | ⏳ Test now |
| Recalculate | ✅ Added | ⏳ Test now |

---

## 🎉 You're Ready to Test!

1. **Open**: http://localhost:3000/scope3/transactions
2. **Click**: Green "Изчисли емисии" button
3. **Watch**: The magic happen! ✨

---

**Questions? Issues? Let me know and I'll help debug!** 🚀
