'use client'

import { useEffect, useState, useCallback } from 'react'
import { usePiAuth }  from '@/hooks/use-pi-auth'
import { Navigation } from '@/components/Navigation'
import {
  COLORS, FONTS, RADII, SPACING, GRADIENTS
} from '@/lib/design/tokens'
import { TASK_CATEGORIES } from '@/lib/config/categories'

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
        sessionStorage.setItem('nexus_ref', ref)
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
      console.error('[Nexus:Landing] Auth error:', err)
      setIsAuthenticating(false)
    }
  }, [authenticate, isAuthenticating, isLoading, isSdkReady])

  if (!hasMounted) return null

  return (
    <div style={{
      minHeight:  '100vh',
      background: COLORS.bgBase,
      fontFamily: FONTS.sans,
      color:      COLORS.textPrimary,
      overflowX:  'hidden',
    }}>
      <Navigation currentPage="home" />

      {/* ── HERO ──────────────────────────────────────────── */}
      <section style={{
        minHeight:      '100vh',
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        `80px ${SPACING.lg} ${SPACING.xl}`,
        textAlign:      'center' as const,
        position:       'relative' as const,
        overflow:       'hidden',
      }}>
        {/* Background glow */}
        <div style={{
          position:     'absolute' as const,
          top:          '20%',
          left:         '50%',
          transform:    'translateX(-50%)',
          width:        '600px',
          height:       '600px',
          background:   `radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)`,
          pointerEvents: 'none' as const,
          zIndex:       0,
        }} />

        {/* Live badge */}
        <div style={{
          display:      'inline-flex',
          alignItems:   'center',
          gap:          '8px',
          padding:      '6px 16px',
          background:   'rgba(16,185,129,0.1)',
          border:       '1px solid rgba(16,185,129,0.3)',
          borderRadius: RADII.full,
          fontSize:     '0.78rem',
          fontWeight:   '600',
          color:        COLORS.emerald,
          marginBottom: SPACING.lg,
          position:     'relative' as const,
          zIndex:       1,
        }}>
          <span style={{
            width:        '6px',
            height:       '6px',
            borderRadius: '50%',
            background:   COLORS.emerald,
            display:      'inline-block',
            animation:    'pulse 2s infinite',
          }} />
          Pioneers earning right now
        </div>

        {/* Main headline */}
        <h1 style={{
          margin:       '0 0 1.25rem',
          fontSize:     'clamp(2.5rem, 8vw, 4.5rem)',
          fontWeight:   '800',
          lineHeight:   1.1,
          letterSpacing: '-0.03em',
          position:     'relative' as const,
          zIndex:       1,
          maxWidth:     '800px',
        }}>
          Earn Pi doing{' '}
          <span style={{
            background:        `linear-gradient(135deg, ${COLORS.indigo}, ${COLORS.emerald})`,
            WebkitBackgroundClip: 'text' as any,
            WebkitTextFillColor: 'transparent',
          }}>
            real work
          </span>
        </h1>

        {/* Subheadline */}
        <p style={{
          margin:       '0 0 2.5rem',
          fontSize:     'clamp(1rem, 2.5vw, 1.25rem)',
          color:        COLORS.textSecondary,
          maxWidth:     '520px',
          lineHeight:   1.6,
          position:     'relative' as const,
          zIndex:       1,
        }}>
          Simple tasks. Instant Pi payments.
          No experience needed — just your phone and 10 minutes.
        </p>

        {/* CTA buttons */}
        <div style={{
          display:        'flex',
          gap:            SPACING.md,
          flexWrap:       'wrap' as const,
          justifyContent: 'center',
          position:       'relative' as const,
          zIndex:         1,
          marginBottom:   '3rem',
        }}>
          {user ? (
            <>
              <a
                href="/feed"
                style={{
                  padding:        '1rem 2rem',
                  background:     `linear-gradient(135deg, ${COLORS.indigo}, #4338CA)`,
                  color:          'white',
                  borderRadius:   RADII.lg,
                  fontSize:       '1rem',
                  fontWeight:     '700',
                  textDecoration: 'none',
                  boxShadow:      '0 0 30px rgba(99,102,241,0.4)',
                  transition:     'all 0.2s ease',
                  display:        'inline-flex',
                  alignItems:     'center',
                  gap:            '8px',
                }}
              >
                🔍 Find Opportunities
              </a>
              <a
                href="/employer"
                style={{
                  padding:        '1rem 2rem',
                  background:     'transparent',
                  color:          COLORS.textPrimary,
                  borderRadius:   RADII.lg,
                  fontSize:       '1rem',
                  fontWeight:     '600',
                  textDecoration: 'none',
                  border:         `1px solid ${COLORS.border}`,
                  transition:     'all 0.2s ease',
                  display:        'inline-flex',
                  alignItems:     'center',
                  gap:            '8px',
                }}
              >
                📋 Post Work
              </a>
            </>
          ) : (
            <button
              onClick={handleLogin}
              disabled={isAuthenticating || isLoading || !isSdkReady}
              style={{
                padding:      '1rem 2.5rem',
                background:   isAuthenticating || isLoading
                  ? COLORS.bgElevated
                  : `linear-gradient(135deg, ${COLORS.indigo}, #4338CA)`,
                color:        isAuthenticating || isLoading ? COLORS.textMuted : 'white',
                borderRadius: RADII.lg,
                fontSize:     '1.1rem',
                fontWeight:   '700',
                border:       'none',
                cursor:       isAuthenticating || isLoading || !isSdkReady ? 'not-allowed' : 'pointer',
                boxShadow:    isAuthenticating || isLoading
                  ? 'none'
                  : '0 0 40px rgba(99,102,241,0.5)',
                transition:   'all 0.2s ease',
                fontFamily:   FONTS.sans,
                display:      'flex',
                alignItems:   'center',
                gap:          '10px',
              }}
            >
              {isAuthenticating ? (
                'Authenticating...'
              ) : isLoading || !isSdkReady ? (
                'Loading Pi SDK...'
              ) : (
                <>
                  <span>Start Earning Pi</span>
                  <span>→</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Stats row */}
        <div style={{
          display:        'flex',
          gap:            SPACING.xl,
          flexWrap:       'wrap' as const,
          justifyContent: 'center',
          position:       'relative' as const,
          zIndex:         1,
        }}>
          {STATS.map(stat => (
            <div key={stat.label} style={{ textAlign: 'center' as const }}>
              <div style={{
                fontFamily:    FONTS.mono,
                fontSize:      '1.5rem',
                fontWeight:    '700',
                color:         COLORS.textPrimary,
                letterSpacing: '-0.02em',
              }}>
                {stat.value}
              </div>
              <div style={{
                fontSize: '0.72rem',
                color:    COLORS.textMuted,
                marginTop: '2px',
              }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── REAL OPPORTUNITIES CTA ───────────────────────── */}
      <div style={{
        textAlign:    'center' as const,
        padding:      '3rem 1rem',
        maxWidth:     '600px',
        margin:       '0 auto',
      }}>
        <div style={{
          fontSize:      '0.72rem',
          fontWeight:    '700',
          color:         COLORS.indigo,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.15em',
          marginBottom:  SPACING.sm,
        }}>
          Real Opportunities
        </div>
        <h2 style={{
          margin:        `0 0 ${SPACING.sm}`,
          fontSize:      'clamp(1.5rem, 4vw, 2rem)',
          fontWeight:    '700',
          color:         COLORS.textPrimary,
          letterSpacing: '-0.02em',
        }}>
          Tasks posted by real employers
        </h2>
        <p style={{
          margin:   `0 0 ${SPACING.lg}`,
          color:    COLORS.textMuted,
          fontSize: '0.9rem',
        }}>
          Every task pays real Pi directly to your wallet.
          New opportunities added daily.
        </p>
        <a
          href={user ? '/feed' : '#'}
          onClick={(e) => {
            if (!user) {
              e.preventDefault()
              handleLogin()
            }
          }}
          style={{
            display:        'inline-flex',
            alignItems:     'center',
            gap:            '8px',
            padding:        '0.875rem 2rem',
            background:     `linear-gradient(135deg, ${COLORS.indigo}, #4338CA)`,
            color:          'white',
            borderRadius:   RADII.lg,
            fontSize:       '0.95rem',
            fontWeight:     '700',
            textDecoration: 'none',
            border:         'none',
            cursor:         'pointer',
            fontFamily:     FONTS.sans,
            boxShadow:      '0 0 20px rgba(99,102,241,0.3)',
          }}
        >
          Browse Live Opportunities →
        </a>
      </div>

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <section style={{
        padding:    `${SPACING.xxl} ${SPACING.lg}`,
        background: COLORS.bgSurface,
        borderTop:  `1px solid ${COLORS.border}`,
      }}>
        <div style={{
          maxWidth:  '900px',
          margin:    '0 auto',
          textAlign: 'center' as const,
        }}>
          <div style={{
            fontSize:      '0.72rem',
            fontWeight:    '700',
            color:         COLORS.emerald,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.15em',
            marginBottom:  SPACING.sm,
          }}>
            Dead Simple
          </div>
          <h2 style={{
            margin:        `0 0 ${SPACING.xl}`,
            fontSize:      'clamp(1.75rem, 4vw, 2.5rem)',
            fontWeight:    '700',
            letterSpacing: '-0.02em',
          }}>
            Three steps to earning Pi
          </h2>

          <div style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap:                 SPACING.lg,
          }}>
            {[
              {
                step:  '01',
                emoji: '👁',
                title: 'See an opportunity',
                desc:  'Browse tasks that match your skills. Each shows exactly how much Pi you earn.',
                color: COLORS.indigo,
              },
              {
                step:  '02',
                emoji: '⚡',
                title: 'Complete the work',
                desc:  'Do the task on your phone in minutes. Submit your proof when done.',
                color: COLORS.amber,
              },
              {
                step:  '03',
                emoji: '💳',
                title: 'Earn Pi instantly',
                desc:  'Pi is sent directly to your wallet the moment your work is approved.',
                color: COLORS.emerald,
              },
            ].map(step => (
              <div
                key={step.step}
                style={{
                  padding:      SPACING.xl,
                  background:   COLORS.bgBase,
                  border:       `1px solid ${COLORS.border}`,
                  borderRadius: RADII.xl,
                  textAlign:    'left' as const,
                }}
              >
                <div style={{
                  fontFamily:    FONTS.mono,
                  fontSize:      '0.7rem',
                  fontWeight:    '700',
                  color:         step.color,
                  letterSpacing: '0.1em',
                  marginBottom:  SPACING.sm,
                }}>
                  STEP {step.step}
                </div>
                <div style={{
                  fontSize:     '2rem',
                  marginBottom: SPACING.sm,
                }}>
                  {step.emoji}
                </div>
                <div style={{
                  fontSize:     '1rem',
                  fontWeight:   '700',
                  color:        COLORS.textPrimary,
                  marginBottom: SPACING.xs,
                }}>
                  {step.title}
                </div>
                <div style={{
                  fontSize:   '0.85rem',
                  color:      COLORS.textMuted,
                  lineHeight: 1.6,
                }}>
                  {step.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORY PILLS ───────────────────────────────── */}
      <section style={{
        padding:   `${SPACING.xxl} ${SPACING.lg}`,
        maxWidth:  '900px',
        margin:    '0 auto',
        textAlign: 'center' as const,
      }}>
        <div style={{
          fontSize:      '0.72rem',
          fontWeight:    '700',
          color:         COLORS.textMuted,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.15em',
          marginBottom:  SPACING.md,
        }}>
          Opportunity Types
        </div>
        <div style={{
          display:        'flex',
          flexWrap:       'wrap' as const,
          gap:            SPACING.sm,
          justifyContent: 'center',
          marginBottom:   SPACING.xl,
        }}>
          {TASK_CATEGORIES.map(cat => (
            <span
              key={cat}
              style={{
                padding:      `${SPACING.xs} ${SPACING.md}`,
                background:   COLORS.bgSurface,
                border:       `1px solid ${COLORS.border}`,
                borderRadius: RADII.full,
                fontSize:     '0.85rem',
                color:        COLORS.textSecondary,
                fontWeight:   '500',
              }}
            >
              {cat}
            </span>
          ))}
        </div>
      </section>

      {/* ── BOTTOM CTA ───────────────────────────────────── */}
      <section style={{
        padding:    `${SPACING.xxl} ${SPACING.lg}`,
        background: `linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(16,185,129,0.1) 100%)`,
        borderTop:  `1px solid ${COLORS.border}`,
        textAlign:  'center' as const,
      }}>
        <h2 style={{
          margin:        '0 0 1rem',
          fontSize:      'clamp(1.75rem, 4vw, 2.75rem)',
          fontWeight:    '800',
          letterSpacing: '-0.02em',
        }}>
          Ready to earn Pi?
        </h2>
        <p style={{
          margin:   '0 0 2rem',
          color:    COLORS.textMuted,
          fontSize: '1rem',
        }}>
          Join Pioneers already earning. Your first opportunity is waiting.
        </p>
        {user ? (
          <a
            href="/feed"
            style={{
              display:        'inline-flex',
              alignItems:     'center',
              gap:            '8px',
              padding:        '1rem 2.5rem',
              background:     `linear-gradient(135deg, ${COLORS.indigo}, #4338CA)`,
              color:          'white',
              borderRadius:   RADII.lg,
              fontSize:       '1.1rem',
              fontWeight:     '700',
              textDecoration: 'none',
              boxShadow:      '0 0 40px rgba(99,102,241,0.4)',
            }}
          >
            Browse Opportunities →
          </a>
        ) : (
          <button
            onClick={handleLogin}
            disabled={isAuthenticating || isLoading || !isSdkReady}
            style={{
              padding:      '1rem 2.5rem',
              background:   isAuthenticating || isLoading
                ? COLORS.bgElevated
                : `linear-gradient(135deg, ${COLORS.indigo}, #4338CA)`,
              color:        isAuthenticating || isLoading ? COLORS.textMuted : 'white',
              borderRadius: RADII.lg,
              fontSize:     '1.1rem',
              fontWeight:   '700',
              border:       'none',
              cursor:       isAuthenticating || isLoading || !isSdkReady ? 'not-allowed' : 'pointer',
              boxShadow:    isAuthenticating || isLoading
                ? 'none'
                : '0 0 40px rgba(99,102,241,0.4)',
              fontFamily:   FONTS.sans,
              display:      'inline-flex',
              alignItems:   'center',
              gap:          '10px',
            }}
          >
            {isAuthenticating ? 'Authenticating...' : 'Start Earning Pi →'}
          </button>
        )}
      </section>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <footer style={{
        padding:    `${SPACING.xl} ${SPACING.lg}`,
        borderTop:  `1px solid ${COLORS.border}`,
        textAlign:  'center' as const,
        color:      COLORS.textMuted,
        fontSize:   '0.78rem',
      }}>
        <div style={{ marginBottom: SPACING.sm }}>
          <span style={{ fontWeight: '700', color: COLORS.textSecondary }}>
            Nexus
          </span>
          {' '}· Pi Network Labor Marketplace
        </div>
        <div>
          Built for Pioneers · Powered by Pi Network · Payments on blockchain
        </div>
      </footer>

      {/* ── CSS Animations ───────────────────────────────── */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .nexus-card:hover {
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  )
}
