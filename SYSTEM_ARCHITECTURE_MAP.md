# ProofGrid System Architecture Map

**Last Updated:** April 1, 2026  
**Purpose:** Reference guide for maintaining system integrity during redesign/refactoring  
**Use This When:** Changing component layouts, restructuring pages, or debugging integration issues

---

## 1. Component Dependency Tree

### App Structure
```
App (Next.js 16.1.6)
├── Layout (global styles)
├── PiPaymentProvider (context wrapper)
│   └── Page Routes
│       ├── /feed
│       │   └── TaskCard × many
│       ├── /task/[taskId]
│       │   ├── Navigation (TopBar)
│       │   ├── Claim Section
│       │   │   ├── WalletModal (conditional)
│       │   │   ├── ClaimButton
│       │   │   └── ErrorDisplay
│       │   └── Submission Section (if isClaimed)
│       │       ├── ProofUploader
│       │       ├── ProofInput (type-dependent)
│       │       ├─── VerificationDisplay
│       │       └── SubmitButton
│       ├── /employer
│       │   ├── TaskBuilder (multi-field form)
│       │   ├── ProofTypeSelector
│       │   ├── InstructionUploader
│       │   └── FeeBreakdown
│       ├── /review/[taskId]
│       │   ├── SubmissionList
│       │   ├── ProofViewer
│       │   └── ApprovalControls
│       └── /profile
│           ├── WalletDisplay
│           └── EditWalletModal
└── BottomNav (persistent across routes)
```

---

## 2. State Management Architecture

### Global Context
```
PiPaymentContext
├─ createPayment(config, onSuccess, onError)
│  ├─ Requires: amount, memo, metadata
│  ├─ Returns: paymentId, txid via callback
│  └─ Side effects: 
│     ├─ Acquires Pi SDK "payments" scope globally on mount
│     ├─ Handles incomplete payments from previous crashes
│     └─ Manages payment state until callback fires
├─ isProcessing: boolean (UI shows loading state)
└─ error: string | null (UI shows error message)
```

### Page-Level State (useSubmission Hook)
```typescript
useSubmission(taskId: string, piUid: string)
  
Returns:
├─ Slot State
│  ├─ isClaimed: boolean
│  │  └─ Toggles between claim section and submission section
│  ├─ isClaiming: boolean  
│  │  └─ Disables button, shows "Securing spot..." text
│  ├─ reservationId: string | null
│  ├─ timeoutAt: string | ISO timestamp
│  │  └─ Used for countdown timer display
│  ├─ verificationCode: string | null
│  │  └─ MUST display in submission form
│  └─ claimError: string | null
│
├─ Submission State
│  ├─ isSubmitted: boolean
│  │  └─ Hides submission form, shows confirmation
│  ├─ isSubmitting: boolean
│  │  └─ Disables submit button during API call
│  ├─ submissionId: string | null
│  │  └─ CRITICAL: Passed to ProofUploader as contextId
│  ├─ autoApproveAt: ISO timestamp
│  ├─ agreedReward: number | null
│  └─ submitError: string | null
│
└─ Methods
   ├─ claimSlot() → Promise<boolean>
   │  └─ POST /api/tasks/[taskId]/claim
   │     └─ Returns: isClaimed=true, verificationCode, timeoutAt
   │
   └─ submitProof(content, fileUrl?, type?, storagePath?) → Promise<boolean>
      └─ POST /api/tasks/[taskId]/submit
         └─ Returns: submissionId, autoApproveAt, agreedReward
```

### Component-Level State
```typescript
// TaskDetailPage
const [task, setTask]                       // Task data from API
const [walletAddress, setWalletAddress]     // Fetched separately from /api/profile
const [showWalletModal, setShowWalletModal] // Show/hide wallet requirement modal
const [proofStoragePath, setProofStoragePath] // Updated by ProofUploader.onUploaded
const [proofContent, setProofContent]       // Raw text or file URL for submission
const [timeLeft, setTimeLeft]               // Countdown timer display

// ProofUploader (child)
const [isUploading, setIsUploading]         // Upload progress
const [error, setError]                     // Upload error message
const [uploaded, setUploaded]               // File name display
```

---

## 3. API Call Sequences

