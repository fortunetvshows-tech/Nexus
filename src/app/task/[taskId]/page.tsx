'use client'

import { useEffect, useState, useRef, use } from 'react'
import Link from 'next/link'
import { usePiAuth }    from '@/hooks/use-pi-auth'
import { useSubmission } from '@/hooks/use-submission'
import { Navigation }   from '@/components/Navigation'
import { DisputeSection } from '@/components/DisputeSection'
import { FeeBreakdown } from '@/components/FeeBreakdown'
import { COLORS, FONTS, RADII, SHADOWS, GRADIENTS, SPACING, statusStyle } from '@/lib/design/tokens'

interface Task {
  id:               string
  title:            string
  description:      string
  instructions:     string
  category:         string
  proofType:        string
  piReward:         number
  slotsAvailable:   number
  slotsRemaining:   number
  timeEstimateMin:  number
  deadline:         string
  minReputationReq: number
  minBadgeLevel:    string
  taskStatus:       string
  tags:             string[]
  isFeatured:       boolean
  employer: {
    piUsername:      string
    reputationScore: number
    reputationLevel: string
  }
}

export default function TaskDetailPage({
  params,
}: {
  params: Promise<{ taskId: string }>
}) {
  const resolvedParams         = use(params)
  const taskId                 = resolvedParams?.taskId
  const { user, authenticate, isSdkReady } = usePiAuth()
  const hasAutoAuthenticated   = useRef(false)

  useEffect(() => {
    if (isSdkReady && !user && !hasAutoAuthenticated.current) {
      hasAutoAuthenticated.current = true
      authenticate()
    }
  }, [isSdkReady, user, authenticate])

  const [task,    setTask]    = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeLeft, setTimeLeft] = useState<string>('')

  const {
    isClaimed,
    isClaiming,
    claimError,
    isSubmitted,
    isSubmitting,
    submitError,
    agreedReward,
    timeoutAt,
    claimSlot,
    submitProof,
  } = useSubmission(taskId ?? '', user?.piUid ?? '')

  const [proofContent, setProofContent] = useState('')
  const [submissionStatus, setSubmissionStatus] = useState<string | null>(null)
  const [submissionId, setSubmissionId]         = useState<string | null>(null)

  // Fetch task
  useEffect(() => {
    if (!taskId || taskId === 'undefined') return
    if (!user?.piUid) return

    setLoading(true)

    fetch(`/api/tasks/${taskId}`, {
      headers: { 'x-pi-uid': user.piUid },
    })
      .then(r => r.json())
      .then(d => {
        if (d.task) {
          setTask(d.task)
          // Check if worker has existing submission
          if (taskId && user?.piUid) {
            fetch(`/api/tasks/${taskId}/my-submission`, {
              headers: { 'x-pi-uid': user.piUid },
            })
              .then(r => r.json())
              .then(s => {
                if (s.submission) {
                  setSubmissionStatus(s.submission.status)
                  setSubmissionId(s.submission.id)
                }
              })
              .catch(() => {})
          }
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [taskId, user?.piUid])

  // Countdown timer
  useEffect(() => {
    if (!timeoutAt) return

    const update = () => {
      const ms = new Date(timeoutAt).getTime() - Date.now()
      if (ms <= 0) { setTimeLeft('Expired'); return }
      const m  = Math.floor(ms / 60000)
      const s  = Math.floor((ms % 60000) / 1000)
      setTimeLeft(`${m}m ${s}s remaining`)
    }

    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [timeoutAt])

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

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#0f0f0f',
        fontFamily: 'system-ui, sans-serif',
      }}>
        <Navigation currentPage="feed" />
        <div style={{
          maxWidth: '680px', margin: '0 auto',
          padding: '80px 1rem 2rem',
        }}>
          <div style={{
            background: '#111827', borderRadius: '16px',
            height: '400px', border: '1px solid #1f2937',
          }} />
        </div>
      </div>
    )
  }

  if (!task) {
    return (
      <div style={{
        minHeight: '100vh', background: '#0f0f0f',
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', color: '#9ca3af',
        fontFamily: 'system-ui, sans-serif',
      }}>
        Task not found
      </div>
    )
  }

  const canClaim = task.slotsRemaining > 0 &&
                   user.reputationScore >= task.minReputationReq

  const deadlineLabel = (() => {
    const ms = new Date(task.deadline).getTime() - Date.now()
    if (ms <= 0) return 'Expired'
    const h  = Math.round(ms / 3600000)
    return h < 24 ? `${h}h left` : `${Math.round(h / 24)}d left`
  })()

  return (
    <div style={{
      minHeight:  '100vh',
      background: '#0f0f0f',
      fontFamily: 'system-ui, sans-serif',
      color:      '#ffffff',
    }}>
      <Navigation currentPage="feed" />

      <main style={{
        maxWidth: '680px',
        margin:   '0 auto',
        padding:  '80px 1rem 4rem',
      }}>

        <Link href="/dashboard" style={{
          color: '#6b7280', fontSize: '0.875rem',
          textDecoration: 'none', display: 'inline-block',
          marginBottom: '1.5rem',
        }}>
          ← Back to dashboard
        </Link>

        {/* Task header */}
        <div style={{
          background: '#111827', border: '1px solid #1f2937',
          borderRadius: '16px', padding: '1.5rem',
          marginBottom: '1rem',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'flex-start', marginBottom: '1rem',
          }}>
            <div style={{ flex: 1, marginRight: '1rem' }}>
              <div style={{
                fontSize: '0.75rem', color: '#6b7280',
                textTransform: 'uppercase', letterSpacing: '0.05em',
                marginBottom: '0.4rem',
              }}>
                {task.category}
              </div>
              <h1 style={{
                margin: '0', fontSize: '1.3rem',
                fontWeight: '700', lineHeight: '1.4',
              }}>
                {task.title}
              </h1>
            </div>
            <div style={{
              fontSize: '2rem', fontWeight: '800',
              background: 'linear-gradient(135deg, #7B3FE4, #A855F7)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              flexShrink: 0,
            }}>
              {task.piReward}π
            </div>
          </div>

          {/* Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.75rem',
            padding: '1rem 0',
            borderTop: '1px solid #1f2937',
            borderBottom: '1px solid #1f2937',
            margin: '1rem 0',
          }}>
            {[
              { label: 'Slots left',  value: `${task.slotsRemaining}/${task.slotsAvailable}` },
              { label: 'Est. time',   value: `~${task.timeEstimateMin}min` },
              { label: 'Deadline',    value: deadlineLabel },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: '0.75rem', color: '#6b7280',
                  marginBottom: '0.25rem',
                }}>
                  {s.label}
                </div>
                <div style={{
                  fontSize: '0.9rem', fontWeight: '600',
                  color: '#e5e7eb',
                }}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>

          {/* Description */}
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{
              margin: '0 0 0.5rem', fontSize: '0.8rem',
              fontWeight: '500', color: '#6b7280',
              textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>
              Description
            </h3>
            <p style={{
              margin: '0', fontSize: '0.9rem',
              color: '#d1d5db', lineHeight: '1.6',
            }}>
              {task.description}
            </p>
          </div>

          {/* Instructions */}
          <div>
            <h3 style={{
              margin: '0 0 0.5rem', fontSize: '0.8rem',
              fontWeight: '500', color: '#a78bfa',
              textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>
              Instructions
            </h3>
            <p style={{
              margin: '0', fontSize: '0.9rem',
              color: '#d1d5db', lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
            }}>
              {task.instructions}
            </p>
          </div>

          {/* Employer */}
          <div style={{
            marginTop: '1rem', paddingTop: '1rem',
            borderTop: '1px solid #1f2937',
            fontSize: '0.8rem', color: '#6b7280',
          }}>
            Posted by{' '}
            <span style={{ color: '#9ca3af', fontWeight: '500' }}>
              {task.employer?.piUsername}
            </span>
            {' · '}
            <span style={{ color: '#7B3FE4' }}>
              {task.employer?.reputationLevel}
            </span>
          </div>
        </div>

        {/* Fee breakdown */}
        {task?.piReward && (
          <div style={{ marginBottom: '1rem' }}>
            <FeeBreakdown
              rewardPi={task.piReward}
              showFor="worker"
            />
          </div>
        )}

        {/* Claim section */}
        {!isClaimed && !isSubmitted && (
          <div style={{
            background: '#111827', border: '1px solid #1f2937',
            borderRadius: '16px', padding: '1.5rem',
          }}>
            {claimError && (
              <div style={{
                padding: '0.875rem', background: '#450a0a',
                border: '1px solid #dc2626', borderRadius: '8px',
                color: '#fca5a5', fontSize: '0.875rem',
                marginBottom: '1rem',
              }}>
                {claimError}
              </div>
            )}

            <button
              onClick={() => claimSlot()}
              disabled={isClaiming || !canClaim}
              style={{
                width: '100%', padding: '1rem',
                background: !canClaim
                  ? '#374151'
                  : 'linear-gradient(135deg, #7B3FE4, #A855F7)',
                color: 'white', border: 'none',
                borderRadius: '12px', fontSize: '1rem',
                fontWeight: '600',
                cursor: isClaiming || !canClaim ? 'not-allowed' : 'pointer',
              }}
            >
              {isClaiming
                ? 'Claiming...'
                : !canClaim
                ? task.slotsRemaining === 0
                  ? 'No slots remaining'
                  : `Need ${task.minReputationReq} reputation`
                : `Claim slot — earn ${task.piReward}π`}
            </button>

            <p style={{
              margin: '0.75rem 0 0', fontSize: '0.8rem',
              color: '#6b7280', textAlign: 'center',
            }}>
              You have {task.timeEstimateMin} minutes to complete after claiming
            </p>
          </div>
        )}

        {/* Submission form */}
        {isClaimed && !isSubmitted && (
          <div style={{
            background: '#111827', border: '1px solid #7B3FE4',
            borderRadius: '16px', padding: '1.5rem',
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: '1.25rem',
              padding: '0.75rem 1rem', background: '#0f172a',
              borderRadius: '8px',
            }}>
              <span style={{
                fontSize: '0.85rem', color: '#9ca3af', fontWeight: '500',
              }}>
                Slot claimed ✓
              </span>
              <span style={{
                fontSize: '0.85rem', fontWeight: '600',
                color: timeLeft === 'Expired' ? '#ef4444' : '#a78bfa',
              }}>
                ⏱ {timeLeft || 'Loading...'}
              </span>
            </div>

            <h3 style={{
              margin: '0 0 0.75rem', fontSize: '0.95rem',
              fontWeight: '600', color: '#ffffff',
            }}>
              Submit your proof
            </h3>

            <textarea
              value={proofContent}
              onChange={e => setProofContent(e.target.value)}
              placeholder={task.instructions}
              rows={6}
              style={{
                width: '100%', padding: '0.875rem',
                background: '#1f2937', border: '1px solid #374151',
                borderRadius: '8px', color: '#ffffff',
                fontSize: '0.9rem', resize: 'vertical',
                outline: 'none', boxSizing: 'border-box',
                lineHeight: '1.6', marginBottom: '1rem',
              }}
            />

            {submitError && (
              <div style={{
                padding: '0.875rem', background: '#450a0a',
                border: '1px solid #dc2626', borderRadius: '8px',
                color: '#fca5a5', fontSize: '0.875rem',
                marginBottom: '1rem',
              }}>
                {submitError}
              </div>
            )}

            <button
              onClick={() =>
                submitProof(proofContent, '', task.proofType)
              }
              disabled={isSubmitting || proofContent.trim().length < 10}
              style={{
                width: '100%', padding: '1rem',
                background: proofContent.trim().length < 10
                  ? '#374151'
                  : 'linear-gradient(135deg, #7B3FE4, #A855F7)',
                color: 'white', border: 'none',
                borderRadius: '12px', fontSize: '1rem',
                fontWeight: '600',
                cursor: isSubmitting || proofContent.trim().length < 10
                  ? 'not-allowed'
                  : 'pointer',
              }}
            >
              {isSubmitting
                ? 'Submitting...'
                : `Submit proof — earn ${task.piReward}π`}
            </button>
          </div>
        )}

        {/* Success state */}
        {isSubmitted && (
          <div style={{
            background: '#111827', border: '1px solid #16a34a',
            borderRadius: '16px', padding: '1.5rem',
            textAlign: 'center',
          }}>
            <div style={{
              width: '60px', height: '60px', borderRadius: '50%',
              background: '#14532d', border: '2px solid #16a34a',
              margin: '0 auto 1rem', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: '1.5rem',
            }}>
              ✓
            </div>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem' }}>
              Proof submitted!
            </h3>
            <p style={{
              color: '#9ca3af', fontSize: '0.875rem',
              margin: '0 0 1.25rem',
            }}>
              Waiting for employer review.
              Auto-approved in 72 hours if not reviewed.
            </p>
            <div style={{
              background: '#0f172a', borderRadius: '8px',
              padding: '0.875rem', marginBottom: '1.25rem',
            }}>
              <div style={{
                fontSize: '0.75rem', color: '#6b7280',
                marginBottom: '0.25rem',
              }}>
                Potential earnings
              </div>
              <div style={{
                fontSize: '1.5rem', fontWeight: '700',
                background: 'linear-gradient(135deg, #7B3FE4, #A855F7)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                {agreedReward ?? task.piReward}π
              </div>
            </div>
            <Link href="/dashboard" style={{
              display: 'block', padding: '0.875rem',
              background: 'transparent', border: '1px solid #374151',
              borderRadius: '10px', color: '#9ca3af',
              textDecoration: 'none', fontSize: '0.9rem',
            }}>
              Back to dashboard
            </Link>
          </div>
        )}

        {/* Rejected submission — dispute option */}
        {submissionStatus === 'REJECTED' && submissionId && (
          <DisputeSection
            submissionId={submissionId}
            piUid={user?.piUid ?? ''}
          />
        )}

      </main>
    </div>
  )
}
