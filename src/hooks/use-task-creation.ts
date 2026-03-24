'use client'

import { useState, useCallback } from 'react'
import { usePiPaymentContext } from '@/contexts/PiPaymentContext'
import { PLATFORM_CONFIG } from '@/lib/config/platform'

export interface TaskFormData {
  title:          string
  description:    string
  instructions:   string
  category:       string
  proofType:      string
  piReward:       string
  slotsAvailable: string
  timeEstimateMin: string
  deadlineHours:  string
  minReputation:  string
  minBadgeLevel:  string
  targetKycLevel: string
  tags:           string
}

export const INITIAL_FORM: TaskFormData = {
  title:           '',
  description:     '',
  instructions:    '',
  category:        'Survey & Research',
  proofType:       'TEXT',
  piReward:        '',
  slotsAvailable:  '',
  timeEstimateMin: '',
  deadlineHours:   '168',
  minReputation:   '100',
  minBadgeLevel:   'UNVERIFIED',
  targetKycLevel:  '0',
  tags:            '',
}


export const PROOF_TYPES = [
  { value: 'TEXT',            label: 'Text response'    },
  { value: 'FILE',            label: 'File upload'      },
  { value: 'IMAGE',           label: 'Image/Photo'      },
  { value: 'AUDIO',           label: 'Audio recording'  },
  { value: 'VIDEO',           label: 'Video'            },
  { value: 'STRUCTURED_FORM', label: 'Structured form'  },
] as const

type CreationStep =
  | 'form'
  | 'review'
  | 'payment'
  | 'creating'
  | 'success'
  | 'error'

interface CreationState {
  step:    CreationStep
  taskId:  string | null
  txid:    string | null
  error:   string | null
}

export function useTaskCreation(piUid: string | null) {
  const [form, setForm]   = useState<TaskFormData>(INITIAL_FORM)
  const [state, setState] = useState<CreationState>({
    step:   'form',
    taskId: null,
    txid:   null,
    error:  null,
  })

  const { createPayment, isProcessing } = usePiPaymentContext()

  const updateField = useCallback(
    (field: keyof TaskFormData, value: string) => {
      setForm(prev => ({ ...prev, [field]: value }))
    },
    []
  )

  const totalCost = useCallback(() => {
    const reward = parseFloat(form.piReward)   || 0
    const slots  = parseInt(form.slotsAvailable) || 0
    return (reward * slots).toFixed(4)
  }, [form.piReward, form.slotsAvailable])

  const validateForm = useCallback((): string | null => {
    if (form.title.length < 5)
      return 'Title must be at least 5 characters'
    if (form.description.length < 20)
      return 'Description must be at least 20 characters'
    if (form.instructions.length < 20)
      return 'Instructions must be at least 20 characters'
    if (!form.category)
      return 'Category is required'
    if (!form.proofType)
      return 'Proof type is required'
    if (!form.piReward || parseFloat(form.piReward) <= 0)
      return 'Pi reward must be greater than 0'
    const rewardValidation = PLATFORM_CONFIG.isValidReward(
      parseFloat(form.piReward)
    )
    if (!rewardValidation.valid) {
      return rewardValidation.reason ?? 'Invalid reward amount'
    }
    if (!form.slotsAvailable || parseInt(form.slotsAvailable) < 1)
      return 'Must have at least 1 slot'
    if (!form.timeEstimateMin || parseInt(form.timeEstimateMin) < 1)
      return 'Time estimate is required'
    return null
  }, [form])

  const proceedToReview = useCallback(() => {
    const validationError = validateForm()
    if (validationError) {
      setState(prev => ({ ...prev, error: validationError }))
      return
    }
    setState(prev => ({ ...prev, step: 'review', error: null }))
  }, [validateForm])

  const backToForm = useCallback(() => {
    setState(prev => ({ ...prev, step: 'form', error: null }))
  }, [])

  const initiatePayment = useCallback(async () => {
    if (!piUid) return

    setState(prev => ({ ...prev, step: 'payment', error: null }))

    const cost = parseFloat(totalCost())

    createPayment(
      {
        amount:   cost,
        memo:     `Nexus escrow: ${form.title}`,
        metadata: {
          category:       form.category,
          slots:          form.slotsAvailable,
          rewardPerSlot:  form.piReward,
        },
      },
      async (paymentId, txid) => {
        // Payment confirmed — now create the task
        setState(prev => ({ ...prev, step: 'creating' }))

        try {
          const res = await fetch('/api/tasks', {
            method:  'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-pi-uid':     piUid,
            },
            body: JSON.stringify({
              title:           form.title,
              description:     form.description,
              instructions:    form.instructions,
              category:        form.category,
              proofType:       form.proofType,
              piReward:        parseFloat(form.piReward),
              slotsAvailable:  parseInt(form.slotsAvailable),
              timeEstimateMin: parseInt(form.timeEstimateMin),
              deadlineHours:   parseInt(form.deadlineHours),
              minReputation:   parseInt(form.minReputation),
              minBadgeLevel:   form.minBadgeLevel,
              targetKycLevel:  parseInt(form.targetKycLevel),
              tags:            form.tags
                                 .split(',')
                                 .map(t => t.trim())
                                 .filter(Boolean),
              escrowTxid:      txid,
              piPaymentId:     paymentId,
            }),
          })

          const data = await res.json()

          if (!res.ok) {
            throw new Error(data.message ?? 'Task creation failed')
          }

          setState({
            step:   'success',
            taskId: data.taskId,
            txid:   txid,
            error:  null,
          })

        } catch (err) {
          setState({
            step:   'error',
            taskId: null,
            txid:   txid,
            error:  err instanceof Error
                      ? err.message
                      : 'Task creation failed after payment',
          })
        }
      },
      (error) => {
        setState({
          step:   'error',
          taskId: null,
          txid:   null,
          error:  error,
        })
      }
    )
  }, [piUid, form, totalCost, createPayment])

  const reset = useCallback(() => {
    setForm(INITIAL_FORM)
    setState({ step: 'form', taskId: null, txid: null, error: null })
  }, [])

  return {
    form,
    updateField,
    totalCost,
    step:         state.step,
    taskId:       state.taskId,
    txid:         state.txid,
    error:        state.error,
    isProcessing,
    proceedToReview,
    initiatePayment,
    backToForm,
    reset,
  }
}