### Sequence 1: Page Load
```
TaskDetailPage mounts
├─ Parallel fetch 1: GET /api/tasks/[taskId]
│  ├─ Header: x-pi-uid
│  ├─ Returns: Task {
│  │    id, title, description, instructions,
│  │    category, proofType, piReward,
│  │    slotsAvailable, slotsRemaining, timeEstimateMin,
│  │    deadline, minReputationReq, minBadgeLevel, tags,
│  │    instructionFileUrl, instructionFileName,    ← NEW
│  │    employer: { piUsername, reputationScore, reputationLevel }
│  │  }
│  └─ State update: setTask(data.task)
│
├─ Parallel fetch 2: GET /api/profile
│  ├─ Header: x-pi-uid
│  ├─ Returns: { profile: { walletAddress, kycLevel, ... } }
│  └─ State update: setWalletAddress(walletAddress)
│
└─ Sequential fetch 3: GET /api/tasks/[taskId]/my-submission
   ├─ Header: x-pi-uid
   ├─ Checks if worker already claimed this task
   ├─ Returns: { submission?: { id, status, ... } }
   └─ If exists: seSubmissionStatus, setSubmissionId
```

**Timing Critical:** Both parallel fetches must complete before ProofInput renders (needs proofType from task)

---

### Sequence 2: Claim Slot
```
User clicks "Claim Slot" button
│
├─ Pre-check: if (!walletAddress) 
│  └─ setShowWalletModal(true) + return (don't proceed to claim)
│
└─ If walletAddress exists:
   └─ claimSlot() calls POST /api/tasks/[taskId]/claim
      ├─ Header: x-pi-uid
      ├─ No body
      ├─ Returns: {
      │    success: true,
      │    reservationId: "uuid",
      │    timeoutAt: ISO timestamp,
      │    verificationCode: "ABC123XYZ",  ← Display this!
      │  }
      └─ State updates (from useSubmission):
         ├─ isClaimed = true
         ├─ verificationCode = "ABC123XYZ"
         ├─ timeoutAt = ISO
         └─ UI transitions to Submission Form
```

**🔴 CRITICAL:** If verificationCode is null, displays become empty string

---

### Sequence 3: Upload Proof File (if proofType === FILE)
```
User clicks file input and selects file
│
└─ ProofUploader.handleUpload(file) triggers
   └─ POST /api/proof/upload
      ├─ Headers: x-pi-uid
      ├─ FormData: 
      │  ├─ file: File object
      │  ├─ context: "submission"
      │  └─ contextId: submissionId  ← MUST come from useSubmission hook
      ├─ Returns: {
      │    success: true,
      │    storagePath: "submissions/[submissionId]/[fileName]",
      │    proofUrl: "https://signed-url.example.com",
      │  }
      └─ Side effects:
         ├─ onUploaded(storagePath) callback
         └─ Parent state: setProofStoragePath(storagePath)
```

**🔴 CRITICAL:** If contextId is wrong (e.g., taskId instead of submissionId), upload fails silently

---

### Sequence 4: Submit Proof
```
User fills form + clicks Submit
│
└─ submitProof(proofContent, proofFileUrl, submissionType, proofStoragePath) 
   └─ POST /api/tasks/[taskId]/submit
      ├─ Headers: x-pi-uid, Content-Type: application/json
      ├─ Body: {
      │    proofContent,           ← Raw text or file URL
      │    proofFileUrl,           ← Optional, for image/video
      │    submissionType,         ← "text", "file", "image", etc.
      │    proofStoragePath,       ← From ProofUploader.onUploaded
      │  }
      ├─ Returns: {
      │    success: true,
      │    submissionId: "uuid",
      │    autoApproveAt: ISO,
      │    agreedReward: 3.5π,
      │  }
      └─ State updates:
         ├─ isSubmitted = true
         ├─ submissionId = "uuid"
         ├─ Submission form hides
         └─ Success message shows
```

**🔴 CRITICAL:** proofStoragePath must be passed correctly or proof can't be retrieved in review

---

