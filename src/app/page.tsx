'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePiAuth } from '@/hooks/use-pi-auth'
import { COLORS, FONTS, RADII, SHADOWS, GRADIENTS, SPACING } from '@/lib/design/tokens'

export default function HomePage() {
  const {
    authenticate,
    isLoading,
    error,
    isSdkReady,
    isAuthenticated,
  } = usePiAuth()
  const router = useRouter()

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard')
    }
  }, [isAuthenticated, router])

  return (
    <div style={{
      minHeight:      '100vh',
      background:     COLORS.bgBase,
      backgroundImage: GRADIENTS.hero,
      color:          COLORS.textPrimary,
      fontFamily:     FONTS.sans,
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        '2rem',
      textAlign:      'center',
    }}>

      {/* Brand badge */}
      <div style={{
        display:       'inline-flex',
        alignItems:    'center',
        gap:           '8px',
        padding:       '6px 14px',
        background:    COLORS.indigoDim,
        border:        `1px solid rgba(99, 102, 241, 0.3)`,
        borderRadius:  RADII.full,
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
        }} />
        Pi Network Labor Marketplace
      </div>

      {/* Headline */}
      <h1 style={{
        fontSize:      'clamp(2.5rem, 8vw, 4.5rem)',
        fontWeight:    '700',
        color:         COLORS.textPrimary,
        margin:        '0 0 1rem',
        letterSpacing: '-0.03em',
        lineHeight:    '1.1',
      }}>
        Earn Pi for
        <br />
        <span style={{
          background:             `linear-gradient(135deg, ${COLORS.indigo}, ${COLORS.emerald})`,
          WebkitBackgroundClip:   'text',
          WebkitTextFillColor:    'transparent',
          backgroundClip:         'text',
        }}>
          real work
        </span>
      </h1>

      <p style={{
        fontSize:     '1.05rem',
        color:        COLORS.textSecondary,
        margin:       '0 0 2.5rem',
        maxWidth:     '380px',
        lineHeight:   '1.6',
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
          boxShadow:    isSdkReady ? SHADOWS.emeraldGlow : 'none',
          animation:    isSdkReady ? 'pulse 2s infinite' : 'none',
        }} />
        {isSdkReady ? 'Pi Browser detected' : 'Waiting for Pi SDK...'}
      </div>

      {/* CTA button */}
      <button
        onClick={authenticate}
        disabled={isLoading || !isSdkReady}
        style={{
          padding:      '0.9rem 2.5rem',
          background:   isLoading || !isSdkReady
                          ? COLORS.bgElevated
                          : GRADIENTS.indigo,
          color:        isLoading || !isSdkReady
                          ? COLORS.textMuted
                          : 'white',
          border:       'none',
          borderRadius: RADII.lg,
          fontSize:     '1rem',
          fontWeight:   '600',
          fontFamily:   FONTS.sans,
          cursor:       isLoading || !isSdkReady
                          ? 'not-allowed'
                          : 'pointer',
          boxShadow:    isLoading || !isSdkReady
                          ? 'none'
                          : SHADOWS.indigoGlow,
          transition:   'all 0.2s ease',
          letterSpacing: '-0.01em',
        }}
      >
        {isLoading ? 'Connecting...' : 'Connect with Pi'}
      </button>

      {error && (
        <div style={{
          marginTop:    '1.5rem',
          padding:      SPACING.lg,
          background:   COLORS.redDim,
          border:       `1px solid rgba(239, 68, 68, 0.3)`,
          borderRadius: RADII.lg,
          color:        COLORS.red,
          maxWidth:     '360px',
          fontSize:     '0.9rem',
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}
