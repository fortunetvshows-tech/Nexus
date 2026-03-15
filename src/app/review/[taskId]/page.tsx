'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { usePiAuth } from '@/hooks/use-pi-auth'

interface Worker {
  id: string
  piUsername: string
  displayName: string
  reputationScore: number
  level: number
  KYCStatus: string
  profileImageUrl?: string
}

interface Submission {
  id: string
  taskId: string
  workerId: string
  proofContent: string
  proofFileUrl?: string
  submissionType: string
  status: string
  employerQualityRating?: number
  approvedAt?: string
  createdAt: string
  worker: Worker
}

export default function ReviewTaskPage({
  params,
}: {
  params: { taskId: string }
}) {
  const taskId = params.taskId
  const { user, authenticate, isSdkReady } = usePiAuth()
  const hasAutoAuthenticated = useRef(false)

  // Auto-authenticate when SDK is ready and user is not yet logged in
  // Only fire once to prevent repeated auth calls
  useEffect(() => {
    if (isSdkReady && !user && !hasAutoAuthenticated.current) {
      hasAutoAuthenticated.current = true
      authenticate()
    }
  }, [isSdkReady, user, authenticate])

  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rating, setRating] = useState<Record<string, number>>({})
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (!taskId) return
    if (!user?.piUid) return

    const fetchSubmissions = async () => {
      try {
        const res = await fetch(`/api/tasks/${taskId}/submissions`, {
          headers: {
            'x-pi-uid': user.piUid,
          },
        })

        if (!res.ok) throw new Error('Failed to load submissions')
        const data = await res.json()
        setSubmissions(data || [])
      } catch (err) {
        setError('Could not load submissions')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchSubmissions()
  }, [taskId, user?.piUid])

  const handleApprove = async (submissionId: string) => {
    setActionInProgress(submissionId)
    setMessage(null)

    try {
      if (!user?.piUid) throw new Error('Not authenticated')

      const res = await fetch('/api/submissions/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-pi-uid': user.piUid,
        },
        body: JSON.stringify({
          submissionId,
          qualityRating: rating[submissionId] || 5,
        }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Approval failed')

      setMessage({ type: 'success', text: 'Submission approved! Pi released to worker.' })
      setSubmissions(prev =>
        prev.map(s =>
          s.id === submissionId
            ? {
                ...s,
                status: 'approved',
                employerQualityRating: rating[submissionId] || 5,
              }
            : s
        )
      )
    } catch (err) {
      setMessage({ type: 'error', text: (err as Error).message })
    } finally {
      setActionInProgress(null)
    }
  }

  const handleReject = async (submissionId: string) => {
    setActionInProgress(submissionId)
    setMessage(null)

    try {
      if (!user?.piUid) throw new Error('Not authenticated')

      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-pi-uid': user.piUid,
        },
        body: JSON.stringify({
          submissionId,
          rejectReason: 'Quality below threshold',
        }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Rejection failed')

      setMessage({ type: 'success', text: 'Submission rejected. Slot returned to availability.' })
      setSubmissions(prev =>
        prev.map(s =>
          s.id === submissionId ? { ...s, status: 'rejected' } : s
        )
      )
    } catch (err) {
      setMessage({ type: 'error', text: (err as Error).message })
    } finally {
      setActionInProgress(null)
    }
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.center}>Loading submissions...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={{ ...styles.center, color: '#ef4444' }}>{error}</div>
      </div>
    )
  }

  if (submissions.length === 0) {
    return (
      <div style={styles.container}>
        <h1 style={styles.pageTitle}>Review Submissions</h1>
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>∅</div>
          <p>No submissions yet</p>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.pageTitle}>Review Submissions</h1>

      {message && (
        <div style={{
          ...styles.message,
          ...(message.type === 'success' ? styles.messageSuccess : styles.messageError),
        }}>
          {message.text}
        </div>
      )}

      <div style={styles.submissionsContainer}>
        {submissions.map(submission => (
          <div key={submission.id} style={styles.submissionCard}>
            {/* Worker Header */}
            <div style={styles.workerHeader}>
              <div>
                <div style={styles.workerName}>{submission.worker.displayName}</div>
                <div style={styles.workerUsername}>@{submission.worker.piUsername}</div>
                <div style={styles.workerStats}>
                  Rep: {submission.worker.reputationScore} • Level {submission.worker.level} •{' '}
                  KYC: {submission.worker.KYCStatus}
                </div>
              </div>
              <div style={{
                ...styles.statusBadge,
                ...(submission.status === 'approved'
                  ? styles.statusApproved
                  : submission.status === 'rejected'
                    ? styles.statusRejected
                    : styles.statusPending),
              }}>
                {submission.status.toUpperCase()}
              </div>
            </div>

            {/* Proof Content */}
            <div style={styles.proofSection}>
              <div style={styles.proofLabel}>Proof Submitted:</div>
              <div style={styles.proofContent}>{submission.proofContent}</div>
            </div>

            {/* Rating */}
            <div style={styles.ratingSection}>
              <div style={styles.ratingLabel}>Quality Rating:</div>
              <div style={styles.ratingStars}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => setRating(prev => ({ ...prev, [submission.id]: star }))}
                    disabled={submission.status !== 'pending'}
                    style={{
                      ...styles.star,
                      ...(rating[submission.id] >= star
                        ? styles.starFilled
                        : styles.starEmpty),
                      ...(submission.status !== 'pending' ? styles.starDisabled : {}),
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            {submission.status === 'pending' && (
              <div style={styles.actions}>
                <button
                  onClick={() => handleApprove(submission.id)}
                  disabled={actionInProgress === submission.id}
                  style={{
                    ...styles.button,
                    ...styles.buttonApprove,
                    ...(actionInProgress === submission.id ? styles.buttonDisabled : {}),
                  }}
                >
                  {actionInProgress === submission.id ? 'Approving...' : '✓ Approve'}
                </button>
                <button
                  onClick={() => handleReject(submission.id)}
                  disabled={actionInProgress === submission.id}
                  style={{
                    ...styles.button,
                    ...styles.buttonReject,
                    ...(actionInProgress === submission.id ? styles.buttonDisabled : {}),
                  }}
                >
                  {actionInProgress === submission.id ? 'Rejecting...' : '✕ Reject'}
                </button>
              </div>
            )}

            {submission.status === 'approved' && (
              <div style={styles.approvedNote}>
                Approved on {new Date(submission.approvedAt!).toLocaleDateString()} •
                Rating: {submission.employerQualityRating} ★
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '32px 20px',
    color: '#ffffff',
  },
  pageTitle: {
    fontSize: '28px',
    fontWeight: '700',
    margin: '0 0 32px 0',
    color: '#ffffff',
  },
  center: {
    textAlign: 'center',
    padding: '40px 20px',
    fontSize: '16px',
  },
  empty: {
    textAlign: 'center',
    padding: '80px 20px',
    color: '#9ca3af',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  submissionsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  submissionCard: {
    backgroundColor: '#111827',
    border: '1px solid #374151',
    borderRadius: '8px',
    padding: '24px',
  },
  workerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '1px solid #374151',
  },
  workerName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: '4px',
  },
  workerUsername: {
    fontSize: '13px',
    color: '#9ca3af',
    marginBottom: '8px',
  },
  workerStats: {
    fontSize: '12px',
    color: '#7B3FE4',
  },
  statusBadge: {
    padding: '6px 12px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statusPending: {
    backgroundColor: '#7f453a',
    color: '#fbbf24',
  },
  statusApproved: {
    backgroundColor: '#064e3b',
    color: '#10b981',
  },
  statusRejected: {
    backgroundColor: '#7f1d1d',
    color: '#ef4444',
  },
  proofSection: {
    marginBottom: '20px',
  },
  proofLabel: {
    fontSize: '12px',
    textTransform: 'uppercase',
    color: '#9ca3af',
    marginBottom: '8px',
  },
  proofContent: {
    backgroundColor: '#0f0f0f',
    padding: '12px',
    borderRadius: '4px',
    fontSize: '13px',
    color: '#d1d5db',
    lineHeight: '1.5',
    wordBreak: 'break-word',
  },
  ratingSection: {
    marginBottom: '20px',
  },
  ratingLabel: {
    fontSize: '12px',
    textTransform: 'uppercase',
    color: '#9ca3af',
    marginBottom: '8px',
  },
  ratingStars: {
    display: 'flex',
    gap: '8px',
  },
  star: {
    fontSize: '24px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    padding: '0',
    transition: 'color 0.2s',
  },
  starFilled: {
    color: '#fbbf24',
  },
  starEmpty: {
    color: '#4b5563',
  },
  starDisabled: {
    cursor: 'not-allowed',
    opacity: 0.6,
  },
  actions: {
    display: 'flex',
    gap: '12px',
  },
  button: {
    flex: 1,
    padding: '10px 16px',
    borderRadius: '6px',
    border: 'none',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  buttonApprove: {
    backgroundColor: '#10b981',
    color: '#ffffff',
  },
  buttonReject: {
    backgroundColor: '#ef4444',
    color: '#ffffff',
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  approvedNote: {
    fontSize: '12px',
    color: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: '8px 12px',
    borderRadius: '4px',
  },
  message: {
    padding: '12px 16px',
    borderRadius: '6px',
    marginBottom: '20px',
    fontSize: '14px',
  },
  messageSuccess: {
    backgroundColor: '#064e3b',
    color: '#10b981',
    border: '1px solid #10b981',
  },
  messageError: {
    backgroundColor: '#7f1d1d',
    color: '#fca5a5',
    border: '1px solid #ef4444',
  },
}
