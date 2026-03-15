'use client'

import { useEffect, useState } from 'react'
import { usePiAuth } from '@/hooks/use-pi-auth'

export default function AuthTestPage() {
  const { authenticate, user, isLoading, error, isSdkReady } = usePiAuth()
  const [diagnostics, setDiagnostics] = useState<Record<string, string>>({})

  useEffect(() => {
    setDiagnostics({
      'window.Pi exists': typeof window !== 'undefined' && !!window.Pi
        ? 'YES' : 'NO',
      'User Agent': typeof window !== 'undefined'
        ? window.navigator.userAgent.slice(0, 80) : 'N/A',
      'Location': typeof window !== 'undefined'
        ? window.location.href : 'N/A',
      'SDK Ready (hook)': isSdkReady ? 'YES' : 'NO',
    })
  }, [isSdkReady])

  return (
    <div style={{
      padding: '2rem',
      fontFamily: 'monospace',
      background: '#0f0f0f',
      minHeight: '100vh',
      color: '#ffffff',
    }}>
      <h2 style={{ color: '#a78bfa' }}>Nexus — Auth Diagnostic</h2>

      <div style={{
        background: '#1f2937',
        padding: '1rem',
        borderRadius: '8px',
        marginBottom: '1.5rem',
      }}>
        <p style={{ margin: '0 0 0.5rem', color: '#9ca3af', fontSize: '0.8rem' }}>
          DIAGNOSTICS
        </p>
        {Object.entries(diagnostics).map(([key, value]) => (
          <div key={key} style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.8rem',
            padding: '0.25rem 0',
            borderBottom: '1px solid #374151',
          }}>
            <span style={{ color: '#6b7280' }}>{key}</span>
            <span style={{
              color: value === 'YES' ? '#86efac'
                : value === 'NO' ? '#fca5a5'
                : '#e5e7eb',
            }}>
              {value}
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={authenticate}
        disabled={isLoading || !isSdkReady}
        style={{
          padding: '12px 24px',
          background: isSdkReady ? '#7B3FE4' : '#374151',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: isSdkReady ? 'pointer' : 'not-allowed',
          fontSize: '16px',
          marginBottom: '1rem',
          width: '100%',
        }}
      >
        {isLoading ? 'Authenticating...'
          : !isSdkReady ? 'Pi SDK not ready'
          : 'Authenticate with Pi'}
      </button>

      {error && (
        <div style={{
          padding: '1rem',
          background: '#450a0a',
          border: '1px solid #dc2626',
          borderRadius: '8px',
          color: '#fca5a5',
          marginBottom: '1rem',
          fontSize: '0.85rem',
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {user && (
        <div style={{
          padding: '1rem',
          background: '#14532d',
          border: '1px solid #16a34a',
          borderRadius: '8px',
          color: '#86efac',
        }}>
          <strong>Success</strong>
          <pre style={{
            marginTop: '0.5rem',
            fontSize: '0.75rem',
            overflowX: 'auto',
            color: '#d1fae5',
          }}>
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}