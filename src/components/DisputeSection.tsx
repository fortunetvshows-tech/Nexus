'use client'

import { useState } from 'react'
import { COLORS, FONTS, RADII, SHADOWS, GRADIENTS, SPACING, statusStyle } from '@/lib/design/tokens'

interface DisputeSectionProps {
  submissionId: string
  piUid:        string
}

type DisputeState =
  | 'idle'
  | 'filing'
  | 'processing'
  | 'escalated'
  | 'employer_upheld'
  | 'error'

export function DisputeSection({
  submissionId,
  piUid,
}: DisputeSectionProps) {

  const [state,      setState]      = useState<DisputeState>('idle')
  const [reason,     setReason]     = useState('')
  const [resolution, setResolution] = useState<string | null>(null)
  const [checks,     setChecks]     = useState<Record<string, unknown> | null>(null)
  const [error,      setError]      = useState<string | null>(null)

  const handleSubmitDispute = async () => {
    if (reason.trim().length < 20) {
      setError('Please provide at least 20 characters explaining your case')
      return
    }

    setState('processing')
    setError(null)

    try {
      const res = await fetch('/api/disputes', {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-pi-uid':     piUid,
        },
        body: JSON.stringify({ submissionId, reason }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message ?? data.error ?? 'Failed to file dispute')
      }

      setResolution(data.resolution)
      setChecks(data.checks)

      if (data.resolution === 'ESCALATE_TO_TIER2') {
        setState('escalated')
      } else {
        setState('employer_upheld')
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to file dispute')
      setState('error')
    }
  }

  if (state === 'idle' || state === 'filing') {
    return (
      <div style={{
        background:   '#111827',
        border:       '1px solid #374151',
        borderRadius: '16px',
        padding:      '1.5rem',
        marginTop:    '1rem',
      }}>
        <h3 style={{
          margin:     '0 0 0.5rem',
          fontSize:   '1rem',
          fontWeight: '600',
          color:      '#ffffff',
        }}>
          Dispute this rejection
        </h3>
        <p style={{
          margin:   '0 0 1rem',
          fontSize: '0.875rem',
          color:    '#6b7280',
        }}>
          If you believe your work was unfairly rejected, explain your case
          below. Your dispute will be reviewed automatically first, then
          by peer arbitrators if needed.
        </p>

        {state === 'idle' && (
          <button
            onClick={() => setState('filing')}
            style={{
              padding:      '0.75rem 1.5rem',
              background:   'transparent',
              border:       '1px solid #6b7280',
              borderRadius: '8px',
              color:        '#9ca3af',
              fontSize:     '0.875rem',
              cursor:       'pointer',
            }}
          >
            File a dispute
          </button>
        )}

        {state === 'filing' && (
          <>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Explain why you believe your work meets the task requirements. Be specific about what you submitted and why it should be accepted. (min 20 characters)"
              rows={4}
              style={{
                width:        '100%',
                padding:      '0.875rem',
                background:   '#1f2937',
                border:       '1px solid #374151',
                borderRadius: '8px',
                color:        '#ffffff',
                fontSize:     '0.875rem',
                resize:       'vertical',
                outline:      'none',
                boxSizing:    'border-box' as const,
                marginBottom: '0.75rem',
              }}
            />

            {error && (
              <div style={{
                padding:      '0.75rem',
                background:   '#450a0a',
                borderRadius: '8px',
                color:        '#fca5a5',
                fontSize:     '0.875rem',
                marginBottom: '0.75rem',
              }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setState('idle')}
                style={{
                  flex:         1,
                  padding:      '0.75rem',
                  background:   'transparent',
                  border:       '1px solid #374151',
                  borderRadius: '8px',
                  color:        '#6b7280',
                  fontSize:     '0.875rem',
                  cursor:       'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitDispute}
                disabled={reason.trim().length < 20}
                style={{
                  flex:         2,
                  padding:      '0.75rem',
                  background:   reason.trim().length < 20
                                  ? '#374151'
                                  : '#7B3FE4',
                  border:       'none',
                  borderRadius: '8px',
                  color:        'white',
                  fontSize:     '0.875rem',
                  fontWeight:   '600',
                  cursor:       reason.trim().length < 20
                                  ? 'not-allowed'
                                  : 'pointer',
                }}
              >
                Submit dispute
              </button>
            </div>
          </>
        )}
      </div>
    )
  }

  if (state === 'processing') {
    return (
      <div style={{
        background:   '#111827',
        border:       '1px solid #374151',
        borderRadius: '16px',
        padding:      '1.5rem',
        marginTop:    '1rem',
        textAlign:    'center',
      }}>
        <p style={{ color: '#9ca3af', margin: '0' }}>
          Reviewing your dispute...
        </p>
      </div>
    )
  }

  if (state === 'escalated') {
    return (
      <div style={{
        background:   '#111827',
        border:       '1px solid #7B3FE4',
        borderRadius: '16px',
        padding:      '1.5rem',
        marginTop:    '1rem',
      }}>
        <div style={{
          fontSize:     '1.5rem',
          marginBottom: '0.75rem',
        }}>
          ⚖️
        </div>
        <h3 style={{
          margin:     '0 0 0.5rem',
          fontSize:   '1rem',
          fontWeight: '600',
          color:      '#ffffff',
        }}>
          Dispute escalated to peer review
        </h3>
        <p style={{
          margin:   '0',
          fontSize: '0.875rem',
          color:    '#9ca3af',
        }}>
          Your case passed initial review. Three Pioneer arbitrators
          will review your submission and the employer's rejection
          within 48 hours. You will be notified of the outcome.
        </p>
      </div>
    )
  }

  if (state === 'employer_upheld') {
    return (
      <div style={{
        background:   '#111827',
        border:       '1px solid #374151',
        borderRadius: '16px',
        padding:      '1.5rem',
        marginTop:    '1rem',
      }}>
        <h3 style={{
          margin:     '0 0 0.5rem',
          fontSize:   '1rem',
          fontWeight: '600',
          color:      '#ffffff',
        }}>
          Dispute resolved — rejection upheld
        </h3>
        <p style={{
          margin:   '0 0 1rem',
          fontSize: '0.875rem',
          color:    '#9ca3af',
        }}>
          The automated review found the rejection was valid based on
          the evidence provided.
        </p>
        {checks && (
          <div style={{
            background:   '#0f172a',
            borderRadius: '8px',
            padding:      '0.875rem',
            fontSize:     '0.8rem',
            color:        '#6b7280',
          }}>
            Checks passed: {checks.passed as number}/3
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{
      background:   '#111827',
      border:       '1px solid #dc2626',
      borderRadius: '16px',
      padding:      '1.5rem',
      marginTop:    '1rem',
    }}>
      <p style={{ color: '#fca5a5', margin: '0', fontSize: '0.875rem' }}>
        {error ?? 'Something went wrong filing your dispute.'}
      </p>
    </div>
  )
}
