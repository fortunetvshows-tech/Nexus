'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePiAuth }        from '@/hooks/use-pi-auth'
import { useTaskCreation, CATEGORIES, PROOF_TYPES, INITIAL_FORM }
  from '@/hooks/use-task-creation'
import { Navigation }       from '@/components/Navigation'
import { FeeBreakdown }     from '@/components/FeeBreakdown'

const inputStyle = {
  width:        '100%',
  padding:      '0.75rem 1rem',
  background:   '#1f2937',
  border:       '1px solid #374151',
  borderRadius: '8px',
  color:        '#ffffff',
  fontSize:     '0.9rem',
  outline:      'none',
  boxSizing:    'border-box' as const,
}

const labelStyle = {
  display:      'block',
  fontSize:     '0.8rem',
  fontWeight:   '500' as const,
  color:        '#9ca3af',
  marginBottom: '0.4rem',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
}

const fieldStyle = {
  marginBottom: '1.25rem',
}

export default function EmployerPage() {
  const { user, authenticate, isLoading: authLoading } = usePiAuth()
  const {
    form,
    updateField,
    totalCost,
    step,
    taskId,
    txid,
    error,
    isProcessing,
    proceedToReview,
    initiatePayment,
    backToForm,
    reset,
  } = useTaskCreation(user?.piUid ?? null)

  const [myTasks, setMyTasks]       = useState<Array<{
    id:             string
    title:          string
    category:       string
    piReward:       number
    slotsAvailable: number
    slotsRemaining: number
    taskStatus:     string
    createdAt:      string
  }>>([])
  const [tasksLoading, setTasksLoading] = useState(false)

  // Fetch employer's posted tasks when authenticated
  useEffect(() => {
    if (!user?.piUid) return

    setTasksLoading(true)
    fetch('/api/employer/tasks', {
      headers: { 'x-pi-uid': user.piUid },
    })
      .then(r => r.json())
      .then(d => {
        if (d.tasks) setMyTasks(d.tasks)
        setTasksLoading(false)
      })
      .catch(() => setTasksLoading(false))
  }, [user?.piUid])

  if (!user) {
    return (
      <div style={{
        minHeight:      '100vh',
        background:     '#0f0f0f',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        flexDirection:  'column',
        gap:            '1rem',
        fontFamily:     'system-ui, sans-serif',
      }}>
        <p style={{ color: '#9ca3af' }}>
          Sign in to post tasks
        </p>
        <button
          onClick={authenticate}
          disabled={authLoading}
          style={{
            padding:      '0.75rem 2rem',
            background:   'linear-gradient(135deg, #7B3FE4, #A855F7)',
            color:        'white',
            border:       'none',
            borderRadius: '10px',
            fontSize:     '1rem',
            fontWeight:   '600',
            cursor:       authLoading ? 'not-allowed' : 'pointer',
          }}
        >
          {authLoading ? 'Connecting...' : 'Connect with Pi'}
        </button>
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
        maxWidth: '600px',
        margin:   '0 auto',
        padding:  '80px 1rem 4rem',
      }}>

        {/* My Posted Tasks — shown when on form step or after success */}
        {(step === 'form' || step === 'success') && myTasks.length > 0 && (
          <div style={{
            marginBottom: '2rem',
          }}>
            <h2 style={{
              margin:     '0 0 1rem',
              fontSize:   '1rem',
              fontWeight: '600',
              color:      '#9ca3af',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              My Posted Tasks
            </h2>
            <div style={{
              display:       'flex',
              flexDirection: 'column',
              gap:           '0.75rem',
            }}>
              {myTasks.map(task => (
                <div key={task.id} style={{
                  background:   '#111827',
                  border:       '1px solid #1f2937',
                  borderRadius: '12px',
                  padding:      '1rem 1.25rem',
                  display:      'flex',
                  justifyContent: 'space-between',
                  alignItems:   'center',
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontWeight: '600',
                      fontSize:   '0.9rem',
                      color:      '#ffffff',
                      marginBottom: '0.25rem',
                    }}>
                      {task.title}
                    </div>
                    <div style={{
                      fontSize: '0.78rem',
                      color:    '#6b7280',
                    }}>
                      {task.category}
                      {' · '}
                      {task.piReward}π per slot
                      {' · '}
                      {task.slotsRemaining}/{task.slotsAvailable} slots left
                    </div>
                  </div>
                  <Link
                    href={`/review/${task.id}`}
                    style={{
                      padding:        '0.5rem 1rem',
                      background:     'linear-gradient(135deg, #7B3FE4, #A855F7)',
                      color:          'white',
                      borderRadius:   '8px',
                      fontSize:       '0.8rem',
                      fontWeight:     '500',
                      textDecoration: 'none',
                      whiteSpace:     'nowrap',
                      marginLeft:     '1rem',
                    }}
                  >
                    Review →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step: Form */}
        {step === 'form' && (
          <>
            <div style={{ marginBottom: '2rem' }}>
              <h1 style={{
                margin:   '0 0 0.5rem',
                fontSize: '1.5rem',
                fontWeight: '700',
              }}>
                Post a Task
              </h1>
              <p style={{ margin: '0', color: '#6b7280', fontSize: '0.875rem' }}>
                Define the work, set the reward, and lock Pi in escrow
              </p>
            </div>

            {error && (
              <div style={{
                padding:      '0.875rem 1rem',
                background:   '#450a0a',
                border:       '1px solid #dc2626',
                borderRadius: '8px',
                color:        '#fca5a5',
                marginBottom: '1.5rem',
                fontSize:     '0.875rem',
              }}>
                {error}
              </div>
            )}

            {/* Section: Basic Info */}
            <div style={{
              background:   '#111827',
              border:       '1px solid #1f2937',
              borderRadius: '12px',
              padding:      '1.5rem',
              marginBottom: '1rem',
            }}>
              <h3 style={{
                margin:       '0 0 1.25rem',
                fontSize:     '0.95rem',
                fontWeight:   '600',
                color:        '#a78bfa',
              }}>
                Task Details
              </h3>

              <div style={fieldStyle}>
                <label style={labelStyle}>Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => updateField('title', e.target.value)}
                  placeholder="e.g. Translate product description French → English"
                  maxLength={200}
                  style={inputStyle}
                />
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>Category</label>
                <select
                  value={form.category}
                  onChange={e => updateField('category', e.target.value)}
                  style={inputStyle}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>Proof Type</label>
                <select
                  value={form.proofType}
                  onChange={e => updateField('proofType', e.target.value)}
                  style={inputStyle}
                >
                  {PROOF_TYPES.map(pt => (
                    <option key={pt.value} value={pt.value}>
                      {pt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>Description</label>
                <textarea
                  value={form.description}
                  onChange={e => updateField('description', e.target.value)}
                  placeholder="What is this task about? What will workers be doing?"
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              <div style={{ ...fieldStyle, marginBottom: 0 }}>
                <label style={labelStyle}>Worker Instructions</label>
                <textarea
                  value={form.instructions}
                  onChange={e => updateField('instructions', e.target.value)}
                  placeholder="Step-by-step instructions for workers. Be specific."
                  rows={4}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>
            </div>

            {/* Section: Economics */}
            <div style={{
              background:   '#111827',
              border:       '1px solid #1f2937',
              borderRadius: '12px',
              padding:      '1.5rem',
              marginBottom: '1rem',
            }}>
              <h3 style={{
                margin:     '0 0 1.25rem',
                fontSize:   '0.95rem',
                fontWeight: '600',
                color:      '#a78bfa',
              }}>
                Economics
              </h3>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                marginBottom: '1.25rem',
              }}>
                <div>
                  <label style={labelStyle}>Pi per slot</label>
                  <input
                    type="number"
                    value={form.piReward}
                    onChange={e => updateField('piReward', e.target.value)}
                    placeholder="1.0"
                    min="0.1"
                    step="0.1"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Number of slots</label>
                  <input
                    type="number"
                    value={form.slotsAvailable}
                    onChange={e => updateField('slotsAvailable', e.target.value)}
                    placeholder="10"
                    min="1"
                    max="10000"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                marginBottom: '1.25rem',
              }}>
                <div>
                  <label style={labelStyle}>Est. time (minutes)</label>
                  <input
                    type="number"
                    value={form.timeEstimateMin}
                    onChange={e => updateField('timeEstimateMin', e.target.value)}
                    placeholder="15"
                    min="1"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Deadline (hours)</label>
                  <select
                    value={form.deadlineHours}
                    onChange={e => updateField('deadlineHours', e.target.value)}
                    style={inputStyle}
                  >
                    <option value="24">24 hours</option>
                    <option value="48">48 hours</option>
                    <option value="72">72 hours</option>
                    <option value="168">7 days</option>
                    <option value="336">14 days</option>
                    <option value="720">30 days</option>
                  </select>
                </div>
              </div>

              {/* Total cost preview */}
              {parseFloat(totalCost()) > 0 && (
                <div style={{
                  background:   '#0f172a',
                  borderRadius: '8px',
                  padding:      '1rem',
                  display:      'flex',
                  justifyContent: 'space-between',
                  alignItems:   'center',
                }}>
                  <div>
                    <div style={{
                      fontSize: '0.75rem',
                      color:    '#6b7280',
                    }}>
                      Total escrow required
                    </div>
                    <div style={{
                      fontSize:   '0.8rem',
                      color:      '#9ca3af',
                      marginTop:  '0.2rem',
                    }}>
                      {form.piReward}π × {form.slotsAvailable} slots
                    </div>
                  </div>
                  <div style={{
                    fontSize:    '1.75rem',
                    fontWeight:  '700',
                    background:  'linear-gradient(135deg, #7B3FE4, #A855F7)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor:  'transparent',
                  }}>
                    {totalCost()}π
                  </div>
                </div>
              )}

              {/* Fee breakdown */}
              {form.piReward && parseFloat(form.piReward) > 0 && (
                <div style={{ marginTop: '1.25rem' }}>
                  <FeeBreakdown
                    rewardPi={parseFloat(form.piReward)}
                    slots={parseInt(form.slotsAvailable) || 1}
                    showFor="employer"
                  />
                </div>
              )}
            </div>

            {/* Section: Worker Requirements */}
            <div style={{
              background:   '#111827',
              border:       '1px solid #1f2937',
              borderRadius: '12px',
              padding:      '1.5rem',
              marginBottom: '1rem',
            }}>
              <h3 style={{
                margin:     '0 0 1.25rem',
                fontSize:   '0.95rem',
                fontWeight: '600',
                color:      '#a78bfa',
              }}>
                Worker Requirements
              </h3>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                marginBottom: '1.25rem',
              }}>
                <div>
                  <label style={labelStyle}>Min reputation</label>
                  <input
                    type="number"
                    value={form.minReputation}
                    onChange={e => updateField('minReputation', e.target.value)}
                    min="0"
                    max="1000"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Min badge level</label>
                  <select
                    value={form.minBadgeLevel}
                    onChange={e => updateField('minBadgeLevel', e.target.value)}
                    style={inputStyle}
                  >
                    <option value="UNVERIFIED">Any worker</option>
                    <option value="BEGINNER">Beginner+</option>
                    <option value="COMPETENT">Competent+</option>
                    <option value="PROFICIENT">Proficient+</option>
                    <option value="EXPERT">Expert only</option>
                  </select>
                </div>
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>KYC level required</label>
                <select
                  value={form.targetKycLevel}
                  onChange={e => updateField('targetKycLevel', e.target.value)}
                  style={inputStyle}
                >
                  <option value="0">No requirement</option>
                  <option value="1">Basic KYC</option>
                  <option value="2">Full KYC</option>
                </select>
              </div>

              <div style={{ ...fieldStyle, marginBottom: 0 }}>
                <label style={labelStyle}>Tags (comma separated)</label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={e => updateField('tags', e.target.value)}
                  placeholder="e.g. french, translation, product"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={proceedToReview}
              style={{
                width:        '100%',
                padding:      '1rem',
                background:   'linear-gradient(135deg, #7B3FE4, #A855F7)',
                color:        'white',
                border:       'none',
                borderRadius: '12px',
                fontSize:     '1rem',
                fontWeight:   '600',
                cursor:       'pointer',
                marginTop:    '0.5rem',
              }}
            >
              Review Task →
            </button>
          </>
        )}

        {/* Step: Review */}
        {step === 'review' && (
          <>
            <div style={{ marginBottom: '2rem' }}>
              <h1 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem', fontWeight: '700' }}>
                Review Your Task
              </h1>
              <p style={{ margin: '0', color: '#6b7280', fontSize: '0.875rem' }}>
                Confirm all details before payment
              </p>
            </div>

            <div style={{
              background:   '#111827',
              border:       '1px solid #1f2937',
              borderRadius: '12px',
              padding:      '1.5rem',
              marginBottom: '1.5rem',
            }}>
              {[
                { label: 'Title',        value: form.title        },
                { label: 'Category',     value: form.category     },
                { label: 'Proof type',   value: form.proofType    },
                { label: 'Description',  value: form.description  },
                { label: 'Instructions', value: form.instructions },
                { label: 'Pi per slot',  value: `${form.piReward}π` },
                { label: 'Slots',        value: form.slotsAvailable },
                { label: 'Deadline',     value: `${form.deadlineHours} hours` },
                { label: 'Min rep',      value: form.minReputation },
                { label: 'Badge level',  value: form.minBadgeLevel },
              ].map(row => (
                <div key={row.label} style={{
                  display:       'flex',
                  justifyContent: 'space-between',
                  padding:       '0.6rem 0',
                  borderBottom:  '1px solid #1f2937',
                  fontSize:      '0.875rem',
                }}>
                  <span style={{ color: '#6b7280' }}>{row.label}</span>
                  <span style={{
                    color:    '#e5e7eb',
                    maxWidth: '60%',
                    textAlign: 'right',
                    wordBreak: 'break-word',
                  }}>
                    {row.value}
                  </span>
                </div>
              ))}

              <div style={{
                display:        'flex',
                justifyContent: 'space-between',
                padding:        '1rem 0 0',
                fontSize:       '1rem',
                fontWeight:     '600',
              }}>
                <span style={{ color: '#9ca3af' }}>Total escrow</span>
                <span style={{
                  background:          'linear-gradient(135deg, #7B3FE4, #A855F7)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor:  'transparent',
                  fontSize:            '1.3rem',
                }}>
                  {totalCost()}π
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={backToForm}
                style={{
                  flex:         1,
                  padding:      '0.875rem',
                  background:   'transparent',
                  border:       '1px solid #374151',
                  borderRadius: '10px',
                  color:        '#9ca3af',
                  fontSize:     '0.9rem',
                  cursor:       'pointer',
                }}
              >
                ← Edit
              </button>
              <button
                onClick={initiatePayment}
                disabled={isProcessing}
                style={{
                  flex:         2,
                  padding:      '0.875rem',
                  background:   'linear-gradient(135deg, #7B3FE4, #A855F7)',
                  color:        'white',
                  border:       'none',
                  borderRadius: '10px',
                  fontSize:     '0.9rem',
                  fontWeight:   '600',
                  cursor:       isProcessing ? 'not-allowed' : 'pointer',
                }}
              >
                Pay {totalCost()}π & Post Task
              </button>
            </div>
          </>
        )}

        {/* Step: Payment / Creating */}
        {(step === 'payment' || step === 'creating') && (
          <div style={{
            textAlign:      'center',
            padding:        '4rem 2rem',
          }}>
            <div style={{
              width:       '60px',
              height:      '60px',
              borderRadius: '50%',
              background:  'linear-gradient(135deg, #7B3FE4, #A855F7)',
              margin:      '0 auto 1.5rem',
              display:     'flex',
              alignItems:  'center',
              justifyContent: 'center',
              fontSize:    '1.5rem',
            }}>
              {step === 'payment' ? '💳' : '⚡'}
            </div>
            <h2 style={{ margin: '0 0 0.5rem' }}>
              {step === 'payment'
                ? 'Complete payment in Pi Browser'
                : 'Creating your task...'}
            </h2>
            <p style={{ color: '#6b7280', margin: '0', fontSize: '0.875rem' }}>
              {step === 'payment'
                ? 'Approve the Pi payment to lock escrow'
                : 'Setting up task and locking escrow atomically'}
            </p>
          </div>
        )}

        {/* Step: Success */}
        {step === 'success' && (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <div style={{
              width:        '70px',
              height:       '70px',
              borderRadius: '50%',
              background:   '#14532d',
              border:       '2px solid #16a34a',
              margin:       '0 auto 1.5rem',
              display:      'flex',
              alignItems:   'center',
              justifyContent: 'center',
              fontSize:     '2rem',
            }}>
              ✓
            </div>
            <h2 style={{ margin: '0 0 0.5rem' }}>Task Posted!</h2>
            <p style={{
              color:    '#9ca3af',
              margin:   '0 0 2rem',
              fontSize: '0.875rem',
            }}>
              Your task is live. Workers can now see and claim slots.
            </p>

            <div style={{
              background:   '#111827',
              border:       '1px solid #1f2937',
              borderRadius: '10px',
              padding:      '1rem',
              marginBottom: '2rem',
              textAlign:    'left',
            }}>
              <div style={{
                fontSize: '0.75rem',
                color:    '#6b7280',
                marginBottom: '0.3rem',
              }}>
                Task ID
              </div>
              <code style={{
                fontSize:  '0.8rem',
                color:     '#a78bfa',
                wordBreak: 'break-all',
              }}>
                {taskId}
              </code>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Link
                href={`/review/${taskId}`}
                style={{
                  flex:           1,
                  display:        'block',
                  padding:        '0.875rem',
                  background:     'linear-gradient(135deg, #7B3FE4, #A855F7)',
                  color:          'white',
                  textDecoration: 'none',
                  fontSize:       '0.9rem',
                  fontWeight:     '600',
                  textAlign:      'center',
                  borderRadius:   '10px',
                }}
              >
                Review submissions →
              </Link>
              <Link
                href="/feed"
                style={{
                  flex:           1,
                  display:        'block',
                  padding:        '0.875rem',
                  background:     'transparent',
                  border:         '1px solid #374151',
                  borderRadius:   '10px',
                  color:          '#9ca3af',
                  textDecoration: 'none',
                  fontSize:       '0.9rem',
                  textAlign:      'center',
                }}
              >
                View feed
              </Link>
              <button
                onClick={reset}
                style={{
                  flex:         1,
                  padding:      '0.875rem',
                  background:   '#374151',
                  color:        'white',
                  border:       'none',
                  borderRadius: '10px',
                  fontSize:     '0.9rem',
                  fontWeight:   '600',
                  cursor:       'pointer',
                }}
              >
                Post another
              </button>
            </div>
          </div>
        )}

        {/* Step: Error */}
        {step === 'error' && (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <div style={{
              width:        '70px',
              height:       '70px',
              borderRadius: '50%',
              background:   '#450a0a',
              border:       '2px solid #dc2626',
              margin:       '0 auto 1.5rem',
              display:      'flex',
              alignItems:   'center',
              justifyContent: 'center',
              fontSize:     '2rem',
            }}>
              ✕
            </div>
            <h2 style={{ margin: '0 0 0.5rem' }}>Something went wrong</h2>
            <p style={{
              color:    '#fca5a5',
              margin:   '0 0 2rem',
              fontSize: '0.875rem',
            }}>
              {error}
            </p>
            {txid && (
              <div style={{
                background:   '#111827',
                borderRadius: '8px',
                padding:      '0.75rem',
                marginBottom: '1.5rem',
                fontSize:     '0.8rem',
                color:        '#9ca3af',
              }}>
                Payment was recorded (txid: {txid?.slice(0, 16)}...)
                <br />
                Contact support with this ID if Pi was deducted.
              </div>
            )}
            <button
              onClick={reset}
              style={{
                padding:      '0.875rem 2rem',
                background:   'linear-gradient(135deg, #7B3FE4, #A855F7)',
                color:        'white',
                border:       'none',
                borderRadius: '10px',
                fontSize:     '0.9rem',
                fontWeight:   '600',
                cursor:       'pointer',
              }}
            >
              Try again
            </button>
          </div>
        )}

      </main>
    </div>
  )
}
