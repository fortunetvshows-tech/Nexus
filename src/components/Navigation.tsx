'use client'

import { useState, useEffect } from 'react'
import Link                    from 'next/link'
import { usePiAuth }           from '@/hooks/use-pi-auth'
import { NotificationBell }    from '@/components/NotificationBell'
import { BottomNav }           from '@/components/BottomNav'
import { COLORS, FONTS }       from '@/lib/design/tokens'

interface NavigationProps {
  currentPage: 'home' | 'feed' | 'employer' | 'employer-dashboard' | 'dashboard' | 'arbitrate' | 'analytics' | 'admin' | 'profile'
}

export function Navigation({ currentPage }: NavigationProps) {
  const { user, clearAuth }   = usePiAuth()
  const [isOpen, setIsOpen]   = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close menu on route change
  useEffect(() => { setIsOpen(false) }, [currentPage])

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
  }

  return (
    <>
      {/* Main nav bar */}
      <nav style={{
        position:       'fixed',
        top:            0,
        left:           0,
        right:          0,
        height:         '60px',
        background:     scrolled
          ? 'rgba(15,23,42,0.95)'
          : 'rgba(15,23,42,0.85)',
        backdropFilter:   'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom:   `1px solid ${scrolled ? COLORS.borderAccent : COLORS.border}`,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        padding:        '0 var(--page-padding)',
        zIndex:         200,
        transition:     'all 0.2s ease',
        fontFamily:     FONTS.sans,
      }}>

        {/* Brand */}
        <Link href={user ? '/dashboard' : '/'} style={{
          fontSize:       '1.05rem',
          fontWeight:     '700',
          color:          COLORS.textPrimary,
          textDecoration: 'none',
          letterSpacing:  '-0.02em',
          display:        'flex',
          alignItems:     'center',
          gap:            '8px',
        }}>
          <span className="hide-mobile">Nexus</span>
          <span className="show-mobile">NX</span>
          <span style={{
            fontSize:     '0.55rem',
            fontWeight:   '500',
            color:        COLORS.indigo,
            background:   COLORS.indigoDim,
            padding:      '2px 6px',
            borderRadius: '4px',
            letterSpacing: '0.05em',
          }}>
            BETA
          </span>
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
                    background:     `linear-gradient(135deg, ${COLORS.indigo}, ${COLORS.indigoLight})`,
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
                      background:   COLORS.bgElevated,
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
                    ? `3px solid ${COLORS.indigo}`
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

      <BottomNav currentPage={currentPage} />
    </>
  )
}
