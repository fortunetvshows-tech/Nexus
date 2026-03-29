'use client'

import { useEffect, useState, useRef, use } from 'react'
import Link from 'next/link'
import { PLATFORM_CONFIG } from '@/lib/config/platform'
import { usePiAuth }    from '@/hooks/use-pi-auth'
import { useSubmission } from '@/hooks/use-submission'
import { Navigation }   from '@/components/Navigation'
import { DisputeSection } from '@/components/DisputeSection'
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
  const resolvedParams = use(params)
  const taskId         = resolvedParams?.taskId
  const { user }       = usePiAuth()

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
    verificationCode,
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

      <main className="page-main">

        <Link href="/feed" style={{
          color: COLORS.textMuted, fontSize: '0.875rem',
          textDecoration: 'none', display: 'inline-block',
          marginBottom: '1.5rem',
        }}>
          ← Back to opportunities
        </Link>

        {/* Task header — earning-first layout */}
        <div style={{
          background:   COLORS.bgSurface,
          border:       `1px solid ${COLORS.border}`,
          borderRadius: RADII.xl,
          padding:      SPACING.xl,
          marginBottom: SPACING.md,
        }}>
          {/* Reward — hero element */}
          <div style={{
            textAlign:    'center' as const,
            marginBottom: SPACING.lg,
            paddingBottom: SPACING.lg,
            borderBottom: `1px solid ${COLORS.border}`,
          }}>
            <div style={{
              fontSize:      '0.72rem',
              fontWeight:    '700',
              color:         COLORS.emerald,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.15em',
              marginBottom:  '8px',
            }}>
              You will earn
            </div>
            <div>
              <div style={{
                fontFamily:    FONTS.mono,
                fontSize:      'clamp(3rem, 10vw, 4rem)',
                fontWeight:    '800',
                color:         COLORS.emerald,
                letterSpacing: '-0.04em',
                lineHeight:    1,
              }}>
                {Math.max(0, PLATFORM_CONFIG.workerNetPayout(task.piReward)).toFixed(2)}π
              </div>
              <div style={{
                fontSize:   '0.78rem',
                color:      COLORS.textMuted,
                marginTop:  '6px',
              }}>
                You receive this
              </div>
              <div style={{
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                gap:            '8px',
                marginTop:      '8px',
                flexWrap:       'wrap' as const,
              }}>
                <span style={{
                  padding:      '3px 8px',
                  background:   COLORS.bgElevated,
                  border:       `1px solid ${COLORS.border}`,
                  borderRadius: RADII.full,
                  fontSize:     '0.68rem',
                  color:        COLORS.textMuted,
                }}>
                  Listed {task.piReward}π
                </span>
                <span style={{
                  fontSize: '0.68rem',
                  color:    COLORS.textMuted,
                }}>−</span>
                <span style={{
                  padding:      '3px 8px',
                  background:   'rgba(239,68,68,0.06)',
                  border:       '1px solid rgba(239,68,68,0.15)',
                  borderRadius: RADII.full,
                  fontSize:     '0.68rem',
                  color:        '#EF4444',
                }}>
                  {(PLATFORM_CONFIG.PLATFORM_FEE_RATE * 100).toFixed(0)}% platform fee
                </span>
              </div>
            </div>
            <div style={{
              fontSize:   '0.85rem',
              color:      COLORS.textMuted,
              marginTop:  '6px',
            }}>
              in ~{task.timeEstimateMin} min · paid to your wallet on approval
            </div>
          </div>

          {/* Title */}
          <h1 style={{
            margin:        `0 0 ${SPACING.md}`,
            fontSize:      '1.15rem',
            fontWeight:    '600',
            color:         COLORS.textPrimary,
            lineHeight:    1.4,
          }}>
            {task.title}
          </h1>

          {/* Urgency bar */}
          <div style={{
            display:        'flex',
            gap:            SPACING.sm,
            flexWrap:       'wrap' as const,
            marginBottom:   SPACING.lg,
          }}>
            <span style={{
              padding:      '4px 10px',
              background:   task.slotsRemaining <= 2
                ? 'rgba(239,68,68,0.1)'
                : 'rgba(16,185,129,0.1)',
              border:       `1px solid ${task.slotsRemaining <= 2
                ? 'rgba(239,68,68,0.2)'
                : 'rgba(16,185,129,0.2)'}`,
              borderRadius: RADII.full,
              fontSize:     '0.72rem',
              fontWeight:   '700',
              color:        task.slotsRemaining <= 2
                ? '#EF4444'
                : COLORS.emerald,
            }}>
              {task.slotsRemaining === 0
                ? '✗ No spots left'
                : task.slotsRemaining === 1
                ? '🔥 Last spot!'
                : `⚡ ${task.slotsRemaining} spots left`
              }
            </span>
            <span style={{
              padding:      '4px 10px',
              background:   COLORS.bgElevated,
              border:       `1px solid ${COLORS.border}`,
              borderRadius: RADII.full,
              fontSize:     '0.72rem',
              color:        COLORS.textMuted,
            }}>
              ⏱ {deadlineLabel}
            </span>
            <span style={{
              padding:      '4px 10px',
              background:   COLORS.bgElevated,
              border:       `1px solid ${COLORS.border}`,
              borderRadius: RADII.full,
              fontSize:     '0.72rem',
              color:        COLORS.textMuted,
            }}>
              {task.category}
            </span>
          </div>

          {/* What you need to do */}
          <div style={{ marginBottom: SPACING.md }}>
            <div style={{
              fontSize:      '0.68rem',
              fontWeight:    '700',
              color:         COLORS.textMuted,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.1em',
              marginBottom:  SPACING.sm,
            }}>
              What you need to do
            </div>
            <p style={{
              margin:     0,
              fontSize:   '0.9rem',
              color:      COLORS.textSecondary,
              lineHeight: 1.6,
            }}>
              {task.instructions}
            </p>
          </div>

          {/* Context — collapsed by default */}
          {task.description && (
            <details style={{ marginTop: SPACING.sm }}>
              <summary style={{
                fontSize:   '0.78rem',
                color:      COLORS.textMuted,
                cursor:     'pointer',
                listStyle:  'none',
                userSelect: 'none' as const,
              }}>
                + More context
              </summary>
              <p style={{
                margin:     `${SPACING.sm} 0 0`,
                fontSize:   '0.85rem',
                color:      COLORS.textMuted,
                lineHeight: 1.6,
              }}>
                {task.description}
              </p>
            </details>
          )}

          {/* Posted by — minimal */}
          <div style={{
            marginTop:  SPACING.md,
            paddingTop: SPACING.md,
            borderTop:  `1px solid ${COLORS.border}`,
            fontSize:   '0.72rem',
            color:      COLORS.textMuted,
          }}>
            Posted by{' '}
            <span style={{ color: COLORS.textSecondary, fontWeight: '500' }}>
              {task.employer?.piUsername}
            </span>
            {' · '}
            <span style={{ color: COLORS.indigo }}>
              {task.employer?.reputationLevel}
            </span>
          </div>
        </div>

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

            <div style={{
              padding:      SPACING.md,
              background:   'rgba(245,158,11,0.08)',
              border:       '1px solid rgba(245,158,11,0.25)',
              borderRadius: RADII.md,
              marginBottom: SPACING.md,
              fontSize:     '0.82rem',
              color:        '#F59E0B',
              lineHeight:   1.5,
            }}>
              ⚠️ Set your wallet address before claiming.
              Without it your payment cannot be sent.{' '}
              <Link
                href="/profile"
                style={{
                  color:          COLORS.indigo,
                  fontWeight:     '600',
                  textDecoration: 'none',
                }}
              >
                Go to Profile →
              </Link>
            </div>

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
                ? '⚡ Securing your spot...'
                : !canClaim
                ? task.slotsRemaining === 0
                  ? 'All spots taken'
                  : `Need ${task.minReputationReq} reputation to unlock`
                : `Start earning ${task.piReward}π now →`}
            </button>

            <p style={{
              margin: '0.75rem 0 0', fontSize: '0.8rem',
              color: '#6b7280', textAlign: 'center',
            }}>
              Complete in ~{task.timeEstimateMin} min · Pi sent directly to your wallet on approval
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
                🔒 Spot secured — complete to earn {task.piReward}π
              </span>
              <span style={{
                fontSize: '0.85rem', fontWeight: '600',
                color: timeLeft === 'Expired' ? '#ef4444' : '#a78bfa',
              }}>
                ⏱ {timeLeft || 'Loading...'}
              </span>
            </div>

            {/* Verification code display */}
            {verificationCode && (
              <div style={{
                padding: '1rem',
                background: 'rgba(99,102,241,0.06)',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: '8px',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
              }}>
                <div>
                  <div style={{
                    fontSize: '0.7rem',
                    fontWeight: '700',
                    color: COLORS.textMuted,
                    textTransform: 'uppercase' as const,
                    letterSpacing: '0.1em',
                    marginBottom: '0.5rem',
                  }}>
                    Include in your proof
                  </div>
                  <div style={{
                    fontFamily: FONTS.mono,
                    fontSize: '1.1rem',
                    fontWeight: '800',
                    color: COLORS.indigo,
                    letterSpacing: '0.08em',
                  }}>
                    {verificationCode}
                  </div>
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: COLORS.textMuted,
                  textAlign: 'right' as const,
                  lineHeight: '1.4',
                }}>
                  Write this code somewhere visible in your proof
                </div>
              </div>
            )}

            {/* Proof submission header */}
            <h3 style={{
              margin: '0 0 0.5rem',
              fontSize: '0.95rem',
              fontWeight: '600',
              color: COLORS.textPrimary,
            }}>
              Submit your proof
            </h3>

            {/* Proof type indicator */}
            <div style={{
              display:      'flex',
              alignItems:   'center',
              gap:          '6px',
              marginBottom: '0.875rem',
              fontSize:     '0.75rem',
              color:        COLORS.textMuted,
            }}>
              <span style={{
                padding:      '2px 8px',
                background:   COLORS.indigoDim,
                border:       `1px solid rgba(99,102,241,0.2)`,
                borderRadius: RADII.full,
                color:        COLORS.indigoLight,
                fontWeight:   '500',
                fontFamily:   FONTS.mono,
                fontSize:     '0.68rem',
                letterSpacing: '0.05em',
              }}>
                {task.proofType?.toUpperCase() ?? 'TEXT'}
              </span>
              <span>proof required</span>
            </div>

            {/* Conditional proof input based on proofType */}
            {(() => {
              const type = (task.proofType ?? 'TEXT').toUpperCase()

              // TEXT proof — standard textarea
              if (type === 'TEXT') {
                return (
                  <textarea
                    value={proofContent}
                    onChange={e => setProofContent(e.target.value)}
                    placeholder={task.instructions ?? 'Describe your completed work in detail...'}
                    rows={6}
                    style={{
                      width:      '100%',
                      padding:    '0.875rem',
                      background: COLORS.bgElevated,
                      border:     `1px solid ${COLORS.borderAccent}`,
                      borderRadius: RADII.md,
                      color:      COLORS.textPrimary,
                      fontSize:   '0.9rem',
                      resize:     'vertical' as const,
                      outline:    'none',
                      boxSizing:  'border-box' as const,
                      lineHeight: '1.6',
                      marginBottom: '1rem',
                      fontFamily: FONTS.sans,
                    }}
                  />
                )
              }

              // PHOTO / IMAGE proof — URL input + preview
              if (type === 'PHOTO' || type === 'IMAGE') {
                return (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{
                      padding:      '1.5rem',
                      background:   COLORS.bgElevated,
                      border:       `2px dashed ${COLORS.borderAccent}`,
                      borderRadius: RADII.lg,
                      textAlign:    'center',
                      marginBottom: '0.75rem',
                    }}>
                      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📷</div>
                      <div style={{
                        fontSize:   '0.82rem',
                        color:      COLORS.textSecondary,
                        marginBottom: '0.75rem',
                      }}>
                        Paste a photo URL or describe what you photographed
                      </div>
                    </div>
                    <textarea
                      value={proofContent}
                      onChange={e => setProofContent(e.target.value)}
                      placeholder="Paste image URL or describe the photo you took and where it can be verified..."
                      rows={4}
                      style={{
                        width:        '100%',
                        padding:      '0.875rem',
                        background:   COLORS.bgElevated,
                        border:       `1px solid ${COLORS.borderAccent}`,
                        borderRadius: RADII.md,
                        color:        COLORS.textPrimary,
                        fontSize:     '0.9rem',
                        resize:       'vertical' as const,
                        outline:      'none',
                        boxSizing:    'border-box' as const,
                        lineHeight:   '1.6',
                        fontFamily:   FONTS.sans,
                      }}
                    />
                  </div>
                )
              }

              // AUDIO proof — URL or description
              if (type === 'AUDIO') {
                return (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{
                      padding:      '1.5rem',
                      background:   COLORS.bgElevated,
                      border:       `2px dashed ${COLORS.borderAccent}`,
                      borderRadius: RADII.lg,
                      textAlign:    'center',
                      marginBottom: '0.75rem',
                    }}>
                      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎙️</div>
                      <div style={{
                        fontSize: '0.82rem',
                        color:    COLORS.textSecondary,
                      }}>
                        Paste an audio file URL or recording link
                      </div>
                    </div>
                    <textarea
                      value={proofContent}
                      onChange={e => setProofContent(e.target.value)}
                      placeholder="Paste the URL to your audio recording (Google Drive, Dropbox, etc.) or describe what you recorded..."
                      rows={4}
                      style={{
                        width:        '100%',
                        padding:      '0.875rem',
                        background:   COLORS.bgElevated,
                        border:       `1px solid ${COLORS.borderAccent}`,
                        borderRadius: RADII.md,
                        color:        COLORS.textPrimary,
                        fontSize:     '0.9rem',
                        resize:       'vertical' as const,
                        outline:      'none',
                        boxSizing:    'border-box' as const,
                        lineHeight:   '1.6',
                        fontFamily:   FONTS.sans,
                      }}
                    />
                  </div>
                )
              }

              // FILE / DOCUMENT proof — URL input
              if (type === 'FILE' || type === 'DOCUMENT') {
                return (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{
                      padding:      '1.5rem',
                      background:   COLORS.bgElevated,
                      border:       `2px dashed ${COLORS.borderAccent}`,
                      borderRadius: RADII.lg,
                      textAlign:    'center',
                      marginBottom: '0.75rem',
                    }}>
                      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📎</div>
                      <div style={{
                        fontSize: '0.82rem',
                        color:    COLORS.textSecondary,
                      }}>
                        Share a file link or document URL
                      </div>
                    </div>
                    <textarea
                      value={proofContent}
                      onChange={e => setProofContent(e.target.value)}
                      placeholder="Paste the URL to your file (Google Drive, Dropbox, OneDrive, etc.) — make sure sharing is enabled..."
                      rows={3}
                      style={{
                        width:        '100%',
                        padding:      '0.875rem',
                        background:   COLORS.bgElevated,
                        border:       `1px solid ${COLORS.borderAccent}`,
                        borderRadius: RADII.md,
                        color:        COLORS.textPrimary,
                        fontSize:     '0.9rem',
                        resize:       'vertical' as const,
                        outline:      'none',
                        boxSizing:    'border-box' as const,
                        lineHeight:   '1.6',
                        fontFamily:   FONTS.sans,
                      }}
                    />
                  </div>
                )
              }

              // VIDEO proof — URL or description
              if (type === 'VIDEO') {
                return (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{
                      padding:      '1.5rem',
                      background:   COLORS.bgElevated,
                      border:       `2px dashed ${COLORS.borderAccent}`,
                      borderRadius: RADII.lg,
                      textAlign:    'center',
                      marginBottom: '0.75rem',
                    }}>
                      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎬</div>
                      <div style={{
                        fontSize: '0.82rem',
                        color:    COLORS.textSecondary,
                      }}>
                        Paste a video link or upload URL
                      </div>
                    </div>
                    <textarea
                      value={proofContent}
                      onChange={e => setProofContent(e.target.value)}
                      placeholder="Paste the URL to your video (YouTube, Vimeo, Google Drive, etc.)..."
                      rows={4}
                      style={{
                        width:        '100%',
                        padding:      '0.875rem',
                        background:   COLORS.bgElevated,
                        border:       `1px solid ${COLORS.borderAccent}`,
                        borderRadius: RADII.md,
                        color:        COLORS.textPrimary,
                        fontSize:     '0.9rem',
                        resize:       'vertical' as const,
                        outline:      'none',
                        boxSizing:    'border-box' as const,
                        lineHeight:   '1.6',
                        fontFamily:   FONTS.sans,
                      }}
                    />
                  </div>
                )
              }

              // Default fallback — generic textarea for any other type
              return (
                <textarea
                  value={proofContent}
                  onChange={e => setProofContent(e.target.value)}
                  placeholder={task.instructions ?? 'Describe your completed work...'}
                  rows={6}
                  style={{
                    width:        '100%',
                    padding:      '0.875rem',
                    background:   COLORS.bgElevated,
                    border:       `1px solid ${COLORS.borderAccent}`,
                    borderRadius: RADII.md,
                    color:        COLORS.textPrimary,
                    fontSize:     '0.9rem',
                    resize:       'vertical' as const,
                    outline:      'none',
                    boxSizing:    'border-box' as const,
                    lineHeight:   '1.6',
                    marginBottom: '1rem',
                    fontFamily:   FONTS.sans,
                  }}
                />
              )
            })()}

            {/* Character count for text proof */}
            {(task.proofType ?? 'TEXT').toUpperCase() === 'TEXT' && (
              <div style={{
                fontSize:    '0.7rem',
                color:       proofContent.trim().length < 10
                  ? COLORS.red
                  : COLORS.textMuted,
                marginBottom: '0.75rem',
                textAlign:   'right' as const,
              }}>
                {proofContent.trim().length} characters
                {proofContent.trim().length < 10 && ' (minimum 10)'}
              </div>
            )}

            {/* Error message */}
            {submitError && (
              <div style={{
                padding:      '0.875rem',
                background:   COLORS.redDim,
                border:       `1px solid rgba(239,68,68,0.3)`,
                borderRadius: RADII.md,
                color:        COLORS.red,
                fontSize:     '0.875rem',
                marginBottom: '1rem',
              }}>
                {submitError}
              </div>
            )}

            {/* Submit button */}
            <button
              onClick={() => submitProof(proofContent, '', task.proofType)}
              disabled={isSubmitting || proofContent.trim().length < 10}
              style={{
                width:        '100%',
                padding:      '1rem',
                background:   isSubmitting || proofContent.trim().length < 10
                  ? COLORS.bgElevated
                  : `linear-gradient(180deg, ${COLORS.indigo} 0%, ${COLORS.indigoDark} 100%)`,
                color:        isSubmitting || proofContent.trim().length < 10
                  ? COLORS.textMuted
                  : 'white',
                border:       'none',
                borderRadius: RADII.lg,
                fontSize:     '1rem',
                fontWeight:   '600',
                cursor:       isSubmitting || proofContent.trim().length < 10
                  ? 'not-allowed'
                  : 'pointer',
                boxShadow:    isSubmitting || proofContent.trim().length < 10
                  ? 'none'
                  : SHADOWS.indigoGlow,
                fontFamily:   FONTS.sans,
                transition:   'all 0.15s ease',
              }}
            >
              {isSubmitting
                ? '⏳ Submitting your work...'
                : `Submit & earn ${task.piReward}π →`}
            </button>
          </div>
        )}

        {/* Success state */}
        {isSubmitted && (
          <div style={{
            background:   COLORS.bgSurface,
            border:       `1px solid rgba(16,185,129,0.4)`,
            borderRadius: RADII.xl,
            padding:      SPACING.xl,
            textAlign:    'center' as const,
          }}>
            {/* Success icon */}
            <div style={{
              width:          '72px',
              height:         '72px',
              borderRadius:   '50%',
              background:     'rgba(16,185,129,0.1)',
              border:         '2px solid rgba(16,185,129,0.4)',
              margin:         `0 auto ${SPACING.md}`,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              fontSize:       '2rem',
            }}>
              ✅
            </div>

            <h3 style={{
              margin:     `0 0 ${SPACING.xs}`,
              fontSize:   '1.3rem',
              fontWeight: '800',
              color:      COLORS.textPrimary,
            }}>
              Work submitted!
            </h3>

            <p style={{
              color:    COLORS.textMuted,
              fontSize: '0.85rem',
              margin:   `0 0 ${SPACING.lg}`,
            }}>
              You will receive{' '}
              <span style={{
                color:      COLORS.emerald,
                fontWeight: '700',
                fontFamily: FONTS.mono,
              }}>
                {agreedReward ?? task.piReward}π
              </span>
              {' '}when your employer approves.
              Auto-approved in 72h if no response.
            </p>

            {/* Earnings preview */}
            <div style={{
              padding:      SPACING.md,
              background:   'rgba(16,185,129,0.06)',
              border:       '1px solid rgba(16,185,129,0.15)',
              borderRadius: RADII.lg,
              marginBottom: SPACING.lg,
            }}>
              <div style={{
                fontSize:   '0.68rem',
                color:      COLORS.textMuted,
                fontWeight: '600',
                textTransform: 'uppercase' as const,
                letterSpacing: '0.1em',
                marginBottom: '6px',
              }}>
                Pending earnings
              </div>
              <div style={{
                fontFamily:    FONTS.mono,
                fontSize:      '2rem',
                fontWeight:    '800',
                color:         COLORS.emerald,
                letterSpacing: '-0.03em',
              }}>
                {agreedReward ?? task.piReward}π
              </div>
            </div>

            {/* Next action — the loop */}
            <Link
              href="/feed"
              style={{
                display:        'block',
                padding:        SPACING.md,
                background:     `linear-gradient(135deg, ${COLORS.indigo}, #4338CA)`,
                color:          'white',
                borderRadius:   RADII.lg,
                textDecoration: 'none',
                fontSize:       '0.95rem',
                fontWeight:     '700',
                marginBottom:   SPACING.sm,
                boxShadow:      '0 0 20px rgba(99,102,241,0.3)',
              }}
            >
              Find next opportunity →
            </Link>

            <Link
              href="/dashboard"
              style={{
                display:        'block',
                padding:        SPACING.sm,
                color:          COLORS.textMuted,
                textDecoration: 'none',
                fontSize:       '0.82rem',
              }}
            >
              View my earnings
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
