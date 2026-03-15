'use client'

import { useState, useCallback, useEffect } from 'react'

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
  isSdkReady: boolean
}

export function usePiAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: false,
    error: null,
    isSdkReady: false,
  })

  // Check for Pi SDK availability after mount
  // window.Pi is injected by the Pi Browser environment
  // It may not be available immediately on mount
  useEffect(() => {
    const checkSdk = () => {
      if (typeof window !== 'undefined' && window.Pi) {
        setState(prev => ({ ...prev, isSdkReady: true }))
        return true
      }
      return false
    }

    // Check immediately
    if (checkSdk()) return

    // Poll every 200ms for up to 5 seconds
    // Pi SDK may load slightly after component mount
    let attempts = 0
    const interval = setInterval(() => {
      attempts++
      if (checkSdk() || attempts >= 25) {
        clearInterval(interval)
      }
    }, 200)

    return () => clearInterval(interval)
  }, [])

  const authenticate = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // Verify we are in a browser environment
      if (typeof window === 'undefined') {
        throw new Error('Authentication must run in the browser')
      }

      // Verify Pi SDK is loaded
      if (!window.Pi) {
        throw new Error(
          'Pi SDK not available. Please open this app in Pi Browser.'
        )
      }

      // Phase 1: Client-side Pi authentication
      const auth = await window.Pi.authenticate(
        ['username', 'payments'],
        (incompletePayment) => {
          console.warn('[Nexus] Incomplete payment found:', incompletePayment)
        }
      )

      // Phase 2: Server-side verification
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
        isSdkReady: true,
      })

      return data.user

    } catch (err) {
      const message = err instanceof Error
        ? err.message
        : 'Authentication failed. Please try again.'

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: message,
      }))

      return null
    }
  }, [])

  const clearAuth = useCallback(() => {
    setState(prev => ({
      ...prev,
      user: null,
      error: null,
    }))
  }, [])

  return {
    user:            state.user,
    isLoading:       state.isLoading,
    error:           state.error,
    isSdkReady:      state.isSdkReady,
    authenticate,
    clearAuth,
    isAuthenticated: state.user !== null,
  }
}
