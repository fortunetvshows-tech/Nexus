'use client'

import Link from 'next/link'
import { COLORS, FONTS } from '@/lib/design/tokens'

interface ActivityItem {
  id:        string
  status:    string
  taskTitle: string
  reward:    number
  timeAgo:   string
}

interface ActivityFeedCardProps {
  submissions: ActivityItem[]
}

const STATUS_CONFIG: Record<string, { color: string; label: string; icon: string }> = {
  APPROVED:  { color: '#10B981', label: 'Approved',  icon: '✓' },
  REJECTED:  { color: '#EF4444', label: 'Rejected',  icon: '✗' },
  SUBMITTED: { color: '#F59E0B', label: 'Submitted', icon: '⏳' },
  DISPUTED:  { color: '#3B82F6', label: 'Disputed',  icon: '⚖' },
}

export function ActivityFeedCard({ submissions }: ActivityFeedCardProps) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

      <div style={{
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'center',
        marginBottom:   '0.875rem',
      }}>
        <div style={{
          fontSize:      '0.65rem',
          fontWeight:    '600',
          color:         COLORS.textMuted,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.1em',
        }}>
          Recent Activity
        </div>
        {submissions.length > 0 && (
          <div style={{
            width:        '6px',
            height:       '6px',
            borderRadius: '50%',
            background:   COLORS.emerald,
            boxShadow:    `0 0 6px ${COLORS.emerald}`,
            animation:    'pulse-glow 2s infinite',
          }} />
        )}
      </div>

      {submissions.length === 0 ? (
        <Link
          href="/feed"
          style={{
            flex:           1,
            display:        'flex',
            flexDirection:  'column',
            alignItems:     'center',
            justifyContent: 'center',
            color:          COLORS.textMuted,
            fontSize:       '0.8rem',
            gap:            '0.5rem',
            textDecoration: 'none',
          }}
        >
          <span style={{ fontSize: '1.5rem', opacity: 0.4 }}>📭</span>
          No earnings yet — find your first opportunity →
        </Link>
      ) : (
        <div style={{
          display:       'flex',
          flexDirection: 'column',
          gap:           '0.5rem',
          flex:          1,
          overflowY:     'auto',
        }}>
          {submissions.slice(0, 4).map((sub, idx) => {
            const config = STATUS_CONFIG[sub.status] ?? STATUS_CONFIG.SUBMITTED
            return (
              <div
                key={sub.id}
                style={{
                  display:     'flex',
                  alignItems:  'center',
                  gap:         '0.625rem',
                  padding:     '0.5rem 0',
                  borderBottom: idx < Math.min(submissions.length, 4) - 1
                    ? '1px solid var(--proofgrid-border)'
                    : 'none',
                  animation:   `fade-up 0.3s ease ${idx * 0.08}s both`,
                }}
              >
                {/* Status icon */}
                <div style={{
                  width:          '26px',
                  height:         '26px',
                  borderRadius:   '8px',
                  background:     `${config.color}15`,
                  border:         `1px solid ${config.color}30`,
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  fontSize:       '0.7rem',
                  color:          config.color,
                  flexShrink:     0,
                }}>
                  {config.icon}
                </div>

                {/* Task title */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize:     '0.78rem',
                    fontWeight:   '500',
                    color:        COLORS.textPrimary,
                    whiteSpace:   'nowrap',
                    overflow:     'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {sub.taskTitle}
                  </div>
                  <div style={{
                    fontSize: '0.68rem',
                    color:    COLORS.textMuted,
                    marginTop: '1px',
                  }}>
                    {sub.timeAgo}
                  </div>
                </div>

                {/* Reward */}
                <div style={{
                  fontFamily:  FONTS.mono,
                  fontSize:    '0.78rem',
                  fontWeight:  '600',
                  color:       sub.status === 'APPROVED'
                    ? COLORS.emerald
                    : COLORS.textMuted,
                  flexShrink:  0,
                }}>
                  {sub.reward.toFixed(3)}π
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}


