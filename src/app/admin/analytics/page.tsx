'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePiAuth } from '@/hooks/use-pi-auth'
import { Navigation } from '@/components/Navigation'
import { COLORS, FONTS, SPACING, RADII, SHADOWS } from '@/lib/design/tokens'

interface AdminAnalytics {
  success: boolean
  summary: {
    totalUsers: number
    totalTasks: number
    activeTasks: number
    totalPiEscrowed: number
    totalPiPaidOut: number
    totalPlatformRevenue: number
    totalPiPending: number
    totalTransactions: number
  }
  recentTransactions: Array<{
    id: string
    type: string
    amount: number
    netAmount: number
    platformFee: number
    status: string
    createdAt: string
  }>
  topUsers: Array<{
    piUsername: string
    reputationScore: number
    submissionsCount: number
  }>
  tasks: Array<{
    id: string
    title: string
    category: string
    slotsAvailable: number
    slotsRemaining: number
    piReward: number
    taskStatus: string
  }>
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hrs = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hrs < 24) return `${hrs}h ago`
  return `${days}d ago`
}

function formatPi(value: number | undefined): string {
  if (value === undefined || value === null) return '0.00π'
  return `${value.toFixed(2)}π`
}

function KPICard({
  icon,
  label,
  value,
  badge,
  badgeColor = COLORS.pi,
}: {
  icon: string
  label: string
  value: string | number
  badge?: string
  badgeColor?: string
}) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      style={{
        backgroundColor: 'rgba(29,32,37,0.62)',
        borderRadius: '20px',
        padding: SPACING.lg,
        border: `1px solid rgba(245,100,46,0.18)`,
        boxShadow: isHovered ? SHADOWS.ad : SHADOWS.card,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.md,
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        cursor: 'default',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Top Accent Border */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: `linear-gradient(90deg, ${badgeColor}, ${badgeColor}80)`,
        }}
      />

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{
          padding: SPACING.sm,
          backgroundColor: `${badgeColor}18`,
          borderRadius: RADII.md,
          fontSize: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: '48px',
          minHeight: '48px',
        }}>
          {icon}
        </div>
        {badge && (
          <div style={{
            fontSize: '0.62rem',
            fontWeight: '700',
            color: badgeColor,
            backgroundColor: `${badgeColor}20`,
            padding: `${SPACING.xs} ${SPACING.sm}`,
            borderRadius: RADII.full,
            textTransform: 'uppercase',
            fontFamily: FONTS.mono,
            letterSpacing: '0.07em',
          }}>
            {badge}
          </div>
        )}
      </div>
      <div>
        <div style={{
          fontSize: '0.68rem',
          fontWeight: '600',
          color: COLORS.textMuted,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: SPACING.xs,
          fontFamily: FONTS.mono,
        }}>
          {label}
        </div>
        <div style={{
          fontSize: '2rem',
          fontWeight: '700',
          color: COLORS.ad,
          fontFamily: FONTS.display,
          letterSpacing: '0.02em',
        }}>
          {value}
        </div>
      </div>
    </div>
  )
}

