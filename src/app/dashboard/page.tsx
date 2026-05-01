'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { usePiAuth }   from '@/hooks/use-pi-auth'
import { PageTopbar } from '@/components/PageTopbar'
import { useNotifications } from '@/hooks/use-notifications'
import { statusStyle } from '@/lib/design/tokens'

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
  const router = useRouter()
  const {
    user,
    isAuthenticated,
    isSdkReady,
    authenticate,
  } = usePiAuth()

  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [workerAnalytics, setWorkerAnalytics] = useState<{
    summary: {
      totalEarned:    number
      thisWeekEarned: number
      totalPending:   number
      totalSpent:     number
    }
  } | null>(null)
  const { unreadCount: notifCount } = useNotifications(user?.piUid)

  const fetchSubmissions = useCallback(() => {
    if (!user?.piUid) return
    fetch(`${window.location.origin}/api/worker/submissions`, {
      headers: { 'x-pi-uid': user.piUid },
    })
      .then(r => r.json())
      .then(d => {
        if (d.submissions) setSubmissions(d.submissions)
      })
      .catch(() => {})
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

  const totalEarned    = workerAnalytics?.summary?.totalEarned    ?? 0
  const thisWeekEarned = workerAnalytics?.summary?.thisWeekEarned ?? 0
  const completedTasks = submissions.filter(s => s.status === 'APPROVED').length
  const pendingReview = submissions.filter(s => s.status === 'SUBMITTED').length
  const currentRep = user?.reputationScore ?? 0
  const levelProgress = Math.max(0, Math.min(100, currentRep % 100))
  const recentSubmissions = submissions.slice(0, 4)

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#060b17] px-6 text-center text-white">
        <p className="text-sm text-slate-300">Connecting to Pi Network...</p>
        {isSdkReady && (
          <button
            onClick={authenticate}
            className="rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_12px_35px_-12px_rgba(14,165,233,0.6)]"
          >
            Connect with Pi
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="w-full text-white">
      <PageTopbar
        title="ProofGrid"
        actions={
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 10px',
              background: 'rgba(0,214,143,0.12)',
              border: '1px solid rgba(0,214,143,0.25)',
              borderRadius: '100px',
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '12px',
              fontWeight: '700',
              color: '#00D68F',
            }}>
              π {totalEarned.toFixed(2)}
            </div>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                position: 'relative',
                fontSize: '16px',
              }}
              onClick={() => router.push('/notifications')}
            >
              🔔
              {notifCount > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  width: '8px',
                  height: '8px',
                  background: '#0095FF',
                  borderRadius: '50%',
                  border: '1.5px solid #07090E',
                }} />
              )}
            </div>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #0095FF, #A78BFA)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '12px',
                fontWeight: '700',
                color: 'white',
                cursor: 'pointer',
                boxShadow: '0 0 12px rgba(0,149,255,0.25)',
              }}
              onClick={() => router.push('/profile')}
            >
              {user?.piUsername?.slice(0, 2).toUpperCase() ?? 'PG'}
            </div>
          </div>
        }
      />

      <main className="w-full space-y-4 pt-2">
        <section className="motion-surface rounded-2xl border border-white/15 bg-white/5 p-5 backdrop-blur-xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs text-slate-300">Welcome back</p>
              <h1 className="mt-1 text-2xl font-semibold">{user?.piUsername || 'Pioneer'}</h1>
              <p className="mt-2 text-sm text-slate-300">
                Reputation level: <span className="font-medium text-cyan-200">{user?.reputationLevel}</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
                Online
              </span>
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-indigo-500 text-sm font-bold text-slate-950">
                {user?.piUsername?.charAt(0).toUpperCase() || 'P'}
              </div>
            </div>
          </div>
        </section>

        <section className="motion-surface rounded-2xl border border-cyan-300/20 bg-gradient-to-br from-cyan-400/10 to-indigo-400/10 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200">Reputation Progress</h2>
            <span className="text-xs text-slate-300">{currentRep} REP</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-gradient-to-r from-cyan-300 to-blue-500"
              style={{ width: `${levelProgress}%` }}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-md border border-emerald-300/30 bg-emerald-300/10 px-2 py-1 text-emerald-100">KYC L{user?.kycLevel ?? 0}</span>
            <span className="rounded-md border border-cyan-300/30 bg-cyan-300/10 px-2 py-1 text-cyan-100">{completedTasks} completed</span>
            <span className="rounded-md border border-amber-300/30 bg-amber-300/10 px-2 py-1 text-amber-100">{pendingReview} pending review</span>
          </div>
        </section>

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Earnings', value: `${totalEarned.toFixed(2)}π`, tone: 'text-emerald-200' },
            { label: 'This Week', value: `${thisWeekEarned.toFixed(2)}π`, tone: 'text-cyan-200' },
            { label: 'Tasks Done', value: String(completedTasks), tone: 'text-sky-200' },
            { label: 'Pending', value: String(pendingReview), tone: 'text-amber-200' },
          ].map((stat) => (
            <article key={stat.label} className="motion-surface rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-slate-300">{stat.label}</p>
              <p className={`mt-2 text-xl font-semibold ${stat.tone}`}>{stat.value}</p>
            </article>
          ))}
        </section>

        <section className="motion-surface rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200">Recent Submissions</h2>
            <Link href="/feed" className="text-xs font-medium text-cyan-200 hover:text-cyan-100">
              Browse tasks
            </Link>
          </div>

          {recentSubmissions.length > 0 ? (
            <div className="space-y-3">
              {recentSubmissions.map((sub) => (
                <article key={sub.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/40 p-3">
                  <div>
                    <p className="text-sm font-medium text-white">{sub.task.title}</p>
                    <p className="text-xs text-slate-300">{sub.task.category}</p>
                  </div>
                  <div
                    className="rounded-md px-2 py-1 text-[10px] font-semibold uppercase"
                    style={{
                      background: statusStyle(sub.status).background,
                      border: statusStyle(sub.status).border,
                      color: statusStyle(sub.status).color,
                    }}
                  >
                    {sub.status}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-white/15 bg-white/5 p-6 text-center text-sm text-slate-300">
              No active tasks. Start earning by finding work in the feed.
            </p>
          )}
        </section>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link href="/feed" className="motion-chip motion-press flex items-center justify-center rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-4 py-3 text-sm font-semibold text-cyan-100 hover:bg-cyan-300/15">
            Find Work
          </Link>
          <Link href="/analytics" className="motion-chip motion-press flex items-center justify-center rounded-xl border border-indigo-300/30 bg-indigo-300/10 px-4 py-3 text-sm font-semibold text-indigo-100 hover:bg-indigo-300/15">
            Open Analytics
          </Link>
        </section>
      </main>
    </div>
  )
}
