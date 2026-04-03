import { createTaskWithEscrow, getActiveTasks }
  from '@/lib/services/task-service'

jest.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: {
    rpc: jest.fn(),
    from: jest.fn((tableName: string) => {
      if (tableName === 'User') {
        // Mock for User table selects (used in both functions)
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({
                data: {
                  id:                  'worker-uuid-001',
                  reputationScore:     100,
                  kycLevel:            0,
                  preferredCategories: [],
                },
                error: null,
              })),
            })),
          })),
        }
      }
      if (tableName === 'Task') {
        // Mock for Task table selects (used in getActiveTasks)
        return {
          select: jest.fn(() => ({
            eq: jest.fn(function() { return this }),
            neq: jest.fn(function() { return this }),
            gt: jest.fn(function() { return this }),
            lte: jest.fn(function() { return this }),
            is: jest.fn(function() { return this }),
            order: jest.fn(function() { return this }),
            range: jest.fn(() => ({
              data:  [],
              error: null,
            })),
          })),
        }
      }
      // Default mock for Transaction table (for pi-payment-service)
      return {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: null,
              error: null,
            })),
          })),
        })),
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            data: null,
            error: null,
          })),
        })),
      }
    }),
  },
}))

const validInput = {
  employerId:      'employer-uuid-001',
  title:           'Test Survey Task',
  description:     'This is a test description with enough characters',
  instructions:    'Complete the survey and submit your answers here',
  category:        'Survey & Research',
  proofType:       'TEXT',
  piReward:        1.0,
  slotsAvailable:  5,
  timeEstimateMin: 10,
  deadlineHours:   168,
  minReputation:   100,
  minBadgeLevel:   'UNVERIFIED',
  targetKycLevel:  0,
  tags:            ['test', 'survey'],
}

describe('createTaskWithEscrow', () => {

  it('returns error when escrowTxid is missing', async () => {
    const result = await createTaskWithEscrow(validInput, '', 'payment-001')
    expect(result.success).toBe(false)
    expect(result.code).toBe('MISSING_PAYMENT_DETAILS')
  })

  it('returns error when piPaymentId is missing', async () => {
    const result = await createTaskWithEscrow(validInput, 'txid-001', '')
    expect(result.success).toBe(false)
    expect(result.code).toBe('MISSING_PAYMENT_DETAILS')
  })

  it('returns success when RPC succeeds', async () => {
    const { supabaseAdmin } = require('@/lib/supabase-admin')
    supabaseAdmin.rpc.mockResolvedValueOnce({
      data: {
        success:       true,
        taskId:        'task-uuid-001',
        totalEscrowed: 5.0,
        deadline:      '2026-03-22T00:00:00Z',
      },
      error: null,
    })

    const result = await createTaskWithEscrow(
      validInput,
      'txid-001',
      'payment-001'
    )

    expect(result.success).toBe(true)
    expect(result.taskId).toBe('task-uuid-001')
    expect(result.totalEscrowed).toBe(5.0)
  })

  it('returns error when RPC fails', async () => {
    const { supabaseAdmin } = require('@/lib/supabase-admin')
    supabaseAdmin.rpc.mockResolvedValueOnce({
      data:  null,
      error: { message: 'RPC error' },
    })

    const result = await createTaskWithEscrow(
      validInput,
      'txid-001',
      'payment-001'
    )

    expect(result.success).toBe(false)
    expect(result.code).toBe('RPC_FAILED')
  })

})

describe('getActiveTasks', () => {

  it('returns empty array when no tasks exist', async () => {
    const { tasks, error } = await getActiveTasks('worker-uuid-001')
    expect(tasks).toEqual([])
    expect(error).toBeNull()
  })

})


