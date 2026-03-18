'use client'

import Link from 'next/link'
import { COLORS, FONTS, RADII, SPACING } from '@/lib/design/tokens'

interface DisputeItem {
  id:                string
  status:            string
  tier2VotesFor:     number
  tier2VotesAgainst: number
  resolvedInFavor:   string | null
  createdAt:         string
  submission: {
    id:   string
    task: {
      id:       string
      title:    string
      category: string
    } | null
  } | null
}

interface DisputeTrackerCardProps {
  disputes:  DisputeItem[]
  workerId:  string
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60)  return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs  < 24)  return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function DisputeStatusBadge({
  status,
  resolvedInFavor,
  workerId,
}: {
  status:          string
  resolvedInFavor: string | null
  workerId:        string
}) {
  if (status === 'resolved_worker' || resolvedInFavor === workerId) {
    return (
      <span style={{
        padding:      '3px 10px',
        background:   COLORS.emeraldDim,
        border:       `1px solid rgba(16,185,129,0.3)`,
        borderRadius: RADII.full,
        fontSize:     '0.68rem',
        fontWeight:   '700',
        color:        COLORS.emerald,
        fontFamily:   FONTS.mono,
        whiteSpace:   'nowrap' as const,
      }}>
        WON ✓
      </span>
    )
  }

  if (status === 'resolved_employer') {
    return (
      <span style={{
        padding:      '3px 10px',
        background:   COLORS.redDim,
        border:       `1px solid rgba(239,68,68,0.3)`,
        borderRadius: RADII.full,
        fontSize:     '0.68rem',
        fontWeight:   '700',
        color:        COLORS.red,
        fontFamily:   FONTS.mono,
        whiteSpace:   'nowrap' as const,
      }}>
        LOST
      </span>
    )
  }

  if (status === 'tier2_review' || status === 'tier3_review') {
    return (
      <span style={{
        padding:      '3px 10px',
        background:   COLORS.indigoDim,
        border:       `1px solid rgba(99,102,241,0.3)`,
        borderRadius: RADII.full,
        fontSize:     '0.68rem',
        fontWeight:   '700',
        color:        COLORS.indigoLight,
        fontFamily:   FONTS.mono,
        whiteSpace:   'nowrap' as const,
        animation:    'pulse-glow 2s infinite',
      }}>
        UNDER REVIEW
      </span>
    )
  }

  if (status === 'raised') {
    return (
      <span style={{
        padding:      '3px 10px',
        background:   COLORS.amberDim,
        border:       `1px solid rgba(245,158,11,0.3)`,
        borderRadius: RADII.full,
        fontSize:     '0.68rem',
        fontWeight:   '700',
        color:        COLORS.amber,
        fontFamily:   FONTS.mono,
        whiteSpace:   'nowrap' as const,
      }}>
        FILED
      </span>
    )
  }

  return (
    <span style={{
      padding:      '3px 10px',
      background:   'rgba(148,163,184,0.1)',
      border:       `1px solid ${COLORS.border}`,
      borderRadius: RADII.full,
      fontSize:     '0.68rem',
      fontWeight:   '600',
      color:        COLORS.textMuted,
      fontFamily:   FONTS.mono,
    }}>
      {status.toUpperCase()}
    </span>
  )
}

