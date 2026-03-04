# 🔒 Global Rules are Now Read-Only

## What Changed

Global rules (system-provided rules with "Глобално" badge) are now **read-only** for regular users:

### ❌ What You CAN'T Do with Global Rules:
- **Toggle** (enable/disable)
- **Edit** (change conditions or categories)
- **Delete**

### ✅ What You CAN Do:
- **View** global rules
- **Apply** global rules to your transactions
- **Create your own company-specific rules**

---

## Why This Change?

Global rules are **system-wide** templates that apply to all companies. They shouldn't be modified by individual users because:
1. They're carefully curated for common Bulgarian suppliers
2. Changes would affect all companies using the system
3. You can create your own rules instead

---

## How to Use

### View Global Rules
Go to: **http://localhost:3000/scope3/rules**

You'll see two types of rules:
1. **Global rules** (with blue "Глобално" badge)
   - Read-only
   - Provided by the system
   - Examples: "Lukoil → Cat 7", "Microsoft → Cat 1"
   
2. **Your company rules** (no badge)
   - Fully editable
   - Can toggle on/off
   - Can edit/delete

### Create Your Own Rules

If a global rule doesn't fit your needs:

1. Click **"Създай правило"** (Create Rule)
2. Define your custom conditions
3. Choose the right category
4. Save!

Your custom rule will:
- Override global rules (if higher priority)
- Only apply to your company
- Be fully editable

---

## Example Scenario

**Global Rule**: `Lukoil → Cat 7 (Commuting)`

**Your situation**: You want Lukoil to be classified as Cat 1 (Purchased Goods) instead.

**Solution**: Create a company-specific rule:
1. Name: "Lukoil → Purchased Goods"
2. Condition: Supplier contains "Lukoil"
3. Category: Cat 1
4. Priority: 20 (higher than global rule)
5. Save

✅ Now your rule takes precedence for your company!

---

## UI Changes

### Rules Table

**Before**:
```
| Name | Condition | Category | Status | Actions |
| Lukoil → Cat 7 | [toggle] | [edit] [delete] |
```

**After**:
```
Global Rules:
| Name [Глобално] | Condition | Category | Система | Глобално правило |

Your Rules:
| Name | Condition | Category | [toggle] | [edit] [delete] |
```

### Status Column
- **Global rules**: Shows "Система" badge (read-only indicator)
- **Your rules**: Shows toggle switch (can enable/disable)

### Actions Column
- **Global rules**: Shows "Глобално правило" (no actions available)
- **Your rules**: Shows edit and delete buttons

### Info Card
Updated to explain:
- ✅ Global rules are system-provided (read-only)
- ✅ You can create your own company rules
- ✅ Custom rules override global rules

---

## Statistics

At the top of the page, you'll see:
```
71 глобални правила от системата · 0 вашите правила · 71 активни
```

This shows:
- **71 global** system rules
- **0 company** rules (your custom rules)
- **71 active** rules total

---

## Current Global Rules

You have **71 pre-configured global rules** covering:

**Cat 7 (Commuting)**: Lukoil, OMV, Shell, Petrol, Sofia Metro, etc.
**Cat 6 (Business Travel)**: Ryanair, Hotels, Uber, etc.
**Cat 4 (Transport)**: FedEx, DHL, Speedy, Econt, etc.
**Cat 5 (Waste)**: Waste management companies
**Cat 1 (Purchased Goods)**: Microsoft, AWS, Kaufland, Vivacom, EVN, etc.

All these work automatically - no setup needed!

---

## FAQ

### Q: Can I disable a global rule?
**A**: No, but you can create a higher-priority rule that overrides it.

### Q: What if a global rule is wrong for my business?
**A**: Create your own company-specific rule with the correct classification. Use a higher priority (e.g., 20) to override the global rule.

### Q: Can admins edit global rules?
**A**: Yes, admin users can edit/delete global rules in the database if needed.

### Q: Will my custom rules work on future imports?
**A**: Yes! All rules (global + yours) apply automatically to new imports.

---

## Testing

1. **Refresh**: http://localhost:3000/scope3/rules
2. **Look for**:
   - ✅ Blue "Глобално" badges on system rules
   - ✅ "Система" in Status column (instead of toggle)
   - ✅ "Глобално правило" in Actions column (no buttons)
   - ✅ Statistics showing global vs company rules
3. **Try**:
   - ✅ Create your own rule
   - ✅ Toggle/Edit/Delete your own rule (should work!)
   - ✅ Apply all rules (should work!)

---

## Summary

✅ **Global rules are now read-only** (no more errors!)
✅ **You can create custom rules** for your company
✅ **UI clearly shows** which rules are editable
✅ **Statistics show** breakdown of rule types
✅ **Apply rules still works** for all rules

---

**No more 403 errors!** 🎉
