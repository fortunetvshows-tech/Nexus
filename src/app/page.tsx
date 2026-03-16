'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePiAuth } from '@/hooks/use-pi-auth'

export default function HomePage() {
  const {
    authenticate,
    isLoading,
    error,
    isSdkReady,
    isAuthenticated,
  } = usePiAuth()
  const router = useRouter()

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard')
    }
  }, [isAuthenticated, router])

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

      {/* SDK Status indicator */}
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

      {/* Connect with Pi CTA */}
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
    </div>
  )
}
