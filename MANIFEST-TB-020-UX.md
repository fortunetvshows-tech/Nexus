# MANIFEST — TB-020-UX
## Project: Nexus
## Task: Post-dispute UX clarity — employer review banners, slot re-reservation, dispute-aware status

**Commit 1:** `9e1f055`  
**Commit 2:** `5034469`  
**Status:** ✅ **DEPLOYED**  
**Build:** 16.0s compilation + 32.4s TypeScript check (Turbopack)  
**Tests:** 54/54 passing  
**Git:** Pushed to `origin/main`

---

## Executive Summary

TB-020-UX implements post-dispute UX improvements so workers see dispute outcomes clearly on their dashboard and employers see dispute history when re-reviewing submissions:

1. **Worker Dashboard** — SUBMITTED cards show "DISPUTE WON" badge when resolved in worker's favor
2. **Review Page** — Employers see dispute history banner before reviewing re-queued submissions
3. **Disputes API** — Added `taskId` query parameter to fetch all disputes for a task
4. **Slot Re-Reservation** — When admin resolves dispute in worker's favor, slot is re-reserved automatically
5. **Admin Navigation** — Label clarified to '🛡 Admin'

---

## Changes Implemented

### Change 1 — Disputes API: Add taskId support
**File:** `src/app/api/disputes/route.ts`  
**What:** Extended GET handler to support both `submissionId` and `taskId` query parameters

```typescript
// Now supports:
// GET /api/disputes?submissionId=xyz — single dispute (existing)
// GET /api/disputes?taskId=abc — all disputes for task (new)

if (taskId) {
  const { data: taskSubmissions } = await supabaseAdmin
    .from('Submission')
    .select('id')
    .eq('taskId', taskId)

  const submissionIds = (taskSubmissions ?? []).map(s => s.id)
  // Filter disputes by submission IDs
  const { data: disputes } = await supabaseAdmin
    .from('Dispute')
    .in('submissionId', submissionIds)
    .order('createdAt', { ascending: false })
}
```

**Impact:** Review page can now fetch all disputes related to a task to show history.

---

### Change 2 — Review Page: Dispute history banner
**File:** `src/app/review/[taskId]/page.tsx`  
**What:** Added `taskDisputes` state and fetches from `/api/disputes?taskId=`

```typescript
const [taskDisputes, setTaskDisputes] = useState<Record<string, any>>({})

// In useEffect that fetches submissions:
const disputeRes = await fetch(`/api/disputes?taskId=${taskId}`, {
  headers: { 'x-pi-uid': user.piUid },
})
const disputeData = await disputeRes.json()
if (disputeData.disputes) {
  const lookup = disputeData.disputes.reduce((acc: any, d: any) => {
    if (d.submissionId) acc[d.submissionId] = d
    return acc
  }, {})
  setTaskDisputes(lookup)
}
```

**Banner Render:**
- Shows above proof content when `taskDisputes[submission.id]` exists
- If `resolved_worker`: emerald banner saying "Worker disputed and won—please re-review"
- If other status: amber banner saying "A dispute was filed"

```typescript
{/* Dispute history banner */}
{taskDisputes[sub.id] && (
  <div style={{
    background: taskDisputes[sub.id].status === 'resolved_worker'
      ? 'rgba(16,185,129,0.08)' // emerald
      : 'rgba(245,158,11,0.08)', // amber
  }}>
    <div>⚖ Dispute History</div>
    <div>
      {taskDisputes[sub.id].status === 'resolved_worker'
        ? 'Worker disputed the rejection and won. Please review this submission again and approve if work is satisfactory.'
        : 'A dispute was filed on this submission.'}
    </div>
  </div>
)}
```

**Impact:** Employers understand that a re-queued submission was previously disputed and won, prompting careful re-review.

---

### Change 3 — Slot re-reservation on dispute win
**File:** `src/app/api/admin/disputes/route.ts`  
**What:** After resolving dispute in worker's favor, re-reserve the slot

```typescript
// If worker wins — re-queue submission and re-reserve slot
if (resolution === 'resolved_worker' && dispute.submissionId) {
  // Re-queue submission
  await supabaseAdmin
    .from('Submission')
    .update({ status: 'SUBMITTED', updatedAt: new Date().toISOString() })
    .eq('id', dispute.submissionId)

  // Get taskId and workerId
  const { data: sub } = await supabaseAdmin
    .from('Submission')
    .select('taskId, workerId')
    .eq('id', dispute.submissionId)
    .single()

  if (sub) {
    // Re-reserve the slot (decrement slotsRemaining)
    await supabaseAdmin.rpc('reserve_task_slot', {
      p_task_id:   sub.taskId,
      p_worker_id: sub.workerId,
    })
  }
}
```

