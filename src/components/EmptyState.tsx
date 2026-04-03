'use client'

import Link from 'next/link'
import { COLORS, FONTS, SPACING, RADII, GRADIENTS } from '@/lib/design/tokens'

interface EmptyStateProps {
  icon:     React.ReactNode  // emoji or SVG element
  title:    string
  subtitle: string
  action?:  { label: string; href: string }
}

export function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <div style={{
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        `${SPACING.xxxl} ${SPACING.xl}`,
      background:     `linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%), ${COLORS.bgSurface}`,
      border:         `1px solid ${COLORS.border}`,
      borderRadius:   RADII.xl,
      textAlign:      'center',
      fontFamily:     FONTS.sans,
    }}>
      {/* Soft glow icon container */}
      <div style={{
        width:          '64px',
        height:         '64px',
        borderRadius:   '20px',
        background:     'rgba(99, 102, 241, 0.08)',
        border:         '1px solid rgba(99, 102, 241, 0.15)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        fontSize:       '1.75rem',
        marginBottom:   SPACING.xl,
      }}>
        {icon}
      </div>

      <h3 style={{
        margin:       `0 0 ${SPACING.sm}`,
        fontSize:     '1rem',
        fontWeight:   '600',
        color:        COLORS.textPrimary,
        fontFamily:   FONTS.sans,
      }}>
        {title}
      </h3>

      <p style={{
        margin:     `0 0 ${action ? SPACING.xl : 0}`,
        fontSize:   '0.875rem',
        color:      COLORS.textSecondary,
        lineHeight: '1.6',
        maxWidth:   '260px',
      }}>
        {subtitle}
      </p>

      {action && (
        <Link
          href={action.href}
          style={{
            padding:        `${SPACING.sm} ${SPACING.xl}`,
            background:     GRADIENTS.indigo,
            color:          'white',
            borderRadius:   RADII.md,
            fontSize:       '0.875rem',
            fontWeight:     '600',
            textDecoration: 'none',
            fontFamily:     FONTS.sans,
          }}
        >
          {action.label}
        </Link>
      )}
    </div>
  )
}


