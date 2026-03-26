'use client'

import { useState } from 'react'
import { COLORS, SPACING, RADII, SHADOWS } from '@/lib/design/tokens'

interface BoostOption {
  type: string
  label: string
  minCost?: number
  cost?: number
  description?: string
}

interface BoostCardProps {
  title: string
  currentBalance: number
  boostOptions: BoostOption[]
  onBoost: (type: string, amount: number, days?: number) => Promise<void>
  isLoading?: boolean
}

export function BoostCard({ title, currentBalance, boostOptions, onBoost, isLoading }: BoostCardProps) {
  const [selectedBoost, setSelectedBoost] = useState<string | null>(null)
  const [customAmount, setCustomAmount] = useState<number>(0)
  const [durationDays, setDurationDays] = useState(7)
  const [isProcessing, setIsProcessing] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleBoost = async () => {
    if (!selectedBoost || !customAmount) {
      setMessage({ type: 'error', text: 'Please select boost type and amount' })
      return
    }

    if (customAmount > currentBalance) {
      setMessage({ type: 'error', text: 'Insufficient pulse balance' })
      return
    }

    setIsProcessing(true)
    try {
      await onBoost(selectedBoost, customAmount, durationDays)
      setMessage({ type: 'success', text: 'Boost applied successfully!' })
      setSelectedBoost(null)
      setCustomAmount(0)
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to apply boost' })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div
      style={{
        backgroundColor: COLORS.bgSurface,
        borderRadius: RADII.lg,
        padding: SPACING.lg,
        border: `1px solid ${COLORS.border}`,
        boxShadow: SHADOWS.card,
      }}
    >
      <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.md }}>
        {title}
      </h3>

      <div style={{ marginBottom: SPACING.lg }}>
        <div style={{ fontSize: '0.875rem', color: COLORS.textMuted, marginBottom: SPACING.xs }}>
          Available Pulse
        </div>
        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: COLORS.emerald }}>
          {currentBalance.toFixed(2)} 💫
        </div>
      </div>

      {/* Boost Options */}
      <div style={{ marginBottom: SPACING.lg }}>
        <label style={{ fontSize: '0.875rem', color: COLORS.textMuted, display: 'block', marginBottom: SPACING.sm }}>
          Choose Boost Type
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: SPACING.sm }}>
          {boostOptions.map((opt) => (
            <button
              key={opt.type}
              onClick={() => setSelectedBoost(opt.type)}
              style={{
                padding: SPACING.md,
                borderRadius: RADII.md,
                border: `2px solid ${selectedBoost === opt.type ? COLORS.indigo : COLORS.border}`,
                backgroundColor: selectedBoost === opt.type ? COLORS.bgElevated : 'transparent',
                color: COLORS.textPrimary,
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontSize: '0.85rem',
              }}
            >
              <div style={{ fontWeight: '600' }}>{opt.label}</div>
              {opt.cost && <div style={{ fontSize: '0.75rem', color: COLORS.textMuted, marginTop: '4px' }}>{opt.cost} Π min</div>}
            </button>
          ))}
        </div>
      </div>

      {/* Amount Input */}
      {selectedBoost && (
        <div style={{ marginBottom: SPACING.lg }}>
          <label style={{ fontSize: '0.875rem', color: COLORS.textMuted, display: 'block', marginBottom: SPACING.xs }}>
            Pulse Amount
          </label>
          <input
            type="number"
            min="1"
            max={currentBalance}
            value={customAmount || ''}
            onChange={(e) => setCustomAmount(Number(e.target.value))}
            placeholder="Enter pulse amount"
            style={{
              width: '100%',
              padding: SPACING.md,
              borderRadius: RADII.md,
              border: `1px solid ${COLORS.border}`,
              backgroundColor: COLORS.bgElevated,
              color: COLORS.textPrimary,
              fontSize: '0.875rem',
            }}
          />
          {durationDays && (
            <div style={{ marginTop: SPACING.sm }}>
              <label style={{ fontSize: '0.875rem', color: COLORS.textMuted, display: 'block', marginBottom: SPACING.xs }}>
                Duration (Days)
              </label>
              <select
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: SPACING.md,
                  borderRadius: RADII.md,
                  border: `1px solid ${COLORS.border}`,
                  backgroundColor: COLORS.bgElevated,
                  color: COLORS.textPrimary,
                }}
              >
                <option value={1}>1 Day</option>
                <option value={3}>3 Days</option>
                <option value={7}>7 Days</option>
                <option value={14}>14 Days</option>
                <option value={30}>30 Days</option>
              </select>
            </div>
          )}
        </div>
      )}

      {/* Message */}
      {message && (
        <div
          style={{
            padding: SPACING.md,
            borderRadius: RADII.md,
            backgroundColor: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: message.type === 'success' ? COLORS.emerald : COLORS.red,
            fontSize: '0.875rem',
            marginBottom: SPACING.lg,
          }}
        >
          {message.text}
        </div>
      )}

      {/* Apply Button */}
      <button
        onClick={handleBoost}
        disabled={!selectedBoost || !customAmount || isProcessing || isLoading}
        style={{
          width: '100%',
          padding: SPACING.md,
          borderRadius: RADII.md,
          border: 'none',
          backgroundColor: selectedBoost && customAmount ? COLORS.indigo : COLORS.textMuted,
          color: 'white',
          fontWeight: '600',
          cursor: selectedBoost && customAmount ? 'pointer' : 'not-allowed',
          opacity: selectedBoost && customAmount ? 1 : 0.6,
          transition: 'all 0.2s',
        }}
      >
        {isProcessing ? 'Applying...' : 'Apply Boost'}
      </button>
    </div>
  )
}
