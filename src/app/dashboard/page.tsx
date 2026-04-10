'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { usePiAuth }   from '@/hooks/use-pi-auth'
import { Navigation }  from '@/components/Navigation'
import { COLORS, FONTS, SPACING, RADII, SHADOWS, GRADIENTS, statusStyle } from '@/lib/design/tokens'

// ━━━ Data Adapter Functions ━━━
function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function getRepLevel(score: number): { level: number; title: string; nextThreshold: number } {
  if (score < 200) return { level: 1, title: 'Newcomer', nextThreshold: 200 }
  if (score < 400) return { level: 2, title: 'Contributor', nextThreshold: 400 }
  if (score < 600) return { level: 3, title: 'Skilled', nextThreshold: 600 }
  if (score < 800) return { level: 4, title: 'Expert', nextThreshold: 800 }
  if (score < 1000) return { level: 5, title: 'Elite', nextThreshold: 1000 }
  return { level: 6, title: 'Sentinel', nextThreshold: 1000 }
}

function repToDashoffset(score: number): number {
  return 276 * (1 - Math.min(score, 1000) / 1000)
}

function kycLabel(level: number): string {
  if (level === 0) return 'Unverified'
  if (level === 1) return 'KYC L1'
  return 'KYC L2 ✓'
}

function streakBonus(streak: number): string {
  if (streak >= 7) return '+20% bonus active'
  if (streak >= 3) return '+10% bonus active'
  return 'Keep going!'
}

function formatPi(amount: number): string {
  return amount.toFixed(2)
}

interface Submission {
  id:              string
  status:          string
  agreedReward:    number
  rejectionReason: string | null
  submittedAt:     string
  reviewedAt?:     string
  updatedAt?:      string
  task: {
    id:       string
    title:    string
    category: string
    piReward: number
  }
}

