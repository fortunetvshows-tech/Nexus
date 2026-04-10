'use client'

import { usePathname } from 'next/navigation'
import { BottomNav } from './BottomNav'

const AUTH_ONLY_ROUTES_PREFIX = [
  '/dashboard',
  '/feed',
  '/profile',
  '/task',
  '/employer',
  '/admin',
  '/analytics',
  '/review',
  '/my-tasks',
  '/arbitrate',
  '/worker',
  '/referral',
]

export function ConditionalNav() {
  const pathname = usePathname()
  
  // Show BottomNav only on authenticated routes
  const showNav = AUTH_ONLY_ROUTES_PREFIX.some(
    prefix => pathname.startsWith(prefix)
  )
  
  if (!showNav) return null
  
  return <BottomNav />
}
