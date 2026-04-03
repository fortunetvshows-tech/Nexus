'use client'

import Link from 'next/link'
import { PLATFORM_CONFIG } from '@/lib/config/platform'
import {
  COLORS, FONTS, RADII, SPACING
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
  '🤖 AI & Data Labeling':  '#0095FF',
  '📍 Local Verification':  '#00D68F',
  '🌐 Translation':         '#FFB020',
  '📱 App Testing':         '#FF6B35',
  '✍️ Community & Content': '#A78BFA',
}

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? '#0095FF'
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
        style={{
          borderRadius: RADII.lg,
          marginBottom: '10px',
          cursor: 'pointer',
          border: `1px solid ${COLORS.border}`,
          background: COLORS.bgCard,
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.18s cubic-bezier(.4,0,.2,1)',
        }}
      >
        {/* Left accent bar */}
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '3px',
          borderRadius: '3px 0 0 3px',
          background: color,
        }} />

        {/* Main content */}
        <div style={{
          padding: '15px 15px 13px 18px',
        }}>
          {/* Top row — emoji + title + reward */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            marginBottom: '10px',
          }}>
            <span style={{
              fontSize: '24px',
              flexShrink: 0,
            }}>
              {task.category.charAt(0)}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: '14px',
                fontWeight: 700,
                color: COLORS.textPrimary,
                marginBottom: '4px',
              }}>
                {task.title}
              </div>
              <div style={{
                fontFamily: FONTS.display,
                fontSize: '24px',
                letterSpacing: '0.5px',
                color: '#38B2FF',
                fontWeight: 700,
              }}>
                {Math.max(0, PLATFORM_CONFIG.workerNetPayout(task.piReward)).toFixed(2)}π
              </div>
            </div>
          </div>

          {/* Meta row — chips */}
          <div style={{
            display: 'flex',
            gap: '6px',
            flexWrap: 'wrap',
            marginBottom: '12px',
          }}>
            <div style={{
              padding: '3px 9px',
              borderRadius: RADII.full,
              fontSize: '11px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
              background: 'rgba(0,149,255,0.13)',
              color: '#38B2FF',
              border: '1px solid rgba(0,149,255,0.22)',
            }}>
              {task.category}
            </div>
            <div style={{
              padding: '3px 9px',
              borderRadius: RADII.full,
              fontSize: '11px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
              background: 'rgba(255,255,255,0.05)',
              color: COLORS.textSecondary,
              border: `1px solid ${COLORS.border}`,
            }}>
              ~{task.timeEstimateMin}m
            </div>
            <div style={{
              padding: '3px 9px',
              borderRadius: RADII.full,
              fontSize: '11px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
              background: 'rgba(255,255,255,0.05)',
              color: COLORS.textSecondary,
              border: `1px solid ${COLORS.border}`,
            }}>
              {spotsLeft === 0 ? 'Full' : `${spotsLeft} slots`}
            </div>
          </div>

          {/* Action row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{
              fontSize: '12px',
              color: COLORS.textMuted,
            }}>
              {spotsLeft > 2
                ? `${task.slotsAvailable - spotsLeft} taken`
                : spotsLeft === 0
                ? '✗ Full'
                : `${spotsLeft} spot${spotsLeft > 1 ? 's' : ''} left`
              }
            </div>
            <div style={{
              padding: '6px 12px',
              background: spotsLeft === 0 ? COLORS.bgRaised : color,
              color: spotsLeft === 0 ? COLORS.textMuted : 'white',
              borderRadius: RADII.md,
              fontSize: '13px',
              fontWeight: '700',
              letterSpacing: '0.02em',
              whiteSpace: 'nowrap' as const,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}>
              {spotsLeft === 0 ? 'Full' : 'Claim →'}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}


