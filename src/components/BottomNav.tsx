'use client'

import { useState, useEffect } from 'react'
import Link     from 'next/link'
import { usePiAuth } from '@/hooks/use-pi-auth'
import { COLORS, FONTS, RADII } from '@/lib/design/tokens'

interface BottomNavProps {
  currentPage?: string
}

const NAV_ITEMS = [
  {
    key:   'feed',
    href:  '/feed',
    icon:  '⚡',
    label: 'Earn',
  },
  {
    key:   'dashboard',
    href:  '/dashboard',
    icon:  '📋',
    label: 'My Work',
  },
  {
    key:   'employer',
    href:  '/employer',
    icon:  '✚',
    label: 'Post',
  },
  {
    key:   'analytics',
    href:  '/analytics',
    icon:  '💰',
    label: 'Earnings',
  },
  {
    key:   'profile',
    href:  '/profile',
    icon:  '👤',
    label: 'Profile',
  },
]

export function BottomNav({ currentPage }: BottomNavProps) {
  const { user } = usePiAuth()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 769)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Only show for authenticated users on mobile
  if (!user || !isMobile) return null

  return (
    <>
      {/* Spacer so content is not hidden behind the nav */}
      <div style={{ height: '72px' }} className="bottom-nav-spacer" />

      {/* Bottom nav bar */}
      <nav style={{
        position:        'fixed' as const,
        bottom:          0,
        left:            0,
        right:           0,
        height:          '64px',
        background:      COLORS.bgSurface,
        borderTop:       `1px solid ${COLORS.border}`,
        display:         'flex',
        alignItems:      'stretch',
        zIndex:          200,
        paddingBottom:   'env(safe-area-inset-bottom)',
        backdropFilter:  'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)' as any,
      }}>
        {NAV_ITEMS.map(item => {
          const isActive = currentPage === item.key

          return (
            <Link
              key={item.key}
              href={item.href}
              style={{
                flex:           1,
                display:        'flex',
                flexDirection:  'column' as const,
                alignItems:     'center',
                justifyContent: 'center',
                gap:            '2px',
                textDecoration: 'none',
                color:          isActive
                  ? COLORS.indigo
                  : COLORS.textMuted,
                background:     'transparent',
                border:         'none',
                cursor:         'pointer',
                transition:     'color 0.15s ease',
                position:       'relative' as const,
                padding:        '8px 4px',
              }}
            >
              {/* Active indicator */}
              {isActive && (
                <div style={{
                  position:     'absolute' as const,
                  top:          0,
                  left:         '20%',
                  right:        '20%',
                  height:       '2px',
                  background:   COLORS.indigo,
                  borderRadius: '0 0 2px 2px',
                }} />
              )}

              {/* Post button — special styling */}
              {item.key === 'employer' ? (
                <div style={{
                  width:          '40px',
                  height:         '40px',
                  borderRadius:   '12px',
                  background:     `linear-gradient(135deg, ${COLORS.indigo}, #4338CA)`,
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  fontSize:       '1.2rem',
                  color:          'white',
                  boxShadow:      '0 2px 8px rgba(99,102,241,0.4)',
                  marginBottom:   '2px',
                  marginTop:      '-8px',
                }}>
                  {item.icon}
                </div>
              ) : (
                <span style={{
                  fontSize:   '1.2rem',
                  lineHeight: 1,
                }}>
                  {item.icon}
                </span>
              )}

              <span style={{
                fontSize:   '0.62rem',
                fontWeight: isActive ? '700' : '500',
                fontFamily: FONTS.sans,
                letterSpacing: '0.01em',
              }}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
