'use client'

import React, { useState, useMemo } from 'react'
import { usePiAuth } from '@/hooks/use-pi-auth'
import { useTaskSearch } from '@/hooks/use-task-search'
import { TaskCard } from '@/components/TaskCard'
import { Navigation } from '@/components/Navigation'

type FilterId = 'all' | 'featured' | 'high-pay' | 'expiring' | 'new'

const FeedPage: React.FC = () => {
  const { user, isLoading: authLoading } = usePiAuth()
  const { tasks } = useTaskSearch(user?.piUid)
  const [activeFilter, setActiveFilter] = useState<FilterId>('all')

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#060b17] px-6 text-center text-white">
        <p className="text-sm text-slate-300">Sign in to see earning opportunities</p>
        <button
          onClick={() => typeof window !== 'undefined' && window.location.reload()}
          disabled={authLoading}
          className="rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_12px_35px_-12px_rgba(14,165,233,0.6)] disabled:opacity-70"
        >
          {authLoading ? 'Connecting...' : 'Connect with Pi'}
        </button>
      </div>
    )
  }

  // Smart sort based on active filter
  const sortedTasks: any[] = useMemo(() => {
    if (!tasks) return []
    const tasksCopy = [...(tasks as any[])]

    switch (activeFilter) {
      case 'featured':
        return tasksCopy.filter((t: any) => t.isFeatured)
      case 'high-pay':
        return tasksCopy.sort((a: any, b: any) => b.piReward - a.piReward)
      case 'expiring':
        return tasksCopy
          .filter((t: any) => {
            const deadline = new Date(t.deadline)
            return deadline > new Date()
          })
          .sort((a: any, b: any) => {
            const deadlineA = new Date(a.deadline).getTime()
            const deadlineB = new Date(b.deadline).getTime()
            return deadlineA - deadlineB
          })
      case 'new':
        return tasksCopy.sort((a: any, b: any) => {
          const dateA = new Date(a.createdAt || a.deadline).getTime()
          const dateB = new Date(b.createdAt || b.deadline).getTime()
          return dateB - dateA
        })
      default:
        return tasksCopy
    }
  }, [tasks, activeFilter])

  const filterChips: { id: string; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'featured', label: '⚡ Featured' },
    { id: 'high-pay', label: '💰 High Pay' },
    { id: 'expiring', label: '⏰ Expiring' },
    { id: 'new', label: '✨ New' },
  ]

  const featuredTask = (tasks?.find((t: any) => t.isFeatured) || tasks?.[0]) as any

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#060b17] px-4 pb-28 pt-5 text-white md:px-8">
      <div className="pointer-events-none absolute inset-0 hex-mesh opacity-40" />
      <div className="pointer-events-none absolute -left-20 top-20 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-1/2 h-80 w-80 rounded-full bg-blue-500/15 blur-3xl" />
      <Navigation currentPage="feed" />

      <main className="relative z-10 mx-auto mt-6 w-full max-w-5xl space-y-5">
        <section className="rounded-2xl border border-white/15 bg-white/5 p-5 backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs text-slate-300">Discover opportunities</p>
              <h1 className="mt-1 text-2xl font-semibold">Task Feed</h1>
            </div>
            <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">
              {sortedTasks.length} tasks available
            </span>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="hide-scrollbar flex gap-2 overflow-x-auto">
            {filterChips.map((filter: any) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`motion-chip motion-press shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                activeFilter === filter.id
                  ? 'border-cyan-300/60 bg-cyan-300/15 text-cyan-100'
                  : 'border-white/20 bg-slate-950/40 text-slate-300 hover:bg-white/10'
              }`}
            >
              {filter.label}
            </button>
            ))}
          </div>
        </section>

        {featuredTask && (
          <section className="rounded-2xl border border-cyan-300/20 bg-gradient-to-br from-cyan-400/10 via-indigo-400/10 to-slate-950/40 p-5">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="text-3xl font-semibold text-cyan-200">
                {featuredTask.piReward}π
              </div>
              {featuredTask.isFeatured && (
                <div className="rounded-md border border-amber-300/30 bg-amber-300/10 px-2 py-1 text-[10px] font-semibold uppercase text-amber-100">
                  ⭐ Featured
                </div>
              )}
            </div>
            <div className="mb-3 flex flex-wrap gap-2">
              <span className="rounded-md border border-emerald-300/30 bg-emerald-300/10 px-2 py-1 text-xs text-emerald-100">
                {featuredTask.category}
              </span>
              <span className="rounded-md border border-cyan-300/30 bg-cyan-300/10 px-2 py-1 text-xs text-cyan-100">
                {featuredTask.employer?.piUsername || 'Employer'}
              </span>
            </div>
            <h2 className="mb-2 text-lg font-semibold text-white">
              {featuredTask.title}
            </h2>
            <div className="flex flex-wrap gap-2 text-xs text-slate-300">
              <span>{featuredTask.slotsRemaining} slots</span>
              <span>·</span>
              <span>{featuredTask.timeEstimateMin} min</span>
              <span>·</span>
              <span>Due soon</span>
            </div>
          </section>
        )}

        {sortedTasks.length > 0 ? (
          <section className="space-y-3">
            {sortedTasks.map((task: any) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </section>
        ) : (
          <p className="rounded-xl border border-dashed border-white/20 bg-white/5 p-6 text-center text-sm text-slate-300">
            No tasks match your filter. Check back soon!
          </p>
        )}
      </main>
    </div>
  )
}

export default FeedPage
