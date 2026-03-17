'use client'

import { useCountUp } from '@/hooks/use-count-up'
import { COLORS, FONTS } from '@/lib/design/tokens'

interface EarningsCardProps {
  totalEarned:     number
  thisWeekEarned:  number
  pendingAmount:   number
}

export function EarningsCard({
  totalEarned,
  thisWeekEarned,
  pendingAmount,
}: EarningsCardProps) {
  const animatedTotal = useCountUp(totalEarned, 1200, 4)

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

      {/* Label */}
      <div style={{
        fontSize:      '0.65rem',
        fontWeight:    '600',
        color:         COLORS.textMuted,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.1em',
        marginBottom:  '0.75rem',
      }}>
        Total Earned
      </div>

      {/* Animated Pi amount */}
      <div
        className="earnings-amount"
        style={{
          fontFamily:    FONTS.mono,
          fontSize:      'clamp(2rem, 5vw, 2.75rem)',
          fontWeight:    '700',
          color:         COLORS.emerald,
          letterSpacing: '-0.03em',
          lineHeight:    1,
          marginBottom:  '0.5rem',
        }}
      >
        {animatedTotal}
        <span style={{
          fontSize:   '1.25rem',
          marginLeft: '4px',
          opacity:    0.7,
        }}>π</span>
      </div>

      {/* Divider */}
      <div style={{
        height:     '1px',
        background: 'var(--nexus-border)',
        margin:     '0.875rem 0',
      }} />

      {/* Sub stats */}
      <div style={{
        display: 'flex',
        gap:     '1.5rem',
        marginTop: 'auto',
      }}>
        <div>
          <div style={{
            fontSize:   '0.65rem',
            color:      COLORS.textMuted,
            fontWeight: '500',
            marginBottom: '3px',
            letterSpacing: '0.05em',
          }}>
            THIS WEEK
          </div>
          <div style={{
            fontFamily: FONTS.mono,
            fontSize:   '0.95rem',
            fontWeight: '600',
            color:      COLORS.textPrimary,
          }}>
            {thisWeekEarned.toFixed(4)}π
          </div>
        </div>
        <div>
          <div style={{
            fontSize:   '0.65rem',
            color:      COLORS.textMuted,
            fontWeight: '500',
            marginBottom: '3px',
            letterSpacing: '0.05em',
          }}>
            PENDING
          </div>
          <div style={{
            fontFamily: FONTS.mono,
            fontSize:   '0.95rem',
            fontWeight: '600',
            color:      COLORS.amber,
          }}>
            {pendingAmount.toFixed(4)}π
          </div>
        </div>
      </div>
    </div>
  )
}
