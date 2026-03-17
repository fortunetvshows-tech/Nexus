'use client'

import Link             from 'next/link'
import { usePiAuth }    from '@/hooks/use-pi-auth'
import { NotificationBell } from '@/components/NotificationBell'
import { COLORS, FONTS, SHADOWS } from '@/lib/design/tokens'

interface NavigationProps {
  currentPage: 'home' | 'feed' | 'employer' | 'dashboard' | 'arbitrate' | 'analytics'
}

export function Navigation({ currentPage }: NavigationProps) {
  const { user, clearAuth } = usePiAuth()

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', key: 'dashboard' },
    { href: '/feed',      label: 'Find Work',  key: 'feed'      },
    { href: '/employer',  label: 'Post Task',  key: 'employer'  },
    { href: '/analytics', label: 'Analytics',  key: 'analytics' },
  ]

  if (user?.reputationLevel === 'Sovereign') {
    navItems.push({ href: '/arbitrate', label: '⚖ Arbitrate', key: 'arbitrate' })
  }

  return (
    <nav style={{
      position:         'fixed',
      top:              0,
      left:             0,
      right:            0,
      height:           '60px',
      background:       'rgba(15, 23, 42, 0.85)',
      backdropFilter:   'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom:     `1px solid ${COLORS.border}`,
      display:          'flex',
      alignItems:       'center',
      justifyContent:   'space-between',
      padding:          '0 1.5rem',
      zIndex:           100,
      fontFamily:       FONTS.sans,
    }}>

      {/* Brand */}
      <Link href="/dashboard" style={{
        fontSize:       '1.1rem',
        fontWeight:     '700',
        color:          COLORS.textPrimary,
        textDecoration: 'none',
        letterSpacing:  '-0.02em',
      }}>
        <span className="hide-mobile">Nexus</span>
        <span className="show-mobile" style={{ fontSize: '1rem', fontWeight: '700' }}>NX</span>
        <span style={{
          marginLeft:   '6px',
          fontSize:     '0.55rem',
          fontWeight:   '500',
          color:        COLORS.indigo,
          background:   COLORS.indigoDim,
          padding:      '2px 6px',
          borderRadius: '4px',
          verticalAlign: 'middle',
          letterSpacing: '0.05em',
        }}>
          BETA
        </span>
      </Link>

      {/* Nav links */}
      <div style={{ display: 'flex', gap: '2px' }}>
        {navItems.map(item => {
          const isActive = currentPage === item.key
          return (
            <Link
              key={item.key}
              href={item.href}
              className="nav-link"
              style={{
                padding:        '0.4rem 0.875rem',
                borderRadius:   '8px',
                fontSize:       '0.85rem',
                fontWeight:     isActive ? '600' : '400',
                textDecoration: 'none',
                color:          isActive
                                  ? COLORS.textPrimary
                                  : COLORS.textSecondary,
                background:     isActive
                                  ? 'rgba(255,255,255,0.06)'
                                  : 'transparent',
                transition:     'all 0.15s ease',
              }}
            >
              <span className="nav-label">{item.label}</span>
            </Link>
          )
        })}
      </div>

      {/* Right side */}
      {user && (
        <div style={{
          display:    'flex',
          alignItems: 'center',
          gap:        '0.75rem',
        }}>
          <NotificationBell piUid={user?.piUid} />
          <span style={{
            fontSize: '0.8rem',
            color:    COLORS.textSecondary,
          }}>
            {user.piUsername}
          </span>
          <div
            onClick={clearAuth}
            title="Sign out"
            style={{
              width:          '32px',
              height:         '32px',
              borderRadius:   '50%',
              background:     `linear-gradient(135deg, ${COLORS.indigo}, ${COLORS.indigoLight})`,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              fontSize:       '0.8rem',
              fontWeight:     '700',
              color:          'white',
              cursor:         'pointer',
              boxShadow:      SHADOWS.indigoGlow,
            }}
          >
            {user.piUsername.charAt(0).toUpperCase()}
          </div>
        </div>
      )}
    </nav>
  )
}
