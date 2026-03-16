'use client'

import Link from 'next/link'
import { usePiAuth } from '@/hooks/use-pi-auth'
import { NotificationBell } from '@/components/NotificationBell'

interface NavigationProps {
  currentPage: 'home' | 'feed' | 'employer' | 'dashboard' | 'arbitrate' | 'analytics'
}

export function Navigation({ currentPage }: NavigationProps) {
  const { user, clearAuth } = usePiAuth()

  const navItems = [
    { href: '/dashboard',  label: 'Dashboard', key: 'dashboard'  },
    { href: '/feed',       label: 'Find Work', key: 'feed'       },
    { href: '/employer',   label: 'Post Task', key: 'employer'   },
    { href: '/analytics',  label: 'Analytics', key: 'analytics'  },
  ]

  // Add Arbitrate link for Sovereign users only
  if (user?.reputationLevel === 'Sovereign') {
    navItems.push({
      href:  '/arbitrate',
      label: '⚖️ Arbitrate',
      key:   'arbitrate',
    })
  }

  return (
    <nav style={{
      position:        'fixed',
      top:             0,
      left:            0,
      right:           0,
      height:          '60px',
      background:      'rgba(15, 15, 15, 0.95)',
      backdropFilter:  'blur(10px)',
      borderBottom:    '1px solid #1f2937',
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'space-between',
      padding:         '0 1.5rem',
      zIndex:          100,
    }}>

      {/* Brand */}
      <Link href="/dashboard" style={{
        fontSize:            '1.2rem',
        fontWeight:          '700',
        background:          'linear-gradient(135deg, #7B3FE4, #A855F7)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        textDecoration:      'none',
      }}>
        Nexus
      </Link>

      {/* Nav links */}
      <div style={{ display: 'flex', gap: '0.25rem' }}>
        {navItems.map(item => (
          <Link
            key={item.key}
            href={item.href}
            style={{
              padding:          '0.4rem 0.9rem',
              borderRadius:     '8px',
              fontSize:         '0.875rem',
              textDecoration:   'none',
              color:            currentPage === item.key
                                  ? '#ffffff'
                                  : '#9ca3af',
              background:       currentPage === item.key
                                  ? '#1f2937'
                                  : 'transparent',
              fontWeight:       currentPage === item.key ? '500' : '400',
              transition:       'all 0.15s',
            }}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {/* User info */}
      {user && (
        <div style={{
          display:    'flex',
          alignItems: 'center',
          gap:        '0.75rem',
        }}>
          <NotificationBell piUid={user?.piUid} />
          <span style={{
            fontSize: '0.85rem',
            color:    '#9ca3af',
          }}>
            {user.piUsername}
          </span>
          <div style={{
            width:           '32px',
            height:          '32px',
            borderRadius:    '50%',
            background:      'linear-gradient(135deg, #7B3FE4, #A855F7)',
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            fontSize:        '0.85rem',
            fontWeight:      '600',
            color:           'white',
            cursor:          'pointer',
          }}
            onClick={clearAuth}
            title="Sign out"
          >
            {user.piUsername.charAt(0).toUpperCase()}
          </div>
        </div>
      )}
    </nav>
  )
}
