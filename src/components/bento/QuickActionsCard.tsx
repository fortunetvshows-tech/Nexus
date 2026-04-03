'use client'

import Link from 'next/link'
import { COLORS, FONTS } from '@/lib/design/tokens'

interface QuickAction {
  label:    string
  href:     string
  icon:     string
  color:    string
  dimColor: string
}

const ACTIONS: QuickAction[] = [
  {
    label:    'Find Opportunities',
    href:     '/feed',
    icon:     '⚡',
    color:    '#6366F1',
    dimColor: 'rgba(99,102,241,0.12)',
  },
  {
    label:    'Post Work',
    href:     '/employer',
    icon:     '📋',
    color:    '#10B981',
    dimColor: 'rgba(16,185,129,0.12)',
  },
  {
    label:    'My Earnings',
    href:     '/analytics',
    icon:     '💰',
    color:    '#F59E0B',
    dimColor: 'rgba(245,158,11,0.12)',
  },
]

export function QuickActionsCard() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

      <div style={{
        fontSize:      '0.65rem',
        fontWeight:    '600',
        color:         COLORS.textMuted,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.1em',
        marginBottom:  '0.875rem',
      }}>
        Quick Actions
      </div>

      <div style={{
        display:       'flex',
        flexDirection: 'column',
        gap:           '0.5rem',
        flex:          1,
      }}>
        {ACTIONS.map(action => (
          <Link
            key={action.href}
            href={action.href}
            style={{
              display:        'flex',
              alignItems:     'center',
              gap:            '0.75rem',
              padding:        '0.625rem 0.875rem',
              background:     action.dimColor,
              border:         `1px solid ${action.color}25`,
              borderRadius:   '10px',
              textDecoration: 'none',
              transition:     'all 0.15s ease',
            }}
          >
            <span style={{ fontSize: '1rem' }}>{action.icon}</span>
            <span style={{
              fontSize:   '0.85rem',
              fontWeight: '500',
              color:      COLORS.textPrimary,
            }}>
              {action.label}
            </span>
            <span style={{
              marginLeft: 'auto',
              color:      action.color,
              fontSize:   '0.8rem',
              opacity:    0.7,
            }}>
              →
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}


