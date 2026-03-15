'use client'

import { usePiAuth } from '@/hooks/use-pi-auth'

export default function AuthTestPage() {
  const { authenticate, user, isLoading, error } = usePiAuth()

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
      <h1>Nexus — Auth Test</h1>
      <p style={{ color: '#666', fontSize: '14px' }}>
        Open this page in Pi Browser only
      </p>

      <button
        onClick={authenticate}
        disabled={isLoading}
        style={{
          padding: '12px 24px',
          background: '#7B3FE4',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          marginTop: '1rem',
          display: 'block',
        }}
      >
        {isLoading ? 'Authenticating...' : 'Authenticate with Pi'}
      </button>

      {error && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          background: '#fee2e2',
          border: '1px solid #fca5a5',
          borderRadius: '8px',
          color: '#991b1b',
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {user && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          background: '#dcfce7',
          border: '1px solid #86efac',
          borderRadius: '8px',
          color: '#166534',
        }}>
          <strong>Authentication successful</strong>
          <pre style={{
            marginTop: '0.5rem',
            fontSize: '13px',
            overflowX: 'auto',
          }}>
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}