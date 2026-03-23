'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { usePiAuth } from '@/hooks/use-pi-auth'
import { Navigation } from '@/components/Navigation'
import {
  COLORS, FONTS, RADII, SPACING, GRADIENTS
} from '@/lib/design/tokens'

interface ReferralStats {
  referralCode: string
  totalReferred: number
  qualifiedCount: number
  totalEarned: number
  referrals: Array<{
    id: string
    referredUsername: string
    status: string
    rewardAmount: number
    createdAt: string
  }>
}

export default function ReferralPage() {
  const { user, isLoading } = usePiAuth()
  const [hasMounted, setHasMounted] = useState(false)
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  // Fetch referral stats
  useEffect(() => {
    if (!hasMounted || !user) return

    const fetchStats = async () => {
      setIsLoadingStats(true)
      try {
        const response = await fetch('/api/referral', {
          method: 'GET',
          headers: {
            'x-pi-uid': user.piUid,
          },
        })

        if (!response.ok) {
          console.error('Failed to fetch referral stats')
          return
        }

        const data = await response.json()
        setStats(data.stats)
      } catch (err) {
        console.error('Error fetching referral stats:', err)
      } finally {
        setIsLoadingStats(false)
      }
    }

    fetchStats()
  }, [hasMounted, user])

  const referralLink = hasMounted && stats
    ? `${window.location.origin}/?ref=${stats.referralCode}`
    : ''

  const handleCopyLink = useCallback(() => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [referralLink])

  if (!hasMounted) return null

  if (isLoading || !user) {
    return (
      <div style={{
        minHeight: '100vh',
        background: COLORS.bgBase,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: FONTS.sans,
      }}>
        <Navigation currentPage="profile" />
        <div style={{ color: COLORS.textMuted }}>Loading...</div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: COLORS.bgBase,
      fontFamily: FONTS.sans,
      color: COLORS.textPrimary,
    }}>
      <Navigation currentPage="profile" />

      <main style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: `${SPACING.xl} ${SPACING.lg}`,
      }}>
        {/* Header */}
        <div style={{
          marginBottom: SPACING.xl,
          paddingBottom: SPACING.xl,
          borderBottom: `1px solid ${COLORS.border}`,
        }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            marginBottom: SPACING.md,
          }}>
            🔗 Invite & Earn
          </h1>
          <p style={{
            fontSize: '1.125rem',
            color: COLORS.textSecondary,
            maxWidth: '600px',
          }}>
            Share your referral link and earn 0.50π for every person you invite who completes their first task.
          </p>
        </div>

        {/* Referral Link Section */}
        {stats && (
          <div style={{
            background: GRADIENTS.indigo,
            borderRadius: RADII.lg,
            padding: SPACING.xl,
            marginBottom: SPACING.xl,
            border: `1px solid rgba(99,102,241,0.2)`,
          }}>
            <p style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: COLORS.textMuted,
              marginBottom: SPACING.md,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Your Referral Link
            </p>

            <div style={{
              display: 'flex',
              gap: SPACING.md,
              marginBottom: SPACING.md,
            }}>
              <input
                type="text"
                value={referralLink}
                readOnly
                style={{
                  flex: 1,
                  padding: `${SPACING.sm} ${SPACING.md}`,
                  background: 'rgba(0,0,0,0.2)',
                  border: `1px solid rgba(255,255,255,0.1)`,
                  borderRadius: RADII.md,
                  fontFamily: FONTS.mono,
                  fontSize: '0.875rem',
                  color: COLORS.textPrimary,
                  outline: 'none',
                }}
              />
              <button
                onClick={handleCopyLink}
                style={{
                  padding: `${SPACING.sm} ${SPACING.lg}`,
                  background: COLORS.indigo,
                  color: 'white',
                  border: 'none',
                  borderRadius: RADII.md,
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s ease',
                  opacity: 0.9,
                }}
                onMouseEnter={e => {
                  (e.target as HTMLButtonElement).style.opacity = '1'
                }}
                onMouseLeave={e => {
                  (e.target as HTMLButtonElement).style.opacity = '0.9'
                }}
              >
                {copied ? '✓ Copied!' : 'Copy Link'}
              </button>
            </div>

            <p style={{
              fontSize: '0.875rem',
              color: 'rgba(255,255,255,0.7)',
            }}>
              Share this link with friends. They'll get a referral code that gives them benefits when they sign up.
            </p>
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: SPACING.lg,
            marginBottom: SPACING.xl,
          }}>
            {/* Invited Card */}
            <div style={{
              background: COLORS.bgSurface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: RADII.lg,
              padding: SPACING.lg,
            }}>
              <p style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: COLORS.textMuted,
                marginBottom: SPACING.sm,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                Invited
              </p>
              <p style={{
                fontSize: '2.5rem',
                fontWeight: '700',
                color: COLORS.indigo,
                marginBottom: SPACING.sm,
              }}>
                {stats.totalReferred}
              </p>
              <p style={{
                fontSize: '0.875rem',
                color: COLORS.textSecondary,
              }}>
                {stats.totalReferred === 1 ? 'person invited' : 'people invited'}
              </p>
            </div>

            {/* Qualified Card */}
            <div style={{
              background: COLORS.bgSurface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: RADII.lg,
              padding: SPACING.lg,
            }}>
              <p style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: COLORS.textMuted,
                marginBottom: SPACING.sm,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                Qualified
              </p>
              <p style={{
                fontSize: '2.5rem',
                fontWeight: '700',
                color: COLORS.emerald,
                marginBottom: SPACING.sm,
              }}>
                {stats.qualifiedCount}
              </p>
              <p style={{
                fontSize: '0.875rem',
                color: COLORS.textSecondary,
              }}>
                {stats.qualifiedCount === 1 ? 'person completed' : 'people completed'} first task
              </p>
            </div>

            {/* Earned Card */}
            <div style={{
              background: COLORS.bgSurface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: RADII.lg,
              padding: SPACING.lg,
            }}>
              <p style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: COLORS.textMuted,
                marginBottom: SPACING.sm,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                Earned
              </p>
              <p style={{
                fontSize: '2.5rem',
                fontWeight: '700',
                color: COLORS.amber,
                marginBottom: SPACING.sm,
              }}>
                {stats.totalEarned.toFixed(4)}π
              </p>
              <p style={{
                fontSize: '0.875rem',
                color: COLORS.textSecondary,
              }}>
                Total referral rewards
              </p>
            </div>
          </div>
        )}

        {/* Referrals List */}
        <div style={{
          background: COLORS.bgSurface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: RADII.lg,
          padding: SPACING.lg,
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            marginBottom: SPACING.lg,
          }}>
            Your Referrals
          </h2>

          {stats && stats.referrals.length === 0 ? (
            <div style={{
              textAlign: 'center' as const,
              padding: `${SPACING.xl} ${SPACING.lg}`,
              color: COLORS.textMuted,
            }}>
              <p style={{
                fontSize: '1.125rem',
                marginBottom: SPACING.md,
              }}>
                No referrals yet
              </p>
              <p style={{
                fontSize: '0.875rem',
                marginBottom: SPACING.lg,
              }}>
                Share your referral link above to get started earning rewards!
              </p>
            </div>
          ) : (
            <div>
              {stats?.referrals.map((ref, idx) => (
                <div
                  key={ref.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: `${SPACING.md} 0`,
                    borderBottom: idx < (stats?.referrals.length ?? 0) - 1 ? `1px solid ${COLORS.border}` : 'none',
                  }}
                >
                  <div>
                    <p style={{
                      fontWeight: '600',
                      marginBottom: SPACING.xs,
                    }}>
                      {ref.referredUsername}
                    </p>
                    <p style={{
                      fontSize: '0.875rem',
                      color: COLORS.textMuted,
                    }}>
                      {new Date(ref.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div style={{
                    textAlign: 'right' as const,
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: SPACING.sm,
                      marginBottom: SPACING.xs,
                    }}>
                      <p style={{
                        fontSize: '1rem',
                        fontWeight: '700',
                      }}>
                        {ref.rewardAmount.toFixed(4)}π
                      </p>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: `2px ${SPACING.sm}`,
                          background: ref.status === 'qualified'
                            ? 'rgba(16,185,129,0.1)'
                            : 'rgba(107,114,128,0.1)',
                          color: ref.status === 'qualified'
                            ? COLORS.emerald
                            : COLORS.textMuted,
                          borderRadius: RADII.sm,
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          textTransform: 'capitalize' as const,
                        }}
                      >
                        {ref.status === 'qualified' ? '✓ Qualified' : 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Section */}
        <div style={{
          marginTop: SPACING.xl,
          padding: `${SPACING.lg} ${SPACING.lg}`,
          background: 'rgba(99,102,241,0.05)',
          border: `1px solid ${COLORS.indigoDim}`,
          borderRadius: RADII.lg,
          color: COLORS.textSecondary,
          fontSize: '0.875rem',
          lineHeight: '1.6',
        }}>
          <p style={{
            marginBottom: SPACING.sm,
          }}>
            <strong>How it works:</strong>
          </p>
          <ul style={{
            marginLeft: SPACING.lg,
            marginBottom: SPACING.sm,
          }}>
            <li>Share your referral link with friends</li>
            <li>When they sign up with your code, they become your referral</li>
            <li>When they complete their first approved task, you earn 0.50π</li>
            <li>There's no limit to how much you can earn!</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
