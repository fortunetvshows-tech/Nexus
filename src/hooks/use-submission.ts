'use client'

import { useState, useCallback } from 'react'

interface SlotState {
  isClaimed: boolean
  isClaiming: boolean
  reservationId: string | null
  timeoutAt: string | null
  claimError: string | null
}

interface SubmitState {
  isSubmitted: boolean
  isSubmitting: boolean
  submissionId: string | null
  autoApproveAt: string | null
  agreedReward: number | null
  submitError: string | null
}

export function useSubmission(taskId: string, piUid: string = '') {
  const [slotState, setSlotState] = useState<SlotState>({
    isClaimed: false,
    isClaiming: false,
    reservationId: null,
    timeoutAt: null,
    claimError: null,
  })

  const [submitState, setSubmitState] = useState<SubmitState>({
    isSubmitted: false,
    isSubmitting: false,
    submissionId: null,
    autoApproveAt: null,
    agreedReward: null,
    submitError: null,
  })

  const claimSlot = useCallback(async () => {
    setSlotState(prev => ({ ...prev, isClaiming: true, claimError: null }))

    try {
      const res = await fetch(`/api/tasks/${taskId}/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-pi-uid': piUid || '',
        },
      })

      const data = await res.json()

      if (!res.ok) {
        setSlotState(prev => ({
          ...prev,
          isClaiming: false,
          claimError: data.error || 'Claim failed',
        }))
        return false
      }

      setSlotState(prev => ({
        ...prev,
        isClaimed: true,
        isClaiming: false,
        reservationId: data.reservationId,
        timeoutAt: data.timeoutAt,
      }))
      return true

    } catch (err) {
      console.error('[Nexus:useSubmission] claimSlot error:', err)
      setSlotState(prev => ({
        ...prev,
        isClaiming: false,
        claimError: 'Network error',
      }))
      return false
    }
  }, [taskId])

  const submitProof = useCallback(
    async (
      proofContent: string,
      proofFileUrl?: string,
      submissionType: string = 'text'
    ) => {
      setSubmitState(prev => ({ ...prev, isSubmitting: true, submitError: null }))

      try {
        const res = await fetch(`/api/tasks/${taskId}/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-pi-uid': piUid || '',
          },
          body: JSON.stringify({
            proofContent,
            proofFileUrl,
            submissionType,
          }),
        })

        const data = await res.json()

        if (!res.ok) {
          setSubmitState(prev => ({
            ...prev,
            isSubmitting: false,
            submitError: data.error || 'Submission failed',
          }))
          return false
        }

        setSubmitState(prev => ({
          ...prev,
          isSubmitted: true,
          isSubmitting: false,
          submissionId: data.submissionId,
          autoApproveAt: data.autoApproveAt,
          agreedReward: data.agreedReward,
        }))
        return true

      } catch (err) {
        console.error('[Nexus:useSubmission] submitProof error:', err)
        setSubmitState(prev => ({
          ...prev,
          isSubmitting: false,
          submitError: 'Network error',
        }))
        return false
      }
    },
    [taskId]
  )

  const reset = useCallback(() => {
    setSlotState({
      isClaimed: false,
      isClaiming: false,
      reservationId: null,
      timeoutAt: null,
      claimError: null,
    })
    setSubmitState({
      isSubmitted: false,
      isSubmitting: false,
      submissionId: null,
      autoApproveAt: null,
      agreedReward: null,
      submitError: null,
    })
  }, [])

  return {
    // Slot state
    isClaimed: slotState.isClaimed,
    isClaiming: slotState.isClaiming,
    reservationId: slotState.reservationId,
    timeoutAt: slotState.timeoutAt,
    claimError: slotState.claimError,

    // Submit state
    isSubmitted: submitState.isSubmitted,
    isSubmitting: submitState.isSubmitting,
    submissionId: submitState.submissionId,
    autoApproveAt: submitState.autoApproveAt,
    agreedReward: submitState.agreedReward,
    submitError: submitState.submitError,

    // Actions
    claimSlot,
    submitProof,
    reset,
  }
}
