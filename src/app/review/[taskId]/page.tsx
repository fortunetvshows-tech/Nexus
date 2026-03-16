'use client'

import { useEffect, useState, useRef, use } from 'react'
import Link from 'next/link'
import { usePiAuth }  from '@/hooks/use-pi-auth'
import { Navigation } from '@/components/Navigation'

interface Submission {
  id:              string
  status:          string
  proofContent:    string
  proofFileUrl?:   string
  submissionType:  string
  agreedReward:    number
  qualityRating?:  number
  rejectionReason?: string
  autoApproveAt:   string
  submittedAt:     string
  reviewedAt?:     string
  worker: {
    id:              string
    piUsername:      string
    reputationScore: number
    reputationLevel: string
    kycLevel:        number
  }
}

export default function ReviewPage({
  params,
}: {
  params: Promise<{ taskId: string }>
}) {
  const resolvedParams  = use(params)
  const taskId          = resolvedParams?.taskId
  const { user, authenticate, isSdkReady } = usePiAuth()
  const hasAutoAuthenticated = useRef(false)

  useEffect(() => {
    if (isSdkReady && !user && !hasAutoAuthenticated.current) {
      hasAutoAuthenticated.current = true
      authenticate()
    }
  }, [isSdkReady, user, authenticate])

  const [submissions,  setSubmissions]  = useState<Submission[]>([])
  const [isLoading,    setIsLoading]    = useState(true)
  const [taskTitle,    setTaskTitle]    = useState('')
  const [processing,   setProcessing]   = useState<string | null>(null)
  const [rating,       setRating]       = useState<Record<string, number>>({})
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({})
  const [feedback,     setFeedback]     = useState<Record<string, {
    type: 'success' | 'error'
    message: string
  }>>({})

  useEffect(() => {
    if (!taskId) return
    if (!user?.piUid) return

    Promise.all([
      fetch(`/api/tasks/${taskId}`, {
        headers: { 'x-pi-uid': user.piUid },
      }).then(r => r.json()),
      fetch(`/api/tasks/${taskId}/submissions`, {
        headers: { 'x-pi-uid': user.piUid },
      }).then(r => r.json()),
    ]).then(([taskData, subData]) => {
      if (taskData.task) setTaskTitle(taskData.task.title)
      if (subData.submissions) setSubmissions(subData.submissions)
      setIsLoading(false)
    }).catch(() => setIsLoading(false))
  }, [taskId, user?.piUid])

  const handleApprove = async (submissionId: string) => {
    if (!user?.piUid) return
    setProcessing(submissionId)

    try {
      const res = await fetch('/api/submissions/approve', {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-pi-uid':     user.piUid,
        },
        body: JSON.stringify({
          submissionId,
          qualityRating: rating[submissionId] ?? 5,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? data.error ?? 'Approval failed')

      setSubmissions(prev =>
        prev.map(s =>
          s.id === submissionId ? { ...s, status: 'APPROVED' } : s
        )
      )
      setFeedback(prev => ({
        ...prev,
        [submissionId]: {
          type:    'success',
          message: `Approved — ${data.workerPayout?.toFixed(4) ?? ''}π released to worker`,
        },
      }))

    } catch (err) {
      setFeedback(prev => ({
        ...prev,
        [submissionId]: {
          type:    'error',
          message: err instanceof Error ? err.message : 'Failed',
        },
      }))
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (submissionId: string) => {
    if (!user?.piUid) return
    const reason = rejectReason[submissionId]
    if (!reason || reason.trim().length < 10) {
      setFeedback(prev => ({
        ...prev,
        [submissionId]: {
          type:    'error',
          message: 'Rejection reason must be at least 10 characters',
        },
      }))
      return
    }

    setProcessing(submissionId)

    try {
      const res = await fetch('/api/submissions', {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-pi-uid':     user.piUid,
        },
        body: JSON.stringify({
          submissionId,
          rejectionReason: reason,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? data.error ?? 'Rejection failed')

      setSubmissions(prev =>
        prev.map(s =>
          s.id === submissionId ? { ...s, status: 'REJECTED' } : s
        )
      )
      setFeedback(prev => ({
        ...prev,
        [submissionId]: {
          type:    'success',
          message: 'Submission rejected. Slot returned to pool.',
        },
      }))

    } catch (err) {
      setFeedback(prev => ({
        ...prev,
        [submissionId]: {
          type:    'error',
          message: err instanceof Error ? err.message : 'Failed',
        },
      }))
    } finally {
      setProcessing(null)
    }
  }

  if (!user) {
    return (
      <div style={{
        minHeight: '100vh', background: '#0f0f0f',
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', color: '#9ca3af',
        fontFamily: 'system-ui, sans-serif',
      }}>
        Connecting to Pi Network...
      </div>
    )
  }

  return (
    <div style={{
      minHeight:  '100vh',
      background: '#0f0f0f',
      fontFamily: 'system-ui, sans-serif',
      color:      '#ffffff',
    }}>
      <Navigation currentPage="employer" />

      <main style={{
        maxWidth: '680px',
        margin:   '0 auto',
        padding:  '80px 1rem 4rem',
      }}>

        <Link href="/employer" style={{
          color: '#6b7280', fontSize: '0.875rem',
          textDecoration: 'none', display: 'inline-block',
          marginBottom: '1.5rem',
        }}>
          ← Back
        </Link>

        <h1 style={{
          margin: '0 0 0.5rem', fontSize: '1.4rem', fontWeight: '700',
        }}>
          Review Submissions
        </h1>
        <p style={{ margin: '0 0 2rem', color: '#6b7280', fontSize: '0.875rem' }}>
          {taskTitle}
        </p>

        {isLoading && (
          <div style={{
            background: '#111827', borderRadius: '12px',
            height: '200px', border: '1px solid #1f2937',
          }} />
        )}

        {!isLoading && submissions.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '4rem 2rem',
            background: '#111827', borderRadius: '16px',
            border: '1px solid #1f2937',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
            <h3 style={{ margin: '0 0 0.5rem' }}>No submissions yet</h3>
            <p style={{ color: '#6b7280', margin: '0', fontSize: '0.875rem' }}>
              Workers are working on your task. Check back soon.
            </p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {submissions.map(sub => (
            <div key={sub.id} style={{
              background: '#111827',
              border: `1px solid ${
                sub.status === 'APPROVED' ? '#16a34a'
                : sub.status === 'REJECTED' ? '#dc2626'
                : '#1f2937'
              }`,
              borderRadius: '16px',
              padding: '1.25rem',
            }}>

              {/* Worker info */}
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: '1rem',
              }}>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>
                    {sub.worker?.piUsername}
                  </div>
                  <div style={{
                    fontSize: '0.78rem', color: '#6b7280', marginTop: '0.2rem',
                  }}>
                    Rep {sub.worker?.reputationScore}
                    {' · '}{sub.worker?.reputationLevel}
                    {' · '}KYC {sub.worker?.kycLevel}
                  </div>
                </div>
                <div style={{
                  padding: '0.3rem 0.75rem', borderRadius: '9999px',
                  fontSize: '0.75rem', fontWeight: '500',
                  background: sub.status === 'APPROVED' ? '#14532d'
                    : sub.status === 'REJECTED' ? '#450a0a'
                    : '#1f2937',
                  color: sub.status === 'APPROVED' ? '#86efac'
                    : sub.status === 'REJECTED' ? '#fca5a5'
                    : '#9ca3af',
                }}>
                  {sub.status}
                </div>
              </div>

              {/* Proof */}
              <div style={{
                background: '#0f172a', borderRadius: '8px',
                padding: '1rem', marginBottom: '1rem',
                fontSize: '0.875rem', color: '#d1d5db',
                lineHeight: '1.6', whiteSpace: 'pre-wrap',
                maxHeight: '200px', overflowY: 'auto',
              }}>
                {sub.proofContent || 'No text content'}
              </div>

              {/* Reward */}
              <div style={{
                fontSize: '0.8rem', color: '#6b7280', marginBottom: '1rem',
              }}>
                Reward:{' '}
                <span style={{ color: '#a78bfa', fontWeight: '600' }}>
                  {sub.agreedReward}π
                </span>
                {' '}({(sub.agreedReward * 0.95).toFixed(4)}π after 5% fee)
              </div>

              {/* Feedback */}
              {feedback[sub.id] && (
                <div style={{
                  padding: '0.75rem', borderRadius: '8px',
                  fontSize: '0.85rem', marginBottom: '1rem',
                  background: feedback[sub.id].type === 'success'
                    ? '#14532d' : '#450a0a',
                  color: feedback[sub.id].type === 'success'
                    ? '#86efac' : '#fca5a5',
                }}>
                  {feedback[sub.id].message}
                </div>
              )}

              {/* Review controls */}
              {sub.status === 'SUBMITTED' && (
                <>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{
                      fontSize: '0.75rem', color: '#6b7280',
                      marginBottom: '0.4rem',
                    }}>
                      Quality rating
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          onClick={() =>
                            setRating(prev => ({ ...prev, [sub.id]: star }))
                          }
                          style={{
                            width: '36px', height: '36px',
                            borderRadius: '8px',
                            border: '1px solid #374151',
                            background: (rating[sub.id] ?? 5) >= star
                              ? '#7B3FE4' : '#1f2937',
                            color: 'white', cursor: 'pointer',
                            fontSize: '0.85rem',
                          }}
                        >
                          {star}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleApprove(sub.id)}
                    disabled={processing === sub.id}
                    style={{
                      width: '100%', padding: '0.875rem',
                      background: processing === sub.id
                        ? '#374151'
                        : 'linear-gradient(135deg, #7B3FE4, #A855F7)',
                      color: 'white', border: 'none',
                      borderRadius: '10px', fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: processing === sub.id ? 'not-allowed' : 'pointer',
                      marginBottom: '0.75rem',
                    }}
                  >
                    {processing === sub.id
                      ? 'Processing...'
                      : `Approve — release ${sub.agreedReward}π`}
                  </button>

                  <input
                    type="text"
                    placeholder="Rejection reason (min 10 characters)"
                    value={rejectReason[sub.id] ?? ''}
                    onChange={e =>
                      setRejectReason(prev => ({
                        ...prev, [sub.id]: e.target.value,
                      }))
                    }
                    style={{
                      width: '100%', padding: '0.75rem',
                      background: '#1f2937', border: '1px solid #374151',
                      borderRadius: '8px', color: '#ffffff',
                      fontSize: '0.875rem', outline: 'none',
                      boxSizing: 'border-box', marginBottom: '0.5rem',
                    }}
                  />
                  <button
                    onClick={() => handleReject(sub.id)}
                    disabled={processing === sub.id}
                    style={{
                      width: '100%', padding: '0.75rem',
                      background: 'transparent',
                      border: '1px solid #dc2626',
                      borderRadius: '8px', color: '#fca5a5',
                      fontSize: '0.875rem',
                      cursor: processing === sub.id ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {processing === sub.id ? 'Processing...' : 'Reject'}
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
