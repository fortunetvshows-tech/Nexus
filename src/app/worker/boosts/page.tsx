'use client'

import { useEffect, useState } from 'react'
import { usePiAuth } from '@/hooks/use-pi-auth'
import { Navigation } from '@/components/Navigation'
import { BoostCard } from '@/components/BoostCard'
import { COLORS, SPACING, RADII } from '@/lib/design/tokens'

interface Submission {
  id: string
  taskId: string
  taskTitle: string
  status: string
  submittedAt: string
  qualityRating?: number
}

export default function WorkerBoostsPage() {
  const { user } = usePiAuth()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [pulseBalance, setPulseBalance] = useState(0)
  const [boostOptions, setBoostOptions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.piUid) return

    const fetchData = async () => {
      try {
        // Fetch user's submissions
        const submissionsRes = await fetch(`${window.location.origin}/api/submissions?workerId=${user.piUid}`, {
          headers: { 'x-pi-uid': user.piUid },
        })
        const submissionsData = await submissionsRes.json()
        setSubmissions(submissionsData.submissions || [])

        // Fetch boost options
        const boostRes = await fetch(`${window.location.origin}/api/submissions/boost`, {
          headers: { 'x-pi-uid': user.piUid },
        })
        const boostData = await boostRes.json()
        setPulseBalance(boostData.pulseBalance || 0)
        setBoostOptions(boostData.boostOptions || [])

        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
        setLoading(false)
      }
    }

    fetchData()
  }, [user?.piUid])

  const handleWorkerBoost = async (type: string, amount: number) => {
    if (!user?.piUid || !selectedSubmission) return

    try {
      const res = await fetch(`${window.location.origin}/api/submissions/boost`, {
        method: 'POST',
        headers: {
          'x-pi-uid': user.piUid,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submissionId: selectedSubmission,
          pulsePaid: amount,
          boostType: type,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to apply boost')

      // Refresh pulse balance
      const boostRes = await fetch(`${window.location.origin}/api/submissions/boost`, {
        headers: { 'x-pi-uid': user.piUid },
      })
      const boostData = await boostRes.json()
      setPulseBalance(boostData.pulseBalance || 0)

      setSelectedSubmission(null)
    } catch (err) {
      throw err
    }
  }

  if (!user) {
    return (
      <>
        <Navigation currentPage="dashboard" />
        <main style={{ paddingTop: '80px' }}>
          <div style={{ padding: SPACING.lg, textAlign: 'center', color: COLORS.textMuted }}>
            Please log in to boost submissions
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Navigation currentPage="dashboard" />
      <main style={{ paddingTop: '80px', padding: SPACING.lg, maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.lg }}>
          ⚚ Boost Your Submissions
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
          <div style={{ color: COLORS.textMuted }}>Loading submissions...</div>
        ) : submissions.length === 0 ? (
          <div
            style={{
              backgroundColor: COLORS.bgSurface,
              padding: SPACING.lg,
              borderRadius: RADII.lg,
              textAlign: 'center',
              color: COLORS.textMuted,
            }}
          >
            You don't have any submissions yet
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: SPACING.lg }}>
            {/* Submissions List */}
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: '600', color: COLORS.textPrimary, marginBottom: SPACING.md }}>
                Your Submissions ({submissions.length})
              </h2>
              <div style={{ display: 'grid', gap: SPACING.sm }}>
                {submissions.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => setSelectedSubmission(sub.id)}
                    style={{
                      padding: SPACING.md,
                      borderRadius: RADII.md,
                      border: `2px solid ${selectedSubmission === sub.id ? COLORS.indigo : COLORS.border}`,
                      backgroundColor: selectedSubmission === sub.id ? COLORS.bgElevated : 'transparent',
                      color: COLORS.textPrimary,
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{sub.taskTitle}</div>
                    <div style={{ fontSize: '0.75rem', color: COLORS.textMuted, marginTop: SPACING.xs }}>
                      {sub.status}
                      {sub.qualityRating && ` • ⭐ ${sub.qualityRating}/5`}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Boost Card */}
            {selectedSubmission && (
              <BoostCard
                title="Boost This Submission"
                currentBalance={pulseBalance}
                boostOptions={boostOptions}
                onBoost={(type, amount) => handleWorkerBoost(type, amount)}
                isLoading={loading}
              />
            )}
          </div>
        )}
      </main>
    </>
  )
}

