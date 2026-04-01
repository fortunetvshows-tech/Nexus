import { claimTaskSlot, submitTaskProof } from '@/lib/services/submission-service'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Mock Supabase
jest.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: {
    rpc: jest.fn(),
  },
}))

describe('submission-service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('claimTaskSlot', () => {
    it('returns error when RPC call fails', async () => {
      const mockRpc = supabaseAdmin.rpc as jest.Mock
      mockRpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'RPC error' },
      })

      const result = await claimTaskSlot('task-1', 'worker-1')

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('returns success with reservationId when slot is claimed', async () => {
      const mockRpc = supabaseAdmin.rpc as jest.Mock
      const mockData = {
        success:        true,
        reservationId:  'res-123',
        timeoutAt:      '2025-03-15T10:05:00Z',
      }

      mockRpc.mockResolvedValueOnce({
        data: mockData,
        error: null,
      })

      const result = await claimTaskSlot('task-1', 'worker-1')

      expect(result.success).toBe(true)
      expect(result.reservationId).toBe(mockData.reservationId)
      expect(result.timeoutAt).toBe(mockData.timeoutAt)
    })

    it('returns NO_SLOTS_REMAINING error when no slots available', async () => {
      const mockRpc = supabaseAdmin.rpc as jest.Mock
      mockRpc.mockResolvedValueOnce({
        data: {
          success: false,
          error: 'NO_SLOTS_REMAINING',
        },
        error: null,
      })

      const result = await claimTaskSlot('task-1', 'worker-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('NO_SLOTS_REMAINING')
    })
  })

  describe('submitTaskProof', () => {
    it('returns MISSING_PROOF error when proof content is empty', async () => {
      const result = await submitTaskProof('task-1', 'worker-1', '', undefined, 'text')

      expect(result.success).toBe(false)
      expect(result.code).toBe('MISSING_PROOF')
    })

    it('returns success with submissionId when proof is valid', async () => {
      const mockRpc = supabaseAdmin.rpc as jest.Mock
      const mockData = {
        success:       true,
        submissionId:  'sub-456',
        autoApproveAt: '2025-03-16T10:00:00Z',
        agreedReward:  100,
      }

      mockRpc.mockResolvedValueOnce({
        data: mockData,
        error: null,
      })

      const result = await submitTaskProof(
        'task-1',
        'worker-1',
        'This is my proof content',
        undefined,
        'text'
      )

      expect(result.success).toBe(true)
      expect(result.submissionId).toBe(mockData.submissionId)
      expect(result.autoApproveAt).toBe(mockData.autoApproveAt)
      expect(result.agreedReward).toBe(mockData.agreedReward)
    })

    it('accepts file URL as valid proof', async () => {
      const mockRpc = supabaseAdmin.rpc as jest.Mock
      const mockData = {
        success:       true,
        submissionId:  'sub-789',
        autoApproveAt: '2025-03-16T10:00:00Z',
        agreedReward:  100,
      }

      mockRpc.mockResolvedValueOnce({
        data: mockData,
        error: null,
      })

      const result = await submitTaskProof(
        'task-1',
        'worker-1',
        '',
        'https://example.com/proof.pdf',
        'file'
      )

      expect(result.success).toBe(true)
      expect(result.submissionId).toBe(mockData.submissionId)
    })
  })
})

