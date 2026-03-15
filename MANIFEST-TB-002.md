# MANIFEST — TB-002
## Project: Nexus
## Task: Pi Network Authentication — Client + Server

### Brief Compliance
- [x] src/types/pi-sdk.d.ts created with all interface definitions
- [x] Window.Pi typed correctly — PiSDK interface with authenticate(), createPayment(), init()
- [x] PiAuthResult, PiPaymentData, PiPaymentCallbacks all typed
- [x] src/app/layout.tsx updated with Pi SDK script tags
- [x] Script src: https://sdk.minepi.com/pi-sdk.js
- [x] Pi.init() called with strategy="beforeInteractive"
- [x] sandbox flag reads from PI_SANDBOX env variable
- [x] src/app/api/auth/route.ts fully implemented
- [x] Rate limit check is first operation (auth limiter)
- [x] Pi /me API called for server-side verification at PI_API_BASE/v2/me
- [x] uid cross-check implemented — client uid vs server uid comparison
- [x] uid mismatch logged to FraudSignal table with score 0.95
- [x] User upserted on piUid conflict using ignoreDuplicates: false
- [x] lastLoginAt updated to current timestamp on every login
- [x] Banned account check before returning session (accountStatus === 'banned')
- [x] Returns 401 with ACCOUNT_BANNED error if banned
- [x] src/hooks/use-pi-auth.ts created
- [x] Hook is 'use client' component
- [x] Hook calls window.Pi.authenticate() client-side
- [x] Hook sends accessToken to /api/auth for verification
- [x] Hook never writes to database directly
- [x] Hook handles incompletePayment callback (logged as warning for TB-003)
- [x] Hook includes authenticate(), clearAuth(), and derived isAuthenticated state
- [x] src/__tests__/auth.test.ts created with 4 complete tests
- [x] Test 1: returns 400 when accessToken is missing
- [x] Test 2: returns 401 when Pi API rejects the token
- [x] Test 3: returns 401 when uid mismatch (spoofing attempted)
- [x] Test 4: returns 200 with user data on successful authentication
- [x] All 4 auth tests passing ✓
- [x] All 4 rate-limit tests still passing ✓
- [x] Total: 8 tests passing across 2 test suites ✓

### Side Effects / Files Modified

**Files created:**
- src/types/pi-sdk.d.ts
- src/hooks/use-pi-auth.ts
- src/__tests__/auth.test.ts

**Files modified:**
- src/app/layout.tsx — replaced with Pi SDK integration
- src/app/api/auth/route.ts — replaced with full authentication implementation

**Files deleted:** none

**New dependencies:** none — all packages already installed in TB-001 and TB-001-R1

### Known Risks

1. **Pi SDK Script Loading**: The Pi SDK loads via external script tag from https://sdk.minepi.com/pi-sdk.js. If this CDN is unavailable, Pi.authenticate() will fail with "Pi SDK not available" error. Mitigation: Error message guides users to open in Pi Browser where SDK is pre-loaded.

2. **sandbox=true in Development**: PI_SANDBOX environment variable controls sandbox mode. If not set to 'true' explicitly, defaults to false (production). During local development, test against sandbox to avoid real Pi transactions.

3. **FraudSignal Table**: uid mismatch attempts are logged to FraudSignal table with score 0.95. This table must exist in Supabase schema. Downstream fraud detection systems should monitor this signal.

4. **User Reputationmetrics**: Response returns reputationScore and reputationLevel, kycLevel from User table. These columns must exist and be initialized to sensible defaults (reputationScore=0, reputationLevel='Newcomer', kycLevel=0) in schema.

5. **Incomplete Payments Handling**: usePiAuth hook's incompletePayment callback only logs a warning. Full handling (marking as expired or re-offering payment) comes in TB-003. Users may see stale incomplete payments until that brief is complete.

### Adversarial Scenario Response

**Scenario**: A malicious actor obtains a valid accessToken from a legitimate user, then sends it to /api/auth with a spoofed uid (not matching the true uid).

**What happens**:
1. POST /api/auth receives { accessToken: "real_token_from_victim", uid: "attacker_uid" }
2. Server calls Pi /me API with Bearer token → Pi servers respond with actual user data { uid: "victim_uid", username: "victim" }
3. Server compares client uid "attacker_uid" !== server uid "victim_uid"
4. MISMATCH detected → Log to FraudSignal table with score 0.95
5. Return 401 IDENTITY_MISMATCH error
6. No User record is created or updated
7. No authentication session is granted to attacker

