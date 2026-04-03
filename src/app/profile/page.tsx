'use client'

import { useEffect, useState } from 'react'
import { usePiAuth } from '@/hooks/use-pi-auth'
import { Navigation } from '@/components/Navigation'
import { COLORS, FONTS, RADII, SPACING } from '@/lib/design/tokens'

interface Profile {
  piUid: string
  piUsername: string
  walletAddress?: string
  reputationScore?: number
  tasksDone?: number
}

export default function ProfilePage() {
  const { user } = usePiAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(!user)

  useEffect(() => {
    if (!user?.piUid) return
    fetch(`${window.location.origin}/api/profile`, {
      headers: { 'x-pi-uid': user.piUid },
    })
      .then(r => r.json())
      .then(d => { if (d.profile) setProfile(d.profile) })
      .finally(() => setLoading(false))
  }, [user?.piUid])

  if (!user) return null

  return (
    <div style={{
      minHeight:  '100vh',
      background: '#07090E',
      fontFamily: FONTS.sans,
      color:      COLORS.textPrimary,
      padding: '20px 16px',
    }}>
      <Navigation currentPage="profile" />

      <main style={{
        maxWidth: '480px',
        margin: '0 auto',
        paddingBottom: SPACING.xxl,
      }}>
        <div style={{
          marginTop: SPACING.lg,
        }}>
          {/* ── Header Card ─────────────────────────── */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(167,139,250,0.1), #131720 60%)',
            border: '1px solid rgba(167,139,250,0.25)',
            borderRadius: 18,
            padding: '20px',
            marginBottom: SPACING.lg,
            textAlign: 'center',
          }}>
            {/* Avatar */}
            <div style={{
              width: 68,
              height: 68,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #A78BFA, #0095FF)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 700,
              fontSize: 24,
              margin: '0 auto 16px',
              border: '2px solid rgba(167,139,250,0.3)',
            }}>
              {user?.piUsername?.charAt(0).toUpperCase() || 'P'}
            </div>

            {/* Username */}
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 24,
              color: '#EEF2FF',
              letterSpacing: 1,
              marginBottom: 8,
            }}>
              {user?.piUsername || 'Pioneer'}
            </div>

            {/* Role + reputation */}
            <div style={{
              display: 'flex',
              gap: 8,
              justifyContent: 'center',
              justifyItems: 'center',
              marginBottom: 12,
              flexWrap: 'wrap',
            }}>
              <div style={{
                padding: '4px 10px',
                background: 'rgba(0,149,255,0.1)',
                border: '1px solid rgba(0,149,255,0.3)',
                borderRadius: 6,
                fontSize: 11,
                color: '#0095FF',
                fontWeight: 600,
              }}>
                Worker
              </div>
              <div style={{
                padding: '4px 10px',
                background: 'rgba(0,214,143,0.1)',
                border: '1px solid rgba(0,214,143,0.3)',
                borderRadius: 6,
                fontSize: 11,
                color: '#00D68F',
                fontWeight: 600,
              }}>
                KYC Verified
              </div>
            </div>

            {/* Rep score */}
            <div style={{
              fontSize: 14,
              color: '#8892A8',
            }}>
              Reputation: {user?.reputationScore ?? 0}
            </div>
          </div>

          {/* ── Stats Row ─────────────────────────── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 12,
            marginBottom: SPACING.lg,
          }}>
            {[
              { label: 'Tasks Done', value: '24' },
              { label: 'Pi Earned', value: '125.5' },
              { label: 'Approval', value: '98%' },
            ].map((stat) => (
              <div key={stat.label} style={{
                background: '#0F1119',
                border: '1px solid #1A1F2E',
                borderRadius: 12,
                padding: '16px 12px',
                textAlign: 'center',
              }}>
                <div style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: 22,
                  color: '#0095FF',
                  lineHeight: 1,
                  marginBottom: 8,
                }}>
                  {stat.value}
                </div>
                <div style={{
                  fontSize: 10,
                  color: '#8892A8',
                  textTransform: 'uppercase',
                }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* ── Wallet Section ───────────────────── */}
          <div style={{
            background: '#0F1119',
            border: '1px solid #1A1F2E',
            borderRadius: 14,
            padding: '16px',
            marginBottom: SPACING.lg,
          }}>
            <div style={{
              fontSize: 12,
              color: '#8892A8',
              textTransform: 'uppercase',
              marginBottom: 10,
              fontWeight: 600,
            }}>
              Wallet Address
            </div>
            <div style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 12,
              color: '#0095FF',
              wordBreak: 'break-all',
              background: 'rgba(0,149,255,0.05)',
              border: '1px solid rgba(0,149,255,0.2)',
              borderRadius: 8,
              padding: '10px',
              marginBottom: 12,
            }}>
              {user?.piUid?.slice(0, 20) + '...' || 'Not set'}
            </div>
            <button style={{
              width: '100%',
              padding: '12px 16px',
              background: 'linear-gradient(135deg, rgba(0,149,255,0.2), rgba(0,149,255,0.05))',
              border: '1px solid rgba(0,149,255,0.3)',
              borderRadius: 8,
              color: '#0095FF',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}>
              Edit
            </button>
          </div>

          {/* ── Settings ─────────────────────────– */}
          <div style={{
            background: '#0F1119',
            border: '1px solid #1A1F2E',
            borderRadius: 14,
            overflow: 'hidden',
          }}>
            {[
              { label: 'Notifications', checked: true },
              { label: 'Marketing', checked: false },
            ].map((setting, i) => (
              <div key={i} style={{
                padding: '14px 16px',
                borderBottom: i < 1 ? '1px solid #1A1F2E' : 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <label style={{
                  fontSize: 14,
                  color: '#EEF2FF',
                  cursor: 'pointer',
                }}>
                  {setting.label}
                </label>
                <input type="checkbox" defaultChecked={setting.checked} style={{
                  cursor: 'pointer',
                }} />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
