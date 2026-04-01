'use client'

import { useEffect, useState } from 'react'
import { usePiAuth }    from '@/hooks/use-pi-auth'
import { Navigation }   from '@/components/Navigation'
import { EditWalletModal } from '@/components/EditWalletModal'
import {
  COLORS, FONTS, RADII, SPACING, SHADOWS
} from '@/lib/design/tokens'

interface ProfileData {
  piUsername:     string
  piUid:          string
  walletAddress:  string | null
  reputationScore: number
  reputationLevel: string
  kycLevel:       number
  totalEarnings:  number
  totalTasksCompleted: number
  createdAt:      string
}

export default function ProfilePage() {
  const { user } = usePiAuth()

  const [profile,       setProfile]       = useState<ProfileData | null>(null)
  const [isLoading,     setIsLoading]     = useState(true)
  const [walletInput,   setWalletInput]   = useState('')
  const [isSaving,      setIsSaving]      = useState(false)
  const [saveMessage,   setSaveMessage]   = useState<{
    type: 'success' | 'error', text: string
  } | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Fetch profile on mount (always runs when component mounts/remounts)
  useEffect(() => {
    if (!user?.piUid) return
    
    const fetchProfile = async () => {
      setIsLoading(true)
      try {
        const res = await fetch(
          `${window.location.origin}/api/profile`,
          { headers: { 'x-pi-uid': user.piUid } }
        )
        const data = await res.json()
        if (data.profile) {
          setProfile(data.profile)
          setWalletInput(data.profile.walletAddress ?? '')
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [user?.piUid])  // Only depends on user being authenticated

  const handleSaveWallet = async (walletToSave?: string) => {
    const wallet = walletToSave || walletInput // Allow modal to pass wallet directly
    if (!user?.piUid || !wallet.trim()) {
      throw new Error('Missing wallet or user ID')
    }
    setIsSaving(true)
    setSaveMessage(null)

    try {
      const res = await fetch(
        `${window.location.origin}/api/profile/wallet`,
        {
          method:  'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-pi-uid':     user.piUid,
          },
          body: JSON.stringify({
            walletAddress: wallet.trim(),
          }),
        }
      )
      const data = await res.json()

      if (data.success) {
        setSaveMessage({
          type: 'success',
          text: '✓ Wallet address saved. Future payments will go to this address.',
        })
        setProfile(prev => prev
          ? { ...prev, walletAddress: wallet.trim() }
          : prev
        )
        // Clear input after successful save
        setWalletInput('')
        // Close modal will happen in EditWalletModal after onSave resolves
      } else {
        const errorMsg = data.error ?? 'Failed to save wallet address'
        setSaveMessage({
          type: 'error',
          text: errorMsg,
        })
        throw new Error(errorMsg)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Network error. Please try again.'
      setSaveMessage({
        type: 'error',
        text: errorMsg,
      })
      throw err // Re-throw so modal knows to stay open
    } finally {
      setIsSaving(false)
    }
  }

  if (!user) {
    return (
      <div style={{
        minHeight:  '100vh',
        background: COLORS.bgBase,
        display:    'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <p style={{ color: COLORS.textMuted }}>
          Please log in to view your profile.
        </p>
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
      <Navigation currentPage="profile" />

      <main className="page-main" style={{ maxWidth: '600px' }}>

        {/* Header */}
        <div style={{ marginBottom: SPACING.xl }}>
          <h1 style={{
            margin:     '0 0 0.25rem',
            fontSize:   '1.5rem',
            fontWeight: '700',
          }}>
            Your Profile
          </h1>
          <p style={{
            margin:  0,
            color:   COLORS.textMuted,
            fontSize: '0.875rem',
          }}>
            Manage your Pi identity and payment settings
          </p>
        </div>

        {isLoading ? (
          <div style={{
            background:   COLORS.bgSurface,
            border:       `1px solid ${COLORS.border}`,
            borderRadius: RADII.xl,
            padding:      SPACING.xl,
            color:        COLORS.textMuted,
            textAlign:    'center' as const,
          }}>
            Loading profile...
          </div>
        ) : (
          <>
            {/* Identity Card */}
            <div className="nexus-card" style={{ marginBottom: SPACING.lg }}>
              <div style={{
                fontSize:      '0.65rem',
                fontWeight:    '600',
                color:         COLORS.textMuted,
                textTransform: 'uppercase' as const,
                letterSpacing: '0.1em',
                marginBottom:  SPACING.md,
              }}>
                Pi Identity
              </div>

              {/* Avatar + Username */}
              <div style={{
                display:     'flex',
                alignItems:  'center',
                gap:         SPACING.md,
                marginBottom: SPACING.md,
              }}>
                <div style={{
                  width:          '56px',
                  height:         '56px',
                  borderRadius:   RADII.lg,
                  background:     `linear-gradient(135deg, ${COLORS.sapphire}, ${COLORS.sapphireLight})`,
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  fontSize:       '1.5rem',
                  fontWeight:     '700',
                  color:          'white',
                  flexShrink:     0,
                  boxShadow:      SHADOWS.cyanGlow,
                }}>
                  {user.piUsername.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{
                    fontSize:   '1.1rem',
                    fontWeight: '700',
                    color:      COLORS.textPrimary,
                  }}>
                    {user.piUsername}
                  </div>
                  <div style={{
                    fontSize:   '0.8rem',
                    color:      COLORS.textMuted,
                    fontFamily: FONTS.mono,
                  }}>
                    {user.reputationLevel} · {user.reputationScore} REP
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <div style={{
                display:             'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap:                 SPACING.sm,
              }} className="stats-grid-3">
                {[
                  {
                    label: 'KYC Level',
                    value: profile?.kycLevel ?? 0,
                  },
                  {
                    label: 'Tasks Done',
                    value: profile?.totalTasksCompleted ?? 0,
                  },
                  {
                    label: 'Pi Earned',
                    value: `${Number(profile?.totalEarnings ?? 0).toFixed(2)}π`,
                  },
                ].map(stat => (
                  <div key={stat.label} style={{
                    background:   COLORS.bgElevated,
                    border:       `1px solid ${COLORS.border}`,
                    borderRadius: RADII.md,
                    padding:      SPACING.sm,
                    textAlign:    'center' as const,
                  }}>
                    <div style={{
                      fontSize:   '1.1rem',
                      fontWeight: '700',
                      color:      COLORS.textPrimary,
                      fontFamily: FONTS.mono,
                    }}>
                      {stat.value}
                    </div>
                    <div style={{
                      fontSize: '0.65rem',
                      color:    COLORS.textMuted,
                      marginTop: '2px',
                    }}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Wallet Address Card */}
            <div className="nexus-card">
              <div style={{
                fontSize:      '0.65rem',
                fontWeight:    '600',
                color:         COLORS.textMuted,
                textTransform: 'uppercase' as const,
                letterSpacing: '0.1em',
                marginBottom:  SPACING.sm,
              }}>
                Payment Wallet
              </div>

              <p style={{
                margin:   `0 0 ${SPACING.md}`,
                fontSize: '0.82rem',
                color:    COLORS.textSecondary,
                lineHeight: 1.5,
              }}>
                This is where you receive Pi payments for completed tasks.
                Keep it accurate — payments sent to wrong addresses cannot
                be recovered.
              </p>

              {/* Wallet section with proper loading states */}
              {isLoading ? (
                <div style={{
                  padding:      SPACING.md,
                  background:   'rgba(99,102,241,0.08)',
                  border:       `1px solid rgba(99,102,241,0.2)`,
                  borderRadius: RADII.md,
                  marginBottom: SPACING.md,
                  fontSize:     '0.8rem',
                  color:        COLORS.textMuted,
                  textAlign:    'center' as const,
                }}>
                  Loading your wallet...
                </div>
              ) : profile?.walletAddress ? (
                <>
                  {/* Locked Wallet Display */}
                  <div style={{
                    padding:      SPACING.md,
                    background:   'rgba(16,185,129,0.08)',
                    border:       '1px solid rgba(16,185,129,0.2)',
                    borderRadius: RADII.md,
                    marginBottom: SPACING.md,
                    display:      'flex',
                    alignItems:   'flex-start',
                    gap:          SPACING.md,
                    justifyContent: 'space-between',
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        display:     'flex',
                        alignItems:  'center',
                        gap:         SPACING.xs,
                        marginBottom: '0.5rem',
                      }}>
                        <span style={{ color: COLORS.emerald, fontSize: '1rem' }}>🔒</span>
                        <span style={{
                          fontSize:   '0.72rem',
                          fontWeight: '600',
                          color:      COLORS.emerald,
                          textTransform: 'uppercase',
                        }}>
                          Protected Wallet
                        </span>
                      </div>
                      <div style={{
                        fontSize:   '0.78rem',
                        fontFamily: FONTS.mono,
                        color:      COLORS.emerald,
                        wordBreak:  'break-all' as const,
                        lineHeight: 1.4,
                      }}>
                        {profile.walletAddress}
                      </div>
                    </div>
                      <button
                      onClick={() => setIsEditModalOpen(true)}
                      style={{
                        padding:      '0.5rem 1rem',
                        background:   COLORS.sapphire,
                        border:       `1px solid ${COLORS.cyan}`,
                        borderRadius: RADII.md,
                        color:        'white',
                        fontSize:     '0.8rem',
                        fontWeight:   '500',
                        cursor:       'pointer',
                        whiteSpace:   'nowrap',
                        flexShrink:   0,
                        boxShadow:    SHADOWS.cyanGlow,
                      }}
                    >
                      Edit
                    </button>
                  </div>

                  {/* Message about new wallet set */}
                  {saveMessage && (
                    <div style={{
                      padding:      `${SPACING.xs} ${SPACING.sm}`,
                      background:   saveMessage.type === 'success'
                        ? 'rgba(16,185,129,0.08)'
                        : 'rgba(239,68,68,0.08)',
                      border:       `1px solid ${saveMessage.type === 'success'
                        ? 'rgba(16,185,129,0.2)'
                        : 'rgba(239,68,68,0.2)'}`,
                      borderRadius: RADII.md,
                      marginBottom: SPACING.md,
                      fontSize:     '0.8rem',
                      color:        saveMessage.type === 'success'
                        ? COLORS.emerald
                        : COLORS.red,
                    }}>
                      {saveMessage.text}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* No wallet - show warning and input form */}
                  <div style={{
                    padding:      SPACING.sm,
                    background:   'rgba(245,158,11,0.08)',
                    border:       '1px solid rgba(245,158,11,0.2)',
                    borderRadius: RADII.md,
                    marginBottom: SPACING.md,
                    fontSize:     '0.82rem',
                    color:        COLORS.amber,
                  }}>
                    ⚠ No wallet address set. Payments cannot be processed
                    until you add your Pi wallet address below.
                  </div>
                  <div style={{ marginBottom: SPACING.sm }}>
                    <label style={{
                      display:      'block',
                      fontSize:     '0.78rem',
                      fontWeight:   '500',
                      color:        COLORS.textSecondary,
                      marginBottom: '6px',
                    }}>
                      Pi Wallet Address
                    </label>
                    <input
                      type="text"
                      value={walletInput}
                      onChange={e => setWalletInput(e.target.value)}
                      placeholder="G... (starts with G, 56 characters)"
                      style={{
                        width:        '100%',
                        padding:      '0.75rem',
                        background:   COLORS.bgElevated,
                        border:       `1px solid ${COLORS.borderAccent}`,
                        borderRadius: RADII.md,
                        color:        COLORS.textPrimary,
                        fontSize:     '0.8rem',
                        fontFamily:   FONTS.mono,
                        outline:      'none',
                        boxSizing:    'border-box' as const,
                      }}
                    />
                    <p style={{
                      margin:   '6px 0 0',
                      fontSize: '0.72rem',
                      color:    COLORS.textMuted,
                    }}>
                      Find your wallet address in Pi Wallet → Settings →
                      Wallet Address. It starts with G and is 56 characters long.
                    </p>
                  </div>

                  {/* Save message */}
                  {saveMessage && (
                    <div style={{
                      padding:      `${SPACING.xs} ${SPACING.sm}`,
                      background:   saveMessage.type === 'success'
                        ? 'rgba(16,185,129,0.08)'
                        : 'rgba(239,68,68,0.08)',
                      border:       `1px solid ${saveMessage.type === 'success'
                        ? 'rgba(16,185,129,0.2)'
                        : 'rgba(239,68,68,0.2)'}`,
                      borderRadius: RADII.md,
                      marginBottom: SPACING.sm,
                      fontSize:     '0.8rem',
                      color:        saveMessage.type === 'success'
                        ? COLORS.emerald
                        : COLORS.red,
                    }}>
                      {saveMessage.text}
                    </div>
                  )}

                  {/* Save button */}
                  <button
                    onClick={() => handleSaveWallet()}
                    disabled={
                      isSaving ||
                      !walletInput.trim()
                    }
                    style={{
                      width:        '100%',
                      padding:      '0.875rem',
                      background:   isSaving ? COLORS.bgElevated
                        : `linear-gradient(135deg, ${COLORS.sapphire}, ${COLORS.sapphireDark})`,
                      border:       isSaving ? 'none' : `1px solid ${COLORS.cyan}`,
                      borderRadius: RADII.md,
                      color:        isSaving ? COLORS.textMuted : 'white',
                      fontSize:     '0.9rem',
                      fontWeight:   '600',
                      cursor:       isSaving ? 'not-allowed' : 'pointer',
                      fontFamily:   FONTS.sans,
                      transition:   'all 0.15s ease',
                      boxShadow:    isSaving ? 'none' : SHADOWS.cyanGlow,
                    }}
                  >
                    {isSaving ? 'Saving...' : 'Save Wallet Address'}
                  </button>
                </>
              )}

              {/* Modal for editing wallet */}
              <EditWalletModal
                isOpen={isEditModalOpen}
                currentWallet={profile?.walletAddress ?? null}
                onClose={() => setIsEditModalOpen(false)}
                onSave={handleSaveWallet}
                isSaving={isSaving}
              />
            </div>
          </>
        )}

        {/* Logout section */}
        <div style={{
          marginTop: '2rem',
          paddingTop: '1.5rem',
          borderTop: `1px solid ${COLORS.border}`,
        }}>
          <button
            onClick={() => {
              // Clear Pi session and reload to landing
              if (typeof window !== 'undefined') {
                window.location.href = '/'
              }
            }}
            style={{
              width:        '100%',
              padding:      '0.875rem',
              background:   'transparent',
              border:       `1px solid rgba(239,68,68,0.3)`,
              borderRadius: RADII.md,
              color:        '#EF4444',
              fontSize:     '0.85rem',
              fontWeight:   '600',
              cursor:       'pointer',
              fontFamily:   FONTS.sans,
            }}
          >
            Sign Out
          </button>
        </div>
      </main>
    </div>
  )
}
