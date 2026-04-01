'use client'

import { useEffect, useState, useRef } from 'react'
import Link           from 'next/link'
import { usePiAuth }  from '@/hooks/use-pi-auth'
import { Navigation } from '@/components/Navigation'
import { PLATFORM_CONFIG } from '@/lib/config/platform'
import { COLORS, FONTS, RADII, SHADOWS, GRADIENTS, SPACING, statusStyle } from '@/lib/design/tokens'

// ── Types ──────────────────────────────────────────────────────

interface WorkerSummary {
  totalEarned:     number
  totalPending:    number
  thisWeekEarned:  number
  confirmedCount:  number
  pendingCount:    number
}

interface WorkerTx {
  id:        string
  type:      string
  amount:    number
  netAmount: number
  status:    string
  createdAt: string
  task: {
    id:       string
    title:    string
    category: string
  } | null
}



// ── Helpers ────────────────────────────────────────────────────

function formatPi(amount: number): string {
  return `${amount.toFixed(4)}π`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day:   'numeric',
    hour:  '2-digit',
    minute: '2-digit',
  })
}

function statusColor(status: string): string {
  switch (status) {
    case 'confirmed': return COLORS.emerald
    case 'pending':   return COLORS.amber
    case 'failed':    return COLORS.red
    case 'reversed':  return COLORS.textSecondary
    default:          return COLORS.textMuted
  }
}

function txTypeLabel(type: string): string {
  switch (type) {
    case 'worker_payout':   return 'Payout'
    case 'platform_fee':    return 'Fee'
    case 'escrow_in':       return 'Escrow'
    case 'refund':          return 'Refund'
    case 'dispute_release': return 'Dispute'
    default:                return type
  }
}

// ── StatCard ───────────────────────────────────────────────────

