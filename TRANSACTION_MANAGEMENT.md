# 📝 Transaction Management Features

## New Features Added

### 1. **Manual Transaction Entry** ✨
Add transactions manually when you don't have CSV data.

**Use cases:**
- One-off expenses without invoices
- Emergency data entry
- Testing/demo purposes
- Missing CSV data

**How to use:**
1. Go to `/scope3/transactions`
2. Click **"Ръчно въвеждане"** button
3. Fill in the form:
   - Date * (required)
   - Supplier * (required)
   - Description (optional)
   - Amount * (required)
   - Currency * (default: EUR)
   - Expense category (optional)
   - Invoice number (optional)
4. Click **"Добави транзакция"**
5. ✅ Transaction is created and auto-classified by rules (if match found)

**Features:**
- ✅ Auto-classification with existing rules
- ✅ Currency conversion to EUR
- ✅ Badge shows "Ръчно" (Manual) in transaction list
- ✅ Same validation as CSV import
- ✅ Integrates seamlessly with classification workflow

---

### 2. **Delete Transactions** 🗑️
Delete individual transactions or entire import batches.

**Three deletion modes:**

#### A. Delete Single Transaction
1. Find transaction in table
2. Click trash icon (🗑️)
3. Confirm deletion
4. ✅ Transaction + classification deleted

#### B. Delete Multiple Transactions (Bulk)
1. Check checkboxes next to transactions
2. Click **"Изтрий (N)"** button
3. Confirm
4. ✅ All selected transactions deleted

#### C. Delete Entire Import Batch
1. Go to `/scope3/transactions?batch_id=xxx`
2. Click **"Изтрий импорт"** button
3. Confirm deletion of all transactions from batch
4. ✅ All transactions + batch record deleted

**Safety features:**
- ✅ Confirmation dialog for all delete operations
- ✅ Cascading delete (classifications are removed too)
- ✅ Company isolation (can only delete own transactions)
- ✅ Clear warning messages

---

## API Changes

### POST `/api/scope3/transactions`
**New endpoint for manual transaction creation**

**Request body:**
```json
{
  "txn_date": "2026-02-27",
  "supplier": "Lukoil",
  "description": "Fuel for company car",
  "amount": 150.00,
  "currency": "EUR",
  "expense_category_raw": "Fuel",
  "invoice_number": "INV-2026-001"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "txn_date": "2026-02-27",
    "supplier": "Lukoil",
    // ... full transaction object
  }
}
```

**Features:**
- Validates all required fields
- Converts amount to EUR (base currency)
- Auto-applies classification rules
- No import_batch_id (manual entries)

---

### DELETE `/api/scope3/transactions`
**New endpoint for deleting transactions**

**Three modes:**

1. **Delete single transaction:**
   ```
   DELETE /api/scope3/transactions?id=transaction-uuid
   ```

2. **Delete by batch:**
   ```
   DELETE /api/scope3/transactions?batch_id=batch-uuid
   ```

**Features:**
- Cascading delete (classifications removed first)
- Company isolation (RLS enforced)
- Batch deletion removes import_batch record too
- Returns count of deleted transactions

---

## UI Changes

### Transactions Page (`/scope3/transactions`)

**New buttons in header:**
- **"Ръчно въвеждане"** → Opens manual entry dialog
- **"Импортирай CSV"** → Goes to import page
- **"Изтрий импорт"** → Deletes entire batch (only visible on batch view)
- **"Изтрий (N)"** → Bulk delete selected transactions (visible when items selected)

**New column in table:**
- Checkbox column for bulk selection
- "Select all" / "Deselect all" button in table header

**New action buttons per row:**
- **👁️ Eye icon** → View transaction details
- **🗑️ Trash icon** → Delete transaction

**New badges:**
- **"Ръчно"** badge → Shows on manually entered transactions
- **"Некласифицирана"** badge → Orange outline for unclassified

**New dialogs:**
1. **Manual Entry Dialog** → Form for adding transaction
2. **Delete Confirmation** → Confirms single delete
3. **Delete Batch Confirmation** → Confirms batch delete with count

---

## Database Changes

**No schema changes required!** 

The existing schema supports these features:
- `import_batch_id` can be NULL (for manual entries)
- `transaction_classifications` has cascade delete
- RLS policies handle company isolation

---

## How It Works

### Manual Entry Flow

```
1. User clicks "Ръчно въвеждане"
   ↓
2. Dialog opens with form
   ↓
3. User fills required fields (date, supplier, amount, currency)
   ↓
4. Click "Добави транзакция"
   ↓
5. API validates data
   ↓
6. Currency converted to EUR
   ↓
7. Transaction inserted (import_batch_id = NULL)
   ↓
8. Auto-classification rules applied
   ↓
9. If rule matches → classification created
   ↓
10. Success toast + page refreshes
```

### Delete Flow

```
Single Delete:
1. User clicks trash icon
   ↓
2. Confirmation dialog
   ↓
3. DELETE request to API
   ↓
4. Delete classification (if exists)
   ↓
5. Delete transaction
   ↓
6. Success toast + page refreshes

Batch Delete:
1. User clicks "Изтрий импорт"
   ↓
2. Confirmation with count
   ↓
3. DELETE request with batch_id
   ↓
4. Get all transaction IDs from batch
   ↓
5. Delete all classifications
   ↓
6. Delete all transactions
   ↓
7. Delete import_batch record
   ↓
8. Redirect to transactions page
```

---

## Testing Guide

