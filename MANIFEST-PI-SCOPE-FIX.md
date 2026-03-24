# MANIFEST: Pi Payment Scope Error Fix

**Date:** March 24, 2026  
**Issue:** `Cannot create a payment without "payments" scope` error on payment initiation  
**Root Cause:** Missing global Pi SDK authentication; "payments" scope was never requested at app level

---

## Problem Diagnosis

The error occurred due to a chain of failures in the Pi SDK integration:

1. **Missing Global Authentication**: `PiPaymentContext.tsx` called `Pi.createPayment()` directly without first calling `Pi.authenticate(['payments', ...])` to grant the payments scope
2. **Component Unmounting**: The `if (!hasMounted) return null` guard in `employer/page.tsx` caused the SDK session to be severed when the component returned null during hydration checks
3. **Scope Loss**: When a component remounts after returning null, the authenticated session is destroyed, so the SDK no longer has the "payments" scope even if it was previously granted
4. **Hydration Mismatch**: `window.location.origin` references in SSR/CSR context caused React error #418 (hydration mismatch)

---

## Solution Implemented

### 1. Global Pi Authentication in PiPaymentContext.tsx

**File:** `src/contexts/PiPaymentContext.tsx`

- Added `isAuth` state to track global authentication status
- Added `isAuthenticatingRef` to prevent double-authentication attempts
- Implemented `onIncompletePaymentFound` callback to handle stuck payments from previous crashes:
  - If transaction has a txid on blockchain: `/api/pi/complete` it
  - If no txid (user never paid): `/api/pi/cancel` it
- Added `useEffect` that runs on mount to call `Pi.authenticate(['payments', 'username'], onIncompletePaymentFound)`
  - This runs ONCE at the app level (not per-page)
  - Grants the "payments" scope globally
  - Keeps the SDK session alive for the entire app lifetime
- Updated fetch URLs to use relative paths (`/api/pi/approve`, `/api/pi/complete`) instead of `window.location.origin`

**Key Changes:**
```typescript
// Before: Never authenticated
const createPayment = useCallback((config, onSuccess, onError) => {
  window.Pi.createPayment(...)  // ERROR: scope not granted
})

// After: Global authentication happens at provider mount
useEffect(() => {
  window.Pi.authenticate(['payments', 'username'], onIncompletePaymentFound)
    .then(() => setIsAuth(true))
}, [])
```

### 2. Removed Hydration Guard from employer/page.tsx

**File:** `src/app/employer/page.tsx`

- Removed `const [hasMounted, setHasMounted] = useState(false)`
- Removed the useless `useEffect(() => { setHasMounted(true) }, [])`
- Removed `if (!hasMounted) return null` guard
- Changed `fetch(\`${window.location.origin}/api/categories\`)` to `fetch('/api/categories')`

**Rationale:**
- The `hasMounted` guard was causing the SDK session to break mid-render
- The global `PiPaymentProvider` now handles hydration safely
- Relative URLs are safe in Next.js and avoid hydration mismatches

---

## Files Modified

| File | Changes |
|------|---------|
| `src/contexts/PiPaymentContext.tsx` | Added global auth, onIncompletePaymentFound, fix relative URLs |
| `src/app/employer/page.tsx` | Removed hasMounted guard, fixed fetch URLs |

---

## Testing Checklist

- [ ] Build succeeds: `npm run build`
- [ ] No TypeScript errors
- [ ] Pi Browser: User can navigate to /employer without "Cannot create a payment" error
- [ ] Pi Browser: User can post a task and initiate payment
- [ ] Pi Browser: Payment callbacks (onReadyForServerApproval, etc.) fire correctly
- [ ] Pi Browser: If a user has a stuck payment, `onIncompletePaymentFound` fires on login
- [ ] Stuck payment is either completed (if txid exists) or cancelled (if no txid)

---

## Prevention

The fix ensures:
1. The Pi SDK session is tied to the app lifecycle, not individual page components
2. The "payments" scope is requested once at app load, not on each page
3. Incomplete payments are automatically recovered on the next authentication
4. No component can accidentally unmount and break the SDK context

---

## Related Issues

- React error #418: Hydration mismatch on /employer page
- Pi SDK error: Scope loss on component unmount
- User-facing: "Cannot create a payment without 'payments' scope"

---

## Commit Message

```
fix: global Pi.authenticate for payments scope — eliminate "payments scope" error

- Add global Pi.authenticate(['payments', 'username']) to PiPaymentContext
- Implement onIncompletePaymentFound callback to recover stuck payments
- Remove hasMounted guard from employer/page.tsx (was breaking SDK session)
- Fix window.location.origin URLs to relative paths (prevent #418 hydration error)
- Ensure payments scope is granted once at app level, not per-page

This fixes the "Cannot create a payment without 'payments' scope" error by
ensuring the SDK session is maintained with proper auth scope throughout the
app lifetime. Stuck payments from previous crashes are now auto-recovered.

Resolves: #418 hydration error, payments scope loss
```

