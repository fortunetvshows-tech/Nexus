'use client'

import { useEffect, useState } from 'react'
import { usePiAuth } from '@/hooks/use-pi-auth'
import { Navigation } from '@/components/Navigation'
import { BoostCard } from '@/components/BoostCard'
import { COLORS, SPACING, RADII, SHADOWS } from '@/lib/design/tokens'

interface Task {
  id: string
  title: string
  piReward: number
  slotsRemaining: number
  isFeatured: boolean
}

export default function TaskBoostsPage() {
  const { user } = usePiAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [pulseBalance, setPulseBalance] = useState(0)
  const [boostOptions, setBoostOptions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.piUid) return

    const fetchData = async () => {
      try {
        // Fetch user's tasks
        const tasksRes = await fetch(`${window.location.origin}/api/tasks?userId=${user.piUid}`, {
          headers: { 'x-pi-uid': user.piUid },
        })
        const tasksData = await tasksRes.json()
        setTasks(tasksData.tasks || [])

        // Fetch boost options and pulse balance
        const boostRes = await fetch(`${window.location.origin}/api/tasks/boost?taskId=${tasksData.tasks?.[0]?.id || ''}`, {
          headers: { 'x-pi-uid': user.piUid },
        })
        const boostData = await boostRes.json()
        setPulseBalance(boostData.pulseBalance || 0)
        setBoostOptions(boostData.boostTypes || [])

        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
        setLoading(false)
      }
    }

    fetchData()
  }, [user?.piUid])

  const handleTaskBoost = async (type: string, amount: number, days: number = 7) => {
    if (!user?.piUid || tasks.length === 0) return

    try {
      const res = await fetch(`${window.location.origin}/api/tasks/boost`, {
        method: 'POST',
        headers: {
          'x-pi-uid': user.piUid,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId: tasks[0].id,
          pulsePaid: amount,
          boostType: type,
          durationDays: days,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to boost task')

      // Refresh pulse balance
      const boostRes = await fetch(`${window.location.origin}/api/tasks/boost`, {
        headers: { 'x-pi-uid': user.piUid },
      })
      const boostData = await boostRes.json()
      setPulseBalance(boostData.pulseBalance || 0)
    } catch (err) {
      throw err
    }
  }

  if (!user) {
    return (
      <>
        <Navigation currentPage="employer-dashboard" />
        <main style={{ paddingTop: '80px' }}>
          <div style={{ padding: SPACING.lg, textAlign: 'center', color: COLORS.textMuted }}>
            Please log in to access boosts
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Navigation currentPage="employer-dashboard" />
      <main
        style={{
          paddingTop: '80px',
          padding: SPACING.lg,
          maxWidth: '800px',
          margin: '0 auto',
        }}
      >
        <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.lg }}>
          📈 Boost Your Tasks
        </h1>

        {error && (
          <div
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: COLORS.red,
              padding: SPACING.lg,
              borderRadius: RADII.lg,
              marginBottom: SPACING.lg,
            }}
          >
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ color: COLORS.textMuted }}>Loading...</div>
        ) : tasks.length === 0 ? (
          <div
            style={{
              backgroundColor: COLORS.bgSurface,
              padding: SPACING.lg,
              borderRadius: RADII.lg,
              textAlign: 'center',
              color: COLORS.textMuted,
            }}
          >
            You haven't posted any tasks yet
          </div>
        ) : (
          <>
            {/* Task List */}
            <div style={{ marginBottom: SPACING.xl }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: '600', color: COLORS.textPrimary, marginBottom: SPACING.md }}>
                Your Tasks
              </h2>
              <div style={{ display: 'grid', gap: SPACING.md }}>
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    style={{
                      backgroundColor: COLORS.bgSurface,
                      borderRadius: RADII.lg,
                      padding: SPACING.lg,
                      border: `1px solid ${COLORS.border}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: '600', color: COLORS.textPrimary }}>
                        {task.title}
                      </h3>
                      <div style={{ fontSize: '0.875rem', color: COLORS.textMuted, marginTop: SPACING.xs }}>
                        {task.slotsRemaining} slots remaining • {task.piReward}Π reward
                        {task.isFeatured && (
                          <span style={{ marginLeft: SPACING.md, color: COLORS.amber }}>⭐ Featured</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Boost Card */}
            {tasks.length > 0 && (
              <BoostCard
                title="Boost Your First Task"
                currentBalance={pulseBalance}
                boostOptions={boostOptions}
                onBoost={handleTaskBoost}
                isLoading={loading}
              />
            )}
          </>
        )}
      </main>
    </>
  )
}