function StatCard({
  label,
  value,
  color = COLORS.textPrimary,
  sub,
}: {
  label: string
  value: string
  color?: string
  sub?:  string
}) {
  return (
    <div style={{
      background:   COLORS.bgSurface,
      border:       `1px solid ${COLORS.border}`,
      borderRadius: RADII.lg,
      padding:      'clamp(0.875rem, 2vw, 1.25rem)',
    }}>
      <div style={{
        fontSize:   'clamp(0.65rem, 1.5vw, 0.75rem)',
        color:      COLORS.textMuted,
        fontWeight: '500',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em',
        marginBottom: '0.5rem',
      }}>
        {label}
      </div>
      <div style={{
        fontSize:   'clamp(1.1rem, 4vw, 1.5rem)',
        fontWeight: '700',
        color,
        lineHeight: 1,
      }}>
        {value}
      </div>
      {sub && (
        <div style={{
          fontSize:  'clamp(0.65rem, 1.5vw, 0.75rem)',
          color:     COLORS.textMuted,
          marginTop: '0.35rem',
        }}>
          {sub}
        </div>
      )}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────

export default function AnalyticsPage() {
  const { user } = usePiAuth()

  // Worker data
  const [workerSummary, setWorkerSummary] =
    useState<WorkerSummary | null>(null)
  const [workerTxs, setWorkerTxs]         = useState<WorkerTx[]>([])

  const [isLoading, setIsLoading]         = useState(true)

  useEffect(() => {
    if (!user?.piUid) return

    const headers = { 'x-pi-uid': user.piUid }
    const origin  = window.location.origin

    fetch(`${origin}/api/analytics/worker`, { headers })
      .then(r => r.json())
      .then(d => {
        if (d.summary)      setWorkerSummary(d.summary)
        if (d.transactions) setWorkerTxs(d.transactions)
        setIsLoading(false)
      })
      .catch(() => setIsLoading(false))
  }, [user?.piUid, user?.userRole])

  if (!user) {
    return (
      <div style={{
        minHeight:      '100vh',
        background:     COLORS.bgBase,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        fontFamily:     FONTS.sans,
        color:          COLORS.textSecondary,
      }}>
        Connecting...
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
      <Navigation currentPage="analytics" />

      <main className="page-main">

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{
            margin:     '0 0 0.25rem',
            fontSize:   'clamp(1.25rem, 5vw, 1.5rem)',
            fontWeight: '700',
          }}>
            Analytics
          </h1>
          <p style={{ margin: 0, color: COLORS.textMuted, fontSize: 'clamp(0.75rem, 2vw, 0.875rem)' }}>
            Your financial activity on Nexus
          </p>
        </div>

        {/* Tab bar */}


        {isLoading && (
          <div style={{
            display:       'flex',
            flexDirection: 'column',
            gap:           '0.75rem',
          }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                background:   COLORS.bgSurface,
                borderRadius: RADII.lg,
                height:       '80px',
                border:       `1px solid ${COLORS.border}`,
              }} />
            ))}
          </div>
        )}

        {/* Worker analytics */}
        {!isLoading && (
          <div>
            {/* Stats grid - responsive columns */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap:     'clamp(0.5rem, 2vw, 0.75rem)',
              marginBottom: '2rem',
            }}>
              <StatCard
                label="Total Earned"
                value={formatPi(workerSummary?.totalEarned ?? 0)}
                color={COLORS.emerald}
                sub="confirmed payouts"
              />
              <StatCard
                label="This Week"
                value={formatPi(workerSummary?.thisWeekEarned ?? 0)}
                color={COLORS.sapphireLight}
              />
              <StatCard
                label="Pending"
                value={formatPi(workerSummary?.totalPending ?? 0)}
                color={COLORS.amber}
                sub={`${workerSummary?.pendingCount ?? 0} payouts`}
              />
            </div>

            {/* Fee info - responsive flex with wrap */}
            <div style={{
              background:   COLORS.bgSurface,
              border:       `1px solid ${COLORS.border}`,
              borderRadius: RADII.lg,
              padding:      'clamp(0.875rem, 2vw, 1.25rem)',
              marginBottom: '1.5rem',
              fontSize:     'clamp(0.7rem, 2vw, 0.8rem)',
              color:        COLORS.textMuted,
              display:      'flex',
              flexWrap:     'wrap',
              gap:          'clamp(0.75rem, 3vw, 1.5rem)',
            }}>
              <span>
                Platform fee: {(PLATFORM_CONFIG.PLATFORM_FEE_RATE * 100).toFixed(0)}%
              </span>
            </div>

            {/* Transaction history */}
            <h2 style={{
              margin:        '0 0 1rem',
              fontSize:      '0.85rem',
              fontWeight:    '600',
              color:         COLORS.textMuted,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.05em',
            }}>
              Payout History
            </h2>

            {workerTxs.length === 0 && (
              <div style={{
                padding:      '2.5rem',
                textAlign:    'center',
                background:   COLORS.bgSurface,
                borderRadius: RADII.lg,
                border:       `1px solid ${COLORS.border}`,
                color:        COLORS.textMuted,
                fontSize:     '0.875rem',
              }}>
                No payouts yet.{' '}
                <Link href="/feed" style={{ color: COLORS.indigo }}>
                  Find tasks →
                </Link>
              </div>
            )}

            <div style={{
              display:       'flex',
              flexDirection: 'column',
              gap:           '0.5rem',
            }}>
              {workerTxs.map(tx => (
                <div key={tx.id} style={{
                  background:   COLORS.bgSurface,
                  border:       `1px solid ${COLORS.border}`,
                  borderRadius: RADII.lg,
                  padding:      '1rem 1.25rem',
                  display:      'flex',
                  justifyContent: 'space-between',
                  alignItems:   'center',
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontWeight:   '600',
                      fontSize:     '0.875rem',
                      marginBottom: '0.2rem',
                    }}>
                      {tx.task?.title ?? 'Unknown task'}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color:    COLORS.textMuted,
                      display:  'flex',
                      gap:      '0.75rem',
                    }}>
                      <span>{tx.task?.category}</span>
                      <span>{formatDate(tx.createdAt)}</span>
                      <span style={{ color: statusColor(tx.status) }}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontWeight: '700',
                      color:      COLORS.emerald,
                      fontSize:   '0.95rem',
                    }}>
                      +{formatPi(Number(tx.netAmount))}
                    </div>
                    <div style={{
                      fontSize: '0.72rem',
                      color:    COLORS.textMuted,
                    }}>
                      of {formatPi(Number(tx.amount))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}





      </main>
    </div>
  )
}
