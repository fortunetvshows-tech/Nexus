'use client'

import React, { useState, useMemo, ReactNode } from 'react'
import { usePiAuth } from '@/hooks/use-pi-auth'
import { useTaskSearch } from '@/hooks/use-task-search'
import { TaskCard } from '@/components/TaskCard'
import { COLORS, FONTS, RADII, SPACING } from '@/lib/design/tokens'

type FilterId = 'all' | 'featured' | 'high-pay' | 'expiring' | 'new'

const FeedPage: React.FC = () => {
  const { user, isLoading: authLoading } = usePiAuth()
  const { tasks } = useTaskSearch(user?.piUid)
  const [activeFilter, setActiveFilter] = useState<FilterId>('all')

  if (!user) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#07090E',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1rem',
        fontFamily: FONTS.sans,
      }}>
        <p style={{ color: '#8892A8', fontSize: '1rem' }}>
          Sign in to see earning opportunities
        </p>
        <button
          onClick={() => typeof window !== 'undefined' && window.location.reload()}
          disabled={authLoading}
          style={{
            padding: '0.75rem 2rem',
            background: '#0095FF',
            color: 'white',
            border: 'none',
            borderRadius: RADII.lg,
            fontSize: '1rem',
            fontWeight: '600',
            cursor: authLoading ? 'not-allowed' : 'pointer',
            boxShadow: '0 0 24px rgba(0,149,255,0.28)',
          }}
        >
          {authLoading ? 'Connecting...' : 'Connect with Pi'}
        </button>
      </div>
    )
  }

  // Smart sort based on active filter
  const sortedTasks: any[] = useMemo(() => {
    if (!tasks) return []
    const tasksCopy = [...(tasks as any[])]

    switch (activeFilter) {
      case 'featured':
        return tasksCopy.filter((t: any) => t.isFeatured)
      case 'high-pay':
        return tasksCopy.sort((a: any, b: any) => b.piReward - a.piReward)
      case 'expiring':
        return tasksCopy
          .filter((t: any) => {
            const deadline = new Date(t.deadline)
            return deadline > new Date()
          })
          .sort((a: any, b: any) => {
            const deadlineA = new Date(a.deadline).getTime()
            const deadlineB = new Date(b.deadline).getTime()
            return deadlineA - deadlineB
          })
      case 'new':
        return tasksCopy.sort((a: any, b: any) => {
          const dateA = new Date(a.createdAt || a.deadline).getTime()
          const dateB = new Date(b.createdAt || b.deadline).getTime()
          return dateB - dateA
        })
      default:
        return tasksCopy
    }
  }, [tasks, activeFilter])

  const filterChips: { id: string; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'featured', label: '⚡ Featured' },
    { id: 'high-pay', label: '💰 High Pay' },
    { id: 'expiring', label: '⏰ Expiring' },
    { id: 'new', label: '✨ New' },
  ]

  const featuredTask = (tasks?.find((t: any) => t.isFeatured) || tasks?.[0]) as any

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#07090E',
        fontFamily: FONTS.sans,
        color: COLORS.textPrimary,
        padding: '20px 16px',
        paddingBottom: '120px',
      }}
    >
      {/* TopBar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: SPACING.lg,
          marginTop: 0,
        }}
      >
        <div
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 24,
            color: '#EEF2FF',
            letterSpacing: 2,
            textTransform: 'uppercase',
          }}
        >
          Discover
        </div>
        <div style={{ fontSize: 20 }}>🔔</div>
      </div>

      <main style={{ maxWidth: '600px', margin: '0 auto' }}>
        <>
          {/* Filter Chips */}
          <div
          style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            scrollBehavior: 'smooth',
            marginBottom: SPACING.lg,
            paddingBottom: 8,
            scrollbarWidth: 'none',
          }}
        >
        {filterChips.map((filter: any) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              style={{
                padding: '7px 14px',
                borderRadius: 100,
                border: `1px solid ${
                  activeFilter === filter.id
                    ? '#0095FF'
                    : 'rgba(255,255,255,0.12)'
                }`,
                background:
                  activeFilter === filter.id
                    ? 'rgba(0,149,255,0.13)'
                    : '#131720',
                color:
                  activeFilter === filter.id ? '#38B2FF' : '#8892A8',
                fontSize: 12,
                fontWeight: 700,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.18s',
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Featured Task */}
        {featuredTask && (
          <div
            style={{
              background:
                'linear-gradient(135deg, rgba(0,149,255,0.10) 0%, rgba(167,139,250,0.07) 50%, #131720 100%)',
              border: '1px solid rgba(0,149,255,0.28)',
              borderRadius: 24,
              padding: '20px',
              marginBottom: SPACING.lg,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: 38,
                  color: '#0095FF',
                  lineHeight: 1,
                }}
              >
                {featuredTask.piReward}π
              </div>
              {featuredTask.isFeatured && (
                <div
                  style={{
                    padding: '4px 10px',
                    background: 'rgba(255,176,32,0.1)',
                    border: '1px solid rgba(255,176,32,0.3)',
                    borderRadius: 6,
                    fontSize: 10,
                    color: '#FFB020',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                  }}
                >
                  ⭐ Featured
                </div>
              )}
            </div>
            <div
              style={{
                display: 'flex',
                gap: 8,
                marginBottom: 12,
                flexWrap: 'wrap',
              }}
            >
              <div
                style={{
                  padding: '4px 10px',
                  background: 'rgba(0,214,143,0.1)',
                  border: '1px solid rgba(0,214,143,0.3)',
                  borderRadius: 6,
                  fontSize: 11,
                  color: '#00D68F',
                  fontWeight: 600,
                }}
              >
                {featuredTask.category}
              </div>
              <div
                style={{
                  padding: '4px 10px',
                  background: 'rgba(0,149,255,0.1)',
                  border: '1px solid rgba(0,149,255,0.3)',
                  borderRadius: 6,
                  fontSize: 11,
                  color: '#0095FF',
                  fontWeight: 600,
                }}
              >
                {featuredTask.employer?.piUsername || 'Employer'}
              </div>
            </div>
            <div
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 16,
                color: '#EEF2FF',
                marginBottom: 12,
                lineHeight: 1.3,
              }}
            >
              {featuredTask.title}
            </div>
            <div
              style={{
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap',
                fontSize: 11,
                color: '#8892A8',
              }}
            >
              <span>{featuredTask.slotsRemaining} slots</span>
              <span>·</span>
              <span>{featuredTask.timeEstimateMin} min</span>
              <span>·</span>
              <span>Due soon</span>
            </div>
          </div>
        )}

        {/* Task List */}
        {sortedTasks.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sortedTasks.map((task: any) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: SPACING.xl,
              color: '#8892A8',
              fontSize: 14,
            }}
          >
            No tasks match your filter. Check back soon!
          </div>
        )}
        </>
      </main>
    </div>
  )
}

export default FeedPage
