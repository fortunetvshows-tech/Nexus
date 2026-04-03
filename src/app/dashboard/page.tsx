'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Link            from 'next/link'
import { usePiAuth }   from '@/hooks/use-pi-auth'
import { Navigation }  from '@/components/Navigation'
import { BentoGrid }         from '@/components/BentoGrid'
import { EarningsCard }      from '@/components/bento/EarningsCard'
import { ActivityFeedCard }  from '@/components/bento/ActivityFeedCard'
import { ReputationMiniCard } from '@/components/bento/ReputationMiniCard'
import { LeaderboardCard }   from '@/components/bento/LeaderboardCard'
import { RejectionCard }     from '@/components/bento/RejectionCard'
import { DisputeTrackerCard } from '@/components/bento/DisputeTrackerCard'
import { COLORS, FONTS, SPACING, RADII, SHADOWS, GRADIENTS, statusStyle, COMPONENT_STYLES } from '@/lib/design/tokens'
import { PLATFORM_CONFIG }  from '@/lib/config/platform'

// ── Types ──────────────────────────────────────────────────────────────

interface Submission {
  id:              string
  status:          string
  agreedReward:    number
  rejectionReason: string | null
  submittedAt:     string
  reviewedAt?:     string
  updatedAt?:      string
  task: {
    id:       string
    title:    string
    category: string
    piReward: number
  }
}

interface WorkerDispute {
  id:              string
  status:          string
  tier2VotesFor:   number
  tier2VotesAgainst: number
  resolvedInFavor: string | null
  createdAt:       string
  submission: {
    id:   string
    task: {
      id: string
      title: string
      category: string
    } | null
  } | null
}