### Sequence 5: Task Creation (Employer)
```
Employer fills form + initiates payment
│
├─ validateForm() checks all fields
├─ openPiPayment() via PiPaymentContext
│  └─ window.Pi.createPayment() opens Pi payment UI
│     └─ On success: paymentId, txid returned
│
└─ POST /api/tasks (AFTER payment confirmed)
   ├─ Headers: x-pi-uid, Content-Type: application/json
   ├─ Body: {
   │    title, description, instructions, category, proofType,
   │    piReward, slotsAvailable, timeEstimateMin, deadlineHours,
   │    minReputation, minBadgeLevel, tags,
   │    instructionFileUrl,    ← From ProofUploader.onUploaded
   │    instructionFileName,   ← From ProofUploader.onUploaded
   │    escrowTxid, piPaymentId
   │  }
   ├─ Returns: {
   │    success: true,
   │    taskId: "uuid",
   │    totalEscrowed: 3.5,
   │    deadline: ISO,
   │  }
   └─ Side effect: instructionFileUrl saved to Task table
      (via createTaskWithEscrow → update Task table)
```

**🔴 CRITICAL:** If instructionFileUrl/instructionFileName not sent, instruction download won't work for workers

---

## 4. Data Contracts (TypeScript Interfaces)

### Task Interface
```typescript
interface Task {
  id:               string
  title:            string
  description:      string
  instructions:     string
  category:         string
  proofType:        'TEXT' | 'FILE' | 'IMAGE' | 'AUDIO' | 'VIDEO'
  piReward:         number
  slotsAvailable:   number
  slotsRemaining:   number
  timeEstimateMin:  number
  deadline:         string (ISO)
  minReputationReq: number
  minBadgeLevel:    string
  taskStatus:       'escrowed' | 'in_progress' | 'completed' | 'archived'
  tags:             string[]
  isFeatured:       boolean
  
  // NEW — for instruction delivery
  instructionFileUrl?: string   // Signed URL to download
  instructionFileName?: string  // Original file name ("instructions.pdf")
  
  employer: {
    piUsername:      string
    reputationScore: number
    reputationLevel: string
  }
}
```

### ProofUploader Props
```typescript
interface ProofUploaderProps {
  piUid:      string              // Current user Pi ID
  context:    'task' | 'submission' // Context of upload
  contextId:  string              //🔴 CRITICAL: submissionId or taskId
  onUploaded: (storagePath: string, fileName: string) => void
  label?:     string              // Default: "Upload file"
  accept?:    string              // File types to accept
}
```

### WalletModal Props
```typescript
interface WalletModalProps {
  open:    boolean
  onClose: () => void
}

// Usage:
<WalletModal open={!walletAddress} onClose={() => router.push('/profile')} />
```

### ProofViewer Props
```typescript
interface ProofViewerProps {
  proofUrl:  string              // Signed URL from submission
  fileType:  'image' | 'video' | 'pdf' | 'document'
  fileName?: string
}
```

---

## 5. Failure Cascade Matrix

**Read as: If X breaks, then Y, Z also break**

```
Component/State               → Dependent Systems
─────────────────────────────────────────────────────────
Task fetch fails              → ProofInput selector (no proofType)
                              → InstructionDownload (no URL)
                              → Category badge (no category)
                              → Reward display (no piReward)

walletAddress === null        → ClaimButton disabled
                              → WalletModal hidden (should show)
                              → Claim doesn't work

isClaimed === false           → Submission form hidden
                              → ProofUploader not mounted
                              → VerificationDisplay not shown

verificationCode === null     → VerificationDisplay shows empty space
                              → User doesn't know what to include in proof
                              → Employer can't verify authentic work

submissionId === null         → ProofUploader contextId wrong
                              → Upload fails or uses wrong path
                              → Proof can't be retrieved later

proofStoragePath === null     → Submit button sends incomplete data
                              → API rejects submission
                              → Review page can't display proof

instructionFileUrl === null   → Download link doesn't render
                              → Worker can't access instructions
                              → Workflow breaks (no file to reference)

instructionFileName === null  → Link shows "Download instructions" only
                              → UX: user doesn't see file name

ProofUploader unmounts        → No way to upload proof
                              → User blocked from submitting
                              → Workflow stuck

timeLeft === "Expired"        → Submission form should disable
                              → Timer display red (#FF4757)
                              → User can't submit anymore

isClaiming === true           → ClaimButton disabled + loading state
                              → Prevents double-click API calls

isSubmitting === true         → SubmitButton disabled + loading state
                              → Prevents double-click API calls

ProofInput changes proofType  → Conditional renders different UI
                              without TEXT → textarea hides
                              → FILE → upload zone shows
                              → IMAGE → file picker shows
                              → Requires re-render of Submit logic
```

