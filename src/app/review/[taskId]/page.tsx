'use client'

import { useEffect, useState, useRef, use } from 'react'
import Link from 'next/link'
import { usePiAuth }  from '@/hooks/use-pi-auth'
import { Navigation } from '@/components/Navigation'
import { ProofViewer } from '@/components/ProofViewer'
import { COLORS, FONTS, RADII, SHADOWS, GRADIENTS, SPACING, statusStyle } from '@/lib/design/tokens'

interface Submission {
  id:                 string
  status:             string
  proofContent:       string
  proofFileUrl?:      string
  submissionType:     string
  agreedReward:       number
  qualityRating?:     number
  rejectionReason?:   string
  autoApproveAt:      string
  submittedAt:        string
  reviewedAt?:        string
  verificationCode?:  string | null
  proofStorageKey?:   string | null
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
  const { user }        = usePiAuth()

  const [submissions,  setSubmissions]  = useState<Submission[]>([])
  const [isLoading,    setIsLoading]    = useState(true)
  const [taskTitle,    setTaskTitle]    = useState('')
  const [taskInstructionUrl, setTaskInstructionUrl] = useState<string | null>(null)
  const [processing,   setProcessing]   = useState<string | null>(null)
  const [rating,       setRating]       = useState<Record<string, number>>({})
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({})
  const [feedback,     setFeedback]     = useState<Record<string, {
    type: 'success' | 'error'
    message: string
  }>>({})
  const [taskDisputes, setTaskDisputes] = useState<Record<string, any>>({})

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
      fetch(`/api/disputes?taskId=${taskId}`, {
        headers: { 'x-pi-uid': user.piUid },
      }).then(r => r.json()),
    ]).then(([taskData, subData, disputeData]) => {
      if (taskData.task) {
        setTaskTitle(taskData.task.title)
        setTaskInstructionUrl(taskData.task.instructionFileUrl || null)
      }
      if (subData.submissions) setSubmissions(subData.submissions)
      if (disputeData.disputes) {
        const lookup = disputeData.disputes.reduce((acc: any, d: any) => {
          if (d.submissionId) acc[d.submissionId] = d
          return acc
        }, {})
        setTaskDisputes(lookup)
      }
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

      if (!res.ok || !data.success) {
        setFeedback(prev => ({
          ...prev,
          [submissionId]: {
            type:    'error',
            message: data.error ?? 'Approval failed. Please try again.',
          },
        }))
        return
      }

      setSubmissions(prev =>
        prev.map(s =>
          s.id === submissionId ? { ...s, status: 'APPROVED' } : s
        )
      )

      if (data.alreadyPaid) {
        setFeedback(prev => ({
          ...prev,
          [submissionId]: {
            type:    'success',
            message: 'Submission already approved and paid.',
          },
        }))
      } else if (data.paymentSent && data.txid) {
        setFeedback(prev => ({
          ...prev,
          [submissionId]: {
            type:    'success',
            message: `✓ Approved & paid ${Number(data.amount).toFixed(4)}π to worker. TX: ${data.txid.slice(0, 12)}...`,
          },
        }))
      } else if (data.warning) {
        setFeedback(prev => ({
          ...prev,
          [submissionId]: {
            type:    'success',
            message: data.warning,
          },
        }))
      } else {
        setFeedback(prev => ({
          ...prev,
          [submissionId]: {
            type:    'success',
            message: 'Submission approved. Payment processing.',
          },
        }))
      }

      // Refresh submissions list
      if (user?.piUid && taskId) {
        fetch(`/api/tasks/${taskId}/submissions`, {
          headers: { 'x-pi-uid': user.piUid },
        }).then(r => r.json())
          .then(data => {
            if (data.submissions) setSubmissions(data.submissions)
          })
          .catch(console.error)
      }

    } catch (err) {
      setFeedback(prev => ({
        ...prev,
        [submissionId]: {
          type:    'error',
          message: err instanceof Error ? err.message : 'Network error. Please try again.',
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
          rejectReason: reason,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setFeedback(prev => ({
          ...prev,
          [submissionId]: {
            type:    'error',
            message: data.error ?? 'Rejection failed. Please try again.',
          },
        }))
        setProcessing(null)
        return
      }

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
      setRejectReason(prev => {
        const updated = { ...prev }
        delete updated[submissionId]
        return updated
      })

    } catch (err) {
      setFeedback(prev => ({
        ...prev,
        [submissionId]: {
          type:    'error',
          message: 'Network error. Please try again.',
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

      <main className="page-main">

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
            background: COLORS.bgSurface, borderRadius: RADII.xl,
            border: `1px solid ${COLORS.border}`,
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
              background:   COLORS.bgSurface,
              border:       `1px solid ${
                sub.status === 'APPROVED' ? COLORS.emerald
                : sub.status === 'REJECTED' ? COLORS.red
                : COLORS.border
              }`,
              borderLeft:   `3px solid ${
                sub.status === 'APPROVED' ? COLORS.emerald
                : sub.status === 'REJECTED' ? COLORS.red
                : COLORS.amber
              }`,
              borderRadius: RADII.xl,
              padding:      SPACING.lg,
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
                  background: sub.status === 'APPROVED' ? COLORS.emeraldDim
                    : sub.status === 'REJECTED' ? COLORS.redDim
                    : COLORS.bgRaised,
                  color: sub.status === 'APPROVED' ? COLORS.emerald
                    : sub.status === 'REJECTED' ? COLORS.red
                    : COLORS.textMuted,
                }}>
                  {sub.status}
                </div>
              </div>

              {/* Dispute history banner */}
              {taskDisputes[sub.id] && (
                <div style={{
                  padding: '0.75rem 1rem',
                  background: taskDisputes[sub.id].status === 'resolved_worker'
                    ? 'rgba(16,185,129,0.08)'
                    : 'rgba(245,158,11,0.08)',
                  border: `1px solid ${
                    taskDisputes[sub.id].status === 'resolved_worker'
                      ? 'rgba(16,185,129,0.25)'
                      : 'rgba(245,158,11,0.25)'
                  }`,
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  fontSize: '0.78rem',
                }}>
                  <div style={{
                    fontWeight:    '600',
                    color:         taskDisputes[sub.id].status === 'resolved_worker'
                      ? '#86efac'
                      : '#fbbf24',
                    marginBottom:  '3px',
                    fontSize:      '0.68rem',
                    textTransform: 'uppercase' as const,
                    letterSpacing: '0.06em',
                  }}>
                    ⚖ Dispute History
                  </div>
                  <div style={{ color: COLORS.textSecondary }}>
                    {taskDisputes[sub.id].status === 'resolved_worker'
                      ? 'Worker disputed the rejection and won. Please review this submission again and approve if work is satisfactory.'
                      : 'A dispute was filed on this submission.'}
                  </div>
                </div>
              )}

              {/* Instructions + Proof — documents section */}
              <div style={{
                background: '#0f172a', borderRadius: '8px',
                padding: '1rem', marginBottom: '1rem',
              }}>
                {/* Instruction file (reference) */}
                {taskInstructionUrl && (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{
                      fontSize: '0.65rem',
                      fontWeight: '700',
                      color: COLORS.textMuted,
                      textTransform: 'uppercase' as const,
                      letterSpacing: '0.1em',
                      marginBottom: '0.5rem',
                    }}>
                      📋 Original Instructions
                    </div>
                    <a
                      href={taskInstructionUrl}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-block',
                        padding: '0.5rem 1rem',
                        background: COLORS.piDim,
                        border: `1px solid rgba(99,102,241,0.3)`,
                        color: COLORS.piLt,
                        borderRadius: RADII.md,
                        textDecoration: 'none',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        transition: 'all 0.2s ease',
                        marginBottom: '1rem',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = COLORS.pi
                        e.currentTarget.style.color = 'white'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = COLORS.piDim
                        e.currentTarget.style.color = COLORS.piLt
                      }}
                    >
                      📥 View Instructions
                    </a>
                  </div>
                )}

                {/* Proof storage (using ProofViewer component) */}
                {sub.proofStorageKey && user?.piUid && (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{
                      fontSize: '0.65rem',
                      fontWeight: '700',
                      color: COLORS.textMuted,
                      textTransform: 'uppercase' as const,
                      letterSpacing: '0.1em',
                      marginBottom: '0.5rem',
                    }}>
                      📎 Uploaded Proof File
                    </div>
                    <ProofViewer
                      storagePath={sub.proofStorageKey}
                      piUid={user.piUid}
                    />
                  </div>
                )}

                {/* Worker's submitted file */}
                {sub.proofFileUrl && sub.proofFileUrl.includes('work-') && (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{
                      fontSize: '0.65rem',
                      fontWeight: '700',
                      color: COLORS.textMuted,
                      textTransform: 'uppercase' as const,
                      letterSpacing: '0.1em',
                      marginBottom: '0.5rem',
                    }}>
                      📄 Worker's Submission
                    </div>
                    <a
                      href={sub.proofFileUrl}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-block',
                        padding: '0.5rem 1rem',
                        background: COLORS.emeraldDim,
                        border: `1px solid rgba(16,185,129,0.3)`,
                        color: COLORS.emerald,
                        borderRadius: RADII.md,
                        textDecoration: 'none',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = COLORS.emerald
                        e.currentTarget.style.color = 'white'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = COLORS.emeraldDim
                        e.currentTarget.style.color = COLORS.emerald
                      }}
                    >
                      📥 Download Work
                    </a>
                  </div>
                )}

                {/* Proof image (if it's an image proof) */}
                {sub.proofFileUrl && !sub.proofFileUrl.includes('work-') && !sub.proofFileUrl.includes('instr-') && ['.jpg', '.png', '.gif', '.webp'].some(ext => sub.proofFileUrl!.toLowerCase().endsWith(ext)) && (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{
                      fontSize: '0.65rem',
                      fontWeight: '700',
                      color: COLORS.textMuted,
                      textTransform: 'uppercase' as const,
                      letterSpacing: '0.1em',
                      marginBottom: '0.5rem',
                    }}>
                      📷 Proof Image
                    </div>
                    <img
                      src={sub.proofFileUrl}
                      alt="Proof"
                      style={{
                        width: '100%',
                        maxWidth: '400px',
                        borderRadius: RADII.md,
                        border: `1px solid ${COLORS.border}`,
                        marginBottom: '0.5rem',
                      }}
                    />
                  </div>
                )}

                {/* Text content  */}
                {sub.proofContent && !sub.proofContent.startsWith('http') && !sub.proofContent.includes('-work-') && (
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#d1d5db',
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap' as const,
                  }}>
                    <div style={{
                      fontSize: '0.65rem',
                      fontWeight: '700',
                      color: COLORS.textMuted,
                      textTransform: 'uppercase' as const,
                      letterSpacing: '0.1em',
                      marginBottom: '0.5rem',
                    }}>
                      💬 Notes
                    </div>
                    {sub.proofContent}
                  </div>
                )}

                {!taskInstructionUrl && !sub.proofFileUrl && !sub.proofContent && (
                  <span style={{ color: COLORS.textMuted }}>No files or notes</span>
                )}
              </div>

              {/* Verification code check */}
              {sub.verificationCode && (
                <div style={{
                  padding:      '0.75rem',
                  background:   'rgba(99,102,241,0.06)',
                  border:       '1px solid rgba(99,102,241,0.2)',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  display:      'flex',
                  alignItems:   'center',
                  justifyContent: 'space-between',
                }}>
                  <div>
                    <div style={{
                      fontSize:       '0.65rem',
                      color:          COLORS.textMuted,
                      fontWeight:     '600',
                      textTransform:  'uppercase' as const,
                      letterSpacing:  '0.1em',
                      marginBottom:   '2px',
                    }}>
                      Expected Verification Code
                    </div>
                    <div style={{
                      fontFamily:     FONTS.mono,
                      fontSize:       '1.1rem',
                      fontWeight:     '800',
                      color:          COLORS.pi,
                      letterSpacing:  '0.08em',
                    }}>
                      {sub.verificationCode}
                    </div>
                  </div>
                  <div style={{
                    fontSize:   '0.72rem',
                    color:      COLORS.textMuted,
                    maxWidth:   '140px',
                    textAlign:  'right' as const,
                  }}>
                    Verify this code appears in the worker's proof
                  </div>
                </div>
              )}

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
                      : `✓ Approve & Pay ${Number(sub.agreedReward * 0.95).toFixed(3)}π`}
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
                  <div style={{
                    fontSize: '0.72rem',
                    color: (rejectReason[sub.id] ?? '').trim().length < 10 ? '#dc2626' : '#6b7280',
                    marginBottom: '0.75rem',
                  }}>
                    {(rejectReason[sub.id] ?? '').trim().length}/10 minimum characters
                  </div>
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
