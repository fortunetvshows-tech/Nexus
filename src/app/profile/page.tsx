'use client'

import { useEffect, useState, useMemo } from 'react'
import { usePiAuth } from '@/hooks/use-pi-auth'
import { COLORS, FONTS, RADII, SPACING } from '@/lib/design/tokens'

interface Transaction {
  id: string
  type: string
  amount: number
  taskTitle: string
  employer: string
  createdAt: string
  status: string
}

interface WorkerAnalytics {
  summary: {
    totalEarned: number
    thisWeekEarned: number
    totalCompleted: number
    approvalRate: number
  }
}

export default function ProfilePage() {
  const { user, clearAuth } = usePiAuth()
  const [tab, setTab] = useState<'profile' | 'wallet'>('profile')
  const [analytics, setAnalytics] = useState<WorkerAnalytics | null>(null)
  const [txHistory, setTxHistory] = useState<Transaction[]>([])
  const [walletAddress, setWalletAddress] = useState('')
  const [isEditingWallet, setIsEditingWallet] = useState(false)
  const [walletInput, setWalletInput] = useState('')

  // Fetch worker analytics and transaction history
  useEffect(() => {
    if (!user?.piUid) return
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    
    Promise.all([
      fetch(`${origin}/api/analytics/worker`, {
        headers: { 'x-pi-uid': user.piUid },
      }).then(r => r.json()),
      fetch(`${origin}/api/transactions?type=worker_payout&limit=10`, {
        headers: { 'x-pi-uid': user.piUid },
      }).then(r => r.json()),
    ])
      .then(([analyticsData, txData]) => {
        if (analyticsData?.summary) {
          setAnalytics(analyticsData)
        }
        if (txData?.transactions) {
          setTxHistory(txData.transactions)
        }
      })
      .catch(console.error)
  }, [user?.piUid])

  if (!user) return null

  const handleLogout = () => {
    clearAuth()
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#07090E',
      fontFamily: FONTS.sans,
      color: COLORS.textPrimary,
      paddingBottom: '120px',
    }}>
      {/* TopBar */}
      <div style={{
        padding: '16px 20px 12px',
        background: 'linear-gradient(180deg, rgba(0,149,255,0.1) 0%, transparent 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 24,
          letterSpacing: 2,
          textTransform: 'uppercase',
          color: '#EEF2FF',
        }}>
          PROFILE
        </div>
      </div>

      <main style={{
        maxWidth: '600px',
        margin: '0 auto',
        padding: '20px 16px',
      }}>
        {/* Avatar & Username Card */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(0,149,255,0.08), #0F1119)',
          border: '1px solid rgba(0,149,255,0.15)',
          borderRadius: 20,
          padding: '24px',
          marginBottom: SPACING.lg,
          textAlign: 'center',
        }}>
          {/* Avatar */}
          <div style={{
            width: 68,
            height: 68,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #0095FF, #A78BFA)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 700,
            fontSize: 26,
            fontFamily: "'Bebas Neue', sans-serif",
            margin: '0 auto 16px',
            boxShadow: '0 0 18px rgba(0,149,255,0.25)',
          }}>
            {user?.piUsername?.charAt(0).toUpperCase() || 'P'}
          </div>

          {/* Username */}
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 24,
            letterSpacing: 1,
            color: '#EEF2FF',
            marginBottom: 4,
          }}>
            {user?.piUsername || 'Pioneer'}
          </div>

          {/* Handle */}
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 13,
            color: '#8892A8',
            marginBottom: 12,
          }}>
            @{user?.piUsername?.toLowerCase() || 'user'}
          </div>

          {/* Role & KYC badges */}
          <div style={{
            display: 'flex',
            gap: 8,
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: 12,
          }}>
            <div style={{
              paddingLeft: '6px',
              paddingRight: '10px',
              paddingTop: '4px',
              paddingBottom: '4px',
              background: 'rgba(0,149,255,0.12)',
              border: '1px solid rgba(0,149,255,0.3)',
              borderRadius: 6,
              fontSize: 11,
              color: '#38B2FF',
              fontWeight: 600,
            }}>
              💼 Worker
            </div>
            <div style={{
              paddingLeft: '6px',
              paddingRight: '10px',
              paddingTop: '4px',
              paddingBottom: '4px',
              background: 'rgba(0,214,143,0.12)',
              border: '1px solid rgba(0,214,143,0.3)',
              borderRadius: 6,
              fontSize: 11,
              color: '#00D68F',
              fontWeight: 600,
            }}>
              ✓ KYC L{user?.kycLevel ?? 0}
            </div>
            <div style={{
              paddingLeft: '6px',
              paddingRight: '10px',
              paddingTop: '4px',
              paddingBottom: '4px',
              background: 'rgba(255,107,107,0.12)',
              border: '1px solid rgba(255,107,107,0.3)',
              borderRadius: 6,
              fontSize: 11,
              color: '#FF6B6B',
              fontWeight: 600,
            }}>
              🔥 {user?.reputationScore ?? 0} Rep
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          marginBottom: SPACING.lg,
        }}>
          {['profile', 'wallet'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t as 'profile' | 'wallet')}
              style={{
                flex: 1,
                padding: '12px 0',
                background: 'none',
                border: 'none',
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 16,
                letterSpacing: 2,
                textTransform: 'uppercase',
                color: tab === t ? '#38B2FF' : '#454F64',
                borderBottom: tab === t ? '2px solid #0095FF' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {t === 'profile' ? 'Profile' : 'Wallet'}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {tab === 'profile' && (
          <div>
            {/* Stats Row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 12,
              marginBottom: SPACING.lg,
            }}>
              {[
                { label: 'Tasks Done', value: analytics?.summary?.totalCompleted ?? 0 },
                { label: 'Pi Earned', value: analytics?.summary?.totalEarned?.toFixed(1) ?? 0 },
                { label: 'Approval', value: `${Math.round((analytics?.summary?.approvalRate ?? 0) * 100)}%` },
              ].map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    background: 'rgba(0,149,255,0.06)',
                    border: '1px solid rgba(0,149,255,0.15)',
                    borderRadius: 12,
                    padding: '16px 12px',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: 24,
                      color: '#38B2FF',
                      lineHeight: 1,
                      marginBottom: 8,
                    }}
                  >
                    {stat.value}
                  </div>
                  <div style={{ fontSize: 11, color: '#8892A8', textTransform: 'uppercase' }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Level Progress */}
            <div
              style={{
                background: 'rgba(0,149,255,0.06)',
                border: '1px solid rgba(0,149,255,0.15)',
                borderRadius: 14,
                padding: '16px',
                marginBottom: SPACING.lg,
              }}
            >
              <div style={{ fontSize: 12, color: '#8892A8', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>
                Reputation Progress
              </div>
              <div
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: 18,
                  color: '#EEF2FF',
                  marginBottom: 4,
                }}
              >
                Level {user?.reputationLevel || 'Newcomer'} → {user?.reputationLevel || 'Apprentice'}
              </div>
              <div style={{ fontSize: 12, color: '#8892A8', marginBottom: 12 }}>250 pts needed</div>
              <div
                style={{
                  height: 8,
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: 4,
                  overflow: 'hidden',
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: '65%',
                    background: 'linear-gradient(90deg, #0095FF, #38B2FF)',
                    transition: 'width 0.3s',
                  }}
                />
              </div>
              <div style={{ fontSize: 11, color: '#8892A8', fontStyle: 'italic' }}>Unlocks: Badge milestone + 2% fee reduction</div>
            </div>

            {/* Recent Completed Tasks */}
            <div>
              <div
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: 14,
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                  color: '#EEF2FF',
                  marginBottom: 12,
                }}
              >
                Recent Work
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                {[
                  { title: 'Logo Design Feedback', earned: 3.5, date: '2 days ago' },
                  { title: 'Market Research Analysis', earned: 8.2, date: '1 week ago' },
                  { title: 'Content Writing - Blog Post', earned: 5.0, date: '2 weeks ago' },
                ].map((task, i) => (
                  <div
                    key={i}
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: 10,
                      padding: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, color: '#EEF2FF' }}>{task.title}</div>
                      <div style={{ fontSize: 11, color: '#8892A8', marginTop: 4 }}>{task.date}</div>
                    </div>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, color: '#00D68F' }}>
                      +{task.earned}π
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Wallet Tab */}
        {tab === 'wallet' && (
          <div>
            {/* Balance Card */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(0,149,255,0.12), rgba(56,178,255,0.08))',
                border: '1px solid rgba(0,149,255,0.3)',
                borderRadius: 16,
                padding: '24px',
                marginBottom: SPACING.lg,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 13, color: '#8892A8', textTransform: 'uppercase', marginBottom: 8 }}>
                Available Balance
              </div>
              <div
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: 48,
                  color: '#38B2FF',
                  lineHeight: 1,
                  marginBottom: 8,
                }}
              >
                {analytics?.summary?.totalEarned?.toFixed(2) ?? '0.00'}π
              </div>
              <div style={{ fontSize: 12, color: '#8892A8' }}>Total earned on ProofGrid</div>
            </div>

            {/* Stats Row */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
                marginBottom: SPACING.lg,
              }}
            >
              <div
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 12,
                  padding: '14px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 12, color: '#8892A8', marginBottom: 6, textTransform: 'uppercase' }}>
                  This Week
                </div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: '#00D68F' }}>
                  {analytics?.summary?.thisWeekEarned?.toFixed(1) ?? '0'}π
                </div>
              </div>
              <div
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 12,
                  padding: '14px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 12, color: '#8892A8', marginBottom: 6, textTransform: 'uppercase' }}>
                  Total Tasks
                </div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: '#38B2FF' }}>
                  {analytics?.summary?.totalCompleted ?? '0'}
                </div>
              </div>
            </div>

            {/* Transaction History */}
            <div>
              <div
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: 14,
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                  color: '#EEF2FF',
                  marginBottom: 12,
                }}
              >
                Transaction History
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {txHistory.length > 0 ? (
                  txHistory.map((tx) => (
                    <div
                      key={tx.id}
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: 10,
                        padding: '12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13, color: '#EEF2FF' }}>💸 {tx.taskTitle}</div>
                        <div style={{ fontSize: 11, color: '#8892A8', marginTop: 4 }}>
                          {new Date(tx.createdAt).toLocaleDateString()} • {tx.employer}
                        </div>
                      </div>
                      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, color: '#00D68F' }}>
                        +{(tx.amount / 1000).toFixed(2)}π
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#8892A8' }}>
                    No transactions yet. Complete your first task to earn π!
                  </div>
                )}
              </div>
            </div>

            {/* Sign Out Button */}
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                marginTop: SPACING.lg,
                padding: '12px 16px',
                background: 'rgba(255,107,107,0.12)',
                border: '1px solid rgba(255,107,107,0.3)',
                borderRadius: 8,
                color: '#FF6B6B',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Sign Out
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