---

## 6. Mobile-Specific Breakage Points

### Components at Risk on Mobile

| Component | Desktop | Mobile (320px) Issue | Fix |
|-----------|---------|---------------------|-----|
| Verification Code | Full width | Text wraps, copy-paste breaks | Use `wordBreak: break-all` |
| ClaimButton | "Start earning 2.5π now →" | Text truncates "Start earn..." | Use responsive font size or abbreviate |
| ProofUploader drag zone | 2-col layout | Button text overflows | Use `whiteSpace: nowrap` + ellipsis |
| WalletModal | centered, full height | Overlaps notch area | Add safe-area-inset padding |
| VerificationDisplay | Mono font, fixed width | Code wraps mid-way | Use `fontFamily: mono` + `min-width` |
| InstructionDownload | Download link | Button may overflow | Use `display: block` on mobile |
| Navigation bars | Hamburger icon | Icon size wrong on notch | Use viewport-fit=cover |
| ProofViewer | Image/PDF full width | Zoom required on mobile | Add pinch-zoom support |
| ProofInput textarea | Full keyboard | Keyboard covers input | Use `position: fixed` scroll or scroll into view |
| FeeBreakdown | 2-column | Stacks but numbers may overflow | Use responsive font sizes |

### Critical Mobile Tests
```
MOBILE VIEWPORT SIZES TO TEST:
□ iPhone 12 mini: 375px
□ iPhone 12: 390px
□ iPhone 14 Pro Max: 430px
□ Tablet (iPad): 768px
□ Tablet landscape: 1024px

CRITICAL USER FLOWS ON MOBILE:
□ Claim slot → see wallet modal → navigate to profile
□ Upload proof file → file picks opens → returns to app
□ View verification code → can copy/paste into proof
□ Download instruction file → file opens in default viewer
□ Submit proof → success message readable
```

---

## 7. Testing Checklist (Pre-Deployment)

### Critical Path Tests
```
□ Page Load
  □ Task data loads (title, description visible)
  □ Wallet address fetched (wallet warning shows if null)
  □ Check for existing submission (shows current state)
  
□ Claim Slot Workflow
  □ No wallet → WalletModal shows
  □ Have wallet → Modal hidden
  □ Click claim → API call succeeds
  □ Verification code displays
  □ Submission form appears
  □ Timer starts and counts down
  
□ Proof Upload (if proofType === FILE)
  □ Click upload button → file picker opens
  □ Select file → upload starts
  □ Upload completes → success state shows
  □ Filename displayed correctly
  □ Proof storage path captured
  
□ Proof Submission
  □ All required fields filled
  □ Click submit → API call succeeds
  □ Success message shows
  □ Page transitions to confirmation
  □ submissionId stored correctly
  
□ Instruction Download (if proofType === FILE)
  □ Instruction file section renders
  □ Filename displays correctly
  □ Download link clickable
  □ File downloads (not redirects to blank page)
```

### API Integration Tests
```
□ GET /api/tasks/[taskId]
  □ Returns instructionFileUrl + instructionFileName
  □ Returns correct proofType
  
□ GET /api/profile
  □ Returns walletAddress (or null if not set)
  
□ POST /api/tasks/[taskId]/claim
  □ Returns verificationCode
  □ Returns timeoutAt (valid timestamp)
  □ Returns submissionId
  
□ POST /api/proof/upload
  □ contextId must be submissionId (not taskId)
  □ Returns storagePath + proofUrl
  □ File actually stored in Supabase
  □ Signed URL valid for 1 hour
  
□ POST /api/tasks/[taskId]/submit
  □ proofStoragePath included in request
  □ Proof file retrievable in review page
  □ submissionId created + returned
  
□ GET /api/tasks/[taskId]/submissions (for review)
  □ Returns proofStoragePath in response
  □ Signed URLs generated correctly
  □ Review page can display proofs
```

