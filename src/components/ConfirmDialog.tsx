'use client'

import { useState } from 'react'
import { COLORS, FONTS, SPACING, RADII, SHADOWS } from '@/lib/design/tokens'

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  isDangerous?: boolean
  onConfirm: () => void | Promise<void>
  onCancel?: () => void
  isOpen: boolean
  isLoading?: boolean
}

/**
 * Modern 2026-style confirmation dialog replacing browser confirm()
 * Replaces outdated window.confirm() with modern modal pattern
 */
export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDangerous = false,
  onConfirm,
  onCancel,
  isOpen,
  isLoading = false,
}: ConfirmDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false)

  const handleConfirm = async () => {
    setIsProcessing(true)
    try {
      await onConfirm()
    } finally {
      setIsProcessing(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          backgroundColor: COLORS.bgSurface,
          borderRadius: RADII.lg,
          padding: SPACING.lg,
          maxWidth: '400px',
          width: '90%',
          boxShadow: SHADOWS.elevated,
          border: `1px solid ${COLORS.borderAccent}`,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Title */}
        <h2
          style={{
            fontFamily: FONTS.sans,
            fontSize: '18px',
            fontWeight: 600,
            marginBottom: SPACING.md,
            color: isDangerous ? COLORS.red : COLORS.textPrimary,
          }}
        >
          {title}
        </h2>

        {/* Message */}
        <p
          style={{
            color: COLORS.textSecondary,
            marginBottom: SPACING.lg,
            lineHeight: '1.5',
            fontSize: '14px',
            fontFamily: FONTS.sans,
          }}
        >
          {message}
        </p>

        {/* Buttons */}
        <div
          style={{
            display: 'flex',
            gap: SPACING.md,
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={onCancel}
            disabled={isProcessing || isLoading}
            style={{
              padding: `${SPACING.sm} ${SPACING.md}`,
              borderRadius: RADII.md,
              border: `1px solid ${COLORS.border}`,
              backgroundColor: COLORS.bgSurface,
              color: COLORS.textPrimary,
              cursor: isProcessing || isLoading ? 'not-allowed' : 'pointer',
              opacity: isProcessing || isLoading ? 0.5 : 1,
              fontFamily: FONTS.sans,
              fontSize: '14px',
              fontWeight: 500,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e =>
              (e.currentTarget.style.backgroundColor = COLORS.bgElevated)
            }
            onMouseLeave={e =>
              (e.currentTarget.style.backgroundColor = COLORS.bgSurface)
            }
          >
            {cancelLabel}
          </button>

          <button
            onClick={handleConfirm}
            disabled={isProcessing || isLoading}
            style={{
              padding: `${SPACING.sm} ${SPACING.md}`,
              borderRadius: RADII.md,
              border: 'none',
              backgroundColor: isDangerous ? COLORS.red : COLORS.indigo,
              color: COLORS.textPrimary,
              cursor: isProcessing || isLoading ? 'not-allowed' : 'pointer',
              opacity: isProcessing || isLoading ? 0.7 : 1,
              fontFamily: FONTS.sans,
              fontSize: '14px',
              fontWeight: 600,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              if (!isProcessing && !isLoading) {
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = isDangerous ? '0 0 16px rgba(239, 68, 68, 0.4)' : '0 0 16px rgba(99, 102, 241, 0.4)'
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            {isProcessing || isLoading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

