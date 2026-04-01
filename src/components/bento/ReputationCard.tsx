'use client'

import { COLORS, FONTS } from '@/lib/design/tokens'

interface ReputationCardProps {
  reputationScore: number
  reputationLevel: string
  kycLevel:        number
}

const LEVEL_COLORS: Record<string, string> = {
  Newcomer:    '#94A3B8',
  Apprentice:  '#60A5FA',
  Journeyman:  '#34D399',
  Expert:      '#A78BFA',
  Master:      '#F59E0B',
  Sovereign:   '#F0B429',
}

const LEVEL_MAX: Record<string, number> = {
  Newcomer:   200,
  Apprentice: 500,
  Journeyman: 1000,
  Expert:     2000,
  Master:     5000,
  Sovereign:  10000,
}

export function ReputationCard({
  reputationScore,
  reputationLevel,
  kycLevel,
}: ReputationCardProps) {
  const color   = LEVEL_COLORS[reputationLevel] ?? COLORS.textSecondary
  const max     = LEVEL_MAX[reputationLevel]    ?? 1000
  const pct     = Math.min((reputationScore / max) * 100, 100)

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

      <div style={{
        fontSize:      '0.65rem',
        fontWeight:    '600',
        color:         COLORS.textMuted,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.1em',
        marginBottom:  '0.75rem',
      }}>
        Reputation
      </div>

      {/* Level badge */}
      <div style={{
        display:      'inline-flex',
        alignItems:   'center',
        gap:          '6px',
        padding:      '4px 10px',
        background:   `${color}18`,
        border:       `1px solid ${color}40`,
        borderRadius: '9999px',
        marginBottom: '0.875rem',
        alignSelf:    'flex-start',
      }}>
        <div style={{
          width:        '6px',
          height:       '6px',
          borderRadius: '50%',
          background:   color,
          boxShadow:    `0 0 6px ${color}`,
        }} />
        <span style={{
          fontSize:   '0.75rem',
          fontWeight: '600',
          color,
          fontFamily: FONTS.mono,
        }}>
          {reputationLevel}
        </span>
      </div>

      {/* Score */}
      <div style={{
        fontFamily:    FONTS.mono,
        fontSize:      '1.75rem',
        fontWeight:    '700',
        color:         COLORS.textPrimary,
        letterSpacing: '-0.02em',
        marginBottom:  '0.875rem',
      }}>
        {reputationScore.toLocaleString()}
      </div>

      {/* Progress bar */}
      <div style={{
        background:   'var(--nexus-bg-elevated)',
        borderRadius: '9999px',
        height:       '5px',
        overflow:     'hidden',
        marginBottom: '0.5rem',
      }}>
        <div style={{
          height:       '100%',
          width:        `${pct}%`,
          background:   `linear-gradient(90deg, ${color}, ${color}aa)`,
          borderRadius: '9999px',
          transition:   'width 1s ease',
        }} />
      </div>

      <div style={{
        fontSize: '0.7rem',
        color:    COLORS.textMuted,
        display:  'flex',
        justifyContent: 'space-between',
      }}>
        <span>{reputationScore} REP</span>
        <span>{max} to next</span>
      </div>

      {/* KYC */}
      <div style={{
        marginTop:  'auto',
        paddingTop: '0.875rem',
        display:    'flex',
        alignItems: 'center',
        gap:        '6px',
      }}>
        <span style={{
          fontSize:   '0.65rem',
          color:      COLORS.textMuted,
          fontWeight: '500',
          letterSpacing: '0.05em',
        }}>
          KYC
        </span>
        {[0, 1, 2].map(lvl => (
          <div key={lvl} style={{
            width:        '20px',
            height:       '4px',
            borderRadius: '2px',
            background:   lvl < kycLevel
              ? COLORS.emerald
              : lvl === kycLevel
              ? COLORS.amber
              : 'var(--nexus-bg-elevated)',
            transition:   'background 0.3s',
          }} />
        ))}
        <span style={{
          fontSize:   '0.7rem',
          color:      COLORS.textSecondary,
          fontFamily: FONTS.mono,
        }}>
          L{kycLevel}
        </span>
      </div>
    </div>
  )
}