export default function AdminAnalyticsPage() {
  const { user } = usePiAuth()
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.piUid) return

    setIsLoading(true)
    fetch(`${window.location.origin}/api/analytics/admin`, {
      headers: { 'x-pi-uid': user.piUid },
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setAnalytics(data)
          setError(null)
        } else {
          setError(data.error || 'Failed to load analytics')
        }
      })
      .catch(err => {
        console.error('Analytics fetch failed:', err)
        setError('Failed to load analytics')
      })
      .finally(() => setIsLoading(false))
  }, [user?.piUid])

  if (!user?.isAdmin) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: COLORS.bgBase,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: COLORS.textMuted,
        fontFamily: FONTS.sans,
        gap: SPACING.lg,
      }}>
        <div style={{ fontSize: '2rem' }}>🔒</div>
        <div>Admin access required</div>
        <Link href="/dashboard" style={{ color: COLORS.pi, textDecoration: 'none', fontSize: '0.85rem' }}>
          ← Back to Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="admin-analytics-page" style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 8% 10%, rgba(245,100,46,0.16), transparent 38%), radial-gradient(circle at 92% 80%, rgba(255,107,53,0.14), transparent 36%), #07090E',
      fontFamily: FONTS.sans,
      color: COLORS.textPrimary,
    }}>
      <Navigation currentPage="admin" />

      <main className="page-main" style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: `96px var(--page-padding) 128px`,
      }}>
        {/* Header */}
        <div style={{ marginBottom: SPACING.xl }}>
          <div style={{
            fontSize: '0.65rem',
            fontWeight: '600',
            color: COLORS.adLt,
            letterSpacing: '0.16em',
            textTransform: 'uppercase' as const,
            marginBottom: '4px',
            fontFamily: FONTS.mono,
          }}>
            Governance Console
          </div>
          <h1 style={{
            margin: 0,
            fontSize: 'clamp(1.7rem, 5vw, 2.3rem)',
            fontWeight: '700',
            letterSpacing: '0.03em',
            marginBottom: '6px',
            fontFamily: FONTS.display,
          }}>
            Mainframe Dashboard
          </h1>
          <p style={{
            fontSize: '0.78rem',
            color: COLORS.textMuted,
            margin: 0,
            fontFamily: FONTS.mono,
            letterSpacing: '0.08em',
            textTransform: 'uppercase' as const,
          }}>
            System Protocol Active
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: COLORS.bgBase,
            borderLeft: `4px solid ${COLORS.red}`,
            padding: SPACING.md,
            borderRadius: RADII.md,
            marginBottom: SPACING.lg,
            color: COLORS.red,
          }}>
            {error}
          </div>
        )}

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: SPACING.xl }}>
            <div style={{ color: COLORS.textMuted }}>Loading analytics...</div>
          </div>
        ) : analytics ? (
          <>
            {/* KPI Grid - 4 Column */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: SPACING.lg,
              marginBottom: SPACING.xl,
            }}>
              <KPICard
                icon="💰"
                label="Total Revenue"
                value={formatPi(analytics.summary.totalPlatformRevenue)}
                badge="10% Fee"
                badgeColor={COLORS.emerald}
              />
              <KPICard
                icon="💸"
                label="Total Payouts"
                value={formatPi(analytics.summary.totalPiPaidOut)}
                badge="90% Share"
                badgeColor={COLORS.pi}
              />
              <KPICard
                icon="👥"
                label="Total Users"
                value={analytics.summary.totalUsers}
                badgeColor={COLORS.amber}
              />
              <KPICard
                icon="📋"
                label="Active Tasks"
                value={analytics.summary.activeTasks}
                badge="100% Active"
                badgeColor={COLORS.emerald}
              />
            </div>

            {/* Secondary KPIs */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: SPACING.lg,
              marginBottom: SPACING.xl,
            }}>
              <KPICard
                icon="⏳"
                label="Pending Payouts"
                value={formatPi(analytics.summary.totalPiPending)}
                badge="Awaiting"
                badgeColor={COLORS.amber}
              />
              <KPICard
                icon="🔒"
                label="Escrowed"
                value={formatPi(analytics.summary.totalPiEscrowed)}
                badgeColor={COLORS.pi}
              />
              <KPICard
                icon="📊"
                label="Total Transactions"
                value={analytics.summary.totalTransactions}
                badgeColor={COLORS.pi}
              />
              <KPICard
                icon="✔️"
                label="Completion Rate"
                value={`${analytics.summary.totalTasks > 0 ? Math.round((analytics.summary.activeTasks / analytics.summary.totalTasks) * 100) : 0}%`}
                badgeColor={COLORS.emerald}
              />
            </div>

            {/* Revenue Breakdown */}
            <div className="admin-glass-card" style={{
              backgroundColor: COLORS.bgSurface,
              borderRadius: RADII.lg,
              padding: SPACING.lg,
              marginBottom: SPACING.xl,
              border: `1px solid ${COLORS.border}`,
              boxShadow: SHADOWS.card,
            }}>
              <h2 style={{
                fontSize: '1.35rem',
                fontWeight: '700',
                color: COLORS.textPrimary,
                margin: `0 0 ${SPACING.md} 0`,
                fontFamily: FONTS.display,
                letterSpacing: '0.04em',
              }}>
                Revenue Breakdown
              </h2>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: SPACING.md,
              }}>
                <div style={{
                  backgroundColor: COLORS.bgRaised,
                  padding: SPACING.md,
                  borderRadius: RADII.md,
                  borderLeft: `4px solid ${COLORS.emerald}`,
                }}>
                  <div className="admin-mono-label" style={{ color: COLORS.textMuted }}>
                    Worker Share
                  </div>
                  <div style={{ fontSize: '1.125rem', fontWeight: '700', marginTop: SPACING.xs, color: COLORS.emerald }}>
                    90%
                  </div>
                  <div style={{ fontSize: '0.75rem', color: COLORS.textMuted, marginTop: SPACING.xs }}>
                    {formatPi(analytics.summary.totalPiPaidOut)}
                  </div>
                </div>

                <div style={{
                  backgroundColor: COLORS.bgRaised,
                  padding: SPACING.md,
                  borderRadius: RADII.md,
                  borderLeft: `4px solid ${COLORS.pi}`,
                }}>
                  <div className="admin-mono-label" style={{ color: COLORS.textMuted }}>
                    Platform Revenue
                  </div>
                  <div style={{ fontSize: '1.125rem', fontWeight: '700', marginTop: SPACING.xs, color: COLORS.pi }}>
                    10%
                  </div>
                  <div style={{ fontSize: '0.75rem', color: COLORS.textMuted, marginTop: SPACING.xs }}>
                    {formatPi(analytics.summary.totalPlatformRevenue)}
                  </div>
                </div>

                <div style={{
                  backgroundColor: COLORS.bgRaised,
                  padding: SPACING.md,
                  borderRadius: RADII.md,
                  borderLeft: `4px solid ${COLORS.amber}`,
                }}>
                  <div className="admin-mono-label" style={{ color: COLORS.textMuted }}>
                    Total Transaction Value
                  </div>
                  <div style={{ fontSize: '1.125rem', fontWeight: '700', marginTop: SPACING.xs, color: COLORS.amber }}>
                    {formatPi(analytics.summary.totalPiPaidOut / 0.90)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: COLORS.textMuted, marginTop: SPACING.xs }}>
                    (before commission)
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Transactions */}
            {analytics.recentTransactions.length > 0 && (
              <div className="admin-glass-card" style={{
                backgroundColor: COLORS.bgSurface,
                borderRadius: RADII.lg,
                padding: SPACING.lg,
                marginBottom: SPACING.xl,
                border: `1px solid ${COLORS.borderAccent}`,
                boxShadow: SHADOWS.card,
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '14px',
                }}>
                  <h2 style={{
                    fontSize: '1.35rem',
                    fontWeight: '700',
                    color: COLORS.textPrimary,
                    margin: 0,
                    fontFamily: FONTS.display,
                    letterSpacing: '0.04em',
                  }}>
                    Recent System Events
                  </h2>
                  <div style={{
                    fontSize: '0.68rem',
                    color: COLORS.textMuted,
                    fontFamily: FONTS.mono,
                    textTransform: 'uppercase' as const,
                    letterSpacing: '0.07em',
                  }}>
                    Total Value: {(() => {
                      const total = analytics.recentTransactions.reduce((sum, t) => sum + t.amount, 0)
                      return formatPi(total)
                    })()}
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '0.875rem',
                  }}>
                    <thead>
                      <tr style={{
                        borderBottom: `1px solid ${COLORS.borderAccent}`,
                        backgroundColor: 'rgba(255,255,255,0.03)',
                      }}>
                        <th style={{
                          padding: '14px 16px',
                          textAlign: 'left',
                          color: COLORS.textMuted,
                          fontWeight: '700',
                          fontSize: '0.62rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                          fontFamily: FONTS.mono,
                        }}>
                          Type
                        </th>
                        <th style={{
                          padding: '14px 16px',
                          textAlign: 'right',
                          color: COLORS.textMuted,
                          fontWeight: '700',
                          fontSize: '0.62rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                          fontFamily: FONTS.mono,
                        }}>
                          Amount
                        </th>
                        <th style={{
                          padding: '14px 16px',
                          textAlign: 'right',
                          color: COLORS.textMuted,
                          fontWeight: '700',
                          fontSize: '0.62rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                          fontFamily: FONTS.mono,
                        }}>
                          Fee
                        </th>
                        <th style={{
                          padding: '14px 16px',
                          textAlign: 'right',
                          color: COLORS.textMuted,
                          fontWeight: '700',
                          fontSize: '0.62rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                          fontFamily: FONTS.mono,
                        }}>
                          Net
                        </th>
                        <th style={{
                          padding: '14px 16px',
                          textAlign: 'center',
                          color: COLORS.textMuted,
                          fontWeight: '700',
                          fontSize: '0.62rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                          fontFamily: FONTS.mono,
                        }}>
                          Status
                        </th>
                        <th style={{
                          padding: '14px 16px',
                          textAlign: 'right',
                          color: COLORS.textMuted,
                          fontWeight: '700',
                          fontSize: '0.62rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                          fontFamily: FONTS.mono,
                        }}>
                          Time
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.recentTransactions.map((tx, idx) => {
                        const statusColor = tx.status === 'confirmed' ? COLORS.emerald : tx.status === 'pending' ? COLORS.amber : COLORS.red
                        return (
                          <tr key={tx.id || idx} style={{
                            borderBottom: `1px solid ${COLORS.borderAccent}`,
                            transition: 'background-color 0.2s ease',
                            cursor: 'pointer',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = COLORS.bgRaised)}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <td style={{ padding: SPACING.md, color: COLORS.textPrimary }}>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: SPACING.sm,
                              }}>
                                <span style={{
                                  fontSize: '1rem',
                                }}>
                                  {tx.type === 'platform_fee' ? '💰' : tx.type === 'worker_payout' ? '💵' : '🔒'}
                                </span>
                                <span style={{ fontWeight: '600' }}>
                                  {tx.type === 'platform_fee' ? 'Fee' : tx.type === 'worker_payout' ? 'Payout' : 'Escrow'}
                                </span>
                              </div>
                            </td>
                            <td style={{
                              padding: SPACING.md,
                              textAlign: 'right',
                              color: COLORS.textPrimary,
                              fontFamily: FONTS.mono,
                              fontWeight: '600',
                            }}>
                              {formatPi(tx.amount)}
                            </td>
                            <td style={{
                              padding: SPACING.md,
                              textAlign: 'right',
                              color: COLORS.textMuted,
                              fontFamily: FONTS.mono,
                            }}>
                              {formatPi(tx.platformFee)}
                            </td>
                            <td style={{
                              padding: SPACING.md,
                              textAlign: 'right',
                              color: COLORS.emerald,
                              fontFamily: FONTS.mono,
                              fontWeight: '600',
                            }}>
                              {formatPi(tx.netAmount)}
                            </td>
                            <td style={{
                              padding: SPACING.md,
                              textAlign: 'center',
                            }}>
                              <span style={{
                                backgroundColor: `${statusColor}20`,
                                color: statusColor,
                                padding: `${SPACING.xs} ${SPACING.sm}`,
                                borderRadius: RADII.full,
                                fontSize: '0.62rem',
                                fontWeight: '700',
                                textTransform: 'uppercase',
                                textDecoration: 'none',
                                fontFamily: FONTS.mono,
                                letterSpacing: '0.1em',
                              }}>
                                {tx.status === 'confirmed' ? 'Confirmed' : tx.status === 'pending' ? 'Pending' : 'Failed'}
                              </span>
                            </td>
                            <td style={{
                              padding: SPACING.md,
                              textAlign: 'right',
                              color: COLORS.textMuted,
                              fontSize: '0.8rem',
                            }}>
                              {timeAgo(tx.createdAt)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Top Users - Leaderboard Style */}
            {analytics.topUsers.length > 0 && (
              <div className="admin-glass-card" style={{
                backgroundColor: COLORS.bgSurface,
                borderRadius: RADII.lg,
                padding: SPACING.lg,
                border: `1px solid ${COLORS.borderAccent}`,
                boxShadow: SHADOWS.card,
              }}>
                <h2 style={{
                  fontSize: '1.35rem',
                  fontWeight: '700',
                  color: COLORS.textPrimary,
                  margin: `0 0 ${SPACING.lg} 0`,
                  fontFamily: FONTS.display,
                  letterSpacing: '0.04em',
                }}>
                  Top Users Leaderboard
                </h2>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: SPACING.md,
                }}>
                  {analytics.topUsers.map((user, idx) => {
                    // Calculate max reputation for progress bar (use highest score or default to 1000)
                    const maxReputation = Math.max(
                      analytics.topUsers[0]?.reputationScore || 1000,
                      1000
                    )
                    const progressPercent = (user.reputationScore / maxReputation) * 100

                    return (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: SPACING.md,
                          padding: SPACING.md,
                          backgroundColor: COLORS.bgRaised,
                          borderRadius: RADII.md,
                          border: `1px solid ${COLORS.borderAccent}`,
                          transition: 'all 0.2s ease',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateX(4px)'
                          e.currentTarget.style.boxShadow = SHADOWS.card
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateX(0)'
                          e.currentTarget.style.boxShadow = 'none'
                        }}
                      >
                        {/* Rank Circle */}
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          backgroundColor: idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : COLORS.pi,
                          color: idx < 3 ? '#000' : 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '700',
                          fontSize: '1.125rem',
                          flexShrink: 0,
                        }}>
                          {idx < 3 ? ['🥇', '🥈', '🥉'][idx] : `${idx + 1}`}
                        </div>

                        {/* User Info & Progress Bar */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: SPACING.xs,
                          }}>
                            <div>
                              <div style={{
                                fontWeight: '600',
                                color: COLORS.textPrimary,
                                fontSize: '0.95rem',
                              }}>
                                {user.piUsername}
                              </div>
                              <div style={{
                                fontSize: '0.75rem',
                                color: COLORS.textMuted,
                              }}>
                                {user.submissionsCount} submissions
                              </div>
                            </div>
                            <div style={{
                              fontFamily: FONTS.mono,
                              fontWeight: '700',
                              color: COLORS.amber,
                              fontSize: '0.95rem',
                            }}>
                              {user.reputationScore.toFixed(1)} ⭐
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div style={{
                            width: '100%',
                            height: '6px',
                            backgroundColor: COLORS.bgBase,
                            borderRadius: RADII.full,
                            overflow: 'hidden',
                            marginTop: SPACING.sm,
                          }}>
                            <div style={{
                              height: '100%',
                              width: `${Math.min(progressPercent, 100)}%`,
                              backgroundColor: COLORS.pi,
                              borderRadius: RADII.full,
                              transition: 'width 0.3s ease',
                            }} />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        ) : null}
      </main>
    </div>
  )
}


