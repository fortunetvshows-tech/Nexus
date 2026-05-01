'use client'

import { useEffect, useState, useRef } from 'react'
import Link                             from 'next/link'
import { toast, Toaster }               from 'sonner'
import { usePiAuth }                    from '@/hooks/use-pi-auth'
import { PageTopbar }                   from '@/components/PageTopbar'
import { BentoGrid }                    from '@/components/BentoGrid'
import { ConfirmDialog }                from '@/components/ConfirmDialog'
import { COLORS, FONTS, SPACING, RADII, SHADOWS, GRADIENTS, statusStyle } from '@/lib/design/tokens'

// ── Types ──────────────────────────────────────────────────

interface PostedTask {
  id:             string
  title:          string
  description?:   string
  instructions?:  string
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
  totalSpent:       number
}

// ── Animated fill bar component ────────────────────────────

function FillBar({
  filled,
  total,
  delay = 0,
  color = COLORS.pi,
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
        background:   COLORS.bgRaised,
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
  const [editingTask, setEditingTask] = useState<PostedTask | null>(null)
  const [editForm,    setEditForm]    = useState({ title: '', description: '', instructions: '', deadline: '' })
  const [isSaving,    setIsSaving]    = useState(false)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; id: string; type: 'archive' | 'refund'; title: string; message: string }>({
    isOpen: false,
    id: '',
    type: 'archive',
    title: '',
    message: '',
  })
  const [postedTasks, setPostedTasks] = useState<PostedTask[]>([])
  const [activeTab,   setActiveTab]   = useState<'active' | 'archived'>('active')
  const [activePage,  setActivePage]  = useState(0)
  const [archivedPage, setArchivedPage] = useState(0)

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
          if (d.tasks) {
            setTasks(d.tasks)
            setPostedTasks(d.tasks)
          }
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

  const handleArchive = (taskId: string, taskTitle: string) => {
    if (!user?.piUid) return
    setConfirmDialog({
      isOpen: true,
      id: taskId,
      type: 'archive',
      title: `Archive "${taskTitle}"?`,
      message: 'Workers who already claimed slots can still submit and get paid. The task will be hidden from new workers.',
    })
  }

  const confirmArchive = async (taskId: string, taskTitle: string) => {
    if (!user?.piUid) return
    try {
      const res = await fetch(`${window.location.origin}/api/tasks/${taskId}`, {
        method:  'DELETE',
        headers: { 'x-pi-uid': user.piUid },
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`"${taskTitle}" archived successfully`)
        // Refresh analytics data to show archived task
        const origin = window.location.origin
        const headers = { 'x-pi-uid': user.piUid }
        const analyticsRes = await fetch(`${origin}/api/analytics/employer`, { headers })
        const analyticsData = await analyticsRes.json()
        if (analyticsData.tasks) {
          setTasks(analyticsData.tasks)
        }
      } else {
        toast.error(`Archive failed: ${data.error}`)
        setActionMessage(`Error: ${data.error}`)
      }
    } catch (err) {
      toast.error('Archive request failed. Please try again.')
    } finally {
      setConfirmDialog({ isOpen: false, id: '', type: 'archive', title: '', message: '' })
    }
  }

  const handleRefund = (taskId: string) => {
    if (!user?.piUid) return
    setConfirmDialog({
      isOpen: true,
      id: taskId,
      type: 'refund',
      title: 'Request Refund?',
      message: 'Request a refund for unused escrow on this task.',
    })
  }

  const confirmRefund = async (taskId: string) => {
    if (!user?.piUid) return
    try {
      const res = await fetch(
        `${window.location.origin}/api/tasks/${taskId}/refund-escrow`,
        {
          method:  'POST',
          headers: { 'x-pi-uid': user.piUid },
        }
      )
      const data = await res.json()
      if (data.success) {
        toast.success('Refund processed successfully')
        setActionMessage(`✅ ${data.message}`)
        // Refresh task list
        setTimeout(() => window.location.reload(), 1500)
      } else {
        toast.error(`Refund failed: ${data.error}`)
        setActionMessage(`❌ Refund failed: ${data.error}`)
      }
    } catch (err) {
      toast.error('Refund request failed. Please try again.')
      setActionMessage('Refund request failed. Please try again.')
    } finally {
      setConfirmDialog({ isOpen: false, id: '', type: 'refund', title: '', message: '' })
    }
  }

  const handleSaveEdit = async () => {
    if (!editingTask || !user?.piUid) return
    setIsSaving(true)
    try {
      const res = await fetch(`${window.location.origin}/api/tasks/${editingTask.id}`, {
        method:  'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-pi-uid':     user.piUid,
        },
        body: JSON.stringify(editForm),
      })
      const data = await res.json()
      if (data.success) {
        setActionMessage('Task updated successfully')
        setEditingTask(null)
        // Update local list
        setPostedTasks(prev => prev.map(t =>
          t.id === editingTask.id
            ? { ...t, title: editForm.title || t.title }
            : t
        ))
      } else {
        setActionMessage(`Error: ${data.error}`)
      }
    } finally {
      setIsSaving(false)
    }
  }

  const activeTasks    = tasks.filter(t => t.taskStatus === 'escrowed')
  const archivedTasks  = tasks.filter(t => t.taskStatus === 'archived')
  const completedTasks = tasks.filter(t => t.taskStatus === 'completed')
  const totalEscrowed  = summary?.totalEscrowed ?? 0
  const totalSpent     = summary?.totalSpent ?? 0
  const fillRate       = summary?.fillRate ?? '0.0'

  return (
    <div style={{
      minHeight:  '100vh',
      background: COLORS.bgBase,
      fontFamily: FONTS.sans,
      color:      COLORS.textPrimary,
    }}>
      <PageTopbar title="Employer" />

      <main className="page-main">

        {/* ── TopBar ──────────────────────────────────── */}
        <div style={{
          padding: '14px 20px 10px',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(180deg, transparent 70%, rgba(0,201,167,0.05))',
          marginBottom: SPACING.lg,
          borderRadius: RADII.lg,
        }}>
          <div>
            <div style={{ fontSize: 12, color: '#8892A8', marginBottom: 2 }}>
              Employer Dashboard
            </div>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 24, letterSpacing: 2,
              textTransform: 'uppercase',
            }}>
              {user?.piUsername?.toUpperCase()}{' '}
              <span style={{ color: '#33D9BC' }}>🏗️</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 10px',
              background: 'rgba(0,201,167,0.13)',
              border: '1px solid rgba(0,201,167,0.25)',
              borderRadius: 100,
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: '#00C9A7',
                boxShadow: '0 0 6px #00C9A7',
              }} />
              <span style={{
                fontSize: 11, fontWeight: 700, color: '#33D9BC',
              }}>ACTIVE</span>
            </div>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'linear-gradient(135deg, #00C9A7, #0095FF)',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 13, color: '#fff',
              boxShadow: '0 0 18px rgba(0,201,167,0.25)',
            }}>
              {user?.piUsername?.slice(0,2).toUpperCase()}
            </div>
          </div>
        </div>

        {/* ── Main Escrow Summary Card ──────────────────────── */}
        {!isLoading && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(0,201,167,0.08) 0%, #131720 60%)',
            border: '1px solid rgba(0,201,167,0.25)',
            borderRadius: 18, padding: 16, marginBottom: 14,
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'flex-start', marginBottom: 12,
            }}>
              <div>
                <div style={{
                  fontSize: 11, fontWeight: 700,
                  color: '#454F64', textTransform: 'uppercase',
                  letterSpacing: '0.8px', marginBottom: 5,
                }}>Total Pi in Escrow</div>
                <div style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: 40, letterSpacing: 1.5,
                  color: '#33D9BC', lineHeight: 1,
                }}>
                  {totalEscrowed?.toFixed(2) ?? '0.00'}π
                </div>
                <div style={{ fontSize: 12, color: '#8892A8', marginTop: 4 }}>
                  across {activeTasks.length} active tasks
                </div>
              </div>
              <Link
                href="/employer"
                style={{
                  padding: '9px 16px',
                  background: '#00C9A7', border: 'none',
                  borderRadius: 12, color: '#07090E',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13, fontWeight: 700,
                  cursor: 'pointer',
                  textDecoration: 'none',
                  marginTop: 4,
                  display: 'inline-block',
                }}
              >+ New Task</Link>
            </div>

            {/* 3-col mini stats */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
              gap: 10,
            }}>
              {[
                { label: 'Pending', value: pending.length, color: '#FFB020' },
                { label: 'Total Tasks', value: tasks.length, color: '#00D68F' },
                { label: 'Completed', value: completedTasks.length, color: '#00C9A7' },
              ].map(s => (
                <div key={s.label} style={{
                  textAlign: 'center', padding: '10px 6px',
                  background: 'rgba(0,0,0,0.2)', borderRadius: 8,
                }}>
                  <div style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: 22, color: s.color,
                  }}>{s.value}</div>
                  <div style={{
                    fontSize: 10, color: '#454F64',
                    marginTop: 2, textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Review Alert ──────────────────────────────── */}
        {!isLoading && pending.length > 0 && (
          <div style={{
            background: 'rgba(255,176,32,0.13)',
            border: '1px solid rgba(255,176,32,0.25)',
            borderRadius: 12, padding: '13px 16px',
            marginBottom: 14,
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#FFB020' }}>
                ⚠️ {pending.length} submissions need review
              </div>
              <div style={{ fontSize: 12, color: '#8892A8', marginTop: 2 }}>
                Tap to review and release payment
              </div>
            </div>
            <Link
              href="/employer/submissions"
              style={{
                padding: '7px 14px',
                background: 'rgba(255,176,32,0.13)',
                border: '1px solid rgba(255,176,32,0.25)',
                borderRadius: 8, color: '#FFB020',
                fontSize: 12, fontWeight: 700, cursor: 'pointer',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >Review →</Link>
          </div>
        )}

        {/* ── Task List with Tabs ──────────────────────────── */}
        {isLoading ? (
          <div style={{
            borderRadius: 12,
            padding: '2rem',
            textAlign: 'center',
            color: '#8892A8',
          }}>
            Loading tasks...
          </div>
        ) : (
          <>
            {/* Tab row */}
            <div style={{
              display: 'flex',
              gap: '2rem',
              marginBottom: '1.5rem',
              paddingBottom: '1rem',
              borderBottom: '1px solid rgba(0,201,167,0.2)',
            }}>
              <button
                onClick={() => { setActiveTab('active'); setActivePage(0) }}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '0',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: activeTab === 'active' ? 700 : 600,
                  color: activeTab === 'active' ? '#33D9BC' : '#8892A8',
                  borderBottom: activeTab === 'active' ? '2px solid #00C9A7' : 'none',
                  paddingBottom: '8px',
                  fontFamily: FONTS.sans,
                }}
              >
                ⚡ Active Tasks {activeTasks.length > 0 && `(${activeTasks.length})`}
              </button>
              <button
                onClick={() => { setActiveTab('archived'); setArchivedPage(0) }}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '0',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: activeTab === 'archived' ? 700 : 600,
                  color: activeTab === 'archived' ? '#33D9BC' : '#8892A8',
                  borderBottom: activeTab === 'archived' ? '2px solid #00C9A7' : 'none',
                  paddingBottom: '8px',
                  fontFamily: FONTS.sans,
                }}
              >
                📦 Archived {archivedTasks.length > 0 && `(${archivedTasks.length})`}
              </button>
            </div>

            {/* Tasks content */}
            {(() => {
              const TASKS_PER_PAGE = 6
              const displayTasks = activeTab === 'active' ? activeTasks : archivedTasks
              const currentPage = activeTab === 'active' ? activePage : archivedPage
              const startIdx = currentPage * TASKS_PER_PAGE
              const paginatedTasks = displayTasks.slice(startIdx, startIdx + TASKS_PER_PAGE)
              const totalPages = Math.ceil(displayTasks.length / TASKS_PER_PAGE)
              const hasNextPage = currentPage < totalPages - 1
              const hasPrevPage = currentPage > 0

              return displayTasks.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '3rem 2rem',
                  color: '#8892A8',
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>
                    {activeTab === 'active' ? '📭' : '🎁'}
                  </div>
                  No {activeTab} tasks
                </div>
              ) : (
                <>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr',
                    gap: '0.75rem',
                  }}>
                    {paginatedTasks.map((task) => {
                      const filled = task.slotsAvailable - task.slotsRemaining
                      const fillPct = Math.round((filled / task.slotsAvailable) * 100)
                      return (
                        <div
                          key={task.id}
                          style={{
                            background: 'rgba(0,201,167,0.05)',
                            border: '1px solid rgba(0,201,167,0.15)',
                            borderLeft: '3px solid #00C9A7',
                            borderRadius: 10,
                            padding: '14px',
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginBottom: '10px',
                          }}>
                            <div style={{ flex: 1 }}>
                              <div style={{
                                fontSize: '14px',
                                fontWeight: 600,
                                color: '#EEF2FF',
                                marginBottom: '2px',
                              }}>
                                {task.title}
                              </div>
                              <div style={{
                                fontSize: '12px',
                                color: '#8892A8',
                              }}>
                                {task.category} • {task.piReward}π per slot
                              </div>
                            </div>
                            <div style={{
                              fontSize: '13px',
                              fontWeight: 700,
                              color: '#33D9BC',
                              textAlign: 'right',
                            }}>
                              {filled}/{task.slotsAvailable} filled
                              <br />
                              <span style={{ fontSize: '11px', color: '#8892A8' }}>
                                {fillPct}%
                              </span>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div style={{
                            height: '6px',
                            background: '#131720',
                            borderRadius: 3,
                            overflow: 'hidden',
                            marginBottom: '12px',
                          }}>
                            <div style={{
                              height: '100%',
                              width: `${fillPct}%`,
                              background: '#00C9A7',
                              transition: 'width 0.3s ease',
                            }} />
                          </div>

                          {/* Actions */}
                          <div style={{
                            display: 'flex',
                            gap: '8px',
                          }}>
                            {activeTab === 'active' && (
                              <>
                                <Link
                                  href={`/review/${task.id}`}
                                  style={{
                                    padding: '6px 12px',
                                    background: 'rgba(0,201,167,0.1)',
                                    border: '1px solid rgba(0,201,167,0.3)',
                                    borderRadius: 6,
                                    color: '#00C9A7',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    textDecoration: 'none',
                                    flex: 1,
                                    textAlign: 'center',
                                  }}
                                >
                                  Review submissions
                                </Link>
                                <button
                                  onClick={() => handleArchive(task.id, task.title)}
                                  style={{
                                    padding: '6px 12px',
                                    background: 'transparent',
                                    border: '1px solid rgba(255,71,87,0.3)',
                                    borderRadius: 6,
                                    color: '#FF4757',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                  }}
                                >
                                  Archive
                                </button>
                              </>
                            )}
                            {activeTab === 'archived' && task.slotsRemaining > 0 && (
                              <button
                                onClick={() => handleRefund(task.id)}
                                style={{
                                  padding: '6px 12px',
                                  background: 'rgba(16,185,129,0.1)',
                                  border: '1px solid rgba(16,185,129,0.3)',
                                  borderRadius: 6,
                                  color: '#00D68F',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  flex: 1,
                                }}
                              >
                                💰 Refund {(task.piReward * task.slotsRemaining).toFixed(2)}π
                              </button>
                            )}
                            {activeTab === 'archived' && task.slotsRemaining === 0 && (
                              <div style={{
                                fontSize: '12px',
                                color: '#454F64',
                                fontStyle: 'italic',
                              }}>
                                ✓ All slots claimed
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: '12px',
                      marginTop: '1.5rem',
                      paddingTop: '1rem',
                      borderTop: '1px solid rgba(255,255,255,0.07)',
                    }}>
                      <button
                        onClick={() => activeTab === 'active'
                          ? setActivePage(currentPage - 1)
                          : setArchivedPage(currentPage - 1)
                        }
                        disabled={!hasPrevPage}
                        style={{
                          padding: '6px 12px',
                          background: hasPrevPage ? 'rgba(0,201,167,0.1)' : 'rgba(255,255,255,0.05)',
                          border: `1px solid ${hasPrevPage ? 'rgba(0,201,167,0.3)' : 'rgba(255,255,255,0.1)'}`,
                          borderRadius: 6,
                          color: hasPrevPage ? '#00C9A7' : '#8892A8',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: hasPrevPage ? 'pointer' : 'not-allowed',
                        }}
                      >
                        ← Prev
                      </button>
                      <div style={{
                        fontSize: '12px',
                        color: '#8892A8',
                        minWidth: '40px',
                        textAlign: 'center',
                      }}>
                        {currentPage + 1} / {totalPages}
                      </div>
                      <button
                        onClick={() => activeTab === 'active'
                          ? setActivePage(currentPage + 1)
                          : setArchivedPage(currentPage + 1)
                        }
                        disabled={!hasNextPage}
                        style={{
                          padding: '6px 12px',
                          background: hasNextPage ? 'rgba(0,201,167,0.1)' : 'rgba(255,255,255,0.05)',
                          border: `1px solid ${hasNextPage ? 'rgba(0,201,167,0.3)' : 'rgba(255,255,255,0.1)'}`,
                          borderRadius: 6,
                          color: hasNextPage ? '#00C9A7' : '#8892A8',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: hasNextPage ? 'pointer' : 'not-allowed',
                        }}
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </>
              )
            })()}
          </>
        )}

      </main>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        isDangerous={confirmDialog.type === 'archive'}
        confirmLabel={confirmDialog.type === 'archive' ? '🗄 Archive' : '💰 Refund'}
        onConfirm={async () => {
          if (confirmDialog.type === 'archive') {
            const taskTitle = tasks.find(t => t.id === confirmDialog.id)?.title || 'Task'
            await confirmArchive(confirmDialog.id, taskTitle)
          } else if (confirmDialog.type === 'refund') {
            await confirmRefund(confirmDialog.id)
          }
        }}
        onCancel={() =>
          setConfirmDialog({ isOpen: false, id: '', type: 'archive', title: '', message: '' })
        }
      />

      {/* Toast Notifications */}
      <Toaster
        position="bottom-right"
        richColors
        theme="dark"
      />
    </div>
  )
}


