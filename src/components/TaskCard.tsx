'use client'

import Link from 'next/link'
import { COLORS, FONTS, RADII, SHADOWS, GRADIENTS, SPACING } from '@/lib/design/tokens'

interface TaskCardProps {
  task: {
    id:              string
    title:           string
    description:     string
    category:        string
    piReward:        number
    slotsRemaining:  number
    slotsAvailable:  number
    timeEstimateMin: number
    deadline:        string
    minReputationReq: number
    minBadgeLevel:   string
    isFeatured:      boolean
    tags:            string[]
    employer: {
      piUsername:      string
      reputationScore: number
      reputationLevel: string
    }
  }
  workerReputation?: number
}

const CATEGORY_ICONS: Record<string, string> = {
  'Survey & Research':  '📋',
  'App Testing':        '🔧',
  'Translation':        '🌐',
  'Audio Recording':    '🎙',
  'Photo Capture':      '📷',
  'Content Review':     '👁',
  'Data Labeling':      '🏷',
  'Micro-Consulting':   '💡',
  'Social Verification':'✓',
}

export function TaskCard({
  task,
  workerReputation = 0,
}: TaskCardProps) {

  const isEligible    = workerReputation >= task.minReputationReq
  const fillPct       = Math.round(
    ((task.slotsAvailable - task.slotsRemaining) / task.slotsAvailable) * 100
  )
  const deadlineDate  = new Date(task.deadline)
  const hoursLeft     = Math.max(
    0,
    Math.round((deadlineDate.getTime() - Date.now()) / 3600000)
  )
  const deadlineLabel = hoursLeft < 24
    ? `${hoursLeft}h left`
    : `${Math.round(hoursLeft / 24)}d left`

  return (
    <Link href={`/task/${task.id}`} style={{
      background:     `${GRADIENTS.card}, ${COLORS.bgSurface}`,
      border:         `1px solid ${COLORS.border}`,
      borderRadius:   RADII.xl,
      padding:        SPACING.xl,
      textDecoration: 'none',
      boxShadow:      SHADOWS.card,
      transition:     'all 0.2s ease',
      display:        'block',
      position:       'relative',
    }}>

      {/* Featured badge */}
      {task.isFeatured && (
        <div style={{
          position:     'absolute',
          top:          '-1px',
          right:        SPACING.lg,
          background:   GRADIENTS.indigo,
          color:        'white',
          fontSize:     '0.7rem',
          fontWeight:   '600',
          padding:      '0.2rem 0.6rem',
          borderRadius: '0 0 8px 8px',
          letterSpacing: '0.05em',
        }}>
          FEATURED
        </div>
      )}

      {/* Top row — category + reward */}
      <div style={{
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'flex-start',
        marginBottom:   SPACING.md,
      }}>
        <span style={{
          fontSize:     '0.72rem',
          fontWeight:   '600',
          color:        COLORS.indigoLight,
          background:   COLORS.indigoDim,
          border:       `1px solid rgba(99,102,241,0.2)`,
          padding:      '3px 10px',
          borderRadius: RADII.full,
          letterSpacing: '0.02em',
        }}>
          {task.category}
        </span>
        <span style={{
          fontFamily:  FONTS.mono,
          fontSize:    '1.1rem',
          fontWeight:  '700',
          color:       COLORS.emerald,
          letterSpacing: '-0.02em',
        }}>
          {task.piReward}π
        </span>
      </div>

      {/* Title */}
      <h3 style={{
        margin:       `0 0 ${SPACING.md}`,
        fontSize:     '0.95rem',
        fontWeight:   '600',
        color:        COLORS.textPrimary,
        lineHeight:   '1.4',
      }}>
        {task.title}
      </h3>

      {/* Divider */}
      <div style={{
        height:       '1px',
        background:   COLORS.border,
        margin:       `0 0 ${SPACING.md}`,
      }} />

      {/* Meta row */}
      <div style={{
        display:  'flex',
        gap:      SPACING.lg,
        fontSize: '0.775rem',
        color:    COLORS.textMuted,
      }}>
        <span>⏱ ~{task.timeEstimateMin}m</span>
        <span>👥 {task.slotsRemaining} left</span>
        <span style={{ marginLeft: 'auto', color: COLORS.textSecondary }}>
          {task.employer?.piUsername}
        </span>
      </div>
    </Link>
  )
}
