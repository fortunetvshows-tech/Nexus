# MANIFEST — TB-001
## Project: Nexus
## Task: Project Initialization + Rate Limiting + Escrow Service Foundation

### Brief Compliance
- [x] Next.js 16.1.6 initialized with TypeScript, Tailwind, App Router
- [x] src/ directory structure confirmed
- [x] @upstash/ratelimit installed (v2.0.8)
- [x] @upstash/redis installed (v1.37.0)
- [x] @supabase/supabase-js installed (v2.99.1)
- [x] .env.local.example created
- [x] src/lib/supabase-admin.ts created
- [x] src/lib/rate-limit.ts created
- [x] All 4 limiters defined: submission, taskCreation, approval, auth
- [x] Window values match brief exactly:
  - submission: 10 requests / 1 minute per piUid
  - taskCreation: 5 requests / 1 minute per piUid
  - approval: 3 requests / 1 minute per piUid
  - auth: 20 requests / 1 minute per IP address
- [x] Fail-open behavior implemented and tested
- [x] Auth limiter uses IP identifier (req.ip or x-forwarded-for)
- [x] All other limiters use x-pi-uid header
- [x] src/lib/services/escrow-service.ts created
- [x] approveSubmission calls approve_submission_atomic RPC
- [x] rejectSubmission validates minimum 10-char reason
- [x] Both service functions log failures to AdminAction table
- [x] POST /api/submissions stub created with rate limit first
- [x] POST /api/tasks stub created with rate limit first
- [x] POST /api/submissions/approve stub created with rate limit first
- [x] POST /api/auth stub created with rate limit first
- [x] All 4 unit tests written
- [x] All 4 unit tests passing — npm test output attached

### Side Effects / Files Modified

**Files created:**
- src/__tests__/rate-limit.test.ts
- src/app/api/auth/route.ts
- src/app/api/submissions/route.ts
- src/app/api/submissions/approve/route.ts
- src/app/api/tasks/route.ts
- src/lib/rate-limit.ts
- src/lib/services/escrow-service.ts
- src/lib/supabase-admin.ts
- .env.local.example
- jest.config.ts
- jest.setup.ts

**Files modified (beyond Next.js defaults):**
- package.json: Added "test": "jest" to scripts

**Files deleted:** none

**Dependencies added:**
- @upstash/ratelimit: 2.0.8
- @upstash/redis: 1.37.0
- @supabase/supabase-js: 2.99.1
- jest: ^29 (dev)
- @testing-library/react: ^14 (dev)
- @testing-library/jest-dom: ^6 (dev)
- @types/jest: ^29 (dev)
- jest-environment-jsdom: ^29 (dev)

### Known Risks

1. **Upstash Redis Configuration**: Rate limiting is configured to fail OPEN (allow requests) when UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are not set. This allows local development without external services but should be monitored in production to ensure Redis is properly configured.

2. **ESM Module Transform**: Jest configuration set to testEnvironment: 'node' to support ESM packages (@upstash/redis, @upstash/ratelimit). This is appropriate for API route testing but uses Node environment instead of jsdom.

3. **Next.js SWC Cache**: NPM warned about missing SWC dependencies during Jest setup. Package-lock.json was patched automatically. Recommend running `npm install` again if any build issues arise.

4. **.env.local Protection**: The actual .env.local file (not .env.local.example) already exists with real credentials. This file was NOT modified per the brief instructions.

### Pending Action

**TB-002** should implement submission business logic in src/app/api/submissions/route.ts:
- Parse and validate submission payload
- Enforce rate limit check (already in place)
- Call escrow service functions or submission RPC as appropriate
- Return structured response with submission ID and status

**TB-003** should implement task creation business logic in src/app/api/tasks/route.ts:
- Parse and validate task creation payload
- Enforce rate limit check (already in place)
- Create task record via appropriate database function
- Return structured response with task ID

**TB-004** should wire the approveSubmission() function from escrow-service.ts in src/app/api/submissions/approve/route.ts:
- Extract employerId and qualityRating from request
- Call approveSubmission(submissionId, employerId, qualityRating)
- Return success/error response

**TB-005** should implement Pi Network SDK authentication in src/app/api/auth/route.ts:
- Verify Pi SDK signature
- Create or update user record
- Return auth token or session

### Test Output

```
> nexus@0.1.0 test
> jest --testNamePattern=checkRateLimit

  console.warn
    [Nexus:RateLimit] Upstash Redis not configured. Rate limiting is DISABLED. Set 
    UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to enable in production.

 PASS  src/__tests__/rate-limit.test.ts
  checkRateLimit
    √ returns null when Upstash is not configured (fail-open) (25 ms)
    √ returns null for auth limiter when unconfigured (4 ms)
    √ returns null for taskCreation limiter when unconfigured (2 ms)
    √ returns null for approval limiter when unconfigured (4 ms)

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
Snapshots:   0 total
Time:        2.53 s
Ran all test suites with tests matching "checkRateLimit".
```

### Project Structure

```
src/__tests__/rate-limit.test.ts
src/app/api/auth/route.ts
src/app/api/submissions/approve/route.ts
src/app/api/submissions/route.ts
src/app/api/tasks/route.ts
src/app/favicon.ico
src/app/globals.css
src/app/layout.tsx
src/app/page.tsx
src/lib/rate-limit.ts
src/lib/services/escrow-service.ts
src/lib/supabase-admin.ts
```

### Additional Verification

All required files are present per STEP 8 validation checklist:
- ✓ src/__tests__/rate-limit.test.ts
- ✓ src/app/api/auth/route.ts
- ✓ src/app/api/submissions/approve/route.ts
- ✓ src/app/api/submissions/route.ts
- ✓ src/app/api/tasks/route.ts
- ✓ src/lib/rate-limit.ts
- ✓ src/lib/services/escrow-service.ts
- ✓ src/lib/supabase-admin.ts

**Status**: COMPLETE — All steps executed in order per brief. No errors encountered. All tests passing. Ready for Lead Architect review.
