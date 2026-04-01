'use client'

import { COLORS, FONTS } from '@/lib/design/tokens'

interface StatsRowCardProps {
  label:    string
  value:    string | number
  subValue?: string
  color?:   string
  icon?:    string
}

export function StatsRowCard({
  label,
  value,
  subValue,
  color = COLORS.textPrimary,
  icon,
}: StatsRowCardProps) {
  return (
    <div style={{
      height:        '100%',
      display:       'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    }}>
      <div style={{
        display:    'flex',
        alignItems: 'center',
        gap:        '0.5rem',
      }}>
        {icon && (
          <span style={{ fontSize: '1rem', opacity: 0.7 }}>{icon}</span>
        )}
        <div style={{
          fontSize:      '0.65rem',
          fontWeight:    '600',
          color:         COLORS.textMuted,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.1em',
        }}>
          {label}
        </div>
      </div>

      <div>
        <div style={{
          fontFamily:    FONTS.mono,
          fontSize:      '1.6rem',
          fontWeight:    '700',
          color,
          letterSpacing: '-0.02em',
          lineHeight:    1,
          marginBottom:  subValue ? '4px' : 0,
        }}>
          {value}
        </div>
        {subValue && (
          <div style={{
            fontSize: '0.72rem',
            color:    COLORS.textMuted,
          }}>
            {subValue}
          </div>
        )}
      </div>
    </div>
  )
}

