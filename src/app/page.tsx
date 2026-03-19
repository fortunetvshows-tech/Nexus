'use client'

import { useState, useEffect, useRef } from 'react'
import Link                             from 'next/link'
import { usePiAuth }                    from '@/hooks/use-pi-auth'
import { ShinyButton }                  from '@/components/ShinyButton'
import { Marquee }                      from '@/components/Marquee'
import { COLORS, GRADIENTS }            from '@/lib/design/tokens'

// ── Static data — defined outside component (no re-render) ──

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

const STATS = [
  { value: '9',     label: 'Task Categories' },
  { value: '5%',    label: 'Platform Fee'    },
  { value: '0.01π', label: 'Network Fee'     },
]

const HOW_IT_WORKS = [
  {
    step:  '01',
    title: 'Connect your Pi wallet',
    body:  'Authenticate once with Pi Browser. Your identity is verified by the Pi Network.',
    color: COLORS.indigo,
  },
  {
    step:  '02',
    title: 'Find work or post tasks',
    body:  'Workers browse the live task feed. Employers post tasks with Pi held in escrow.',
    color: COLORS.emerald,
  },
  {
    step:  '03',
    title: 'Complete and get paid',
    body:  'Submit proof of work. Employers review and approve. Pi releases instantly.',
    color: COLORS.amber,
  },
]

// ── Static landing content — server-safe, no SDK references ─

