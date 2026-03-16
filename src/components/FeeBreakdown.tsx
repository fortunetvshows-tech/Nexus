'use client'

import { PLATFORM_CONFIG } from '@/lib/config/platform'

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
        background:   '#0f172a',
        border:       `1px solid ${validation.valid ? '#1f2937' : '#dc2626'}`,
        borderRadius: '10px',
        padding:      '1rem',
        fontSize:     '0.85rem',
      }}>
        <div style={{
          fontWeight:   '600',
          color:        '#9ca3af',
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
            <span style={{ color: '#6b7280' }}>
              Reward per slot
            </span>
            <span style={{ color: '#ffffff' }}>
              {rewardPi.toFixed(4)}π
            </span>
          </div>

          {slots > 1 && (
            <div style={{
              display: 'flex', justifyContent: 'space-between',
            }}>
              <span style={{ color: '#6b7280' }}>
                × {slots} slots
              </span>
              <span style={{ color: '#ffffff' }}>
                {totalEscrow.toFixed(4)}π
              </span>
            </div>
          )}

          <div style={{
            borderTop:  '1px solid #1f2937',
            marginTop:  '0.4rem',
            paddingTop: '0.4rem',
            display:    'flex',
            justifyContent: 'space-between',
          }}>
            <span style={{ color: '#6b7280' }}>
              Total locked in escrow
            </span>
            <span style={{
              color:      '#a78bfa',
              fontWeight: '700',
            }}>
              {totalEscrow.toFixed(4)}π
            </span>
          </div>
        </div>

        <div style={{
          marginTop:    '0.75rem',
          paddingTop:   '0.75rem',
          borderTop:    '1px solid #1f2937',
          fontSize:     '0.75rem',
          color:        '#4b5563',
        }}>
          Worker receives {workerGross.toFixed(4)}π per slot
          {' '}(after {(PLATFORM_CONFIG.PLATFORM_FEE_RATE * 100).toFixed(0)}% platform fee)
        </div>

        {!validation.valid && (
          <div style={{
            marginTop:  '0.75rem',
            padding:    '0.5rem 0.75rem',
            background: '#450a0a',
            borderRadius: '6px',
            color:      '#fca5a5',
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
      background:   '#0f172a',
      border:       '1px solid #1f2937',
      borderRadius: '10px',
      padding:      '1rem',
      fontSize:     '0.85rem',
    }}>
      <div style={{
        fontWeight:    '600',
        color:         '#9ca3af',
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
          <span style={{ color: '#6b7280' }}>Task reward</span>
          <span style={{ color: '#ffffff' }}>
            {rewardPi.toFixed(4)}π
          </span>
        </div>

        <div style={{
          display: 'flex', justifyContent: 'space-between',
        }}>
          <span style={{ color: '#6b7280' }}>
            Platform fee ({(PLATFORM_CONFIG.PLATFORM_FEE_RATE * 100).toFixed(0)}%)
          </span>
          <span style={{ color: '#f87171' }}>
            -{platformFee.toFixed(4)}π
          </span>
        </div>

        <div style={{
          display: 'flex', justifyContent: 'space-between',
        }}>
          <span style={{ color: '#6b7280' }}>
            Network fee
          </span>
          <span style={{ color: '#f87171' }}>
            -{PLATFORM_CONFIG.NETWORK_FEE_PI.toFixed(4)}π
          </span>
        </div>

        <div style={{
          borderTop:  '1px solid #1f2937',
          marginTop:  '0.4rem',
          paddingTop: '0.4rem',
          display:    'flex',
          justifyContent: 'space-between',
        }}>
          <span style={{
            color:      '#86efac',
            fontWeight: '600',
          }}>
            You receive
          </span>
          <span style={{
            color:      '#86efac',
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
