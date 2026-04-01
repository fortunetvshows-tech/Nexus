'use client'
import { COLORS, FONTS, RADII, SPACING } from '@/lib/design/tokens'

interface ReputationMiniCardProps {
  reputationScore: number
  reputationLevel: string
  kycLevel:        number
  tasksCompleted:  number
}

const LEVEL_COLORS: Record<string, string> = {
  'Newcomer':    '#9CA3AF',
  'Apprentice':  '#60A5FA',
  'Journeyman':  '#34D399',
  'Expert':      '#A78BFA',
  'Master':      '#F59E0B',
  'Sovereign':   '#F472B6',
}

const LEVEL_NEXT: Record<string, { next: string; required: number }> = {
  'Newcomer':   { next: 'Apprentice', required: 200  },
  'Apprentice': { next: 'Journeyman', required: 400  },
  'Journeyman': { next: 'Expert',     required: 600  },
  'Expert':     { next: 'Master',     required: 800  },
  'Master':     { next: 'Sovereign',  required: 1000 },
  'Sovereign':  { next: 'MAX',        required: 1000 },
}

export function ReputationMiniCard({
  reputationScore,
  reputationLevel,
  kycLevel,
  tasksCompleted,
}: ReputationMiniCardProps) {
  const color    = LEVEL_COLORS[reputationLevel] ?? COLORS.indigo
  const nextInfo = LEVEL_NEXT[reputationLevel]
  const progress = nextInfo
    ? Math.min((reputationScore / nextInfo.required) * 100, 100)
    : 100

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' as const }}>
      {/* Header */}
      <div style={{
        fontSize:      '0.65rem',
        fontWeight:    '700',
        color:         COLORS.textMuted,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.1em',
        marginBottom:  SPACING.md,
      }}>
        Your Reputation
      </div>

      {/* Level badge */}
      <div style={{
        display:      'flex',
        alignItems:   'center',
        gap:          SPACING.sm,
        marginBottom: SPACING.md,
      }}>
        <div style={{
          width:          '40px',
          height:         '40px',
          borderRadius:   RADII.md,
          background:     `${color}20`,
          border:         `1px solid ${color}40`,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          fontSize:       '1.2rem',
          flexShrink:     0,
        }}>
          {reputationLevel === 'Sovereign' ? '👑'
            : reputationLevel === 'Master'  ? '⭐'
            : reputationLevel === 'Expert'  ? '🔥'
            : reputationLevel === 'Journeyman' ? '💎'
            : reputationLevel === 'Apprentice' ? '🌱'
            : '🆕'}
        </div>
        <div>
          <div style={{
            fontSize:   '1rem',
            fontWeight: '700',
            color,
          }}>
            {reputationLevel}
          </div>
          <div style={{
            fontFamily: FONTS.mono,
            fontSize:   '0.75rem',
            color:      COLORS.textMuted,
          }}>
            {reputationScore} REP
          </div>
        </div>
      </div>

      {/* Progress to next level */}
      {nextInfo && nextInfo.next !== 'MAX' && (
        <div style={{ marginBottom: SPACING.md }}>
          <div style={{
            display:        'flex',
            justifyContent: 'space-between',
            fontSize:       '0.65rem',
            color:          COLORS.textMuted,
            marginBottom:   '4px',
          }}>
            <span>→ {nextInfo.next}</span>
            <span>{reputationScore}/{nextInfo.required}</span>
          </div>
          <div style={{
            height:       '4px',
            background:   COLORS.bgElevated,
            borderRadius: '2px',
            overflow:     'hidden',
          }}>
            <div style={{
              height:       '100%',
              width:        `${progress}%`,
              background:   color,
              borderRadius: '2px',
              transition:   'width 0.3s ease',
            }} />
          </div>
        </div>
      )}

      {/* Stats row */}
      <div style={{
        display:             'grid',
        gridTemplateColumns: '1fr 1fr',
        gap:                 SPACING.sm,
        marginTop:           'auto',
      }}>
        <div style={{
          padding:      SPACING.sm,
          background:   COLORS.bgElevated,
          borderRadius: RADII.md,
          textAlign:    'center' as const,
        }}>
          <div style={{
            fontFamily: FONTS.mono,
            fontSize:   '1rem',
            fontWeight: '700',
            color:      COLORS.textPrimary,
          }}>
            {tasksCompleted}
          </div>
          <div style={{
            fontSize: '0.62rem',
            color:    COLORS.textMuted,
            marginTop: '2px',
          }}>
            Tasks Done
          </div>
        </div>
        <div style={{
          padding:      SPACING.sm,
          background:   COLORS.bgElevated,
          borderRadius: RADII.md,
          textAlign:    'center' as const,
        }}>
          <div style={{
            fontSize:   '1rem',
            fontWeight: '700',
            color:      kycLevel >= 1 ? COLORS.emerald : COLORS.textMuted,
          }}>
            {kycLevel >= 2 ? '✓✓' : kycLevel >= 1 ? '✓' : '—'}
          </div>
          <div style={{
            fontSize: '0.62rem',
            color:    COLORS.textMuted,
            marginTop: '2px',
          }}>
            KYC L{kycLevel}
          </div>
        </div>
      </div>
    </div>
  )
}

