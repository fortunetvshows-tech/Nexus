'use client'

import { useState } from 'react'
import {
  TaskSearchFilters,
  DEFAULT_FILTERS,
  TASK_CATEGORIES,
} from '@/hooks/use-task-search'
import { COLORS, FONTS, RADII, SHADOWS, GRADIENTS, SPACING, statusStyle } from '@/lib/design/tokens'

interface TaskFiltersProps {
  filters:      TaskSearchFilters
  onFilter:     (partial: Partial<TaskSearchFilters>) => void
  onReset:      () => void
  resultCount:  number
  isLoading:    boolean
}

export function TaskFilters({
  filters,
  onFilter,
  onReset,
  resultCount,
  isLoading,
}: TaskFiltersProps) {

  const [isExpanded, setIsExpanded] = useState(false)

  const hasActiveFilters =
    filters.search     !== DEFAULT_FILTERS.search     ||
    filters.category   !== DEFAULT_FILTERS.category   ||
    filters.minReward  !== DEFAULT_FILTERS.minReward  ||
    filters.maxReward  !== DEFAULT_FILTERS.maxReward  ||
    filters.sort       !== DEFAULT_FILTERS.sort

  return (
    <div style={{ marginBottom: '1.5rem' }}>

      {/* Search bar */}
      <div style={{
        position:     'relative',
        marginBottom: '0.75rem',
      }}>
        <span style={{
          position:   'absolute',
          left:       '0.875rem',
          top:        '50%',
          transform:  'translateY(-50%)',
          fontSize:   '1rem',
          pointerEvents: 'none',
        }}>
          🔍
        </span>
        <input
          type="text"
          placeholder="Search tasks..."
          value={filters.search}
          onChange={e => onFilter({ search: e.target.value })}
          style={{
            width:        '100%',
            padding:      '0.75rem 0.875rem 0.75rem 2.5rem',
            background:   '#111827',
            border:       '1px solid #1f2937',
            borderRadius: '10px',
            color:        '#ffffff',
            fontSize:     '0.9rem',
            outline:      'none',
            boxSizing:    'border-box' as const,
          }}
        />
        {filters.search && (
          <button
            onClick={() => onFilter({ search: '' })}
            style={{
              position:   'absolute',
              right:      '0.875rem',
              top:        '50%',
              transform:  'translateY(-50%)',
              background: 'transparent',
              border:     'none',
              color:      '#6b7280',
              cursor:     'pointer',
              fontSize:   '1rem',
              padding:    '0',
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Filter toggle + sort row */}
      <div style={{
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'center',
        marginBottom:   isExpanded ? '0.75rem' : '0',
      }}>
        <button
          onClick={() => setIsExpanded(prev => !prev)}
          style={{
            display:    'flex',
            alignItems: 'center',
            gap:        '0.4rem',
            padding:    '0.4rem 0.875rem',
            background: hasActiveFilters ? '#1e1b4b' : '#111827',
            border:     `1px solid ${hasActiveFilters ? '#7B3FE4' : '#1f2937'}`,
            borderRadius: '8px',
            color:      hasActiveFilters ? '#a78bfa' : '#6b7280',
            fontSize:   '0.8rem',
            cursor:     'pointer',
          }}
        >
          ⚙ Filters
          {hasActiveFilters && (
            <span style={{
              background:   '#7B3FE4',
              color:        'white',
              borderRadius: '9999px',
              padding:      '0 6px',
              fontSize:     '0.65rem',
              fontWeight:   '700',
            }}>
              ON
            </span>
          )}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {!isLoading && (
            <span style={{ fontSize: '0.78rem', color: '#4b5563' }}>
              {resultCount} task{resultCount !== 1 ? 's' : ''}
            </span>
          )}
          <select
            value={filters.sort}
            onChange={e => onFilter({
              sort: e.target.value as TaskSearchFilters['sort']
            })}
            style={{
              padding:      '0.4rem 0.75rem',
              background:   '#111827',
              border:       '1px solid #1f2937',
              borderRadius: '8px',
              color:        '#ffffff',
              fontSize:     '0.8rem',
              cursor:       'pointer',
              outline:      'none',
            }}
          >
            <option value="newest">Newest</option>
            <option value="reward_high">Highest reward</option>
            <option value="reward_low">Lowest reward</option>
            <option value="ending_soon">Ending soon</option>
          </select>
        </div>
      </div>

      {/* Expanded filters panel */}
      {isExpanded && (
        <div style={{
          background:   '#111827',
          border:       '1px solid #1f2937',
          borderRadius: '12px',
          padding:      '1.25rem',
        }}>

          {/* Category filter */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{
              display:      'block',
              fontSize:     '0.78rem',
              color:        '#6b7280',
              marginBottom: '0.5rem',
              fontWeight:   '500',
            }}>
              Category
            </label>
            <div style={{
              display:   'flex',
              flexWrap:  'wrap' as const,
              gap:       '0.4rem',
            }}>
              <button
                onClick={() => onFilter({ category: '' })}
                style={{
                  padding:      '0.35rem 0.75rem',
                  borderRadius: '9999px',
                  border:       'none',
                  background:   !filters.category ? '#7B3FE4' : '#1f2937',
                  color:        !filters.category ? 'white' : '#9ca3af',
                  fontSize:     '0.78rem',
                  cursor:       'pointer',
                  fontWeight:   !filters.category ? '600' : '400',
                }}
              >
                All
              </button>
              {TASK_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => onFilter({
                    category: filters.category === cat ? '' : cat,
                  })}
                  style={{
                    padding:      '0.35rem 0.75rem',
                    borderRadius: '9999px',
                    border:       'none',
                    background:   filters.category === cat ? '#7B3FE4' : '#1f2937',
                    color:        filters.category === cat ? 'white' : '#9ca3af',
                    fontSize:     '0.78rem',
                    cursor:       'pointer',
                    fontWeight:   filters.category === cat ? '600' : '400',
                    whiteSpace:   'nowrap' as const,
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Reward range */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{
              display:      'block',
              fontSize:     '0.78rem',
              color:        '#6b7280',
              marginBottom: '0.5rem',
              fontWeight:   '500',
            }}>
              Reward range (π)
            </label>
            <div style={{
              display: 'flex',
              gap:     '0.75rem',
              alignItems: 'center',
            }}>
              <input
                type="number"
                placeholder="Min"
                value={filters.minReward || ''}
                onChange={e => onFilter({
                  minReward: parseFloat(e.target.value) || 0,
                })}
                min={0}
                step={0.1}
                style={{
                  flex:         1,
                  padding:      '0.5rem 0.75rem',
                  background:   '#0f172a',
                  border:       '1px solid #374151',
                  borderRadius: '8px',
                  color:        '#ffffff',
                  fontSize:     '0.875rem',
                  outline:      'none',
                  boxSizing:    'border-box' as const,
                }}
              />
              <span style={{ color: '#4b5563', fontSize: '0.875rem' }}>
                to
              </span>
              <input
                type="number"
                placeholder="Max"
                value={filters.maxReward < 1000 ? filters.maxReward : ''}
                onChange={e => onFilter({
                  maxReward: parseFloat(e.target.value) || 1000,
                })}
                min={0}
                step={0.1}
                style={{
                  flex:         1,
                  padding:      '0.5rem 0.75rem',
                  background:   '#0f172a',
                  border:       '1px solid #374151',
                  borderRadius: '8px',
                  color:        '#ffffff',
                  fontSize:     '0.875rem',
                  outline:      'none',
                  boxSizing:    'border-box' as const,
                }}
              />
            </div>
          </div>

          {/* Reset button */}
          {hasActiveFilters && (
            <button
              onClick={onReset}
              style={{
                width:        '100%',
                padding:      '0.6rem',
                background:   'transparent',
                border:       '1px solid #374151',
                borderRadius: '8px',
                color:        '#6b7280',
                fontSize:     '0.8rem',
                cursor:       'pointer',
              }}
            >
              Reset all filters
            </button>
          )}
        </div>
      )}
    </div>
  )
}
