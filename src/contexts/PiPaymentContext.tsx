'use client'

import React, {
  createContext, useContext, useRef,
  useState, useCallback, useEffect
} from 'react'

interface NexusUser {
  id: string
  piUid: string
  piUsername: string
  userRole: 'worker' | 'employer' | 'admin'
  reputationScore: number
  reputationLevel: string
  kycLevel: number
  isAdmin: boolean
}

interface PaymentConfig {
  amount:   number
  memo:     string
  metadata: Record<string, unknown>
}

interface PaymentContextValue {
  createPayment: (
    config:    PaymentConfig,
    onSuccess: (paymentId: string, txid: string) => void,
    onError:   (error: string) => void
  ) => void
  isProcessing: boolean
  error:        string | null
  user:         NexusUser | null
  isAuthenticated: boolean
  isAuthenticating: boolean
}

const PiPaymentContext = createContext<PaymentContextValue | null>(null)

export function PiPaymentProvider({
  children
}: {
  children: React.ReactNode
}) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [isAuth, setIsAuth]             = useState(false)
  const [user, setUser]                 = useState<NexusUser | null>(null)

  // Use refs for callbacks so they survive re-renders
  const onSuccessRef = useRef<((paymentId: string, txid: string) => void) | null>(null)
  const onErrorRef   = useRef<((error: string) => void) | null>(null)
  const inProgressRef = useRef(false)
  const isAuthenticatingRef = useRef(false)

  // Handle incomplete payments from previous crashes
  const onIncompletePaymentFound = useCallback(async (payment: any) => {
    console.warn('[Nexus:PiPaymentProvider] Incomplete payment found:', payment.identifier)
    if (!payment?.identifier) return

    const paymentId = payment.identifier
    const txid      = payment.transaction?.txid ?? null

    try {
      if (txid) {
        // Transaction exists on blockchain — complete it
        await fetch('/api/pi/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentId, txid }),
        })
        console.log('[Nexus:PiPaymentProvider] Incomplete payment recovered:', paymentId)
      } else {
        // No transaction — cancel it
        await fetch('/api/pi/cancel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentId }),
        })
        console.log('[Nexus:PiPaymentProvider] Incomplete payment cancelled:', paymentId)
      }
    } catch (err) {
      console.error('[Nexus:PiPaymentProvider] Failed to handle incomplete payment:', err)
    }
  }, [])

  // Authenticate at app level to get global scopes including wallet
  useEffect(() => {
    if (typeof window === 'undefined' || !window.Pi || isAuthenticatingRef.current) {
      return
    }

    isAuthenticatingRef.current = true

    // Request all scopes: payments, username, wallet_address
    window.Pi.authenticate(
      ['payments', 'username', 'wallet_address'], 
      onIncompletePaymentFound
    )
      .then(async (auth) => {
        console.log('[Nexus:PiPaymentProvider] Global Pi authentication successful')
        
        // Call server to verify auth and get full user data
        try {
          const origin = typeof window !== 'undefined' ? window.location.origin : ''
          const response = await fetch(`${origin}/api/auth`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-pi-uid': auth.user.uid,
            },
            body: JSON.stringify({
              accessToken:   auth.accessToken,
              uid:           auth.user.uid,
              walletAddress: (auth.user as any).wallet_address ?? null,
            }),
          })

          const data = await response.json()
          
          if (response.ok && data.user) {
            setUser(data.user)
            setIsAuth(true)
            console.log('[Nexus:PiPaymentProvider] User authenticated:', data.user.piUsername)
          } else {
            console.error('[Nexus:PiPaymentProvider] Server auth failed:', data.message)
            setIsAuth(false)
          }
        } catch (err) {
          console.error('[Nexus:PiPaymentProvider] Server auth error:', err)
          setIsAuth(false)
        }
      })
      .catch((err) => {
        console.error('[Nexus:PiPaymentProvider] Global authentication failed:', err)
        setIsAuth(false)
      })
      .finally(() => {
        isAuthenticatingRef.current = false
      })
  }, [onIncompletePaymentFound])

  const createPayment = useCallback((
    config:    PaymentConfig,
    onSuccess: (paymentId: string, txid: string) => void,
    onError:   (error: string) => void
  ) => {
    // Prevent double-trigger
    if (inProgressRef.current) return
    inProgressRef.current = true

    // Store callbacks in refs — survive component unmount
    onSuccessRef.current = onSuccess
    onErrorRef.current   = onError

    if (typeof window === 'undefined' || !window.Pi) {
      const msg = 'Pi SDK not available'
      onError(msg)
      inProgressRef.current = false
      return
    }

    setIsProcessing(true)
    setError(null)

    window.Pi.createPayment(
      {
        amount:   config.amount,
        memo:     config.memo,
        metadata: config.metadata,
      },
      {
        onReadyForServerApproval: async (paymentId: string) => {
          try {
            const res = await fetch(
              '/api/pi/approve',
              {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ paymentId }),
              }
            )
            if (!res.ok) throw new Error('Approval failed')
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Approval failed'
            setError(msg)
            setIsProcessing(false)
            inProgressRef.current = false
            onErrorRef.current?.(msg)
          }
        },

        onReadyForServerCompletion: async (paymentId: string, txid: string) => {
          try {
            const res = await fetch(
              '/api/pi/complete',
              {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ paymentId, txid }),
              }
            )
            if (!res.ok) throw new Error('Completion failed')
            setIsProcessing(false)
            inProgressRef.current = false
            onSuccessRef.current?.(paymentId, txid)
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Completion failed'
            setError(msg)
            setIsProcessing(false)
            inProgressRef.current = false
            onErrorRef.current?.(msg)
          }
        },

        onCancel: (paymentId: string) => {
          const msg = 'Payment cancelled'
          setError(msg)
          setIsProcessing(false)
          inProgressRef.current = false
          onErrorRef.current?.(msg)
        },

        onError: (error: Error) => {
          const msg = error.message
          setError(msg)
          setIsProcessing(false)
          inProgressRef.current = false
          onErrorRef.current?.(msg)
        },
      }
    )
  }, [])

  return (
    <PiPaymentContext.Provider value={{
      createPayment,
      isProcessing,
      error,
      user,
      isAuthenticated: isAuth,
      isAuthenticating: isAuthenticatingRef.current,
    }}>
      {children}
    </PiPaymentContext.Provider>
  )
}

export function usePiPaymentContext() {
  const ctx = useContext(PiPaymentContext)
  if (!ctx) return null  // Allow graceful fallback if outside provider
  return ctx
}
