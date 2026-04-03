'use client'

import Link from 'next/link'
import { COLORS, FONTS, RADII, SPACING } from '@/lib/design/tokens'

interface RejectionCardProps {
  submissionId:    string
  taskId:          string
  taskTitle:       string
  taskCategory:    string
  reward:          number
  rejectionReason: string | null
  rejectedAt:      string
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60)  return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs  < 24)  return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function RejectionCard({
  submissionId,
  taskId,
  taskTitle,
  taskCategory,
  reward,
  rejectionReason,
  rejectedAt,
}: RejectionCardProps) {
  return (
    <div style={{
      background:   `linear-gradient(180deg, rgba(239,68,68,0.04) 0%, transparent 100%), ${COLORS.bgSurface}`,
      border:       `1px solid rgba(239,68,68,0.2)`,
      borderLeft:   `3px solid ${COLORS.red}`,
      borderRadius: RADII.lg,
      padding:      SPACING.lg,
      boxShadow:    '0 4px 24px rgba(0,0,0,0.3)',
      animation:    'fade-up 0.3s ease both',
    }}>

      {/* Header row */}
      <div style={{
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'flex-start',
        marginBottom:   SPACING.md,
      }}>
        <div style={{ flex: 1, minWidth: 0, marginRight: SPACING.md }}>
          <div style={{
            fontSize:     '0.875rem',
            fontWeight:   '600',
            color:        COLORS.textPrimary,
            marginBottom: '3px',
            overflow:     'hidden',
            textOverflow: 'ellipsis',
            whiteSpace:   'nowrap' as const,
          }}>
            {taskTitle}
          </div>
          <div style={{
            fontSize: '0.75rem',
            color:    COLORS.textMuted,
            display:  'flex',
            gap:      '0.5rem',
            flexWrap: 'wrap' as const,
          }}>
            <span>{taskCategory}</span>
            <span>·</span>
            <span style={{ fontFamily: FONTS.mono }}>{reward}π</span>
            <span>·</span>
            <span>{timeAgo(rejectedAt)}</span>
          </div>
        </div>

        {/* Status badge */}
        <span style={{
          padding:       '3px 10px',
          background:    COLORS.redDim,
          border:        `1px solid rgba(239,68,68,0.3)`,
          borderRadius:  RADII.full,
          fontSize:      '0.68rem',
          fontWeight:    '700',
          color:         COLORS.red,
          flexShrink:    0,
          letterSpacing: '0.03em',
          fontFamily:    FONTS.mono,
        }}>
          REJECTED
        </span>
      </div>

      {/* Employer feedback box */}
      <div style={{
        background:   COLORS.bgRaised,
        border:       `1px solid ${COLORS.border}`,
        borderRadius: RADII.md,
        padding:      `${SPACING.sm} ${SPACING.md}`,
        marginBottom: SPACING.md,
      }}>
        <div style={{
          fontSize:      '0.65rem',
          fontWeight:    '600',
          color:         COLORS.red,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.08em',
          marginBottom:  '6px',
          opacity:       0.8,
        }}>
          Employer Feedback
        </div>
        <div style={{
          fontSize:   '0.82rem',
          color:      rejectionReason ? COLORS.textSecondary : COLORS.textMuted,
          lineHeight: '1.5',
          fontStyle:  rejectionReason ? 'normal' : 'italic',
        }}>
          {rejectionReason ?? 'No reason provided by employer.'}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{
        display:             'grid',
        gridTemplateColumns: '1fr 1fr',
        gap:                 SPACING.sm,
      }}>
        <Link
          href={`/task/${taskId}`}
          style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            gap:            '6px',
            padding:        `${SPACING.sm} ${SPACING.md}`,
            background:     'rgba(99,102,241,0.1)',
            border:         `1px solid rgba(99,102,241,0.2)`,
            borderRadius:   RADII.md,
            fontSize:       '0.78rem',
            fontWeight:     '600',
            color:          COLORS.piLt,
            textDecoration: 'none',
            transition:     'all 0.15s ease',
          }}
        >
          ⚖ Dispute
        </Link>
        <Link
          href="/feed"
          style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            gap:            '6px',
            padding:        `${SPACING.sm} ${SPACING.md}`,
            background:     'transparent',
            border:         `1px solid ${COLORS.borderAccent}`,
            borderRadius:   RADII.md,
            fontSize:       '0.78rem',
            fontWeight:     '500',
            color:          COLORS.textSecondary,
            textDecoration: 'none',
            transition:     'all 0.15s ease',
          }}
        >
          Find Work →
        </Link>
      </div>
    </div>
  )
}


