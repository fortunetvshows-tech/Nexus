'use client'

import { useState, useCallback } from 'react'

interface PaymentConfig {
  amount:   number
  memo:     string
  metadata: Record<string, unknown>
}

interface PaymentState {
  isProcessing: boolean
  error:        string | null
  txid:         string | null
  paymentId:    string | null
}

export function usePiPayment() {
  const [state, setState] = useState<PaymentState>({
    isProcessing: false,
    error:        null,
    txid:         null,
    paymentId:    null,
  })

  const createPayment = useCallback(
    async (
      config:    PaymentConfig,
      onSuccess: (paymentId: string, txid: string) => void,
      onError:   (error: string) => void
    ) => {
      if (typeof window === 'undefined' || !window.Pi) {
        onError('Pi SDK not available')
        return
      }

      setState(prev => ({
        ...prev,
        isProcessing: true,
        error: null,
      }))

      try {
        await window.Pi.createPayment(
          {
            amount:   config.amount,
            memo:     config.memo,
            metadata: config.metadata,
          },
          {
            onReadyForServerApproval: async (paymentId: string) => {
              setState(prev => ({ ...prev, paymentId }))
              try {
                const res = await fetch(`${window.location.origin}/api/pi/approve`, {
                  method:  'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body:    JSON.stringify({ paymentId }),
                })
                if (!res.ok) {
                  throw new Error('Payment approval failed')
                }
              } catch (err) {
                const msg = err instanceof Error
                  ? err.message
                  : 'Approval failed'
                setState(prev => ({
                  ...prev,
                  isProcessing: false,
                  error: msg,
                }))
                onError(msg)
              }
            },

            onReadyForServerCompletion: async (
              paymentId: string,
              txid:      string
            ) => {
              try {
                const res = await fetch(`${window.location.origin}/api/pi/complete`, {
                  method:  'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body:    JSON.stringify({ paymentId, txid }),
                })
                if (!res.ok) {
                  throw new Error('Payment completion failed')
                }
                setState(prev => ({
                  ...prev,
                  isProcessing: false,
                  txid,
                }))
                onSuccess(paymentId, txid)
              } catch (err) {
                const msg = err instanceof Error
                  ? err.message
                  : 'Completion failed'
                setState(prev => ({
                  ...prev,
                  isProcessing: false,
                  error: msg,
                }))
                onError(msg)
              }
            },

            onCancel: (paymentId: string) => {
              console.log('[ProofGrid:Payment] Cancelled:', paymentId)
              setState(prev => ({
                ...prev,
                isProcessing: false,
                error: 'Payment cancelled',
              }))
              onError('Payment cancelled by user')
            },

            onError: (error: Error) => {
              console.error('[ProofGrid:Payment] Error:', error)
              setState(prev => ({
                ...prev,
                isProcessing: false,
                error: error.message,
              }))
              onError(error.message)
            },
          }
        )
      } catch (err) {
        const msg = err instanceof Error
          ? err.message
          : 'Payment failed'
        setState(prev => ({
          ...prev,
          isProcessing: false,
          error: msg,
        }))
        onError(msg)
      }
    },
    []
  )

  return {
    createPayment,
    isProcessing: state.isProcessing,
    error:        state.error,
    txid:         state.txid,
    paymentId:    state.paymentId,
  }
}

