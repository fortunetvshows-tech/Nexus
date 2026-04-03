import { fileDispute, runTier1Resolution }
  from '@/lib/services/dispute-service'

jest.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: {
    rpc:  jest.fn(),
    from: jest.fn((table) => {
      if (table === 'User') {
        // Mock for countEligibleArbitrators — return 3 Sovereign arbitrators
        return {
          select:    jest.fn(() => ({
            eq:        jest.fn(async () => ({
              data: [
                { id: 'arbitrator-1' },
                { id: 'arbitrator-2' },
                { id: 'arbitrator-3' },
              ],
              error: null,
            })),
          })),
        }
      }
      
      // Default mock for other tables
      return {
        select:    jest.fn(() => ({
          eq:        jest.fn(() => ({
            order:   jest.fn(() => ({
              limit: jest.fn(() => ({
                maybeSingle: jest.fn(() => ({
                  data: null, error: null,
                })),
              })),
            })),
          })),
        })),
        update:    jest.fn(() => ({
          eq:        jest.fn(async () => ({
            data: null, error: null,
          })),
        })),
        insert:    jest.fn(async () => ({
          data: null, error: null,
        })),
      }
    }),
  },
}))

describe('fileDispute', () => {
  it('returns error when reason is too short', async () => {
    const result = await fileDispute(
      'submission-uuid',
      'worker-uuid',
      'too short'
    )
    expect(result.success).toBe(false)
    expect(result.code).toBe('REASON_TOO_SHORT')
  })

  it('returns error when fields are missing', async () => {
    const result = await fileDispute('', 'worker-uuid', 'valid reason here')
    expect(result.success).toBe(false)
    expect(result.code).toBe('MISSING_FIELDS')
  })

  it('returns success when dispute is filed and tier1 runs', async () => {
    const { supabaseAdmin } = require('@/lib/supabase-admin')

    // Mock file_dispute RPC
    supabaseAdmin.rpc
      .mockResolvedValueOnce({
        data:  { success: true, disputeId: 'dispute-uuid-001' },
        error: null,
      })
      // Mock resolve_dispute_tier1 RPC
      .mockResolvedValueOnce({
        data: {
          success:    true,
          resolution: 'ESCALATE_TO_TIER2',
          checks:     { passed: 2, failed: 1 },
          passed:     2,
          failed:     1,
        },
        error: null,
      })
      // Mock select_arbitrators RPC (called when escalating to tier2)
      .mockResolvedValueOnce({
        data: {
          success:         true,
          arbitratorCount: 3,
          arbitrators:     ['arb-1', 'arb-2', 'arb-3'],
        },
        error: null,
      })

    const result = await fileDispute(
      'submission-uuid-001',
      'worker-uuid-001',
      'I followed all the instructions exactly as written in the task.'
    )

    expect(result.success).toBe(true)
    expect(result.disputeId).toBe('dispute-uuid-001')
    expect(result.resolution).toBe('ESCALATE_TO_TIER2')
  })

  it('handles tier 1 employer upheld result', async () => {
    const { supabaseAdmin } = require('@/lib/supabase-admin')

    supabaseAdmin.rpc
      .mockResolvedValueOnce({
        data:  { success: true, disputeId: 'dispute-uuid-002' },
        error: null,
      })
      .mockResolvedValueOnce({
        data: {
          success:    true,
          resolution: 'RESOLVED_EMPLOYER',
          checks:     { passed: 1, failed: 2 },
          passed:     1,
          failed:     2,
        },
        error: null,
      })

    const result = await fileDispute(
      'submission-uuid-002',
      'worker-uuid-002',
      'I followed all the instructions exactly as written in the task.'
    )

    expect(result.success).toBe(true)
    expect(result.resolution).toBe('RESOLVED_EMPLOYER')
  })
})


