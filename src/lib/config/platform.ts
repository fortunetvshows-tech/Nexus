/**
 * Nexus Platform Configuration
 *
 * FINANCIAL CONSTANTS — change these to update platform economics.
 * All monetary values are in Pi (π).
 *
 * To update fees or limits:
 * 1. Edit the values below
 * 2. Run npm run build to verify no TypeScript errors
 * 3. Deploy — all RPCs, UI, and validation update automatically
 *
 * DO NOT hard-code any of these values elsewhere in the codebase.
 */
export const PLATFORM_CONFIG = {

  // ── Fee Structure ─────────────────────────────────────────────

  /**
   * Platform fee taken from each approved payout (0.05 = 5%)
   * Applied to worker payout: worker receives agreedReward * (1 - PLATFORM_FEE_RATE)
   */
  PLATFORM_FEE_RATE: 0.05,

  /**
   * Pi Network blockchain transaction fee per transfer (in Pi)
   * This fee is charged by the Pi blockchain, not by Nexus.
   * Deducted from worker payout at withdrawal time.
   * Source: Pi Network documentation — update if Pi changes this.
   */
  NETWORK_FEE_PI: 0.01,

  // ── Task Economics ────────────────────────────────────────────

  /**
   * Minimum reward per task slot (in Pi)
   * Must be high enough that worker payout after all fees is positive.
   * Formula: NETWORK_FEE_PI / (1 - PLATFORM_FEE_RATE) + buffer
   * At current values: 0.01 / 0.95 = ~0.0105π minimum viable
   * We set 0.20π floor for healthy economics and user trust.
   *
   * WHEN PI VALUE INCREASES: Lower this floor proportionally.
   * Example: If Pi = $10, consider floor of 0.05π (~$0.50 minimum task)
   */
  MIN_TASK_REWARD_PI: 0.20,

  /**
   * Maximum reward per task slot (in Pi)
   * Prevents accidental overpayment and limits escrow concentration risk.
   */
  MAX_TASK_REWARD_PI: 1000,

  /**
   * Maximum number of slots per task
   */
  MAX_TASK_SLOTS: 100,

  /**
   * Minimum number of slots per task
   */
  MIN_TASK_SLOTS: 1,

  // ── Payout Calculation Helpers ────────────────────────────────

  /**
   * Calculate the platform fee amount for a given reward
   */
  platformFee: (rewardPi: number): number => {
    return rewardPi * PLATFORM_CONFIG.PLATFORM_FEE_RATE
  },

  /**
   * Calculate worker gross payout (after platform fee, before network fee)
   */
  workerGrossPayout: (rewardPi: number): number => {
    return rewardPi * (1 - PLATFORM_CONFIG.PLATFORM_FEE_RATE)
  },

  /**
   * Calculate worker net payout (after all fees)
   */
  workerNetPayout: (rewardPi: number): number => {
    return rewardPi * (1 - PLATFORM_CONFIG.PLATFORM_FEE_RATE)
      - PLATFORM_CONFIG.NETWORK_FEE_PI
  },

  /**
   * Calculate total employer cost for a task
   * (reward × slots) — escrow locks this amount
   */
  totalEscrow: (rewardPi: number, slots: number): number => {
    return rewardPi * slots
  },

  /**
   * Validate a reward amount is within acceptable range
   */
  isValidReward: (rewardPi: number): {
    valid:   boolean
    reason?: string
  } => {
    if (rewardPi < PLATFORM_CONFIG.MIN_TASK_REWARD_PI) {
      return {
        valid:  false,
        reason: `Minimum reward is ${PLATFORM_CONFIG.MIN_TASK_REWARD_PI}π per slot`,
      }
    }
    if (rewardPi > PLATFORM_CONFIG.MAX_TASK_REWARD_PI) {
      return {
        valid:  false,
        reason: `Maximum reward is ${PLATFORM_CONFIG.MAX_TASK_REWARD_PI}π per slot`,
      }
    }
    return { valid: true }
  },

} as const
