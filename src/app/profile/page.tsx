'use client'

import { useEffect, useState } from 'react'
import { usePiAuth } from '@/hooks/use-pi-auth'
import { Navigation } from '@/components/Navigation'

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
    <div className="relative min-h-screen overflow-hidden bg-[#060b17] px-4 pb-28 pt-5 text-white md:px-8">
      <div className="pointer-events-none absolute inset-0 hex-mesh opacity-40" />
      <div className="pointer-events-none absolute -left-20 top-24 h-80 w-80 rounded-full bg-cyan-400/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-1/2 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />

      <Navigation currentPage="profile" />

      <main className="relative z-10 mx-auto mt-6 w-full max-w-5xl space-y-5">
        <section className="motion-surface rounded-2xl border border-white/15 bg-white/5 p-6 text-center backdrop-blur-xl">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-indigo-500 text-xl font-bold text-slate-950">
            {user?.piUsername?.charAt(0).toUpperCase() || 'P'}
          </div>
          <h1 className="text-2xl font-semibold">{user?.piUsername || 'Pioneer'}</h1>
          <p className="mt-1 text-sm text-slate-300">@{user?.piUsername?.toLowerCase() || 'user'}</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs">
            <span className="rounded-md border border-cyan-300/30 bg-cyan-300/10 px-2 py-1 text-cyan-100">Worker</span>
            <span className="rounded-md border border-emerald-300/30 bg-emerald-300/10 px-2 py-1 text-emerald-100">KYC L{user?.kycLevel ?? 0}</span>
            <span className="rounded-md border border-rose-300/30 bg-rose-300/10 px-2 py-1 text-rose-100">{user?.reputationScore ?? 0} REP</span>
          </div>
        </section>

        <section className="motion-surface rounded-2xl border border-white/10 bg-white/5 p-2">
          <div className="grid grid-cols-2 gap-2">
          {['profile', 'wallet'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t as 'profile' | 'wallet')}
              className={`motion-chip motion-press rounded-lg px-3 py-2 text-sm font-semibold ${
                tab === t
                  ? 'border border-cyan-300/40 bg-cyan-300/15 text-cyan-100'
                  : 'border border-transparent bg-transparent text-slate-300 hover:bg-white/10'
              }`}
            >
              {t === 'profile' ? 'Profile' : 'Wallet'}
            </button>
          ))}
          </div>
        </section>

        {tab === 'profile' && (
          <section className="space-y-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { label: 'Tasks Done', value: analytics?.summary?.totalCompleted ?? 0 },
                { label: 'Pi Earned', value: analytics?.summary?.totalEarned?.toFixed(1) ?? 0 },
                { label: 'Approval', value: `${Math.round((analytics?.summary?.approvalRate ?? 0) * 100)}%` },
              ].map((stat) => (
                <article key={stat.label} className="motion-surface rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                  <p className="text-2xl font-semibold text-cyan-200">{stat.value}</p>
                  <p className="mt-1 text-xs text-slate-300">
                    {stat.label}
                  </p>
                </article>
              ))}
            </div>

            <article className="motion-surface rounded-2xl border border-cyan-300/20 bg-gradient-to-br from-cyan-400/10 to-indigo-400/10 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                Reputation Progress
              </p>
              <h2 className="mt-1 text-lg font-semibold">
                {user?.reputationLevel || 'Newcomer'} Worker
              </h2>
              <p className="mt-1 text-sm text-slate-300">Build a stronger profile to unlock better tasks and trust.</p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-gradient-to-r from-cyan-300 to-blue-500"
                  style={{ width: `${Math.max(10, Math.min(100, (user?.reputationScore ?? 0) % 100))}%` }}
                />
              </div>
            </article>

            <article>
              <h3 className="mb-3 text-sm font-semibold text-slate-200">Recent Work</h3>
              <div className="space-y-3">
                {[
                  { title: 'Logo Design Feedback', earned: 3.5, date: '2 days ago' },
                  { title: 'Market Research Analysis', earned: 8.2, date: '1 week ago' },
                  { title: 'Content Writing - Blog Post', earned: 5.0, date: '2 weeks ago' },
                ].map((task, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/40 p-3">
                    <div>
                      <p className="text-sm text-white">{task.title}</p>
                      <p className="mt-1 text-xs text-slate-300">{task.date}</p>
                    </div>
                    <div className="text-sm font-semibold text-emerald-200">
                      +{task.earned}π
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </section>
        )}

        {tab === 'wallet' && (
          <section className="space-y-5">
            <article className="motion-surface rounded-2xl border border-cyan-300/20 bg-gradient-to-br from-cyan-400/10 to-blue-500/10 p-6 text-center">
              <p className="text-xs uppercase tracking-wide text-slate-300">
                Available Balance
              </p>
              <p className="mt-2 text-4xl font-semibold text-cyan-200">
                {analytics?.summary?.totalEarned?.toFixed(2) ?? '0.00'}π
              </p>
              <p className="mt-1 text-xs text-slate-300">Total earned on ProofGrid</p>
            </article>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <article className="motion-surface rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                <p className="text-xs uppercase text-slate-300">
                  This Week
                </p>
                <p className="mt-2 text-2xl font-semibold text-emerald-200">
                  {analytics?.summary?.thisWeekEarned?.toFixed(1) ?? '0'}π
                </p>
              </article>
              <article className="motion-surface rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                <p className="text-xs uppercase text-slate-300">
                  Total Tasks
                </p>
                <p className="mt-2 text-2xl font-semibold text-cyan-200">
                  {analytics?.summary?.totalCompleted ?? '0'}
                </p>
              </article>
            </div>

            <article>
              <h3 className="mb-3 text-sm font-semibold text-slate-200">
                Transaction History
              </h3>
              <div className="space-y-3">
                {txHistory.length > 0 ? (
                  txHistory.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/40 p-3">
                      <div>
                        <p className="text-sm text-white">💸 {tx.taskTitle}</p>
                        <p className="mt-1 text-xs text-slate-300">
                          {new Date(tx.createdAt).toLocaleDateString()} • {tx.employer}
                        </p>
                      </div>
                      <div className="text-sm font-semibold text-emerald-200">
                        +{(tx.amount / 1000).toFixed(2)}π
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="rounded-xl border border-dashed border-white/20 bg-white/5 p-5 text-center text-sm text-slate-300">
                    No transactions yet. Complete your first task to earn π!
                  </p>
                )}
              </div>
            </article>

            <button
              onClick={handleLogout}
              className="motion-chip motion-press w-full rounded-xl border border-rose-300/40 bg-rose-300/10 px-4 py-3 text-sm font-semibold text-rose-200 hover:bg-rose-300/15"
            >
              Sign Out
            </button>
          </section>
        )}
      </main>
    </div>
  )
}
