'use client'

import { useEffect, useState, useRef, use } from 'react'
import Link from 'next/link'
import { PLATFORM_CONFIG } from '@/lib/config/platform'
import { usePiAuth }    from '@/hooks/use-pi-auth'
import { useSubmission } from '@/hooks/use-submission'
import { Navigation }   from '@/components/Navigation'
import { COLORS, FONTS, RADII, SHADOWS, GRADIENTS, SPACING } from '@/lib/design/tokens'

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
  const [timeDisplay, setTimeDisplay] = useState<string>('')
  const [timePercent, setTimePercent]  = useState(100)
  const [timeRunningLow, setTimeRunningLow] = useState(false)

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
  const fileInputRef = useRef<HTMLInputElement>(null)

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
        if (d.task) setTask(d.task)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [taskId, user?.piUid])

  // Countdown timer
  useEffect(() => {
    if (!timeoutAt) return

    const update = () => {
      const now = Date.now()
      const end = new Date(timeoutAt).getTime()
      const ms  = end - now
      
      if (ms <= 0) {
        setTimeDisplay('00:00')
        setTimePercent(0)
        setTimeRunningLow(true)
        return
      }

      const totalMs = end - new Date(timeoutAt).getTime() + ms
      const m = Math.floor(ms / 60000)
      const s = Math.floor((ms % 60000) / 1000)
      setTimeDisplay(`${m}:${String(s).padStart(2, '0')}`)
      setTimePercent(Math.max(0, (ms / (60 * 60 * 1000)) * 100))
      setTimeRunningLow(ms < 5 * 60 * 1000)
    }

    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [timeoutAt])

  if (!user || loading || !task) {
    return (
      <div style={{
        minHeight: '100vh', background: COLORS.bgBase,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Navigation currentPage="feed" />
        <div style={{ color: COLORS.textMuted }}>Loading...</div>
      </div>
    )
  }

  const netPayout = Math.max(0, PLATFORM_CONFIG.workerNetPayout(task.piReward))
  const canClaim = task.slotsRemaining > 0 && user.reputationScore >= task.minReputationReq

  return (
    <div style={{
      minHeight: '100vh', background: COLORS.bgBase, fontFamily: FONTS.sans, color: COLORS.textPrimary,
    }}>
      <Navigation currentPage="feed" />

      <main className="page-main">
        {/* ═══════════════════════════════════════════════════════════
            PRE-CLAIM STATE — Task discovery & claiming
            ═══════════════════════════════════════════════════════════ */}
        {!isClaimed && !isSubmitted && (
          <>
            {/* TopBar */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.lg,
            }}>
              <Link href="/feed" style={{
                color: COLORS.textMuted, fontSize: '1.2rem', textDecoration: 'none',
              }}>
                ←
              </Link>
              <div style={{
                fontSize: '0.875rem', color: COLORS.textMuted, overflow: 'hidden',
                textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {task.title}
              </div>
            </div>

            {/* Slot availability grid */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 7, marginBottom: SPACING.lg,
            }}>
              {Array.from({ length: task.slotsAvailable }).map((_, i) => {
                const taken = i < (task.slotsAvailable - task.slotsRemaining)
                return (
                  <div key={i} style={{
                    height: 30, borderRadius: 6,
                    background: taken ? 'rgba(0,214,143,0.13)' : 'rgba(255,255,255,0.07)',
                    border: `1px solid ${taken ? 'rgba(0,214,143,0.3)' : 'transparent'}`,
                    transition: 'all 0.3s',
                  }} />
                )
              })}
            </div>

            {/* Reward card */}
            <div style={{
              background: '#131720', border: '1px solid rgba(0,149,255,0.22)', borderRadius: 24,
              padding: '28px 20px', textAlign: 'center', marginBottom: SPACING.lg,
              boxShadow: '0 0 40px rgba(0,149,255,0.07)',
            }}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: '#454F64',
                textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>
                You will earn
              </div>
              <div style={{
                fontFamily: "'Bebas Neue', sans-serif", fontSize: 56, letterSpacing: 2,
                color: '#38B2FF', lineHeight: 1,
              }}>
                {netPayout}π
              </div>
              <div style={{ fontSize: 12, color: '#8892A8', marginTop: 6 }}>
                Listed {task.piReward}π · 10% platform fee
              </div>

              <div style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '12px 0', marginTop: 16,
                borderTop: '1px solid rgba(255,255,255,0.07)',
                fontSize: 13,
              }}>
                <span style={{ color: '#8892A8' }}>Platform fee</span>
                <span style={{ color: '#FFB020' }}>
                  -{(task.piReward * 0.10).toFixed(4)}π
                </span>
              </div>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: 15, fontWeight: 700,
              }}>
                <span>You receive</span>
                <span style={{ color: '#00D68F' }}>{netPayout}π</span>
              </div>
            </div>

            {/* Task info card */}
            <div style={{
              background: '#131720', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 18, padding: 16, marginBottom: SPACING.lg,
            }}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: '#454F64',
                textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>
                What you need to do
              </div>
              <div style={{
                fontSize: 14, color: '#8892A8', lineHeight: 1.7,
                whiteSpace: 'pre-wrap' as const,
                wordBreak:  'break-word' as const,
              }}>
                {String(task.instructions).replace(/</g, '&lt;').replace(/>/g, '&gt;')}
              </div>

              <div style={{
                marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.07)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ fontSize: 12, color: '#8892A8' }}>
                  Posted by {task.employer?.piUsername}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span style={{
                    padding: '3px 9px', borderRadius: 100, fontSize: 11, fontWeight: 700,
                    background: 'rgba(255,255,255,0.06)', color: '#8892A8',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}>
                    ⏱ {task.timeEstimateMin}min
                  </span>
                  <span style={{
                    padding: '3px 9px', borderRadius: 100, fontSize: 11, fontWeight: 700,
                    background: 'rgba(0,149,255,0.13)', color: '#38B2FF',
                    border: '1px solid rgba(0,149,255,0.22)',
                  }}>
                    {task.slotsRemaining} spots left
                  </span>
                </div>
              </div>
            </div>

            {/* Claim button */}
            {claimError && (
              <div style={{
                padding: SPACING.md, background: 'rgba(255,71,87,0.1)',
                border: `1px solid ${COLORS.stop}`, borderRadius: RADII.md,
                color: COLORS.stop, fontSize: '0.9rem', marginBottom: SPACING.md,
              }}>
                ❌ {claimError}
              </div>
            )}
            <button
              onClick={claimSlot}
              disabled={isClaiming || !canClaim}
              style={{
                width: '100%', padding: '16px 24px',
                background: canClaim ? '#0095FF' : 'rgba(0,149,255,0.1)',
                border: 'none', borderRadius: 12,
                color: canClaim ? '#fff' : COLORS.textMuted,
                fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 700,
                cursor: isClaiming || !canClaim ? 'wait' : 'pointer',
                boxShadow: canClaim ? '0 0 24px rgba(0,149,255,0.28)' : 'none',
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {isClaiming ? '⏳ Claiming...' : !canClaim ? '🔒 Not eligible' : '⚡ Claim Slot Now →'}
            </button>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════
            POST-CLAIM STATE — Submission & proof
            ═══════════════════════════════════════════════════════════ */}
        {isClaimed && !isSubmitted && (
          <>
            {/* TopBar */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: SPACING.lg, paddingBottom: SPACING.md,
              borderBottom: `1px solid rgba(255,255,255,0.07)`,
            }}>
              <Link href="/feed" style={{
                fontSize: '1.2rem', textDecoration: 'none', color: COLORS.textMuted,
              }}>
                ←
              </Link>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#454F64', textTransform: 'uppercase' }}>
                SUBMIT PROOF
              </div>
              <div style={{ width: '1.2rem' }} />
            </div>

            {/* Work timer */}
            <div style={{
              background: '#131720', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 18, padding: 16, marginBottom: SPACING.md,
            }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10,
              }}>
                <div style={{
                  fontSize: 12, fontWeight: 700, color: '#454F64',
                  textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  Time Remaining
                </div>
                <div style={{
                  fontFamily: "'IBM Plex Mono', monospace", fontSize: 18, fontWeight: 500,
                  color: timeRunningLow ? '#FF4757' : '#38B2FF',
                }}>
                  {timeDisplay}
                </div>
              </div>
              <div style={{
                height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%', borderRadius: 2,
                  background: timeRunningLow
                    ? 'linear-gradient(90deg, #FF4757, #FF6B35)'
                    : 'linear-gradient(90deg, #0095FF, #38B2FF)',
                  width: `${timePercent}%`, transition: 'width 1s linear',
                }} />
              </div>
            </div>

            {/* Verification code */}
            <div style={{
              background: 'rgba(0,149,255,0.13)', border: '1px solid rgba(0,149,255,0.25)',
              borderRadius: 12, padding: '14px 16px', marginBottom: SPACING.md,
            }}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: '#454F64',
                textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>
                Include in your proof
              </div>
              <div style={{
                fontFamily: "'IBM Plex Mono', monospace", fontSize: 22, fontWeight: 500,
                color: '#38B2FF', letterSpacing: 2, textAlign: 'center',
              }}>
                {verificationCode || '...'}
              </div>
            </div>

            {/* Proof input */}
            {task.proofType === 'TEXT' ? (
              <textarea
                value={proofContent}
                onChange={e => setProofContent(e.target.value)}
                placeholder="Paste your proof here. Include your verification code."
                style={{
                  width: '100%', padding: '13px 14px',
                  background: '#131720', border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 12, color: '#EEF2FF',
                  fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                  outline: 'none', resize: 'vertical', minHeight: 120,
                  marginBottom: SPACING.md,
                }}
              />
            ) : (
              <div style={{
                border: '2px dashed rgba(255,255,255,0.12)',
                borderRadius: 18, padding: '36px 20px',
                textAlign: 'center', cursor: 'pointer',
                marginBottom: SPACING.md, transition: 'all 0.2s',
              }}
                onClick={() => fileInputRef.current?.click()}
              >
                <div style={{ fontSize: 32, marginBottom: 8 }}>📎</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#EEF2FF', marginBottom: 4 }}>
                  Tap to upload proof file
                </div>
                <div style={{ fontSize: 12, color: '#454F64' }}>
                  Images, PDF, or video · Max 50MB
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) setProofContent(URL.createObjectURL(file))
              }}
              style={{ display: 'none' }}
            />

            {submitError && (
              <div style={{
                padding: SPACING.md, background: 'rgba(255,71,87,0.1)',
                border: `1px solid ${COLORS.stop}`, borderRadius: RADII.md,
                color: COLORS.stop, fontSize: '0.9rem', marginBottom: SPACING.md,
              }}>
                ❌ {submitError}
              </div>
            )}

            {/* Submit button */}
            <button
              onClick={() => submitProof(proofContent, '', task.proofType)}
              disabled={isSubmitting || !proofContent}
              style={{
                width: '100%', padding: '16px 24px',
                background: proofContent ? '#00D68F' : 'rgba(0,214,143,0.1)',
                border: 'none', borderRadius: 12,
                color: proofContent ? '#07090E' : COLORS.textMuted,
                fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 700,
                cursor: isSubmitting || !proofContent ? 'wait' : 'pointer',
                boxShadow: proofContent ? '0 0 24px rgba(0,214,143,0.25)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              {isSubmitting ? '⏳ Submitting...' : '🚀 Submit Proof →'}
            </button>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════
            SUCCESS STATE — Proof submitted
            ═══════════════════════════════════════════════════════════ */}
        {isSubmitted && (
          <div style={{
            background: '#131720', border: '1px solid rgba(0,214,143,0.3)',
            borderRadius: 18, padding: SPACING.lg, textAlign: 'center',
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: SPACING.md }}>✓</div>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, color: '#00D68F', marginBottom: SPACING.md }}>
              PROOF SUBMITTED
            </div>
            <div style={{ fontSize: 14, color: '#8892A8', lineHeight: 1.6, marginBottom: SPACING.lg }}>
              Your work is locked in. You'll earn{' '}
              <span style={{ color: '#00D68F', fontWeight: 700 }}>{agreedReward ?? netPayout}π</span>
              {' '}when approved. Auto-approved in 72h if no response.
            </div>
            <div style={{
              display: 'flex', gap: SPACING.md,
            }}>
              <Link href="/feed" style={{
                flex: 1, padding: SPACING.md, background: '#0095FF',
                color: '#fff', borderRadius: 12, textDecoration: 'none',
                fontWeight: 700, textAlign: 'center',
              }}>
                Find next task →
              </Link>
              <Link href="/dashboard" style={{
                flex: 1, padding: SPACING.md, background: 'rgba(255,255,255,0.07)',
                color: COLORS.textSecondary, borderRadius: 12, textDecoration: 'none',
                fontWeight: 700, textAlign: 'center',
              }}>
                View earnings
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
