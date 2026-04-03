'use client'

import { useState }         from 'react'
import { usePiAuth }        from '@/hooks/use-pi-auth'
import { useTaskSearch }    from '@/hooks/use-task-search'
import { TaskCard }         from '@/components/TaskCard'
import { TaskFilters }      from '@/components/TaskFilters'
import { Navigation }       from '@/components/Navigation'
import { COLORS, FONTS, RADII, SHADOWS, GRADIENTS, SPACING, statusStyle } from '@/lib/design/tokens'

export default function FeedPage() {
  const [claimedTaskId, setClaimedTaskId] = useState<string | null>(null)
  const { user, isLoading: authLoading } = usePiAuth()
  const {
    tasks,
    pagination,
    isLoading,
    filters,
    setFilters,
    resetFilters,
    loadMore,
    refresh,
  } = useTaskSearch(user?.piUid)

  // Not authenticated
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
        <p style={{ color: COLORS.textSecondary, fontSize: '1rem' }}>
          Sign in to see earning opportunities
        </p>
        <button
          onClick={() => window.location.reload()}
          disabled={authLoading}
          style={{
            padding:       '0.75rem 2rem',
            background:    `linear-gradient(135deg, ${COLORS.sapphire}, ${COLORS.sapphireDark})`,
            color:         'white',
            border:        `1px solid ${COLORS.cyan}`,
            borderRadius:  RADII.lg,
            fontSize:      '1rem',
            fontWeight:    '600',
            cursor:        authLoading ? 'not-allowed' : 'pointer',
            boxShadow:     authLoading ? 'none' : SHADOWS.cyanGlow,
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
      <Navigation currentPage="feed" />

      {claimedTaskId && (
        <div style={{
          position:    'fixed',
          bottom:      '1.5rem',
          left:        '50%',
          transform:   'translateX(-50%)',
          background:  COLORS.bgRaised,
          border:      `1px solid ${COLORS.borderAccent}`,
          borderRadius: RADII.lg,
          padding:     '0.875rem 1.5rem',
          color:       COLORS.textSecondary,
          fontSize:    '0.875rem',
          zIndex:      200,
          whiteSpace:  'nowrap',
          boxShadow:   '0 4px 24px rgba(0,0,0,0.4)',
        }}>
          Task claiming coming in the next update
          <button
            onClick={() => setClaimedTaskId(null)}
            style={{
              marginLeft: '1rem',
              background: 'none',
              border:     'none',
              color:      COLORS.textMuted,
              cursor:     'pointer',
              fontSize:   '0.875rem',
            }}
          >
            ✕
          </button>
        </div>
      )}

      <main className="page-main">

        {/* HERO SECTION — Earning Potential + Stats */}
        <div style={{
          background:     GRADIENTS.card,
          border:         `1px solid ${COLORS.borderAccent}`,
          borderRadius:   RADII.xl,
          padding:        SPACING.xl,
          marginBottom:   SPACING.xxxl,
          position:       'relative',
          overflow:       'hidden',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)' as any,
        }}>
          {/* Decorative grid background */}
          <div style={{
            position:  'absolute',
            inset:     0,
            opacity:   0.4,
            background: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h60v60H0z' fill='%23080A0F'/%3E%3Cpath d='M0 0L60 60M60 0L0 60' stroke='rgba(0,150,255,0.08)' stroke-width='0.5'/%3E%3C/svg%3E")`,
            pointerEvents: 'none',
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Top row: Title + Live count */}
            <div style={{
              display:        'flex',
              justifyContent: 'space-between',
              alignItems:     'flex-start',
              marginBottom:   SPACING.xl,
            }}>
              <div>
                <h1 style={{
                  margin:       0,
                  fontSize:     '2rem',
                  fontWeight:   '800',
                  color:        COLORS.textPrimary,
                  letterSpacing: '-0.03em',
                  fontFamily:   FONTS.display,
                }}>
                  Earn Pi Today
                </h1>
                <p style={{
                  margin:   SPACING.sm + ' 0 0',
                  fontSize: '0.9rem',
                  color:    COLORS.textSecondary,
                }}>
                  Complete verified work · Get paid instantly
                </p>
              </div>
              {!isLoading && pagination?.total && (
                <div style={{
                  padding:      SPACING.md + ' ' + SPACING.lg,
                  background:   COLORS.accent.glow,
                  border:       `1px solid ${COLORS.accent.dim}`,
                  borderRadius: RADII.md,
                  textAlign:    'center',
                }}>
                  <div style={{
                    fontSize:   '1.5rem',
                    fontWeight: '800',
                    color:      COLORS.accent.bright,
                    fontFamily: FONTS.mono,
                  }}>
                    {pagination.total}
                  </div>
                  <div style={{
                    fontSize:  '0.7rem',
                    color:     COLORS.textMuted,
                    marginTop: '2px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    Live Now
                  </div>
                </div>
              )}
            </div>

            {/* Quick stats row */}
            <div style={{
              display:       'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap:           SPACING.lg,
              marginBottom:  SPACING.xl,
            }}>
              {[
                { label: 'Avg. Reward', value: '5-50 Pi' },
                { label: 'Quickest Task', value: '5 min' },
                { label: 'Your Streak', value: '0 days' },
              ].map((stat, i) => (
                <div key={i} style={{
                  padding:    SPACING.md,
                  background: `rgba(0,150,255,0.05)`,
                  border:     `1px solid rgba(0,150,255,0.1)`,
                  borderRadius: RADII.md,
                }}>
                  <div style={{
                    fontSize:   '0.75rem',
                    color:      COLORS.textMuted,
                    marginBottom: '4px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    {stat.label}
                  </div>
                  <div style={{
                    fontSize:   '1.1rem',
                    fontWeight: '700',
                    color:      COLORS.accent.bright,
                    fontFamily: FONTS.mono,
                  }}>
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <button
              onClick={refresh}
              disabled={isLoading}
              style={{
                width:         '100%',
                padding:       SPACING.lg,
                background:    GRADIENTS.primary,
                color:         'white',
                border:        'none',
                borderRadius:  RADII.lg,
                fontSize:      '1rem',
                fontWeight:    '700',
                cursor:        isLoading ? 'not-allowed' : 'pointer',
                boxShadow:     SHADOWS.accentGlow,
                transition:    'all 0.2s ease',
                fontFamily:    FONTS.sans,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = SHADOWS.cardHover
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = SHADOWS.accentGlow
              }}
            >
              {isLoading ? '⟳ Loading...' : '↻ Refresh Opportunities'}
            </button>
          </div>
        </div>

        {/* FILTERING SECTION */}
        <div style={{
          marginBottom: SPACING.xxl,
        }}>
          <h2 style={{
            fontSize:   '0.9rem',
            fontWeight: '700',
            color:      COLORS.textMuted,
            margin:     `0 0 ${SPACING.md} 0`,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontFamily: FONTS.sans,
          }}>
            Filter & Discover
          </h2>
          <TaskFilters
            filters={filters}
            onFilter={setFilters}
            onReset={resetFilters}
            resultCount={pagination?.total ?? 0}
            isLoading={isLoading}
          />
        </div>

        {/* LOADING STATE — Skeleton cards with glassmorphism */}
        {isLoading && tasks.length === 0 && (
          <div style={{
            display:       'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap:           SPACING.lg,
            marginBottom:  SPACING.xxl,
          }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} style={{
                background:   COLORS.bgCard,
                border:       `1px solid ${COLORS.border}`,
                borderRadius: RADII.lg,
                height:       '240px',
                animation:    'pulse 2s infinite',
                backdropFilter: 'blur(10px)',
              }} />
            ))}
          </div>
        )}

        {/* EMPTY STATE — Motivational messaging */}
        {!isLoading && tasks.length === 0 && (
          <div style={{
            textAlign:    'center',
            padding:      `${SPACING.xxxl} ${SPACING.xl}`,
            background:   COLORS.bgCard,
            borderRadius: RADII.xl,
            border:       `1px dashed ${COLORS.borderAccent}`,
            marginBottom: SPACING.xxl,
          }}>
            <div style={{
              fontSize:      '3rem',
              marginBottom:  SPACING.lg,
              animation:     'pulse 2s infinite',
            }}>
              🔍
            </div>
            <h3 style={{
              margin:       `0 0 ${SPACING.md} 0`,
              fontSize:     '1.2rem',
              color:        COLORS.textPrimary,
              fontFamily:   FONTS.display,
              fontWeight:   '700',
            }}>
              No tasks match right now
            </h3>
            <p style={{
              color:       COLORS.textSecondary,
              margin:      0,
              fontSize:    '0.9rem',
              maxWidth:    '400px',
              marginLeft:  'auto',
              marginRight: 'auto',
            }}>
              New opportunities post every hour. Adjust your filters or check back soon. Workers with higher badges unlock premium tasks.
            </p>
          </div>
        )}

        {/* TASK GRID — Bento-style card layout */}
        {tasks.length > 0 && (
          <div style={{
            display:       'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap:           SPACING.lg,
            marginBottom:  SPACING.xxl,
          }}>
            {tasks.map((task: any) => (
              <TaskCard
                key={task.id}
                task={task}
                workerReputation={user.reputationScore}
              />
            ))}
          </div>
        )}

        {/* LOAD MORE */}
        {pagination?.hasMore && (
          <button
            onClick={loadMore}
            disabled={isLoading}
            style={{
              width:        '100%',
              padding:      SPACING.lg,
              background:   'transparent',
              border:       `1px solid ${COLORS.borderAccent}`,
              borderRadius: RADII.lg,
              color:        COLORS.accent.bright,
              fontSize:     '0.95rem',
              fontWeight:   '600',
              cursor:       isLoading ? 'not-allowed' : 'pointer',
              transition:   'all 0.2s ease',
              marginTop:    '1rem',
            }}
          >
            {isLoading
              ? 'Finding more opportunities...'
              : `See ${pagination.total - tasks.length} more opportunities`
            }
          </button>
        )}

        {/* Floating Action Button — quick access to post */}
        {user?.isAdmin && (
          <a href="/employer" className="fab" title="Post an opportunity">
            ✚
          </a>
        )}

      </main>
    </div>
  )
}


