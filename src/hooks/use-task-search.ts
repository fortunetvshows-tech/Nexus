'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export interface TaskSearchFilters {
  search:     string
  category:   string
  minReward:  number
  maxReward:  number
  sort:       'newest' | 'reward_high' | 'reward_low' | 'ending_soon'
}

export const DEFAULT_FILTERS: TaskSearchFilters = {
  search:    '',
  category:  '',
  minReward: 0,
  maxReward: 1000,
  sort:      'newest',
}


interface PaginationInfo {
  page:       number
  limit:      number
  total:      number
  totalPages: number
  hasMore:    boolean
}

interface UseTaskSearchReturn {
  tasks:       unknown[]
  pagination:  PaginationInfo | null
  isLoading:   boolean
  filters:     TaskSearchFilters
  setFilters:  (filters: Partial<TaskSearchFilters>) => void
  resetFilters: () => void
  loadMore:    () => void
  refresh:     () => void
}

export function useTaskSearch(piUid: string | undefined): UseTaskSearchReturn {
  const [tasks,      setTasks]      = useState<unknown[]>([])
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [isLoading,  setIsLoading]  = useState(false)
  const [filters,    setFiltersState] = useState<TaskSearchFilters>(DEFAULT_FILTERS)
  const [page,       setPage]       = useState(1)

  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const buildQueryString = useCallback(
    (f: TaskSearchFilters, p: number) => {
      const params = new URLSearchParams()
      if (f.search)             params.set('search',    f.search)
      if (f.category)           params.set('category',  f.category)
      if (f.minReward > 0)      params.set('minReward', String(f.minReward))
      if (f.maxReward < 1000)   params.set('maxReward', String(f.maxReward))
      if (f.sort !== 'newest')  params.set('sort',      f.sort)
      params.set('page',  String(p))
      params.set('limit', '10')
      return params.toString()
    },
    []
  )

  const fetchTasks = useCallback(
    async (f: TaskSearchFilters, p: number, append = false) => {
      if (!piUid) return

      setIsLoading(true)
      try {
        const qs  = buildQueryString(f, p)
        const res = await fetch(
          `${window.location.origin}/api/tasks?${qs}`,
          { headers: { 'x-pi-uid': piUid } }
        )
        const data = await res.json()

        if (data.tasks) {
          setTasks(prev => append ? [...prev, ...data.tasks] : data.tasks)
          setPagination(data.pagination ?? null)
        }
      } catch (err) {
        console.error('[ProofGrid:TaskSearch] Fetch error:', err)
      } finally {
        setIsLoading(false)
      }
    },
    [piUid, buildQueryString]
  )

  // Debounced fetch when filters change
  useEffect(() => {
    if (!piUid) return

    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(() => {
      setPage(1)
      fetchTasks(filters, 1, false)
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [filters, piUid, fetchTasks])

  const setFilters = useCallback((partial: Partial<TaskSearchFilters>) => {
    setFiltersState(prev => ({ ...prev, ...partial }))
  }, [])

  const resetFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS)
    setPage(1)
  }, [])

  const loadMore = useCallback(() => {
    if (!pagination?.hasMore || isLoading) return
    const nextPage = page + 1
    setPage(nextPage)
    fetchTasks(filters, nextPage, true)
  }, [pagination, isLoading, page, filters, fetchTasks])

  const refresh = useCallback(() => {
    setPage(1)
    fetchTasks(filters, 1, false)
  }, [filters, fetchTasks])

  return {
    tasks,
    pagination,
    isLoading,
    filters,
    setFilters,
    resetFilters,
    loadMore,
    refresh,
  }
}