// ── Types ──────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const {
    user,
    isAuthenticated,
    isSdkReady,
    authenticate,
  } = usePiAuth()

  // Worker data
  const [submissions,   setSubmissions]   = useState<Submission[]>([])
  const [submissionFilter, setSubmissionFilter] = useState<'all' | 'APPROVED' | 'SUBMITTED' | 'REJECTED'>('all')
  const [subLoading,    setSubLoading]    = useState(false)
  const [workerAnalytics, setWorkerAnalytics] = useState<{
    summary: {
      totalEarned:    number
      thisWeekEarned: number
      totalPending:   number
      totalSpent:     number
    }
  } | null>(null)

  // Worker reputation stats for mini card
  const [workerStats, setWorkerStats] = useState({
    reputationScore:   0,
    reputationLevel:   'Newcomer',
    kycLevel:          0,
    tasksCompleted:    0,
  })

  // Disputes data
  const [workerDisputes, setWorkerDisputes] = useState<WorkerDispute[]>([])

  // Fetch worker submissions
  const fetchSubmissions = useCallback(() => {
    if (!user?.piUid) return
    setSubLoading(true)
    fetch(`${window.location.origin}/api/worker/submissions`, {
      headers: { 'x-pi-uid': user.piUid },
    })
      .then(r => r.json())
      .then(d => {
        if (d.submissions) setSubmissions(d.submissions)
        setSubLoading(false)
      })
      .catch(() => setSubLoading(false))
  }, [user?.piUid])

  // Fetch worker analytics
  const fetchWorkerAnalytics = useCallback(() => {
    if (!user?.piUid) return
    fetch(`${window.location.origin}/api/analytics/worker`, {
      headers: { 'x-pi-uid': user.piUid },
    })
      .then(r => r.json())
      .then(d => {
        if (d.summary) setWorkerAnalytics({ summary: d.summary })
      })
      .catch(console.error)
  }, [user?.piUid])

  // Fetch worker disputes
  const fetchWorkerDisputes = useCallback(() => {
    if (!user?.piUid) return
    fetch(`${window.location.origin}/api/disputes/worker`, {
      headers: { 'x-pi-uid': user.piUid },
    })
      .then(r => r.json())
      .then(d => {
        if (d.disputes) setWorkerDisputes(d.disputes)
      })
      .catch(console.error)
  }, [user?.piUid])

  useEffect(() => {
    if (user?.piUid) {
      fetchSubmissions()
      fetchWorkerAnalytics()
      fetchWorkerDisputes()
    }
  }, [user?.piUid, fetchSubmissions, fetchWorkerAnalytics, fetchWorkerDisputes])

  // Update worker stats for reputation card
  useEffect(() => {
    if (user) {
      const tasksCompleted = submissions.filter(s => s.status === 'APPROVED').length
      setWorkerStats({
        reputationScore: user.reputationScore ?? 0,
        reputationLevel: user.reputationLevel ?? 'Newcomer',
        kycLevel:        user.kycLevel ?? 0,
        tasksCompleted,
      })
    }
  }, [user, submissions])

  // ── Stats ──────────────────────────────────────────────────────────

  const totalEarned    = workerAnalytics?.summary?.totalEarned    ?? 0
  const thisWeekEarned = workerAnalytics?.summary?.thisWeekEarned ?? 0
  const pendingAmount  = workerAnalytics?.summary?.totalPending   ?? 0
  const totalSpent     = workerAnalytics?.summary?.totalSpent     ?? 0
  const completedTasks = submissions.filter(s => s.status === 'APPROVED').length
  const pendingReview = submissions.filter(
    s => s.status === 'SUBMITTED'
  ).length

  const openDisputes = submissions.filter(
    s => s.status === 'DISPUTED'
  ).length

  const rejectedCount  = submissions.filter(s => s.status === 'REJECTED').length
  const pendingCount   = submissions.filter(s => s.status === 'SUBMITTED').length
  const approvedCount  = submissions.filter(s => s.status === 'APPROVED').length

  const filteredSubmissions = submissionFilter === 'all'
    ? submissions
    : submissions.filter(s => s.status === submissionFilter)

  const recentSubmissions = submissions.slice(0, 4)

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs  = Math.floor(mins / 60)
    if (hrs  < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  // ── Loading / unauthenticated ──────────────────────────────────────

  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight:      '100vh',
        background:     COLORS.bgBase,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        flexDirection:  'column',
        gap:            '1rem',
        fontFamily:     FONTS.sans,
      }}>
        <p style={{ color: COLORS.textSecondary, margin: 0 }}>
          Connecting to Pi Network...
        </p>
        {isSdkReady && (
          <button
            onClick={authenticate}
            style={{
              padding:      '0.75rem 2rem',
              background:   `linear-gradient(135deg, ${COLORS.sapphire}, ${COLORS.sapphireDark})`,
              color:        'white',
              border:       `1px solid ${COLORS.cyan}`,
              borderRadius: RADII.lg,
              fontSize:     '1rem',
              fontWeight:   '600',
              cursor:       'pointer',
              boxShadow:    SHADOWS.cyanGlow,
            }}
          >
            Connect with Pi
          </button>
        )}
      </div>
    )
  }

  // ── Dashboard ─────────────────────────────────────────────────────

  return (
    <div style={{
      minHeight:  '100vh',
      background: COLORS.bgBase,
      fontFamily: FONTS.sans,
      color:      COLORS.textPrimary,
    }}>
      <Navigation currentPage="dashboard" />

      <main className="page-main">

        {/* ── Earning Machine Header ─────────────────────── */}
        <div style={{
          marginBottom: SPACING.lg,
        }}>
          {/* Greeting + earnings summary */}
          <div style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            marginBottom:   SPACING.md,
          }}>
            <div>
              <div style={{
                fontSize:   '0.78rem',
                color:      COLORS.cyan,
                marginBottom: '2px',
              }}>
                Welcome back
              </div>
              <div style={{
                fontSize:   '1.3rem',
                fontWeight: '800',
                color:      COLORS.textPrimary,
                letterSpacing: '-0.02em',
              }}>
                {user?.piUsername}
              </div>
            </div>

            {/* Total earned — always visible */}
            <div style={{
              textAlign: 'right' as const,
            }}>
              <div style={{
                fontSize:   '0.68rem',
                color:      COLORS.textMuted,
                marginBottom: '2px',
                textTransform: 'uppercase' as const,
                letterSpacing: '0.08em',
              }}>
                Total earned
              </div>
              <div style={{
                fontFamily:    FONTS.mono,
                fontSize:      '1.5rem',
                fontWeight:    '800',
                color:         COLORS.emerald,
                letterSpacing: '-0.03em',
                lineHeight:    1,
              }}>
                {totalEarned.toFixed(2)}π
              </div>
            </div>
          </div>

          {/* Hero CTA — the most important element */}
          <Link
            href="/feed"
            style={{
              display:        'block',
              padding:        '1rem 1.5rem',
              background:     `linear-gradient(135deg, ${COLORS.sapphire}, ${COLORS.sapphireDark})`,
              borderRadius:   RADII.xl,
              textDecoration: 'none',
              boxShadow:      SHADOWS.cyanGlow,
              position:       'relative' as const,
              overflow:       'hidden',
              border:         `1px solid ${COLORS.cyan}`,
            }}
          >
            {/* Background shimmer */}
            <div style={{
              position:   'absolute' as const,
              top:        0,
              left:       0,
              right:      0,
              bottom:     0,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 60%)',
              pointerEvents: 'none' as const,
            }} />

            <div style={{
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'space-between',
            }}>
              <div>
                <div style={{
                  fontSize:   '1rem',
                  fontWeight: '800',
                  color:      'white',
                  marginBottom: '2px',
                }}>
                  Start earning Pi now
                </div>
                <div style={{
                  fontSize: '0.78rem',
                  color:    'rgba(255,255,255,0.7)',
                }}>
                  {pendingReview > 0
                    ? `${pendingReview} submission${pendingReview > 1 ? 's' : ''} pending review`
                    : 'New opportunities available'}
                </div>
              </div>
              <div style={{
                fontSize:   '1.5rem',
                color:      'white',
                fontWeight: '700',
              }}>
                →
              </div>
            </div>
          </Link>
        </div>

        {/* Bento Grid */}
        <BentoGrid
          columns={3}
          gap="0.875rem"
          items={[

            // Row 1: Earnings (wide) + Reputation
            {
              id:      'earnings',
              colSpan: 2,
              rowSpan: 1,
              children: (
                <EarningsCard
                  totalEarned={totalEarned}
                  thisWeekEarned={thisWeekEarned}
                  pendingAmount={pendingAmount}
                  totalSpent={totalSpent}
                />
              ),
            },
            {
              id:      'reputation',
              colSpan: 1,
              children: (
                <ReputationMiniCard
                  reputationScore={workerStats.reputationScore}
                  reputationLevel={workerStats.reputationLevel}
                  kycLevel={workerStats.kycLevel}
                  tasksCompleted={workerStats.tasksCompleted}
                />
              ),
            },

            // Row 2: Activity (wide) + Leaderboard
            {
              id:      'activity',
              colSpan: 2,
              children: (
                <ActivityFeedCard
                  submissions={recentSubmissions.map(sub => ({
                    id:        sub.id,
                    status:    sub.status,
                    taskTitle: sub.task?.title ?? 'Unknown task',
                    reward:    Number(sub.agreedReward ?? 0) * (1 - PLATFORM_CONFIG.PLATFORM_FEE_RATE),
                    timeAgo:   sub.submittedAt
                      ? timeAgo(sub.submittedAt)
                      : 'recently',
                  }))}
                />
              ),
            },
            {
              id:      'leaderboard',
              colSpan: 1,
              children: (
                <LeaderboardCard
                  piUid={user?.piUid ?? ''}
                  username={user?.piUsername ?? ''}
                />
              ),
            },

          ]}
        />

      {/* ══════════════════════════════════════════════════════
          WORKER SECTION — My Earning History
        ═══════════════════════════════════════════════════════ */}

      {/* Section divider */}
      <div style={{
        display:    'flex',
        alignItems: 'center',
        gap:        '0.75rem',
        margin:     `${SPACING.xxl} 0 ${SPACING.lg}`,
        padding:    `${SPACING.md} ${SPACING.lg}`,
        background: `linear-gradient(135deg, rgba(15, 82, 186, 0.05), transparent), ${COLORS.bgSurface}`,
        borderRadius: RADII.lg,
        border:     `1px solid ${COLORS.cyan}`,
        boxShadow:  '0 4px 24px rgba(8, 26, 51, 0.2), 0 0 20px rgba(0, 229, 229, 0.06)',
        backdropFilter: 'blur(10px)',
      }}>
        <div style={{
          fontSize:      '0.65rem',
          fontWeight:    '600',
          color:         COLORS.cyan,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.1em',
          whiteSpace:    'nowrap' as const,
        }}>
          My Work
        </div>
        <div style={{
          height:     '1px',
          flex:       1,
          background: `linear-gradient(90deg, transparent, ${COLORS.cyan}, transparent)`,
        }} />
        {/* Rejected alert badge */}
        {rejectedCount > 0 && (
          <div style={{
            padding:      '2px 8px',
            background:   COLORS.redDim,
            border:       `1px solid ${COLORS.red}`,
            borderRadius: RADII.full,
            fontSize:     '0.68rem',
            fontWeight:   '700',
            color:        COLORS.red,
            whiteSpace:   'nowrap' as const,
            fontFamily:   FONTS.mono,
            animation:    'pulse-glow 2s infinite',
          }}>
            {rejectedCount} rejected
          </div>
        )}
      </div>

      {/* Three-state filter tabs */}
      {submissions.length > 0 && (
        <div style={{
          display:      'flex',
          gap:          '0.375rem',
          marginBottom: SPACING.lg,
          background:   `linear-gradient(135deg, rgba(15, 82, 186, 0.04), transparent), ${COLORS.bgSurface}`,
          borderRadius: RADII.lg,
          padding:      '0.3rem',
          border:       `1px solid ${COLORS.cyan}`,
          boxShadow:    '0 4px 24px rgba(8, 26, 51, 0.2), 0 0 12px rgba(0, 229, 229, 0.08)',
          backdropFilter: 'blur(10px)',
        }}>
          {[
            {
              key:   'all',
              label: `All (${submissions.length})`,
              color: COLORS.textSecondary,
            },
            {
              key:   'APPROVED',
              label: approvedCount > 0 ? `✓ Approved (${approvedCount})` : '✓ Approved',
              color: COLORS.emerald,
            },
            {
              key:   'SUBMITTED',
              label: pendingCount > 0 ? `⏳ Pending (${pendingCount})` : '⏳ Pending',
              color: COLORS.amber,
            },
            {
              key:   'REJECTED',
              label: rejectedCount > 0 ? `✗ Rejected (${rejectedCount})` : '✗ Rejected',
              color: COLORS.red,
            },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setSubmissionFilter(tab.key as typeof submissionFilter)}
              style={{
                flex:         1,
                padding:      '0.4rem 0.25rem',
                borderRadius: RADII.md,
                border:       'none',
                background:   submissionFilter === tab.key
                  ? COLORS.bgSurface
                  : 'transparent',
                color:        submissionFilter === tab.key
                  ? tab.color
                  : COLORS.textMuted,
                fontSize:     '0.72rem',
                fontWeight:   submissionFilter === tab.key ? '600' : '400',
                cursor:       'pointer',
                transition:   'all 0.15s ease',
                whiteSpace:   'nowrap' as const,
                fontFamily:   FONTS.sans,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Submissions list */}
      {submissions.length === 0 ? (
        <div style={{
          padding:        `${SPACING.xxl} ${SPACING.xl}`,
          textAlign:      'center',
          background:     `linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%), ${COLORS.bgSurface}`,
          border:         `1px solid ${COLORS.border}`,
          borderRadius:   RADII.xl,
        }}>
          <div style={{ fontSize: '1.75rem', marginBottom: SPACING.md, opacity: 0.4 }}>✨</div>
          <div style={{ fontSize: '0.95rem', fontWeight: '600', color: COLORS.textPrimary, marginBottom: SPACING.sm }}>
            No submissions yet
          </div>
          <div style={{ fontSize: '0.85rem', color: COLORS.textSecondary, marginBottom: SPACING.xl }}>
            Complete tasks to start earning Pi.
          </div>
          <Link
            href="/feed"
            style={{
              padding:        `${SPACING.sm} ${SPACING.xl}`,
              background:     `linear-gradient(135deg, ${COLORS.sapphire}, ${COLORS.sapphireDark})`,
              color:          'white',
              borderRadius:   RADII.md,
              fontSize:       '0.875rem',
              fontWeight:     '600',
              textDecoration: 'none',
              boxShadow:      SHADOWS.cyanGlow,
              border:         `1px solid ${COLORS.cyan}`,
            }}
          >
            Browse Tasks
          </Link>
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div style={{
          padding:      `${SPACING.xl}`,
          textAlign:    'center',
          background:   COLORS.bgSurface,
          border:       `1px solid ${COLORS.border}`,
          borderRadius: RADII.lg,
          color:        COLORS.textMuted,
          fontSize:     '0.85rem',
        }}>
          No {submissionFilter.toLowerCase()} submissions
        </div>
      ) : (
        <div style={{
          display:       'flex',
          flexDirection: 'column',
          gap:           SPACING.sm,
        }}>
          {filteredSubmissions.map((sub, idx) => {

            // REJECTED — show RejectionCard
            if (sub.status === 'REJECTED') {
              return (
                <RejectionCard
                  key={sub.id}
                  submissionId={sub.id}
                  taskId={sub.task?.id ?? ''}
                  taskTitle={sub.task?.title ?? 'Unknown task'}
                  taskCategory={sub.task?.category ?? ''}
                  reward={Number(sub.agreedReward ?? 0)}
                  rejectionReason={sub.rejectionReason ?? null}
                  rejectedAt={sub.updatedAt ?? sub.submittedAt}
                />
              )
            }

            // SUBMITTED — check if re-queued after dispute win
            if (sub.status === 'SUBMITTED') {
              const relatedDispute = workerDisputes.find(d => d.submission?.id === sub.id)
              const isRequeued = relatedDispute?.status === 'resolved_worker'

              return (
                <div
                  key={sub.id}
                  style={{
                    background:   isRequeued
                      ? `linear-gradient(180deg, rgba(16,185,129,0.04) 0%, transparent 100%), ${COLORS.bgSurface}`
                      : `linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%), ${COLORS.bgSurface}`,
                    border:       `1px solid ${isRequeued ? 'rgba(16,185,129,0.25)' : COLORS.border}`,
                    borderLeft:   `3px solid ${isRequeued ? COLORS.emerald : COLORS.amber}`,
                    borderRadius: RADII.lg,
                    padding:      `${SPACING.md} ${SPACING.lg}`,
                    animation:    `fade-up 0.3s ease ${idx * 0.06}s both`,
                  }}
                >
                  <div style={{
                    display:        'flex',
                    justifyContent: 'space-between',
                    alignItems:     'flex-start',
                    marginBottom:   isRequeued ? SPACING.sm : '4px',
                  }}>
                    <div style={{ flex: 1, minWidth: 0, marginRight: SPACING.md }}>
                      <div style={{
                        fontWeight:   '500',
                        fontSize:     '0.875rem',
                        color:        COLORS.textPrimary,
                        overflow:     'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace:   'nowrap' as const,
                        marginBottom: '3px',
                      }}>
                        {sub.task?.title ?? 'Unknown task'}
                      </div>
                      <div style={{
                        fontSize: '0.78rem',
                        color:    COLORS.textMuted,
                        display:  'flex',
                        gap:      '0.5rem',
                      }}>
                        <span>{sub.task?.category}</span>
                        <span>·</span>
                        <span style={{ fontFamily: FONTS.mono }}>{Number(sub.agreedReward ?? 0).toFixed(3)}π</span>
                      </div>
                    </div>
                    <span style={{
                      padding:      '2px 8px',
                      borderRadius: RADII.full,
                      fontSize:     '0.68rem',
                      fontWeight:   '600',
                      fontFamily:   FONTS.mono,
                      flexShrink:   0,
                      background:   isRequeued ? COLORS.emeraldDim : COLORS.amberDim,
                      color:        isRequeued ? COLORS.emerald : COLORS.amber,
                      border:       `1px solid ${isRequeued ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
                    }}>
                      {isRequeued ? 'DISPUTE WON' : 'PENDING'}
                    </span>
                  </div>

                  {/* Dispute win notice */}
                  {isRequeued && (
                    <div style={{
                      padding:      `${SPACING.xs} ${SPACING.sm}`,
                      background:   COLORS.emeraldDim,
                      border:       `1px solid rgba(16,185,129,0.2)`,
                      borderRadius: RADII.sm,
                      fontSize:     '0.75rem',
                      color:        COLORS.emerald,
                      marginTop:    SPACING.sm,
                    }}>
                      ✓ Dispute resolved in your favor — awaiting employer re-approval
                    </div>
                  )}

                  {/* Normal pending notice */}
                  {!isRequeued && (
                    <div style={{
                      fontSize: '0.75rem',
                      color:    COLORS.amber,
                      marginTop: '2px',
                    }}>
                      Awaiting employer review
                    </div>
                  )}
                </div>
              )
            }

            // APPROVED — link card
            const s = { color: COLORS.emerald, background: COLORS.emeraldDim }
            return (
              <Link
                key={sub.id}
                href={`/task/${sub.task?.id}`}
                style={{
                  display:        'block',
                  background:     `linear-gradient(180deg, rgba(16,185,129,0.04) 0%, transparent 100%), ${COLORS.bgSurface}`,
                  border:         `1px solid ${COLORS.border}`,
                  borderLeft:     `3px solid ${COLORS.emerald}`,
                  borderRadius:   RADII.lg,
                  padding:        `${SPACING.md} ${SPACING.lg}`,
                  textDecoration: 'none',
                  boxShadow:      SHADOWS.card,
                  animation:      `fade-up 0.3s ease ${idx * 0.06}s both`,
                }}
              >
                <div style={{
                  display:        'flex',
                  justifyContent: 'space-between',
                  alignItems:     'flex-start',
                  marginBottom:   '4px',
                }}>
                  <div style={{
                    fontWeight:   '500',
                    fontSize:     '0.875rem',
                    color:        COLORS.textPrimary,
                    overflow:     'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace:   'nowrap' as const,
                    flex:         1,
                    marginRight:  SPACING.md,
                  }}>
                    {sub.task?.title ?? 'Unknown task'}
                  </div>
                  <span style={{
                    padding:      '2px 8px',
                    borderRadius: RADII.full,
                    fontSize:     '0.68rem',
                    fontWeight:   '600',
                    letterSpacing: '0.03em',
                    fontFamily:   FONTS.mono,
                    flexShrink:   0,
                    background:   COLORS.emeraldDim,
                    color:        COLORS.emerald,
                    border:       `1px solid rgba(16,185,129,0.3)`,
                  }}>
                    APPROVED
                  </span>
                </div>
                <div style={{
                  fontSize: '0.78rem',
                  color:    COLORS.textMuted,
                  display:  'flex',
                  gap:      '0.75rem',
                  flexWrap: 'wrap' as const,
                }}>
                  <span>{sub.task?.category}</span>
                  <span style={{
                    color:      COLORS.emerald,
                    fontFamily: FONTS.mono,
                    fontWeight: '500',
                  }}>
                    {(Number(sub.agreedReward ?? 0) * (1 - PLATFORM_CONFIG.PLATFORM_FEE_RATE)).toFixed(3)}π
                  </span>
                  <span style={{ color: COLORS.emerald }}>Payment processed</span>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          DISPUTES SECTION — My Disputes (if any)
        ═══════════════════════════════════════════════════════ */}

      {workerDisputes.length > 0 && (
        <>
          {/* Section divider */}
          <div style={{
            display:    'flex',
            alignItems: 'center',
            gap:        '0.75rem',
            margin:     `${SPACING.xxl} 0 ${SPACING.lg}`,
            padding:    `${SPACING.md} ${SPACING.lg}`,
            background: `linear-gradient(135deg, rgba(15, 82, 186, 0.05), transparent), ${COLORS.bgSurface}`,
            borderRadius: RADII.lg,
            border:     `1px solid ${COLORS.cyan}`,
            boxShadow:  '0 4px 24px rgba(8, 26, 51, 0.2), 0 0 20px rgba(0, 229, 229, 0.06)',
            backdropFilter: 'blur(10px)',
          }}>
            <div style={{
              fontSize:      '0.65rem',
              fontWeight:    '600',
              color:         COLORS.cyan,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.1em',
              whiteSpace:    'nowrap' as const,
            }}>
              My Disputes
            </div>
            <div style={{
              height:     '1px',
              flex:       1,
              background: `linear-gradient(90deg, transparent, ${COLORS.cyan}, transparent)`,
            }} />
            {/* Active disputes badge */}
            {workerDisputes.some(d => !['resolved_worker', 'resolved_employer', 'closed_no_action'].includes(d.status)) && (
              <div style={{
                padding:      '2px 8px',
                background:   COLORS.sapphireDim,
                border:       `1px solid ${COLORS.sapphire}`,
                borderRadius: RADII.full,
                fontSize:     '0.68rem',
                fontWeight:   '700',
                color:        COLORS.sapphire,
                whiteSpace:   'nowrap' as const,
                fontFamily:   FONTS.mono,
              }}>
                {workerDisputes.filter(d => !['resolved_worker', 'resolved_employer', 'closed_no_action'].includes(d.status)).length} active
              </div>
            )}
          </div>

          {/* Disputes list */}
          <DisputeTrackerCard disputes={workerDisputes} workerId={user?.id ?? ''} />
        </>
      )}

      {/* ══════════════════════════════════════════════════════
          ══════════════════════════════════════════════════════ */}

      </main>
    </div>
  )
}


