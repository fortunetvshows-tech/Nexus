'use client'

import { useRouter } from 'next/navigation'
import { COLORS, FONTS, RADII, SPACING } from '@/lib/design/tokens'

interface WalletModalProps {
  open: boolean
  onClose: () => void
}

export function WalletModal({ open, onClose }: WalletModalProps) {
  const router = useRouter()

  if (!open) return null

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          zIndex: 999,
          backdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.2s ease-out',
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1000,
          maxWidth: '420px',
          width: '90vw',
          background: COLORS.bgSurface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: RADII.xl,
          padding: SPACING.lg,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
          animation: 'slideUp 0.3s ease-out',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: SPACING.md,
            right: SPACING.md,
            background: 'none',
            border: 'none',
            color: COLORS.textMuted,
            fontSize: '1.5rem',
            cursor: 'pointer',
            padding: 0,
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: RADII.md,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = COLORS.bgRaised
            e.currentTarget.style.color = COLORS.textPrimary
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'none'
            e.currentTarget.style.color = COLORS.textMuted
          }}
        >
          ×
        </button>

        {/* Icon */}
        <div
          style={{
            width: '56px',
            height: '56px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: `2px solid rgba(16, 185, 129, 0.3)`,
            borderRadius: RADII.full,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.8rem',
            marginBottom: SPACING.md,
          }}
        >
          💳
        </div>

        {/* Heading */}
        <h2
          style={{
            margin: `0 0 ${SPACING.sm}`,
            fontSize: '1.25rem',
            fontWeight: '700',
            color: COLORS.textPrimary,
            fontFamily: FONTS.mono,
          }}
        >
          Wallet Required
        </h2>

        {/* Description */}
        <p
          style={{
            margin: `0 0 ${SPACING.lg}`,
            fontSize: '0.9rem',
            color: COLORS.textSecondary,
            lineHeight: '1.6',
          }}
        >
          To claim this task and receive payments, you need to set up your Pi wallet address. This is where your earnings will be sent.
        </p>

        {/* Info box */}
        <div
          style={{
            padding: SPACING.md,
            background: COLORS.bgRaised,
            border: `1px solid ${COLORS.border}`,
            borderRadius: RADII.md,
            marginBottom: SPACING.lg,
          }}
        >
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: '700',
              color: COLORS.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: SPACING.xs,
            }}
          >
            ✓ Why set up your wallet?
          </div>
          <ul
            style={{
              margin: 0,
              paddingLeft: '1.25rem',
              fontSize: '0.85rem',
              color: COLORS.textSecondary,
              lineHeight: '1.6',
            }}
          >
            <li>Get paid instantly when work is approved</li>
            <li>Track all your earnings in one place</li>
            <li>One-time setup, works forever</li>
          </ul>
        </div>

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            gap: SPACING.sm,
            flexDirection: 'column',
          }}
        >
          <button
            onClick={() => {
              onClose()
              router.push('/profile?tab=wallet')
            }}
            style={{
              width: '100%',
              padding: `${SPACING.md} ${SPACING.lg}`,
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              borderRadius: RADII.lg,
              fontSize: '0.95rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: FONTS.sans,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            Set Up Wallet Now →
          </button>

          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: `${SPACING.md} ${SPACING.lg}`,
              background: COLORS.bgRaised,
              color: COLORS.textPrimary,
              border: `1px solid ${COLORS.border}`,
              borderRadius: RADII.lg,
              fontSize: '0.95rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: FONTS.sans,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = COLORS.bgSurface
              e.currentTarget.style.borderColor = COLORS.pi
              e.currentTarget.style.color = COLORS.pi
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = COLORS.bgRaised
              e.currentTarget.style.borderColor = COLORS.border
              e.currentTarget.style.color = COLORS.textPrimary
            }}
          >
            I'll do it later
          </button>
        </div>

        {/* Animation styles */}
        <style>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translate(-50%, calc(-50% + 20px));
            }
            to {
              opacity: 1;
              transform: translate(-50%, -50%);
            }
          }
        `}</style>
      </div>
    </>
  )
}

