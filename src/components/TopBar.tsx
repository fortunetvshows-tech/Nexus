'use client'

import Link               from 'next/link'
import { useState, useEffect } from 'react'
import { usePiAuth }      from '@/hooks/use-pi-auth'
import { COLORS, FONTS, RADII } from '@/lib/design/tokens'

export function TopBar() {
  const { user } = usePiAuth()
  const [earned,  setEarned]  = useState<number>(0)
  const [pending, setPending] = useState<number>(0)
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => { setHasMounted(true) }, [])

  useEffect(() => {
    if (!user?.piUid || !hasMounted) return

    fetch(`${window.location.origin}/api/analytics/worker`, {
      headers: { 'x-pi-uid': user.piUid },
    })
      .then(r => r.json())
      .then(data => {
        if (data) {
          setEarned(Number(data.totalEarned  ?? 0))
          setPending(Number(data.pendingEarnings ?? data.pendingAmount ?? 0))
        }
      })
      .catch(() => {})
  }, [user?.piUid, hasMounted])

  if (!hasMounted) return (
    <header style={{
      position:        'fixed' as const,
      top:             0,
      left:            0,
      right:           0,
      height:          '60px',
      background:      'rgba(10, 10, 15, 0.85)',
      backdropFilter:  'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)' as any,
      borderBottom:    '1px solid rgba(255,255,255,0.06)',
      zIndex:          300,
      display:         'flex',
      alignItems:      'center',
      padding:         '0 1rem',
    }}>
      <span style={{
        fontFamily:    FONTS.mono,
        fontSize:      '1.1rem',
        fontWeight:    '800',
        color:         COLORS.textPrimary,
        letterSpacing: '-0.02em',
      }}>
        Nexus
      </span>
    </header>
  )

  return (
    <header style={{
      position:        'fixed' as const,
      top:             0,
      left:            0,
      right:           0,
      height:          '60px',
      background:      'rgba(10, 10, 15, 0.85)',
      backdropFilter:  'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)' as any,
      borderBottom:    '1px solid rgba(255,255,255,0.06)',
      zIndex:          300,
      display:         'flex',
      alignItems:      'center',
      padding:         '0 1rem',
      gap:             '12px',
    }}>

      {/* Logo */}
      <Link
        href={user ? '/feed' : '/'}
        style={{
          fontFamily:    FONTS.mono,
          fontSize:      '1.1rem',
          fontWeight:    '800',
          color:         COLORS.textPrimary,
          textDecoration: 'none',
          letterSpacing: '-0.02em',
          flexShrink:    0,
        }}
      >
        Nexus
      </Link>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {user ? (
        <>
          {/* Balance display */}
          <div style={{
            display:     'flex',
            alignItems:  'center',
            gap:         '6px',
            padding:     '6px 12px',
            background:  'rgba(16,185,129,0.1)',
            border:      '1px solid rgba(16,185,129,0.2)',
            borderRadius: RADII.full,
          }}>
            <span style={{ fontSize: '0.72rem' }}>💰</span>
            <div style={{ lineHeight: 1 }}>
              <div style={{
                fontFamily:    FONTS.mono,
                fontSize:      '0.85rem',
                fontWeight:    '700',
                color:         COLORS.emerald,
                letterSpacing: '-0.02em',
              }}>
                {earned.toFixed(2)}π
              </div>
              {pending > 0 && (
                <div style={{
                  fontFamily: FONTS.mono,
                  fontSize:   '0.62rem',
                  color:      COLORS.amber,
                  lineHeight: 1.2,
                }}>
                  +{pending.toFixed(2)}π pending
                </div>
              )}
            </div>
          </div>

          {/* Avatar */}
          <Link
            href="/profile"
            style={{
              width:          '34px',
              height:         '34px',
              borderRadius:   '10px',
              background:     'linear-gradient(135deg, #6366F1, #4338CA)',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              fontSize:       '0.85rem',
              fontWeight:     '700',
              color:          'white',
              textDecoration: 'none',
              flexShrink:     0,
            }}
          >
            {user.piUsername.charAt(0).toUpperCase()}
          </Link>
        </>
      ) : (
        <div style={{
          fontSize: '0.78rem',
          color:    COLORS.textMuted,
        }}>
          Pi Network
        </div>
      )}
    </header>
  )
}

