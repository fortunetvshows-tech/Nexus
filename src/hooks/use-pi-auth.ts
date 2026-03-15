'use client'

import { useState, useCallback } from 'react'

interface NexusUser {
  id: string
  piUid: string
  piUsername: string
  userRole: 'worker' | 'employer' | 'admin'
  reputationScore: number
  reputationLevel: string
  kycLevel: number
}

interface AuthState {
  user: NexusUser | null
  isLoading: boolean
  error: string | null
}

export function usePiAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: false,
    error: null,
  })

  const authenticate = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // Verify Pi SDK is loaded
      if (typeof window === 'undefined' || !window.Pi) {
        throw new Error(
          'Pi SDK not available. Open this app in Pi Browser.'
        )
      }

      // Phase 1: Get accessToken from Pi SDK (client-side)
      // These values are untrusted until server verification
      const auth = await window.Pi.authenticate(
        ['username', 'payments'],
        (incompletePayment) => {
          // Handle any incomplete payments from previous sessions
          // Full implementation in TB-003 when payments are wired
          console.warn('[Nexus:Auth] Incomplete payment found:', incompletePayment)
        }
      )

      // Phase 2: Send to server for verification
      // Server calls Pi /me API to verify before touching database
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-pi-uid': auth.user.uid,
        },
        body: JSON.stringify({
          accessToken: auth.accessToken,
          uid: auth.user.uid,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed')
      }

      setState({
        user: data.user,
        isLoading: false,
        error: null,
      })

      return data.user

    } catch (err) {
      const message = err instanceof Error
        ? err.message
        : 'Authentication failed'

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: message,
      }))

      return null
    }
  }, [])

  const clearAuth = useCallback(() => {
    setState({ user: null, isLoading: false, error: null })
  }, [])

  return {
    user:         state.user,
    isLoading:    state.isLoading,
    error:        state.error,
    authenticate,
    clearAuth,
    isAuthenticated: state.user !== null,
  }
}