export function DisputeTrackerCard({ disputes, workerId }: DisputeTrackerCardProps) {

  const activeDisputes = disputes.filter(d =>
    !['resolved_worker', 'resolved_employer', 'closed_no_action'].includes(d.status)
  )

  if (disputes.length === 0) return null

  return (
    <div style={{
      display:       'flex',
      flexDirection: 'column',
      gap:           SPACING.sm,
    }}>
      {disputes.map((dispute, idx) => {
        const totalVotes = dispute.tier2VotesFor + dispute.tier2VotesAgainst
        const isActive   = activeDisputes.includes(dispute)

        return (
          <div
            key={dispute.id}
            style={{
              background:   isActive
                ? `linear-gradient(180deg, rgba(99,102,241,0.04) 0%, transparent 100%), ${COLORS.bgSurface}`
                : COLORS.bgSurface,
              border:       `1px solid ${isActive ? 'rgba(99,102,241,0.2)' : COLORS.border}`,
              borderLeft:   `3px solid ${
                dispute.status === 'resolved_worker' ? COLORS.emerald
                : dispute.status === 'resolved_employer' ? COLORS.red
                : COLORS.indigo
              }`,
              borderRadius: RADII.lg,
              padding:      SPACING.lg,
              animation:    `fade-up 0.3s ease ${idx * 0.08}s both`,
            }}
          >
            {/* Header */}
            <div style={{
              display:        'flex',
              justifyContent: 'space-between',
              alignItems:     'flex-start',
              marginBottom:   SPACING.sm,
            }}>
              <div style={{ flex: 1, minWidth: 0, marginRight: SPACING.md }}>
                <div style={{
                  fontSize:     '0.85rem',
                  fontWeight:   '600',
                  color:        COLORS.textPrimary,
                  marginBottom: '3px',
                  overflow:     'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace:   'nowrap' as const,
                }}>
                  {dispute.submission?.task?.title ?? 'Unknown task'}
                </div>
                <div style={{
                  fontSize: '0.72rem',
                  color:    COLORS.textMuted,
                  display:  'flex',
                  gap:      '0.5rem',
                }}>
                  <span>{dispute.submission?.task?.category}</span>
                  <span>·</span>
                  <span>{timeAgo(dispute.createdAt)}</span>
                </div>
              </div>
              <DisputeStatusBadge
                status={dispute.status}
                resolvedInFavor={dispute.resolvedInFavor}
                workerId={workerId}
              />
            </div>

            {/* Vote progress — show only during review */}
            {(dispute.status === 'tier2_review') && (
              <div style={{
                marginBottom: SPACING.sm,
              }}>
                <div style={{
                  fontSize:      '0.65rem',
                  color:         COLORS.textMuted,
                  marginBottom:  '6px',
                  fontWeight:    '500',
                  letterSpacing: '0.05em',
                }}>
                  PEER VOTES: {totalVotes}/3 cast
                </div>
                <div style={{
                  display:             'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap:                 '4px',
                }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      height:       '4px',
                      borderRadius: '2px',
                      background:   i < totalVotes
                        ? COLORS.indigo
                        : COLORS.bgElevated,
                      transition:   'background 0.3s',
                    }} />
                  ))}
                </div>
              </div>
            )}

            {/* Admin review notice */}
            {dispute.status === 'tier3_review' && (
              <div style={{
                padding:      `${SPACING.xs} ${SPACING.sm}`,
                background:   COLORS.amberDim,
                border:       `1px solid rgba(245,158,11,0.2)`,
                borderRadius: RADII.sm,
                fontSize:     '0.72rem',
                color:        COLORS.amber,
                marginBottom: SPACING.sm,
              }}>
                ⚠ Under admin review — not enough peer arbitrators available
              </div>
            )}

            {/* Resolution outcome */}
            {dispute.status === 'resolved_worker' && (
              <div style={{
                padding:      `${SPACING.xs} ${SPACING.sm}`,
                background:   COLORS.emeraldDim,
                border:       `1px solid rgba(16,185,129,0.2)`,
                borderRadius: RADII.sm,
                fontSize:     '0.72rem',
                color:        COLORS.emerald,
              }}>
                ✓ Dispute won — your submission has been re-queued for review
              </div>
            )}

            {dispute.status === 'resolved_employer' && (
              <div style={{
                padding:      `${SPACING.xs} ${SPACING.sm}`,
                background:   COLORS.redDim,
                border:       `1px solid rgba(239,68,68,0.2)`,
                borderRadius: RADII.sm,
                fontSize:     '0.72rem',
                color:        COLORS.red,
              }}>
                Dispute closed — employer decision upheld
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
