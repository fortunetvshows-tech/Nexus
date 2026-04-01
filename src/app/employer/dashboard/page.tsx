'use client'

import { useEffect, useState, useRef } from 'react'
import Link                             from 'next/link'
import { toast, Toaster }               from 'sonner'
import { usePiAuth }                    from '@/hooks/use-pi-auth'
import { Navigation }                   from '@/components/Navigation'
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
              background:     `linear-gradient(135deg, ${COLORS.sapphire}, ${COLORS.sapphireDark})`,
              color:          'white',
              borderRadius:   RADII.md,
              fontSize:       '0.85rem',
              fontWeight:     '600',
              textDecoration: 'none',
              boxShadow:      SHADOWS.cyanGlow,
              border:         `1px solid ${COLORS.cyan}`,
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
              <div key={i} className="proofgrid-card" style={{ height: '100px' }} />
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
                id:       'stat-spent',
                children: (
                  <EmployerStatCard
                    label="Total Spent"
                    value={`${totalSpent.toFixed(3)}π`}
                    sub="paid to workers"
                    color={COLORS.emerald}
                    icon="💰"
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
                children: (() => {
                  const TASKS_PER_PAGE = 4
                  const displayTasks = activeTab === 'active' ? activeTasks : archivedTasks
                  const currentPage = activeTab === 'active' ? activePage : archivedPage
                  const startIdx = currentPage * TASKS_PER_PAGE
                  const paginatedTasks = displayTasks.slice(startIdx, startIdx + TASKS_PER_PAGE)
                  const totalPages = Math.ceil(displayTasks.length / TASKS_PER_PAGE)
                  const hasNextPage = currentPage < totalPages - 1
                  const hasPrevPage = currentPage > 0

                  return (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      {/* ── TAB HEADER ── */}
                      <div style={{
                        display:       'flex',
                        gap:           '1rem',
                        marginBottom:  SPACING.lg,
                        borderBottom:  `1px solid ${COLORS.border}`,
                        paddingBottom: SPACING.md,
                      }}>
                        <button
                          onClick={() => { setActiveTab('active'); setActivePage(0) }}
                          style={{
                            background:   'none',
                            border:       'none',
                            padding:      '0 0.5rem',
                            cursor:       'pointer',
                            fontSize:     '0.85rem',
                            fontWeight:   activeTab === 'active' ? '700' : '600',
                            color:        activeTab === 'active' ? COLORS.sapphire : COLORS.textMuted,
                            borderBottom: activeTab === 'active' ? `2px solid ${COLORS.sapphire}` : 'none',
                            fontFamily:   FONTS.sans,
                            paddingBottom: '4px',
                          }}
                        >
                          ⚡ Active Tasks {activeTasks.length > 0 && `(${activeTasks.length})`}
                        </button>
                        <button
                          onClick={() => { setActiveTab('archived'); setArchivedPage(0) }}
                          style={{
                            background:   'none',
                            border:       'none',
                            padding:      '0 0.5rem',
                            cursor:       'pointer',
                            fontSize:     '0.85rem',
                            fontWeight:   activeTab === 'archived' ? '700' : '600',
                            color:        activeTab === 'archived' ? COLORS.emerald : COLORS.textMuted,
                            borderBottom: activeTab === 'archived' ? `2px solid ${COLORS.emerald}` : 'none',
                            fontFamily:   FONTS.sans,
                            paddingBottom: '4px',
                          }}
                        >
                          📦 Archived {archivedTasks.length > 0 && `(${archivedTasks.length})`}
                        </button>
                      </div>

                      {/* ── CONTENT ── */}
                      {displayTasks.length === 0 ? (
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
                          <span style={{ fontSize: '1.5rem', opacity: 0.4 }}>
                            {activeTab === 'active' ? '📭' : '🎁'}
                          </span>
                          {activeTab === 'active' ? 'No active tasks' : 'No archived tasks'}
                        </div>
                      ) : (
                        <>
                          <div style={{
                            display:       'flex',
                            flexDirection: 'column',
                            gap:           '0.875rem',
                            flex:          1,
                          }}>
                            {paginatedTasks.map((task, idx) => {
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
                                      color:        activeTab === 'active' ? COLORS.textPrimary : COLORS.textMuted,
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
                                      {activeTab === 'active' && (
                                        <Link
                                          href={`/review/${task.id}`}
                                          style={{
                                            padding:        '2px 8px',
                                            background:     COLORS.sapphireDim,
                                            color:          COLORS.sapphireLight,
                                            borderRadius:   '6px',
                                            fontSize:       '0.68rem',
                                            fontWeight:     '600',
                                            textDecoration: 'none',
                                            border:         `1px solid rgba(99,102,241,0.2)`,
                                          }}
                                        >
                                          Review
                                        </Link>
                                      )}
                                    </div>
                                  </div>

                                  {/* Task actions */}
                                  <div style={{
                                    display: 'flex',
                                    gap:     '8px',
                                    marginTop: '0.75rem',
                                  }}>
                                    {activeTab === 'active' && (
                                      <>
                                        <button
                                          onClick={() => setEditingTask(task)}
                                          style={{
                                            padding:      '4px 12px',
                                            background:   'transparent',
                                            border:       `1px solid ${COLORS.borderAccent}`,
                                            borderRadius: RADII.sm,
                                            color:        COLORS.textSecondary,
                                            fontSize:     '0.75rem',
                                            cursor:       'pointer',
                                            fontFamily:   FONTS.sans,
                                          }}
                                        >
                                          ✏️ Edit
                                        </button>
                                        <button
                                          onClick={() => handleArchive(task.id, task.title)}
                                          style={{
                                            padding:      '4px 12px',
                                            background:   'transparent',
                                            border:       '1px solid rgba(239,68,68,0.3)',
                                            borderRadius: RADII.sm,
                                            color:        '#EF4444',
                                            fontSize:     '0.75rem',
                                            cursor:       'pointer',
                                            fontFamily:   FONTS.sans,
                                          }}
                                        >
                                          🗄 Archive
                                        </button>
                                      </>
                                    )}
                                    {activeTab === 'archived' && task.slotsRemaining > 0 && (
                                      <button
                                        onClick={() => handleRefund(task.id)}
                                        style={{
                                          padding:      '4px 12px',
                                          background:   'rgba(16,185,129,0.1)',
                                          border:       '1px solid rgba(16,185,129,0.3)',
                                          borderRadius: RADII.md,
                                          color:        COLORS.emerald,
                                          fontSize:     '0.72rem',
                                          cursor:       'pointer',
                                          fontWeight:   '600',
                                          flex:         1,
                                          fontFamily:   FONTS.sans,
                                        }}
                                      >
                                        💰 Refund {(task.piReward * task.slotsRemaining).toFixed(2)}π
                                      </button>
                                    )}
                                    {activeTab === 'archived' && task.slotsRemaining === 0 && (
                                      <div style={{
                                        fontSize:   '0.72rem',
                                        color:      COLORS.textMuted,
                                        fontStyle:  'italic',
                                      }}>
                                        All slots claimed
                                      </div>
                                    )}
                                  </div>

                                  <FillBar
                                    filled={filled}
                                    total={task.slotsAvailable}
                                    delay={idx * 150}
                                    color={activeTab === 'archived' ? COLORS.textMuted : COLORS.indigo}
                                  />
                                </div>
                              )
                            })}
                          </div>

                          {/* ── PAGINATION CONTROLS ── */}
                          {totalPages > 1 && (
                            <div style={{
                              display:        'flex',
                              justifyContent: 'center',
                              gap:            SPACING.md,
                              marginTop:      SPACING.lg,
                              paddingTop:     SPACING.md,
                              borderTop:      `1px solid ${COLORS.border}`,
                            }}>
                              <button
                                onClick={() => activeTab === 'active' 
                                  ? setActivePage(currentPage - 1)
                                  : setArchivedPage(currentPage - 1)
                                }
                                disabled={!hasPrevPage}
                                style={{
                                  padding:      '4px 12px',
                                  background:   hasPrevPage ? COLORS.indigoDim : COLORS.bgElevated,
                                  border:       `1px solid ${hasPrevPage ? COLORS.borderAccent : COLORS.border}`,
                                  borderRadius: RADII.sm,
                                  color:        hasPrevPage ? COLORS.indigoLight : COLORS.textMuted,
                                  fontSize:     '0.75rem',
                                  cursor:       hasPrevPage ? 'pointer' : 'not-allowed',
                                  fontFamily:   FONTS.sans,
                                  fontWeight:   '600',
                                }}
                              >
                                ← Previous
                              </button>
                              <div style={{
                                fontSize:     '0.75rem',
                                color:        COLORS.textMuted,
                                display:      'flex',
                                alignItems:   'center',
                                gap:          '4px',
                              }}>
                                <span style={{ fontFamily: FONTS.mono }}>
                                  {currentPage + 1} / {totalPages}
                                </span>
                              </div>
                              <button
                                onClick={() => activeTab === 'active'
                                  ? setActivePage(currentPage + 1)
                                  : setArchivedPage(currentPage + 1)
                                }
                                disabled={!hasNextPage}
                                style={{
                                  padding:      '4px 12px',
                                  background:   hasNextPage ? COLORS.indigoDim : COLORS.bgElevated,
                                  border:       `1px solid ${hasNextPage ? COLORS.borderAccent : COLORS.border}`,
                                  borderRadius: RADII.sm,
                                  color:        hasNextPage ? COLORS.indigoLight : COLORS.textMuted,
                                  fontSize:     '0.75rem',
                                  cursor:       hasNextPage ? 'pointer' : 'not-allowed',
                                  fontFamily:   FONTS.sans,
                                  fontWeight:   '600',
                                }}
                              >
                                Next →
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )
                })(),
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

      {/* Edit modal */}
      {editingTask && (
        <div style={{
          position:   'fixed' as const,
          inset:      0,
          background: 'rgba(0,0,0,0.7)',
          zIndex:     500,
          display:    'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding:    '1rem',
        }}>
          <div style={{
            background:   COLORS.bgSurface,
            border:       `1px solid ${COLORS.border}`,
            borderRadius: RADII.xl,
            padding:      SPACING.xl,
            width:        '100%',
            maxWidth:     '520px',
            maxHeight:    '80vh',
            overflowY:    'auto' as const,
          }}>
            <h2 style={{
              margin:     `0 0 ${SPACING.lg}`,
              fontSize:   '1.1rem',
              fontWeight: '700',
              color:      COLORS.textPrimary,
            }}>
              Edit Opportunity
            </h2>

            <div style={{ marginBottom: SPACING.md }}>
              <label style={{ display: 'block', fontSize: '0.78rem', color: COLORS.textMuted, marginBottom: '4px' }}>Title</label>
              <input
                defaultValue={editingTask.title}
                onChange={e => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                style={{
                  width:        '100%',
                  padding:      '0.75rem',
                  background:   COLORS.bgElevated,
                  border:       `1px solid ${COLORS.borderAccent}`,
                  borderRadius: RADII.md,
                  color:        COLORS.textPrimary,
                  fontSize:     '0.9rem',
                  outline:      'none',
                  boxSizing:    'border-box' as const,
                  fontFamily:   FONTS.sans,
                }}
              />
            </div>

            <div style={{ marginBottom: SPACING.md }}>
              <label style={{ display: 'block', fontSize: '0.78rem', color: COLORS.textMuted, marginBottom: '4px' }}>Description</label>
              <textarea
                defaultValue={editingTask.description ?? ''}
                onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                style={{
                  width:        '100%',
                  padding:      '0.75rem',
                  background:   COLORS.bgElevated,
                  border:       `1px solid ${COLORS.borderAccent}`,
                  borderRadius: RADII.md,
                  color:        COLORS.textPrimary,
                  fontSize:     '0.875rem',
                  resize:       'vertical' as const,
                  outline:      'none',
                  boxSizing:    'border-box' as const,
                  fontFamily:   FONTS.sans,
                }}
              />
            </div>

            <div style={{ marginBottom: SPACING.lg }}>
              <label style={{ display: 'block', fontSize: '0.78rem', color: COLORS.textMuted, marginBottom: '4px' }}>Instructions</label>
              <textarea
                defaultValue={editingTask.instructions ?? ''}
                onChange={e => setEditForm(prev => ({ ...prev, instructions: e.target.value }))}
                rows={4}
                style={{
                  width:        '100%',
                  padding:      '0.75rem',
                  background:   COLORS.bgElevated,
                  border:       `1px solid ${COLORS.borderAccent}`,
                  borderRadius: RADII.md,
                  color:        COLORS.textPrimary,
                  fontSize:     '0.875rem',
                  resize:       'vertical' as const,
                  outline:      'none',
                  boxSizing:    'border-box' as const,
                  fontFamily:   FONTS.sans,
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: SPACING.sm }}>
              <button
                onClick={() => setEditingTask(null)}
                style={{
                  flex:         1,
                  padding:      '0.875rem',
                  background:   'transparent',
                  border:       `1px solid ${COLORS.border}`,
                  borderRadius: RADII.md,
                  color:        COLORS.textSecondary,
                  fontSize:     '0.875rem',
                  cursor:       'pointer',
                  fontFamily:   FONTS.sans,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSaving}
                style={{
                  flex:         2,
                  padding:      '0.875rem',
                  background:   COLORS.sapphire,
                  border:       'none',
                  borderRadius: RADII.md,
                  color:        'white',
                  fontSize:     '0.875rem',
                  fontWeight:   '600',
                  cursor:       isSaving ? 'not-allowed' : 'pointer',
                  fontFamily:   FONTS.sans,
                }}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {actionMessage && (
        <div style={{
          position:     'fixed' as const,
          bottom:       '5rem',
          left:         '50%',
          transform:    'translateX(-50%)',
          padding:      `${SPACING.sm} ${SPACING.lg}`,
          background:   COLORS.bgSurface,
          border:       `1px solid ${COLORS.border}`,
          borderRadius: RADII.full,
          color:        COLORS.textPrimary,
          fontSize:     '0.85rem',
          zIndex:       600,
          boxShadow:    '0 4px 20px rgba(0,0,0,0.4)',
        }}>
          {actionMessage}
        </div>
      )}

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

