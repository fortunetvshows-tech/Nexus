'use client'

import { useState } from 'react'
import { usePiAuth } from '@/hooks/use-pi-auth'
import { useTaskSearch } from '@/hooks/use-task-search'
import { TaskCard } from '@/components/TaskCard'
import { Navigation } from '@/components/Navigation'
import { COLORS, FONTS, RADII, SPACING } from '@/lib/design/tokens'

export default function FeedPage() {
  const { user, isLoading: authLoading } = usePiAuth()
  const {
    tasks,
    pagination,
    isLoading,
    filters,
    setFilters,
  } = useTaskSearch(user?.piUid)

  if (!user) {
    return (
      <div style={{
        minHeight:      '100vh',
        background:     '#07090E',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        flexDirection:  'column',
        gap:            '1rem',
        fontFamily:     FONTS.sans,
      }}>
        <p style={{ color: '#8892A8', fontSize: '1rem' }}>
          Sign in to see earning opportunities
        </p>
        <button
          onClick={() => window.location.reload()}
          disabled={authLoading}
          style={{
            padding:       '0.75rem 2rem',
            background:    '#0095FF',
            color:         'white',
            border:        'none',
            borderRadius:  RADII.lg,
            fontSize:      '1rem',
            fontWeight:    '600',
            cursor:        authLoading ? 'not-allowed' : 'pointer',
            boxShadow:     '0 0 24px rgba(0,149,255,0.28)',
          }}
        >
          {authLoading ? 'Connecting...' : 'Connect with Pi'}
        </button>
      </div>
    )
  }

  const categories = ['All', 'Writing', 'Design', 'Analysis', 'Testing', 'Video']
  const featuredTask = tasks?.[0] as any

  return (
    <div style={{
      minHeight:  '100vh',
      background: '#07090E',
      fontFamily: FONTS.sans,
      color:      COLORS.textPrimary,
      padding: '20px 16px',
    }}>
      <Navigation currentPage="feed" />

      <main style={{
        maxWidth: '480px',
        margin: '0 auto',
        paddingBottom: SPACING.xxl,
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: SPACING.lg,
          marginTop: SPACING.lg,
        }}>
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 24,
            color: '#EEF2FF',
            letterSpacing: 2,
          }}>
            DISCOVER
          </div>
          <div style={{
            fontSize: 20,
          }}>
            🔔
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          scrollBehavior: 'smooth',
          marginBottom: SPACING.lg,
          paddingBottom: 8,
          scrollbarWidth: 'none',
        }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilters({ ...filters, category: cat === 'All' ? '' : cat })}
              style={{
                padding: '8px 16px',
                background: (filters.category === cat || (cat === 'All' && !filters.category))
                  ? 'rgba(0,149,255,0.2)'
                  : 'transparent',
                border: (filters.category === cat || (cat === 'All' && !filters.category))
                  ? '1px solid #0095FF'
                  : '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                color: (filters.category === cat || (cat === 'All' && !filters.category))
                  ? '#0095FF'
                  : '#8892A8',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {featuredTask && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(0,149,255,0.10) 0%, rgba(167,139,250,0.07) 50%, #131720 100%)',
            border: '1px solid rgba(0,149,255,0.28)',
            borderRadius: 24,
            padding: '20px',
            marginBottom: SPACING.lg,
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 12,
            }}>
              <div style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 38,
                color: '#0095FF',
                lineHeight: 1,
              }}>
                {featuredTask.piReward}π
              </div>
              <div style={{
                padding: '4px 10px',
                background: 'rgba(255,176,32,0.1)',
                border: '1px solid rgba(255,176,32,0.3)',
                borderRadius: 6,
                fontSize: 10,
                color: '#FFB020',
                fontWeight: 600,
                textTransform: 'uppercase',
              }}>
                FEATURED
              </div>
            </div>
            <div style={{
              display: 'flex',
              gap: 8,
              marginBottom: 12,
              flexWrap: 'wrap',
            }}>
              <div style={{
                padding: '4px 10px',
                background: 'rgba(0,214,143,0.1)',
                border: '1px solid rgba(0,214,143,0.3)',
                borderRadius: 6,
                fontSize: 11,
                color: '#00D68F',
                fontWeight: 600,
              }}>
                {featuredTask.category}
              </div>
              <div style={{
                padding: '4px 10px',
                background: 'rgba(0,149,255,0.1)',
                border: '1px solid rgba(0,149,255,0.3)',
                borderRadius: 6,
                fontSize: 11,
                color: '#0095FF',
                fontWeight: 600,
              }}>
                By Acme Corp
              </div>
            </div>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 16,
              color: '#EEF2FF',
              marginBottom: 12,
              lineHeight: 1.3,
            }}>
              {featuredTask.title}
            </div>
            <div style={{
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
              fontSize: 11,
              color: '#8892A8',
            }}>
              <span>5 slots</span>
              <span>·</span>
              <span>30 min</span>
              <span>·</span>
              <span>Due soon</span>
            </div>
          </div>
        )}

        {isLoading ? (
          <div style={{
            textAlign: 'center',
            padding: SPACING.xl,
            color: '#8892A8',
          }}>
            Loading opportunities...
          </div>
        ) : tasks && tasks.length > 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}>
            {(tasks as any)?.slice(1)?.map((task: any) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: SPACING.xl,
            color: '#8892A8',
            fontSize: 14,
          }}>
            No tasks match your filter. Check back soon!
          </div>
        )}
      </main>
    </div>
  )
}
