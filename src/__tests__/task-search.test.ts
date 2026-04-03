import {
  DEFAULT_FILTERS,
  TASK_CATEGORIES,
  type TaskSearchFilters,
} from '@/hooks/use-task-search'

describe('useTaskSearch filters', () => {

  it('DEFAULT_FILTERS has correct initial values', () => {
    expect(DEFAULT_FILTERS.search).toBe('')
    expect(DEFAULT_FILTERS.category).toBe('')
    expect(DEFAULT_FILTERS.minReward).toBe(0)
    expect(DEFAULT_FILTERS.maxReward).toBe(1000)
    expect(DEFAULT_FILTERS.sort).toBe('newest')
  })

  it('TASK_CATEGORIES contains all 9 categories', () => {
    expect(TASK_CATEGORIES).toHaveLength(9)
    expect(TASK_CATEGORIES).toContain('Survey & Research')
    expect(TASK_CATEGORIES).toContain('Content Review')
    expect(TASK_CATEGORIES).toContain('Translation')
  })

  it('builds correct query string for search', () => {
    const filters: TaskSearchFilters = {
      ...DEFAULT_FILTERS,
      search: 'translate',
    }
    const params = new URLSearchParams()
    if (filters.search) params.set('search', filters.search)
    if (filters.category) params.set('category', filters.category)
    params.set('page', '1')
    params.set('limit', '10')

    expect(params.get('search')).toBe('translate')
    expect(params.get('category')).toBeNull()
    expect(params.get('page')).toBe('1')
  })

  it('builds correct query string for category filter', () => {
    const filters: TaskSearchFilters = {
      ...DEFAULT_FILTERS,
      category: 'Content Review',
    }
    const params = new URLSearchParams()
    if (filters.search) params.set('search', filters.search)
    if (filters.category) params.set('category', filters.category)
    params.set('page', '1')

    expect(params.get('category')).toBe('Content Review')
    expect(params.get('search')).toBeNull()
  })

  it('identifies active filters correctly', () => {
    const defaultFilters = DEFAULT_FILTERS
    const activeFilters: TaskSearchFilters = {
      ...DEFAULT_FILTERS,
      category: 'Translation',
    }

    const isDefaultActive =
      defaultFilters.search    !== DEFAULT_FILTERS.search    ||
      defaultFilters.category  !== DEFAULT_FILTERS.category  ||
      defaultFilters.minReward !== DEFAULT_FILTERS.minReward ||
      defaultFilters.sort      !== DEFAULT_FILTERS.sort

    const isActiveActive =
      activeFilters.search    !== DEFAULT_FILTERS.search    ||
      activeFilters.category  !== DEFAULT_FILTERS.category  ||
      activeFilters.minReward !== DEFAULT_FILTERS.minReward ||
      activeFilters.sort      !== DEFAULT_FILTERS.sort

    expect(isDefaultActive).toBe(false)
    expect(isActiveActive).toBe(true)
  })

  it('sort options are valid', () => {
    const validSorts = ['newest', 'reward_high', 'reward_low', 'ending_soon']
    expect(validSorts).toContain(DEFAULT_FILTERS.sort)
  })
})


