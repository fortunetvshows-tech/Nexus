'use client'

import React, { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { usePiAuth }        from '@/hooks/use-pi-auth'
import { useTaskCreation, PROOF_TYPES, INITIAL_FORM } from '@/hooks/use-task-creation'
import { TASK_CATEGORIES } from '@/lib/config/categories'
import { Navigation }       from '@/components/Navigation'
import { FeeBreakdown }     from '@/components/FeeBreakdown'
import { COLORS, FONTS, RADII, SHADOWS, GRADIENTS, SPACING, statusStyle } from '@/lib/design/tokens'

const inputStyle = {
  width:        '100%',
  padding:      '0.75rem 1rem',
  background:   COLORS.bgRaised,
  border:       `1px solid ${COLORS.borderAccent}`,
  borderRadius: RADII.md,
  color:        COLORS.textPrimary,
  fontSize:     '0.9rem',
  outline:      'none',
  boxSizing:    'border-box' as const,
}

const labelStyle = {
  display:      'block',
  fontSize:     '0.8rem',
  fontWeight:   '500' as const,
  color:        COLORS.textSecondary,
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

  const [dbCategories, setDbCategories] = useState<string[]>([])
  const [instructionFile, setInstructionFile] = useState<File | null>(null)
  const [instructionFileUrl, setInstructionFileUrl] = useState<string | null>(null)
  const [instructionFileName, setInstructionFileName] = useState<string | null>(null)
  const [isUploadingInstruction, setIsUploadingInstruction] = useState(false)
  const [instructionError, setInstructionError] = useState<string | null>(null)
  const instructionFileInputRef = useRef<HTMLInputElement>(null)
  
  // Form step tracking for 4-step flow
  const [formStep, setFormStep] = useState(0)
  const steps = ['Task Basics', 'Budget', 'Requirements', 'Launch']

  // Fetch categories from database
  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(data => {
        if (data.categories?.length) {
          setDbCategories(
            data.categories.map((c: any) => 
              `${(c.emoji || '').trim()} ${(c.name || '').trim()}`.trim()
            )
          )
        }
      })
      .catch(() => {
        // fallback to hardcoded if API fails
        setDbCategories(TASK_CATEGORIES)
      })
  }, [])

  const categoryList = dbCategories.length > 0 ? dbCategories : TASK_CATEGORIES

  if (!user) {
    return (
      <div style={{
        minHeight:      '100vh',
        background:     COLORS.bgBase,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        flexDirection:  'column',
        gap:            '1rem',
        fontFamily:     FONTS.sans,
      }}>
        <p style={{ color: COLORS.textSecondary }}>
          Sign in to post tasks
        </p>
        <button
          onClick={authenticate}
          disabled={authLoading}
          style={{
            padding:      '0.75rem 2rem',
            background:   `linear-gradient(135deg, ${COLORS.sapphire}, ${COLORS.sapphireDark})`,
            color:        'white',
            border:       `1px solid ${COLORS.cyan}`,
            borderRadius: RADII.lg,
            fontSize:     '1rem',
            fontWeight:   '600',
            cursor:       authLoading ? 'not-allowed' : 'pointer',
            boxShadow:    authLoading ? 'none' : SHADOWS.cyanGlow,
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
      background: COLORS.bgBase,
      fontFamily: FONTS.sans,
      color:      COLORS.textPrimary,
    }}>
      <Navigation currentPage="employer" />

      <main className="page-main">

        {/* Step: Form with 4-step progress */}
        {step === 'form' && (
          <>
            {/* 4-Step Progress Bar */}
            <div style={{
              display: 'flex', alignItems: 'center',
              padding: '16px 0px', marginBottom: 20,
            }}>
              {steps.map((stepLabel, i) => (
                <React.Fragment key={i}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: formStep > i
                        ? '#00C9A7'
                        : formStep === i
                        ? 'rgba(0,201,167,0.2)'
                        : 'rgba(255,255,255,0.06)',
                      border: formStep >= i
                        ? '2px solid #00C9A7'
                        : '2px solid rgba(255,255,255,0.12)',
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12, fontWeight: 700,
                      color: formStep > i ? '#07090E' : formStep === i ? '#33D9BC' : '#454F64',
                      transition: 'all 0.3s',
                    }}>
                      {formStep > i ? '✓' : i + 1}
                    </div>
                    <div style={{
                      fontSize: 9, marginTop: 4,
                      color: formStep >= i ? '#33D9BC' : '#454F64',
                      textTransform: 'uppercase', letterSpacing: '0.5px',
                      fontWeight: 700,
                    }}>
                      {stepLabel}
                    </div>
                  </div>
                  {i < steps.length - 1 && (
                    <div style={{
                      flex: 1, height: 1, marginBottom: 16,
                      background: formStep > i
                        ? '#00C9A7'
                        : 'rgba(255,255,255,0.07)',
                      transition: 'background 0.3s',
                    }} />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Form Steps */}
            {formStep === 0 && (
              <>
                <div style={{ marginBottom: '2rem' }}>
                  <h1 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem', fontWeight: '700' }}>
                    Task Basics
                  </h1>
                  <p style={{ margin: '0', color: COLORS.textMuted, fontSize: '0.875rem' }}>
                    Define what workers will be doing
                  </p>
                </div>

                {error && (
                  <div style={{
                    padding: '0.875rem 1rem',
                    background: COLORS.redDim,
                    border: `1px solid ${COLORS.red}`,
                    borderRadius: RADII.md,
                    color: COLORS.red,
                    marginBottom: '1.5rem',
                    fontSize: '0.875rem',
                  }}>
                    {error}
                  </div>
                )}

                <div style={{
                  background: COLORS.bgSurface,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: RADII.lg,
                  padding: '1.5rem',
                  marginBottom: '1.5rem',
                }}>
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
                      <option value="" disabled>Select a category</option>
                      {categoryList.map(cat => (
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
              </>
            )}

            {formStep === 1 && (
              <>
                <div style={{ marginBottom: '2rem' }}>
                  <h1 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem', fontWeight: '700' }}>
                    Budget & Timeline
                  </h1>
                  <p style={{ margin: '0', color: COLORS.textMuted, fontSize: '0.875rem' }}>
                    Set rewards and deadlines
                  </p>
                </div>

                <div style={{
                  background: COLORS.bgSurface,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: RADII.lg,
                  padding: '1.5rem',
                  marginBottom: '1.5rem',
                }}>
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

                  {/* Escrow Breakdown */}
                  {parseFloat(form.piReward) > 0 && (
                    <div style={{
                      background: 'rgba(0,201,167,0.08)',
                      border: '1px solid rgba(0,201,167,0.2)',
                      borderRadius: 12, padding: 16,
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 700,
                        color: '#454F64', textTransform: 'uppercase',
                        letterSpacing: '0.8px', marginBottom: 12 }}>
                        Escrow Breakdown
                      </div>
                      {[
                        { label: 'Per worker', value: `${form.piReward}π` },
                        { label: '× Slots', value: `× ${form.slotsAvailable}` },
                        { label: 'Platform fee (10%)', value: `+${(parseFloat(form.piReward) * parseInt(form.slotsAvailable) * 0.1).toFixed(4)}π` },
                      ].map(row => (
                        <div key={row.label} style={{
                          display: 'flex', justifyContent: 'space-between',
                          fontSize: 13, paddingBottom: 8, marginBottom: 8,
                          borderBottom: '1px solid rgba(255,255,255,0.07)',
                        }}>
                          <span style={{ color: '#8892A8' }}>{row.label}</span>
                          <span style={{ fontWeight: 700 }}>{row.value}</span>
                        </div>
                      ))}
                      <div style={{
                        display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center',
                      }}>
                        <span style={{ fontSize: 15, fontWeight: 700 }}>Total Escrow</span>
                        <div style={{
                          fontFamily: "'Bebas Neue', sans-serif",
                          fontSize: 28, color: '#33D9BC',
                        }}>
                          {totalCost()}π
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {formStep === 2 && (
              <>
                <div style={{ marginBottom: '2rem' }}>
                  <h1 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem', fontWeight: '700' }}>
                    Worker Requirements
                  </h1>
                  <p style={{ margin: '0', color: COLORS.textMuted, fontSize: '0.875rem' }}>
                    Set minimum qualifications for workers
                  </p>
                </div>

                <div style={{
                  background: COLORS.bgSurface,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: RADII.lg,
                  padding: '1.5rem',
                  marginBottom: '1.5rem',
                }}>
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
              </>
            )}

            {formStep === 3 && (
              <>
                <div style={{ marginBottom: '2rem' }}>
                  <h1 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem', fontWeight: '700' }}>
                    Review & Publish
                  </h1>
                  <p style={{ margin: '0', color: COLORS.textMuted, fontSize: '0.875rem' }}>
                    Review details and publish your task
                  </p>
                </div>

                {/* Escrow Lock Notice */}
                <div style={{
                  background: 'rgba(0,214,143,0.13)',
                  border: '1px solid rgba(0,214,143,0.2)',
                  borderRadius: 12, padding: 14, marginBottom: 20,
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>🔒</span>
                  <div style={{
                    fontSize: 13, color: '#00D68F', lineHeight: 1.65,
                  }}>
                    <strong>{totalCost()}π</strong> will be locked
                    in escrow immediately. Funds release to workers on
                    approval, or return to you if slots expire unfilled.
                  </div>
                </div>

                <div style={{
                  background: COLORS.bgSurface,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: RADII.lg,
                  padding: '1.5rem',
                  marginBottom: '1.5rem',
                }}>
                  {[
                    { label: 'Title',        value: form.title        },
                    { label: 'Category',     value: form.category     },
                    { label: 'Proof type',   value: form.proofType    },
                    { label: 'Pi per slot',  value: `${form.piReward}π` },
                    { label: 'Slots',        value: form.slotsAvailable },
                    { label: 'Deadline',     value: `${form.deadlineHours} hours` },
                    { label: 'Min rep',      value: form.minReputation },
                    { label: 'Badge level',  value: form.minBadgeLevel },
                  ].map(row => (
                    <div key={row.label} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '0.6rem 0',
                      borderBottom: `1px solid ${COLORS.border}`,
                      fontSize: '0.875rem',
                    }}>
                      <span style={{ color: COLORS.textMuted }}>{row.label}</span>
                      <span style={{
                        color: COLORS.textSecondary,
                        maxWidth: '60%',
                        textAlign: 'right',
                        wordBreak: 'break-word',
                      }}>
                        {row.value}
                      </span>
                    </div>
                  ))}

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '1rem 0 0',
                    fontSize: '1rem',
                    fontWeight: '600',
                  }}>
                    <span style={{ color: COLORS.textSecondary }}>Total escrow</span>
                    <span style={{
                      color: '#00C9A7',
                      fontSize: '1.3rem',
                    }}>
                      {totalCost()}π
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Navigation Buttons */}
            <div style={{
              display: 'flex',
              gap: '0.75rem',
            }}>
              {formStep > 0 && (
                <button
                  onClick={() => setFormStep(formStep - 1)}
                  style={{
                    flex: 1,
                    padding: '0.875rem',
                    background: 'transparent',
                    border: `1px solid ${COLORS.borderAccent}`,
                    borderRadius: RADII.lg,
                    color: COLORS.textSecondary,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    fontWeight: '600',
                  }}
                >
                  ← Back
                </button>
              )}
              {formStep < 3 && (
                <button
                  onClick={() => setFormStep(formStep + 1)}
                  style={{
                    flex: 1,
                    padding: '0.875rem',
                    background: '#00C9A7',
                    border: '1px solid #00C9A7',
                    borderRadius: RADII.lg,
                    color: '#07090E',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Next →
                </button>
              )}
              {formStep === 3 && (
                <button
                  onClick={proceedToReview}
                  style={{
                    flex: 1,
                    padding: '0.875rem',
                    background: '#00C9A7',
                    border: '1px solid #00C9A7',
                    borderRadius: RADII.lg,
                    color: '#07090E',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  🚀 Review & Publish
                </button>
              )}
            </div>
          </>
        )}

        {/* Step: Review */}
        {step === 'review' && (
          <>
            <div style={{ marginBottom: '2rem' }}>
              <h1 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem', fontWeight: '700' }}>
                Review Your Opportunity
              </h1>
              <p style={{ margin: '0', color: COLORS.textMuted, fontSize: '0.875rem' }}>
                Confirm all details before payment
              </p>
            </div>

            <div style={{
              background:   COLORS.bgSurface,
              border:       `1px solid ${COLORS.border}`,
              borderRadius: RADII.lg,
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
                  borderBottom:  `1px solid ${COLORS.border}`,
                  fontSize:      '0.875rem',
                }}>
                  <span style={{ color: COLORS.textMuted }}>{row.label}</span>
                  <span style={{
                    color:    COLORS.textSecondary,
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
                <span style={{ color: COLORS.textSecondary }}>Total escrow</span>
                <span style={{
                  background:          `linear-gradient(135deg, ${COLORS.sapphire}, ${COLORS.sapphireDark})`,
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
                  border:       `1px solid ${COLORS.borderAccent}`,
                  borderRadius: RADII.lg,
                  color:        COLORS.textSecondary,
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
                  background:   `linear-gradient(135deg, ${COLORS.sapphire}, ${COLORS.sapphireDark})`,
                  color:        'white',
                  border:       `1px solid ${COLORS.cyan}`,
                  borderRadius: RADII.lg,
                  fontSize:     '0.9rem',
                  fontWeight:   '600',
                  cursor:       isProcessing ? 'not-allowed' : 'pointer',
                  boxShadow:    isProcessing ? 'none' : SHADOWS.cyanGlow,
                }}
              >
                Pay {totalCost()}π & Publish →
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
              borderRadius: RADII.full,
              background:  `linear-gradient(135deg, ${COLORS.sapphire}, ${COLORS.sapphireDark})`,
              margin:      '0 auto 1.5rem',
              display:     'flex',
              alignItems:  'center',
              justifyContent: 'center',
              fontSize:    '1.5rem',
              boxShadow:   SHADOWS.cyanGlow,
            }}>
              {step === 'payment' ? '💳' : '⚡'}
            </div>
            <h2 style={{ margin: '0 0 0.5rem' }}>
              {step === 'payment'
                ? 'Complete payment in Pi Browser'
                : 'Creating your task...'}
            </h2>
            <p style={{ color: COLORS.textMuted, margin: '0', fontSize: '0.875rem' }}>
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
              borderRadius: RADII.full,
              background:   COLORS.emeraldDim,
              border:       `2px solid ${COLORS.emerald}`,
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
              color:    COLORS.textSecondary,
              margin:   '0 0 2rem',
              fontSize: '0.875rem',
            }}>
              Your task is live. Workers can now see and claim slots.
            </p>

            <div style={{
              background:   COLORS.bgSurface,
              border:       `1px solid ${COLORS.border}`,
              borderRadius: RADII.lg,
              padding:      '1rem',
              marginBottom: '2rem',
              textAlign:    'left',
            }}>
              <div style={{
                fontSize: '0.75rem',
                color:    COLORS.textMuted,
                marginBottom: '0.3rem',
              }}>
                Task ID
              </div>
              <code style={{
                fontSize:  '0.8rem',
                color:     COLORS.sapphireLight,
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
                  background:     `linear-gradient(135deg, ${COLORS.sapphire}, ${COLORS.sapphireDark})`,
                  color:          'white',
                  textDecoration: 'none',
                  fontSize:       '0.9rem',
                  fontWeight:     '600',
                  textAlign:      'center',
                  borderRadius:   RADII.lg,
                  boxShadow:      SHADOWS.cyanGlow,
                  border:         `1px solid ${COLORS.cyan}`,
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
                  border:         `1px solid ${COLORS.borderAccent}`,
                  borderRadius:   RADII.lg,
                  color:          COLORS.textSecondary,
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
                  background:   COLORS.bgSurface,
                  color:        COLORS.textPrimary,
                  border:       'none',
                  borderRadius: RADII.lg,
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
              borderRadius: RADII.full,
              background:   COLORS.redDim,
              border:       `2px solid ${COLORS.red}`,
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
              color:    COLORS.red,
              margin:   '0 0 2rem',
              fontSize: '0.875rem',
            }}>
              {error}
            </p>
            {txid && (
              <div style={{
                background:   COLORS.bgSurface,
                borderRadius: RADII.md,
                padding:      '0.75rem',
                marginBottom: '1.5rem',
                fontSize:     '0.8rem',
                color:        COLORS.textSecondary,
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
                background:   `linear-gradient(135deg, ${COLORS.sapphire}, ${COLORS.sapphireDark})`,
                color:        'white',
                border:       `1px solid ${COLORS.cyan}`,
                borderRadius: RADII.lg,
                fontSize:     '0.9rem',
                fontWeight:   '600',
                cursor:       'pointer',
                boxShadow:    SHADOWS.cyanGlow,
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


