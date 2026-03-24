# MANIFEST: Dynamic Category Validation Fix

**Date:** March 24, 2026  
**Issue:** `Invalid category. Must be one of: 🤖 AI & Data Labeling, ...` error after paying to post a task  
**Root Cause:** Backend category validation used hardcoded static list that could diverge from database state

---

## Problem Diagnosis

### The Category Validation Error Flow:

1. **User selects category** in the employer form (e.g., "🤖 AI & Data Labeling")
2. **User completes payment** in Pi Browser
3. **Frontend sends task creation request** with the selected category string
4. **Backend validates category** against a hardcoded list
5. **Validation fails** with error: `Invalid category. Must be one of: ...`
6. **Payment already deducted** but task creation fails

### Root Cause Analysis:

The issue occurred due to a **hardcoded vs. dynamic data mismatch**:

**Frontend** (`employer/page.tsx`):
- Fetches categories from `/api/categories` (database)
- Constructs category strings as: `"${emoji} ${name}"`
- Example: "🤖 AI & Data Labeling"

**Backend** (`/api/tasks`):
- Had a **hardcoded static list**:
  ```ts
  const VALID_CATEGORIES = [
    '🤖 AI & Data Labeling',
    '📍 Local Verification',
    '🌐 Translation',
    '📱 App Testing',
    '✍️ Community & Content',
  ]
  ```
- Validated incoming category against this static list

**Why It Failed:**
- If database categories were modified or didn't exactly match hardcoded list
- Different emoji encoding or formatting
- Database had alternative category names
- Any divergence = validation failure even though category existed in database

---

## Solution Implemented

### Dynamic Category Validation

**File Modified:** `src/app/api/tasks/route.ts`

#### Changes:

1. **Renamed hardcoded list to fallback**:
   ```ts
   const FALLBACK_CATEGORIES = [
     '🤖 AI & Data Labeling',
     // ... other categories
   ]
   ```

2. **Added helper function** `getValidCategories()`:
   ```ts
   async function getValidCategories(): Promise<string[]> {
     try {
       // Query active categories from database
       const { data, error } = await supabaseAdmin
         .from('Category')
         .select('emoji, name')
         .eq('isActive', true)
         .order('sortOrder', { ascending: true })

       if (error || !data?.length) {
         // Fallback to hardcoded list
         return FALLBACK_CATEGORIES as unknown as string[]
       }

       // Construct full category strings matching frontend format
       return data.map(cat => `${cat.emoji} ${cat.name}`)
     } catch (err) {
       return FALLBACK_CATEGORIES as unknown as string[]
     }
   }
   ```

3. **Updated task validation** (line ~180):
   ```ts
   // Before:
   if (!VALID_CATEGORIES.includes(category)) { error }

   // After:
   const validCategories = await getValidCategories()
   if (!validCategories.includes(category as string)) { error }
   ```

#### Why This Works:

- ✅ **Database-driven**: Validation always reflects actual database state
- ✅ **Format matching**: Constructs strings exactly as frontend does (`emoji + name`)
- ✅ **Resilient**: Falls back to hardcoded list if database fetch fails
- ✅ **Real-time**: Any category changes in database are immediately valid
- ✅ **No more divergence**: Backend and database always in sync

---

## How It Solves the Problem

**Before Fix:**
```
User selects "🤖 AI & Data Labeling" from DB
Frontend sends it to /api/tasks
Backend checks hardcoded VALID_CATEGORIES
If DB category ≠ hardcoded list → Error ✗
Payment recorded, task creation fails ✗
```

**After Fix:**
```
User selects "🤖 AI & Data Labeling" from DB
Frontend sends it to /api/tasks
Backend queries categories FROM DATABASE
Fetches emoji, name, constructs "🤖 AI & Data Labeling"
Checks if user's category is in live database list
If found → Task created ✓
If not found → Error with current database list ✓
```

---

## Testing Checklist

- [ ] Navigate to /employer page
- [ ] Select any category from the dropdown
- [ ] Fill out task form and review
- [ ] Initiate payment
- [ ] Complete Pi payment in Pi Browser
- [ ] ✓ Task should create successfully without "Invalid category" error
- [ ] Even if database categories differ from original hardcoded list
- [ ] Payment is recorded (txid shown in success message)

---

## Prevention & Best Practices

**What this teaches us:**

1. **Avoid hardcoded validation lists** when data comes from a database
2. **Always validate against source of truth** (database in this case)
3. **Keep frontend and backend in sync** by using the same data source
4. **Provide fallbacks** for resilience when database is unavailable
5. **Test with non-standard data** - what happens if categories are modified?

**Going Forward:**

- If you need to update task categories, do it in the admin panel (`/admin/categories`)
- Backend will automatically accept any active category from the database
- No need to update hardcoded lists in multiple places

---

## Files Modified

| File | Changes |
|------|---------|
| `src/app/api/tasks/route.ts` | Added `getValidCategories()` function, changed validation to use dynamic categories |

## Commit Info

```
Commit: 393e21a
Message: fix: dynamic category validation — eliminate category mismatch error

- Replace hardcoded VALID_CATEGORIES with dynamic database fetch
- Fetch active categories from database in getValidCategories()
- Fallback to hardcoded list if database fetch fails
- Eliminates 'Invalid category' errors when DB categories differ
```

---

## Related Issues

- Category validation error after payment
- "Invalid category. Must be one of:" with payment already recorded
- Hardcoded vs. dynamic data divergence

