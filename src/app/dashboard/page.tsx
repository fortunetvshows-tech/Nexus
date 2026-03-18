'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Link            from 'next/link'
import { usePiAuth }   from '@/hooks/use-pi-auth'
import { Navigation }  from '@/components/Navigation'
import { BentoGrid }         from '@/components/BentoGrid'
import { EarningsCard }      from '@/components/bento/EarningsCard'
import { ReputationCard }    from '@/components/bento/ReputationCard'
import { QuickActionsCard }  from '@/components/bento/QuickActionsCard'
import { ActivityFeedCard }  from '@/components/bento/ActivityFeedCard'
import { StatsRowCard }      from '@/components/bento/StatsRowCard'
import { COLORS, FONTS, SPACING, RADII, SHADOWS, GRADIENTS, statusStyle, COMPONENT_STYLES } from '@/lib/design/tokens'

// ── Types ──────────────────────────────────────────────────────────────

interface Submission {
  id:              string
  status:          string
  agreedReward:    number
  rejectionReason: string | null
  submittedAt:     string
  task: {
    id:       string
    title:    string
    category: string
    piReward: number
  }
}

interface PostedTask {
  id:             string
  title:          string
  category:       string
  piReward:       number
  slotsAvailable: number
  slotsRemaining: number
  taskStatus:     string
  createdAt:      string
}

