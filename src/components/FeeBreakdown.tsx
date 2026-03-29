'use client'

import { PLATFORM_CONFIG } from '@/lib/config/platform'
import { COLORS, FONTS, RADII, SHADOWS, GRADIENTS, SPACING, statusStyle } from '@/lib/design/tokens'

interface FeeBreakdownProps {
  rewardPi:  number
  slots?:    number
  showFor:   'employer' | 'worker'
}

export function FeeBreakdown({
  rewardPi,
  slots = 1,
  showFor,
}: FeeBreakdownProps) {

  if (!rewardPi || rewardPi <= 0) return null

  const platformFee  = PLATFORM_CONFIG.platformFee(rewardPi)
  const workerGross  = PLATFORM_CONFIG.workerGrossPayout(rewardPi)
  const workerNet    = PLATFORM_CONFIG.workerNetPayout(rewardPi)
  const totalEscrow  = PLATFORM_CONFIG.totalEscrow(rewardPi, slots)
  const validation   = PLATFORM_CONFIG.isValidReward(rewardPi)

  if (showFor === 'employer') {
    return (
      <div style={{
        background:   COLORS.bgBase,
        border:       `1px solid ${validation.valid ? COLORS.border : COLORS.red}`,
        borderRadius: RADII.lg,
        padding:      '1rem',
        fontSize:     '0.85rem',
      }}>
        <div style={{
          fontWeight:   '600',
          color:        COLORS.textSecondary,
          marginBottom: '0.75rem',
          fontSize:     '0.75rem',
          textTransform: 'uppercase' as const,
          letterSpacing: '0.05em',
        }}>
          Cost Breakdown
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
          }}>
            <span style={{ color: COLORS.textMuted }}>
              Listed reward per slot
            </span>
            <span style={{ color: COLORS.textPrimary }}>
              {rewardPi.toFixed(4)}π
            </span>
          </div>

          <div style={{
            display: 'flex', justifyContent: 'space-between',
          }}>
            <span style={{ color: COLORS.textMuted }}>
              Platform fee ({(PLATFORM_CONFIG.PLATFORM_FEE_RATE * 100).toFixed(0)}%)
            </span>
            <span style={{ color: COLORS.red }}>
              -{platformFee.toFixed(4)}π
            </span>
          </div>

          <div style={{
            borderTop:  `1px solid ${COLORS.border}`,
            marginTop:  '0.4rem',
            paddingTop: '0.4rem',
            display:    'flex',
            justifyContent: 'space-between',
          }}>
            <span style={{ color: COLORS.emerald, fontWeight: '600' }}>
              Worker receives
            </span>
            <span style={{
              color:      COLORS.emerald,
              fontWeight: '700',
            }}>
              {workerNet.toFixed(4)}π
            </span>
          </div>

          {slots > 1 && (
            <div style={{
              display: 'flex', justifyContent: 'space-between',
            }}>
              <span style={{ color: COLORS.textMuted }}>
                × {slots} slots
              </span>
              <span style={{ color: COLORS.textPrimary }}>
                {totalEscrow.toFixed(4)}π
              </span>
            </div>
          )}

          <div style={{
            borderTop:  `1px solid ${COLORS.border}`,
            marginTop:  '0.4rem',
            paddingTop: '0.4rem',
            display:    'flex',
            justifyContent: 'space-between',
          }}>
            <span style={{ color: COLORS.textMuted }}>
              Total locked in escrow
            </span>
            <span style={{
              color:      COLORS.indigoLight,
              fontWeight: '700',
            }}>
              {totalEscrow.toFixed(4)}π
            </span>
          </div>
        </div>

        <div style={{
          marginTop:    '0.75rem',
          paddingTop:   '0.75rem',
          borderTop:    `1px solid ${COLORS.border}`,
          fontSize:     '0.75rem',
          color:        COLORS.textMuted,
        }}>
          <div style={{ marginBottom: '0.5rem' }}>
            Total you pay: <span style={{ fontWeight: '700', color: COLORS.textPrimary }}>
              {totalEscrow.toFixed(4)}π
            </span>
          </div>
          <div style={{ fontSize: '0.7rem', color: COLORS.textMuted }}>
            (Platform fee deducted from worker payment)
          </div>
        </div>

        {!validation.valid && (
          <div style={{
            marginTop:  '0.75rem',
            padding:    '0.5rem 0.75rem',
            background: COLORS.redDim,
            borderRadius: RADII.md,
            color:      COLORS.red,
            fontSize:   '0.8rem',
          }}>
            ⚠ {validation.reason}
          </div>
        )}
      </div>
    )
  }

  // Worker view
  return (
    <div style={{
      background:   COLORS.bgBase,
      border:       `1px solid ${COLORS.border}`,
      borderRadius: RADII.lg,
      padding:      '1rem',
      fontSize:     '0.85rem',
    }}>
      <div style={{
        fontWeight:    '600',
        color:         COLORS.textSecondary,
        marginBottom:  '0.75rem',
        fontSize:      '0.75rem',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em',
      }}>
        Your Payout
      </div>

      <div style={{
        display:       'flex',
        flexDirection: 'column',
        gap:           '0.4rem',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
        }}>
          <span style={{ color: COLORS.textMuted }}>Task reward</span>
          <span style={{ color: COLORS.textPrimary }}>
            {rewardPi.toFixed(4)}π
          </span>
        </div>

        <div style={{
          display: 'flex', justifyContent: 'space-between',
        }}>
          <span style={{ color: COLORS.textMuted }}>
            Platform fee ({(PLATFORM_CONFIG.PLATFORM_FEE_RATE * 100).toFixed(0)}%)
          </span>
          <span style={{ color: COLORS.red }}>
            -{platformFee.toFixed(4)}π
          </span>
        </div>

        <div style={{
          display: 'flex', justifyContent: 'space-between',
        }}>
          <span style={{ color: COLORS.textMuted }}>
            Network fee
          </span>
          <span style={{ color: COLORS.red }}>
            -{PLATFORM_CONFIG.NETWORK_FEE_PI.toFixed(4)}π
          </span>
        </div>

        <div style={{
          borderTop:  `1px solid ${COLORS.border}`,
          marginTop:  '0.4rem',
          paddingTop: '0.4rem',
          display:    'flex',
          justifyContent: 'space-between',
        }}>
          <span style={{
            color:      COLORS.emerald,
            fontWeight: '600',
          }}>
            You receive
          </span>
          <span style={{
            color:      COLORS.emerald,
            fontWeight: '700',
            fontSize:   '1rem',
          }}>
            {workerNet.toFixed(4)}π
          </span>
        </div>
      </div>
    </div>
  )
}
