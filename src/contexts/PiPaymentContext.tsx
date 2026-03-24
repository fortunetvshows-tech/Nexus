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
              `${window.location.origin}/api/pi/approve`,
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
              `${window.location.origin}/api/pi/complete`,
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
    <PiPaymentContext.Provider value={{ createPayment, isProcessing, error }}>
      {children}
    </PiPaymentContext.Provider>
  )
}

export function usePiPaymentContext() {
  const ctx = useContext(PiPaymentContext)
  if (!ctx) throw new Error('usePiPaymentContext must be used inside PiPaymentProvider')
  return ctx
}
