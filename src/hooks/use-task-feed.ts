'use client'

import { useState, useEffect, useCallback } from 'react'

interface Task {
  id:               string
  title:            string
  description:      string
  category:         string
  piReward:         number
  slotsRemaining:   number
  slotsAvailable:   number
  timeEstimateMin:  number
  deadline:         string
  minReputationReq: number
  minBadgeLevel:    string
  isFeatured:       boolean
  tags:             string[]
  employer: {
    piUsername:      string
    reputationScore: number
    reputationLevel: string
  }
}

interface FeedState {
  tasks:      Task[]
  isLoading:  boolean
  error:      string | null
  hasMore:    boolean
  total:      number
}

export function useTaskFeed(piUid: string | null) {
  const [state, setState] = useState<FeedState>({
    tasks:     [],
    isLoading: false,
    error:     null,
    hasMore:   true,
    total:     0,
  })
  const [offset, setOffset] = useState(0)
  const LIMIT = 20

  const fetchTasks = useCallback(
    async (reset = false) => {
      if (!piUid) return
      if (state.isLoading) return

      setState(prev => ({ ...prev, isLoading: true, error: null }))

      try {
        const currentOffset = reset ? 0 : offset
        const res = await fetch(
          `/api/tasks?limit=${LIMIT}&offset=${currentOffset}`,
          {
            headers: { 'x-pi-uid': piUid },
          }
        )

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.message ?? 'Failed to load tasks')
        }

        setState(prev => ({
          tasks:     reset ? data.tasks : [...prev.tasks, ...data.tasks],
          isLoading: false,
          error:     null,
          hasMore:   data.tasks.length === LIMIT,
          total:     reset
                       ? data.tasks.length
                       : prev.total + data.tasks.length,
        }))

        setOffset(currentOffset + LIMIT)

      } catch (err) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error:     err instanceof Error
                       ? err.message
                       : 'Failed to load tasks',
        }))
      }
    },
    [piUid, offset, state.isLoading]
  )

  // Load on mount when piUid is available
  useEffect(() => {
    if (piUid) {
      fetchTasks(true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [piUid])

  const refresh = useCallback(() => {
    setOffset(0)
    fetchTasks(true)
  }, [fetchTasks])

  const loadMore = useCallback(() => {
    if (state.hasMore && !state.isLoading) {
      fetchTasks(false)
    }
  }, [state.hasMore, state.isLoading, fetchTasks])

  return {
    tasks:     state.tasks,
    isLoading: state.isLoading,
    error:     state.error,
    hasMore:   state.hasMore,
    refresh,
    loadMore,
  }
}


