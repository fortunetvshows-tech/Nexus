import { NextRequest } from 'next/server'
import { POST } from '@/app/api/auth/route'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Mock supabaseAdmin with flexible chaining
jest.mock('@/lib/supabase-admin', () => {
  const createSelectChain = () => ({
    eq: jest.fn(function() {
      return {
        limit: jest.fn(function() {
          return {
            single: jest.fn(function() {
              return {
                then: jest.fn(function(cb) {
                  return cb({ data: { id: '00000000-0000-0000-0000-000000000000' } })
                }),
                data: null,
                error: null,
              }
            }),
            data: null,
            error: null,
          }
        }),
        single: jest.fn(() => ({
          data: null,
          error: null,
        })),
      }
    }),
  })

  const createUpsertChain = () => ({
    select: jest.fn(() => ({
      single: jest.fn(() => ({
        data: {
          id: 'test-uuid-001',
          piUid: 'test_pi_uid_001',
          piUsername: 'testpioneer',
          userRole: 'worker',
          reputationScore: 100,
          reputationLevel: 'Newcomer',
          kycLevel: 0,
          accountStatus: 'active',
        },
        error: null,
      })),
    })),
  })

  return {
    supabaseAdmin: {
      from: jest.fn((table) => {
        // Return different chains based on context
        if (table === 'User') {
          return {
            select: jest.fn(function(fields) {
              // If selecting with eq chain, return select chain
              return {
                eq: jest.fn(function() {
                  return {
                    limit: jest.fn(function() {
                      return {
                        single: jest.fn(function() {
                          return {
                            then: jest.fn(function(cb) {
                              return cb({ data: { id: '00000000-0000-0000-0000-000000000000' } })
                            }),
                            data: null,
                            error: null,
                          }
                        }),
                        data: null,
                        error: null,
                      }
                    }),
                    single: jest.fn(() => ({
                      data: null,
                      error: null,
                    })),
                  }
                }),
              }
            }),
            upsert: jest.fn(function() {
              return {
                select: jest.fn(() => ({
                  single: jest.fn(() => ({
                    data: {
                      id: 'test-uuid-001',
                      piUid: 'test_pi_uid_001',
                      piUsername: 'testpioneer',
                      userRole: 'worker',
                      reputationScore: 100,
                      reputationLevel: 'Newcomer',
                      kycLevel: 0,
                      accountStatus: 'active',
                    },
                    error: null,
                  })),
                })),
              }
            }),
            insert: jest.fn(() => ({ error: null })),
          }
        }
        
        // For AdminAction or other tables
        return {
          insert: jest.fn(() => ({ error: null })),
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({
                data: null,
                error: null,
              })),
            })),
          })),
        }
      }),
    },
  }
})

// Mock rate limiting — fail open in tests
jest.mock('@/lib/rate-limit', () => ({
  checkRateLimit: jest.fn(() => Promise.resolve(null)),
}))

// Mock Pi Platform API
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('POST /api/auth', () => {

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 400 when accessToken is missing', async () => {
    const req = new NextRequest('http://localhost/api/auth', {
      method: 'POST',
      body: JSON.stringify({ uid: 'test_uid' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('MISSING_CREDENTIALS')
  })

  it('returns 401 when Pi API rejects the token', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'invalid_token' }),
      text: () => Promise.resolve('invalid_token'),
    })

    const req = new NextRequest('http://localhost/api/auth', {
      method: 'POST',
      body: JSON.stringify({
        accessToken: 'invalid_token',
        uid: 'test_uid',
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('INVALID_ACCESS_TOKEN')
  })

  it('returns 401 when uid from client does not match Pi server', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        uid: 'server_uid_different',
        username: 'testpioneer',
        credentials: { scopes: ['username'] },
      }),
    })

    const req = new NextRequest('http://localhost/api/auth', {
      method: 'POST',
      body: JSON.stringify({
        accessToken: 'valid_token',
        uid: 'client_uid_different',
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('IDENTITY_MISMATCH')
  })

  it('returns 200 with user data on successful authentication', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        uid: 'test_pi_uid_001',
        username: 'testpioneer',
        credentials: { scopes: ['username', 'payments'] },
      }),
    })

    const req = new NextRequest('http://localhost/api/auth', {
      method: 'POST',
      body: JSON.stringify({
        accessToken: 'valid_token_001',
        uid: 'test_pi_uid_001',
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.user.piUid).toBe('test_pi_uid_001')
    expect(data.user.piUsername).toBe('testpioneer')
  })

  it('returns 403 and does not upsert when account is banned', async () => {
    // Mock Pi API returning valid user
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        uid: 'banned_user_uid',
        username: 'bannedpioneer',
        credentials: { scopes: ['username'] },
      }),
    })

    // Mock supabase calls: first for admin lookup in uid mismatch (won't be called),
    // then for ban check returning banned user
    const mockFromFn = supabaseAdmin.from as jest.Mock
    let callCount = 0
    
    mockFromFn.mockImplementation(() => {
      callCount++
      
      // For the existing user ban check call
      if (callCount === 1) {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({
                data: {
                  id: 'banned-uuid-001',
                  accountStatus: 'banned',
                },
                error: null,
              })),
            })),
          })),
          upsert: jest.fn(() => ({})),
          insert: jest.fn(() => ({ error: null })),
          from: jest.fn(() => ({})),
        }
      }
      
      // Default chain
      return {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: null,
              error: null,
            })),
          })),
        })),
        upsert: jest.fn(() => ({})),
        insert: jest.fn(() => ({ error: null })),
        from: jest.fn(() => ({})),
      }
    })

    const req = new NextRequest('http://localhost/api/auth', {
      method: 'POST',
      body: JSON.stringify({
        accessToken: 'valid_token_banned',
        uid: 'banned_user_uid',
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('ACCOUNT_BANNED')
  })

})


