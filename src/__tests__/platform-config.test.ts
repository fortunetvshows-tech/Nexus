import { PLATFORM_CONFIG } from '@/lib/config/platform'

describe('PLATFORM_CONFIG', () => {

  it('calculates platform fee correctly', () => {
    expect(PLATFORM_CONFIG.platformFee(1.00)).toBeCloseTo(0.05)
    expect(PLATFORM_CONFIG.platformFee(2.30)).toBeCloseTo(0.115)
    expect(PLATFORM_CONFIG.platformFee(0.20)).toBeCloseTo(0.01)
  })

  it('calculates worker gross payout correctly', () => {
    expect(PLATFORM_CONFIG.workerGrossPayout(1.00)).toBeCloseTo(0.95)
    expect(PLATFORM_CONFIG.workerGrossPayout(2.30)).toBeCloseTo(2.185)
  })

  it('calculates worker net payout correctly', () => {
    expect(PLATFORM_CONFIG.workerNetPayout(1.00)).toBeCloseTo(0.94)
    expect(PLATFORM_CONFIG.workerNetPayout(0.20)).toBeCloseTo(0.18)
  })

  it('calculates total escrow correctly', () => {
    expect(PLATFORM_CONFIG.totalEscrow(1.00, 3)).toBeCloseTo(3.00)
    expect(PLATFORM_CONFIG.totalEscrow(2.30, 5)).toBeCloseTo(11.50)
  })

  it('rejects rewards below minimum', () => {
    const result = PLATFORM_CONFIG.isValidReward(0.10)
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('0.2')
  })

  it('rejects rewards above maximum', () => {
    const result = PLATFORM_CONFIG.isValidReward(1001)
    expect(result.valid).toBe(false)
  })

  it('accepts valid rewards', () => {
    expect(PLATFORM_CONFIG.isValidReward(0.20).valid).toBe(true)
    expect(PLATFORM_CONFIG.isValidReward(1.00).valid).toBe(true)
    expect(PLATFORM_CONFIG.isValidReward(100).valid).toBe(true)
  })

  it('minimum reward produces positive net payout', () => {
    const netPayout = PLATFORM_CONFIG.workerNetPayout(
      PLATFORM_CONFIG.MIN_TASK_REWARD_PI
    )
    expect(netPayout).toBeGreaterThan(0)
  })
})
