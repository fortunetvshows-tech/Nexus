'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export interface Notification {
  id:        string
  type:      string
  title:     string
  body:      string
  metadata:  Record<string, unknown>
  isRead:    boolean
  createdAt: string
}

export function useNotifications(piUid: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount,   setUnreadCount]   = useState(0)
  const [isLoading,     setIsLoading]     = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchNotifications = useCallback(async () => {
    if (!piUid) return

    try {
      const res = await fetch(
        `${window.location.origin}/api/notifications`,
        { headers: { 'x-pi-uid': piUid } }
      )
      const data = await res.json()

      if (data.notifications) {
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount ?? 0)
      }
    } catch {
      // Silent fail — notifications are non-critical
    }
  }, [piUid])

  const markAllRead = useCallback(async () => {
    if (!piUid) return

    try {
      await fetch(
        `${window.location.origin}/api/notifications`,
        {
          method:  'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-pi-uid':     piUid,
          },
          body: JSON.stringify({ notificationIds: [] }),
        }
      )
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true }))
      )
      setUnreadCount(0)
    } catch {
      // Silent fail
    }
  }, [piUid])

  const markRead = useCallback(async (id: string) => {
    if (!piUid) return

    try {
      await fetch(
        `${window.location.origin}/api/notifications`,
        {
          method:  'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-pi-uid':     piUid,
          },
          body: JSON.stringify({ notificationIds: [id] }),
        }
      )
      setNotifications(prev =>
        prev.map(n =>
          n.id === id ? { ...n, isRead: true } : n
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch {
      // Silent fail
    }
  }, [piUid])

  // Initial fetch
  useEffect(() => {
    if (!piUid) return
    setIsLoading(true)
    fetchNotifications().finally(() => setIsLoading(false))
  }, [piUid, fetchNotifications])

  // Poll every 30 seconds
  useEffect(() => {
    if (!piUid) return

    intervalRef.current = setInterval(fetchNotifications, 30_000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [piUid, fetchNotifications])

  return {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAllRead,
    markRead,
  }
}
