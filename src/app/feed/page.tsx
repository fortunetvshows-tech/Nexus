'use client'

import { useState }         from 'react'
import { usePiAuth }        from '@/hooks/use-pi-auth'
import { useTaskSearch }    from '@/hooks/use-task-search'
import { TaskCard }         from '@/components/TaskCard'
import { TaskFilters }      from '@/components/TaskFilters'
import { Navigation }       from '@/components/Navigation'

export default function FeedPage() {
  const [claimedTaskId, setClaimedTaskId] = useState<string | null>(null)
  const { user, authenticate, isLoading: authLoading } = usePiAuth()
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
        background:     '#0f0f0f',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        flexDirection:  'column',
        gap:            '1rem',
        fontFamily:     'system-ui, sans-serif',
      }}>
        <p style={{ color: '#9ca3af', fontSize: '1rem' }}>
          Sign in to browse available tasks
        </p>
        <button
          onClick={authenticate}
          disabled={authLoading}
          style={{
            padding:       '0.75rem 2rem',
            background:    'linear-gradient(135deg, #7B3FE4, #A855F7)',
            color:         'white',
            border:        'none',
            borderRadius:  '10px',
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
      background: '#0f0f0f',
      fontFamily: 'system-ui, sans-serif',
      color:      '#ffffff',
    }}>
      <Navigation currentPage="feed" />

      {claimedTaskId && (
        <div style={{
          position:    'fixed',
          bottom:      '1.5rem',
          left:        '50%',
          transform:   'translateX(-50%)',
          background:  '#1f2937',
          border:      '1px solid #374151',
          borderRadius: '10px',
          padding:     '0.875rem 1.5rem',
          color:       '#e5e7eb',
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
              color:      '#6b7280',
              cursor:     'pointer',
              fontSize:   '0.875rem',
            }}
          >
            ✕
          </button>
        </div>
      )}

      <main style={{
        maxWidth: '680px',
        margin:   '0 auto',
        padding:  '80px 1rem 2rem',
      }}>

        {/* Header */}
        <div style={{
          display:        'flex',
          justifyContent: 'space-between',
          alignItems:     'center',
          marginBottom:   '1.5rem',
        }}>
          <div>
            <h1 style={{
              margin:     '0 0 0.25rem',
              fontSize:   '1.5rem',
              fontWeight: '700',
            }}>
              Find Work
            </h1>
            <p style={{
              margin:   '0',
              color:    '#6b7280',
              fontSize: '0.875rem',
            }}>
              Your reputation score: {user.reputationScore}
            </p>
          </div>
          <button
            onClick={refresh}
            disabled={isLoading}
            style={{
              padding:      '0.5rem 1rem',
              background:   '#111827',
              border:       '1px solid #1f2937',
              borderRadius: '8px',
              color:        '#9ca3af',
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
                background:   '#111827',
                border:       '1px solid #1f2937',
                borderRadius: '16px',
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
            background:   '#111827',
            borderRadius: '16px',
            border:       '1px solid #1f2937',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
              🔍
            </div>
            <h3 style={{ margin: '0 0 0.5rem', color: '#ffffff' }}>
              No tasks found
            </h3>
            <p style={{ color: '#6b7280', margin: '0', fontSize: '0.875rem' }}>
              Try adjusting your filters or check back soon.
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
              border:       '1px solid #374151',
              borderRadius: '10px',
              color:        '#9ca3af',
              fontSize:     '0.875rem',
              cursor:       isLoading ? 'not-allowed' : 'pointer',
              marginTop:    '1rem',
            }}
          >
            {isLoading 
              ? 'Loading...' 
              : `Load more (${pagination.total - tasks.length} remaining)`
            }
          </button>
        )}

      </main>
    </div>
  )
}
