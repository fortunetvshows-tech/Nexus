'use client'

import { useState, useRef, useEffect } from 'react'
import { useNotifications }            from '@/hooks/use-notifications'
import { COLORS, FONTS, RADII, SHADOWS, GRADIENTS, SPACING, statusStyle } from '@/lib/design/tokens'

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
        style={{
          position:   'relative',
          background: 'transparent',
          border:     'none',
          cursor:     'pointer',
          padding:    '6px',
          borderRadius: '8px',
          color:      '#9ca3af',
          fontSize:   '1.2rem',
          lineHeight: 1,
          transition: 'background 0.15s',
        }}
        title="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position:       'absolute',
            top:            '0px',
            right:          '0px',
            minWidth:       '18px',
            height:         '18px',
            borderRadius:   '9999px',
            background:     '#7B3FE4',
            color:          'white',
            fontSize:       '0.65rem',
            fontWeight:     '700',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            padding:        '0 4px',
            lineHeight:     1,
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div style={{
          position:     'absolute',
          top:          'calc(100% + 8px)',
          right:        0,
          width:        '320px',
          background:   '#111827',
          border:       '1px solid #1f2937',
          borderRadius: '16px',
          boxShadow:    '0 20px 40px rgba(0,0,0,0.6)',
          zIndex:       200,
          overflow:     'hidden',
        }}>

          {/* Header */}
          <div style={{
            display:        'flex',
            justifyContent: 'space-between',
            alignItems:     'center',
            padding:        '1rem 1.25rem 0.75rem',
            borderBottom:   '1px solid #1f2937',
          }}>
            <span style={{
              fontWeight: '600',
              fontSize:   '0.9rem',
              color:      '#ffffff',
            }}>
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{
                  background: 'transparent',
                  border:     'none',
                  color:      '#7B3FE4',
                  fontSize:   '0.8rem',
                  cursor:     'pointer',
                  padding:    '0',
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div style={{
            maxHeight:  '380px',
            overflowY:  'auto',
          }}>
            {notifications.length === 0 && (
              <div style={{
                padding:   '2rem',
                textAlign: 'center',
                color:     '#6b7280',
                fontSize:  '0.875rem',
              }}>
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
                style={{
                  padding:    '0.875rem 1.25rem',
                  borderBottom: '1px solid #1f2937',
                  background: notif.isRead ? 'transparent' : '#1e1b4b',
                  cursor:     'pointer',
                  transition: 'background 0.15s',
                }}
              >
                <div style={{
                  display: 'flex',
                  gap:     '0.75rem',
                }}>
                  <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>
                    {notificationIcon(notif.type)}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight:   notif.isRead ? '400' : '600',
                      fontSize:     '0.85rem',
                      color:        '#ffffff',
                      marginBottom: '0.2rem',
                      whiteSpace:   'nowrap',
                      overflow:     'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {notif.title}
                    </div>
                    <div style={{
                      fontSize: '0.78rem',
                      color:    '#9ca3af',
                      marginBottom: '0.25rem',
                    }}>
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
                        <span style={{
                          fontSize:   '0.65rem',
                          color:      COLORS.indigo,
                          marginTop:  '2px',
                          display:    'block',
                          cursor:     'pointer',
                        }}>
                          {expandedId === notif.id ? '▲ Show less' : '▼ Read more'}
                        </span>
                      )}
                    </div>
                    {/* Fee Breakdown Display */}
                    {notif.type === 'task_approved' && (notif.metadata as any)?.grossAmount && (
                      <div style={{
                        fontSize: '0.7rem',
                        color: '#7aa3c0',
                        marginTop: '0.5rem',
                        padding: '0.5rem',
                        backgroundColor: 'rgba(122, 163, 192, 0.08)',
                        borderRadius: '4px',
                        lineHeight: '1.4',
                      }}>
                        <div style={{ marginBottom: '0.25rem' }}>💰 <strong>Payment Breakdown:</strong></div>
                        <div>Gross: {(notif.metadata as any).grossAmount?.toFixed(2)}π</div>
                        <div>− Platform: {(notif.metadata as any).platformFee?.toFixed(2)}π</div>
                        <div style={{ marginTop: '0.25rem', fontWeight: 'bold', color: '#10b981' }}>
                          Net: {(notif.metadata as any).netAmount?.toFixed(2)}π
                        </div>
                      </div>
                    )}
                    <div style={{
                      fontSize: '0.72rem',
                      color:    '#4b5563',
                      marginTop: notif.type === 'task_approved' && (notif.metadata as any)?.grossAmount ? '0.35rem' : undefined,
                    }}>
                      {timeAgo(notif.createdAt)}
                    </div>
                  </div>
                  {!notif.isRead && (
                    <div style={{
                      width:        '8px',
                      height:       '8px',
                      borderRadius: '50%',
                      background:   '#7B3FE4',
                      flexShrink:   0,
                      marginTop:    '4px',
                    }} />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div style={{
              padding:    '0.75rem 1.25rem',
              borderTop:  '1px solid #1f2937',
              textAlign:  'center',
            }}>
              <span style={{
                fontSize: '0.78rem',
                color:    '#4b5563',
              }}>
                Showing last {notifications.length} notifications
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

