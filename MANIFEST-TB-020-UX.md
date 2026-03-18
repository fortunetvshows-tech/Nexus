# MANIFEST — TB-020-UX
## Project: Nexus
## Task: Post-dispute UX clarity
## Commit: 9e1f055
## Date: March 18, 2026

---

## Executive Summary

TB-020-UX enhances post-dispute user experience by making dispute resolution status immediately visible to workers on their dashboard. After a worker wins a dispute, their submission is re-queued with a visual "DISPUTE WON" badge and helper message explaining the reapproval flow.

**Status:** ✅ PARTIAL (Core dashboard UX complete, API extensions pending)

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
