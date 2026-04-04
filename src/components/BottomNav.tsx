'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

interface BottomNavItem {
  href: string
  label: string
  icon: string
  pattern: RegExp
}

export function BottomNav() {
  const pathname = usePathname()

  const items: BottomNavItem[] = [
    { href: '/dashboard', label: 'Home', icon: '⊞', pattern: /^\/(dashboard)?$/ },
    { href: '/feed', label: 'Discover', icon: '🔍', pattern: /^\/feed/ },
    { href: '/employer', label: 'Post', icon: '➕', pattern: /^\/employer(\/|$)/ },
    { href: '/my-tasks', label: 'Tasks', icon: '✓', pattern: /^\/my-tasks/ },
    { href: '/profile', label: 'Profile', icon: '👤', pattern: /^\/profile/ },
  ]

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      background: 'rgba(11,13,20,0.95)',
      backdropFilter: 'blur(24px) saturate(1.4)',
      WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
      borderTop: '1px solid rgba(255,255,255,0.07)',
      display: 'flex',
      padding: '8px 0 max(env(safe-area-inset-bottom), 10px)',
    }}>
      {items.map((item) => {
        const isActive = item.pattern.test(pathname)
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              padding: '4px',
              cursor: 'pointer',
              color: isActive ? '#38B2FF' : '#454F64',
              fontSize: '10px',
              fontWeight: '600',
              letterSpacing: '0.6px',
              textTransform: 'uppercase',
              background: 'none',
              border: 'none',
              textDecoration: 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 22 22"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              style={{
                transform: isActive ? 'scale(1.1)' : 'scale(1)',
                filter: isActive ? 'drop-shadow(0 0 7px rgba(0,149,255,0.4))' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              {item.icon === '⊞' && (
                <rect x="2" y="2" width="8" height="8" rx="1" />
              )}
              {item.icon === '🔍' && (
                <>
                  <circle cx="9" cy="9" r="5" />
                  <line x1="14" y1="14" x2="20" y2="20" />
                </>
              )}
              {item.icon === '➕' && (
                <>
                  <line x1="11" y1="4" x2="11" y2="18" />
                  <line x1="4" y1="11" x2="18" y2="11" />
                </>
              )}
              {item.icon === '✓' && (
                <>
                  <polyline points="3 11 8 16 18 6" />
                </>
              )}
              {item.icon === '👤' && (
                <>
                  <circle cx="11" cy="6" r="4" />
                  <path d="M2 16c0-2.5 4-4 9-4s9 1.5 9 4v2H2v-2z" />
                </>
              )}
            </svg>
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}