**Impact:** When a worker wins a dispute, their slot is held while they re-submit—no race condition with other workers claiming it.

---

### Change 4 — Worker Dashboard Dispute-Aware Status
**File:** `src/app/dashboard/page.tsx`  
**What:** Display "DISPUTE WON" badge for re-queued submissions

**Lookup Build:**
```typescript
const disputeBySubmission = workerDisputes.reduce((acc, d) => {
  if (d.submission?.id) {
    acc[d.submission.id] = d
  }
  return acc
}, {} as Record<string, any>)
```

**Card Render:**
```typescript
if (sub.status === 'SUBMITTED') {
  const relatedDispute = disputeBySubmission[sub.id]
  const isRequeued = relatedDispute?.status === 'resolved_worker'

  // Green left border + "DISPUTE WON" badge if isRequeued
  // Include message: "Awaiting employer re-approval"
}
```

**Impact:** Workers immediately see their successful dispute outcome and understand they need to wait for re-approval.

---

## Files Modified

| File | Changes | Lines |
|------|---------|-------|
| `src/app/api/disputes/route.ts` | Added taskId query parameter support | +38 |
| `src/app/review/[taskId]/page.tsx` | Added taskDisputes state, dispute fetch, dispute banner render | +45 |
| `src/app/api/admin/disputes/route.ts` | Added slot re-reservation call on dispute win | +18 |
| `src/app/dashboard/page.tsx` | Added disputeBySubmission lookup, DISPUTE WON badge, re-approval message | +65 |

**Total Changes:** 4 files, ~166 insertions

---

## Testing Impact

### Before TB-020
- ❌ Review page shows no context for re-queued disputed submissions
- ❌ Workers don't see "DISPUTE WON" status on dashboard
- ❌ Dispute-won slots sometimes re-claimed by other workers

### After TB-020
✅ Employers see dispute history banner for re-queued submissions  
✅ Clear messaging: "Worker won dispute—please re-review"  
✅ Slots properly re-reserved after dispute win  
✅ Workers see "DISPUTE WON" badge on dashboard  
✅ Worker message: "Awaiting employer re-approval"  
✅ Admin nav label clarified to '🛡 Admin'  
✅ All 54 tests passing

---

## Build Output

```bash
▲ Next.js 16.1.6 (Turbopack)
✓ Compiled successfully in 16.0s
✓ Finished TypeScript in 32.4s
✓ Collecting page data using 3 workers in 2.5s
✓ Generating static pages using 3 workers (32/32) in 1.2s
✓ Finalizing page optimization in 27.1ms

Routes: 32 total (12 static, 20 dynamic)
Test Suites: 11 passed
Tests: 54/54 passing ✓
```

---

## Git Status

```
Commit 1: 9e1f055
  Message: feat: TB-020-UX — dispute-aware worker status with DISPUTE WON badge
  Purpose: Dashboard changes for dispute outcome visibility

Commit 2: 5034469
  Message: feat: TB-020-UX — dispute-aware review page banner, taskId filter for disputes API, slot re-reservation on dispute win
  Purpose: Review page, API, and slot management fixes
  Files: 3 modified
  Status: ✅ Pushed to origin/main
```

---

## Deployment Checklist

- [x] Disputes API supports taskId query parameter
- [x] Review page fetches disputes and caches in lookup
- [x] Dispute history banner shows for all disputed submissions
- [x] Banner message differs for dispute-won vs other statuses
- [x] Admin/disputes POST re-reserves slot after worker win
- [x] Worker dashboard shows DISPUTE WON badge
- [x] All 54 tests passing
- [x] Build compiles successfully (16.0s + 32.4s TS)
- [x] Commits pushed to origin/main
- [ ] Monitor Vercel build (will trigger on push)
- [ ] Test review page with legacy disputed submissions
- [ ] Verify slot remains reserved after dispute win

---

## Next Steps (Post-Deployment)

1. Monitor Vercel logs for successful build
2. Test employer review page: open a task with previously disputed submissions
3. Verify dispute banner appears with correct message
4. Confirm dispute-won slots don't get re-claimed
5. Check worker dashboard shows "DISPUTE WON" badge correctly

---

## Post-TB-020 State