### Test 1: Manual Entry
```
1. Go to http://localhost:3000/scope3/transactions
2. Click "Ръчно въвеждане"
3. Fill in:
   - Date: Today
   - Supplier: "Test Supplier"
   - Amount: 100
   - Currency: EUR
4. Click "Добави транзакция"
5. ✅ Should see success toast
6. ✅ Transaction appears in table with "Ръчно" badge
7. ✅ If rules exist, might be auto-classified
```

### Test 2: Delete Single Transaction
```
1. On transactions page
2. Find any transaction
3. Click trash icon
4. Confirm deletion
5. ✅ Transaction disappears
6. ✅ Success toast shown
```

### Test 3: Bulk Delete
```
1. On transactions page
2. Check 3 transaction checkboxes
3. Click "Изтрий (3)" button
4. ✅ Button appears when selection made
5. Confirm deletion
6. ✅ All 3 transactions deleted
7. ✅ Success toast shows count
```

### Test 4: Delete Import Batch
```
1. Import a CSV (creates batch)
2. Go to transactions view for that batch
3. Click "Изтрий импорт" button
4. Confirm deletion
5. ✅ All transactions from batch deleted
6. ✅ Redirected to main transactions page
```

### Test 5: Manual Entry with Rules
```
1. Create rule: "Lukoil" → Cat 7
2. Manually add transaction:
   - Supplier: "Lukoil Bulgaria"
   - Amount: 50 EUR
3. Click "Добави транзакция"
4. ✅ Transaction created
5. ✅ Auto-classified to Cat 7
6. ✅ Classification shows "Auto-classified by rule: [name]"
```

---

## Security

### Authorization
- ✅ All endpoints check authentication
- ✅ Company ID verified for all operations
- ✅ Can only delete own transactions
- ✅ RLS policies enforce company isolation

### Validation
- ✅ Zod schema validates manual entry
- ✅ Required fields enforced
- ✅ Date format validated (YYYY-MM-DD)
- ✅ Amount must be positive
- ✅ Currency must be 3 letters

### Data Integrity
- ✅ Cascade delete (classifications removed first)
- ✅ Transaction counts in stats update correctly
- ✅ No orphaned records
- ✅ Batch deletion removes batch record

---

## User Experience

### Manual Entry
- ✅ Today's date pre-filled
- ✅ EUR as default currency
- ✅ Clear required field indicators (*)
- ✅ Helpful placeholders
- ✅ Loading state while submitting
- ✅ Success/error toasts

### Deletion
- ✅ Clear confirmation dialogs
- ✅ Shows count of items to delete
- ✅ Warning about irreversibility
- ✅ Visual feedback (toast messages)
- ✅ Immediate UI update

### Table UX
- ✅ "Ръчно" badge for manual entries
- ✅ Checkboxes for bulk operations
- ✅ Select all / Deselect all
- ✅ Delete button appears when items selected
- ✅ Trash icon per row

---

## Edge Cases Handled

### Manual Entry
- ✅ Duplicate entries allowed (no deduplication)
- ✅ Works without import_batch_id
- ✅ Auto-classification optional (works without rules)
- ✅ Currency conversion with default FX rates
- ✅ Optional fields can be left blank

### Deletion
- ✅ Can delete classified transactions (removes classification)
- ✅ Can delete transactions with locked classifications
- ✅ Can delete manual entries
- ✅ Can delete imported transactions
- ✅ Batch delete handles empty batches gracefully

### UI
- ✅ Empty state shown when no transactions
- ✅ Stats update after delete
- ✅ Checkbox selection cleared after bulk delete
- ✅ Works with filtered views (batch_id)
- ✅ Responsive on mobile

---

## Files Changed

### Created
- None (used existing endpoints, just added methods)

### Modified
- `app/api/scope3/transactions/route.ts` - Added POST and DELETE methods
- `app/(dashboard)/scope3/transactions/page.tsx` - Added UI features
- `lib/i18n/bg.ts` - Added translations

---

## Benefits

### For Users
- ✅ **Flexibility**: Can add data even without CSV
- ✅ **Control**: Can delete mistakes or test data
- ✅ **Speed**: No need to recreate CSV for one transaction
- ✅ **Safety**: Clear confirmations prevent accidents

### For System
- ✅ **Clean data**: Users can remove duplicates/errors
- ✅ **Testing**: Easier to test with manual entries
- ✅ **Maintenance**: Can clean up old imports
- ✅ **Data quality**: Remove bad data easily

---

## Known Limitations

### Manual Entry
- ⚠️ No bulk manual entry (one at a time)
- ⚠️ No edit functionality (delete + re-add)
- ⚠️ FX rates are hardcoded (not live)
- ⚠️ No file attachment support

### Deletion
- ⚠️ Irreversible (no undo)
- ⚠️ No soft delete (permanent)
- ⚠️ No audit trail (who deleted what)
- ⚠️ Can't undelete

---

## Future Enhancements

### Potential Features
- [ ] Bulk manual entry (upload smaller CSV)
- [ ] Edit transaction
- [ ] Soft delete with recycle bin
- [ ] Audit log for deletions
- [ ] Live FX rates (ECB API)
- [ ] Duplicate detection on manual entry
- [ ] Undo delete (30-day window)
- [ ] Export before delete (safety backup)

---

## Summary

**Manual Entry**: Users can now add transactions without CSV import.  
**Deletion**: Users can delete individual transactions, bulk selections, or entire import batches.

Both features are production-ready with:
- ✅ Proper validation
- ✅ Security checks
- ✅ Good UX
- ✅ Bulgarian translations
- ✅ Error handling

**Time to implement**: ~1 hour  
**Status**: ✅ Complete & tested
