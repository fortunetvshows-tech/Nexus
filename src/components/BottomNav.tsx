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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-base/90 backdrop-blur-3xl border-t border-line flex items-center justify-around pb-safe">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => navigate(item.id)}
          className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 cursor-pointer transition-colors ${
            currentScreen === item.id ? 'text-pi-lt' : 'text-t3'
          }`}
        >
          <span className="text-2xl">{item.icon}</span>
          <span className="text-xs font-bold uppercase letter-spacing-1">{item.label}</span>
        </button>
      ))}
    </nav>
  )
}