**Security layer**: The uid cross-check prevents token theft attacks. Even with a valid accessToken, an attacker cannot impersonate another user. The FraudSignal log creates an audit trail for fraud investigators to identify which accessTokens were compromised.

### Pending Action

**TB-003** — Task creation with Pi escrow payment initiation. This brief will:
- Implement POST /api/tasks with full task creation payload validation
- Call Pi.createPayment() client-side to initiate worker escrow hold
- Send paymentId to server for approval via immediate RPC
- Create Task record and fund EscrowLedger atomically
- Handle incomplete payment recovery (from incompletePayment callback in auth hook)

### Test Output

```
> nexus@0.1.0 test
> jest

 PASS  src/__tests__/rate-limit.test.ts
  ● Console

    console.warn
      [Nexus:RateLimit] Upstash Redis not configured. Rate limiting is DISABLED. Set 
UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to enable in production.

      18 |
      19 | if (!isConfigured) {
    > 20 |   console.warn(
         |           ^
      21 |     '[Nexus:RateLimit] Upstash Redis not configured. ' +
      22 |     'Rate limiting is DISABLED. ' +
      23 |     'Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN ' +

      at Object.warn (src/lib/rate-limit.ts:20:11)
      at Object.<anonymous> (src/__tests__/rate-limit.test.ts:5:20)

 PASS  src/__tests__/auth.test.ts

Test Suites: 2 passed, 2 total
Tests:       8 passed, 8 total
Snapshots:   0 total
Time:        5.327 s
Ran all test suites.
```

### Project Structure

```
src/__tests__/auth.test.ts
src/__tests__/rate-limit.test.ts
src/app/api/auth/route.ts
src/app/api/submissions/approve/route.ts
src/app/api/submissions/route.ts
src/app/api/tasks/route.ts
src/app/favicon.ico
src/app/globals.css
src/app/layout.tsx
src/app/page.tsx
src/hooks/use-pi-auth.ts
src/lib/rate-limit.ts
src/lib/services/escrow-service.ts
src/lib/supabase-admin.ts
src/types/pi-sdk.d.ts
```

### Implementation Details — Authentication Flow

**Client Side (use-pi-auth hook)**:
1. Component calls usePiAuth().authenticate()
2. Hook verifies window.Pi exists (or throws "Pi SDK not available" error)
3. Hook calls window.Pi.authenticate(['username', 'payments'])
4. Pi SDK displays user consent UI in Pi Browser
5. User approves → Pi SDK returns { accessToken, user: { uid, username } }
6. Hook sends POST /api/auth with accessToken and uid

**Server Side (/api/auth route)**:
1. Rate limit check (auth limiter: 20 req/min per IP)
2. Parse and validate request body
3. Call Pi /me API with Bearer accessToken
4. Verify response is ok, extract piUser
5. Cross-check client uid === piUser.uid
6. Upsert User record on piUid, update lastLoginAt
7. Check accountStatus !== 'banned'
8. Return 200 with verified user object

**Security Properties**:
- ✓ accessToken never stored in client localStorage (stays in memory only)
- ✓ accessToken never logged to FraudSignal or any other table
- ✓ uid mismatch attempts logged with score 0.95 for fraud detection
- ✓ Banned users rejected before any response data is returned
- ✓ All database writes use server supabaseAdmin client with full privileges
- ✓ Client receives only read-safe user metadata (id, piUid, piUsername, role, reputation, kycLevel)

### Test Coverage

**rate-limit.test.ts** (4 tests):
- ✓ returns null when Upstash is not configured (fail-open)
- ✓ returns null for auth limiter when unconfigured
- ✓ returns null for taskCreation limiter when unconfigured
- ✓ returns null for approval limiter when unconfigured

**auth.test.ts** (4 tests):
- ✓ returns 400 when accessToken is missing
- ✓ returns 401 when Pi API rejects the token
- ✓ returns 401 when uid from client does not match Pi server
- ✓ returns 200 with user data on successful authentication

**Status**: COMPLETE — All briefs executed in order. All compliance items checked. All tests passing. Ready for Lead Architect review.
