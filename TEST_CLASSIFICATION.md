# 🧪 Test Classification Feature - Quick Guide

## Prerequisites ✅
1. Database migrations applied (Weeks 1-2)
2. Test transactions imported
3. Dev server running: `npm run dev`

---

## 🎯 Test Scenario 1: Single Classification

### Step 1: Navigate to Classification
```
URL: http://localhost:3000/scope3/classify
```

### Step 2: You should see:
- ✅ Orange alert banner: "Класифицирайте транзакциите"
- ✅ Table with your imported transactions
- ✅ Three tabs: Некласифицирани | Класифицирани | Топ доставчици

### Step 3: Classify a Transaction
1. Find a transaction (e.g., airline, train, fuel)
2. Click "Класифицирай" button on the row
3. Dialog opens

### Step 4: In the Classification Dialog
1. **Select Category**: Click on one of these:
   - 🛒 **Кат. 1**: Закупени стоки и услуги (for purchases)
   - ✈️ **Кат. 6**: Бизнес пътувания (for flights, hotels)
   - 🚗 **Кат. 7**: Пътуване на служители (for commute, fuel)
   - 🚚 **Кат. 4**: Транспорт (for shipping)
   - ♻️ **Кат. 5**: Отпадъци (for waste)

2. **Method Tier**: Leave as "Ниво C" (default for spend-based)

3. **Notes** (optional): Add "Тест класификация"

4. **Create Rule** (optional): Check this box
   - Will auto-classify future transactions from same supplier

5. **Lock** (optional): Check to prevent auto-changes

6. Click **"Класифицирай"** button

### Step 5: Verify Success
- ✅ Green toast: "Транзакцията е класифицирана успешно"
- ✅ Transaction disappears from "Некласифицирани" tab
- ✅ Click "Класифицирани" tab → transaction appears there
- ✅ Badge shows category (e.g., "Кат. 6: Бизнес пътувания")
- ✅ Method tier shows "Ниво C"
- ✅ Lock icon if you locked it

---

## 🎯 Test Scenario 2: Bulk Classification

### Step 1: Select Multiple Transactions
1. Stay on "Некласифицирани" tab
2. Click checkboxes next to 3-5 transactions
3. Or click "Маркирай всички" button

### Step 2: Bulk Classify Button Appears
- ✅ Top-right shows: "Класифицирай (5)" button
- ✅ Button is green/earth color

### Step 3: Click Bulk Classify
1. Bulk classification dialog opens
2. Select a category (e.g., 🚗 Cat 7 for fuel transactions)
3. Click "Класифицирай всички"

### Step 4: Verify Success
- ✅ Toast: "5 транзакции класифицирани успешно"
- ✅ All selected transactions disappear from unclassified
- ✅ Selection cleared
- ✅ Check "Класифицирани" tab → all 5 are there

---

## 🎯 Test Scenario 3: Top Suppliers View

### Step 1: Click "Топ доставчици" Tab
Should see:
- ✅ Table sorted by spend (highest at top)
- ✅ Columns: Supplier | Total Spend | Transactions | Classified | Progress
- ✅ EUR amounts formatted: "1,234 EUR"

### Step 2: Check Progress Bars
- ✅ Each supplier shows progress: "2 / 5" with visual bar
- ✅ Percentage shown: "40%"
- ✅ If 100% classified, bar is green + "default" badge

### Step 3: Interpret the Data
**Example Row**:
```
Lukoil    →    2,456 EUR    →    8 transactions    →    3 / 8    →    [███░░░░░] 38%
```

This tells you:
- Lukoil has €2,456 total spend (high priority)
- 8 transactions total
- Only 3 are classified (5 remaining)
- 38% complete → focus here to maximize impact!

---

## 🎯 Test Scenario 4: Create Rule

### Step 1: Classify with Rule Creation
1. Go to "Некласифицирани" tab
2. Click "Класифицирай" on a transaction from supplier "OMV" (or any supplier)
3. Select category: 🚗 Cat 7
4. ✅ Check "Създай правило"
5. Rule name auto-filled: "Правило за OMV"
6. Click "Класифицирай"

### Step 2: Verify Rule Created
1. Success toast appears
2. Check database (optional):
```sql
SELECT * FROM classification_rules WHERE company_id = 'your-company-id';
```

### Step 3: Test Rule on Future Import
1. Import another CSV with more OMV transactions
2. Go to classification page
3. ✅ New OMV transactions should NOT appear in unclassified
4. ✅ They should already be in "Класифицирани" tab
5. ✅ Badge shows Cat 7 automatically

---

## 🎯 Test Scenario 5: Edit Existing Classification

### Step 1: Go to "Класифицирани" Tab
(In current version, we don't have edit button yet - that's Week 4)

For now:
- ✅ You can reclassify by going back to API
- ✅ Or re-import and classify differently

---

## 🔍 Troubleshooting

### Issue: "Unauthorized" Error
**Fix**: Make sure you're logged in
```
1. Go to http://localhost:3000/login
2. Sign in with test user
3. Try again
```

### Issue: No Transactions Showing
**Fix**: Import test data first
```
1. Go to http://localhost:3000/scope3/import
2. Upload test_transactions.csv
3. Import successfully
4. Go back to classify page
```

### Issue: Checkbox Component Error
**Fix**: Checkbox component not installed
```bash
npx shadcn@latest add checkbox
```

### Issue: Blank Category Selector
**Check**: Make sure `SCOPE3_CATEGORIES` array is rendering
- Should see 5 category buttons with icons
- If not, check browser console for errors

### Issue: "Failed to fetch"
**Fix**: API route might have error
```bash
# Check terminal for errors
# Restart dev server:
npm run dev
```

---

## ✅ Expected Results Summary

After testing all scenarios:

| Feature | Expected Result |
|---------|----------------|
| Unclassified tab | Shows imported transactions without classification |
| Single classify | Dialog opens, category selected, saves successfully |
| Bulk classify | Multiple transactions classified at once |
| Top suppliers | Suppliers sorted by spend with progress bars |
| Create rule | Rule saved, future imports auto-classified |
| Classified tab | Shows all classified transactions with badges |
| Progress tracking | Visual bars show % completion |
| Empty states | Helpful messages when no data |

---

## 📊 Success Criteria

✅ **Week 3 Classification Complete If**:
1. Can view unclassified transactions ✅
2. Can classify single transaction ✅
3. Can bulk classify multiple transactions ✅
4. Can create rule from classification ✅
5. Can lock classification ✅
6. Can view top suppliers by spend ✅
7. Can track progress (X / Y classified) ✅
8. UI is beautiful and matches design system ✅
9. No console errors ✅
10. Toasts show success/error messages ✅

---

## 🎉 All Tests Pass?

**Congratulations!** Classification engine is working. 

**Next**: Week 4 - Auto-Classification Rules Engine 🚀

---

## 📸 What Success Looks Like

### Unclassified Tab (Before)
- Orange banner prompts action
- Table shows all unimported transactions
- Checkboxes for bulk selection
- "Класифицирай" button on each row

### Classification Dialog
- 5 category buttons with icons
- Method tier dropdown
- Notes textarea
- "Create rule" checkbox
- "Lock" checkbox

### Classified Tab (After)
- Green badges show categories
- Method tier badges
- Lock icons where applicable
- No orange banner (all done!)

### Top Suppliers
- Lukoil: €2,456 → 8 txns → [███████░░] 75%
- OMV: €1,234 → 5 txns → [████░░░░░] 40%
- Ryanair: €890 → 2 txns → [██████████] 100% ✅

---

**Ready to test?** Start with Scenario 1! 🚀
