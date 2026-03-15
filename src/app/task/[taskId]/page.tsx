'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { usePiAuth } from '@/hooks/use-pi-auth'
import { useSubmission } from '@/hooks/use-submission'

interface Task {
  id: string
  title: string
  description: string
  categoryId: string
  reward: number
  maxWorks: number
  reservedCount: number
  completedCount: number
  status: string
  qualityRatingMin: number
  createdAt: string
  employer: {
    id: string
    piUsername: string
    displayName: string
    reputationScore: number
    level: number
    profileImageUrl?: string
  }
}

export default function TaskDetailPage({
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

  // Diagnostic — remove after fix confirmed
  useEffect(() => {
    console.log('[Nexus:TaskDetail] user state:', user?.piUsername ?? 'null')
  }, [user])

  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const {
    isClaimed,
    isClaiming,
    claimError,
    isSubmitted,
    isSubmitting,
    submitError,
    agreedReward,
    claimSlot,
    submitProof,
  } = useSubmission(taskId, user?.piUid || '')

  const [proofContent, setProofContent] = useState('')
  const [secondsLeft, setSecondsLeft] = useState(0)

  useEffect(() => {
    if (!taskId) return
    if (!user?.piUid) return

    setLoading(true)
    const fetchTask = async () => {
      try {
        const res = await fetch(`/api/tasks/${taskId}`, {
          headers: { 'x-pi-uid': user.piUid }
        })
        if (!res.ok) throw new Error('Failed to load task')
        const data = await res.json()
        setTask(data)
      } catch (err) {
        setError('Could not load task')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchTask()
  }, [taskId, user?.piUid])

  // Countdown timer
  useEffect(() => {
    if (!isClaimed) return

    const interval = setInterval(() => {
      setSecondsLeft(prev => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => clearInterval(interval)
  }, [isClaimed])

  const handleClaimClick = async () => {
    const success = await claimSlot()
    if (success) {
      setSecondsLeft(300) // 5 minutes
    }
  }

  const handleSubmitClick = async () => {
    if (!proofContent.trim()) {
      return
    }
    await submitProof(proofContent)
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.center}>Loading task...</div>
      </div>
    )
  }

  if (error || !task) {
    return (
      <div style={styles.container}>
        <div style={{ ...styles.center, color: '#ef4444' }}>
          {error || 'Task not found'}
        </div>
      </div>
    )
  }

  const slotAvailable = task.reservedCount < task.maxWorks
  const canClaim = !isClaimed && slotAvailable

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>{task.title}</h1>
        <p style={styles.category}>Category: {task.categoryId}</p>
      </div>

      {/* Task Details Grid */}
      <div style={styles.detailsGrid}>
        <div style={styles.detailCard}>
          <div style={styles.detailLabel}>Reward</div>
          <div style={styles.detailValue}>{task.reward} Pi</div>
        </div>
        <div style={styles.detailCard}>
          <div style={styles.detailLabel}>Available Slots</div>
          <div style={styles.detailValue}>
            {task.maxWorks - task.reservedCount}/{task.maxWorks}
          </div>
        </div>
        <div style={styles.detailCard}>
          <div style={styles.detailLabel}>Min Quality</div>
          <div style={styles.detailValue}>{task.qualityRatingMin} stars</div>
        </div>
        <div style={styles.detailCard}>
          <div style={styles.detailLabel}>Completed</div>
          <div style={styles.detailValue}>{task.completedCount}</div>
        </div>
      </div>

      {/* Description */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Description</h2>
        <p style={styles.description}>{task.description}</p>
      </div>

      {/* Employer Info */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Posted by</h2>
        <div style={styles.employerCard}>
          <div>
            <div style={styles.employerName}>{task.employer.displayName}</div>
            <div style={styles.employerUsername}>@{task.employer.piUsername}</div>
            <div style={styles.employerRep}>
              Reputation: {task.employer.reputationScore} (Level {task.employer.level})
            </div>
          </div>
        </div>
      </div>

      {/* Claim Section */}
      {!isClaimed && !isSubmitted && (
        <div style={styles.section}>
          {canClaim && (
            <button
              onClick={handleClaimClick}
              disabled={isClaiming}
              style={{
                ...styles.button,
                ...(isClaiming ? styles.buttonDisabled : styles.buttonPrimary),
              }}
            >
              {isClaiming ? 'Claiming...' : 'Claim Task Slot'}
            </button>
          )}
          {!canClaim && (
            <div style={styles.unavailable}>
              No slots available for this task
            </div>
          )}
          {claimError && (
            <div style={styles.error}>{claimError}</div>
          )}
        </div>
      )}

      {/* Submission Section */}
      {isClaimed && !isSubmitted && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            Submit Your Work
            {secondsLeft > 0 && (
              <span style={styles.timer}>
                {Math.floor(secondsLeft / 60)}:{(secondsLeft % 60).toString().padStart(2, '0')}
              </span>
            )}
          </h2>
          <p style={styles.instructions}>
            You have the next 5 minutes to submit your proof. After that, the slot will be released
            back to the pool.
          </p>
          <textarea
            value={proofContent}
            onChange={(e) => setProofContent(e.target.value)}
            placeholder="Paste your work or explanation here..."
            style={styles.textarea}
          />
          <button
            onClick={handleSubmitClick}
            disabled={isSubmitting || !proofContent.trim()}
            style={{
              ...styles.button,
              ...(isSubmitting || !proofContent.trim()
                ? styles.buttonDisabled
                : styles.buttonPrimary),
            }}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Proof'}
          </button>
          {submitError && (
            <div style={styles.error}>{submitError}</div>
          )}
        </div>
      )}

      {/* Success Section */}
      {isSubmitted && (
        <div style={styles.section}>
          <div style={styles.successCard}>
            <h2 style={styles.successTitle}>✓ Submission Received</h2>
            <p style={styles.successText}>
              Your work has been submitted successfully! The employer will review it and approve or
              request changes.
            </p>
            {agreedReward && (
              <div style={styles.rewardConfirm}>
                <div style={styles.rewardLabel}>Potential Reward:</div>
                <div style={styles.rewardAmount}>{agreedReward} Pi</div>
              </div>
            )}
            <button
              onClick={() => window.location.href = '/'}
              style={{ ...styles.button, ...styles.buttonSecondary }}
            >
              Back to Feed
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '32px 20px',
    color: '#ffffff',
  },
  header: {
    marginBottom: '40px',
    borderBottom: '1px solid #374151',
    paddingBottom: '24px',
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    margin: '0 0 12px 0',
    color: '#ffffff',
  },
  category: {
    fontSize: '14px',
    color: '#9ca3af',
    margin: '0',
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '40px',
  },
  detailCard: {
    backgroundColor: '#111827',
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid #374151',
  },
  detailLabel: {
    fontSize: '12px',
    textTransform: 'uppercase',
    color: '#9ca3af',
    marginBottom: '8px',
  },
  detailValue: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#7B3FE4',
  },
  section: {
    marginBottom: '32px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    margin: '0 0 16px 0',
    color: '#ffffff',
  },
  description: {
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#d1d5db',
    margin: '0',
  },
  employerCard: {
    backgroundColor: '#111827',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #374151',
  },
  employerName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: '4px',
  },
  employerUsername: {
    fontSize: '13px',
    color: '#9ca3af',
    marginBottom: '8px',
  },
  employerRep: {
    fontSize: '13px',
    color: '#7B3FE4',
  },
  button: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '6px',
    border: 'none',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '12px',
  },
  buttonPrimary: {
    backgroundColor: '#7B3FE4',
    color: '#ffffff',
  },
  buttonSecondary: {
    backgroundColor: '#374151',
    color: '#ffffff',
  },
  buttonDisabled: {
    backgroundColor: '#4b5563',
    color: '#9ca3af',
    cursor: 'not-allowed',
  },
  textarea: {
    width: '100%',
    minHeight: '200px',
    padding: '12px',
    backgroundColor: '#111827',
    border: '1px solid #374151',
    borderRadius: '6px',
    color: '#ffffff',
    fontSize: '14px',
    fontFamily: 'monospace',
    resize: 'vertical',
    marginTop: '12px',
    marginBottom: '12px',
  },
  instructions: {
    fontSize: '13px',
    color: '#9ca3af',
    marginBottom: '12px',
    margin: '0 0 12px 0',
  },
  timer: {
    fontSize: '14px',
    color: '#ef4444',
    marginLeft: '12px',
    fontWeight: '600',
  },
  error: {
    marginTop: '12px',
    padding: '12px',
    backgroundColor: '#7f1d1d',
    borderLeft: '4px solid #ef4444',
    color: '#fca5a5',
    fontSize: '13px',
    borderRadius: '4px',
  },
  unavailable: {
    padding: '16px',
    backgroundColor: '#7f1d1d',
    color: '#fca5a5',
    borderRadius: '6px',
    textAlign: 'center',
    fontSize: '14px',
  },
  center: {
    textAlign: 'center',
    padding: '40px 20px',
    fontSize: '16px',
  },
  successCard: {
    backgroundColor: '#064e3b',
    padding: '32px',
    borderRadius: '8px',
    border: '1px solid #10b981',
    textAlign: 'center',
  },
  successTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#10b981',
    margin: '0 0 12px 0',
  },
  successText: {
    fontSize: '14px',
    color: '#d1d5db',
    margin: '0 0 24px 0',
  },
  rewardConfirm: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: '16px',
    borderRadius: '6px',
    marginBottom: '20px',
  },
  rewardLabel: {
    fontSize: '12px',
    textTransform: 'uppercase',
    color: '#9ca3af',
    marginBottom: '4px',
  },
  rewardAmount: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#10b981',
  },
}
