'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePiAuth } from '@/hooks/use-pi-auth'

export default function HomePage() {
  const {
    authenticate,
    clearAuth,
    user,
    isLoading,
    error,
    isSdkReady,
    isAuthenticated,
  } = usePiAuth()

  const [submissions, setSubmissions] = useState<Array<{
    id:              string
    status:          string
    agreedReward:    number
    rejectionReason: string | null
    submittedAt:     string
    reviewedAt:      string | null
    task: {
      id:       string
      title:    string
      category: string
      piReward: number
    }
  }>>([])
  const [subLoading, setSubLoading] = useState(false)

  useEffect(() => {
    if (!user?.piUid) return

    setSubLoading(true)
    fetch('/api/worker/submissions', {
      headers: { 'x-pi-uid': user.piUid },
    })
      .then(r => r.json())
      .then(d => {
        if (d.submissions) setSubmissions(d.submissions)
        setSubLoading(false)
      })
      .catch(() => setSubLoading(false))
  }, [user?.piUid])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f0f0f',
      color: '#ffffff',
      fontFamily: 'system-ui, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
    }}>

      {/* Logo / Brand */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{
          fontSize: '3rem',
          fontWeight: '700',
          margin: '0',
          background: 'linear-gradient(135deg, #7B3FE4, #A855F7)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Nexus
        </h1>
        <p style={{
          color: '#9ca3af',
          fontSize: '1.1rem',
          marginTop: '0.5rem',
        }}>
          Earn Pi for real work
        </p>
      </div>

      {/* SDK Status indicator — visible during development */}
      <div style={{
        marginBottom: '1.5rem',
        padding: '0.5rem 1rem',
        borderRadius: '9999px',
        background: isSdkReady ? '#14532d' : '#1c1917',
        border: `1px solid ${isSdkReady ? '#16a34a' : '#44403c'}`,
        fontSize: '0.8rem',
        color: isSdkReady ? '#86efac' : '#a8a29e',
      }}>
        {isSdkReady ? '● Pi SDK Ready' : '○ Waiting for Pi SDK...'}
      </div>

      {/* Authentication state */}
      {!isAuthenticated ? (

        <div style={{ textAlign: 'center' }}>
          <button
            onClick={authenticate}
            disabled={isLoading || !isSdkReady}
            style={{
              padding: '1rem 2.5rem',
              background: isLoading || !isSdkReady
                ? '#374151'
                : 'linear-gradient(135deg, #7B3FE4, #A855F7)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: isLoading || !isSdkReady ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.2s',
              minWidth: '220px',
            }}
          >
            {isLoading
              ? 'Authenticating...'
              : !isSdkReady
              ? 'Loading Pi SDK...'
              : 'Connect with Pi'}
          </button>

          {!isSdkReady && (
            <p style={{
              color: '#6b7280',
              fontSize: '0.85rem',
              marginTop: '1rem',
            }}>
              Open in Pi Browser to authenticate
            </p>
          )}

          {error && (
            <div style={{
              marginTop: '1.5rem',
              padding: '1rem 1.5rem',
              background: '#450a0a',
              border: '1px solid #dc2626',
              borderRadius: '10px',
              color: '#fca5a5',
              maxWidth: '360px',
              fontSize: '0.9rem',
            }}>
              <strong>Error:</strong> {error}
            </div>
          )}
        </div>

      ) : (

        <div style={{ maxWidth: '600px', width: '100%' }}>
          {/* User Card */}
          <div style={{
            background: '#111827',
            border: '1px solid #1f2937',
            borderRadius: '16px',
            padding: '2rem',
            marginBottom: '2rem',
            textAlign: 'center',
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              background: 'linear-gradient(135deg, #7B3FE4, #A855F7)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              fontSize: '1.5rem',
              fontWeight: '700',
            }}>
              {user?.piUsername?.charAt(0).toUpperCase()}
            </div>

            <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.3rem' }}>
              {user?.piUsername}
            </h2>

            <p style={{
              color: '#9ca3af',
              fontSize: '0.85rem',
              margin: '0 0 1.5rem',
            }}>
              {user?.reputationLevel} · KYC Level {user?.kycLevel}
            </p>

            <div style={{
              background: '#0f172a',
              borderRadius: '8px',
              padding: '1rem',
              textAlign: 'left',
              marginBottom: '1.5rem',
            }}>
              <p style={{
                color: '#6b7280',
                fontSize: '0.75rem',
                margin: '0 0 0.5rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                Your Pi UID
              </p>
              <code style={{
                color: '#a78bfa',
                fontSize: '0.75rem',
                wordBreak: 'break-all',
              }}>
                {user?.piUid}
              </code>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.75rem',
            }}>
              <div style={{
                background: '#1f2937',
                borderRadius: '8px',
                padding: '0.75rem',
              }}>
                <p style={{
                  color: '#6b7280',
                  fontSize: '0.7rem',
                  margin: '0 0 0.25rem',
                }}>
                  Reputation
                </p>
                <p style={{
                  color: '#ffffff',
                  fontSize: '1.2rem',
                  fontWeight: '600',
                  margin: '0',
                }}>
                  {user?.reputationScore}
                </p>
              </div>
              <div style={{
                background: '#1f2937',
                borderRadius: '8px',
                padding: '0.75rem',
              }}>
                <p style={{
                  color: '#6b7280',
                  fontSize: '0.7rem',
                  margin: '0 0 0.25rem',
                }}>
                  Role
                </p>
                <p style={{
                  color: '#ffffff',
                  fontSize: '1.2rem',
                  fontWeight: '600',
                  margin: '0',
                  textTransform: 'capitalize',
                }}>
                  {user?.userRole}
                </p>
              </div>
            </div>
          </div>

          {/* Action Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}>
            {/* Find Work Card */}
            <Link href="/feed" style={{
              background: '#111827',
              border: '1px solid #1f2937',
              borderRadius: '12px',
              padding: '1.5rem',
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#374151'
              e.currentTarget.style.background = '#1f2937'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#1f2937'
              e.currentTarget.style.background = '#111827'
            }}
            >
              <div style={{
                fontSize: '2rem',
                marginBottom: '0.75rem',
              }}>
                🔍
              </div>
              <h3 style={{
                margin: '0 0 0.3rem',
                fontSize: '1rem',
                fontWeight: '600',
              }}>
                Find Work
              </h3>
              <p style={{
                color: '#6b7280',
                fontSize: '0.8rem',
                margin: '0',
              }}>
                Browse tasks, earn Pi
              </p>
            </Link>

            {/* Post Task Card */}
            <Link href="/employer" style={{
              background: 'linear-gradient(135deg, rgba(123, 63, 228, 0.1), rgba(168, 85, 247, 0.1))',
              border: '1px solid #7B3FE4',
              borderRadius: '12px',
              padding: '1.5rem',
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#A855F7'
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(123, 63, 228, 0.2), rgba(168, 85, 247, 0.2))'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#7B3FE4'
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(123, 63, 228, 0.1), rgba(168, 85, 247, 0.1))'
            }}
            >
              <div style={{
                fontSize: '2rem',
                marginBottom: '0.75rem',
              }}>
                +
              </div>
              <h3 style={{
                margin: '0 0 0.3rem',
                fontSize: '1rem',
                fontWeight: '600',
              }}>
                Post Task
              </h3>
              <p style={{
                color: '#9ca3af',
                fontSize: '0.8rem',
                margin: '0',
              }}>
                Hire workers, lock escrow
              </p>
            </Link>
          </div>

          {/* My Submissions */}
          {(subLoading || submissions.length > 0) && (
            <div style={{ marginTop: '1.5rem' }}>
              <h2 style={{
                margin:        '0 0 1rem',
                fontSize:      '0.9rem',
                fontWeight:    '600',
                color:         '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                My Submissions
              </h2>

              {subLoading && (
                <div style={{
                  background:   '#111827',
                  borderRadius: '12px',
                  height:       '80px',
                  border:       '1px solid #1f2937',
                }} />
              )}

              <div style={{
                display:       'flex',
                flexDirection: 'column',
                gap:           '0.75rem',
              }}>
                {submissions.map(sub => {
                  const statusColor =
                    sub.status === 'APPROVED'  ? '#16a34a'
                    : sub.status === 'REJECTED'  ? '#dc2626'
                    : sub.status === 'DISPUTED'  ? '#d97706'
                    : '#6b7280'

                  const statusBg =
                    sub.status === 'APPROVED'  ? '#14532d'
                    : sub.status === 'REJECTED'  ? '#450a0a'
                    : sub.status === 'DISPUTED'  ? '#451a03'
                    : '#1f2937'

                  return (
                    <Link
                      key={sub.id}
                      href={`/task/${sub.task?.id}`}
                      style={{
                        background:     '#111827',
                        border:         `1px solid ${
                          sub.status === 'REJECTED' ? '#dc2626'
                          : sub.status === 'DISPUTED' ? '#d97706'
                          : '#1f2937'
                        }`,
                        borderRadius:   '12px',
                        padding:        '1rem 1.25rem',
                        textDecoration: 'none',
                        display:        'block',
                      }}
                    >
                      <div style={{
                        display:        'flex',
                        justifyContent: 'space-between',
                        alignItems:     'flex-start',
                        marginBottom:   '0.4rem',
                      }}>
                        <div style={{
                          fontWeight: '600',
                          fontSize:   '0.9rem',
                          color:      '#ffffff',
                          flex:       1,
                          marginRight: '1rem',
                        }}>
                          {sub.task?.title}
                        </div>
                        <div style={{
                          padding:      '0.2rem 0.6rem',
                          borderRadius: '9999px',
                          fontSize:     '0.7rem',
                          fontWeight:   '600',
                          background:   statusBg,
                          color:        statusColor,
                          whiteSpace:   'nowrap',
                          flexShrink:   0,
                        }}>
                          {sub.status}
                        </div>
                      </div>

                      <div style={{
                        fontSize: '0.78rem',
                        color:    '#6b7280',
                        display:  'flex',
                        gap:      '1rem',
                      }}>
                        <span>{sub.task?.category}</span>
                        <span style={{ color: '#a78bfa' }}>
                          {sub.agreedReward}π
                        </span>
                        {sub.status === 'REJECTED' && (
                          <span style={{ color: '#f87171' }}>
                            Tap to dispute →
                          </span>
                        )}
                        {sub.status === 'APPROVED' && (
                          <span style={{ color: '#86efac' }}>
                            ✓ Earned
                          </span>
                        )}
                      </div>

                      {sub.status === 'REJECTED' && sub.rejectionReason && (
                        <div style={{
                          marginTop:    '0.5rem',
                          fontSize:     '0.78rem',
                          color:        '#9ca3af',
                          fontStyle:    'italic',
                          overflow:     'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace:   'nowrap',
                        }}>
                          "{sub.rejectionReason}"
                        </div>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          <button
            onClick={clearAuth}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'transparent',
              color: '#6b7280',
              border: '1px solid #374151',
              borderRadius: '8px',
              fontSize: '0.9rem',
              cursor: 'pointer',
              marginTop: '1.5rem',
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
