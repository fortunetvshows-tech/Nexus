# MANIFEST — TB-002-R1
## Project: Nexus
## Task: Auth route bug fixes

### Bug 1 — FraudSignal null userId
- [x] uid mismatch handler no longer uses FraudSignal table
- [x] Mismatch logged to AdminAction with full metadata
- [x] No NOT NULL constraint violation possible
- [x] Fraud context (clientUid, serverUid, timestamp, ipAddress) stored in AdminAction.metadata

### Bug 2 — Banned check ordering
- [x] Existing user ban check happens BEFORE upsert
- [x] Query checks for accountStatus === 'banned' before upserting
- [x] Banned users never update lastLoginAt
- [x] Upsert only runs after ban check passes
- [x] Banned users return 403 ACCOUNT_BANNED error

### Test results
- [x] All original 8 tests still passing
  - 4 rate-limit tests (fail-open behavior)
  - 4 auth tests (missing creds, invalid token, uid mismatch, successful auth)
- [x] New banned account test added and passing
- [x] Total: 9 tests passing across 2 test suites

### Test output

```
> nexus@0.1.0 test
> jest

 PASS  src/__tests__/rate-limit.test.ts
  ● Console

    console.warn
      [Nexus:RateLimit] Upstash Redis not configured. Rate limiting is DISABLED. Set 
UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to enable in production.

 PASS  src/__tests__/auth.test.ts

Test Suites: 2 passed, 2 total
Tests:       9 passed, 9 total
Snapshots:   0 total
Time:        3.131 s
Ran all test suites.
```

### Adversarial confirmation

**Question**: Can a banned user update their lastLoginAt after this fix?

**Answer**: **No**. The server now queries the database for the existing user's accountStatus before calling upsert. If accountStatus === 'banned', it returns 403 immediately without touching any user record. The upsert is never executed, so lastLoginAt remains unchanged.

**Attack attempt details**: A banned user could still authenticate with Pi and receive a valid accessToken. They could send it to POST /api/auth. However:
1. Server calls Pi /me API — verifies token is valid ✓
2. Server cross-checks uid — matches server uid ✓
3. Server queries User WHERE piUid = ? — finds existing record with accountStatus: 'banned'
4. Server checks if accountStatus === 'banned' — TRUE
5. Server returns 403 ACCOUNT_BANNED immediately
6. Upsert never runs → lastLoginAt never updates
7. Banned status preserved

Security property confirmed: **Banned users cannot update their account metadata.**

### Implementation Changes

**src/app/api/auth/route.ts — Bug 1 fix**:
- Replaced FraudSignal insert with AdminAction insert
- AdminAction stores full fraud context in metadata JSONB
- adminId resolved via async query for system admin (defaults to null UUID if not found)
- Fraud audit trail preserved for security team investigation

**src/app/api/auth/route.ts — Bug 2 fix**:
- Added explicit ban check query BEFORE upsert
- Query: `.from('User').select('id, accountStatus').eq('piUid', piUser.uid).single()`
- Check: `if (existingUser?.accountStatus === 'banned') return 403`
- Upsert moved after ban check with updated comment

**src/__tests__/auth.test.ts**:
- Improved mock setup to handle complex chaining patterns
- mock supports: `.from().select().eq().limit().single().then()`
- mock supports: `.from().upsert().select().single()`
- Added test case: "returns 403 and does not upsert when account is banned"

### Test Coverage Summary

**rate-limit.test.ts** (4 tests):
- ✓ returns null when Upstash is not configured (fail-open)
- ✓ returns null for auth limiter when unconfigured
- ✓ returns null for taskCreation limiter when unconfigured
- ✓ returns null for approval limiter when unconfigured

**auth.test.ts** (5 tests):
- ✓ returns 400 when accessToken is missing
- ✓ returns 401 when Pi API rejects the token
- ✓ returns 401 when uid from client does not match Pi server
- ✓ returns 200 with user data on successful authentication
- ✓ returns 403 and does not upsert when account is banned

### Status

**REMEDIATION COMPLETE** — Both bugs fixed. All 9 tests passing. Ready for Lead Architect acceptance.
