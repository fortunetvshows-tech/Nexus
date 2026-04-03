import { supabaseAdmin } from '@/lib/supabase-admin'
import { approveSubmission, rejectSubmission }
  from '@/lib/services/escrow-service'

export type SubmissionResult = {
  success:        boolean
  submissionId?:  string
  autoApproveAt?: string
  agreedReward?:  number
  error?:         string
  code?:          string
}

/**
 * Claim a slot on a task.
 * Uses the existing reserve_task_slot RPC.
 */
export async function claimTaskSlot(
  taskId:   string,
  workerId: string
): Promise<{
  success:            boolean
  reservationId?:     string
  verificationCode?:  string
  timeoutAt?:         string
  error?:             string
}> {
  const { data, error } = await supabaseAdmin
    .rpc('reserve_task_slot', {
      p_task_id:   taskId,
      p_worker_id: workerId,
    })

  if (error) {
    console.error('[ProofGrid:Submission] Slot claim failed:', error)
    return { success: false, error: error.message }
  }

  const result = data as {
    success:            boolean
    reservationId?:     string
    verificationCode?:  string
    timeoutAt?:         string
    error?:             string
  }

  return result
}

/**
 * Submit proof for a claimed task slot.
 * Calls submit_task_proof RPC atomically.
 */
export async function submitTaskProof(
  taskId:          string,
  workerId:        string,
  proofContent:    string,
  proofFileUrl:    string,
  submissionType:  string,
  proofStoragePath?: string
): Promise<SubmissionResult> {

  if (!proofContent && !proofFileUrl && !proofStoragePath) {
    return {
      success: false,
      error:   'Proof content, file, or storage path is required',
      code:    'MISSING_PROOF',
    }
  }

  const { data, error } = await supabaseAdmin
    .rpc('submit_task_proof', {
      p_task_id:         taskId,
      p_worker_id:       workerId,
      p_proof_content:   proofContent,
      p_proof_file_url:  proofFileUrl,
      p_submission_type: submissionType,
    })

  if (error) {
    console.error('[ProofGrid:Submission] Proof submission failed:', error)
    return { success: false, error: error.message, code: 'RPC_FAILED' }
  }

  const result = data as {
    success:        boolean
    submissionId?:  string
    autoApproveAt?: string
    agreedReward?:  number
    error?:         string
  }

  if (!result.success) {
    return {
      success: false,
      error:   result.error,
      code:    'SUBMISSION_FAILED',
    }
  }

  // If proofStoragePath provided, update the Submission record with proofStorageKey
  if (proofStoragePath && result.submissionId) {
    const { error: updateError } = await supabaseAdmin
      .from('Submission')
      .update({ proofStorageKey: proofStoragePath })
      .eq('id', result.submissionId)

    if (updateError) {
      console.warn('[ProofGrid:Submission] Failed to update proofStorageKey:', updateError)
      // Don't fail the submission, just log the warning
    }
  }

  return {
    success:       true,
    submissionId:  result.submissionId,
    autoApproveAt: result.autoApproveAt,
    agreedReward:  result.agreedReward,
  }
}

/**
 * Get submissions for employer review.
 */
export async function getTaskSubmissions(
  taskId:     string,
  employerId: string
) {
  const { data, error } = await supabaseAdmin
    .from('Submission')
    .select(`
      id,
      status,
      proofContent,
      proofFileUrl,
      proofStorageKey,
      proofFileSize,
      proofMimeType,
      submissionType,
      agreedReward,
      qualityRating,
      rejectionReason,
      autoApproved,
      autoApproveAt,
      submittedAt,
      reviewedAt,
      verificationCode,
      worker:workerId (
        id,
        piUsername,
        reputationScore,
        reputationLevel,
        kycLevel
      )
    `)
    .eq('taskId', taskId)
    .order('submittedAt', { ascending: false })

  if (error) {
    console.error('[ProofGrid:Submission] Fetch submissions failed:', error)
    return { submissions: [], error: error.message }
  }

  return { submissions: data ?? [], error: null }
}

/**
 * Get active slot reservation for a worker on a task.
 */
export async function getSlotReservation(
  taskId:   string,
  workerId: string
) {
  const { data } = await supabaseAdmin
    .from('SlotReservation')
    .select('id, status, timeoutAt, submittedAt, submissionId')
    .eq('taskId', taskId)
    .eq('workerId', workerId)
    .in('status', ['CLAIMED', 'SUBMITTED'])
    .maybeSingle()

  return data
}

export { approveSubmission, rejectSubmission }