### Edge Cases
```
□ User has no wallet → can't claim
  □ ClaimButton disabled
  □ WalletModal shows on click
  □ Link to /profile works

□ User claims, then page refreshes
  □ useSubmission hook re-fetches submission
  □ State recovered correctly
  □ No duplicate claims

□ Upload fails midway
  □ Error message displays
  □ User can retry
  □ Previous partial uploads don't block

□ No instructionFileUrl provided
  □ Instruction section doesn't render
  □ No 404 console errors
  □ ProofUploader still works

□ Verification code takes 30s to arrive
  □ Form doesn't break or timeout
  □ Code eventually displays
  □ User can still submit without code (if not required)

□ timeLeft === "Expired"
  □ Submit button disabled or hidden
  □ Timer shows "Expired" in red
  □ User can't submit anymore

□ Mobile 320px width
  □ All buttons clickable (min 44px height)
  □ Text readable without horizontal scroll
  □ File input works correctly
  □ Modal doesn't overflow screen
```

---

## 8. Common Redesign Pitfalls

### ⚠️ Pitfall 1: ProofUploader contextId
```typescript
// ❌ WRONG — Uses taskId
<ProofUploader
  piUid={user.piUid}
  context="submission"
  contextId={taskId}  // ← WRONG! Should be submissionId
  onUploaded={...}
/>

// ✅ CORRECT — Uses submissionId
<ProofUploader
  piUid={user.piUid}
  context="submission"
  contextId={submissionId}  // ← Comes from useSubmission hook
  onUploaded={(path) => setProofStoragePath(path)}
/>

// Result if wrong:
// - Upload succeeds but file stored in wrong path
// - Review page can't find proof
// - Feature silently breaks
```

### ⚠️ Pitfall 2: WalletModal Condition
```typescript
// ❌ WRONG — Modal shows only on click (after claim already started)
{showWalletModal && <WalletModal />}

// ✅ CORRECT — Modal shows if wallet is null, prevents claim attempt
{!walletAddress && (
  <WalletModal open={true} onClose={handleClose} />
)}

// Result if wrong:
// - User clicks claim → background API call starts
// - User doesn't see wallet warning
// - API rejects claim (wallet required)
// - User confused why claim failed
```

### ⚠️ Pitfall 3: Verification Code Display
```typescript
// ❌ WRONG — Doesn't handle null case
<VerificationDisplay code={verificationCode} />

// ✅ CORRECT — Only shows when code exists
{verificationCode && (
  <VerificationDisplay code={verificationCode} />
)}

// Result if wrong:
// - Empty box shows where code should be
// - User thinks code is loading
// - User skips adding code to proof
// - Employer claim code doesn't match
```

### ⚠️ Pitfall 4: Instruction File Download
```typescript
// ❌ WRONG — No conditional check
<a href={task.instructionFileUrl}>Download</a>

// ✅ CORRECT — Only shows if URL exists
{task?.instructionFileUrl && (
  <a href={task.instructionFileUrl} download>
    📥 Download {task.instructionFileName || 'Instructions'}
  </a>
)}

// Result if wrong:
// - Link shows but URL is undefined
// - User clicks → page adds "#undefined"
// - Feature breaks silently
```

### ⚠️ Pitfall 5: Mobile Overflow in ProofUploader
```typescript
// ❌ WRONG — Fixed widths, no mobile media query
<button style={{ width: '300px', padding: '1rem 2rem' }}>
  Upload your completed work (max 50MB)
</button>

// ✅ CORRECT — Responsive, uses SPACING tokens, stack on mobile
<button style={{
  width: '100%',
  padding: `${SPACING.md} ${SPACING.lg}`,
  fontSize: 'clamp(0.875rem, 2vw, 1rem)',
}}>
  Upload your work
</button>

// Result if wrong:
// - Desktop looks perfect
// - Mobile: button text overflows
// - User can't tap button on 320px width
```

