'use client'

import { useState, useEffect } from 'react'
import Link                    from 'next/link'
import { usePiAuth }           from '@/hooks/use-pi-auth'
import { NotificationBell }    from '@/components/NotificationBell'
import { COLORS, FONTS }       from '@/lib/design/tokens'

interface NavigationProps {
  currentPage: 'home' | 'feed' | 'employer' | 'employer-dashboard' | 'dashboard' | 'arbitrate' | 'analytics' | 'admin' | 'profile'
}

export function Navigation({ currentPage }: NavigationProps) {
  const { user, clearAuth }   = usePiAuth()
  const [isOpen, setIsOpen]   = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [earned,  setEarned]  = useState<number>(0)
  const [pending, setPending] = useState<number>(0)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close menu on route change
  useEffect(() => { setIsOpen(false) }, [currentPage])

  // Fetch balance
  useEffect(() => {
    if (!user?.piUid) return
    fetch(`${window.location.origin}/api/analytics/worker`, {
      headers: { 'x-pi-uid': user.piUid },
    })
      .then(r => r.json())
      .then(data => {
        if (data?.summary) {
          setEarned(Number(data.summary.totalEarned ?? 0))
          setPending(Number(data.summary.totalPending ?? 0))
        }
      })
      .catch(() => {})
  }, [user?.piUid])

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', key: 'dashboard' },
    { href: '/feed',      label: 'Find Work',  key: 'feed'      },
    { href: '/employer',  label: 'Post Task',  key: 'employer'  },
    { href: '/employer/dashboard', label: 'My Tasks', key: 'employer-dashboard' },
    { href: '/analytics', label: 'Analytics',  key: 'analytics' },
  ]

  if (user?.reputationLevel === 'Sovereign') {
    navItems.push({ href: '/arbitrate', label: '⚖ Arbitrate', key: 'arbitrate' })
  }

  if (user?.isAdmin) {
    navItems.push({ href: '/admin/disputes', label: '⚖ Disputes', key: 'admin' })
    navItems.push({ href: '/admin/analytics', label: '📊 Analytics', key: 'admin' })
  }

  return (
    <>

      {/* Main nav bar */}
      <nav style={{
        padding: '14px 20px 10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        background: 'linear-gradient(180deg, #0B0D14 70%, transparent)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>

        {/* Brand */}
        <Link href={user ? '/dashboard' : '/'} style={{
          fontSize:       '20px',
          fontFamily:     FONTS.display,
          fontWeight:     '700',
          color:          COLORS.textPrimary,
          textDecoration: 'none',
          letterSpacing:  '2px',
          textTransform:  'uppercase',
          display:        'flex',
          alignItems:     'center',
          gap:            '8px',
        }}>
          <span className="hide-mobile">ProofGrid</span>
          <span className="show-mobile">PG</span>
        </Link>

        {/* Desktop nav links */}
        {user && (
          <div className="hide-mobile" style={{ display: 'flex', gap: '2px' }}>
            {navItems.map(item => {
              const isActive = currentPage === item.key
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className="nav-link"
                  style={{
                    padding:        '0.4rem 0.875rem',
                    borderRadius:   '8px',
                    fontSize:       '0.85rem',
                    fontWeight:     isActive ? '600' : '400',
                    textDecoration: 'none',
                    color:          isActive
                      ? COLORS.textPrimary
                      : COLORS.textSecondary,
                    background:     isActive
                      ? 'rgba(255,255,255,0.06)'
                      : 'transparent',
                    transition:     'all 0.15s ease',
                  }}
                >
                  <span className="nav-label">{item.label}</span>
                </Link>
              )
            })}
          </div>
        )}

        {/* Right — notifications + avatar + hamburger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          {user && (
            <>
              {/* Balance — desktop only */}
              <div
                className="hide-mobile"
                style={{
                  display:      'flex',
                  alignItems:   'center',
                  gap:          '6px',
                  padding:      '5px 10px',
                  background:   'rgba(16,185,129,0.1)',
                  border:       '1px solid rgba(16,185,129,0.2)',
                  borderRadius: '999px',
                  marginRight:  '4px',
                }}
              >
                <span style={{ fontSize: '0.7rem' }}>💰</span>
                <div style={{ lineHeight: 1 }}>
                  <div style={{
                    fontFamily:    "'Fira Code', monospace",
                    fontSize:      '0.82rem',
                    fontWeight:    '700',
                    color:         earned > 0 ? '#10B981' : pending > 0 ? '#F59E0B' : '#6B7280',
                    letterSpacing: '-0.02em',
                  }}>
                    {earned > 0
                      ? `${earned.toFixed(2)}π`
                      : pending > 0
                      ? `${pending.toFixed(2)}π`
                      : '0.00π'
                    }
                  </div>
                  {earned > 0 && pending > 0 && (
                    <div style={{
                      fontFamily: "'Fira Code', monospace",
                      fontSize:   '0.6rem',
                      color:      '#F59E0B',
                      lineHeight: 1.2,
                    }}>
                      +{pending.toFixed(2)}π pending
                    </div>
                  )}
                  {earned === 0 && pending === 0 && (
                    <div style={{
                      fontSize: '0.6rem',
                      color:    '#6B7280',
                      lineHeight: 1.2,
                    }}>
                      no earnings yet
                    </div>
                  )}
                </div>
              </div>

              <NotificationBell piUid={user.piUid} />

              {/* Avatar with dropdown — desktop only */}
              <div className="hide-mobile" style={{ position: 'relative' }}>
                <div
                  onClick={() => setProfileOpen(prev => !prev)}
                  title="Profile"
                  style={{
                    width:          '32px',
                    height:         '32px',
                    borderRadius:   '50%',
                    background:     `linear-gradient(135deg, ${COLORS.pi}, ${COLORS.piLt})`,
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    fontSize:       '0.8rem',
                    fontWeight:     '700',
                    color:          'white',
                    cursor:         'pointer',
                    boxShadow:      '0 0 12px rgba(99,102,241,0.3)',
                    flexShrink:     0,
                  }}
                >
                  {user.piUsername.charAt(0).toUpperCase()}
                </div>

                {profileOpen && (
                  <>
                    {/* Dropdown */}
                    <div style={{
                      position:     'absolute',
                      top:          '40px',
                      right:        0,
                      width:        '200px',
                      background:   COLORS.bgRaised,
                      border:       `1px solid ${COLORS.borderAccent}`,
                      borderRadius: '12px',
                      boxShadow:    '0 8px 32px rgba(0,0,0,0.4)',
                      padding:      '0.625rem',
                      zIndex:       300,
                      animation:    'fade-up 0.15s ease both',
                    }}>
                      {/* User info */}
                      <div style={{
                        padding:      '0.5rem 0.625rem 0.75rem',
                        borderBottom: `1px solid ${COLORS.border}`,
                        marginBottom: '0.375rem',
                      }}>
                        <div style={{
                          fontSize:   '0.82rem',
                          fontWeight: '600',
                          color:      COLORS.textPrimary,
                          marginBottom: '2px',
                        }}>
                          {user.piUsername}
                        </div>
                        <div style={{
                          fontSize:   '0.72rem',
                          color:      COLORS.textMuted,
                          fontFamily: FONTS.mono,
                        }}>
                          {user.reputationLevel} · {user.reputationScore} REP
                        </div>
                      </div>

                      {/* Links */}
                      <Link
                        href="/dashboard"
                        onClick={() => setProfileOpen(false)}
                        style={{
                          display:        'flex',
                          alignItems:     'center',
                          gap:            '8px',
                          padding:        '0.5rem 0.625rem',
                          borderRadius:   '8px',
                          fontSize:       '0.82rem',
                          color:          COLORS.textSecondary,
                          textDecoration: 'none',
                          transition:     'background 0.15s',
                        }}
                      >
                        📊 Dashboard
                      </Link>
                      <Link
                        href="/analytics"
                        onClick={() => setProfileOpen(false)}
                        style={{
                          display:        'flex',
                          alignItems:     'center',
                          gap:            '8px',
                          padding:        '0.5rem 0.625rem',
                          borderRadius:   '8px',
                          fontSize:       '0.82rem',
                          color:          COLORS.textSecondary,
                          textDecoration: 'none',
                          transition:     'background 0.15s',
                        }}
                      >
                        📈 Analytics
                      </Link>
                      <Link
                        href="/profile"
                        onClick={() => setProfileOpen(false)}
                        style={{
                          display:        'flex',
                          alignItems:     'center',
                          gap:            '8px',
                          padding:        '0.5rem 0.625rem',
                          borderRadius:   '8px',
                          fontSize:       '0.82rem',
                          color:          COLORS.textSecondary,
                          textDecoration: 'none',
                          transition:     'background 0.15s',
                        }}
                      >
                        👤 Profile & Wallet
                      </Link>
                      <Link
                        href="/referral"
                        onClick={() => setProfileOpen(false)}
                        style={{
                          display:        'flex',
                          alignItems:     'center',
                          gap:            '8px',
                          padding:        '0.5rem 0.625rem',
                          borderRadius:   '8px',
                          fontSize:       '0.82rem',
                          color:          COLORS.textSecondary,
                          textDecoration: 'none',
                          transition:     'background 0.15s',
                        }}
                      >
                        🔗 Invite & Earn
                      </Link>

                      {user?.isAdmin && (
                        <>
                          <Link
                            href="/admin/categories"
                            onClick={() => setProfileOpen(false)}
                            style={{
                              display:        'flex',
                              alignItems:     'center',
                              gap:            '8px',
                              padding:        '0.5rem 0.625rem',
                              borderRadius:   '8px',
                              fontSize:       '0.82rem',
                              color:          COLORS.textSecondary,
                              textDecoration: 'none',
                              transition:     'background 0.15s',
                            }}
                          >
                            🏷️ Categories
                          </Link>
                          <Link
                            href="/admin/disputes"
                            onClick={() => setProfileOpen(false)}
                            style={{
                              display:        'flex',
                              alignItems:     'center',
                              gap:            '8px',
                              padding:        '0.5rem 0.625rem',
                              borderRadius:   '8px',
                              fontSize:       '0.82rem',
                              color:          COLORS.red,
                              textDecoration: 'none',
                            transition:     'background 0.15s',
                          }}
                        >
                          ⚖ Disputes
                        </Link>
                        </>
                      )}

                      {/* Sign out */}
                      <div style={{
                        borderTop:   `1px solid ${COLORS.border}`,
                        marginTop:   '0.375rem',
                        paddingTop:  '0.375rem',
                      }}>
                        <button
                          onClick={() => {
                            clearAuth()
                            setProfileOpen(false)
                            window.location.href = '/'
                          }}
                          style={{
                            display:      'flex',
                            alignItems:   'center',
                            gap:          '8px',
                            width:        '100%',
                            padding:      '0.5rem 0.625rem',
                            borderRadius: '8px',
                            fontSize:     '0.82rem',
                            color:        COLORS.red,
                            background:   'transparent',
                            border:       'none',
                            cursor:       'pointer',
                            textAlign:    'left' as const,
                            fontFamily:   FONTS.sans,
                          }}
                        >
                          🚪 Sign out
                        </button>
                      </div>
                    </div>

                    {/* Click outside to close */}
                    <div
                      onClick={() => setProfileOpen(false)}
                      style={{
                        position: 'fixed',
                        inset:    0,
                        zIndex:   299,
                      }}
                    />
                  </>
                )}
              </div>
            </>
          )}

          {/* Hamburger button — mobile only */}
          {user && (
            <button
              className="show-mobile"
              onClick={() => setIsOpen(prev => !prev)}
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
              style={{
                background:   'transparent',
                border:       `1px solid ${COLORS.borderAccent}`,
                borderRadius: '8px',
                width:        '36px',
                height:       '36px',
                display:      'flex',
                flexDirection: 'column',
                alignItems:   'center',
                justifyContent: 'center',
                gap:          '4px',
                cursor:       'pointer',
                padding:      '0',
                flexShrink:   0,
              }}
            >
              {[0, 1, 2].map(i => (
                <span key={i} style={{
                  display:      'block',
                  width:        '16px',
                  height:       '1.5px',
                  background:   COLORS.textSecondary,
                  borderRadius: '2px',
                  transition:   'all 0.2s ease',
                  transform:    isOpen
                    ? i === 0 ? 'rotate(45deg) translate(4px, 4px)'
                    : i === 2 ? 'rotate(-45deg) translate(4px, -4px)'
                    : 'scaleX(0)'
                    : 'none',
                  opacity:      isOpen && i === 1 ? 0 : 1,
                }} />
              ))}
            </button>
          )}
        </div>
      </nav>

      {/* Mobile dropdown menu */}
      {user && isOpen && (
        <div
          className="show-mobile"
          style={{
            position:   'fixed',
            top:        '60px',
            left:       0,
            right:      0,
            background: 'rgba(15,23,42,0.98)',
            backdropFilter: 'blur(12px)',
            borderBottom: `1px solid ${COLORS.border}`,
            zIndex:     199,
            padding:    '0.75rem var(--page-padding) 1rem',
            animation:  'fade-up 0.15s ease both',
          }}
        >
          {navItems.map(item => {
            const isActive = currentPage === item.key
            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setIsOpen(false)}
                style={{
                  display:        'flex',
                  alignItems:     'center',
                  padding:        '0.75rem 0.875rem',
                  borderRadius:   '10px',
                  fontSize:       '0.9rem',
                  fontWeight:     isActive ? '600' : '400',
                  textDecoration: 'none',
                  color:          isActive
                    ? COLORS.textPrimary
                    : COLORS.textSecondary,
                  background:     isActive
                    ? 'rgba(255,255,255,0.05)'
                    : 'transparent',
                  marginBottom:   '2px',
                  borderLeft:     isActive
                    ? `3px solid ${COLORS.pi}`
                    : '3px solid transparent',
                  transition:     'all 0.15s ease',
                }}
              >
                {item.label}
              </Link>
            )
          })}

          {/* User info + sign out in mobile menu */}
          <div style={{
            marginTop:   '0.75rem',
            paddingTop:  '0.75rem',
            borderTop:   `1px solid ${COLORS.border}`,
            display:     'flex',
            alignItems:  'center',
            justifyContent: 'space-between',
          }}>
            <div style={{
              fontSize:   '0.82rem',
              color:      COLORS.textSecondary,
              fontFamily: FONTS.mono,
            }}>
              {user.piUsername}
            </div>
            <button
              onClick={() => {
                clearAuth()
                setIsOpen(false)
                window.location.href = '/'
              }}
              style={{
                background:   'transparent',
                border:       `1px solid ${COLORS.borderAccent}`,
                borderRadius: '6px',
                padding:      '4px 10px',
                fontSize:     '0.75rem',
                color:        COLORS.textMuted,
                cursor:       'pointer',
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      )}

      {/* Backdrop overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position:   'fixed',
            inset:      0,
            zIndex:     198,
            background: 'rgba(0,0,0,0.4)',
          }}
        />
      )}
    </>
  )
}


