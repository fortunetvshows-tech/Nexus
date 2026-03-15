# MANIFEST — TB-001-R1
## Project: Nexus
## Task: Remediation fixes

### Fix 1 — Dependency cleanup
- [x] @testing-library/react uninstalled
- [x] @testing-library/jest-dom uninstalled
- [x] jest-environment-jsdom uninstalled
- [x] jest.config.ts updated — testEnvironment: 'node' confirmed
- [x] jest.setup.ts updated — no browser globals, Node environment only
- [x] npm test passes after removal (all 4 tests passing)

### Fix 2 — Test script fixed
- [x] package.json test script is now "jest" with no flags
- [x] npm test:watch script added
- [x] npm lint script updated to "next lint"
- [x] All 4 tests pass with no --testNamePattern filter

### Test output after both fixes

```
> nexus@0.1.0 test
> jest

  console.warn
    [Nexus:RateLimit] Upstash Redis not configured. Rate limiting is DISABLED. Set UP
STASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to enable in production.           
      18 |
      19 | if (!isConfigured) {
    > 20 |   console.warn(
         |           ^
      21 |     '[Nexus:RateLimit] Upstash Redis not configured. ' +
      22 |     'Rate limiting is DISABLED. ' +
      23 |     'Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN ' +

      at Object.warn (src/lib/rate-limit.ts:20:11)
      at Object.<anonymous> (src/__tests__/rate-limit.test.ts:5:20)

 PASS  src/__tests__/rate-limit.test.ts
  checkRateLimit
    √ returns null when Upstash is not configured (fail-open) (32 ms)
    √ returns null for auth limiter when unconfigured (6 ms)
    √ returns null for taskCreation limiter when unconfigured (6 ms)
    √ returns null for approval limiter when unconfigured (4 ms)

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
Snapshots:   0 total
Time:        1.792 s, estimated 2 s
Ran all test suites.
```

### Updated package.json dependencies

**scripts:**
```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "test": "jest",
  "test:watch": "jest --watch"
}
```

**dependencies:**
```json
{
  "@supabase/supabase-js": "^2.99.1",
  "@upstash/ratelimit": "^2.0.8",
  "@upstash/redis": "^1.37.0",
  "next": "16.1.6",
  "react": "19.2.3",
  "react-dom": "19.2.3"
}
```

**devDependencies:**
```json
{
  "@tailwindcss/postcss": "^4",
  "@types/jest": "^30.0.0",
  "@types/node": "^20",
  "@types/react": "^19",
  "@types/react-dom": "^19",
  "eslint": "^9",
  "eslint-config-next": "16.1.6",
  "jest": "^30.3.0",
  "tailwindcss": "^4",
  "typescript": "^5"
}
```

### Changes from TB-001 Original

**jest.config.ts:**
- Removed `coverageProvider: 'v8'` (unnecessary for this project)
- Removed `setupFilesAfterEnv` reference (no longer needed)
- Simplified config — only `testEnvironment: 'node'` and `moduleNameMapper`

**jest.setup.ts:**
- Removed `import '@testing-library/jest-dom'` (not needed for Node environment)
- Added comment explaining Node environment is sufficient for API route testing

**package.json:**
- Removed: @testing-library/react, @testing-library/jest-dom, jest-environment-jsdom
- Changed lint script from `"eslint"` to `"next lint"` (standard Next.js convention)
- Added `"test:watch": "jest --watch"` script
- Jest devDependency updated to ^30.3.0 (from ^29)
- @types/jest updated to ^30.0.0 (from ^29)

### Known risks introduced by remediation

None. All 4 tests pass without filters. Node environment is appropriate for:
- Testing NextResponse handling
- Testing service functions (@upstash, @supabase imports)
- No browser-specific APIs required in current test suite

Removed packages were development-only and unnecessary for API route testing with Node environment.

### Verification Commands Run

1. `npm uninstall @testing-library/react @testing-library/jest-dom jest-environment-jsdom` — Success
2. Updated jest.config.ts and jest.setup.ts
3. `npm test -- --testNamePattern="checkRateLimit"` — All 4 tests pass
4. Updated package.json scripts
5. `npm test` (no flags) — All 4 tests pass, clean output

**Status**: REMEDIATION COMPLETE — Both fixes applied successfully. All tests passing. Ready for Lead Architect acceptance.
