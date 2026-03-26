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
    networkFee: number
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

function StatCard({
  title,
  value,
  subtitle,
  bgColor = COLORS.bgSurface,
}: {
  title: string
  value: string | number
  subtitle?: string
  bgColor?: string
}) {
  return (
    <div style={{
      backgroundColor: bgColor,
      borderRadius: RADII.lg,
      padding: SPACING.lg,
      border: `1px solid ${COLORS.border}`,
      boxShadow: SHADOWS.card,
    }}>
      <div style={{
        fontSize: '0.875rem',
        color: COLORS.textMuted,
        marginBottom: SPACING.xs,
      }}>
        {title}
      </div>
      <div style={{
        fontSize: '1.5rem',
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginBottom: subtitle ? SPACING.xs : 0,
      }}>
        {value}
      </div>
      {subtitle && (
        <div style={{
          fontSize: '0.75rem',
          color: COLORS.textMuted,
          marginTop: SPACING.xs,
        }}>
          {subtitle}
        </div>
      )}
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
        <Link href="/dashboard" style={{ color: COLORS.indigo, textDecoration: 'none', fontSize: '0.85rem' }}>
          ← Back to Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: COLORS.bgBase,
      fontFamily: FONTS.sans,
      color: COLORS.textPrimary,
    }}>
      <Navigation currentPage="admin" />

      <main className="page-main" style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: `64px var(--page-padding) ${SPACING.xl}`,
      }}>
        {/* Header */}
        <div style={{ marginBottom: SPACING.xl }}>
          <div style={{
            fontSize: '0.65rem',
            fontWeight: '600',
            color: COLORS.textMuted,
            letterSpacing: '0.1em',
            textTransform: 'uppercase' as const,
            marginBottom: '4px',
            fontFamily: FONTS.mono,
          }}>
            Admin Panel
          </div>
          <h1 style={{
            margin: 0,
            fontSize: 'clamp(1.25rem, 4vw, 1.75rem)',
            fontWeight: '700',
            letterSpacing: '-0.02em',
            marginBottom: SPACING.xs,
          }}>
            💰 Revenue Dashboard
          </h1>
          <p style={{
            fontSize: '1rem',
            color: COLORS.textMuted,
            margin: 0,
          }}>
            Platform metrics and financial overview
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
            {/* Revenue Summary Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: SPACING.md,
              marginBottom: SPACING.xl,
            }}>
              <StatCard
                title="💰 Total Platform Revenue"
                value={formatPi(analytics.summary.totalPlatformRevenue)}
                subtitle="All-time fees earned (5% commission)"
                bgColor={COLORS.bgSurface}
              />
              <StatCard
                title="💸 Total Worker Payouts"
                value={formatPi(analytics.summary.totalPiPaidOut)}
                subtitle="Confirmed payments sent"
                bgColor={COLORS.bgSurface}
              />
              <StatCard
                title="⏳ Pending Payouts"
                value={formatPi(analytics.summary.totalPiPending)}
                subtitle="Awaiting blockchain confirmation"
                bgColor={COLORS.bgSurface}
              />
              <StatCard
                title="🔒 Total Escrowed"
                value={formatPi(analytics.summary.totalPiEscrowed)}
                subtitle="Pi locked in active tasks"
                bgColor={COLORS.bgSurface}
              />
            </div>

            {/* Platform Metrics */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: SPACING.md,
              marginBottom: SPACING.xl,
            }}>
              <StatCard
                title="👥 Total Users"
                value={analytics.summary.totalUsers}
                bgColor={COLORS.bgSurface}
              />
              <StatCard
                title="📋 Total Tasks"
                value={analytics.summary.totalTasks}
                bgColor={COLORS.bgSurface}
              />
              <StatCard
                title="✔️ Active Tasks"
                value={analytics.summary.activeTasks}
                subtitle={`${analytics.summary.totalTasks > 0 ? Math.round((analytics.summary.activeTasks / analytics.summary.totalTasks) * 100) : 0}% of total`}
                bgColor={COLORS.bgSurface}
              />
              <StatCard
                title="📊 Transactions"
                value={analytics.summary.totalTransactions}
                bgColor={COLORS.bgSurface}
              />
            </div>

            {/* Revenue Breakdown */}
            <div style={{
              backgroundColor: COLORS.bgSurface,
              borderRadius: RADII.lg,
              padding: SPACING.lg,
              marginBottom: SPACING.xl,
              border: `1px solid ${COLORS.border}`,
              boxShadow: SHADOWS.card,
            }}>
              <h2 style={{
                fontSize: '1.125rem',
                fontWeight: '700',
                color: COLORS.textPrimary,
                margin: `0 0 ${SPACING.md} 0`,
              }}>
                💹 Revenue Breakdown
              </h2>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: SPACING.md,
              }}>
                <div style={{
                  backgroundColor: COLORS.bgElevated,
                  padding: SPACING.md,
                  borderRadius: RADII.md,
                  borderLeft: `4px solid ${COLORS.emerald}`,
                }}>
                  <div style={{ color: COLORS.textMuted, fontSize: '0.875rem' }}>
                    Worker Share
                  </div>
                  <div style={{ fontSize: '1.125rem', fontWeight: '700', marginTop: SPACING.xs, color: COLORS.emerald }}>
                    95%
                  </div>
                  <div style={{ fontSize: '0.75rem', color: COLORS.textMuted, marginTop: SPACING.xs }}>
                    {formatPi(analytics.summary.totalPiPaidOut)}
                  </div>
                </div>

                <div style={{
                  backgroundColor: COLORS.bgElevated,
                  padding: SPACING.md,
                  borderRadius: RADII.md,
                  borderLeft: `4px solid ${COLORS.indigo}`,
                }}>
                  <div style={{ color: COLORS.textMuted, fontSize: '0.875rem' }}>
                    Platform Revenue
                  </div>
                  <div style={{ fontSize: '1.125rem', fontWeight: '700', marginTop: SPACING.xs, color: COLORS.indigo }}>
                    5%
                  </div>
                  <div style={{ fontSize: '0.75rem', color: COLORS.textMuted, marginTop: SPACING.xs }}>
                    {formatPi(analytics.summary.totalPlatformRevenue)}
                  </div>
                </div>

                <div style={{
                  backgroundColor: COLORS.bgElevated,
                  padding: SPACING.md,
                  borderRadius: RADII.md,
                  borderLeft: `4px solid ${COLORS.amber}`,
                }}>
                  <div style={{ color: COLORS.textMuted, fontSize: '0.875rem' }}>
                    Total Transaction Value
                  </div>
                  <div style={{ fontSize: '1.125rem', fontWeight: '700', marginTop: SPACING.xs, color: COLORS.amber }}>
                    {formatPi(analytics.summary.totalPiPaidOut / 0.95)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: COLORS.textMuted, marginTop: SPACING.xs }}>
                    (before commission)
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Transactions */}
            {analytics.recentTransactions.length > 0 && (
              <div style={{
                backgroundColor: COLORS.bgSurface,
                borderRadius: RADII.lg,
                padding: SPACING.lg,
                marginBottom: SPACING.xl,
                border: `1px solid ${COLORS.border}`,
                boxShadow: SHADOWS.card,
                overflowX: 'auto',
              }}>
                <h2 style={{
                  fontSize: '1.125rem',
                  fontWeight: '700',
                  color: COLORS.textPrimary,
                  margin: `0 0 ${SPACING.md} 0`,
                }}>
                  📝 Recent Transactions (Last 20)
                </h2>

                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.875rem',
                }}>
                  <thead>
                    <tr style={{
                      borderBottom: `1px solid ${COLORS.border}`,
                      backgroundColor: COLORS.bgElevated,
                    }}>
                      <th style={{
                        padding: SPACING.md,
                        textAlign: 'left',
                        color: COLORS.textMuted,
                        fontWeight: '600',
                      }}>
                        Type
                      </th>
                      <th style={{
                        padding: SPACING.md,
                        textAlign: 'left',
                        color: COLORS.textMuted,
                        fontWeight: '600',
                      }}>
                        Amount
                      </th>
                      <th style={{
                        padding: SPACING.md,
                        textAlign: 'left',
                        color: COLORS.textMuted,
                        fontWeight: '600',
                      }}>
                        Platform Fee
                      </th>
                      <th style={{
                        padding: SPACING.md,
                        textAlign: 'left',
                        color: COLORS.textMuted,
                        fontWeight: '600',
                      }}>
                        Network Fee
                      </th>
                      <th style={{
                        padding: SPACING.md,
                        textAlign: 'left',
                        color: COLORS.textMuted,
                        fontWeight: '600',
                      }}>
                        Net Amount
                      </th>
                      <th style={{
                        padding: SPACING.md,
                        textAlign: 'left',
                        color: COLORS.textMuted,
                        fontWeight: '600',
                      }}>
                        Status
                      </th>
                      <th style={{
                        padding: SPACING.md,
                        textAlign: 'left',
                        color: COLORS.textMuted,
                        fontWeight: '600',
                      }}>
                        Time
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.recentTransactions.map((tx, idx) => (
                      <tr key={tx.id || idx} style={{
                        borderBottom: `1px solid ${COLORS.border}`,
                        backgroundColor: idx % 2 === 0 ? COLORS.bgElevated : 'transparent',
                        ':hover': {
                          backgroundColor: COLORS.bg3,
                        },
                      }}>
                        <td style={{ padding: SPACING.md, color: COLORS.textPrimary }}>
                          <span style={{
                            backgroundColor: tx.type === 'platform_fee' ? COLORS.indigo : tx.type === 'worker_payout' ? COLORS.emerald : COLORS.amber,
                            color: 'white',
                            padding: `${SPACING.xs} ${SPACING.sm}`,
                            borderRadius: RADII.sm,
                            fontSize: '0.75rem',
                            fontWeight: '600',
                          }}>
                            {tx.type === 'platform_fee' ? '💰 Fee' : tx.type === 'worker_payout' ? '💵 Payout' : '🔒 Escrow'}
                          </span>
                        </td>
                        <td style={{ padding: SPACING.md, color: COLORS.textPrimary }}>
                          {formatPi(tx.amount)}
                        </td>
                        <td style={{ padding: SPACING.md, color: COLORS.red }}>
                          {formatPi(tx.platformFee)}
                        </td>
                        <td style={{ padding: SPACING.md, color: COLORS.amber }}>
                          {formatPi(tx.networkFee)}
                        </td>
                        <td style={{ padding: SPACING.md, color: COLORS.emerald, fontWeight: '600' }}>
                          {formatPi(tx.netAmount)}
                        </td>
                        <td style={{ padding: SPACING.md }}>
                          <span style={{
                            backgroundColor: tx.status === 'confirmed' ? COLORS.emerald : tx.status === 'pending' ? COLORS.amber : COLORS.red,
                            color: 'white',
                            padding: `${SPACING.xs} ${SPACING.sm}`,
                            borderRadius: RADII.sm,
                            fontSize: '0.75rem',
                            fontWeight: '600',
                          }}>
                            {tx.status === 'confirmed' ? '✓ Confirmed' : tx.status === 'pending' ? '⏳ Pending' : '✗ Failed'}
                          </span>
                        </td>
                        <td style={{ padding: SPACING.md, color: COLORS.textMuted }}>
                          {timeAgo(tx.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Top Users */}
            {analytics.topUsers.length > 0 && (
              <div style={{
                backgroundColor: COLORS.bgSurface,
                borderRadius: RADII.lg,
                padding: SPACING.lg,
                border: `1px solid ${COLORS.border}`,
                boxShadow: SHADOWS.card,
              }}>
                <h2 style={{
                  fontSize: '1.125rem',
                  fontWeight: '700',
                  color: COLORS.textPrimary,
                  margin: `0 0 ${SPACING.md} 0`,
                }}>
                  ⭐ Top Users (Last 20)
                </h2>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: SPACING.md,
                }}>
                  {analytics.topUsers.map((user, idx) => (
                    <div key={idx} style={{
                      backgroundColor: COLORS.bgElevated,
                      padding: SPACING.md,
                      borderRadius: RADII.md,
                      border: `1px solid ${COLORS.border}`,
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: SPACING.md,
                      }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: COLORS.indigo,
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '700',
                          marginRight: SPACING.md,
                        }}>
                          {idx + 1}
                        </div>
                        <div>
                          <div style={{
                            fontSize: '1rem',
                            fontWeight: '600',
                            color: COLORS.textPrimary,
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
                      </div>
                      <div style={{
                        backgroundColor: COLORS.bgBase,
                        padding: `${SPACING.xs} ${SPACING.sm}`,
                        borderRadius: RADII.sm,
                        textAlign: 'center',
                      }}>
                        <div style={{
                          fontSize: '0.75rem',
                          color: COLORS.textMuted,
                        }}>
                          Reputation
                        </div>
                        <div style={{
                          fontSize: '1.125rem',
                          fontWeight: '700',
                          color: COLORS.amber,
                        }}>
                          {user.reputationScore.toFixed(1)} ⭐
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : null}
      </main>
    </div>
  )
}