// ── Types ──────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const {
    user,
    authenticate,
    isSdkReady,
    isAuthenticated,
  } = usePiAuth()

  const hasAutoAuthenticated = useRef(false)

  useEffect(() => {
    if (isSdkReady && !user && !hasAutoAuthenticated.current) {
      hasAutoAuthenticated.current = true
      authenticate()
    }
  }, [isSdkReady, user, authenticate])

  // Worker data
  const [submissions,   setSubmissions]   = useState<Submission[]>([])
  const [subLoading,    setSubLoading]    = useState(false)
  const [workerAnalytics, setWorkerAnalytics] = useState<{
    summary: {
      totalEarned:    number
      thisWeekEarned: number
      totalPending:   number
    }
  } | null>(null)

  // Employer data
  const [postedTasks,   setPostedTasks]   = useState<PostedTask[]>([])
  const [tasksLoading,  setTasksLoading]  = useState(false)

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

  // Fetch employer tasks
  const fetchPostedTasks = useCallback(() => {
    if (!user?.piUid) return
    setTasksLoading(true)
    fetch(`${window.location.origin}/api/employer/tasks`, {
      headers: { 'x-pi-uid': user.piUid },
    })
      .then(r => r.json())
      .then(d => {
        if (d.tasks) setPostedTasks(d.tasks)
        setTasksLoading(false)
      })
      .catch(() => setTasksLoading(false))
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

  useEffect(() => {
    if (user?.piUid) {
      fetchSubmissions()
      fetchPostedTasks()
      fetchWorkerAnalytics()
    }
  }, [user?.piUid, fetchSubmissions, fetchPostedTasks, fetchWorkerAnalytics])

  // ── Stats ──────────────────────────────────────────────────────────

  const totalEarned    = workerAnalytics?.summary?.totalEarned    ?? 0
  const thisWeekEarned = workerAnalytics?.summary?.thisWeekEarned ?? 0
  const pendingAmount  = workerAnalytics?.summary?.totalPending   ?? 0
  const completedTasks = submissions.filter(s => s.status === 'APPROVED').length
  const pendingReview = submissions.filter(
    s => s.status === 'SUBMITTED'
  ).length

  const openDisputes = submissions.filter(
    s => s.status === 'DISPUTED'
  ).length

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
              background:   GRADIENTS.indigo,
              color:        'white',
              border:       'none',
              borderRadius: RADII.lg,
              fontSize:     '1rem',
              fontWeight:   '600',
              cursor:       'pointer',
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

        {/* User header */}
        <div className="nexus-card" style={{
          display:      'flex',
          alignItems:   'center',
          gap:          SPACING.lg,
          marginBottom: SPACING.xl,
          padding:      `${SPACING.lg} ${SPACING.xl}`,
        }}>
          <div style={{
            width:          '44px',
            height:         '44px',
            borderRadius:   '12px',
            background:     'linear-gradient(135deg, var(--nexus-indigo), var(--nexus-indigo-light))',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            fontSize:       '1.1rem',
            fontWeight:     '700',
            color:          'white',
            flexShrink:     0,
            boxShadow:      'var(--nexus-shadow-indigo)',
          }}>
            {user?.piUsername?.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontWeight:   '600',
              fontSize:     '0.95rem',
              color:        COLORS.textPrimary,
              marginBottom: '2px',
            }}>
              {user?.piUsername}
            </div>
            <div style={{
              fontSize:   '0.75rem',
              color:      COLORS.textSecondary,
              fontFamily: "'Fira Code', monospace",
            }}>
              {user?.reputationLevel} · {user?.reputationScore} REP · KYC {user?.kycLevel}
            </div>
          </div>
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
                />
              ),
            },
            {
              id:      'reputation',
              colSpan: 1,
              children: (
                <ReputationCard
                  reputationScore={user?.reputationScore ?? 0}
                  reputationLevel={user?.reputationLevel ?? 'Newcomer'}
                  kycLevel={user?.kycLevel ?? 0}
                />
              ),
            },

            // Row 2: Stats (3 small cards)
            {
              id:       'stat-tasks',
              children: (
                <StatsRowCard
                  label="Tasks Completed"
                  value={completedTasks}
                  color={COLORS.indigo}
                  icon="✓"
                />
              ),
            },
            {
              id:       'stat-pending',
              children: (
                <StatsRowCard
                  label="Pending Review"
                  value={pendingReview}
                  color={pendingReview > 0 ? COLORS.amber : COLORS.textMuted}
                  icon="⏳"
                />
              ),
            },
            {
              id:       'stat-disputes',
              children: (
                <StatsRowCard
                  label="Open Disputes"
                  value={openDisputes}
                  color={openDisputes > 0 ? COLORS.red : COLORS.textMuted}
                  subValue={openDisputes > 0 ? 'Needs attention' : 'All clear'}
                  icon="⚖"
                />
              ),
            },

            // Row 3: Activity (wide) + Quick Actions
            {
              id:      'activity',
              colSpan: 2,
              children: (
                <ActivityFeedCard
                  submissions={recentSubmissions.map(sub => ({
                    id:        sub.id,
                    status:    sub.status,
                    taskTitle: sub.task?.title ?? 'Unknown task',
                    reward:    Number(sub.agreedReward ?? 0),
                    timeAgo:   sub.submittedAt
                      ? timeAgo(sub.submittedAt)
                      : 'recently',
                  }))}
                />
              ),
            },
            {
              id:      'quick-actions',
              children: <QuickActionsCard />,
            },

          ]}
        />

      {/* My Posted Tasks section — keep existing implementation below grid */}
      {postedTasks.length > 0 && (
        <div style={{ marginTop: SPACING.xl }}>
          <div style={{
            display:        'flex',
            justifyContent: 'space-between',
            alignItems:     'center',
            marginBottom:   SPACING.lg,
          }}>
            <h2 style={{
              margin:        '0',
              fontSize:      '0.72rem',
              fontWeight:    '600',
              color:         COLORS.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}>
              My Posted Tasks
            </h2>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <Link href="/employer/dashboard" style={{
                padding:        `${SPACING.sm} ${SPACING.lg}`,
                background:     COLORS.indigoDim,
                color:          COLORS.indigoLight,
                borderRadius:   RADII.md,
                fontSize:       '0.8rem',
                fontWeight:     '500',
                textDecoration: 'none',
                border:         `1px solid rgba(99,102,241,0.2)`,
              }}>
                Manage Posted Tasks →
              </Link>
              <Link href="/employer" style={{
                fontSize:       '0.8rem',
                color:          COLORS.indigo,
                textDecoration: 'none',
              }}>
                Post new →
              </Link>
            </div>
          </div>

          {tasksLoading && (
            <div style={{
              background:   COLORS.bgSurface,
              borderRadius: RADII.lg,
              height:       '80px',
              border:       `1px solid ${COLORS.border}`,
              boxShadow:    SHADOWS.card,
            }} />
          )}

          <div style={{
            display:       'flex',
            flexDirection: 'column',
            gap:           SPACING.sm,
          }}>
            {postedTasks.map(task => {
              const fillPct = Math.round(
                ((task.slotsAvailable - task.slotsRemaining)
                  / task.slotsAvailable) * 100
              )
              return (
                <div key={task.id} className="nexus-card" style={{
                  padding:      `${SPACING.lg} ${SPACING.xl}`,
                }}>
                  <div style={{
                    display:        'flex',
                    justifyContent: 'space-between',
                    alignItems:     'center',
                    marginBottom:   SPACING.md,
                  }}>
                    <div style={{
                      fontWeight: '500',
                      fontSize:   '0.875rem',
                      color:      COLORS.textPrimary,
                      flex:       1,
                    }}>
                      {task.title}
                    </div>
                    <Link
                      href={`/review/${task.id}`}
                      style={{
                        padding:        '0.4rem 0.875rem',
                        background:     GRADIENTS.indigo,
                        color:          'white',
                        borderRadius:   RADII.md,
                        fontSize:       '0.78rem',
                        fontWeight:     '500',
                        textDecoration: 'none',
                        whiteSpace:     'nowrap',
                        marginLeft:     SPACING.md,
                      }}
                    >
                      Review →
                    </Link>
                  </div>
                  <div style={{
                    fontSize:    '0.78rem',
                    color:       COLORS.textMuted,
                    marginBottom: SPACING.md,
                  }}>
                    {task.category}
                    {' · '}
                    {task.piReward}π per slot
                    {' · '}
                    {task.slotsRemaining}/{task.slotsAvailable} slots left
                  </div>
                  {/* Slot fill progress */}
                  <div style={{
                    background:   COLORS.bgElevated,
                    borderRadius: RADII.full,
                    height:       '3px',
                    overflow:     'hidden',
                  }}>
                    <div style={{
                      height:       '100%',
                      width:        `${fillPct}%`,
                      background:   GRADIENTS.indigo,
                      borderRadius: RADII.full,
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

        {/* My Posted Tasks */}
        {postedTasks.length > 0 && (
          <section>
            <div style={{
              display:        'flex',
              justifyContent: 'space-between',
              alignItems:     'center',
              marginBottom:   SPACING.lg,
            }}>
              <h2 style={{
                margin:        '0',
                fontSize:      '0.72rem',
                fontWeight:    '600',
                color:         COLORS.textMuted,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}>
                My Posted Tasks
              </h2>
              <Link href="/employer" style={{
                fontSize:       '0.8rem',
                color:          COLORS.indigo,
                textDecoration: 'none',
              }}>
                Post new →
              </Link>
            </div>

            {tasksLoading && (
              <div style={{
                background:   COLORS.bgSurface,
                borderRadius: RADII.lg,
                height:       '80px',
                border:       `1px solid ${COLORS.border}`,
                boxShadow:    SHADOWS.card,
              }} />
            )}

            <div style={{
              display:       'flex',
              flexDirection: 'column',
              gap:           SPACING.sm,
            }}>
              {postedTasks.map(task => {
                const fillPct = Math.round(
                  ((task.slotsAvailable - task.slotsRemaining)
                    / task.slotsAvailable) * 100
                )
                return (
                  <div key={task.id} style={{
                    background:   `${GRADIENTS.card}, ${COLORS.bgSurface}`,
                    border:       `1px solid ${COLORS.border}`,
                    borderRadius: RADII.lg,
                    padding:      `${SPACING.lg} ${SPACING.xl}`,
                    boxShadow:    SHADOWS.card,
                  }}>
                    <div style={{
                      display:        'flex',
                      justifyContent: 'space-between',
                      alignItems:     'center',
                      marginBottom:   SPACING.md,
                    }}>
                      <div style={{
                        fontWeight: '500',
                        fontSize:   '0.875rem',
                        color:      COLORS.textPrimary,
                        flex:       1,
                      }}>
                        {task.title}
                      </div>
                      <Link
                        href={`/review/${task.id}`}
                        style={{
                          padding:        '0.4rem 0.875rem',
                          background:     GRADIENTS.indigo,
                          color:          'white',
                          borderRadius:   RADII.md,
                          fontSize:       '0.78rem',
                          fontWeight:     '500',
                          textDecoration: 'none',
                          whiteSpace:     'nowrap',
                          marginLeft:     SPACING.md,
                        }}
                      >
                        Review →
                      </Link>
                    </div>
                    <div style={{
                      fontSize:    '0.78rem',
                      color:       COLORS.textMuted,
                      marginBottom: SPACING.md,
                    }}>
                      {task.category}
                      {' · '}
                      {task.piReward}π per slot
                      {' · '}
                      {task.slotsRemaining}/{task.slotsAvailable} slots left
                    </div>
                    {/* Slot fill progress */}
                    <div style={{
                      background:   COLORS.bgElevated,
                      borderRadius: RADII.full,
                      height:       '3px',
                      overflow:     'hidden',
                    }}>
                      <div style={{
                        height:       '100%',
                        width:        `${fillPct}%`,
                        background:   GRADIENTS.indigo,
                        borderRadius: RADII.full,
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

      </main>
    </div>
  )
}
