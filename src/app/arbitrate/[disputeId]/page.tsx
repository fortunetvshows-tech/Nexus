'use client'

import { useEffect, useState, useRef, use } from 'react'
import { usePiAuth }  from '@/hooks/use-pi-auth'
import { Navigation } from '@/components/Navigation'
import { COLORS, FONTS, RADII, SHADOWS, GRADIENTS, SPACING, statusStyle } from '@/lib/design/tokens'

export default function ArbitrateDisputePage({
  params,
}: {
  params: Promise<{ disputeId: string }>
}) {
  const resolvedParams = use(params)
  const disputeId      = resolvedParams?.disputeId
  const { user, authenticate, isSdkReady } = usePiAuth()
  const hasAutoAuthenticated = useRef(false)

  useEffect(() => {
    if (isSdkReady && !user && !hasAutoAuthenticated.current) {
      hasAutoAuthenticated.current = true
      authenticate()
    }
  }, [isSdkReady, user, authenticate])

  const [dispute,     setDispute]     = useState<Record<string, unknown> | null>(null)
  const [submission,  setSubmission]  = useState<Record<string, unknown> | null>(null)
  const [task,        setTask]        = useState<Record<string, unknown> | null>(null)
  const [isLoading,   setIsLoading]   = useState(true)
  const [vote,        setVote]        = useState<'worker' | 'employer' | null>(null)
  const [reasoning,   setReasoning]   = useState('')
  const [isVoting,    setIsVoting]    = useState(false)
  const [voted,       setVoted]       = useState(false)
  const [voteResult,  setVoteResult]  = useState<Record<string, unknown> | null>(null)
  const [error,       setError]       = useState<string | null>(null)

  useEffect(() => {
    if (!disputeId || !user?.piUid) return

    // Fetch dispute details directly from Supabase via API
    fetch(`${window.location.origin}/api/arbitration/dispute/${disputeId}`, {
      headers: { 'x-pi-uid': user.piUid },
    })
      .then(r => r.json())
      .then(d => {
        if (d.dispute)    setDispute(d.dispute)
        if (d.submission) setSubmission(d.submission)
        if (d.task)       setTask(d.task)
        setIsLoading(false)
      })
      .catch(() => setIsLoading(false))
  }, [disputeId, user?.piUid])

  const handleVote = async () => {
    if (!vote || !user?.piUid || reasoning.trim().length < 10) return

    setIsVoting(true)
    setError(null)

    try {
      const res = await fetch(
        `${window.location.origin}/api/arbitration/vote`,
        {
          method:  'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-pi-uid':     user.piUid,
          },
          body: JSON.stringify({ disputeId, vote, reasoning }),
        }
      )

      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? data.error ?? 'Vote failed')

      setVoteResult(data)
      setVoted(true)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Vote failed')
    } finally {
      setIsVoting(false)
    }
  }

  if (!user || isLoading) {
    return (
      <div style={{
        minHeight:  '100vh',
        background: '#0f0f0f',
        fontFamily: 'system-ui, sans-serif',
      }}>
        <Navigation currentPage="home" />
        <div style={{
          maxWidth: '680px',
          margin:   '0 auto',
          padding:  '80px 1rem',
        }}>
          <div style={{
            background:   '#111827',
            borderRadius: '16px',
            height:       '400px',
            border:       '1px solid #1f2937',
          }} />
        </div>
      </div>
    )
  }

  if (voted) {
    return (
      <div style={{
        minHeight:  '100vh',
        background: '#0f0f0f',
        fontFamily: 'system-ui, sans-serif',
        color:      '#ffffff',
      }}>
        <Navigation currentPage="home" />
        <main style={{
          maxWidth:  '480px',
          margin:    '0 auto',
          padding:   '80px 1rem 4rem',
          textAlign: 'center',
        }}>
          <div style={{
            width:          '70px',
            height:         '70px',
            borderRadius:   '50%',
            background:     COLORS.emeraldDim,
            border:         `2px solid ${COLORS.emerald}`,
            margin:         '0 auto 1.5rem',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            fontSize:       '2rem',
          }}>
            ✓
          </div>
          <h2 style={{ margin: '0 0 0.5rem' }}>Vote recorded</h2>
          <p style={{ color: COLORS.textSecondary, margin: '0 0 1.5rem', fontSize: '0.875rem' }}>
            {(voteResult?.resolved as boolean)
              ? 'The dispute has been resolved based on the votes.'
              : 'Waiting for other arbitrators to vote.'}
          </p>
          <a href="/arbitrate" style={{
            display:        'inline-block',
            padding:        '0.75rem 1.5rem',
            background:     GRADIENTS.indigo,
            color:          'white',
            borderRadius:   '10px',
            textDecoration: 'none',
            fontSize:       '0.9rem',
            fontWeight:     '600',
          }}>
            Back to arbitration panel
          </a>
        </main>
      </div>
    )
  }

  return (
    <div style={{
      minHeight:  '100vh',
      background: COLORS.bgBase,
      fontFamily: 'system-ui, sans-serif',
      color:      COLORS.textPrimary,
    }}>
      <Navigation currentPage="home" />

      <main style={{
        maxWidth: '680px',
        margin:   '0 auto',
        padding:  '80px 1rem 4rem',
      }}>
        <a href="/arbitrate" style={{
          color:          COLORS.textMuted,
          fontSize:       '0.875rem',
          textDecoration: 'none',
          display:        'inline-block',
          marginBottom:   '1.5rem',
        }}>
          ← Back to panel
        </a>

        <h1 style={{ margin: '0 0 2rem', fontSize: '1.4rem', fontWeight: '700' }}>
          Review Dispute
        </h1>

        {/* Evidence sections */}
        {task && (
          <div style={{
            background:   COLORS.bgSurface,
            border:       `1px solid ${COLORS.border}`,
            borderRadius: '12px',
            padding:      '1.25rem',
            marginBottom: '1rem',
          }}>
            <h3 style={{
              margin:        '0 0 0.75rem',
              fontSize:      '0.75rem',
              fontWeight:    '600',
              color:         '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Task Instructions
            </h3>
            <p style={{
              margin:     '0',
              fontSize:   '0.875rem',
              color:      '#d1d5db',
              lineHeight: '1.6',
            }}>
              {task.instructions as string}
            </p>
          </div>
        )}

        {submission && (
          <div style={{
            background:   COLORS.bgSurface,
            border:       `1px solid ${COLORS.border}`,
            borderRadius: '12px',
            padding:      '1.25rem',
            marginBottom: '1rem',
          }}>
            <h3 style={{
              margin:        '0 0 0.75rem',
              fontSize:      '0.75rem',
              fontWeight:    '600',
              color:         '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Worker's Proof
            </h3>
            <p style={{
              margin:      '0 0 1rem',
              fontSize:    '0.875rem',
              color:       '#d1d5db',
              lineHeight:  '1.6',
              whiteSpace:  'pre-wrap',
            }}>
              {submission.proofContent as string}
            </p>
            <div style={{
              fontSize:  '0.75rem',
              color:     COLORS.red,
              marginTop: '0.75rem',
            }}>
              Rejection reason: "{submission.rejectionReason as string}"
            </div>
          </div>
        )}

        {dispute && (
          <div style={{
            background:   COLORS.bgSurface,
            border:       `1px solid ${COLORS.border}`,
            borderRadius: '12px',
            padding:      '1.25rem',
            marginBottom: '2rem',
          }}>
            <h3 style={{
              margin:        '0 0 0.75rem',
              fontSize:      '0.75rem',
              fontWeight:    '600',
              color:         '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Worker's Dispute Argument
            </h3>
            <p style={{
              margin:     '0',
              fontSize:   '0.875rem',
              color:      '#d1d5db',
              lineHeight: '1.6',
            }}>
              {((dispute.tier1Result as Record<string, unknown>)
                ?.workerReason as string) ?? 'No argument provided'}
            </p>
          </div>
        )}

        {/* Vote section */}
        <div style={{
          background:   COLORS.bgSurface,
          border:       `1px solid ${COLORS.indigo}`,
          borderRadius: '16px',
          padding:      '1.5rem',
        }}>
          <h3 style={{
            margin:     '0 0 1rem',
            fontSize:   '1rem',
            fontWeight: '600',
          }}>
            Cast your vote
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap:     '0.75rem',
            marginBottom: '1.25rem',
          }}>
            <button
              onClick={() => setVote('worker')}
              style={{
                padding:      '0.875rem',
                background:   vote === 'worker' ? COLORS.emeraldDim : COLORS.bgElevated,
                border:       `2px solid ${vote === 'worker' ? COLORS.emerald : COLORS.borderAccent}`,
                borderRadius: '10px',
                color:        vote === 'worker' ? COLORS.emerald : COLORS.textSecondary,
                fontSize:     '0.9rem',
                fontWeight:   '600',
                cursor:       'pointer',
              }}
            >
              Worker is right
            </button>
            <button
              onClick={() => setVote('employer')}
              style={{
                padding:      '0.875rem',
                background:   vote === 'employer' ? COLORS.redDim : COLORS.bgElevated,
                border:       `2px solid ${vote === 'employer' ? COLORS.red : COLORS.borderAccent}`,
                borderRadius: '10px',
                color:        vote === 'employer' ? COLORS.red : COLORS.textSecondary,
                fontSize:     '0.9rem',
                fontWeight:   '600',
                cursor:       'pointer',
              }}
            >
              Employer is right
            </button>
          </div>

          <textarea
            value={reasoning}
            onChange={e => setReasoning(e.target.value)}
            placeholder="Explain your reasoning (min 10 characters). Consider: Did the worker follow the instructions? Was the rejection reason valid?"
            rows={4}
            style={{
              width:        '100%',
              padding:      '0.875rem',
              background:   COLORS.bgElevated,
              border:       `1px solid ${COLORS.borderAccent}`,
              borderRadius: '8px',
              color:        COLORS.textPrimary,
              fontSize:     '0.875rem',
              resize:       'vertical',
              outline:      'none',
              boxSizing:    'border-box' as const,
              marginBottom: '1rem',
            }}
          />

          {error && (
            <div style={{
              padding:      '0.75rem',
              background:   COLORS.redDim,
              borderRadius: '8px',
              color:        COLORS.red,
              fontSize:     '0.875rem',
              marginBottom: '1rem',
            }}>
              {error}
            </div>
          )}

          <button
            onClick={handleVote}
            disabled={
              !vote ||
              reasoning.trim().length < 10 ||
              isVoting
            }
            style={{
              width:        '100%',
              padding:      '1rem',
              background:   !vote || reasoning.trim().length < 10
                              ? COLORS.borderAccent
                              : GRADIENTS.indigo,
              color:        'white',
              border:       'none',
              borderRadius: '12px',
              fontSize:     '1rem',
              fontWeight:   '600',
              cursor:       !vote || reasoning.trim().length < 10 || isVoting
                              ? 'not-allowed'
                              : 'pointer',
            }}
          >
            {isVoting ? 'Submitting vote...' : 'Submit vote'}
          </button>
        </div>
      </main>
    </div>
  )
}