### ⚠️ Pitfall 6: State Not Persisting Across Steps
```typescript
// ❌ WRONG — Multi-step form, state in component
const [step, setStep] = useState(0)
const [formData, setFormData] = useState({})

// If user goes Step 0 → 1 → back to 0:
// Component remounts → formData resets to {}

// ✅ CORRECT — Use React Context or URL state
const searchParams = useSearchParams()
const step = parseInt(searchParams.get('step') ?? '0')

// Or use Context:
const { formData, updateFormData } = useFormContext()

// Result if wrong:
// - User fills form → clicks next → clicks back
// - Previous answers are gone
// - Frustration: "Did it save?"
```

### ⚠️ Pitfall 7: Async Data Race in ProofInput
```typescript
// ❌ WRONG — Renders before task loads
<div>
  {task.proofType === 'FILE' && <ProofUploadZone />}
</div>

// Result: task is null → proofType is undefined → no error but no UI

// ✅ CORRECT — Wait for task
{task && (
  task.proofType === 'FILE' && <ProofUploadZone />
)}

// Or use loading state:
{loading ? <Skeleton /> : task?.proofType === 'FILE' && <ProofUploadZone />}

// Result if wrong:
// - Form section is blank until task loads
// - User thinks page is broken
// - User refreshes → same issue
```

### ⚠️ Pitfall 8: Error State Not Wired
```typescript
// ❌ WRONG — ProofUploader has error state, but parent doesn't show it
<ProofUploader onUploaded={...} />  // Error state trapped inside

// If upload fails, user sees nothing

// ✅ CORRECT — Error state bubbles to parent or flows through callback
const [uploadError, setUploadError] = useState(null)

<ProofUploader 
  onUploaded={(path) => setProofStoragePath(path)}
/>
{uploadError && (
  <div style={{ color: COLORS.red }}>
    {uploadError}
  </div>
)}

// Result if wrong:
// - Upload fails silently
// - User clicks submit with no file
// - API rejects → generic error
// - User doesn't know why file didn't upload
```

### ⚠️ Pitfall 9: Instruction File Upload Not Saved
```typescript
// ❌ WRONG — As we discovered in task-service.ts
const { error } = await supabaseAdmin
  .from('tasks')  // ← Lowercase! Wrong table name
  .update({ instructionFileUrl })
  .eq('id', taskId)

// Task creates, but instructionFileUrl never saved to database
// Workers can't see the file

// ✅ CORRECT — Use correct table name
const { error } = await supabaseAdmin
  .from('Task')   // ← Uppercase! Correct table
  .update({ instructionFileUrl })
  .eq('id', taskId)

// Result if wrong:
// - Employer uploads instruction file → looks like it worked
// - Worker views task → no download link
// - Feature broken silently (no error in console)
```

### ⚠️ Pitfall 10: WalletModal Navigation
```typescript
// ❌ WRONG — Modal close button doesn't navigate
<button onClick={onClose}>Add Wallet</button>

// User closes modal → back to claim button
// Still can't claim (still no wallet)

// ✅ CORRECT — Navigate to profile to add wallet
const router = useRouter()
<button onClick={() => router.push('/profile')}>
  Add Wallet Address
</button>

// Result if wrong:
// - User clicks "Add Wallet" modal
// - Modal closes
// - User still on task page
// - User confused: "How do I add wallet?"
```

---

## 9. Quick Reference: "Before You Deploy" Checklist

### Pre-Deployment Verification (Use Before Pushing)

```
CRITICAL CHECKS:
☐ Task fetches include instructionFileUrl + instructionFileName
☐ WalletModal shows when walletAddress === null
☐ ClaimButton triggers claim only if walletAddress is not null
☐ verificationCode displays in VerificationDisplay
☐ ProofUploader gets submissionId (not taskId) as contextId
☐ proofStoragePath flows from ProofUploader → to state → to submitProof call
☐ InstructionDownload only renders if instructionFileUrl exists
☐ Mobile tests pass on 320px, 768px, 1024px widths
☐ File uploads complete without silent failures
☐ Download links work (not 404s)

BUILD CHECKS:
☐ npm run build completes without errors
☐ No TypeScript errors from COLORS token changes
☐ No console warnings in browser DevTools
☐ No 404 errors for component imports

REGRESSION CHECKS:
☐ Old workflow still works (text submission, image submission)
☐ Previous submissions visible in review page
☐ Can still approve/reject submissions
☐ Wallet editing in profile still works
☐ Task creation still works end-to-end

API INTEGRATION:
☐ All 5 critical endpoints return correct data
☐ All state dependencies satisfied
☐ No timing race conditions
☐ Error handling shows user-friendly messages
```

