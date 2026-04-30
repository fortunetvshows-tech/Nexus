'use client'

import Link from 'next/link'
import { PLATFORM_CONFIG } from '@/lib/config/platform'

interface TaskCardProps {
  task: {
    id:              string
    title:           string
    description:     string
    category:        string
    piReward:        number
    slotsRemaining:  number
    slotsAvailable:  number
    timeEstimateMin: number
    deadline:        string
    minReputationReq: number
    minBadgeLevel:   string
    isFeatured:      boolean
    tags:            string[]
    employer: {
      piUsername:      string
      reputationScore: number
      reputationLevel: string
    }
  }
  workerReputation?: number
}

// Map category to color for visual variety
const CATEGORY_COLORS: Record<string, string> = {
  '🤖 AI & Data Labeling':  '#0095FF',
  '📍 Local Verification':  '#00D68F',
  '🌐 Translation':         '#FFB020',
  '📱 App Testing':         '#FF6B35',
  '✍️ Community & Content': '#A78BFA',
}

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? '#0095FF'
}

export function TaskCard({
  task,
}: TaskCardProps) {

  const color         = getCategoryColor(task.category)
  const spotsLeft     = task.slotsRemaining
  const isUrgent      = spotsLeft <= 2
  const deadlineDate  = new Date(task.deadline)
  const hoursLeft     = Math.max(
    0,
    Math.round((deadlineDate.getTime() - Date.now()) / 3600000)
  )
  const isExpiringSoon = hoursLeft < 24

  return (
    <Link href={`/task/${task.id}`} className="block no-underline">
      <article className="motion-surface group relative mb-3 overflow-hidden rounded-2xl border border-white/15 bg-white/5 p-4 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.7)] backdrop-blur-xl hover:border-cyan-300/40 hover:bg-white/10">
        <div className="absolute inset-y-0 left-0 w-1 rounded-l-2xl" style={{ background: color }} />

        <div className="ml-1">
          <div className="mb-3 flex items-start gap-3">
            <span className="shrink-0 text-2xl">
              {task.category.charAt(0)}
            </span>
            <div className="flex-1">
              <h3 className="mb-1 text-sm font-semibold text-white">
                {task.title}
              </h3>
              <p className="text-2xl font-semibold text-cyan-200">
                {Math.max(0, PLATFORM_CONFIG.workerNetPayout(task.piReward)).toFixed(2)}π
              </p>
            </div>
          </div>

          <div className="mb-3 flex flex-wrap gap-2">
            <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-100">
              {task.category}
            </span>
            <span className="rounded-full border border-white/20 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-slate-300">
              ~{task.timeEstimateMin}m
            </span>
            <span className="rounded-full border border-white/20 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-slate-300">
              {spotsLeft === 0 ? 'Full' : `${spotsLeft} slots`}
            </span>
            {isExpiringSoon && (
              <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-2.5 py-1 text-[11px] font-semibold text-amber-100">
                Expiring soon
              </span>
            )}
            {task.isFeatured && (
              <span className="rounded-full border border-violet-300/30 bg-violet-300/10 px-2.5 py-1 text-[11px] font-semibold text-violet-100">
                Featured
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-slate-300">
              {spotsLeft > 2
                ? `${task.slotsAvailable - spotsLeft} taken`
                : spotsLeft === 0
                ? '✗ Full'
                : `${spotsLeft} spot${spotsLeft > 1 ? 's' : ''} left`
              }
            </p>
            <div
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                spotsLeft === 0
                  ? 'border border-white/20 bg-white/10 text-slate-400'
                  : isUrgent
                  ? 'border border-rose-300/40 bg-rose-300/15 text-rose-100'
                  : 'border border-cyan-300/40 bg-cyan-300/15 text-cyan-100'
              } motion-chip`}
            >
              {spotsLeft === 0 ? 'Full' : 'Claim →'}
            </div>
          </div>
        </div>
      </article>
    </Link>
  )
}


