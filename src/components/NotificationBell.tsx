'use client'

import { useState, useRef, useEffect } from 'react'
import { useNotifications }            from '@/hooks/use-notifications'
import { COLORS } from '@/lib/design/tokens'

interface NotificationBellProps {
  piUid: string | undefined
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)

  if (mins  <  1) return 'just now'
  if (mins  < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

function notificationIcon(type: string): string {
  switch (type) {
    case 'task_approved':         return '✅'
    case 'task_rejected':         return '❌'
    case 'payment_received':      return '💰'
    case 'dispute_opened':        return '⚖️'
    case 'dispute_resolved':      return '⚖️'
    case 'slot_expiring':         return '⏰'
    case 'slot_expired':          return '⏱️'
    case 'streak_broken':         return '🔥'
    case 'reputation_changed':    return '⭐'
    case 'system_alert':          return '🔔'
    default:                      return '📣'
  }
}

export function NotificationBell({ piUid }: NotificationBellProps) {
  const {
    notifications,
    unreadCount,
    markAllRead,
    markRead,
  } = useNotifications(piUid)

  const [isOpen,    setIsOpen]    = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () =>
      document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleOpen = () => {
    setIsOpen(prev => !prev)
  }

  const handleMarkAllRead = async () => {
    await markAllRead()
  }

  return (
    <div
      ref={dropdownRef}
      style={{ position: 'relative', display: 'inline-block' }}
    >
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className={`motion-press motion-chip relative rounded-lg border px-2 py-1.5 text-lg leading-none ${
          isOpen
            ? 'border-cyan-300/40 bg-cyan-300/10 text-cyan-100'
            : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
        }`}
        title="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full border border-violet-300/40 bg-violet-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-[200] w-[340px] overflow-hidden rounded-2xl border border-white/15 bg-slate-950/95 shadow-[0_20px_50px_-16px_rgba(0,0,0,0.75)] backdrop-blur-2xl">

          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <span className="text-sm font-semibold text-white">
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="motion-chip text-xs font-medium text-cyan-200 hover:text-cyan-100"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-[380px] overflow-y-auto">
            {notifications.length === 0 && (
              <div className="p-8 text-center text-sm text-slate-400">
                No notifications yet
              </div>
            )}

            {notifications.map(notif => (
              <div
                key={notif.id}
                onClick={() => {
                  setExpandedId(prev => prev === notif.id ? null : notif.id)
                  if (!notif.isRead) markRead(notif.id)
                }}
                className={`motion-chip cursor-pointer border-b border-white/10 px-4 py-3 ${
                  notif.isRead ? 'bg-transparent hover:bg-white/5' : 'bg-cyan-500/10 hover:bg-cyan-500/15'
                }`}
              >
                <div className="flex gap-3">
                  <span className="shrink-0 text-lg">
                    {notificationIcon(notif.type)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className={`mb-1 truncate text-sm ${notif.isRead ? 'font-normal text-slate-100' : 'font-semibold text-white'}`}>
                      {notif.title}
                    </div>
                    <div className="mb-1 text-xs text-slate-300">
                      <span style={{
                        display:           expandedId === notif.id ? 'block' : '-webkit-box',
                        WebkitLineClamp:   expandedId === notif.id ? undefined : 2,
                        WebkitBoxOrient:   'vertical' as any,
                        overflow:          expandedId === notif.id ? 'visible' : 'hidden',
                        cursor:            'pointer',
                      }}>
                        {notif.body}
                      </span>
                      {notif.body.length > 80 && (
                        <span className="mt-1 block cursor-pointer text-[10px] text-cyan-200">
                          {expandedId === notif.id ? '▲ Show less' : '▼ Read more'}
                        </span>
                      )}
                    </div>
                    {/* Fee Breakdown Display */}
                    {notif.type === 'task_approved' && (notif.metadata as any)?.grossAmount && (
                      <div className="mt-2 rounded-md border border-cyan-300/25 bg-cyan-300/10 p-2 text-[11px] leading-relaxed text-cyan-100">
                        <div className="mb-1 font-semibold">💰 Payment Breakdown</div>
                        <div>Gross: {(notif.metadata as any).grossAmount?.toFixed(2)}π</div>
                        <div>− Platform: {(notif.metadata as any).platformFee?.toFixed(2)}π</div>
                        <div className="mt-1 font-semibold text-emerald-200">
                          Net: {(notif.metadata as any).netAmount?.toFixed(2)}π
                        </div>
                      </div>
                    )}
                    <div className="mt-1 text-[11px] text-slate-400">
                      {timeAgo(notif.createdAt)}
                    </div>
                  </div>
                  {!notif.isRead && (
                    <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-cyan-300" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-white/10 px-4 py-2 text-center">
              <span className="text-xs text-slate-400">
                Showing last {notifications.length} notifications
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}