export default function DashboardPage() {
  const {
    user,
    isAuthenticated,
    isSdkReady,
    authenticate,
  } = usePiAuth()

  const [submissions,   setSubmissions]   = useState<Submission[]>([])
  const [subLoading,    setSubLoading]    = useState(false)
  const [workerAnalytics, setWorkerAnalytics] = useState<{
    summary: {
      totalEarned:    number
      thisWeekEarned: number
      totalPending:   number
      totalSpent:     number
    }
  } | null>(null)

  const [workerStats, setWorkerStats] = useState({
    reputationScore:   0,
    reputationLevel:   'Newcomer',
    kycLevel:          0,
    tasksCompleted:    0,
  })

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

  const fetchWorkerAnalytics = useCallback(() => {
    if (!user?.piUid) return
    fetch(`${window.location.origin}/api/analytics/worker`, {
      headers: { 'x-pi-uid': user.piUid },
    })
      .then(r => r.json())
      .then(d => {
        if (d.summary) setWorkerAnalytics({ summary: d.summary })
      })
      .catch(console.error)
  }, [user?.piUid])

  useEffect(() => {
    if (user?.piUid) {
      fetchSubmissions()
      fetchWorkerAnalytics()
    }
  }, [user?.piUid, fetchSubmissions, fetchWorkerAnalytics])

  useEffect(() => {
    if (user) {
      const tasksCompleted = submissions.filter(s => s.status === 'APPROVED').length
      setWorkerStats({
        reputationScore: user.reputationScore ?? 0,
        reputationLevel: user.reputationLevel ?? 'Newcomer',
        kycLevel:        user.kycLevel ?? 0,
        tasksCompleted,
      })
    }
  }, [user, submissions])

  const totalEarned    = workerAnalytics?.summary?.totalEarned    ?? 0
  const completedTasks = submissions.filter(s => s.status === 'APPROVED').length
  const pendingReview = submissions.filter(s => s.status === 'SUBMITTED').length
  const recentSubmissions = submissions.slice(0, 4)

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
              background:   `linear-gradient(135deg, #0095FF, #004FCC)`,
              color:        'white',
              border:       '1px solid rgba(0,149,255,0.3)',
              borderRadius: RADII.lg,
              fontSize:     '1rem',
              fontWeight:   '600',
              cursor:       'pointer',
              boxShadow:    '0 0 24px rgba(0,149,255,0.28)',
            }}
          >
            Connect with Pi
          </button>
        )}
      </div>
    )
  }

  return (
    <div style={{
      minHeight:  '100vh',
      background: '#07090E',
      fontFamily: FONTS.sans,
      color:      COLORS.textPrimary,
      padding: '20px 16px',
    }}>
      <Navigation currentPage="dashboard" />

      <main style={{
        maxWidth: '480px',
        margin: '0 auto',
        paddingBottom: SPACING.xxl,
      }}>
        {/* ── Header Section ─────────────────────────── */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: SPACING.xl,
          marginTop: SPACING.lg,
        }}>
          <div>
            <div style={{
              fontSize: 14,
              color: '#8892A8',
              marginBottom: 4,
            }}>
              Good morning
            </div>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 26,
              color: '#EEF2FF',
              letterSpacing: 1,
            }}>
              {user?.piUsername || 'Pioneer'}
            </div>
          </div>

          {/* Online status pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            background: 'rgba(0,214,143,0.1)',
            border: '1px solid rgba(0,214,143,0.3)',
            borderRadius: 999,
            fontSize: 12,
            color: '#00D68F',
          }}>
            <div style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#00D68F',
              animation: 'pulseDot 2s infinite',
            }} />
            Online
          </div>

          {/* Avatar circle */}
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #0095FF, #A78BFA)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 700,
            fontSize: 18,
            border: '2px solid rgba(0,149,255,0.3)',
          }}>
            {user?.piUsername?.charAt(0).toUpperCase() || 'P'}
          </div>
        </div>

        {/* ── Rep Ring Card ─────────────────────────── */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(0,149,255,0.07) 0%, #131720 60%)',
          border: '1px solid rgba(0,149,255,0.25)',
          borderRadius: 18,
          padding: '20px',
          marginBottom: SPACING.lg,
          display: 'flex',
          gap: 16,
        }}>
          {/* Left: Progress ring + rep score */}
          <div style={{
            flex: '0 0 80px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {/* SVG Ring */}
            <svg width="80" height="80" viewBox="0 0 80 80">
              {/* Background circle */}
              <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
              {/* Progress circle */}
              <circle
                cx="40" cy="40" r="36" fill="none"
                stroke="url(#repGradient)" strokeWidth="2"
                strokeDasharray={`${(workerStats.reputationScore / 100) * 226} 226`}
                strokeLinecap="round"
                style={{ transform: 'rotate(-90deg)', transformOrigin: '40px 40px' }}
              />
              <defs>
                <linearGradient id="repGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0095FF" />
                  <stop offset="100%" stopColor="#38B2FF" />
                </linearGradient>
              </defs>
              {/* Center text */}
              <text x="40" y="38" textAnchor="middle" style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 20,
                fill: '#EEF2FF',
                fontWeight: 700,
              }}>
                {workerStats.reputationScore}
              </text>
              <text x="40" y="52" textAnchor="middle" style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 10,
                fill: '#8892A8',
              }}>
                REP
              </text>
            </svg>
          </div>

          {/* Right: Level + chips + progress bar */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}>
            <div>
              <div style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 14,
                color: '#EEF2FF',
                letterSpacing: 1,
                marginBottom: 4,
              }}>
                Elite Worker · Level {Math.max(1, Math.floor(workerStats.reputationScore / 20))}
              </div>
              <div style={{
                fontSize: 12,
                color: '#8892A8',
              }}>
                {100 - (workerStats.reputationScore % 100)} pts to next level
              </div>
            </div>

            {/* Progress bar */}
            <div style={{
              height: 4,
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 2,
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${(workerStats.reputationScore % 100)}%`,
                background: 'linear-gradient(90deg, #0095FF, #38B2FF)',
              }} />
            </div>

            {/* Chips */}
            <div style={{
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
            }}>
              <div style={{
                padding: '4px 10px',
                background: 'rgba(0,214,143,0.1)',
                border: '1px solid rgba(0,214,143,0.3)',
                borderRadius: 6,
                fontSize: 11,
                color: '#00D68F',
                fontWeight: 600,
              }}>
                KYC L{workerStats.kycLevel}
              </div>
              <div style={{
                padding: '4px 10px',
                background: 'rgba(0,149,255,0.1)',
                border: '1px solid rgba(0,149,255,0.3)',
                borderRadius: 6,
                fontSize: 11,
                color: '#0095FF',
                fontWeight: 600,
              }}>
                Top 5%
              </div>
              <div style={{
                padding: '4px 10px',
                background: 'rgba(255,176,32,0.1)',
                border: '1px solid rgba(255,176,32,0.3)',
                borderRadius: 6,
                fontSize: 11,
                color: '#FFB020',
                fontWeight: 600,
              }}>
                {completedTasks}T
              </div>
            </div>
          </div>
        </div>

        {/* ── Streak Bar ─────────────────────────────– */}
        <div style={{
          background: 'linear-gradient(90deg, rgba(255,176,32,0.09) 0%, rgba(255,71,87,0.05) 100%)',
          border: '1px solid rgba(255,176,32,0.2)',
          borderRadius: 14,
          padding: '13px 16px',
          marginBottom: SPACING.lg,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <div style={{
            fontSize: 24,
            animation: 'flicker 1.8s infinite',
          }}>
            🔥
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 6,
          }}>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 26,
              color: '#FFB020',
              letterSpacing: 0.5,
            }}>
              {Math.max(0, Math.floor(completedTasks / 5))}
            </div>
            <div style={{
              fontSize: 12,
              color: '#FFB020',
            }}>
              day streak
            </div>
          </div>
        </div>

        {/* ── Stats 2x2 Grid ─────────────────────────– */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          marginBottom: SPACING.lg,
        }}>
          {[
            { label: 'EARNINGS', value: `${totalEarned.toFixed(1)}π`, color: '#00D68F' },
            { label: 'TASKS DONE', value: completedTasks.toString(), color: '#0095FF' },
            { label: 'PENDING', value: `${pendingReview}`, color: '#FFB020' },
            { label: 'ACTIVE', value: '3', color: '#0095FF' },
          ].map((stat) => (
            <div key={stat.label} style={{
              background: '#0F1119',
              border: '1px solid #1A1F2E',
              borderRadius: 12,
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}>
              <div style={{
                fontSize: 10,
                color: '#454F64',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                fontWeight: 600,
              }}>
                {stat.label}
              </div>
              <div style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 30,
                color: stat.color,
                lineHeight: 1,
                letterSpacing: 0.5,
              }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* ── Active Tasks Section ─────────────────── */}
        <div style={{
          marginBottom: SPACING.lg,
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: SPACING.md,
          }}>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 16,
              color: '#EEF2FF',
              letterSpacing: 1,
            }}>
              ACTIVE TASKS
            </div>
            <a href="/feed" style={{
              fontSize: 12,
              color: '#0095FF',
              textDecoration: 'none',
              fontWeight: 600,
            }}>
              See All →
            </a>
          </div>

          {recentSubmissions.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentSubmissions.map((sub) => (
                <div key={sub.id} style={{
                  background: '#0F1119',
                  border: '1px solid #1A1F2E',
                  borderRadius: 12,
                  padding: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <div>
                    <div style={{
                      fontSize: 13,
                      color: '#EEF2FF',
                      fontWeight: 600,
                      marginBottom: 4,
                    }}>
                      {sub.task.title}
                    </div>
                    <div style={{
                      fontSize: 11,
                      color: '#8892A8',
                    }}>
                      {sub.task.category}
                    </div>
                  </div>
                  <div style={{
                    padding: '4px 8px',
                    background: statusStyle(sub.status).background,
                    border: statusStyle(sub.status).border,
                    borderRadius: 6,
                    fontSize: 10,
                    color: statusStyle(sub.status).color,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                  }}>
                    {sub.status}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: SPACING.lg,
              color: '#8892A8',
              fontSize: 14,
            }}>
              No active tasks. Start earning by finding work in the feed.
            </div>
          )}
        </div>

        {/* ── Quick Actions ─────────────────────────– */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
        }}>
          <a href="/feed" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '16px',
            background: 'linear-gradient(135deg, rgba(0,149,255,0.2), rgba(0,149,255,0.05))',
            border: '1px solid rgba(0,149,255,0.3)',
            borderRadius: 12,
            color: '#0095FF',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: 14,
            transition: 'all 0.2s',
          }}>
            ⛏️ Find Work
          </a>
          <a href="/analytics" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '16px',
            background: 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(167,139,250,0.05))',
            border: '1px solid rgba(167,139,250,0.3)',
            borderRadius: 12,
            color: '#A78BFA',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: 14,
            transition: 'all 0.2s',
          }}>
            📊 Analytics
          </a>
        </div>
      </main>
    </div>
  )
}
