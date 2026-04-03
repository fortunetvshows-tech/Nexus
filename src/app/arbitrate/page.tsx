'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePiAuth }   from '@/hooks/use-pi-auth'
import { Navigation }  from '@/components/Navigation'
import { COLORS, FONTS, RADII, SHADOWS, GRADIENTS, SPACING, statusStyle } from '@/lib/design/tokens'

interface ArbitrationItem {
  id:        string
  disputeId: string
  createdAt: string
  dispute: {
    id:           string
    status:       string
    tier1Result:  Record<string, unknown>
    submissionId: string
    taskId:       string
  }
}

export default function ArbitratePage() {
  const { user, isSdkReady } = usePiAuth()

  const [arbitrations, setArbitrations] = useState<ArbitrationItem[]>([])
  const [isLoading,    setIsLoading]    = useState(true)

  useEffect(() => {
    if (!user?.piUid) return

    fetch(`${window.location.origin}/api/arbitration/pending`, {
      headers: { 'x-pi-uid': user.piUid },
    })
      .then(r => r.json())
      .then(d => {
        if (d.arbitrations) setArbitrations(d.arbitrations)
        setIsLoading(false)
      })
      .catch(() => setIsLoading(false))
  }, [user?.piUid])

  if (!user) {
    return (
      <div style={{
        minHeight:      '100vh',
        background:     COLORS.bgBase,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        color:          COLORS.textSecondary,
        fontFamily:     FONTS.sans,
      }}>
        Connecting...
      </div>
    )
  }

  if (user.reputationLevel !== 'Sovereign') {
    return (
      <div style={{
        minHeight:  '100vh',
        background: COLORS.bgBase,
        fontFamily: FONTS.sans,
        color:      COLORS.textPrimary,
      }}>
        <Navigation currentPage="home" />
        <main style={{
          maxWidth: '480px',
          margin:   '0 auto',
          padding:  '80px 1rem 4rem',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚖️</div>
          <h1 style={{ margin: '0 0 0.5rem', fontSize: '1.3rem' }}>
            Arbitration Panel
          </h1>
          <p style={{ color: COLORS.textMuted, fontSize: '0.875rem' }}>
            Only Sovereign-level Pioneers can serve as arbitrators.
            Keep completing tasks to reach Sovereign status.
          </p>
        </main>
      </div>
    )
  }

  return (
    <div style={{
      minHeight:  '100vh',
      background: COLORS.bgBase,
      fontFamily: FONTS.sans,
      color:      COLORS.textPrimary,
    }}>
      <Navigation currentPage="home" />

      <main className="page-main">
        <h1 style={{ margin: '0 0 0.5rem', fontSize: '1.4rem', fontWeight: '700' }}>
          Arbitration Panel
        </h1>
        <p style={{ margin: '0 0 2rem', color: COLORS.textMuted, fontSize: '0.875rem' }}>
          Review disputes and vote fairly. Your reputation depends on it.
        </p>

        {isLoading && (
          <div style={{
            background:   COLORS.bgSurface,
            borderRadius: RADII.lg,
            height:       '200px',
            border:       `1px solid ${COLORS.border}`,
          }} />
        )}

        {!isLoading && arbitrations.length === 0 && (
          <div style={{
            textAlign:    'center',
            padding:      '4rem 2rem',
            background:   COLORS.bgSurface,
            borderRadius: RADII.xl,
            border:       `1px solid ${COLORS.border}`,
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✓</div>
            <h3 style={{ margin: '0 0 0.5rem' }}>No pending arbitrations</h3>
            <p style={{ color: COLORS.textMuted, margin: '0', fontSize: '0.875rem' }}>
              You are up to date. New disputes will appear here.
            </p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {arbitrations.map(arb => (
            <Link
              key={arb.id}
              href={`/arbitrate/${arb.disputeId}`}
              style={{
                background:     COLORS.bgSurface,
                border:         `1px solid ${COLORS.pi}`,
                borderRadius:   RADII.xl,
                padding:        '1.25rem',
                textDecoration: 'none',
                display:        'block',
              }}
            >
              <div style={{
                display:        'flex',
                justifyContent: 'space-between',
                alignItems:     'center',
                marginBottom:   '0.5rem',
              }}>
                <div style={{
                  fontWeight: '600',
                  fontSize:   '0.95rem',
                  color:      COLORS.textPrimary,
                }}>
                  Dispute #{arb.disputeId.slice(0, 8)}
                </div>
                <div style={{
                  padding:      '0.25rem 0.75rem',
                  borderRadius: RADII.full,
                  background:   COLORS.bgRaised,
                  fontSize:     '0.75rem',
                  color:        COLORS.piLt,
                }}>
                  Awaiting vote
                </div>
              </div>
              <div style={{
                fontSize: '0.8rem',
                color:    COLORS.textMuted,
              }}>
                Assigned {new Date(arb.createdAt).toLocaleDateString()}
                {' · '}Tap to review and vote
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}


