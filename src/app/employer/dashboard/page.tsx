'use client'

import { useEffect, useState, useRef } from 'react'
import Link                             from 'next/link'
import { usePiAuth }                    from '@/hooks/use-pi-auth'
import { Navigation }                   from '@/components/Navigation'
import { BentoGrid }                    from '@/components/BentoGrid'
import { COLORS, FONTS, SPACING, RADII, SHADOWS, GRADIENTS, statusStyle } from '@/lib/design/tokens'

// ── Types ──────────────────────────────────────────────────

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

interface PendingSubmission {
  id:         string
  taskId:     string
  taskTitle:  string
  workerId:   string
  workerName: string
  status:     string
  submittedAt: string
}

interface EmployerSummary {
  totalTasksPosted: number
  totalSlotsPosted: number
  totalSlotsFilled: number
  fillRate:         string
  totalEscrowed:    number
}

// ── Animated fill bar component ────────────────────────────

function FillBar({
  filled,
  total,
  delay = 0,
  color = COLORS.indigo,
}: {
  filled:  number
  total:   number
  delay?:  number
  color?:  string
}) {
  const [width, setWidth] = useState(0)
  const pct = total > 0 ? Math.round((filled / total) * 100) : 0

  useEffect(() => {
    const timer = setTimeout(() => setWidth(pct), delay)
    return () => clearTimeout(timer)
  }, [pct, delay])

  return (
    <div style={{
      display:    'flex',
      alignItems: 'center',
      gap:        '0.625rem',
    }}>
      <div style={{
        flex:         1,
        height:       '5px',
        background:   COLORS.bgElevated,
        borderRadius: '9999px',
        overflow:     'hidden',
      }}>
        <div style={{
          height:       '100%',
          width:        `${width}%`,
          background:   pct === 100
            ? `linear-gradient(90deg, ${COLORS.emerald}, ${COLORS.emeraldDark})`
            : `linear-gradient(90deg, ${color}, ${color}aa)`,
          borderRadius: '9999px',
          transition:   'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        }} />
      </div>
      <span style={{
        fontFamily:  FONTS.mono,
        fontSize:    '0.7rem',
        color:       pct === 100 ? COLORS.emerald : COLORS.textMuted,
        fontWeight:  '600',
        minWidth:    '28px',
        textAlign:   'right' as const,
      }}>
        {pct}%
      </span>
    </div>
  )
}

// ── Stat card component ────────────────────────────────────

function EmployerStatCard({
  label,
  value,
  sub,
  color = COLORS.textPrimary,
  icon,
}: {
  label:  string
  value:  string | number
  sub?:   string
  color?: string
  icon?:  string
}) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div style={{
        display:    'flex',
        alignItems: 'center',
        gap:        '6px',
        marginBottom: '0.5rem',
      }}>
        {icon && <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>{icon}</span>}
        <div style={{
          fontSize:      '0.65rem',
          fontWeight:    '600',
          color:         COLORS.textMuted,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.1em',
        }}>
          {label}
        </div>
      </div>
      <div>
        <div style={{
          fontFamily:    FONTS.mono,
          fontSize:      'clamp(1.4rem, 3vw, 1.75rem)',
          fontWeight:    '700',
          color,
          letterSpacing: '-0.02em',
          lineHeight:    1,
          marginBottom:  sub ? '4px' : 0,
        }}>
          {value}
        </div>
        {sub && (
          <div style={{
            fontSize: '0.72rem',
            color:    COLORS.textMuted,
          }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────

export default function EmployerDashboardPage() {
  const { user, authenticate, isSdkReady } = usePiAuth()
  const hasAutoAuthenticated = useRef(false)

  const [summary,     setSummary]     = useState<EmployerSummary | null>(null)
  const [tasks,       setTasks]       = useState<PostedTask[]>([])
  const [pending,     setPending]     = useState<PendingSubmission[]>([])
  const [isLoading,   setIsLoading]   = useState(true)

  useEffect(() => {
    if (isSdkReady && !user && !hasAutoAuthenticated.current) {
      hasAutoAuthenticated.current = true
      authenticate()
    }
  }, [isSdkReady, user, authenticate])

  useEffect(() => {
    if (!user?.piUid) return

    const origin  = window.location.origin
    const headers = { 'x-pi-uid': user.piUid }

    Promise.allSettled([
      // Employer analytics
      fetch(`${origin}/api/analytics/employer`, { headers })
        .then(r => r.json())
        .then(d => {
          if (d.summary) setSummary(d.summary)
          if (d.tasks)   setTasks(d.tasks)
        }),

      // Pending submissions across all employer tasks
      fetch(`${origin}/api/employer/tasks`, { headers })
        .then(r => r.json())
        .then(async d => {
          if (!d.tasks) return
          // Fetch submissions for each task
          const submissionFetches = d.tasks
            .filter((t: PostedTask) => t.taskStatus === 'escrowed')
            .slice(0, 5)
            .map((t: PostedTask) =>
              fetch(`${origin}/api/tasks/${t.id}/submissions`, { headers })
                .then(r => r.json())
                .then(s => (s.submissions ?? []).map((sub: any) => ({
                  id:          sub.id,
                  taskId:      t.id,
                  taskTitle:   t.title,
                  workerId:    sub.workerId,
                  workerName:  sub.worker?.piUsername ?? 'Unknown',
                  status:      sub.status,
                  submittedAt: sub.submittedAt,
                })))
            )
          const results = await Promise.allSettled(submissionFetches)
          const allSubs = results
            .filter(r => r.status === 'fulfilled')
            .flatMap((r: any) => r.value)
            .filter((s: PendingSubmission) => s.status === 'SUBMITTED')
          setPending(allSubs.slice(0, 6))
        }),
    ]).finally(() => setIsLoading(false))
  }, [user?.piUid])

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

  const activeTasks    = tasks.filter(t => t.taskStatus === 'escrowed')
  const completedTasks = tasks.filter(t => t.taskStatus === 'completed')
  const totalEscrowed  = summary?.totalEscrowed ?? 0
  const fillRate       = summary?.fillRate ?? '0.0'

  return (
    <div style={{
      minHeight:  '100vh',
      background: COLORS.bgBase,
      fontFamily: FONTS.sans,
      color:      COLORS.textPrimary,
    }}>
      <Navigation currentPage="employer-dashboard" />

      <main className="page-main">

        {/* ── Header ──────────────────────────────────── */}
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
              Employer Dashboard
            </div>
            <h1 style={{
              margin:        0,
              fontSize:      'clamp(1.25rem, 4vw, 1.75rem)',
              fontWeight:    '700',
              letterSpacing: '-0.02em',
            }}>
              Your Opportunities
            </h1>
          </div>
          <Link
            href="/employer"
            style={{
              padding:        `${SPACING.sm} ${SPACING.lg}`,
              background:     GRADIENTS.indigo,
              color:          'white',
              borderRadius:   RADII.md,
              fontSize:       '0.85rem',
              fontWeight:     '600',
              textDecoration: 'none',
              boxShadow:      SHADOWS.indigoGlow,
              whiteSpace:     'nowrap' as const,
              flexShrink:     0,
            }}
          >
            + Post Task
          </Link>
        </div>

        {/* ── Bento Grid ──────────────────────────────── */}
        {isLoading ? (
          <div style={{
            display:       'flex',
            flexDirection: 'column',
            gap:           '0.875rem',
          }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="nexus-card" style={{ height: '100px' }} />
            ))}
          </div>
        ) : (
          <BentoGrid
            columns={3}
            gap="0.875rem"
            items={[

              // ── Row 1: 4 stat cards ──────────────────
              {
                id:       'stat-tasks',
                children: (
                  <EmployerStatCard
                    label="Tasks Posted"
                    value={tasks.length}
                    sub={`${activeTasks.length} active`}
                    color={COLORS.indigo}
                    icon="📋"
                  />
                ),
              },
              {
                id:       'stat-fillrate',
                children: (
                  <EmployerStatCard
                    label="Pioneers Working"
                    value={`${fillRate}%`}
                    sub={`${summary?.totalSlotsFilled ?? 0} / ${summary?.totalSlotsPosted ?? 0} slots`}
                    color={parseFloat(fillRate) > 50 ? COLORS.emerald : COLORS.amber}
                    icon="📊"
                  />
                ),
              },
              {
                id:       'stat-escrow',
                children: (
                  <EmployerStatCard
                    label="Total Escrowed"
                    value={`${totalEscrowed.toFixed(3)}π`}
                    sub="locked in escrow"
                    color={COLORS.amber}
                    icon="🔒"
                  />
                ),
              },
              {
                id:       'stat-pending',
                children: (
                  <EmployerStatCard
                    label="Pending Reviews"
                    value={pending.length}
                    sub="awaiting review"
                    color={COLORS.amber}
                    icon="⏳"
                  />
                ),
              },

              // ── Row 2: Task performance (wide) + Quick post ──
              {
                id:      'task-performance',
                colSpan: 2,
                children: (
                  <div style={{ height: '100%' }}>
                    <div style={{
                      display:        'flex',
                      justifyContent: 'space-between',
                      alignItems:     'center',
                      marginBottom:   SPACING.lg,
                    }}>
                      <div style={{
                        fontSize:      '0.65rem',
                        fontWeight:    '600',
                        color:         COLORS.textMuted,
                        textTransform: 'uppercase' as const,
                        letterSpacing: '0.1em',
                      }}>
                        Task Performance
                      </div>
                      {activeTasks.length > 0 && (
                        <div style={{
                          width:        '6px',
                          height:       '6px',
                          borderRadius: '50%',
                          background:   COLORS.emerald,
                          boxShadow:    `0 0 6px ${COLORS.emerald}`,
                        }} />
                      )}
                    </div>

                    {tasks.length === 0 ? (
                      <div style={{
                        display:        'flex',
                        flexDirection:  'column',
                        alignItems:     'center',
                        justifyContent: 'center',
                        height:         '120px',
                        color:          COLORS.textMuted,
                        fontSize:       '0.85rem',
                        gap:            '0.5rem',
                      }}>
                        <span style={{ fontSize: '1.5rem', opacity: 0.4 }}>📭</span>
                        No tasks posted yet
                      </div>
                    ) : (
                      <div style={{
                        display:       'flex',
                        flexDirection: 'column',
                        gap:           '0.875rem',
                      }}>
                        {tasks.slice(0, 4).map((task, idx) => {
                          const filled = task.slotsAvailable - task.slotsRemaining
                          return (
                            <div key={task.id}>
                              <div style={{
                                display:        'flex',
                                justifyContent: 'space-between',
                                alignItems:     'center',
                                marginBottom:   '6px',
                              }}>
                                <div style={{
                                  fontSize:     '0.82rem',
                                  fontWeight:   '500',
                                  color:        COLORS.textPrimary,
                                  flex:         1,
                                  overflow:     'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace:   'nowrap' as const,
                                  marginRight:  '0.75rem',
                                }}>
                                  {task.title}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                                  <span style={{
                                    fontFamily: FONTS.mono,
                                    fontSize:   '0.72rem',
                                    color:      COLORS.textMuted,
                                  }}>
                                    {filled}/{task.slotsAvailable}
                                  </span>
                                  <Link
                                    href={`/review/${task.id}`}
                                    style={{
                                      padding:        '2px 8px',
                                      background:     COLORS.indigoDim,
                                      color:          COLORS.indigoLight,
                                      borderRadius:   '6px',
                                      fontSize:       '0.68rem',
                                      fontWeight:     '600',
                                      textDecoration: 'none',
                                      border:         `1px solid rgba(99,102,241,0.2)`,
                                    }}
                                  >
                                    Review
                                  </Link>
                                </div>
                              </div>
                              <FillBar
                                filled={filled}
                                total={task.slotsAvailable}
                                delay={idx * 150}
                              />
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ),
              },
              {
                id:      'quick-post',
                children: (
                  <div style={{
                    height:         '100%',
                    display:        'flex',
                    flexDirection:  'column',
                    justifyContent: 'space-between',
                  }}>
                    <div>
                      <div style={{
                        fontSize:      '0.65rem',
                        fontWeight:    '600',
                        color:         COLORS.textMuted,
                        textTransform: 'uppercase' as const,
                        letterSpacing: '0.1em',
                        marginBottom:  SPACING.md,
                      }}>
                        Quick Actions
                      </div>
                      <div style={{
                        fontSize:   '0.85rem',
                        color:      COLORS.textSecondary,
                        lineHeight: '1.5',
                        marginBottom: SPACING.lg,
                      }}>
                        Post a new task and fund it with Pi escrow instantly.
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <Link
                        href="/employer"
                        style={{
                          display:        'flex',
                          alignItems:     'center',
                          justifyContent: 'center',
                          gap:            '6px',
                          padding:        `${SPACING.md} ${SPACING.lg}`,
                          background:     GRADIENTS.indigo,
                          color:          'white',
                          borderRadius:   RADII.md,
                          fontSize:       '0.85rem',
                          fontWeight:     '600',
                          textDecoration: 'none',
                          boxShadow:      SHADOWS.indigoGlow,
                          transition:     'all 0.15s ease',
                        }}
                      >
                        📋 Post New Task
                      </Link>
                      <Link
                        href="/analytics"
                        style={{
                          display:        'flex',
                          alignItems:     'center',
                          justifyContent: 'center',
                          gap:            '6px',
                          padding:        `${SPACING.md} ${SPACING.lg}`,
                          background:     'transparent',
                          color:          COLORS.textSecondary,
                          borderRadius:   RADII.md,
                          fontSize:       '0.85rem',
                          fontWeight:     '500',
                          textDecoration: 'none',
                          border:         `1px solid ${COLORS.borderAccent}`,
                          transition:     'all 0.15s ease',
                        }}
                      >
                        📊 View Analytics
                      </Link>
                    </div>
                  </div>
                ),
              },

              // ── Row 3: Submission queue (full width) ──
              {
                id:      'submission-queue',
                colSpan: 3,
                children: (
                  <div>
                    <div style={{
                      display:        'flex',
                      justifyContent: 'space-between',
                      alignItems:     'center',
                      marginBottom:   SPACING.lg,
                    }}>
                      <div style={{
                        fontSize:      '0.65rem',
                        fontWeight:    '600',
                        color:         COLORS.textMuted,
                        textTransform: 'uppercase' as const,
                        letterSpacing: '0.1em',
                      }}>
                        Pending Reviews
                      </div>
                      {pending.length > 0 && (
                        <span style={{
                          padding:      '2px 8px',
                          background:   COLORS.amberDim,
                          color:        COLORS.amber,
                          borderRadius: RADII.full,
                          fontSize:     '0.7rem',
                          fontWeight:   '700',
                          border:       `1px solid rgba(245,158,11,0.3)`,
                          fontFamily:   FONTS.mono,
                        }}>
                          {pending.length} awaiting
                        </span>
                      )}
                    </div>

                    {pending.length === 0 ? (
                      <div style={{
                        display:        'flex',
                        alignItems:     'center',
                        justifyContent: 'center',
                        padding:        `${SPACING.xl} 0`,
                        color:          COLORS.textMuted,
                        fontSize:       '0.85rem',
                        gap:            '0.5rem',
                      }}>
                        <span style={{ opacity: 0.5 }}>✓</span>
                        All submissions reviewed
                      </div>
                    ) : (
                      <div style={{
                        display:             'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap:                 '0.625rem',
                      }}>
                        {pending.map((sub, idx) => (
                          <Link
                            key={sub.id}
                            href={`/review/${sub.taskId}`}
                            style={{
                              display:        'flex',
                              alignItems:     'center',
                              gap:            '0.75rem',
                              padding:        `${SPACING.md} ${SPACING.lg}`,
                              background:     COLORS.bgElevated,
                              border:         `1px solid ${COLORS.border}`,
                              borderLeft:     `3px solid ${COLORS.amber}`,
                              borderRadius:   RADII.md,
                              textDecoration: 'none',
                              transition:     'all 0.15s ease',
                              animation:      `fade-up 0.3s ease ${idx * 0.06}s both`,
                            }}
                          >
                            <div style={{
                              width:          '32px',
                              height:         '32px',
                              borderRadius:   '8px',
                              background:     COLORS.amberDim,
                              border:         `1px solid rgba(245,158,11,0.3)`,
                              display:        'flex',
                              alignItems:     'center',
                              justifyContent: 'center',
                              fontSize:       '0.75rem',
                              fontWeight:     '700',
                              color:          COLORS.amber,
                              flexShrink:     0,
                              fontFamily:     FONTS.mono,
                            }}>
                              {sub.workerName.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{
                                fontSize:     '0.8rem',
                                fontWeight:   '500',
                                color:        COLORS.textPrimary,
                                overflow:     'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace:   'nowrap' as const,
                                marginBottom: '2px',
                              }}>
                                {sub.taskTitle}
                              </div>
                              <div style={{
                                fontSize: '0.7rem',
                                color:    COLORS.textMuted,
                              }}>
                                by {sub.workerName}
                              </div>
                            </div>
                            <span style={{
                              fontSize:   '0.72rem',
                              color:      COLORS.amber,
                              fontWeight: '600',
                              flexShrink: 0,
                            }}>
                              Review →
                            </span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ),
              },

            ]}
          />
        )}

      </main>
    </div>
  )
}
