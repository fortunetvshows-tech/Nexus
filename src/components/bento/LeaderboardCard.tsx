'use client'
import { useState, useEffect } from 'react'
import { COLORS, FONTS, RADII, SPACING } from '@/lib/design/tokens'

interface LeaderEntry {
  rank:            number
  id:              string
  piUsername:      string
  reputationLevel: string
  weeklyEarned:    number
}

interface LeaderboardCardProps {
  piUid:    string
  username: string
}

const RANK_ICONS: Record<number, string> = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
}

export function LeaderboardCard({ piUid, username }: LeaderboardCardProps) {
  const [leaders,    setLeaders]    = useState<LeaderEntry[]>([])
  const [userRank,   setUserRank]   = useState<number | null>(null)
  const [userEarned, setUserEarned] = useState<number>(0)
  const [isLoading,  setIsLoading]  = useState(true)

  useEffect(() => {
    if (!piUid) return
    fetch(`${window.location.origin}/api/leaderboard`, {
      headers: { 'x-pi-uid': piUid },
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setLeaders(data.leaderboard ?? [])
          setUserRank(data.userRank ?? null)
          setUserEarned(data.userEarned ?? 0)
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [piUid])

  const isInTop10 = userRank !== null && userRank <= 10

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' as const }}>
      {/* Header */}
      <div style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        marginBottom:   SPACING.md,
      }}>
        <div style={{
          fontSize:      '0.65rem',
          fontWeight:    '700',
          color:         COLORS.textMuted,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.1em',
        }}>
          🏆 This Week
        </div>
        <div style={{
          fontSize:     '0.65rem',
          color:        COLORS.textMuted,
          fontStyle:    'italic',
        }}>
          Resets Monday
        </div>
      </div>

      {/* Leaders list */}
      {isLoading ? (
        <div style={{
          flex:           1,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          color:          COLORS.textMuted,
          fontSize:       '0.82rem',
        }}>
          Loading...
        </div>
      ) : leaders.length === 0 ? (
        <div style={{
          flex:           1,
          display:        'flex',
          flexDirection:  'column' as const,
          alignItems:     'center',
          justifyContent: 'center',
          color:          COLORS.textMuted,
          fontSize:       '0.82rem',
          textAlign:      'center' as const,
          gap:            SPACING.sm,
        }}>
          <span style={{ fontSize: '1.5rem' }}>🏆</span>
          No earnings yet this week.
          <span style={{ fontSize: '0.72rem' }}>
            Be the first to top the board!
          </span>
        </div>
      ) : (
        <div style={{
          flex:     1,
          overflow: 'hidden',
        }}>
          {leaders.map((leader, idx) => {
            const isCurrentUser = leader.piUsername === username
            const icon = RANK_ICONS[leader.rank]

            return (
              <div
                key={leader.id}
                style={{
                  display:        'flex',
                  alignItems:     'center',
                  gap:            SPACING.sm,
                  padding:        `5px ${SPACING.sm}`,
                  borderRadius:   RADII.md,
                  marginBottom:   '2px',
                  background:     isCurrentUser
                    ? 'rgba(99,102,241,0.1)'
                    : 'transparent',
                  border:         isCurrentUser
                    ? '1px solid rgba(99,102,241,0.2)'
                    : '1px solid transparent',
                }}
              >
                {/* Rank */}
                <div style={{
                  width:          '24px',
                  textAlign:      'center' as const,
                  fontSize:       icon ? '1rem' : '0.72rem',
                  fontFamily:     FONTS.mono,
                  color:          COLORS.textMuted,
                  fontWeight:     '700',
                  flexShrink:     0,
                }}>
                  {icon ?? `#${leader.rank}`}
                </div>

                {/* Username */}
                <div style={{
                  flex:       1,
                  fontSize:   '0.78rem',
                  fontWeight: isCurrentUser ? '700' : '400',
                  color:      isCurrentUser
                    ? COLORS.indigo
                    : COLORS.textSecondary,
                  overflow:     'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace:   'nowrap' as const,
                }}>
                  {leader.piUsername}
                  {isCurrentUser && (
                    <span style={{
                      fontSize:    '0.6rem',
                      color:       COLORS.indigo,
                      marginLeft:  '4px',
                      fontWeight:  '600',
                    }}>
                      YOU
                    </span>
                  )}
                </div>

                {/* Amount */}
                <div style={{
                  fontFamily:    FONTS.mono,
                  fontSize:      '0.78rem',
                  fontWeight:    '700',
                  color:         COLORS.emerald,
                  flexShrink:    0,
                }}>
                  {leader.weeklyEarned.toFixed(2)}π
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Current user rank if not in top 10 */}
      {!isInTop10 && userRank !== null && (
        <div style={{
          marginTop:    SPACING.sm,
          paddingTop:   SPACING.sm,
          borderTop:    `1px solid ${COLORS.border}`,
          display:      'flex',
          alignItems:   'center',
          gap:          SPACING.sm,
          padding:      `${SPACING.sm} ${SPACING.sm}`,
          background:   'rgba(99,102,241,0.06)',
          borderRadius: RADII.md,
        }}>
          <div style={{
            fontFamily: FONTS.mono,
            fontSize:   '0.72rem',
            color:      COLORS.textMuted,
            flexShrink: 0,
          }}>
            #{userRank}
          </div>
          <div style={{
            flex:      1,
            fontSize:  '0.78rem',
            color:     COLORS.indigo,
            fontWeight: '600',
          }}>
            {username} (You)
          </div>
          <div style={{
            fontFamily: FONTS.mono,
            fontSize:   '0.78rem',
            color:      COLORS.emerald,
            fontWeight: '700',
          }}>
            {userEarned.toFixed(2)}π
          </div>
        </div>
      )}

      {/* Not yet on board */}
      {userRank === null && !isLoading && (
        <div style={{
          marginTop:  SPACING.sm,
          paddingTop: SPACING.sm,
          borderTop:  `1px solid ${COLORS.border}`,
          fontSize:   '0.72rem',
          color:      COLORS.textMuted,
          textAlign:  'center' as const,
        }}>
          Complete a task this week to appear on the board
        </div>
      )}
    </div>
  )
}

