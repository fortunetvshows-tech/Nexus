import { selectArbitrators, castVote }
  from '@/lib/services/arbitration-service'

jest.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: {
    rpc: jest.fn(),
  },
}))

describe('selectArbitrators', () => {
  it('returns error when no eligible arbitrators', async () => {
    const { supabaseAdmin } = require('@/lib/supabase-admin')
    supabaseAdmin.rpc.mockResolvedValueOnce({
      data:  { success: false, error: 'NO_ELIGIBLE_ARBITRATORS' },
      error: null,
    })

    const result = await selectArbitrators('dispute-uuid-001')
    expect(result.success).toBe(false)
    expect(result.code).toBe('NO_ELIGIBLE_ARBITRATORS')
  })

  it('returns success with arbitrator count', async () => {
    const { supabaseAdmin } = require('@/lib/supabase-admin')
    supabaseAdmin.rpc.mockResolvedValueOnce({
      data: {
        success:         true,
        arbitratorCount: 3,
        arbitrators:     ['arb-1', 'arb-2', 'arb-3'],
      },
      error: null,
    })

    const result = await selectArbitrators('dispute-uuid-001')
    expect(result.success).toBe(true)
    expect(result.arbitratorCount).toBe(3)
  })
})

describe('castVote', () => {
  it('returns error when reasoning too short', async () => {
    const result = await castVote(
      'dispute-uuid-001',
      'arbitrator-uuid-001',
      'worker',
      'short'
    )
    expect(result.success).toBe(false)
    expect(result.code).toBe('REASONING_TOO_SHORT')
  })

  it('returns success when vote is cast', async () => {
    const { supabaseAdmin } = require('@/lib/supabase-admin')
    supabaseAdmin.rpc.mockResolvedValueOnce({
      data: {
        success:       true,
        votesWorker:   2,
        votesEmployer: 1,
        totalArbs:     3,
        resolved:      true,
      },
      error: null,
    })

    const result = await castVote(
      'dispute-uuid-001',
      'arbitrator-uuid-001',
      'worker',
      'The worker followed all instructions correctly.'
    )
    expect(result.success).toBe(true)
    expect(result.resolved).toBe(true)
  })
})
