'use client'

import React, {
  createContext, useContext, useRef,
  useState, useCallback, useEffect
} from 'react'

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
}

const PiPaymentContext = createContext<PaymentContextValue | null>(null)

export function PiPaymentProvider({
  children
}: {
  children: React.ReactNode
}) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError]               = useState<string | null>(null)

  // Use refs for callbacks so they survive re-renders
  const onSuccessRef = useRef<((paymentId: string, txid: string) => void) | null>(null)
  const onErrorRef   = useRef<((error: string) => void) | null>(null)
  const inProgressRef = useRef(false)
  const authInitializedRef = useRef(false)

  // Handle incomplete payments from previous crashes
  const onIncompletePaymentFound = useCallback(async (payment: any) => {
    console.warn('[ProofGrid:PiPaymentProvider] Incomplete payment found:', payment.identifier)
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
        console.log('[ProofGrid:PiPaymentProvider] Incomplete payment recovered:', paymentId)
      } else {
        // No transaction — cancel it
        await fetch('/api/pi/cancel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentId }),
        })
        console.log('[ProofGrid:PiPaymentProvider] Incomplete payment cancelled:', paymentId)
      }
    } catch (err) {
      console.error('[ProofGrid:PiPaymentProvider] Failed to handle incomplete payment:', err)
    }
  }, [])

  // ─────────────────────────────────────────────────────────
  // GLOBAL AUTHENTICATION: Acquire "payments" scope on app load
  // ─────────────────────────────────────────────────────────
  // This runs ONCE on mount to ensure the payments scope is available
  // for all payment operations. No need to authenticate on every button click.
  useEffect(() => {
    if (authInitializedRef.current) return

    const initializeAuth = async () => {
      // Wait for Pi SDK to be available
      let attempts = 0
      let piAvailable = false

      while (attempts < 50 && !piAvailable) {
        if (typeof window !== 'undefined' && window.Pi) {
          piAvailable = true
          break
        }
        attempts++
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      if (!piAvailable) {
        console.log('[ProofGrid:PiPaymentProvider] Pi SDK not available after 5s')
        return
      }

      try {
        console.log('[ProofGrid:PiPaymentProvider] Acquiring global "payments" scope...')
        
        // Authenticate with payments scope GLOBALLY on app load
        // This ensures window.Pi.createPayment() will work without scope errors
        const auth = await window.Pi.authenticate(
          ['payments', 'username', 'wallet_address'],
          onIncompletePaymentFound
        )

        console.log(
          '[ProofGrid:PiPaymentProvider] ✅ Global authentication successful.',
          'User:', auth.user.uid,
          'Payments scope acquired'
        )
      } catch (err) {
        // User not in Pi app or authentication not granted — this is OK
        // Payment will still work when user explicitly logs in
        const msg = err instanceof Error ? err.message : String(err)
        
        // Only log as warning if it's not a simple "user didn't authenticate" case
        if (!msg.includes('authenticated') && !msg.includes('user')) {
          console.warn('[ProofGrid:PiPaymentProvider] Global auth warning:', msg)
        } else {
          console.log('[ProofGrid:PiPaymentProvider] Global auth skipped (user not in Pi or declined):', msg)
        }
      }
    }

    authInitializedRef.current = true
    initializeAuth()
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

