'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

interface BottomNavItem {
  href: string
  label: string
  icon: string
}

export function BottomNav() {
  const pathname = usePathname()
  const isAdminRoute = /^\/admin(\/|$)/.test(pathname)

  const items: BottomNavItem[] = [
    { href: '/dashboard', label: 'Home', icon: '⊞' },
    { href: '/feed', label: 'Discover', icon: '🔍' },
    { href: '/employer', label: 'Post', icon: '➕' },
    { href: '/my-tasks', label: 'Tasks', icon: '✓' },
    { href: '/profile', label: 'Profile', icon: '👤' },
  ]

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard' || pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-[100] border-t backdrop-blur-2xl ${
        isAdminRoute
          ? 'rounded-t-[32px] border-orange-300/20 bg-slate-950/90 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]'
          : 'border-white/10 bg-slate-950/80'
      }`}
      style={{ padding: '8px 0 max(env(safe-area-inset-bottom), 10px)' }}
    >
      <div className="mx-auto flex w-full max-w-3xl px-2">
      {items.map((item) => {
        const active = isActive(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide no-underline transition ${
              active
                ? isAdminRoute
                  ? 'bg-orange-300/15 text-orange-100'
                  : 'bg-cyan-300/15 text-cyan-100'
                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
            } motion-chip motion-press`}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 22 22"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              className={
                active
                  ? isAdminRoute
                    ? 'scale-110 drop-shadow-[0_0_8px_rgba(251,146,60,0.6)] transition'
                    : 'scale-110 drop-shadow-[0_0_8px_rgba(34,211,238,0.55)] transition'
                  : 'transition'
              }
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
      </div>
    </nav>
  )
}


