'use client'

import { useEffect, useState, useRef, use } from 'react'
import Link from 'next/link'
import { PLATFORM_CONFIG } from '@/lib/config/platform'
import { usePiAuth }    from '@/hooks/use-pi-auth'
import { useSubmission } from '@/hooks/use-submission'
import { Navigation }   from '@/components/Navigation'
import { DisputeSection } from '@/components/DisputeSection'
import { ProofUploader } from '@/components/ProofUploader'
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
  instructionFileUrl?: string
  instructionFileName?: string
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
  const [proofStoragePath, setProofStoragePath] = useState<string | null>(null)
  const [submissionStatus, setSubmissionStatus] = useState<string | null>(null)
  const [submissionId, setSubmissionId]         = useState<string | null>(null)
  const [walletAddress, setWalletAddress]       = useState<string | null>(null)
  const [showWalletModal, setShowWalletModal]   = useState(false)
  const [proofFileUrl, setProofFileUrl]         = useState<string | null>(null)
  const [isUploadingFile, setIsUploadingFile]   = useState(false)
  const [uploadError, setUploadError]           = useState<string | null>(null)
  const fileInputRef                            = useRef<HTMLInputElement>(null)
  const [workFileUrl, setWorkFileUrl]           = useState<string | null>(null)
  const [isUploadingWorkFile, setIsUploadingWorkFile] = useState(false)
  const [workFileError, setWorkFileError]       = useState<string | null>(null)
  const workFileInputRef                        = useRef<HTMLInputElement>(null)

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

  // Fetch wallet address
  useEffect(() => {
    if (!user?.piUid) return

    fetch(`/api/profile`, {
      headers: { 'x-pi-uid': user.piUid },
    })
      .then(r => r.json())
      .then(d => {
        if (d.profile) {
          setWalletAddress(d.profile.walletAddress ?? null)
        }
      })
      .catch(() => {})
  }, [user?.piUid])

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
      background: COLORS.bgBase,
      fontFamily: FONTS.sans,
      color:      COLORS.textPrimary,
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

        {/* ═══════════════════════════════════════════════════════════
            HERO SECTION — WINNING MOMENT
            ═══════════════════════════════════════════════════════════ */}
        <div style={{
          background:     GRADIENTS.card,
          border:         `1px solid ${COLORS.borderAccent}`,
          borderRadius:   RADII.xl,
          padding:        SPACING.xxl,
          marginBottom:   SPACING.xxxl,
          position:       'relative',
          overflow:       'hidden',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)' as any,
        }}>
          {/* Animated background grid */}
          <div style={{
            position:  'absolute',
            inset:     0,
            opacity:   0.3,
            background: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h80v80H0z' fill='%23080A0F'/%3E%3Cpath d='M0 0h80M0 20h80M0 40h80M0 60h80M0 80h80M0 0v80M20 0v80M40 0v80M60 0v80M80 0v80' stroke='rgba(0,150,255,0.06)' stroke-width='0.5'/%3E%3C/svg%3E")`,
            pointerEvents: 'none',
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* THE EARN MOMENT — Hero Typography */}
            <div style={{
              textAlign:    'center',
              marginBottom: SPACING.xxxl,
              paddingBottom: SPACING.xxl,
              borderBottom: `1px solid ${COLORS.borderAccent}`,
            }}>
              <div style={{
                fontSize:      '0.8rem',
                fontWeight:    '700',
                color:         COLORS.accent,
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                marginBottom:  SPACING.lg,
                fontFamily:    FONTS.sans,
              }}>
                ✓ Complete this task
              </div>

              {/* BIG EARNING NUMBER */}
              <div style={{
                marginBottom: SPACING.lg,
              }}>
                <div style={{
                  fontFamily:    FONTS.mono,
                  fontSize:      'clamp(2.5rem, 15vw, 5rem)',
                  fontWeight:    '900',
                  color:         COLORS.accent,
                  letterSpacing: '-0.05em',
                  lineHeight:    1,
                  textShadow:    `0 0 40px ${COLORS.piGlow}`,
                }}>
                  {Math.max(0, PLATFORM_CONFIG.workerNetPayout(task.piReward)).toFixed(2)}π
                </div>
                <div style={{
                  fontSize:      '1rem',
                  color:         COLORS.accentBright,
                  marginTop:     SPACING.md,
                  fontWeight:    '600',
                  fontFamily:    FONTS.display,
                }}>
                  Earn instantly on approval
                </div>
              </div>

              {/* Fee breakdown badges */}
              <div style={{
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                gap:            SPACING.md,
                marginBottom:   SPACING.lg,
                flexWrap:       'wrap',
                fontSize:       '0.8rem',
              }}>
                <span style={{
                  padding:        SPACING.sm + ' ' + SPACING.md,
                  background:     `rgba(0,150,255,0.08)`,
                  border:         `1px solid ${COLORS.accentDim}`,
                  borderRadius:   RADII.md,
                  color:          COLORS.accentBright,
                  fontFamily:     FONTS.mono,
                }}>
                  Listed: {task.piReward}π
                </span>
                <span style={{ color: COLORS.textMuted }}>−</span>
                <span style={{
                  padding:        SPACING.sm + ' ' + SPACING.md,
                  background:     `rgba(255,71,87,0.08)`,
                  border:         '1px solid rgba(255,71,87,0.2)',
                  borderRadius:   RADII.md,
                  color:          COLORS.stop,
                  fontFamily:     FONTS.mono,
                }}>
                  Fee: {(PLATFORM_CONFIG.PLATFORM_FEE_RATE * 100).toFixed(0)}%
                </span>
              </div>

              {/* Time & status */}
              <div style={{
                fontSize:   '0.9rem',
                color:      COLORS.textSecondary,
              }}>
                ~{task.timeEstimateMin} min to complete · paid to wallet on approval
              </div>
          </div>

            {/* TASK META */}
            <div style={{
              marginBottom: SPACING.xxl,
            }}>
              <h1 style={{
                margin:        `0 0 ${SPACING.lg}`,
                fontSize:      SPACING.xl,
                fontWeight:    '700',
                color:         COLORS.textPrimary,
                lineHeight:    1.3,
                fontFamily:    FONTS.display,
              }}>
                {task.title}
              </h1>

              {/* Status badges */}
              <div style={{
                display:        'flex',
                gap:            SPACING.md,
                flexWrap:       'wrap',
                marginBottom:   SPACING.lg,
              }}>
                <div style={{
                  padding:        SPACING.sm + ' ' + SPACING.md,
                  background:     task.slotsRemaining <= 2
                    ? 'rgba(255,71,87,0.1)'
                    : 'rgba(0,214,143,0.1)',
                  border:         `1px solid ${task.slotsRemaining <= 2
                    ? 'rgba(255,71,87,0.3)'
                    : 'rgba(0,214,143,0.3)'}`,
                  borderRadius:   RADII.md,
                  fontSize:       '0.75rem',
                  fontWeight:     '700',
                  color:          task.slotsRemaining <= 2
                    ? COLORS.stop
                    : COLORS.go,
                  textTransform:  'uppercase',
                  letterSpacing:  '0.05em',
                }}>
                  {task.slotsRemaining === 0
                    ? '✗ Full'
                    : task.slotsRemaining === 1
                    ? '🔥 LAST SPOT'
                    : `${task.slotsRemaining} ${task.slotsRemaining === 1 ? 'SLOT' : 'SLOTS'} LEFT`
                  }
                </div>
                <div style={{
                  padding:        SPACING.sm + ' ' + SPACING.md,
                  background:     COLORS.bgCard,
                  border:         `1px solid ${COLORS.border}`,
                  borderRadius:   RADII.md,
                  fontSize:       '0.75rem',
                  fontWeight:     '700',
                  color:          COLORS.textSecondary,
                  textTransform:  'uppercase',
                  letterSpacing:  '0.05em',
                }}>
                  ✓ {task.category}
                </div>
                <div style={{
                  padding:        SPACING.sm + ' ' + SPACING.md,
                  background:     COLORS.bgCard,
                  border:         `1px solid ${COLORS.border}`,
                  borderRadius:   RADII.md,
                  fontSize:       '0.75rem',
                  fontWeight:     '700',
                  color:          COLORS.textSecondary,
                  textTransform:  'uppercase',
                  letterSpacing:  '0.05em',
                }}>
                  ⏱ {deadlineLabel}
                </div>
              </div>

              {/* Instructions */}
              <div>
                <div style={{
                  fontSize:      '0.7rem',
                  fontWeight:    '700',
                  color:         COLORS.textMuted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom:  SPACING.md,
                }}>
                  What you need to do
                </div>
                <p style={{
                  margin:     0,
                  fontSize:   '1rem',
                  color:      COLORS.textPrimary,
                  lineHeight: 1.6,
                }}>
                  {task.instructions}
                </p>
              </div>
            </div>
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
            <span style={{ color: COLORS.pi }}>
              {task.employer?.reputationLevel}
            </span>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            CLAIM ACTION SECTION — Decisive moment
            ═══════════════════════════════════════════════════════════ */}
        {!isClaimed && !isSubmitted && (
          <div style={{
            background:     GRADIENTS.card,
            border:         `1px solid ${COLORS.borderAccent}`,
            borderRadius:   RADII.xl,
            padding:        SPACING.xxl,
            marginBottom:   SPACING.xxxl,
            position:       'relative',
            overflow:       'hidden',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)' as any,
          }}>
            {/* Background grid */}
            <div style={{
              position:     'absolute',
              inset:        0,
              opacity:      0.2,
              background:   `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h60v60H0z' fill='%23080A0F'/%3E%3Cpath d='M0 0L60 60M60 0L0 60' stroke='rgba(0,150,255,0.1)' stroke-width='0.5'/%3E%3C/svg%3E")`,
              pointerEvents: 'none',
            }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              {/* Error message */}
              {claimError && (
                <div style={{
                  padding:      SPACING.md,
                  background:   `rgba(255,71,87,0.1)`,
                  border:       `1px solid ${COLORS.stop}`,
                  borderRadius: RADII.md,
                  color:        COLORS.stop,
                  fontSize:     '0.9rem',
                  marginBottom: SPACING.lg,
                  lineHeight:   1.5,
                }}>
                  ❌ {claimError}
                </div>
              )}

              {/* Wallet Warning */}
              {!walletAddress && (
                <div style={{
                  padding:      SPACING.md,
                  background:   `rgba(255,176,32,0.08)`,
                  border:       `1px solid ${COLORS.warn}`,
                  borderRadius: RADII.md,
                  marginBottom: SPACING.lg,
                  fontSize:     '0.9rem',
                  color:        COLORS.warn,
                  lineHeight:   1.6,
                }}>
                  ⚠️ <strong>Set your wallet address first</strong> — You'll receive Pi here on approval. Tap below to add it in seconds.
                </div>
              )}

              {/* Action CTA — HEROIC BUTTON */}
              <button
                onClick={() => {
                  if (!walletAddress) {
                    setShowWalletModal(true)
                    return
                  }
                  claimSlot()
                }}
                disabled={isClaiming || !canClaim}
                style={{
                  width:          '100%',
                  padding:        SPACING.lg,
                  background:     !canClaim
                    ? `rgba(0,150,255,0.1)`
                    : GRADIENTS.primary,
                  color:          !canClaim ? COLORS.textMuted : 'white',
                  border:         !canClaim
                    ? `1px solid ${COLORS.border}`
                    : 'none',
                  borderRadius:   RADII.lg,
                  fontSize:       '1.1rem',
                  fontWeight:     '700',
                  fontFamily:     FONTS.display,
                  cursor:         isClaiming || !canClaim ? 'not-allowed' : 'pointer',
                  boxShadow:      !canClaim ? 'none' : SHADOWS.glow,
                  transition:     'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  letterSpacing:  '-0.01em',
                  opacity:        isClaiming ? 0.8 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isClaiming && canClaim) {
                    e.currentTarget.style.transform = 'translateY(-3px)'
                    e.currentTarget.style.boxShadow = SHADOWS.card
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = !canClaim ? 'none' : SHADOWS.glow
                }}
              >
                {isClaiming ? (
                  <>⚡ Securing your spot...</>
                ) : !canClaim ? (
                  task.slotsRemaining === 0
                    ? '✗ All spots taken'
                    : `🔒 Need ${task.minReputationReq} reputation`
                ) : (
                  <>
                    ✓ Claim & Earn {Math.max(0, PLATFORM_CONFIG.workerNetPayout(task.piReward)).toFixed(2)}π
                  </>
                )}
              </button>

              {/* Info text */}
              <div style={{
                marginTop:   SPACING.lg,
                paddingTop:  SPACING.lg,
                borderTop:   `1px solid ${COLORS.borderAccent}`,
                textAlign:   'center',
                fontSize:    '0.85rem',
                color:       COLORS.textSecondary,
              }}>
                ⏱ Complete in ~{task.timeEstimateMin} min · Pi goes directly to your wallet · 60-min countdown after claim
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            SUBMISSION SECTION — Proof + Countdown
            ═══════════════════════════════════════════════════════════ */}
        {isClaimed && !isSubmitted && (
          <div style={{
            background:     COLORS.bgCard,
            border:         `1px solid ${COLORS.accent}`,
            borderRadius:   RADII.xl,
            padding:        SPACING.xxl,
            marginBottom:   SPACING.xxxl,
            position:       'relative',
            overflow:       'hidden',
          }}>
            {/* Header with countdown */}
            <div style={{
              display:        'flex',
              justifyContent: 'space-between',
              alignItems:     'center',
              marginBottom:   SPACING.xxl,
              paddingBottom:  SPACING.lg,
              borderBottom:   `1px solid ${COLORS.borderAccent}`,
            }}>
              <div>
                <div style={{
                  fontSize:      '0.75rem',
                  fontWeight:    '700',
                  color:         COLORS.textMuted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom:  SPACING.sm,
                }}>
                  🔒 Spot Secured
                </div>
                <div style={{
                  fontSize:     '1.1rem',
                  fontWeight:   '700',
                  color:        COLORS.accentBright,
                  fontFamily:   FONTS.display,
                }}>
                  Submit your proof to earn
                </div>
              </div>

              {/* COUNTDOWN TIMER — Visual urgency */}
              <div style={{
                background:     `rgba(0,150,255,0.08)`,
                border:         `2px solid ${timeLeft === 'Expired' ? COLORS.stop : COLORS.accent}`,
                borderRadius:   RADII.lg,
                padding:        `${SPACING.md} ${SPACING.lg}`,
                textAlign:      'center',
                minWidth:       '120px',
              }}>
                <div style={{
                  fontSize:      '0.7rem',
                  color:         COLORS.textMuted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom:  SPACING.sm,
                }}>
                  Time left
                </div>
                <div style={{
                  fontFamily:    FONTS.mono,
                  fontSize:      timeLeft === 'Expired' ? '1.2rem' : '1.4rem',
                  fontWeight:    '900',
                  color:         timeLeft === 'Expired' ? COLORS.stop : COLORS.accentBright,
                  letterSpacing: '0.02em',
                }}>
                  {timeLeft || '...'}
                </div>
              </div>
            </div>

            {/* Verification code */}
            {verificationCode && (
              <div style={{
                padding:        SPACING.lg,
                background:     `rgba(0,150,255,0.04)`,
                border:         `1px dashed ${COLORS.accentDim}`,
                borderRadius:   RADII.md,
                marginBottom:   SPACING.xxl,
              }}>
                <div style={{
                  display:       'flex',
                  justifyContent: 'space-between',
                  alignItems:    'center',
                  gap:           SPACING.lg,
                }}>
                  <div>
                    <div style={{
                      fontSize:      '0.7rem',
                      fontWeight:    '700',
                      color:         COLORS.textMuted,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      marginBottom:  SPACING.sm,
                    }}>
                      Include this verification code
                    </div>
                    <div style={{
                      fontFamily:    FONTS.mono,
                      fontSize:      '1.3rem',
                      fontWeight:    '900',
                      color:         COLORS.accentBright,
                      letterSpacing: '0.1em',
                      textShadow:    `0 0 20px ${COLORS.piGlow}`,
                    }}>
                      {verificationCode}
                    </div>
                  </div>
                  <div style={{
                    fontSize:    '0.8rem',
                    color:       COLORS.textSecondary,
                    textAlign:   'right',
                    maxWidth:    '180px',
                    lineHeight:  '1.5',
                  }}>
                    Write this code visibly in your proof photo/screen
                  </div>
                </div>
              </div>
            )}

            {/* Proof submission */}
            <div>
              <h3 style={{
                margin:      `0 0 ${SPACING.md}`,
                fontSize:    '1rem',
                fontWeight:  '700',
                color:       COLORS.textPrimary,
                fontFamily:  FONTS.display,
              }}>
                Upload Your Proof
              </h3>

              <div style={{
                fontSize:    '0.75rem',
                color:       COLORS.textMuted,
                marginBottom: SPACING.lg,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                Type: <strong>{task.proofType?.toUpperCase() ?? 'TEXT'}</strong>
              </div>

            {/* Proof uploader component — for file-based proofs */}
            {user?.piUid && (
              <div style={{ marginBottom: '1.25rem' }}>
                <ProofUploader
                  piUid={user.piUid}
                  context="submission"
                  contextId={submissionId || taskId}
                  onUploaded={(storagePath) => {
                    setProofStoragePath(storagePath)
                  }}
                />
              </div>
            )}

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
                      background: COLORS.bgRaised,
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

              // PHOTO / IMAGE proof — file upload with preview
              if (type === 'PHOTO' || type === 'IMAGE') {
                return (
                  <div style={{ marginBottom: '1rem' }}>
                    {/* File input (hidden) */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        setUploadError(null)
                        setIsUploadingFile(true)
                        try {
                          const formData = new FormData()
                          formData.append('file', file)
                          formData.append('submissionId', submissionId || `temp-${Date.now()}`)
                          const res = await fetch('/api/proof/upload', {
                            method: 'POST',
                            headers: { 'x-pi-uid': user?.piUid || '' },
                            body: formData,
                          })
                          const data = await res.json()
                          if (!res.ok || !data.success) {
                            setUploadError(data.error || 'Upload failed')
                            setIsUploadingFile(false)
                            return
                          }
                          setProofFileUrl(data.proofUrl)
                          setProofContent(data.proofUrl)
                          setIsUploadingFile(false)
                        } catch (err) {
                          setUploadError('Upload failed. Please try again.')
                          setIsUploadingFile(false)
                        }
                      }}
                      style={{ display: 'none' }}
                    />
                    {proofFileUrl ? (
                      <div style={{
                        marginBottom: '0.75rem',
                        borderRadius: RADII.lg,
                        overflow: 'hidden',
                        border: `2px solid ${COLORS.emerald}`,
                        background: COLORS.bgRaised,
                      }}>
                        <img src={proofFileUrl} alt="Proof preview" style={{
                          width: '100%', maxHeight: '300px', objectFit: 'cover', display: 'block',
                        }} />
                        <button onClick={() => {
                          setProofFileUrl(null)
                          setProofContent('')
                          setUploadError(null)
                          if (fileInputRef.current) fileInputRef.current.value = ''
                        }} style={{
                          width: '100%', padding: '0.5rem', background: 'rgba(239,68,68,0.1)',
                          border: 'none', color: COLORS.red, fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer',
                        }}>
                          ✕ Remove image
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => fileInputRef.current?.click()} disabled={isUploadingFile} style={{
                        width: '100%', padding: '1.5rem', background: COLORS.bgRaised,
                        border: `2px dashed ${COLORS.borderAccent}`, borderRadius: RADII.lg,
                        cursor: isUploadingFile ? 'not-allowed' : 'pointer', marginBottom: '0.75rem',
                        textAlign: 'center' as const, transition: 'all 0.2s ease', opacity: isUploadingFile ? 0.6 : 1,
                      }}
                      >
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                          {isUploadingFile ? '⏳' : '📷'}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: COLORS.textSecondary }}>
                          {isUploadingFile ? 'Uploading...' : 'Click to upload image'}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: COLORS.textMuted, marginTop: '0.5rem' }}>
                          JPG, PNG, GIF, WebP — max 5MB
                        </div>
                      </button>
                    )}
                    {uploadError && (
                      <div style={{
                        padding: '0.875rem', background: COLORS.redDim,
                        border: `1px solid rgba(239,68,68,0.3)`, borderRadius: RADII.md,
                        color: COLORS.red, fontSize: '0.875rem', marginBottom: '0.75rem',
                      }}>
                        {uploadError}
                      </div>
                    )}
                  </div>
                )
              }

              // AUDIO proof — URL or description
              if (type === 'AUDIO') {
                return (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{
                      padding:      '1.5rem',
                      background:   COLORS.bgRaised,
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
                        background:   COLORS.bgRaised,
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

              // FILE / DOCUMENT proof — instruction download + work file upload
              if (type === 'FILE' || type === 'DOCUMENT') {
                return (
                  <div style={{ marginBottom: '1rem' }}>
                    {/* Instruction download section */}
                    {task?.instructionFileUrl && (
                      <div style={{
                        padding: '1rem',
                        background: COLORS.piDim,
                        border: `1px solid rgba(99,102,241,0.3)`,
                        borderRadius: RADII.lg,
                        marginBottom: '1rem',
                      }}>
                        <div style={{
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          color: COLORS.textMuted,
                          textTransform: 'uppercase' as const,
                          letterSpacing: '0.1em',
                          marginBottom: '0.5rem',
                        }}>
                          📋 Instructions
                        </div>
                        <div style={{
                          fontSize: '0.9rem',
                          color: COLORS.textSecondary,
                          marginBottom: '0.75rem',
                        }}>
                          {task.instructionFileName || 'Download instructions'}
                        </div>
                        <a
                          href={task.instructionFileUrl}
                          download
                          style={{
                            display: 'inline-block',
                            padding: '0.5rem 1rem',
                            background: COLORS.pi,
                            color: 'white',
                            borderRadius: RADII.md,
                            textDecoration: 'none',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            transition: 'opacity 0.2s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                        >
                          📥 Download Instructions
                        </a>
                      </div>
                    )}

                    {/* Work file upload */}
                    <div style={{
                      padding: '1.5rem',
                      background: COLORS.bgRaised,
                      border: `2px dashed ${COLORS.borderAccent}`,
                      borderRadius: RADII.lg,
                      textAlign: 'center' as const,
                      marginBottom: '0.75rem',
                    }}>
                      <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                        {isUploadingWorkFile ? '⏳' : '📤'}
                      </div>
                      <div style={{
                        fontSize: '0.82rem',
                        color: COLORS.textSecondary,
                        marginBottom: '0.75rem',
                      }}>
                        {isUploadingWorkFile ? 'Uploading...' : 'Upload your completed work'}
                      </div>
                      <div style={{
                        fontSize: '0.7rem',
                        color: COLORS.textMuted,
                      }}>
                        PDF, DOCX, JPG, PNG — max 10MB
                      </div>
                    </div>

                    {/* File input */}
                    <input
                      ref={workFileInputRef}
                      type="file"
                      accept=".pdf,.docx,.doc,.jpg,.jpeg,.png,.gif,.webp"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return

                        setWorkFileError(null)
                        setIsUploadingWorkFile(true)

                        try {
                          const formData = new FormData()
                          formData.append('file', file)
                          formData.append('submissionId', submissionId || `temp-${Date.now()}`)

                          const res = await fetch('/api/work-file/upload', {
                            method: 'POST',
                            headers: { 'x-pi-uid': user?.piUid || '' },
                            body: formData,
                          })

                          const data = await res.json()

                          if (!res.ok || !data.success) {
                            setWorkFileError(data.error || 'Upload failed')
                            setIsUploadingWorkFile(false)
                            return
                          }

                          setWorkFileUrl(data.workFileUrl)
                          setProofContent(data.workFileUrl)
                          setIsUploadingWorkFile(false)
                        } catch (err) {
                          setWorkFileError('Upload failed. Please try again.')
                          setIsUploadingWorkFile(false)
                        }
                      }}
                      style={{ display: 'none' }}
                    />

                    {/* Upload button / preview */}
                    {workFileUrl ? (
                      <div style={{
                        padding: '1rem',
                        background: COLORS.emeraldDim,
                        border: `1px solid rgba(16,185,129,0.3)`,
                        borderRadius: RADII.lg,
                        marginBottom: '0.75rem',
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '0.5rem',
                        }}>
                          <div style={{
                            fontSize: '0.9rem',
                            color: COLORS.emerald,
                            fontWeight: '600',
                          }}>
                            ✓ File uploaded
                          </div>
                          <button
                            onClick={() => {
                              setWorkFileUrl(null)
                              setProofContent('')
                              setWorkFileError(null)
                              if (workFileInputRef.current) workFileInputRef.current.value = ''
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: COLORS.red,
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                              fontWeight: '600',
                            }}
                          >
                            ✕ Replace
                          </button>
                        </div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: COLORS.textMuted,
                          wordBreak: 'break-all' as const,
                        }}>
                          Ready to submit
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => workFileInputRef.current?.click()}
                        disabled={isUploadingWorkFile}
                        style={{
                          width: '100%',
                          padding: '1rem',
                          background: COLORS.bgBase,
                          border: `1px solid ${COLORS.borderAccent}`,
                          borderRadius: RADII.md,
                          color: COLORS.textSecondary,
                          cursor: isUploadingWorkFile ? 'not-allowed' : 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: '500',
                          transition: 'all 0.2s ease',
                          opacity: isUploadingWorkFile ? 0.6 : 1,
                          marginBottom: '0.75rem',
                        }}
                        onMouseEnter={(e) => {
                          if (!isUploadingWorkFile) {
                            e.currentTarget.style.background = COLORS.bgRaised
                            e.currentTarget.style.borderColor = COLORS.pi
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = COLORS.bgBase
                          e.currentTarget.style.borderColor = COLORS.borderAccent
                        }}
                      >
                        {isUploadingWorkFile ? '⏳ Uploading...' : '📤 Click to upload'}
                      </button>
                    )}

                    {workFileError && (
                      <div style={{
                        padding: '0.875rem',
                        background: COLORS.redDim,
                        border: `1px solid rgba(239,68,68,0.3)`,
                        borderRadius: RADII.md,
                        color: COLORS.red,
                        fontSize: '0.875rem',
                        marginBottom: '0.75rem',
                      }}>
                        {workFileError}
                      </div>
                    )}
                  </div>
                )
              }

              // VIDEO proof — URL or description
              if (type === 'VIDEO') {
                return (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{
                      padding:      '1.5rem',
                      background:   COLORS.bgRaised,
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
                        background:   COLORS.bgRaised,
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
                    background:   COLORS.bgRaised,
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

              {/* Character count */}
              {(task.proofType ?? 'TEXT').toUpperCase() === 'TEXT' && (
                <div style={{
                  marginTop:    SPACING.md,
                  fontSize:     '0.75rem',
                  color:        proofContent.trim().length < 10
                    ? COLORS.stop
                    : COLORS.textMuted,
                  textAlign:    'right',
                }}>
                  {proofContent.trim().length} characters
                  {proofContent.trim().length < 10 && ` — need ${10 - proofContent.trim().length} more`}
                </div>
              )}
            </div>

              {/* Error message */}
              {submitError && (
                <div style={{
                  padding:      SPACING.md,
                  background:   `rgba(255,71,87,0.1)`,
                  border:       `1px solid ${COLORS.stop}`,
                  borderRadius: RADII.md,
                  color:        COLORS.stop,
                  fontSize:     '0.9rem',
                  marginBottom: SPACING.lg,
                  lineHeight:   1.5,
                }}>
                  ❌ {submitError}
                </div>
              )}

              {/* ROCKET LAUNCH BUTTON — Dramatic submit */}
              <button
                onClick={() => submitProof(proofContent, '', task.proofType, proofStoragePath || undefined)}
                disabled={isSubmitting || (proofContent.trim().length < 10 && !proofStoragePath)}
                style={{
                  width:          '100%',
                  padding:        SPACING.lg,
                  background:     isSubmitting || (proofContent.trim().length < 10 && !proofStoragePath)
                    ? `rgba(0,150,255,0.1)`
                    : GRADIENTS.primary,
                  color:          isSubmitting || (proofContent.trim().length < 10 && !proofStoragePath)
                    ? COLORS.textMuted
                    : 'white',
                  border:         isSubmitting || (proofContent.trim().length < 10 && !proofStoragePath)
                    ? `1px solid ${COLORS.border}`
                    : 'none',
                  borderRadius:   RADII.lg,
                  fontSize:       '1.1rem',
                  fontWeight:     '700',
                  fontFamily:     FONTS.display,
                  cursor:         isSubmitting || (proofContent.trim().length < 10 && !proofStoragePath)
                    ? 'not-allowed'
                    : 'pointer',
                  boxShadow:      isSubmitting || (proofContent.trim().length < 10 && !proofStoragePath)
                    ? 'none'
                    : SHADOWS.glow,
                  transition:     'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  letterSpacing:  '-0.01em',
                  opacity:        isSubmitting ? 0.8 : 1,
                  position:       'relative',
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting && (proofContent.trim().length >= 10 || proofStoragePath)) {
                    e.currentTarget.style.transform = 'translateY(-3px)'
                    e.currentTarget.style.boxShadow = SHADOWS.card
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = SHADOWS.glow
                }}
              >
                {isSubmitting ? (
                  <>⚡ Launching your proof...</>
                ) : (
                  <>
                    🚀 Fire off & Earn {task.piReward}π
                  </>
                )}
              </button>
          </div>
        )}

        {/* SUCCESS STATE — Victory screen */}
        {isSubmitted && (
          <div style={{
            background:     GRADIENTS.card,
            border:         `1px solid rgba(0,214,143,0.3)`,
            borderRadius:   RADII.xl,
            padding:        `${SPACING.xxxl} ${SPACING.xxl}`,
            textAlign:      'center',
            position:       'relative',
            overflow:       'hidden',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)' as any,
          }}>
            {/* Background confetti grid */}
            <div style={{
              position:     'absolute',
              inset:        0,
              opacity:      0.2,
              background:   `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h60v60H0z' fill='%23080A0F'/%3E%3Cpath d='M30 10L40 30L30 50L20 30Z' stroke='rgba(0,214,143,0.2)' stroke-width='0.5' fill='none'/%3E%3C/svg%3E")`,
              pointerEvents: 'none',
            }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              {/* Victory icon */}
              <div style={{
                width:          '80px',
                height:         '80px',
                borderRadius:   RADII.xl,
                background:     `rgba(0,214,143,0.1)`,
                border:         `2px solid ${COLORS.go}`,
                margin:         `0 auto ${SPACING.lg}`,
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                fontSize:       '2.5rem',
                boxShadow:      `0 0 30px rgba(0,214,143,0.3)`,
              }}>
                ✓
              </div>

              {/* Success message */}
              <h3 style={{
                margin:      `0 0 ${SPACING.md}`,
                fontSize:    '1.5rem',
                fontWeight:  '800',
                color:       COLORS.go,
                fontFamily:  FONTS.display,
              }}>
                Proof Submitted!
              </h3>

              <p style={{
                margin:       `0 0 ${SPACING.lg}`,
                fontSize:     '1rem',
                color:        COLORS.textSecondary,
                lineHeight:   '1.6',
              }}>
                Your work is locked in. You'll earn {' '}
                <span style={{
                  color:      COLORS.go,
                  fontWeight: '700',
                  fontFamily: FONTS.mono,
                }}>
                  {agreedReward ?? task.piReward}π
                </span>
                {' '}when approved. Auto-approved in 72h if no response.
              </p>

              {/* Earnings display */}
              <div style={{
                padding:      SPACING.lg,
                background:   `rgba(0,214,143,0.05)`,
                border:       `1px solid ${COLORS.go}`,
                borderRadius: RADII.lg,
                marginBottom: SPACING.xxl,
              }}>
                <div style={{
                  fontSize:      '0.75rem',
                  color:         COLORS.textMuted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom:  SPACING.md,
                }}>
                  Pending Earnings
                </div>
                <div style={{
                  fontFamily:    FONTS.mono,
                  fontSize:      '2.2rem',
                  fontWeight:    '900',
                  color:         COLORS.go,
                  letterSpacing: '-0.03em',
                }}>
                  +{agreedReward ?? task.piReward}π
                </div>
              </div>

              {/* CTA buttons */}
              <div style={{ display: 'flex', gap: SPACING.md }}>
                <Link
                  href="/feed"
                  style={{
                    flex:           1,
                    padding:        SPACING.lg,
                    background:     GRADIENTS.primary,
                    color:          'white',
                    borderRadius:   RADII.lg,
                    textDecoration: 'none',
                    fontSize:       '0.95rem',
                    fontWeight:     '700',
                    boxShadow:      SHADOWS.glow,
                    textAlign:      'center',
                    transition:     'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  Find next task →
                </Link>
                <Link
                  href="/dashboard"
                  style={{
                    flex:           1,
                    padding:        SPACING.lg,
                    background:     COLORS.bgCard,
                    border:         `1px solid ${COLORS.borderAccent}`,
                    color:          COLORS.textSecondary,
                    borderRadius:   RADII.lg,
                    textDecoration: 'none',
                    fontSize:       '0.95rem',
                    fontWeight:     '600',
                    textAlign:      'center',
                  }}
                >
                  View earnings
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Rejected submission — dispute option */}
        {submissionStatus === 'REJECTED' && submissionId && (
          <DisputeSection
            submissionId={submissionId}
            piUid={user?.piUid ?? ''}
          />
        )}

        {/* Modern Wallet Modal */}
        {showWalletModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'flex-end',
            zIndex: 9999,
            animation: 'slideUp 0.3s ease-out',
          }}>
            <style>{`
              @keyframes slideUp {
                from { transform: translateY(100%); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
              }
            `}</style>
            <div style={{
              width: '100%',
              maxWidth: '500px',
              background: '#0f172a',
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
              padding: '2rem 1.5rem 1.5rem',
              border: `1px solid ${COLORS.border}`,
              borderBottom: 'none',
            }}>
              {/* Close button */}
              <button
                onClick={() => setShowWalletModal(false)}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'none',
                  border: 'none',
                  color: COLORS.textMuted,
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>

              {/* Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '1rem',
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.2)',
                  border: `2px solid ${COLORS.emerald}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                }}>
                  💳
                </div>
                <div>
                  <h2 style={{
                    margin: 0,
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: COLORS.textPrimary,
                  }}>
                    Add Your Wallet
                  </h2>
                  <p style={{
                    margin: '0.25rem 0 0',
                    fontSize: '0.85rem',
                    color: COLORS.textMuted,
                  }}>
                    Required to receive Pi earnings
                  </p>
                </div>
              </div>

              {/* Description */}
              <p style={{
                margin: '0 0 1.5rem',
                fontSize: '0.9rem',
                color: COLORS.textSecondary,
                lineHeight: '1.6',
              }}>
                When you complete a task and your work is approved, we'll send your Pi directly to your wallet address.
              </p>

              {/* Info boxes */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                marginBottom: '1.5rem',
              }}>
                <div style={{
                  padding: '0.75rem 1rem',
                  background: 'rgba(99, 102, 241, 0.1)',
                  border: `1px solid rgba(99, 102, 241, 0.2)`,
                  borderRadius: RADII.md,
                  fontSize: '0.8rem',
                  color: COLORS.piLt,
                }}>
                  ✓ Your wallet address is encrypted and secure
                </div>
                <div style={{
                  padding: '0.75rem 1rem',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: `1px solid rgba(16, 185, 129, 0.2)`,
                  borderRadius: RADII.md,
                  fontSize: '0.8rem',
                  color: COLORS.emerald,
                }}>
                  ✓ Payments are automated and instant
                </div>
              </div>

              {/* Buttons */}
              <div style={{
                display: 'flex',
                gap: '0.75rem',
                flexDirection: 'column',
              }}>
                <Link
                  href="/profile"
                  style={{
                    display: 'block',
                    padding: '1rem',
                    background: `linear-gradient(135deg, ${COLORS.emerald}, #10b981)`,
                    color: 'white',
                    border: 'none',
                    borderRadius: RADII.lg,
                    fontSize: '0.95rem',
                    fontWeight: '700',
                    textDecoration: 'none',
                    textAlign: 'center' as const,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.filter = 'brightness(1.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.filter = 'brightness(1)'
                  }}
                >
                  Set Wallet Address →
                </Link>
                <button
                  onClick={() => setShowWalletModal(false)}
                  style={{
                    padding: '1rem',
                    background: 'transparent',
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: RADII.lg,
                    color: COLORS.textSecondary,
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = COLORS.bgRaised
                    e.currentTarget.style.color = COLORS.textPrimary
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = COLORS.textSecondary
                  }}
                >
                  Not now
                </button>
              </div>

              {/* Footer note */}
              <p style={{
                margin: '1rem 0 0',
                fontSize: '0.75rem',
                color: COLORS.textMuted,
                textAlign: 'center',
              }}>
                You can always add your wallet later in your profile settings
              </p>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