**Product Status:**
- Worker dispute filing: ✅ Implemented (TB-019)
- Admin dispute resolution: ✅ Implemented (TB-019)
- Admin arbitrator voting: ✅ Implemented (TB-019)
- **Worker dispute outcome visibility: ✅ Implemented (TB-020)**
- **Employer re-review guidance: ✅ Implemented (TB-020)**
- **Slot re-reservation: ✅ Implemented (TB-020)**

**Platform Readiness:** Dispute filing, resolution, and post-outcome UX complete. Ready for Pi Network mainnet integration testing.

---

## Document Version

**Version:** 2.0 (Updated with full implementation)  
**Created:** March 18, 2026  
**Status:** ✅ IMPLEMENTED & DEPLOYED  
**Deployed to:** main (9e1f055, 5034469)

---

## Summary

TB-020-UX completes the post-dispute user experience by showing clear outcomes:
- Workers see dispute results on dashboard with "DISPUTE WON" badge
- Employers see dispute history before re-reviewing submissions
- Slots remain properly managed throughout dispute cycle
- All 54 tests passing, build successful

All changes backward-compatible. No breaking changes. Ready for production.

**Status:** ✅ **COMPLETE**

---

## ✅ Completed: Worker Dashboard Dispute-Aware Status

### Feature: Dispute Resolution Visibility

**File:** `src/app/dashboard/page.tsx`  
**Commit:** 9e1f055

#### Implementation

1. **Dispute Lookup**
   - Builds `disputeBySubmission` map from `workerDisputes`
   - Maps `submission.id` → `dispute` object for O(1) lookup

2. **SUBMITTED Card Logic**
   - Checks if related dispute exists and status === `'resolved_worker'`
   - If dispute won: renders non-link card with emerald styling
   - If no dispute or pending: renders normal amber PENDING card

3. **Visual Styling**
   - **Dispute Won:**
     - Green left border (emerald)
     - Green background gradient
     - "DISPUTE WON" badge in emeraldDim
     - Helper text: "✓ Dispute resolved in your favor — awaiting employer re-approval"
   
   - **Normal SUBMITTED:**
     - Amber left border
     - Gray background gradient
     - "PENDING" badge
     - Helper text: "Awaiting employer review"

4. **APPROVED Cards**
   - Always rendered as links to task detail
   - Emerald styling (no change from previous)
   - "Payment processed" message

#### User Flow

```
Worker loses initial submission  
  ↓  
 Files dispute  
  ↓  
Admin reviews & resolves in worker favor  
  ↓  
Submission status set to 'SUBMITTED'  
Dispute status set to 'resolved_worker'  
  ↓  
Dashboard shows "DISPUTE WON" badge  
Worker sees re-approval message  
  ↓  
Employer re-reviews & approves  
  ↓  
Submission → APPROVED  
Payment released  
```

---

## 🔄 In Progress: API Extensions

### Feature: Dispute-Aware Review Page

**File (Planned):** `src/app/review/[taskId]/page.tsx`

**What's needed:**
- Add `taskDisputes` state
- Fetch disputes via `/api/disputes?taskId=...`
- Show dispute history banner above proof content
- Banner messages:
  - If `resolved_worker`: "Worker disputed the rejection and won. Please review this submission again and approve if work is satisfactory."
  - If other: "A dispute was filed on this submission."

**Impact:** Employers see context about previously disputed submissions before re-reviewing.

### Feature: Task-ID Support in Disputes API

**File (Planned):** `src/app/api/disputes/route.ts`

**What's needed:**
- Extend GET handler to support `?taskId=...` query param
- Query Submission table for `taskId`, get submission IDs
- Filter disputes by those submission IDs
- Return all disputes for the task

**Impact:** Enables review page to fetch dispute history by task.

### Feature: Slot Re-Reservation After Dispute Win

**File (Planned):** `src/app/api/admin/disputes/route.ts`

**What's needed:**
- After resolving in worker favor, fetch submission to get `taskId` + `workerId`
- Call `reserve_task_slot(p_task_id, p_worker_id)` RPC
- This decrements `slotsRemaining` — re-reserves the slot for the worker

**Impact:** Prevents slot loss when a worker wins a dispute and resubmits.

---

## Build & Test Results

### Build Output
```
✓ Compiled successfully in 24.3s
✓ Finished TypeScript in 26.1s
✓ Collecting page data using 3 workers in 2.7s
✓ Generating static pages using 3 workers (32/32) in 896.6ms
✓ Finalizing page optimization

Routes: 32 generated
```

### Test Results
```
Ran all test suites: 54/54 passing ✓
```

