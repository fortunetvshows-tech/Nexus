'use client'

import { useEffect, useState, useRef } from 'react'
import Link           from 'next/link'
import { usePiAuth }  from '@/hooks/use-pi-auth'
import { Navigation } from '@/components/Navigation'
import { PLATFORM_CONFIG } from '@/lib/config/platform'

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

interface EmployerSummary {
  totalTasksPosted: number
  totalSlotsPosted: number
  totalSlotsFilled: number
  fillRate:         string
  totalEscrowed:    number
}

interface EmployerTask {
  id:             string
  title:          string
  category:       string
  piReward:       number
  slotsAvailable: number
  slotsRemaining: number
  taskStatus:     string
  createdAt:      string
}

interface AdminSummary {
  totalUsers:           number
  totalTasks:           number
  activeTasks:          number
  totalPiEscrowed:      number
  totalPiPaidOut:       number
  totalPlatformRevenue: number
  totalPiPending:       number
  totalTransactions:    number
}

interface AdminTx {
  type:      string
  status:    string
  amount:    number
  netAmount: number
  createdAt: string
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
    case 'confirmed': return '#86efac'
    case 'pending':   return '#fbbf24'
    case 'failed':    return '#f87171'
    case 'reversed':  return '#9ca3af'
    default:          return '#6b7280'
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
  color = '#ffffff',
  sub,
}: {
  label: string
  value: string
  color?: string
  sub?:  string
}) {
  return (
    <div style={{
      background:   '#111827',
      border:       '1px solid #1f2937',
      borderRadius: '12px',
      padding:      '1.25rem',
    }}>
      <div style={{
        fontSize:   '0.75rem',
        color:      '#6b7280',
        fontWeight: '500',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em',
        marginBottom: '0.5rem',
      }}>
        {label}
      </div>
      <div style={{
        fontSize:   '1.5rem',
        fontWeight: '700',
        color,
        lineHeight: 1,
      }}>
        {value}
      </div>
      {sub && (
        <div style={{
          fontSize:  '0.75rem',
          color:     '#4b5563',
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
  const { user, authenticate, isSdkReady } = usePiAuth()
  const hasAutoAuthenticated = useRef(false)

  useEffect(() => {
    if (isSdkReady && !user && !hasAutoAuthenticated.current) {
      hasAutoAuthenticated.current = true
      authenticate()
    }
  }, [isSdkReady, user, authenticate])

  // Worker data
  const [workerSummary, setWorkerSummary] =
    useState<WorkerSummary | null>(null)
  const [workerTxs, setWorkerTxs]         = useState<WorkerTx[]>([])

  // Employer data
  const [employerSummary, setEmployerSummary] =
    useState<EmployerSummary | null>(null)
  const [employerTasks, setEmployerTasks]     = useState<EmployerTask[]>([])

  // Admin data
  const [adminSummary, setAdminSummary]   =
    useState<AdminSummary | null>(null)
  const [adminTxs, setAdminTxs]           = useState<AdminTx[]>([])

  const [isLoading, setIsLoading]         = useState(true)
  const [activeTab, setActiveTab]         =
    useState<'worker' | 'employer' | 'admin'>('worker')

  useEffect(() => {
    if (!user?.piUid) return

    const headers = { 'x-pi-uid': user.piUid }
    const origin  = window.location.origin

    const fetches = [
      fetch(`${origin}/api/analytics/worker`,   { headers })
        .then(r => r.json())
        .then(d => {
          if (d.summary)      setWorkerSummary(d.summary)
          if (d.transactions) setWorkerTxs(d.transactions)
        }),
      fetch(`${origin}/api/analytics/employer`, { headers })
        .then(r => r.json())
        .then(d => {
          if (d.summary) setEmployerSummary(d.summary)
          if (d.tasks)   setEmployerTasks(d.tasks)
        }),
    ]

    // Admin fetch only for admin users
    if (user.userRole === 'admin') {
      fetches.push(
        fetch(`${origin}/api/analytics/admin`, { headers })
          .then(r => r.json())
          .then(d => {
            if (d.summary)             setAdminSummary(d.summary)
            if (d.recentTransactions)  setAdminTxs(d.recentTransactions)
          })
      )
    }

    Promise.allSettled(fetches).finally(() => setIsLoading(false))
  }, [user?.piUid, user?.userRole])

  if (!user) {
    return (
      <div style={{
        minHeight:      '100vh',
        background:     '#0f0f0f',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        fontFamily:     'system-ui, sans-serif',
        color:          '#9ca3af',
      }}>
        Connecting...
      </div>
    )
  }

  const tabs: Array<{ key: 'worker' | 'employer' | 'admin'; label: string }> = [
    { key: 'worker',   label: 'My Earnings'  },
    { key: 'employer', label: 'My Tasks'     },
  ]
  if (user.userRole === 'admin') {
    tabs.push({ key: 'admin', label: '⚡ Platform' })
  }

  return (
    <div style={{
      minHeight:  '100vh',
      background: '#0f0f0f',
      fontFamily: 'system-ui, sans-serif',
      color:      '#ffffff',
    }}>
      <Navigation currentPage="analytics" />

      <main style={{
        maxWidth: '720px',
        margin:   '0 auto',
        padding:  '80px 1rem 4rem',
      }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{
            margin:     '0 0 0.25rem',
            fontSize:   '1.5rem',
            fontWeight: '700',
          }}>
            Analytics
          </h1>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
            Your financial activity on Nexus
          </p>
        </div>

        {/* Tab bar */}
        <div style={{
          display:      'flex',
          gap:          '0.5rem',
          marginBottom: '2rem',
          background:   '#111827',
          borderRadius: '12px',
          padding:      '0.35rem',
          border:       '1px solid #1f2937',
        }}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex:         1,
                padding:      '0.6rem',
                borderRadius: '8px',
                border:       'none',
                background:   activeTab === tab.key
                                ? '#1f2937'
                                : 'transparent',
                color:        activeTab === tab.key
                                ? '#ffffff'
                                : '#6b7280',
                fontWeight:   activeTab === tab.key ? '600' : '400',
                fontSize:     '0.875rem',
                cursor:       'pointer',
                transition:   'all 0.15s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading && (
          <div style={{
            display:       'flex',
            flexDirection: 'column',
            gap:           '0.75rem',
          }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                background:   '#111827',
                borderRadius: '12px',
                height:       '80px',
                border:       '1px solid #1f2937',
              }} />
            ))}
          </div>
        )}

        {/* ── Worker Tab ── */}
        {!isLoading && activeTab === 'worker' && (
          <div>
            {/* Stats grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap:     '0.75rem',
              marginBottom: '2rem',
            }}>
              <StatCard
                label="Total Earned"
                value={formatPi(workerSummary?.totalEarned ?? 0)}
                color="#86efac"
                sub="confirmed payouts"
              />
              <StatCard
                label="This Week"
                value={formatPi(workerSummary?.thisWeekEarned ?? 0)}
                color="#a78bfa"
              />
              <StatCard
                label="Pending"
                value={formatPi(workerSummary?.totalPending ?? 0)}
                color="#fbbf24"
                sub={`${workerSummary?.pendingCount ?? 0} payouts`}
              />
            </div>

            {/* Fee info */}
            <div style={{
              background:   '#111827',
              border:       '1px solid #1f2937',
              borderRadius: '12px',
              padding:      '1rem 1.25rem',
              marginBottom: '1.5rem',
              fontSize:     '0.8rem',
              color:        '#6b7280',
              display:      'flex',
              gap:          '1.5rem',
            }}>
              <span>
                Platform fee: {(PLATFORM_CONFIG.PLATFORM_FEE_RATE * 100).toFixed(0)}%
              </span>
              <span>
                Network fee: {PLATFORM_CONFIG.NETWORK_FEE_PI}π per payout
              </span>
            </div>

            {/* Transaction history */}
            <h2 style={{
              margin:        '0 0 1rem',
              fontSize:      '0.85rem',
              fontWeight:    '600',
              color:         '#6b7280',
              textTransform: 'uppercase' as const,
              letterSpacing: '0.05em',
            }}>
              Payout History
            </h2>

            {workerTxs.length === 0 && (
              <div style={{
                padding:      '2.5rem',
                textAlign:    'center',
                background:   '#111827',
                borderRadius: '12px',
                border:       '1px solid #1f2937',
                color:        '#6b7280',
                fontSize:     '0.875rem',
              }}>
                No payouts yet.{' '}
                <Link href="/feed" style={{ color: '#7B3FE4' }}>
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
                  background:   '#111827',
                  border:       '1px solid #1f2937',
                  borderRadius: '12px',
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
                      color:    '#6b7280',
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
                      color:      '#86efac',
                      fontSize:   '0.95rem',
                    }}>
                      +{formatPi(Number(tx.netAmount))}
                    </div>
                    <div style={{
                      fontSize: '0.72rem',
                      color:    '#4b5563',
                    }}>
                      of {formatPi(Number(tx.amount))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Employer Tab ── */}
        {!isLoading && activeTab === 'employer' && (
          <div>
            {/* Stats grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap:     '0.75rem',
              marginBottom: '2rem',
            }}>
              <StatCard
                label="Tasks Posted"
                value={String(employerSummary?.totalTasksPosted ?? 0)}
                color="#a78bfa"
              />
              <StatCard
                label="Fill Rate"
                value={`${employerSummary?.fillRate ?? '0.0'}%`}
                color="#86efac"
                sub={`${employerSummary?.totalSlotsFilled ?? 0} / ${employerSummary?.totalSlotsPosted ?? 0} slots`}
              />
              <StatCard
                label="Total Escrowed"
                value={formatPi(employerSummary?.totalEscrowed ?? 0)}
                color="#fbbf24"
                sub="locked in escrow"
              />
              <StatCard
                label="Active Tasks"
                value={String(
                  employerTasks.filter(t => t.taskStatus === 'escrowed').length
                )}
                color="#ffffff"
              />
            </div>

            {/* Task performance table */}
            <h2 style={{
              margin:        '0 0 1rem',
              fontSize:      '0.85rem',
              fontWeight:    '600',
              color:         '#6b7280',
              textTransform: 'uppercase' as const,
              letterSpacing: '0.05em',
            }}>
              Task Performance
            </h2>

            {employerTasks.length === 0 && (
              <div style={{
                padding:      '2.5rem',
                textAlign:    'center',
                background:   '#111827',
                borderRadius: '12px',
                border:       '1px solid #1f2937',
                color:        '#6b7280',
                fontSize:     '0.875rem',
              }}>
                No tasks posted yet.{' '}
                <Link href="/employer" style={{ color: '#7B3FE4' }}>
                  Post a task →
                </Link>
              </div>
            )}

            <div style={{
              display:       'flex',
              flexDirection: 'column',
              gap:           '0.5rem',
            }}>
              {employerTasks.map(task => {
                const filled  = task.slotsAvailable - task.slotsRemaining
                const fillPct = task.slotsAvailable > 0
                  ? Math.round(filled / task.slotsAvailable * 100)
                  : 0

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
                      alignItems:     'flex-start',
                      marginBottom:   '0.5rem',
                    }}>
                      <div>
                        <div style={{
                          fontWeight:   '600',
                          fontSize:     '0.875rem',
                          marginBottom: '0.2rem',
                        }}>
                          {task.title}
                        </div>
                        <div style={{
                          fontSize: '0.75rem',
                          color:    '#6b7280',
                        }}>
                          {task.category}
                          {' · '}
                          {task.piReward}π per slot
                        </div>
                      </div>
                      <Link
                        href={`/review/${task.id}`}
                        style={{
                          padding:        '0.35rem 0.75rem',
                          background:     'linear-gradient(135deg, #7B3FE4, #A855F7)',
                          color:          'white',
                          borderRadius:   '6px',
                          fontSize:       '0.75rem',
                          textDecoration: 'none',
                          whiteSpace:     'nowrap',
                          marginLeft:     '0.75rem',
                        }}
                      >
                        Review →
                      </Link>
                    </div>

                    {/* Fill progress bar */}
                    <div style={{
                      display:        'flex',
                      alignItems:     'center',
                      gap:            '0.75rem',
                      marginTop:      '0.5rem',
                    }}>
                      <div style={{
                        flex:         1,
                        background:   '#1f2937',
                        borderRadius: '9999px',
                        height:       '4px',
                        overflow:     'hidden',
                      }}>
                        <div style={{
                          height:       '100%',
                          width:        `${fillPct}%`,
                          background:   fillPct === 100
                            ? '#86efac'
                            : 'linear-gradient(90deg, #7B3FE4, #A855F7)',
                          borderRadius: '9999px',
                          transition:   'width 0.3s',
                        }} />
                      </div>
                      <span style={{
                        fontSize:  '0.72rem',
                        color:     '#6b7280',
                        whiteSpace: 'nowrap',
                      }}>
                        {filled}/{task.slotsAvailable} slots
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Admin Tab ── */}
        {!isLoading && activeTab === 'admin' && user.userRole === 'admin' && (
          <div>
            {/* Platform stats grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap:     '0.75rem',
              marginBottom: '2rem',
            }}>
              <StatCard
                label="Total Pi Escrowed"
                value={formatPi(adminSummary?.totalPiEscrowed ?? 0)}
                color="#a78bfa"
                sub="all time"
              />
              <StatCard
                label="Total Pi Paid Out"
                value={formatPi(adminSummary?.totalPiPaidOut ?? 0)}
                color="#86efac"
                sub="to workers"
              />
              <StatCard
                label="Platform Revenue"
                value={formatPi(adminSummary?.totalPlatformRevenue ?? 0)}
                color="#fbbf24"
                sub="platform fees collected"
              />
              <StatCard
                label="Pending Payouts"
                value={formatPi(adminSummary?.totalPiPending ?? 0)}
                color="#f87171"
                sub="awaiting confirmation"
              />
              <StatCard
                label="Registered Users"
                value={String(adminSummary?.totalUsers ?? 0)}
                color="#ffffff"
              />
              <StatCard
                label="Active Tasks"
                value={String(adminSummary?.activeTasks ?? 0)}
                color="#7B3FE4"
                sub={`of ${adminSummary?.totalTasks ?? 0} total`}
              />
            </div>

            {/* Recent transactions */}
            <h2 style={{
              margin:        '0 0 1rem',
              fontSize:      '0.85rem',
              fontWeight:    '600',
              color:         '#6b7280',
              textTransform: 'uppercase' as const,
              letterSpacing: '0.05em',
            }}>
              Recent Transactions
            </h2>

            <div style={{
              display:       'flex',
              flexDirection: 'column',
              gap:           '0.4rem',
            }}>
              {adminTxs.map((tx, idx) => (
                <div key={idx} style={{
                  background:   '#111827',
                  border:       '1px solid #1f2937',
                  borderRadius: '10px',
                  padding:      '0.875rem 1.25rem',
                  display:      'flex',
                  justifyContent: 'space-between',
                  alignItems:   'center',
                }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div style={{
                      padding:      '0.2rem 0.6rem',
                      borderRadius: '6px',
                      background:   '#1f2937',
                      fontSize:     '0.72rem',
                      color:        '#a78bfa',
                      fontWeight:   '600',
                      whiteSpace:   'nowrap',
                    }}>
                      {txTypeLabel(tx.type)}
                    </div>
                    <div style={{
                      fontSize: '0.78rem',
                      color:    '#6b7280',
                    }}>
                      {formatDate(tx.createdAt)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <span style={{
                      fontSize:  '0.72rem',
                      color:     statusColor(tx.status),
                    }}>
                      {tx.status}
                    </span>
                    <span style={{
                      fontWeight: '600',
                      fontSize:   '0.875rem',
                      color:      tx.type === 'worker_payout'
                        ? '#86efac'
                        : tx.type === 'platform_fee'
                        ? '#fbbf24'
                        : '#ffffff',
                    }}>
                      {formatPi(Number(tx.amount))}
                    </span>
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
