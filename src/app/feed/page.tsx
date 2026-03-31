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
            background:    GRADIENTS.indigo,
            color:         COLORS.textPrimary,
            border:        'none',
            borderRadius:  RADII.lg,
            fontSize:      '1rem',
            fontWeight:    '600',
            cursor:        authLoading ? 'not-allowed' : 'pointer',
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
          background:  COLORS.bgElevated,
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

        {/* Header */}
        <div style={{
          display:        'flex',
          justifyContent: 'space-between',
          alignItems:     'center',
          marginBottom:   '1.5rem',
        }}>
          <div style={{
            marginBottom: SPACING.lg,
          }}>
            <div style={{
              display:      'flex',
              alignItems:   'center',
              gap:          SPACING.sm,
              marginBottom: '4px',
            }}>
              <h1 style={{
                margin:        0,
                fontSize:      '1.4rem',
                fontWeight:    '800',
                color:         COLORS.textPrimary,
                letterSpacing: '-0.02em',
              }}>
                Opportunities
              </h1>
              {!isLoading && pagination?.total && (
                <span style={{
                  padding:      '2px 8px',
                  background:   'rgba(16,185,129,0.1)',
                  border:       '1px solid rgba(16,185,129,0.2)',
                  borderRadius: RADII.full,
                  fontSize:     '0.72rem',
                  fontWeight:   '700',
                  color:        COLORS.emerald,
                  fontFamily:   FONTS.mono,
                }}>
                  {pagination.total} live
                </span>
              )}
            </div>
            <p style={{
              margin:   0,
              fontSize: '0.85rem',
              color:    COLORS.textMuted,
            }}>
              Pick a task, complete it, earn Pi instantly
            </p>
          </div>
          <button
            onClick={refresh}
            disabled={isLoading}
            style={{
              padding:      '0.5rem 1rem',
              background:   COLORS.bgSurface,
              border:       `1px solid ${COLORS.border}`,
              borderRadius: RADII.md,
              color:        COLORS.textSecondary,
              fontSize:     '0.8rem',
              cursor:       isLoading ? 'not-allowed' : 'pointer',
            }}
          >
            ↺ Refresh
          </button>
        </div>

        {/* Search and filters */}
        <TaskFilters
          filters={filters}
          onFilter={setFilters}
          onReset={resetFilters}
          resultCount={pagination?.total ?? 0}
          isLoading={isLoading}
        />

        {/* Loading state */}
        {isLoading && tasks.length === 0 && (
          <div style={{
            display:        'flex',
            flexDirection:  'column',
            gap:            '1rem',
          }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                background:   COLORS.bgSurface,
                border:       `1px solid ${COLORS.border}`,
                borderRadius: RADII.xl,
                height:       '180px',
                animation:    'pulse 2s infinite',
              }} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && tasks.length === 0 && (
          <div style={{
            textAlign:    'center',
            padding:      '4rem 2rem',
            background:   COLORS.bgSurface,
            borderRadius: RADII.xl,
            border:       `1px solid ${COLORS.border}`,
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
              🔍
            </div>
            <h3 style={{ margin: '0 0 0.5rem', color: COLORS.textPrimary }}>
              No opportunities right now
            </h3>
            <p style={{ color: COLORS.textMuted, margin: '0', fontSize: '0.875rem' }}>
              New tasks are posted daily. Check back soon or adjust your filters.
            </p>
          </div>
        )}

        {/* Task list */}
        {tasks.length > 0 && (
          <div style={{
            display:       'flex',
            flexDirection: 'column',
            gap:           '1rem',
            marginBottom:  '1.5rem',
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

        {/* Load more */}
        {pagination?.hasMore && (
          <button
            onClick={loadMore}
            disabled={isLoading}
            style={{
              width:        '100%',
              padding:      '0.875rem',
              background:   'transparent',
              border:       `1px solid ${COLORS.borderAccent}`,
              borderRadius: RADII.lg,
              color:        COLORS.textSecondary,
              fontSize:     '0.875rem',
              cursor:       isLoading ? 'not-allowed' : 'pointer',
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
