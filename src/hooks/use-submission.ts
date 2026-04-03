'use client'

import { useState, useCallback, useEffect } from 'react'

interface SlotState {
  isClaimed: boolean
  isClaiming: boolean
  reservationId: string | null
  timeoutAt: string | null
  verificationCode: string | null
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
    verificationCode: null,
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
        verificationCode: data.verificationCode || null,
      }))
      return true

    } catch (err) {
      console.error('[ProofGrid:useSubmission] claimSlot error:', err)
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
      submissionType: string = 'text',
      proofStoragePath?: string
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
            proofStoragePath,
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
        console.error('[ProofGrid:useSubmission] submitProof error:', err)
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

  // Check for existing submission or reservation on mount
  useEffect(() => {
    if (!taskId || !piUid) return

    fetch(`/api/tasks/${taskId}/my-submission`, {
      headers: { 'x-pi-uid': piUid },
    })
      .then(r => r.json())
      .then(data => {
        // If submitted, set submitted state
        if (data.submission) {
          setSubmitState(prev => ({
            ...prev,
            isSubmitted: true,
            submissionId: data.submission.id,
          }))
        }
        // If not submitted but reservation exists, restore claimed state
        if (data.reservation && !data.submission) {
          const r = data.reservation
          // Check reservation not expired
          if (new Date(r.timeoutAt) > new Date()) {
            setSlotState(prev => ({
              ...prev,
              isClaimed: true,
              reservationId: r.id,
              timeoutAt: r.timeoutAt,
              verificationCode: r.verificationCode ?? null,
            }))
          }
        }
      })
      .catch(err => console.error('[ProofGrid:useSubmission] Mount check error:', err))
  }, [taskId, piUid])

  const reset = useCallback(() => {
    setSlotState({
      isClaimed: false,
      isClaiming: false,
      reservationId: null,
      timeoutAt: null,
      verificationCode: null,
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
    verificationCode: slotState.verificationCode,
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


