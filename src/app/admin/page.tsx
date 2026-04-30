'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePiAuth } from '@/hooks/use-pi-auth'
import { Navigation } from '@/components/Navigation'
import { COLORS, FONTS, SPACING, RADII, SHADOWS } from '@/lib/design/tokens'

interface AdminAnalytics {
  totalUsers: number
  totalTasks: number
  activeTasks: number
  totalPiEscrowed: number
  totalPiPaidOut: number
  platformHealth: {
    uptime: number
    apiStatus: string
    paymentSuccessRate: number
  }
}

export default function AdminPage() {
  const { user, authenticate, isSdkReady } = usePiAuth()
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user?.piUid) return

    const origin = window.location.origin
    const headers = { 'x-pi-uid': user.piUid }

    fetch(`${origin}/api/analytics/admin`, { headers })
      .then(r => r.json())
      .then(d => {
        if (d.summary) {
          setAnalytics(d.summary)
        }
      })
      .finally(() => setIsLoading(false))
  }, [user?.piUid])

  if (!user) {
    return (
      <div style={{
        minHeight: '100vh',
        background: COLORS.bgBase,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: FONTS.sans,
        color: COLORS.textSecondary,
      }}>
        <button
          onClick={authenticate}
          style={{
            padding: '0.75rem 2rem',
            background: 'linear-gradient(135deg, #FF6B35, #FF8C5A)',
            color: 'white',
            border: 'none',
            borderRadius: RADII.lg,
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          Connect with Pi
        </button>
      </div>
    )
  }

  // Check if user is admin (you may need to adjust this based on your auth setup)
  // For now, we'll render the admin panel

  return (
    <div style={{
      minHeight: '100vh',
      background: COLORS.bgBase,
      fontFamily: FONTS.sans,
      color: COLORS.textPrimary,
    }}>
      <Navigation currentPage="admin" />

      <main className="page-main">

        {/* TopBar with ORANGE accent */}
        <div style={{
          padding: '14px 20px 10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: SPACING.lg,
          borderRadius: RADII.lg,
        }}>
          <div>
            <div style={{
              fontSize: 12,
              color: '#8892A8',
              marginBottom: 2,
            }}>
              Platform Administration
            </div>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 24,
              letterSpacing: 2,
              textTransform: 'uppercase',
            }}>
              System Admin
              <span style={{ color: '#FF8C5A' }}> 🛡️</span>
            </div>
          </div>
        </div>

        {/* Stats Grid - 4 tiles */}
        {!isLoading && analytics && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 14,
            marginBottom: 20,
          }}>
            {[
              { label: 'Total Users', value: analytics.totalUsers, color: '#FF6B35', icon: '👥' },
              { label: 'Active Tasks', value: analytics.activeTasks, color: '#FFB020', icon: '⚡' },
              { label: 'Pi Escrowed', value: `${analytics.totalPiEscrowed.toFixed(2)}π`, color: '#FF8C5A', icon: '🔒' },
              { label: 'Pi Paid Out', value: `${analytics.totalPiPaidOut.toFixed(2)}π`, color: '#00D68F', icon: '💰' },
            ].map(stat => (
              <div
                key={stat.label}
                style={{
                  background: 'linear-gradient(135deg, rgba(255,107,53,0.08) 0%, #131720 60%)',
                  border: '1px solid rgba(255,107,53,0.25)',
                  borderRadius: 14,
                  padding: 16,
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 10,
                }}>
                  <span style={{ fontSize: 20 }}>{stat.icon}</span>
                  <div style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#454F64',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}>
                    {stat.label}
                  </div>
                </div>
                <div style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: 32,
                  color: stat.color,
                  lineHeight: 1,
                }}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Platform Health Card */}
        {!isLoading && analytics && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(255,107,53,0.08) 0%, #131720 60%)',
            border: '1px solid rgba(255,107,53,0.25)',
            borderRadius: 14,
            padding: 16,
            marginBottom: 20,
          }}>
            <div style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#454F64',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              marginBottom: 12,
            }}>
              Platform Health
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 10,
            }}>
              {[
                { label: 'Uptime', value: `${(analytics.platformHealth?.uptime || 99.9).toFixed(2)}%`, color: '#00D68F' },
                { label: 'API Status', value: analytics.platformHealth?.apiStatus || 'Healthy', color: '#FF8C5A' },
                { label: 'Payment Success', value: `${(analytics.platformHealth?.paymentSuccessRate || 99.5).toFixed(1)}%`, color: '#FFB020' },
              ].map(stat => (
                <div key={stat.label} style={{
                  padding: 10,
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: 8,
                }}>
                  <div style={{
                    fontSize: 9,
                    color: '#454F64',
                    marginBottom: 4,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}>
                    {stat.label}
                  </div>
                  <div style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: stat.color,
                  }}>
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Admin Navigation Links */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 12,
        }}>
          <Link
            href="/admin/disputes"
            style={{
              padding: 14,
              background: 'rgba(255,107,53,0.1)',
              border: '1px solid rgba(255,107,53,0.3)',
              borderRadius: 10,
              color: '#FF8C5A',
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: 700,
              textAlign: 'center',
              transition: 'all 0.2s',
              cursor: 'pointer',
            }}
          >
            ⚖️ Disputes & Resolutions
          </Link>
          <Link
            href="/admin/analytics"
            style={{
              padding: 14,
              background: 'rgba(255,107,53,0.1)',
              border: '1px solid rgba(255,107,53,0.3)',
              borderRadius: 10,
              color: '#FF8C5A',
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: 700,
              textAlign: 'center',
              transition: 'all 0.2s',
              cursor: 'pointer',
            }}
          >
            📊 Detailed Analytics
          </Link>
        </div>

      </main>
    </div>
  )
}
