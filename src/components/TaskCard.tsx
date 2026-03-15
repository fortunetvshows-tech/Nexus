'use client'

import Link from 'next/link'

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
    <div style={{
      background:    '#111827',
      border:        `1px solid ${task.isFeatured ? '#7B3FE4' : '#1f2937'}`,
      borderRadius:  '16px',
      padding:       '1.25rem',
      position:      'relative',
      transition:    'border-color 0.2s',
    }}>

      {/* Featured badge */}
      {task.isFeatured && (
        <div style={{
          position:     'absolute',
          top:          '-1px',
          right:        '1rem',
          background:   'linear-gradient(135deg, #7B3FE4, #A855F7)',
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

      {/* Header row */}
      <div style={{
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'flex-start',
        marginBottom:   '0.75rem',
      }}>
        <div style={{ flex: 1, marginRight: '1rem' }}>
          <div style={{
            display:     'flex',
            alignItems:  'center',
            gap:         '0.5rem',
            marginBottom: '0.3rem',
          }}>
            <span style={{ fontSize: '1rem' }}>
              {CATEGORY_ICONS[task.category] ?? '📌'}
            </span>
            <span style={{
              fontSize:    '0.75rem',
              color:       '#6b7280',
              fontWeight:  '500',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              {task.category}
            </span>
          </div>
          <h3 style={{
            margin:     '0',
            fontSize:   '1rem',
            fontWeight: '600',
            color:      '#ffffff',
            lineHeight: '1.4',
          }}>
            {task.title}
          </h3>
        </div>

        {/* Pi reward — most prominent number */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{
            fontSize:   '1.5rem',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #7B3FE4, #A855F7)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor:  'transparent',
            lineHeight: '1',
          }}>
            {task.piReward}π
          </div>
          <div style={{
            fontSize: '0.7rem',
            color:    '#6b7280',
            marginTop: '0.2rem',
          }}>
            per slot
          </div>
        </div>
      </div>

      {/* Description */}
      <p style={{
        margin:     '0 0 1rem',
        fontSize:   '0.875rem',
        color:      '#9ca3af',
        lineHeight: '1.6',
        display:    '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow:   'hidden',
      }}>
        {task.description}
      </p>

      {/* Stats row */}
      <div style={{
        display:       'flex',
        gap:           '1rem',
        marginBottom:  '1rem',
        flexWrap:      'wrap',
      }}>
        {[
          { label: 'Time',     value: `~${task.timeEstimateMin}min` },
          { label: 'Slots',    value: `${task.slotsRemaining} left` },
          { label: 'Deadline', value: deadlineLabel                 },
          { label: 'Min Rep',  value: task.minReputationReq.toString() },
        ].map(stat => (
          <div key={stat.label} style={{ textAlign: 'center' }}>
            <div style={{
              fontSize:   '0.75rem',
              color:      '#6b7280',
              marginBottom: '0.1rem',
            }}>
              {stat.label}
            </div>
            <div style={{
              fontSize:   '0.85rem',
              fontWeight: '500',
              color:      '#e5e7eb',
            }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Slot fill progress bar */}
      <div style={{
        background:   '#1f2937',
        borderRadius: '9999px',
        height:       '4px',
        marginBottom: '1rem',
        overflow:     'hidden',
      }}>
        <div style={{
          height:       '100%',
          width:        `${fillPct}%`,
          background:   'linear-gradient(90deg, #7B3FE4, #A855F7)',
          borderRadius: '9999px',
          transition:   'width 0.3s',
        }} />
      </div>

      {/* Footer row */}
      <div style={{
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'center',
      }}>
        {/* Employer info */}
        <div style={{
          fontSize: '0.78rem',
          color:    '#6b7280',
        }}>
          by{' '}
          <span style={{ color: '#9ca3af', fontWeight: '500' }}>
            {task.employer.piUsername}
          </span>
          {' · '}
          <span style={{ color: '#7B3FE4' }}>
            {task.employer.reputationLevel}
          </span>
        </div>

        {/* Claim button / link */}
        {isEligible ? (
          <Link
            href={`/task/${task.id}`}
            style={{
              padding:        '0.5rem 1.25rem',
              background:     'linear-gradient(135deg, #7B3FE4, #A855F7)',
              color:          'white',
              borderRadius:   '8px',
              fontSize:       '0.875rem',
              fontWeight:     '500',
              cursor:         'pointer',
              whiteSpace:     'nowrap',
              textDecoration: 'none',
              display:        'inline-block',
            }}
          >
            Claim Slot
          </Link>
        ) : (
          <span style={{
            padding:      '0.5rem 1.25rem',
            background:   '#374151',
            color:        'white',
            borderRadius: '8px',
            fontSize:     '0.875rem',
            fontWeight:   '500',
            whiteSpace:   'nowrap',
            display:      'inline-block',
            opacity:      0.6,
          }}>
            Need {task.minReputationReq} rep
          </span>
        )}
      </div>
    </div>
  )
}
