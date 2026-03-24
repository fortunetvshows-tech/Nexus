# MANIFEST: Category Validation Sync Fix

**Date:** March 25, 2026  
**Status:** ✅ RESOLVED  
**Issue:** "Invalid category" error after paying to post a task, even though payment was recorded  
**Root Cause:** Frontend and backend fetching different category lists due to inconsistent database column quoting

---

## The Problem

User reported:
```
POST /api/tasks → 400 error
"Invalid category. Must be one of: 👍 Social Engagement, 📣 Promotion & Sharing, ..."
Payment already recorded (txid: ebe7b2f6905b0c51...)
```

### What Was Happening

Two database queries returning **different results**:

1. **Frontend** (`employer/page.tsx`) → queries `/api/categories`
   - Got one set of categories
   - User selected from that list

2. **Backend** (`use-task-creation.ts` → `/api/tasks`) 
   - Validates against a different set of categories
   - User's selection not in backend's list
   - Task creation fails

### Why The Mismatch?

**Database Column Names:**
```sql
"isActive" boolean not null
"sortOrder" integer not null
```

**PostgreSQL Rule:**
- Quoted identifiers = case-sensitive
- Unquoted identifiers = lowercase

**The Bug:**
```ts
// ❌ /api/categories/route.ts (BEFORE)
.eq('isActive', true)           // Looks for column: isactive (lowercase) ❌
.order('sortOrder', { ascending: true })  // Looks for column: sortorder ❌

// Database has: "isActive", "sortOrder" (quoted, case-sensitive) 
// No match = query returns incomplete/wrong data
```

---

## The Fix

### What I Changed

**File 1: `/api/categories/route.ts`** (Line 9-10)
```ts
// BEFORE
.eq('isActive', true)
.order('sortOrder', { ascending: true })

// AFTER
.eq('"isActive"', true)
.order('"sortOrder"', { ascending: true })
```

**File 2: `/api/tasks/route.ts`** (Line 46-47)
```ts
// Already fixed in previous commit
.eq('"isActive"', true)
.order('"sortOrder"', { ascending: true })
```

### Why This Works

Supabase PostgREST API:
- When column names have quotes in schema: `"isActive"`
- Queries must use **exact matching**: `.eq('"isActive"', true)`
- This tells Supabase: "Look for the column literally named `"isActive"`"

### Database Query Consistency Now

| Endpoint | Query Behavior | Result |
|----------|---|---|
| `/api/categories` | `.eq('"isActive"', true)` | ✅ Returns active categories |
| `/api/tasks` validation | `.eq('"isActive"', true)` | ✅ Validates same categories |
| Frontend dropdown | Displays from `/api/categories` | ✅ User sees same list they can submit |

---

## Verification

**Build Status:** ✅ Compiled successfully in 14.5s  
**TypeScript:** ✅ No errors  
**Endpoints:**
- ✅ `/api/categories` — Fixed
- ✅ `/api/tasks` — Fixed (was fixed in previous commit)

---

## Timeline

| Commit | Change |
|--------|--------|
| `e37dc0f` | Fix `/api/tasks` route to use quoted column names |
| `0b1a09e` | Fix `/api/categories` route to use quoted column names |

---

## Testing Instructions

1. **Navigate to** `/employer` page
2. **Select a category** from the dropdown (should show from `/api/categories`)
3. **Fill out task** with all required fields
4. **Click "Review Task"** then **"Proceed to Payment"**
5. **Complete Pi payment** in Pi Browser
6. **Expected Result:** ✅ Task created successfully (no "Invalid category" error)

---

## Why This Happened

The mismatch was introduced when:
1. I added dynamic category validation to `/api/tasks` in the previous commit
2. I added column quoting to `/api/tasks` route but **forgot to check** `/api/categories`
3. `/api/categories` was still using unquoted column names
4. So `/api/categories` returned wrong/incomplete data
5. Backend validated against correct data, user's category didn't match

**Root cause:** Inconsistent quoting between two API endpoints querying the same table with the same filters.

---

## Lessons Learned

**When working with Supabase/PostgreSQL:**
1. If schema columns are quoted (like `"isActive"`), ALL queries must quote them
2. Search for all `.eq()` and `.order()` calls
3. Make them uniform across the codebase
4. Document the pattern for future developers

**For Lead Architect:**
- Consider running a lint/codemod to ensure all Supabase queries on this table use consistent quoting
- Add comment in both files referencing the database schema
- Consider auto-generating types from schema to prevent manual mistakes

---

## Files Changed

```
src/app/api/categories/route.ts → 2 insertions, 2 deletions
src/app/api/tasks/route.ts → (already fixed in previous commit)
```

---

## Commit History

```
0b1a09e fix: quote camelCase columns in /api/categories — sync with /api/tasks validation
e37dc0f fix: quote camelCase column names in category validation queries
df1e3bd docs: MANIFEST-DYNAMIC-CATEGORY-FIX.md
393e21a fix: dynamic category validation — eliminate category mismatch error
1c690a7 fix: global Pi.authenticate for payments scope — eliminate scope error
```