---

## 10. Component State Reference

### TaskDetailPage State Map
```
┌─ FETCH STATES (from API) ──┐
│ task              ← stores task data
│ walletAddress     ← stores wallet or null
│ submissionStatus  ← 'claimed', 'submitted', etc.
└────────────────────────────┘
        ↓ used by ↓
    ProofInput, InstructionDownload,
    ClaimButton (enables/disables),
    WalletModal (shows if walletAddress === null)

┌─ HOOK STATES (from useSubmission) ──┐
│ isClaimed         ← bool: switches between claim/submit sections
│ verificationCode  ← string: displays in box
│ submissionId      ← guid: passed to ProofUploader
│ timeoutAt         ← ISO: used by countdown timer
│ isSubmitted       ← bool: hides form, shows confirmation
│ submitError       ← string: displays error message
└────────────────────────────────────┘
        ↓ used by ↓
    VerificationDisplay,
    ProofUploader,
    SubmitButton,
    Timer,
    ErrorDisplay

┌─ LOCAL STATES (from useState) ──┐
│ showWalletModal   ← bool: WalletModal.open
│ proofStoragePath  ← guid: from ProofUploader.onUploaded callback
│ proofContent      ← string: textarea or file URL
│ timeLeft          ← string: "5m 30s remaining" or "Expired"
└────────────────────────────────────┘
        ↓ used by ↓
    ProofInput (stores form value),
    SubmitButton (sends in POST body),
    Timer display
```

---

## 11. Debugging Guide

### "ProofUploader doesn't upload"
```
Check 1: Is contextId defined?
  const { submissionId } = useSubmission(...)
  <ProofUploader contextId={submissionId} />
  → If submissionId is null, claim first

Check 2: Is user authenticated?
  const { user } = usePiAuth()
  → If user is null, redirect to auth

Check 3: Is upload endpoint responding?
  Network tab → /api/proof/upload → Response status 200?
  → If 500, check server logs

Check 4: Did onUploaded callback fire?
  Add console.log in callback:
  <ProofUploader onUploaded={(path) => {
    console.log('Upload callback:', path)
    setProofStoragePath(path)
  }} />
  → If not logging, upload failed silently
```

### "Instruction file not showing for worker"
```
Check 1: Did employer upload instruction file?
  On /employer page, did upload succeed?
  → Check Network tab: /api/instructions/upload response

Check 2: Did instructionFileUrl save to database?
  Open database GUI, check Task table
  → Column instructionFileUrl has value?
  → If empty, bug in task-service.ts (table name might be wrong)

Check 3: Does API return instructionFileUrl?
  Network tab → GET /api/tasks/[taskId] → Response includes instructionFileUrl?
  → If missing, API route SELECT query wrong

Check 4: Does worker's TaskDetailPage render download section?
  {task?.instructionFileUrl && (
    <InstructionDownload ... />
  )}
  → Check if task object populated from API
```

### "Wallet modal not showing"
```
Check 1: Did profile API return walletAddress?
  Network tab → GET /api/profile
  → Response has walletAddress field?
  → If missing, profile endpoint issue

Check 2: Is walletAddress null or empty string?
  React DevTools → check state
  → If string but empty, your code treats "" as truthy
  → Use: if (!walletAddress || walletAddress.length === 0)

Check 3: Is modal condition correct?
  {!walletAddress && <WalletModal open={true} />}
  → Not: {showWalletModal && <WalletModal />}

Check 4: Does modal show when clicked?
  onClick={() => setShowWalletModal(true)}
  → Check React DevTools: is state changing?
```

### "Verification code doesn't display"
```
Check 1: Did claimSlot API return verificationCode?
  Network tab → POST /api/tasks/[taskId]/claim
  → Response includes verificationCode field?
  → If missing, claimSlot endpoint issue

Check 2: Is verificationCode state updated?
  React DevTools → useSubmission hook → verificationCode value?
  → If null, state wasn't set correctly

Check 3: Is component conditional correct?
  {verificationCode && (
    <VerificationDisplay code={verificationCode} />
  )}
  → Not just: <VerificationDisplay />

Check 4: Is component rendered in correct location?
  In submission form section, not above claim section
  → check: {isClaimed && verificationCode && ...}
```