function LandingContent({
  activeStep,
  onStepClick,
}: {
  activeStep: number
  onStepClick: (i: number) => void
}) {
  return (
    <>
      {/* Hero */}
      <div style={{
        fontSize:      '0.65rem',
        fontWeight:    '600',
        color:         COLORS.indigoLight,
        letterSpacing: '0.1em',
        marginBottom:  '2rem',
        display:       'inline-flex',
        alignItems:    'center',
        gap:           '8px',
        padding:       '6px 14px',
        background:    COLORS.indigoDim,
        border:        `1px solid rgba(99,102,241,0.3)`,
        borderRadius:  '9999px',
        animation:     'fade-up 0.4s ease 0.1s both',
      }}>
        <span style={{
          width:        '6px',
          height:       '6px',
          borderRadius: '50%',
          background:   COLORS.emerald,
          display:      'inline-block',
          animation:    'pulse-glow 2s infinite',
        }} />
        Pi Network Labor Marketplace · Live on Testnet
      </div>

      <h1
        className="landing-headline"
        style={{
          fontSize:      'clamp(2.5rem, 7vw, 4.5rem)',
          fontWeight:    '700',
          margin:        '0 0 1rem',
          letterSpacing: '-0.03em',
          lineHeight:    '1.1',
          maxWidth:      '700px',
          animation:     'fade-up 0.5s ease 0.2s both',
        }}
      >
        The marketplace where{' '}
        <span style={{
          background:           `linear-gradient(135deg, ${COLORS.indigo}, ${COLORS.emerald})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor:  'transparent',
          backgroundClip:       'text',
        }}>
          Pi has value
        </span>
      </h1>

      <p style={{
        fontSize:   '1.05rem',
        color:      COLORS.textSecondary,
        margin:     '0 0 1rem',
        maxWidth:   '480px',
        lineHeight: '1.6',
        animation:  'fade-up 0.5s ease 0.3s both',
      }}>
        Workers earn Pi completing real tasks.
        Employers post work with Pi held in escrow.
      </p>

      {/* Stats */}
      <div style={{
        display:        'flex',
        gap:            '2rem',
        marginBottom:   '2.5rem',
        flexWrap:       'wrap' as const,
        justifyContent: 'center',
        animation:      'fade-up 0.5s ease 0.4s both',
      }}>
        {STATS.map(stat => (
          <div key={stat.label} style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily:    "'Fira Code', monospace",
              fontSize:      '1.4rem',
              fontWeight:    '700',
              color:         COLORS.textPrimary,
              letterSpacing: '-0.02em',
            }}>
              {stat.value}
            </div>
            <div style={{
              fontSize:  '0.72rem',
              color:     COLORS.textMuted,
              marginTop: '2px',
            }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

// ── Main component ───────────────────────────────────────────

export default function HomePage() {
  const { user, authenticate, isLoading, isSdkReady } = usePiAuth()

  // ── Hydration guard ──────────────────────────────────────
  // Never run SDK logic during SSR. Mount flag ensures all
  // auth-dependent UI only renders after client hydration.
  const [hasMounted, setHasMounted] = useState(false)
  useEffect(() => { setHasMounted(true) }, [])


  // ── How-it-works cycle ───────────────────────────────────
  const [activeStep, setActiveStep] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep(prev => (prev + 1) % HOW_IT_WORKS.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  // ── Auth CTA — only fires on explicit user click ─────────
  // NO auto-authenticate. NO router.push redirect.
  // The user is always in control of when auth fires.
  const handleLogin = async () => {
    if (isLoading) return
    const loggedInUser = await authenticate()
    if (loggedInUser) {
      // User just authenticated — take them to dashboard
      window.location.href = '/dashboard'
    }
  }

  // ── Auth button — server-safe default ────────────────────
  // Before mount: render static "Login with Pi" button (no SDK)
  // After mount: render context-aware smart button
  const AuthButton = ({ size = 'full' }: { size?: 'full' | 'compact' }) => {
    const isCompact = size === 'compact'

    if (!hasMounted) {
      // Static server-safe version — no SDK references
      return (
        <button
          disabled
          style={{
            padding:      isCompact ? '0.45rem 1rem' : '0.9rem 2.5rem',
            background:   COLORS.bgElevated,
            color:        COLORS.textMuted,
            border:       'none',
            borderRadius: isCompact ? '8px' : '10px',
            fontSize:     isCompact ? '0.82rem' : '1rem',
            fontWeight:   '600',
            cursor:       'not-allowed',
            fontFamily:   "'Inter', system-ui, sans-serif",
            whiteSpace:   'nowrap' as const,
          }}
        >
          Login with Pi
        </button>
      )
    }

    // Authenticated — show dashboard link
    if (user) {
      return (
        <Link
          href="/dashboard"
          style={{
            display:        'inline-flex',
            alignItems:     'center',
            padding:        isCompact ? '0.45rem 1rem' : '0.9rem 2.5rem',
            background:     `linear-gradient(180deg, ${COLORS.emerald} 0%, ${COLORS.emeraldDark} 100%)`,
            color:          'white',
            borderRadius:   isCompact ? '8px' : '10px',
            fontSize:       isCompact ? '0.82rem' : '1rem',
            fontWeight:     '600',
            textDecoration: 'none',
            boxShadow:      isCompact ? 'none' : `0 0 24px rgba(16,185,129,0.4)`,
            letterSpacing:  '-0.01em',
            fontFamily:     "'Inter', system-ui, sans-serif",
            whiteSpace:     'nowrap' as const,
          }}
        >
          {isCompact ? 'Dashboard →' : 'Go to Dashboard →'}
        </Link>
      )
    }

    // Guest — explicit login button
    if (isCompact) {
      return (
        <button
          onClick={handleLogin}
          disabled={isLoading}
          style={{
            padding:      '0.45rem 1rem',
            background:   isLoading
              ? COLORS.bgElevated
              : `linear-gradient(180deg, ${COLORS.indigo} 0%, ${COLORS.indigoDark} 100%)`,
            color:        isLoading ? COLORS.textMuted : 'white',
            border:       'none',
            borderRadius: '8px',
            fontSize:     '0.82rem',
            fontWeight:   '600',
            cursor:       isLoading ? 'not-allowed' : 'pointer',
            fontFamily:   "'Inter', system-ui, sans-serif",
            whiteSpace:   'nowrap' as const,
          }}
        >
          {isLoading ? 'Connecting...' : 'Login with Pi'}
        </button>
      )
    }

    return (
      <ShinyButton onClick={handleLogin} disabled={isLoading}>
        {isLoading ? 'Connecting...' : 'Login with Pi'}
      </ShinyButton>
    )
  }

  return (
    <div style={{
      minHeight:   '100vh',
      background:  COLORS.bgBase,
      color:       COLORS.textPrimary,
      fontFamily:  "'Inter', system-ui, sans-serif",
      overflowX:   'hidden',
    }}>

      {/* ── Landing Sticky Header ─────────────────────────── */}
      <header style={{
        position:       'fixed',
        top:            0,
        left:           0,
        right:          0,
        height:         '60px',
        background:     'rgba(15,23,42,0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom:   `1px solid ${COLORS.border}`,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        padding:        '0 var(--page-padding)',
        zIndex:         200,
        fontFamily:     "'Inter', system-ui, sans-serif",
      }}>

        {/* Brand */}
        <div style={{
          fontSize:      '1.05rem',
          fontWeight:    '700',
          color:         COLORS.textPrimary,
          letterSpacing: '-0.02em',
          display:       'flex',
          alignItems:    'center',
          gap:           '8px',
        }}>
          <span className="hide-mobile">Nexus</span>
          <span className="show-mobile">NX</span>
          <span style={{
            fontSize:     '0.55rem',
            fontWeight:   '500',
            color:        COLORS.indigo,
            background:   COLORS.indigoDim,
            padding:      '2px 6px',
            borderRadius: '4px',
            letterSpacing: '0.05em',
          }}>
            BETA
          </span>
        </div>

        {/* Smooth scroll nav — desktop only */}
        <div className="hide-mobile" style={{ display: 'flex', gap: '0.25rem' }}>
          {[
            { href: '#hero',       label: 'Home'         },
            { href: '#how',        label: 'How it works' },
            { href: '#reputation', label: 'Reputation'   },
          ].map(link => (
            <a
              key={link.href}
              href={link.href}
              style={{
                padding:        '0.4rem 0.875rem',
                borderRadius:   '8px',
                fontSize:       '0.85rem',
                fontWeight:     '400',
                textDecoration: 'none',
                color:          COLORS.textSecondary,
                transition:     'color 0.15s ease',
              }}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Smart CTA — compact */}
        <AuthButton size="compact" />
      </header>

      {/* ── Hero Section ───────────────────────────────── */}
      <section
        id="hero"
        style={{
          minHeight:      '100vh',
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          justifyContent: 'center',
          textAlign:      'center',
          padding:        '80px var(--page-padding) 0',
          paddingBottom:  '140px',
          backgroundImage: GRADIENTS.hero,
          position:       'relative',
        }}
      >
        {/* Ambient orb */}
        <div aria-hidden style={{
          position:      'absolute',
          top:           '-10%',
          left:          '50%',
          transform:     'translateX(-50%)',
          width:         '700px',
          height:        '700px',
          background:    'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 65%)',
          borderRadius:  '50%',
          pointerEvents: 'none',
        }} />

        {/* Static content — always visible, server-safe */}
        <div style={{
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          maxWidth:      '560px',
          position:      'relative',
          zIndex:        1,
        }}>
          <LandingContent
            activeStep={activeStep}
            onStepClick={setActiveStep}
          />

          {/* Auth CTA — client-only aware */}
          <div style={{
            display:       'flex',
            flexDirection: 'column',
            alignItems:    'center',
            gap:           '0.875rem',
            width:         '100%',
            maxWidth:      '280px',
            animation:     'fade-up 0.5s ease 0.5s both',
          }}>
            {/* SDK status — only show after mount and when not ready */}
            {hasMounted && !user && (
              <div style={{
                display:    'flex',
                alignItems: 'center',
                gap:        '8px',
                fontSize:   '0.78rem',
                color:      isSdkReady ? COLORS.emerald : COLORS.textMuted,
              }}>
                <div style={{
                  width:        '7px',
                  height:       '7px',
                  borderRadius: '50%',
                  background:   isSdkReady ? COLORS.emerald : COLORS.textMuted,
                  boxShadow:    isSdkReady ? `0 0 8px ${COLORS.emerald}` : 'none',
                }} />
                {isSdkReady ? 'Pi Browser detected' : 'Open in Pi Browser'}
              </div>
            )}

            <AuthButton size="full" />
          </div>
        </div>

        {/* Marquee — absolute bottom */}
        <div
          className="landing-marquee"
          style={{
            position:  'absolute',
            bottom:    '0',
            left:      0,
            right:     0,
            padding:   '1rem 0 1.5rem',
            background: 'linear-gradient(to top, rgba(15,23,42,0.95) 0%, transparent 100%)',
            animation: 'fade-up 0.6s ease 0.6s both',
          }}
        >
          <div style={{
            fontSize:      '0.65rem',
            color:         COLORS.textMuted,
            textAlign:     'center',
            marginBottom:  '0.625rem',
            letterSpacing: '0.1em',
            fontWeight:    '600',
          }}>
            AVAILABLE TASK CATEGORIES
          </div>
          <Marquee items={TASK_CATEGORIES} speed={25} />
        </div>
      </section>

      {/* ── How It Works Section ──────────────────────────── */}
      <section id="how" style={{
        padding:    '5rem var(--page-padding)',
        maxWidth:   '760px',
        margin:     '0 auto',
      }}>
        <div style={{
          textAlign:     'center',
          marginBottom:  '3rem',
        }}>
          <div style={{
            fontSize:      '0.7rem',
            fontWeight:    '600',
            color:         COLORS.indigo,
            letterSpacing: '0.12em',
            marginBottom:  '0.75rem',
            textTransform: 'uppercase' as const,
          }}>
            How It Works
          </div>
          <h2 style={{
            fontSize:      'clamp(1.5rem, 4vw, 2.25rem)',
            fontWeight:    '700',
            margin:        0,
            letterSpacing: '-0.02em',
          }}>
            Work-first. Pay-on-delivery.
          </h2>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap:     '0.875rem',
        }}>
          {HOW_IT_WORKS.map((step, idx) => (
            <div
              key={step.step}
              onClick={() => setActiveStep(idx)}
              className="nexus-card"
              style={{
                display:   'flex',
                gap:       '1.25rem',
                alignItems: 'flex-start',
                cursor:    'pointer',
                borderLeft: `3px solid ${
                  idx === activeStep ? step.color : 'transparent'
                }`,
                transition: 'all 0.3s ease',
                opacity:   idx === activeStep ? 1 : 0.6,
              }}
            >
              <div style={{
                fontFamily:    "'Fira Code', monospace",
                fontSize:      '0.75rem',
                fontWeight:    '700',
                color:         step.color,
                opacity:       0.8,
                flexShrink:    0,
                paddingTop:    '2px',
              }}>
                {step.step}
              </div>
              <div>
                <div style={{
                  fontWeight:   '600',
                  fontSize:     '0.95rem',
                  marginBottom: '4px',
                  color:        COLORS.textPrimary,
                }}>
                  {step.title}
                </div>
                <div style={{
                  fontSize:   '0.85rem',
                  color:      COLORS.textSecondary,
                  lineHeight: '1.5',
                }}>
                  {step.body}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Reputation Section ────────────────────────────── */}
      <section id="reputation" style={{
        padding:    '3rem var(--page-padding) 5rem',
        maxWidth:   '760px',
        margin:     '0 auto',
        textAlign:  'center',
      }}>
        <div style={{
          fontSize:      '0.7rem',
          fontWeight:    '600',
          color:         COLORS.emerald,
          letterSpacing: '0.12em',
          marginBottom:  '0.75rem',
          textTransform: 'uppercase' as const,
        }}>
          Reputation System
        </div>
        <h2 style={{
          fontSize:      'clamp(1.5rem, 4vw, 2.25rem)',
          fontWeight:    '700',
          margin:        '0 0 1rem',
          letterSpacing: '-0.02em',
        }}>
          Earn trust, unlock opportunities
        </h2>
        <p style={{
          fontSize:   '0.95rem',
          color:      COLORS.textSecondary,
          maxWidth:   '480px',
          margin:     '0 auto 2.5rem',
          lineHeight: '1.6',
        }}>
          Every completed task builds your reputation score.
          Higher levels unlock higher-reward tasks and arbitration rights.
        </p>

        {/* Level progression */}
        <div style={{
          display:        'flex',
          justifyContent: 'center',
          gap:            '0.5rem',
          flexWrap:       'wrap' as const,
        }}>
          {[
            { level: 'Newcomer',   color: '#94A3B8' },
            { level: 'Apprentice', color: '#60A5FA' },
            { level: 'Journeyman', color: '#34D399' },
            { level: 'Expert',     color: '#A78BFA' },
            { level: 'Master',     color: '#F59E0B' },
            { level: 'Sovereign',  color: '#F0B429' },
          ].map((item, idx) => (
            <div key={item.level} style={{
              display:      'flex',
              alignItems:   'center',
              gap:          '6px',
              padding:      '5px 12px',
              background:   `${item.color}12`,
              border:       `1px solid ${item.color}30`,
              borderRadius: '9999px',
            }}>
              <div style={{
                width:        '6px',
                height:       '6px',
                borderRadius: '50%',
                background:   item.color,
              }} />
              <span style={{
                fontSize:   '0.75rem',
                fontWeight: '500',
                color:      item.color,
              }}>
                {item.level}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ─────────────────────────────────── */}
      <section style={{
        borderTop:  `1px solid ${COLORS.border}`,
        padding:    '4rem var(--page-padding)',
        textAlign:  'center',
      }}>
        <h2 style={{
          fontSize:      'clamp(1.5rem, 4vw, 2rem)',
          fontWeight:    '700',
          margin:        '0 0 0.75rem',
          letterSpacing: '-0.02em',
        }}>
          Ready to earn Pi?
        </h2>
        <p style={{
          fontSize: '0.95rem',
          color:    COLORS.textSecondary,
          margin:   '0 0 2rem',
        }}>
          Open Nexus in Pi Browser to get started.
        </p>
        <AuthButton size="full" />
      </section>

    </div>
  )
}
