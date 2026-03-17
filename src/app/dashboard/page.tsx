'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Link            from 'next/link'
import { usePiAuth }   from '@/hooks/use-pi-auth'
import { Navigation }  from '@/components/Navigation'
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

  useEffect(() => {
    if (user?.piUid) {
      fetchSubmissions()
      fetchPostedTasks()
    }
  }, [user?.piUid, fetchSubmissions, fetchPostedTasks])

  // ── Stats ──────────────────────────────────────────────────────────

  const totalEarned = submissions
    .filter(s => s.status === 'APPROVED')
    .reduce((sum, s) => sum + (s.agreedReward * 0.95), 0)

  const pendingReview = submissions.filter(
    s => s.status === 'SUBMITTED'
  ).length

  const openDisputes = submissions.filter(
    s => s.status === 'DISPUTED'
  ).length

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

      <main style={{
        maxWidth: '680px',
        margin:   '0 auto',
        padding:  '80px 1rem 4rem',
      }}>

        {/* User header */}
        <div style={{
          ...COMPONENT_STYLES.card,
          display:      'flex',
          alignItems:   'center',
          gap:          SPACING.lg,
          marginBottom: SPACING.xl,
        }}>
          <div style={{
            width:          '48px',
            height:         '48px',
            borderRadius:   RADII.xl,
            background:     `linear-gradient(135deg, ${COLORS.indigo}, ${COLORS.indigoLight})`,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            fontSize:       '1.25rem',
            fontWeight:     '700',
            flexShrink:     0,
            boxShadow:      SHADOWS.indigoGlow,
          }}>
            {user?.piUsername.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontWeight:   '600',
              fontSize:     '1rem',
              marginBottom: '3px',
              color:        COLORS.textPrimary,
            }}>
              {user?.piUsername}
            </div>
            <div style={{
              fontSize: '0.8rem',
              color:    COLORS.textSecondary,
            }}>
              {user?.reputationLevel}
              {' · '}Rep {user?.reputationScore}
              {' · '}KYC {user?.kycLevel}
            </div>
          </div>
          {user?.reputationLevel === 'Sovereign' && (
            <Link href="/arbitrate" style={{
              padding:        '0.4rem 0.875rem',
              background:     COLORS.indigoDim,
              border:         `1px solid rgba(99, 102, 241, 0.3)`,
              borderRadius:   RADII.md,
              fontSize:       '0.8rem',
              color:          COLORS.indigoLight,
              textDecoration: 'none',
              whiteSpace:     'nowrap',
            }}>
              ⚖ Arbitrate
            </Link>
          )}
        </div>

        {/* Stats row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap:     SPACING.sm,
          marginBottom: SPACING.xl,
        }}>
          {[
            {
              label: 'Total Earned',
              value: `${totalEarned.toFixed(3)}π`,
              color: COLORS.emerald,
            },
            {
              label: 'Pending Review',
              value: pendingReview.toString(),
              color: COLORS.indigo,
            },
            {
              label: 'Open Disputes',
              value: openDisputes.toString(),
              color: openDisputes > 0 ? COLORS.red : COLORS.textMuted,
            },
          ].map(stat => (
            <div key={stat.label} style={{
              background:   `${GRADIENTS.card}, ${COLORS.bgSurface}`,
              border:       `1px solid ${COLORS.border}`,
              borderRadius: RADII.lg,
              padding:      `${SPACING.lg} ${SPACING.xl}`,
              textAlign:    'center',
              boxShadow:    SHADOWS.card,
            }}>
              <div style={{
                fontSize:     '1.5rem',
                fontWeight:   '700',
                color:        stat.color,
                fontFamily:   FONTS.mono,
                marginBottom: '4px',
                letterSpacing: '-0.02em',
              }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '0.75rem', color: COLORS.textMuted, fontWeight: '500' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap:     SPACING.sm,
          marginBottom: SPACING.xl,
        }}>
          <Link href="/feed" style={{
            background:     `${GRADIENTS.card}, ${COLORS.bgSurface}`,
            border:         `1px solid ${COLORS.border}`,
            borderRadius:   RADII.lg,
            padding:        SPACING.lg,
            textDecoration: 'none',
            textAlign:      'center',
            boxShadow:      SHADOWS.card,
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: SPACING.sm }}>
              🔍
            </div>
            <div style={{
              color:      COLORS.textPrimary,
              fontWeight: '600',
              fontSize:   '0.9rem',
              marginBottom: SPACING.sm,
            }}>
              Find Work
            </div>
            <div style={{ color: COLORS.textSecondary, fontSize: '0.78rem' }}>
              Browse available tasks
            </div>
          </Link>

          <Link href="/employer" style={{
            background:     `${GRADIENTS.card}, ${COLORS.bgSurface}`,
            border:         `1px solid ${COLORS.border}`,
            borderRadius:   RADII.lg,
            padding:        SPACING.lg,
            textDecoration: 'none',
            textAlign:      'center',
            boxShadow:      SHADOWS.card,
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: SPACING.sm }}>
              📋
            </div>
            <div style={{
              color:      COLORS.textPrimary,
              fontWeight: '600',
              fontSize:   '0.9rem',
              marginBottom: SPACING.sm,
            }}>
              Post Task
            </div>
            <div style={{ color: COLORS.textSecondary, fontSize: '0.78rem' }}>
              Hire from 60M Pioneers
            </div>
          </Link>
        </div>

        {/* My Submissions */}
        <section style={{ marginBottom: SPACING.xl }}>
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
              My Submissions
            </h2>
            <Link href="/feed" style={{
              fontSize:       '0.8rem',
              color:          COLORS.indigo,
              textDecoration: 'none',
            }}>
              Find more →
            </Link>
          </div>

          {subLoading && (
            <div style={{
              background:   COLORS.bgSurface,
              borderRadius: RADII.lg,
              height:       '80px',
              border:       `1px solid ${COLORS.border}`,
              boxShadow:    SHADOWS.card,
            }} />
          )}

          {!subLoading && submissions.length === 0 && (
            <div style={{
              padding:      SPACING.xl,
              background:   `${GRADIENTS.card}, ${COLORS.bgSurface}`,
              borderRadius: RADII.lg,
              border:       `1px solid ${COLORS.border}`,
              textAlign:    'center',
              fontSize:     '0.875rem',
              color:        COLORS.textSecondary,
              boxShadow:    SHADOWS.card,
            }}>
              No submissions yet.{' '}
              <Link href="/feed" style={{ color: COLORS.indigo }}>
                Browse tasks →
              </Link>
            </div>
          )}

          <div style={{
            display:       'flex',
            flexDirection: 'column',
            gap:           SPACING.sm,
          }}>
            {submissions.slice(0, 5).map(sub => (
              <Link
                key={sub.id}
                href={`/task/${sub.task?.id}`}
                style={{
                  background:   `${GRADIENTS.card}, ${COLORS.bgSurface}`,
                  border:       `1px solid ${COLORS.border}`,
                  borderLeft:   `3px solid ${statusStyle(sub.status).color}`,
                  borderRadius: RADII.lg,
                  padding:      `${SPACING.md} ${SPACING.lg}`,
                  textDecoration: 'none',
                  display:      'block',
                  boxShadow:    SHADOWS.card,
                }}
              >
                <div style={{
                  display:        'flex',
                  justifyContent: 'space-between',
                  alignItems:     'flex-start',
                  marginBottom:   '4px',
                }}>
                  <div style={{
                    fontWeight:  '500',
                    fontSize:    '0.875rem',
                    color:       COLORS.textPrimary,
                    flex:        1,
                    marginRight: SPACING.md,
                  }}>
                    {sub.task?.title}
                  </div>
                  <span style={{
                    padding:      '2px 8px',
                    borderRadius: RADII.full,
                    fontSize:     '0.7rem',
                    fontWeight:   '600',
                    background:   statusStyle(sub.status).background,
                    color:        statusStyle(sub.status).color,
                    whiteSpace:   'nowrap',
                    flexShrink:   0,
                  }}>
                    {sub.status}
                  </span>
                </div>
                <div style={{
                  fontSize:  '0.78rem',
                  color:     COLORS.textMuted,
                  display:   'flex',
                  gap:       SPACING.md,
                }}>
                  <span>{sub.task?.category}</span>
                  <span style={{ color: COLORS.emerald, fontFamily: FONTS.mono, fontWeight: '500' }}>
                    {sub.agreedReward}π
                  </span>
                  {sub.status === 'REJECTED' && (
                    <span style={{ color: COLORS.indigo }}>Tap to dispute →</span>
                  )}
                  {sub.status === 'APPROVED' && (
                    <span style={{ color: COLORS.emerald }}>✓ Earned</span>
                  )}
                </div>
                {sub.status === 'REJECTED' && sub.rejectionReason && (
                  <div style={{
                    marginTop:    '0.4rem',
                    fontSize:     '0.75rem',
                    color:        COLORS.textSecondary,
                    fontStyle:    'italic',
                    overflow:     'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace:   'nowrap',
                  }}>
                    "{sub.rejectionReason}"
                  </div>
                )}
              </Link>
            ))}
          </div>
        </section>

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
