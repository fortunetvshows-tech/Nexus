'use client'

import { useEffect, useRef }  from 'react'
import { useRouter }          from 'next/navigation'
import { usePiAuth }          from '@/hooks/use-pi-auth'
import { ShinyButton }        from '@/components/ShinyButton'
import { Marquee }            from '@/components/Marquee'
import { COLORS, GRADIENTS }  from '@/lib/design/tokens'

const TASK_CATEGORIES = [
  '📋 Survey & Research',
  '📱 App Testing',
  '🌐 Translation',
  '🎙️ Audio Recording',
  '📷 Photo Capture',
  '✍️ Content Review',
  '🏷️ Data Labeling',
  '💡 Micro-Consulting',
  '✅ Social Verification',
]

export default function HomePage() {
  const { user, authenticate, isLoading, isSdkReady } = usePiAuth()
  const router   = useRouter()
  const hasAutoAuthenticated = useRef(false)

  useEffect(() => {
    if (user) {
      router.push('/dashboard')
    }
  }, [user, router])

  useEffect(() => {
    if (isSdkReady && !user && !hasAutoAuthenticated.current) {
      hasAutoAuthenticated.current = true
      authenticate()
    }
  }, [isSdkReady, user, authenticate])

  return (
    <div
      style={{
        minHeight:       '100vh',
        background:      COLORS.bgBase,
        backgroundImage: GRADIENTS.hero,
        color:           COLORS.textPrimary,
        display:         'flex',
        flexDirection:   'column',
        alignItems:      'center',
        justifyContent:  'center',
        overflow:        'hidden',
        position:        'relative',
      }}
    >
      {/* Ambient background orbs */}
      <div aria-hidden style={{
        position:     'absolute',
        top:          '-20%',
        left:         '50%',
        transform:    'translateX(-50%)',
        width:        '600px',
        height:       '600px',
        background:   'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none',
      }} />

      {/* Main content */}
      <div style={{
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        textAlign:      'center',
        padding:        '2rem',
        maxWidth:       '560px',
        animation:      'fade-up 0.6s ease both',
      }}>

        {/* Status badge */}
        <div style={{
          display:       'inline-flex',
          alignItems:    'center',
          gap:           '8px',
          padding:       '6px 14px',
          background:    COLORS.indigoDim,
          border:        '1px solid rgba(99,102,241,0.3)',
          borderRadius:  '9999px',
          fontSize:      '0.75rem',
          fontWeight:    '500',
          color:         COLORS.indigoLight,
          marginBottom:  '2rem',
          letterSpacing: '0.02em',
        }}>
          <span style={{
            width:        '6px',
            height:       '6px',
            borderRadius: '50%',
            background:   COLORS.emerald,
            boxShadow:    `0 0 6px ${COLORS.emerald}`,
            display:      'inline-block',
            animation:    'pulse-glow 2s infinite',
          }} />
          Pi Network Labor Marketplace
        </div>

        {/* Headline */}
        <h1 className="landing-headline" style={{
          fontSize:      'clamp(2.5rem, 8vw, 4.5rem)',
          fontWeight:    '700',
          margin:        '0 0 1rem',
          letterSpacing: '-0.03em',
          lineHeight:    '1.1',
          color:         COLORS.textPrimary,
        }}>
          Earn Pi for
          <br />
          <span style={{
            background:           `linear-gradient(135deg, ${COLORS.indigo}, ${COLORS.emerald})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor:  'transparent',
            backgroundClip:       'text',
          }}>
            real work
          </span>
        </h1>

        <p style={{
          fontSize:     '1.05rem',
          color:        COLORS.textSecondary,
          margin:       '0 0 2.5rem',
          lineHeight:   '1.6',
          maxWidth:     '360px',
        }}>
          Complete tasks posted by employers.
          Get paid instantly in Pi.
        </p>

        {/* SDK status */}
        <div style={{
          display:      'flex',
          alignItems:   'center',
          gap:          '8px',
          marginBottom: '1.25rem',
          fontSize:     '0.8rem',
          color:        isSdkReady ? COLORS.emerald : COLORS.textMuted,
        }}>
          <div style={{
            width:        '7px',
            height:       '7px',
            borderRadius: '50%',
            background:   isSdkReady ? COLORS.emerald : COLORS.textMuted,
            boxShadow:    isSdkReady
              ? `0 0 8px ${COLORS.emerald}`
              : 'none',
          }} />
          {isSdkReady ? 'Pi Browser detected' : 'Waiting for Pi SDK...'}
        </div>

        {/* Shiny CTA */}
        <ShinyButton
          onClick={authenticate}
          disabled={isLoading || !isSdkReady}
        >
          {isLoading ? 'Connecting...' : 'Connect with Pi'}
        </ShinyButton>

      </div>

      {/* Marquee — positioned below main content */}
      <div className="landing-marquee" style={{
        position:  'absolute',
        bottom:    '3rem',
        left:      0,
        right:     0,
        animation: 'fade-up 0.8s ease 0.3s both',
        opacity:   0,
      }}>
        <div style={{
          fontSize:     '0.7rem',
          color:        COLORS.textMuted,
          textAlign:    'center',
          marginBottom: '0.75rem',
          letterSpacing: '0.08em',
          fontWeight:   '500',
        }}>
          AVAILABLE TASK CATEGORIES
        </div>
        <Marquee items={TASK_CATEGORIES} speed={25} />
      </div>

    </div>
  )
}