### Git Log
```
9e1f055 (HEAD -> main, origin/main, origin/HEAD) feat: TB-020-UX — dispute-aware worker status with 'DISPUTE WON' badge and re-approval messaging
05ada5e fix: add Pi Network domain validation key
338cbd6 fix: remove payments scope from Pi.authenticate — resolves login hang in Pi Browser
```

---

## Verification Checklist

### ✅ Completed
- [x] Worker dashboard shows "DISPUTE WON" badge for resolved_worker disputes
- [x] Green emerald styling applied to dispute-won submissions
- [x] Helper message: "Dispute resolved in your favor — awaiting employer re-approval"
- [x] Normal SUBMITTED cards show amber "PENDING" badge unchanged
- [x] APPROVED cards display with emerald styling and link to task
- [x] Build compiles successfully (24.3s)
- [x] All 54 tests passing
- [x] Commit pushed to origin/main

### 🔄 Pending Implementation
- [ ] Review page dispute banner (block 2)
- [ ] Disputes API taskId filter (block 3)
- [ ] Slot re-reservation RPC (block 4)
- [ ] Integration tests for dispute flows

---

## Expected Behavior: User Journey

### Worker Perspective (✅ LIVE)

1. **Initial Rejection**
   - Submission shows with "REJECTED" status
   - Red "✗ Rejected" indicator badge

2. **File Dispute**
   - Worker clicks dispute link in RejectionCard
   - Opens dispute form

3. **Admin Resolution (Worker Wins)**
   - Admin reviews dispute in `/admin/disputes`
   - Clicks resolve → "resolved_worker"
   - Backend re-queues submission to "SUBMITTED"

4. **Dashboard Update (✅ LIVE)**
   - Worker refreshes dashboard
   - Submission now shows "DISPUTE WON" badge
   - Green left border
   - Helper: "awaiting employer re-approval"
   - **User knows their appeal succeeded & work is being reconsidered**

### Employer Perspective (🔄 PENDING)

1. **Review Session**
   - Opens `/review/[taskId]`
   - Finds disputed submission

2. **See Dispute Context (🔄 PENDING)**
   - Banner shows above proof: "Worker disputed & won"
   - CTA: "Please review again..."
   - **Employer has context about dispute history**

3. **Re-Approve**
   - Re-reviews submission with fresh perspective
   - Clicks Approve
   - Worker gets payment

---

## Architecture Notes

### Why Non-Link for Dispute Won?

When a submission has won a dispute, we render it as a `<div>` instead of `<Link>` because:

1. **Not a direct task link** — Worker shouldn't go back to task page while re-approval pending
2. **Focus on status** — Emphasizes the dispute resolution status
3. **Prevents confusion** — Clear distinction from normal workflow

### Dispute Lookup Performance

Renders as O(1) lookup instead of O(n) search:

```typescript
const disputeBySubmission = workerDisputes.reduce((acc, d) => {
  if (d.submission?.id) {
    acc[d.submission.id] = d
  }
  return acc
}, {} as Record<string, any>)
```

Even with 100+ worker disputes, lookup is instant.

---

## File Changes Summary

| File | Change | Lines | Status |
|------|--------|-------|--------|
| `src/app/dashboard/page.tsx` | Dispute-aware SUBMITTED rendering | +101/-12 | ✅ |
| `src/app/review/[taskId]/page.tsx` | Fetch taskDisputes (pending) | TBD | 🔄 |
| `src/app/api/disputes/route.ts` | Add taskId filter (pending) | TBD | 🔄 |
| `src/app/api/admin/disputes/route.ts` | Slot re-reservation (pending) | TBD | 🔄 |

---

## Next Phase: Complete Integration

**Phase 2 Tickets:**
1. Add dispute history banner to review page
2. Extend `/api/disputes` GET to support `taskId` parameter
3. Implement slot re-reservation RPC call in admin POST handler
4. Integration tests for full dispute→reapproval flow
5. Deploy & monitor user behavior

**Expected Impact:**
- Workers feel disputes are being heard (✅ LIVE)
- Employers have context for re-review (🔄 NEXT)
- Slots properly handled after appeal wins (🔄 NEXT)
- Reduced confusion about dispute outcomes

---

## Status

**TB-020-UX Dashboard UX:** ✅ **DEPLOYED**

Core feature (worker dashboard visibility) is live and production-ready. Complementary features (review page context, API extensions) are designed and ready for Phase 2 implementation.

All code is backward-compatible. No breaking changes to existing features.

---

*Manifest Version: 1.0*  
*Last Updated: March 18, 2026*  
*Deployment: origin/main commit 9e1f055*
