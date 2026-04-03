'use client'

import { useEffect, useState, useCallback } from 'react'
import { usePiAuth }  from '@/hooks/use-pi-auth'
import {
  COLORS, FONTS, RADII, SPACING, GRADIENTS
} from '@/lib/design/tokens'

const STATS = [
  { value: '5',     label: 'Task Categories'    },
  { value: '≤1hr',  label: 'Avg completion time' },
  { value: '< 30',  label: 'Minutes per task'   },
  { value: '100%',  label: 'Pi payments'        },
]


export default function LandingPage() {
  const { user, isLoading, isSdkReady, authenticate } = usePiAuth()
  const [hasMounted, setHasMounted] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  useEffect(() => { setHasMounted(true) }, [])

  // Capture referral code from URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const ref = params.get('ref')
      if (ref) {
        sessionStorage.setItem('proofgrid_ref', ref)
      }
    }
  }, [])

  const handleLogin = useCallback(async () => {
    if (isAuthenticating || isLoading || !isSdkReady) return
    setIsAuthenticating(true)
    try {
      const authUser = await authenticate()
      if (authUser) {
        // Auth succeeded — navigate to dashboard
        window.location.href = '/dashboard'
      } else {
        setIsAuthenticating(false)
      }
    } catch (err) {
      console.error('[ProofGrid:Landing] Auth error:', err)
      setIsAuthenticating(false)
    }
  }, [authenticate, isAuthenticating, isLoading, isSdkReady])

  if (!hasMounted) return null

  return (
    <main style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#07090E',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Glow orbs */}
      <div style={{
        position: 'absolute',
        width: 480, height: 480,
        background: 'radial-gradient(circle, rgba(0,149,255,0.13) 0%, transparent 70%)',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -58%)',
        animation: 'breathe 5s ease-in-out infinite',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        width: 300, height: 300,
        background: 'radial-gradient(circle, rgba(167,139,250,0.07) 0%, transparent 70%)',
        bottom: '10%', right: '-10%',
        animation: 'breathe 7s ease-in-out infinite reverse',
        pointerEvents: 'none',
      }} />

      {/* Center content */}
      <div style={{
        position: 'relative', zIndex: 2,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center',
        padding: '32px 28px',
        width: '100%', maxWidth: 440,
      }}>
        {/* Logo gem SVG */}
        <div style={{ marginBottom: 28, animation: 'gemIn 1.4s cubic-bezier(.34,1.56,.64,1) both' }}>
          <svg width="74" height="74" viewBox="0 0 74 74" fill="none">
            <polygon points="37,4 70,20 70,54 37,70 4,54 4,20"
              fill="rgba(0,149,255,0.12)"
              stroke="rgba(0,149,255,0.5)" strokeWidth="1.2"/>
            <polygon points="37,12 62,24 62,50 37,62 12,50 12,24"
              fill="rgba(0,149,255,0.08)"
              stroke="rgba(0,149,255,0.3)" strokeWidth="0.8"/>
            <line x1="37" y1="4"  x2="37" y2="70" stroke="rgba(255,255,255,0.18)" strokeWidth="0.5"/>
            <line x1="4"  y1="37" x2="70" y2="37" stroke="rgba(255,255,255,0.18)" strokeWidth="0.5"/>
            <line x1="4"  y1="20" x2="70" y2="54" stroke="rgba(255,255,255,0.18)" strokeWidth="0.5"/>
            <line x1="70" y1="20" x2="4"  y2="54" stroke="rgba(255,255,255,0.18)" strokeWidth="0.5"/>
            <path d="M26 37L33 44L48 29"
              stroke="white" strokeWidth="2.8"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 32, letterSpacing: 4,
            textTransform: 'uppercase',
            marginTop: 10, textAlign: 'center',
            color: '#EEF2FF',
            animation: 'fadeUp 0.7s 0.6s both',
          }}>
            PROOF<span style={{ color: '#38B2FF' }}>GRID</span>
          </div>
        </div>

        <div style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 46, lineHeight: 1,
          letterSpacing: 2,
          textTransform: 'uppercase',
          textAlign: 'center',
          marginBottom: 14,
          animation: 'fadeUp 0.7s 0.8s both',
        }}>
          DECENTRALIZED<br/>
          <span style={{ color: '#38B2FF' }}>WORK</span> MARKETPLACE
        </div>

        <div style={{
          fontSize: 14, color: '#8892A8',
          textAlign: 'center', lineHeight: 1.75,
          marginBottom: 32,
          animation: 'fadeUp 0.7s 1s both',
        }}>
          Complete tasks. Earn Pi.<br/>
          Secured by blockchain escrow.
        </div>

        {/* Feature list */}
        {[
          { icon: '🔒', text: 'Smart contract escrow protection' },
          { icon: '⚡', text: 'Instant Pi payments on approval' },
          { icon: '🌍', text: 'Work from anywhere, earn globally' },
        ].map((f, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            width: '100%', padding: '10px 14px',
            background: '#131720',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12,
            marginBottom: 8,
            animation: `fadeUp 0.7s ${1.1 + i * 0.1}s both`,
          }}>
            <span style={{ fontSize: 18 }}>{f.icon}</span>
            <span style={{ fontSize: 13, color: '#8892A8' }}>{f.text}</span>
          </div>
        ))}

        {/* CTA Button — keep existing auth logic */}
        <button
          onClick={handleLogin}
          disabled={isAuthenticating}
          style={{
            width: '100%',
            padding: '16px 24px',
            marginTop: 24,
            background: isAuthenticating ? 'rgba(0,149,255,0.5)' : '#0095FF',
            border: 'none',
            borderRadius: 12,
            color: '#fff',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 16, fontWeight: 700,
            letterSpacing: 0.2,
            cursor: isAuthenticating ? 'wait' : 'pointer',
            boxShadow: '0 0 24px rgba(0,149,255,0.28), 0 4px 12px rgba(0,0,0,0.3)',
            animation: 'fadeUp 0.7s 1.4s both',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 8,
            transition: 'all 0.2s cubic-bezier(.4,0,.2,1)',
          }}
        >
          {isAuthenticating
            ? '⏳ Connecting...'
            : '🌐 Connect with Pi Browser'}
        </button>

        <div style={{
          marginTop: 16, fontSize: 12,
          color: '#454F64', textAlign: 'center',
          animation: 'fadeUp 0.7s 1.5s both',
        }}>
          Pi Browser required · Authentication via Pi Network SDK
        </div>
      </div>
    </main>
  )
}



