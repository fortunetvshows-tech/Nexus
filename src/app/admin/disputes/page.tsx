'use client'

import { useEffect, useState, useRef } from 'react'
import Link                             from 'next/link'
import { usePiAuth }                    from '@/hooks/use-pi-auth'
import { Navigation }                   from '@/components/Navigation'
import { COLORS, FONTS, SPACING, RADII, SHADOWS } from '@/lib/design/tokens'

interface AdminDispute {
  id:                string
  status:            string
  tier2VotesFor:     number
  tier2VotesAgainst: number
  resolvedInFavor:   string | null
  createdAt:         string
  raisedBy:          string
  againstUser:       string
  worker:            { id: string; piUsername: string; reputationLevel: string } | null
  employer:          { id: string; piUsername: string } | null
  submission: {
    id:              string
    status:          string
    rejectionReason: string | null
    task:            { id: string; title: string; category: string } | null
  } | null
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hrs  = Math.floor(diff / 3600000)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const STATUS_COLOR: Record<string, string> = {
  raised:            COLORS.amber,
  tier1_review:      COLORS.amber,
  tier2_review:      COLORS.indigo,
  tier3_review:      COLORS.red,
  resolved_worker:   COLORS.emerald,
  resolved_employer: COLORS.textMuted,
  closed_no_action:  COLORS.textMuted,
}

export default function AdminDisputesPage() {
  const { user, authenticate, isSdkReady } = usePiAuth()
  const hasAutoAuth = useRef(false)

  const [disputes,   setDisputes]   = useState<AdminDispute[]>([])
  const [isLoading,  setIsLoading]  = useState(true)
  const [resolving,  setResolving]  = useState<string | null>(null)
  const [error,      setError]      = useState<string | null>(null)
  const [filter,     setFilter]     = useState<'all' | 'active' | 'resolved'>('active')

  useEffect(() => {
    if (isSdkReady && !user && !hasAutoAuth.current) {
      hasAutoAuth.current = true
      authenticate()
    }
  }, [isSdkReady, user, authenticate])

  useEffect(() => {
    if (!user?.piUid) return

    fetch(`${window.location.origin}/api/admin/disputes`, {
      headers: { 'x-pi-uid': user.piUid },
    })
      .then(r => r.json())
      .then(d => {
        if (d.disputes) setDisputes(d.disputes)
      })
      .finally(() => setIsLoading(false))
  }, [user?.piUid])

  const handleResolve = async (disputeId: string, resolution: string) => {
    if (!user?.piUid) return
    setResolving(disputeId)
    setError(null)

    try {
      const res = await fetch(`${window.location.origin}/api/admin/disputes`, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-pi-uid':     user.piUid,
        },
        body: JSON.stringify({ disputeId, resolution }),
      })
      const data = await res.json()

      if (!data.success) {
        setError(data.error ?? 'Resolution failed')
        return
      }

      // Update local state
      setDisputes(prev => prev.map(d =>
        d.id === disputeId
          ? { ...d, status: resolution }
          : d
      ))
    } catch {
      setError('Network error')
    } finally {
      setResolving(null)
    }
  }

  const activeDisputes   = disputes.filter(d =>
    !['resolved_worker','resolved_employer','closed_no_action'].includes(d.status)
  )
  const resolvedDisputes = disputes.filter(d =>
    ['resolved_worker','resolved_employer','closed_no_action'].includes(d.status)
  )
  const filteredDisputes = filter === 'all'      ? disputes
                         : filter === 'active'   ? activeDisputes
                         : resolvedDisputes

  if (!user) {
    return (
      <div style={{
        minHeight:      '100vh',
        background:     COLORS.bgBase,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        color:          COLORS.textMuted,
        fontFamily:     FONTS.sans,
      }}>
        Connecting...
      </div>
    )
  }

  if (!user.isAdmin) {
    return (
      <div style={{
        minHeight:      '100vh',
        background:     COLORS.bgBase,
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        color:          COLORS.textMuted,
        fontFamily:     FONTS.sans,
        gap:            SPACING.lg,
      }}>
        <div style={{ fontSize: '2rem' }}>🔒</div>
        <div>Admin access required</div>
        <Link href="/dashboard" style={{ color: COLORS.indigo, textDecoration: 'none', fontSize: '0.85rem' }}>
          ← Back to Dashboard
        </Link>
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
      <Navigation currentPage="dashboard" />

      <main className="page-main">

        {/* Header */}
        <div style={{
          display:        'flex',
          justifyContent: 'space-between',
          alignItems:     'flex-start',
          marginBottom:   SPACING.xl,
        }}>
          <div>
            <div style={{
              fontSize:      '0.65rem',
              fontWeight:    '600',
              color:         COLORS.textMuted,
              letterSpacing: '0.1em',
              textTransform: 'uppercase' as const,
              marginBottom:  '4px',
              fontFamily:    FONTS.mono,
            }}>
              Admin Panel
            </div>
            <h1 style={{
              margin:        0,
              fontSize:      'clamp(1.25rem, 4vw, 1.75rem)',
              fontWeight:    '700',
              letterSpacing: '-0.02em',
            }}>
              Dispute Management
            </h1>
          </div>
          <div style={{
            display:    'flex',
            alignItems: 'center',
            gap:        SPACING.sm,
          }}>
            {activeDisputes.length > 0 && (
              <div style={{
                padding:      '4px 12px',
                background:   COLORS.redDim,
                border:       `1px solid rgba(239,68,68,0.3)`,
                borderRadius: RADII.full,
                fontSize:     '0.75rem',
                fontWeight:   '700',
                color:        COLORS.red,
                fontFamily:   FONTS.mono,
              }}>
                {activeDisputes.length} active
              </div>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding:      SPACING.md,
            background:   COLORS.redDim,
            border:       `1px solid rgba(239,68,68,0.3)`,
            borderRadius: RADII.md,
            color:        COLORS.red,
            fontSize:     '0.85rem',
            marginBottom: SPACING.lg,
          }}>
            {error}
          </div>
        )}

        {/* Filter tabs */}
        <div style={{
          display:      'flex',
          gap:          '0.375rem',
          marginBottom: SPACING.lg,
          background:   COLORS.bgElevated,
          borderRadius: RADII.lg,
          padding:      '0.3rem',
          border:       `1px solid ${COLORS.border}`,
        }}>
          {[
            { key: 'active',   label: `Active (${activeDisputes.length})`,     color: COLORS.red        },
            { key: 'resolved', label: `Resolved (${resolvedDisputes.length})`, color: COLORS.emerald    },
            { key: 'all',      label: `All (${disputes.length})`,              color: COLORS.textSecondary },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as typeof filter)}
              style={{
                flex:         1,
                padding:      '0.4rem 0.5rem',
                borderRadius: RADII.md,
                border:       'none',
                background:   filter === tab.key ? COLORS.bgSurface : 'transparent',
                color:        filter === tab.key ? tab.color : COLORS.textMuted,
                fontSize:     '0.78rem',
                fontWeight:   filter === tab.key ? '600' : '400',
                cursor:       'pointer',
                transition:   'all 0.15s ease',
                fontFamily:   FONTS.sans,
                whiteSpace:   'nowrap' as const,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Disputes list */}
        {isLoading ? (
          <div style={{
            display:       'flex',
            flexDirection: 'column',
            gap:           SPACING.sm,
          }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="nexus-card" style={{ height: '120px' }} />
            ))}
          </div>
        ) : filteredDisputes.length === 0 ? (
          <div style={{
            padding:        `${SPACING.xxl} ${SPACING.xl}`,
            textAlign:      'center',
            background:     COLORS.bgSurface,
            border:         `1px solid ${COLORS.border}`,
            borderRadius:   RADII.xl,
            color:          COLORS.textMuted,
            fontSize:       '0.85rem',
          }}>
            <div style={{ fontSize: '2rem', marginBottom: SPACING.md, opacity: 0.4 }}>⚖</div>
            No {filter === 'all' ? '' : filter} disputes
          </div>
        ) : (
          <div style={{
            display:       'flex',
            flexDirection: 'column',
            gap:           SPACING.sm,
          }}>
            {filteredDisputes.map((dispute, idx) => {
              const isActive  = activeDisputes.includes(dispute)
              const isStuck   = dispute.status === 'tier2_review' || dispute.status === 'tier3_review'
              const statusColor = STATUS_COLOR[dispute.status] ?? COLORS.textMuted

              return (
                <div
                  key={dispute.id}
                  className="nexus-card"
                  style={{
                    borderLeft:  `3px solid ${statusColor}`,
                    animation:   `fade-up 0.3s ease ${idx * 0.06}s both`,
                    background:  isStuck
                      ? `linear-gradient(180deg, rgba(239,68,68,0.03) 0%, transparent 100%), ${COLORS.bgSurface}`
                      : undefined,
                  }}
                >
                  {/* Stuck warning */}
                  {isStuck && (
                    <div style={{
                      padding:      `${SPACING.xs} ${SPACING.sm}`,
                      background:   COLORS.redDim,
                      border:       `1px solid rgba(239,68,68,0.2)`,
                      borderRadius: RADII.sm,
                      fontSize:     '0.7rem',
                      color:        COLORS.red,
                      fontWeight:   '600',
                      marginBottom: SPACING.md,
                      display:      'flex',
                      alignItems:   'center',
                      gap:          '6px',
                    }}>
                      ⚠ Stuck — insufficient arbitrators. Admin resolution required.
                    </div>
                  )}

                  {/* Dispute info */}
                  <div style={{
                    display:        'flex',
                    justifyContent: 'space-between',
                    alignItems:     'flex-start',
                    marginBottom:   SPACING.md,
                  }}>
                    <div style={{ flex: 1, minWidth: 0, marginRight: SPACING.md }}>
                      <div style={{
                        fontSize:     '0.875rem',
                        fontWeight:   '600',
                        color:        COLORS.textPrimary,
                        marginBottom: '4px',
                        overflow:     'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace:   'nowrap' as const,
                      }}>
                        {dispute.submission?.task?.title ?? 'Unknown task'}
                      </div>
                      <div style={{
                        fontSize: '0.75rem',
                        color:    COLORS.textMuted,
                        display:  'flex',
                        gap:      '0.625rem',
                        flexWrap: 'wrap' as const,
                      }}>
                        <span>Worker: <strong style={{ color: COLORS.textSecondary }}>{dispute.worker?.piUsername}</strong></span>
                        <span>·</span>
                        <span>Employer: <strong style={{ color: COLORS.textSecondary }}>{dispute.employer?.piUsername}</strong></span>
                        <span>·</span>
                        <span>{timeAgo(dispute.createdAt)}</span>
                      </div>
                    </div>

                    <span style={{
                      padding:      '3px 10px',
                      background:   `${statusColor}18`,
                      border:       `1px solid ${statusColor}40`,
                      borderRadius: RADII.full,
                      fontSize:     '0.65rem',
                      fontWeight:   '700',
                      color:        statusColor,
                      fontFamily:   FONTS.mono,
                      flexShrink:   0,
                      letterSpacing: '0.03em',
                    }}>
                      {dispute.status.toUpperCase().replace('_', ' ')}
                    </span>
                  </div>

                  {/* Rejection reason */}
                  {dispute.submission?.rejectionReason && (
                    <div style={{
                      padding:      `${SPACING.xs} ${SPACING.sm}`,
                      background:   COLORS.bgElevated,
                      border:       `1px solid ${COLORS.border}`,
                      borderRadius: RADII.sm,
                      fontSize:     '0.78rem',
                      color:        COLORS.textSecondary,
                      marginBottom: SPACING.md,
                      lineHeight:   '1.4',
                    }}>
                      <span style={{ color: COLORS.textMuted, fontSize: '0.65rem', fontWeight: '600' }}>
                        REJECTION REASON:{' '}
                      </span>
                      {dispute.submission.rejectionReason}
                    </div>
                  )}

                  {/* Vote progress */}
                  {dispute.status === 'tier2_review' && (
                    <div style={{
                      marginBottom: SPACING.md,
                      fontSize:     '0.72rem',
                      color:        COLORS.textMuted,
                    }}>
                      Votes: {dispute.tier2VotesFor + dispute.tier2VotesAgainst}/3 cast
                      · For worker: {dispute.tier2VotesFor}
                      · For employer: {dispute.tier2VotesAgainst}
                    </div>
                  )}

                  {/* Admin resolve buttons — only for active disputes */}
                  {isActive && (
                    <div style={{
                      display:             'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap:                 SPACING.sm,
                      paddingTop:          SPACING.sm,
                      borderTop:           `1px solid ${COLORS.border}`,
                    }}>
                      <button
                        onClick={() => handleResolve(dispute.id, 'resolved_worker')}
                        disabled={resolving === dispute.id}
                        style={{
                          padding:      `${SPACING.sm} ${SPACING.md}`,
                          background:   COLORS.emeraldDim,
                          border:       `1px solid rgba(16,185,129,0.3)`,
                          borderRadius: RADII.md,
                          fontSize:     '0.78rem',
                          fontWeight:   '600',
                          color:        COLORS.emerald,
                          cursor:       resolving === dispute.id ? 'not-allowed' : 'pointer',
                          fontFamily:   FONTS.sans,
                          transition:   'all 0.15s ease',
                        }}
                      >
                        ✓ Rule for Worker
                      </button>
                      <button
                        onClick={() => handleResolve(dispute.id, 'resolved_employer')}
                        disabled={resolving === dispute.id}
                        style={{
                          padding:      `${SPACING.sm} ${SPACING.md}`,
                          background:   COLORS.redDim,
                          border:       `1px solid rgba(239,68,68,0.3)`,
                          borderRadius: RADII.md,
                          fontSize:     '0.78rem',
                          fontWeight:   '600',
                          color:        COLORS.red,
                          cursor:       resolving === dispute.id ? 'not-allowed' : 'pointer',
                          fontFamily:   FONTS.sans,
                          transition:   'all 0.15s ease',
                        }}
                      >
                        ✗ Uphold Rejection
                      </button>
                    </div>
                  )}

                  {/* Resolved outcome */}
                  {!isActive && (
                    <div style={{
                      paddingTop:  SPACING.sm,
                      borderTop:   `1px solid ${COLORS.border}`,
                      fontSize:    '0.75rem',
                      color:       dispute.status === 'resolved_worker' ? COLORS.emerald : COLORS.textMuted,
                      fontWeight:  '500',
                    }}>
                      {dispute.status === 'resolved_worker'
                        ? `✓ Resolved in favor of ${dispute.worker?.piUsername}`
                        : dispute.status === 'resolved_employer'
                        ? `Resolved in favor of ${dispute.employer?.piUsername}`
                        : 'Closed with no action'}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
