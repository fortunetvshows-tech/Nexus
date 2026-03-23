'use client'

import Link from 'next/link'
import { PLATFORM_CONFIG } from '@/lib/config/platform'
import {
  COLORS, FONTS, RADII, SHADOWS, SPACING
} from '@/lib/design/tokens'

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

// Map category to color for visual variety
const CATEGORY_COLORS: Record<string, string> = {
  '🤖 AI & Data Labeling':  '#6366F1',
  '📍 Local Verification':  '#10B981',
  '🌐 Translation':         '#F59E0B',
  '📱 App Testing':         '#EC4899',
  '✍️ Community & Content': '#8B5CF6',
}

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? '#6366F1'
}

export function TaskCard({
  task,
  workerReputation = 0,
}: TaskCardProps) {

  const color         = getCategoryColor(task.category)
  const spotsLeft     = task.slotsRemaining
  const isLastSpot    = spotsLeft === 1
  const isUrgent      = spotsLeft <= 2
  const deadlineDate  = new Date(task.deadline)
  const hoursLeft     = Math.max(
    0,
    Math.round((deadlineDate.getTime() - Date.now()) / 3600000)
  )
  const isExpiringSoon = hoursLeft < 24

  return (
    <Link
      href={`/task/${task.id}`}
      style={{
        display:        'block',
        textDecoration: 'none',
        position:       'relative' as const,
      }}
    >
      <div
        className="nexus-card"
        style={{
          borderLeft:  `4px solid ${color}`,
          padding:     SPACING.lg,
          transition:  'all 0.15s ease',
          cursor:      'pointer',
        }}
      >
        {/* Featured badge */}
        {task.isFeatured && (
          <div style={{
            position:     'absolute' as const,
            top:          '-1px',
            right:        SPACING.lg,
            background:   color,
            color:        'white',
            fontSize:     '0.62rem',
            fontWeight:   '700',
            padding:      '2px 8px',
            borderRadius: '0 0 6px 6px',
            letterSpacing: '0.08em',
          }}>
            FEATURED
          </div>
        )}

        {/* Row 1 — category + urgency signals */}
        <div style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          marginBottom:   SPACING.sm,
        }}>
          <span style={{
            fontSize:     '0.68rem',
            fontWeight:   '600',
            color:        color,
            background:   `${color}18`,
            border:       `1px solid ${color}30`,
            padding:      '2px 8px',
            borderRadius: RADII.full,
          }}>
            {task.category}
          </span>

          <div style={{
            display: 'flex',
            gap:     '6px',
            alignItems: 'center',
          }}>
            {isUrgent && (
              <span style={{
                fontSize:   '0.65rem',
                fontWeight: '700',
                color:      '#EF4444',
                background: 'rgba(239,68,68,0.1)',
                border:     '1px solid rgba(239,68,68,0.2)',
                padding:    '2px 6px',
                borderRadius: RADII.full,
              }}>
                {isLastSpot ? '🔥 Last spot' : `⚡ ${spotsLeft} spots left`}
              </span>
            )}
            {isExpiringSoon && !isUrgent && (
              <span style={{
                fontSize:   '0.65rem',
                fontWeight: '600',
                color:      '#F59E0B',
              }}>
                {hoursLeft}h left
              </span>
            )}
          </div>
        </div>

        {/* Row 2 — REWARD (biggest element) + time */}
        <div style={{
          display:        'flex',
          alignItems:     'baseline',
          gap:            '12px',
          marginBottom:   SPACING.sm,
        }}>
          <div>
            <div style={{
              fontFamily:    FONTS.mono,
              fontSize:      '2rem',
              fontWeight:    '800',
              color:         COLORS.emerald,
              letterSpacing: '-0.03em',
              lineHeight:    1,
            }}>
              {Math.max(0, PLATFORM_CONFIG.workerNetPayout(task.piReward)).toFixed(2)}π
            </div>
            <div style={{
              fontSize:   '0.68rem',
              color:      COLORS.textMuted,
              marginTop:  '2px',
              fontFamily: FONTS.sans,
            }}>
              after fees · listed {task.piReward}π
            </div>
          </div>
          <span style={{
            fontSize:   '0.82rem',
            color:      COLORS.textMuted,
            fontWeight: '500',
          }}>
            in ~{task.timeEstimateMin} min
          </span>
        </div>

        {/* Row 3 — Title */}
        <p style={{
          margin:     `0 0 ${SPACING.md}`,
          fontSize:   '0.9rem',
          fontWeight: '500',
          color:      COLORS.textSecondary,
          lineHeight: 1.4,
          overflow:   'hidden',
          display:    '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical' as any,
        }}>
          {task.title}
        </p>

        {/* Row 4 — action row */}
        <div style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
        }}>
          {/* Social proof */}
          <div style={{
            fontSize: '0.72rem',
            color:    COLORS.textMuted,
          }}>
            {spotsLeft > 2
              ? `${task.slotsAvailable - spotsLeft} Pioneers already in`
              : spotsLeft === 0
              ? '✗ Full'
              : `${spotsLeft} spot${spotsLeft > 1 ? 's' : ''} remaining`
            }
          </div>

          {/* Claim button */}
          <div style={{
            padding:      '6px 16px',
            background:   spotsLeft === 0 ? COLORS.bgElevated : color,
            color:        spotsLeft === 0 ? COLORS.textMuted : 'white',
            borderRadius: RADII.md,
            fontSize:     '0.78rem',
            fontWeight:   '700',
            letterSpacing: '0.02em',
            transition:   'all 0.15s ease',
            whiteSpace:   'nowrap' as const,
          }}>
            {spotsLeft === 0 ? 'Full' : 'Claim →'}
          </div>
        </div>
      </div>
    </Link>
  )
}
