'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Link            from 'next/link'
import { usePiAuth }   from '@/hooks/use-pi-auth'
import { Navigation }  from '@/components/Navigation'

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

// ── Status helpers ─────────────────────────────────────────────────────

function statusColor(status: string): string {
  switch (status) {
    case 'APPROVED':   return '#16a34a'
    case 'REJECTED':   return '#dc2626'
    case 'DISPUTED':   return '#d97706'
    case 'SUBMITTED':  return '#7B3FE4'
    default:           return '#6b7280'
  }
}

function statusBg(status: string): string {
  switch (status) {
    case 'APPROVED':   return '#14532d'
    case 'REJECTED':   return '#450a0a'
    case 'DISPUTED':   return '#451a03'
    case 'SUBMITTED':  return '#1e1b4b'
    default:           return '#1f2937'
  }
}

// ── Component ─────────────────────────────────────────────────────────

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
        background:     '#0f0f0f',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        flexDirection:  'column',
        gap:            '1rem',
        fontFamily:     'system-ui, sans-serif',
      }}>
        <p style={{ color: '#9ca3af', margin: 0 }}>
          Connecting to Pi Network...
        </p>
        {isSdkReady && (
          <button
            onClick={authenticate}
            style={{
              padding:      '0.75rem 2rem',
              background:   'linear-gradient(135deg, #7B3FE4, #A855F7)',
              color:        'white',
              border:       'none',
              borderRadius: '10px',
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
      background: '#0f0f0f',
      fontFamily: 'system-ui, sans-serif',
      color:      '#ffffff',
    }}>
      <Navigation currentPage="dashboard" />

      <main style={{
        maxWidth: '680px',
        margin:   '0 auto',
        padding:  '80px 1rem 4rem',
      }}>

        {/* User header */}
        <div style={{
          display:        'flex',
          alignItems:     'center',
          gap:            '1rem',
          marginBottom:   '2rem',
          padding:        '1.25rem',
          background:     '#111827',
          borderRadius:   '16px',
          border:         '1px solid #1f2937',
        }}>
          <div style={{
            width:          '48px',
            height:         '48px',
            borderRadius:   '50%',
            background:     'linear-gradient(135deg, #7B3FE4, #A855F7)',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            fontSize:       '1.2rem',
            fontWeight:     '700',
            flexShrink:     0,
          }}>
            {user?.piUsername.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontWeight: '600',
              fontSize:   '1rem',
              marginBottom: '0.2rem',
            }}>
              {user?.piUsername}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
              {user?.reputationLevel}
              {' · '}Rep {user?.reputationScore}
              {' · '}KYC {user?.kycLevel}
            </div>
          </div>
          {user?.reputationLevel === 'Sovereign' && (
            <Link href="/arbitrate" style={{
              padding:        '0.4rem 0.875rem',
              background:     '#1f2937',
              borderRadius:   '8px',
              fontSize:       '0.8rem',
              color:          '#a78bfa',
              textDecoration: 'none',
              whiteSpace:     'nowrap',
            }}>
              ⚖️ Arbitrate
            </Link>
          )}
        </div>

        {/* Stats row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap:     '0.75rem',
          marginBottom: '2rem',
        }}>
          {[
            {
              label: 'Total Earned',
              value: `${totalEarned.toFixed(3)}π`,
              color: '#86efac',
            },
            {
              label: 'Pending Review',
              value: pendingReview.toString(),
              color: '#a78bfa',
            },
            {
              label: 'Open Disputes',
              value: openDisputes.toString(),
              color: openDisputes > 0 ? '#fbbf24' : '#6b7280',
            },
          ].map(stat => (
            <div key={stat.label} style={{
              background:   '#111827',
              border:       '1px solid #1f2937',
              borderRadius: '12px',
              padding:      '1rem',
              textAlign:    'center',
            }}>
              <div style={{
                fontSize:   '1.3rem',
                fontWeight: '700',
                color:      stat.color,
                marginBottom: '0.25rem',
              }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap:     '0.75rem',
          marginBottom: '2rem',
        }}>
          <Link href="/feed" style={{
            background:     '#111827',
            border:         '1px solid #1f2937',
            borderRadius:   '12px',
            padding:        '1rem',
            textDecoration: 'none',
            textAlign:      'center',
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>
              🔍
            </div>
            <div style={{
              color:      '#ffffff',
              fontWeight: '600',
              fontSize:   '0.9rem',
              marginBottom: '0.2rem',
            }}>
              Find Work
            </div>
            <div style={{ color: '#6b7280', fontSize: '0.78rem' }}>
              Browse available tasks
            </div>
          </Link>

          <Link href="/employer" style={{
            background:     '#111827',
            border:         '1px solid #1f2937',
            borderRadius:   '12px',
            padding:        '1rem',
            textDecoration: 'none',
            textAlign:      'center',
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>
              📋
            </div>
            <div style={{
              color:      '#ffffff',
              fontWeight: '600',
              fontSize:   '0.9rem',
              marginBottom: '0.2rem',
            }}>
              Post Task
            </div>
            <div style={{ color: '#6b7280', fontSize: '0.78rem' }}>
              Hire from 60M Pioneers
            </div>
          </Link>
        </div>

        {/* My Submissions */}
        <section style={{ marginBottom: '2rem' }}>
          <div style={{
            display:        'flex',
            justifyContent: 'space-between',
            alignItems:     'center',
            marginBottom:   '1rem',
          }}>
            <h2 style={{
              margin:        '0',
              fontSize:      '0.9rem',
              fontWeight:    '600',
              color:         '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              My Submissions
            </h2>
            <Link href="/feed" style={{
              fontSize:       '0.8rem',
              color:          '#7B3FE4',
              textDecoration: 'none',
            }}>
              Find more →
            </Link>
          </div>

          {subLoading && (
            <div style={{
              background:   '#111827',
              borderRadius: '12px',
              height:       '80px',
              border:       '1px solid #1f2937',
            }} />
          )}

          {!subLoading && submissions.length === 0 && (
            <div style={{
              padding:      '1.5rem',
              background:   '#111827',
              borderRadius: '12px',
              border:       '1px solid #1f2937',
              textAlign:    'center',
              fontSize:     '0.875rem',
              color:        '#6b7280',
            }}>
              No submissions yet.{' '}
              <Link href="/feed" style={{ color: '#7B3FE4' }}>
                Browse tasks →
              </Link>
            </div>
          )}

          <div style={{
            display:       'flex',
            flexDirection: 'column',
            gap:           '0.75rem',
          }}>
            {submissions.slice(0, 5).map(sub => (
              <Link
                key={sub.id}
                href={`/task/${sub.task?.id}`}
                style={{
                  background:     '#111827',
                  border:         `1px solid ${
                    sub.status === 'REJECTED' ? '#dc2626'
                    : sub.status === 'DISPUTED' ? '#d97706'
                    : '#1f2937'
                  }`,
                  borderRadius:   '12px',
                  padding:        '1rem 1.25rem',
                  textDecoration: 'none',
                  display:        'block',
                }}
              >
                <div style={{
                  display:        'flex',
                  justifyContent: 'space-between',
                  alignItems:     'flex-start',
                  marginBottom:   '0.3rem',
                }}>
                  <div style={{
                    fontWeight:  '600',
                    fontSize:    '0.875rem',
                    color:       '#ffffff',
                    flex:        1,
                    marginRight: '0.75rem',
                  }}>
                    {sub.task?.title}
                  </div>
                  <div style={{
                    padding:      '0.2rem 0.6rem',
                    borderRadius: '9999px',
                    fontSize:     '0.7rem',
                    fontWeight:   '600',
                    background:   statusBg(sub.status),
                    color:        statusColor(sub.status),
                    whiteSpace:   'nowrap',
                    flexShrink:   0,
                  }}>
                    {sub.status}
                  </div>
                </div>
                <div style={{
                  fontSize: '0.78rem',
                  color:    '#6b7280',
                  display:  'flex',
                  gap:      '0.75rem',
                }}>
                  <span>{sub.task?.category}</span>
                  <span style={{ color: '#a78bfa' }}>
                    {sub.agreedReward}π
                  </span>
                  {sub.status === 'REJECTED' && (
                    <span style={{ color: '#f87171' }}>
                      Tap to dispute →
                    </span>
                  )}
                  {sub.status === 'APPROVED' && (
                    <span style={{ color: '#86efac' }}>✓ Earned</span>
                  )}
                </div>
                {sub.status === 'REJECTED' && sub.rejectionReason && (
                  <div style={{
                    marginTop:    '0.4rem',
                    fontSize:     '0.75rem',
                    color:        '#9ca3af',
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
              marginBottom:   '1rem',
            }}>
              <h2 style={{
                margin:        '0',
                fontSize:      '0.9rem',
                fontWeight:    '600',
                color:         '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                My Posted Tasks
              </h2>
              <Link href="/employer" style={{
                fontSize:       '0.8rem',
                color:          '#7B3FE4',
                textDecoration: 'none',
              }}>
                Post new →
              </Link>
            </div>

            {tasksLoading && (
              <div style={{
                background:   '#111827',
                borderRadius: '12px',
                height:       '80px',
                border:       '1px solid #1f2937',
              }} />
            )}

            <div style={{
              display:       'flex',
              flexDirection: 'column',
              gap:           '0.75rem',
            }}>
              {postedTasks.map(task => {
                const fillPct = Math.round(
                  ((task.slotsAvailable - task.slotsRemaining)
                    / task.slotsAvailable) * 100
                )
                return (
                  <div key={task.id} style={{
                    background:   '#111827',
                    border:       '1px solid #1f2937',
                    borderRadius: '12px',
                    padding:      '1rem 1.25rem',
                  }}>
                    <div style={{
                      display:        'flex',
                      justifyContent: 'space-between',
                      alignItems:     'center',
                      marginBottom:   '0.5rem',
                    }}>
                      <div style={{
                        fontWeight: '600',
                        fontSize:   '0.875rem',
                        color:      '#ffffff',
                        flex:       1,
                      }}>
                        {task.title}
                      </div>
                      <Link
                        href={`/review/${task.id}`}
                        style={{
                          padding:        '0.4rem 0.875rem',
                          background:     'linear-gradient(135deg, #7B3FE4, #A855F7)',
                          color:          'white',
                          borderRadius:   '8px',
                          fontSize:       '0.78rem',
                          fontWeight:     '500',
                          textDecoration: 'none',
                          whiteSpace:     'nowrap',
                          marginLeft:     '0.75rem',
                        }}
                      >
                        Review →
                      </Link>
                    </div>
                    <div style={{
                      fontSize:    '0.78rem',
                      color:       '#6b7280',
                      marginBottom: '0.5rem',
                    }}>
                      {task.category}
                      {' · '}
                      {task.piReward}π per slot
                      {' · '}
                      {task.slotsRemaining}/{task.slotsAvailable} slots left
                    </div>
                    {/* Slot fill progress */}
                    <div style={{
                      background:   '#1f2937',
                      borderRadius: '9999px',
                      height:       '3px',
                      overflow:     'hidden',
                    }}>
                      <div style={{
                        height:       '100%',
                        width:        `${fillPct}%`,
                        background:   'linear-gradient(90deg, #7B3FE4, #A855F7)',
                        borderRadius: '9999px',
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
