'use client'

import { useState } from 'react'
import { COLORS, FONTS, RADII, SPACING } from '@/lib/design/tokens'

interface EditWalletModalProps {
  currentWallet: string | null
  onSave: (newWallet: string) => Promise<void>
  onClose: () => void
  isOpen: boolean
  isSaving?: boolean
}

/**
 * Modal for editing wallet address with confirmation flow
 * - Validates Stellar address format (G, 56 chars)
 * - Shows previous wallet for reference
 * - Requires confirmation before saving
 */
export function EditWalletModal({
  currentWallet,
  onSave,
  onClose,
  isOpen,
  isSaving = false,
}: EditWalletModalProps) {
  const [newWallet, setNewWallet] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)

  if (!isOpen) return null

  const validateWallet = (address: string): boolean => {
    if (!address.trim()) {
      setError('Wallet address is required')
      return false
    }
    if (!address.startsWith('G') || address.length !== 56) {
      setError('Invalid address. Must start with G and be 56 characters.')
      return false
    }
    if (address === currentWallet) {
      setError('This is the same as your current wallet')
      return false
    }
    return true
  }

  const handleInputChange = (value: string) => {
    setNewWallet(value)
    setError(null)
    setIsConfirming(false)
  }

  const handleEdit = () => {
    if (validateWallet(newWallet)) {
      setIsConfirming(true)
    }
  }

  const handleConfirm = async () => {
    try {
      setError(null)
      await onSave(newWallet)
      setNewWallet('')
      setIsConfirming(false)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save wallet')
    }
  }

  const handleCancel = () => {
    setNewWallet('')
    setError(null)
    setIsConfirming(false)
  }

  const handleClose = () => {
    handleCancel()
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          zIndex: 999,
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: COLORS.bgRaised,
          border: `1px solid ${COLORS.border}`,
          borderRadius: RADII.lg,
          padding: SPACING.lg,
          maxWidth: '500px',
          width: '90%',
          zIndex: 1000,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        <h2 style={{ margin: '0 0 1.5rem', color: COLORS.textPrimary, fontSize: '1.25rem' }}>
          Edit Wallet Address
        </h2>

        {/* Current Wallet Display */}
        {currentWallet && (
          <div
            style={{
              background: COLORS.bgBase,
              border: `1px solid ${COLORS.border}`,
              borderRadius: RADII.md,
              padding: SPACING.md,
              marginBottom: '1.5rem',
            }}
          >
            <label style={{ display: 'block', color: COLORS.textMuted, fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              Current Wallet
            </label>
            <div style={{ color: COLORS.textPrimary, fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {currentWallet}
            </div>
          </div>
        )}

        {/* New Wallet Input */}
        {!isConfirming ? (
          <>
            <div style={{ marginBottom: '1.5rem' }}>
              <label
                style={{
                  display: 'block',
                  color: COLORS.textMuted,
                  fontSize: '0.875rem',
                  marginBottom: '0.5rem',
                }}
              >
                New Wallet Address
              </label>
              <input
                type="text"
                value={newWallet}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="G..."
                disabled={isSaving}
                style={{
                  width: '100%',
                  padding: SPACING.md,
                  background: COLORS.bgBase,
                  border: `1px solid ${error ? COLORS.red : COLORS.border}`,
                  borderRadius: RADII.md,
                  color: COLORS.textPrimary,
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
              />
              {error && (
                <p style={{ color: COLORS.red, fontSize: '0.8rem', margin: '0.5rem 0 0' }}>
                  {error}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: SPACING.md, justifyContent: 'flex-end' }}>
              <button
                onClick={handleClose}
                disabled={isSaving}
                style={{
                  padding: `${SPACING.sm} ${SPACING.md}`,
                  background: COLORS.bgBase,
                  border: `1px solid ${COLORS.border}`,
                  color: COLORS.textSecondary,
                  borderRadius: RADII.md,
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  opacity: isSaving ? 0.6 : 1,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                disabled={!newWallet.trim() || isSaving}
                style={{
                  padding: `${SPACING.sm} ${SPACING.md}`,
                  background: COLORS.pi,
                  color: 'white',
                  border: 'none',
                  borderRadius: RADII.md,
                  cursor: !newWallet.trim() || isSaving ? 'not-allowed' : 'pointer',
                  opacity: !newWallet.trim() || isSaving ? 0.6 : 1,
                }}
              >
                {isSaving ? 'Saving...' : 'Review Changes'}
              </button>
            </div>
          </>
        ) : (
          /* Confirmation Screen */
          <>
            <div
              style={{
                background: `${COLORS.amber}20`,
                border: `1px solid ${COLORS.amber}`,
                borderRadius: RADII.md,
                padding: SPACING.md,
                marginBottom: '1.5rem',
              }}
            >
              <p style={{ color: COLORS.amber, margin: 0, fontSize: '0.9rem', fontWeight: 500 }}>
                ⚠️ Warning: Future payments will be sent to the new address. Make sure it's correct before confirming.
              </p>
            </div>

            <div
              style={{
                background: COLORS.bgBase,
                border: `1px solid ${COLORS.border}`,
                borderRadius: RADII.md,
                padding: SPACING.md,
                marginBottom: '1.5rem',
              }}
            >
              <label style={{ display: 'block', color: COLORS.textMuted, fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                New Wallet (to be saved)
              </label>
              <div style={{ color: COLORS.textPrimary, fontFamily: 'monospace', wordBreak: 'break-all' }}>
                {newWallet}
              </div>
            </div>

            {/* Confirmation Buttons */}
            <div style={{ display: 'flex', gap: SPACING.md, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setIsConfirming(false)}
                disabled={isSaving}
                style={{
                  padding: `${SPACING.sm} ${SPACING.md}`,
                  background: COLORS.bgBase,
                  border: `1px solid ${COLORS.border}`,
                  color: COLORS.textSecondary,
                  borderRadius: RADII.md,
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  opacity: isSaving ? 0.6 : 1,
                }}
              >
                Back
              </button>
              <button
                onClick={handleConfirm}
                disabled={isSaving}
                style={{
                  padding: `${SPACING.sm} ${SPACING.md}`,
                  background: COLORS.emerald,
                  color: 'white',
                  border: 'none',
                  borderRadius: RADII.md,
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  opacity: isSaving ? 0.6 : 1,
                }}
              >
                {isSaving ? 'Saving...' : 'Confirm & Save'}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}


