'use client'

import { useApp, ScreenName } from '@/context/AppContext'

interface BottomNavItem {
  id: ScreenName
  label: string
  icon: string
}

export function BottomNav() {
  const { currentScreen, navigate } = useApp()

  const items: BottomNavItem[] = [
    { id: 'dashboard', label: 'Home', icon: '⊞' },
    { id: 'discover', label: 'Discover', icon: '🔍' },
    { id: 'wallet', label: 'Wallet', icon: '💼' },
    { id: 'profile', label: 'Profile', icon: '👤' },
  ]

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      background: 'rgba(11,13,20,0.92)',
      backdropFilter: 'blur(24px) saturate(1.4)',
      WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
      borderTop: '1px solid rgba(255,255,255,0.07)',
      display: 'flex',
      padding: '8px 0 max(env(safe-area-inset-bottom), 10px)',
    }}>
      {items.map((item) => {
        const isActive = currentScreen === item.id
        return (
          <button
            key={item.id}
            onClick={() => navigate(item.id)}
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
              {item.icon === '💼' && (
                <>
                  <rect x="2" y="7" width="18" height="12" rx="1" />
                  <path d="M6 7V5a2 2 0 012-2h6a2 2 0 012 2v2" />
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
          </button>
        )
      })}
    </nav>
  )
}


