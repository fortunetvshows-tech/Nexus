import { checkRateLimit } from '@/lib/rate-limit'
import { NextRequest } from 'next/server'

describe('checkRateLimit', () => {

  it('returns null when Upstash is not configured (fail-open)', async () => {
    const req = new NextRequest('http://localhost/api/test', {
      headers: { 'x-pi-uid': 'test_uid_001' },
    })
    const result = await checkRateLimit(req, 'submission')
    expect(result).toBeNull()
  })

  it('returns null for auth limiter when unconfigured', async () => {
    const req = new NextRequest('http://localhost/api/auth', {
      headers: { 'x-forwarded-for': '1.2.3.4' },
    })
    const result = await checkRateLimit(req, 'auth')
    expect(result).toBeNull()
  })

  it('returns null for taskCreation limiter when unconfigured', async () => {
    const req = new NextRequest('http://localhost/api/tasks', {
      headers: { 'x-pi-uid': 'test_uid_002' },
    })
    const result = await checkRateLimit(req, 'taskCreation')
    expect(result).toBeNull()
  })

  it('returns null for approval limiter when unconfigured', async () => {
    const req = new NextRequest('http://localhost/api/submissions/approve', {
      headers: { 'x-pi-uid': 'test_uid_003' },
    })
    const result = await checkRateLimit(req, 'approval')
    expect(result).toBeNull()
  })

})