---

## 12. Performance Considerations

### Render Optimization
```typescript
// ProofUploader renders frequently as files upload
// Wrap in React.memo to prevent re-renders when parent updates
export const ProofUploader = React.memo(function ProofUploader(props) {
  ...
})

// WalletModal is conditional, no memo needed

// ProofViewer displays large images, may cause jank
// Use:
<img 
  src={proofUrl}
  alt="proof"
  style={{ maxWidth: '100%', height: 'auto' }}
  loading="lazy"  // Don't load until visible
/>

// VerificationDisplay could be memo'd (doesn't change often)
export const VerificationDisplay = React.memo(...)
```

### API Call Optimization
```typescript
// Page load does 2 parallel fetches (good ✓)
Promise.all([
  fetch('/api/tasks/[taskId]'),
  fetch('/api/profile')
])

// useSubmission hook checks for existing submission on mount
// Consider caching in context to avoid re-fetches on route change
```

---

## 13. Security Considerations

### x-pi-uid Header
```
All API routes expect x-pi-uid header
├─ Verified by backend (supabaseAdmin checks User table)
├─ Should NOT trust client-side verification
└─ Always validate on server

Example attack if not validated:
User changes x-pi-uid header to someone else's ID
→ Could view/override another user's submissions
→ Backend MUST verify header matches authenticated user

✓ Currently verified in supabaseAdmin queries
```

### File Uploads
```
Proof files uploaded to Supabase Storage
├─ Stored in private bucket (cannot access without auth)
├─ Signed URLs expire after 1 hour
├─ File size limited to 50MB
└─ MIME type validated

If not validated:
→ User uploads 100MB file → Storage bloats
→ User uploads executable → Security risk
→ Attacker uploads someone else's file

Check: /api/proof/upload validates file size + type
```

---

## 14. Deployment Checklist

### Before Merging to Main
```
☐ All critical tests pass
☐ No TypeScript build errors
☐ Mobile layouts verified (320px, 768px, 1024px)
☐ API integration tests pass
☐ Error handling tested
☐ No console warnings in DevTools
☐ Performance profile checked (no jank on upload)
☐ Security headers verified
☐ Database queries optimized (no N+1)
☐ Git commits clean and squashed
```

### Before Pushing to Production
```
☐ Staging environment passes all tests
☐ Canary deployment to 10% of users succeeds
☐ Monitor error logs for 1 hour
☐ No spike in API 5xx errors
☐ No spike in failed uploads
☐ User feedback: uploads working?
☐ Revert plan ready (git tag, previous version built)
```

---

## 15. Contact/Escalation Points

### If Task Detail Page Breaks
```
File: src/app/task/[taskId]/page.tsx
Hooks: useSubmission, usePiAuth
Related APIs:
  - GET /api/tasks/[taskId]
  - POST /api/tasks/[taskId]/claim
  - POST /api/tasks/[taskId]/submit
Components: ProofUploader, WalletModal, ProofInput
```

### If Employer Task Creation Breaks
```
File: src/app/employer/page.tsx
Hook: useTaskCreation
Related APIs:
  - POST /api/instructions/upload
  - POST /api/tasks (after payment)
Context: PiPaymentContext
Components: ProofUploader (for instruction file), FeeBreakdown
Service: src/lib/services/task-service.ts → createTaskWithEscrow
```

### If Review Page Breaks
```
File: src/app/review/[taskId]/page.tsx
Related APIs:
  - GET /api/tasks/[taskId]/submissions
  - PATCH /api/tasks/[taskId]/submissions/[submissionId]
Components: ProofViewer
Interface: Needs proofStoragePath in submission response
```

---

## End of Document

**Last Updated:** April 1, 2026  
**Next Review:** After Visual Redesign Deployment  
**Maintainer:** Engineering Team

This document should be updated when:
- New pages added
- API endpoints added/changed
- Component dependencies change
- Breakage patterns discovered

**Use this document as your shield during the full redesign.**
