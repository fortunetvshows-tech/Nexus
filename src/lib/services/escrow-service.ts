import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * Escrow Service — Nexus financial operation layer.
 *
 * ARCHITECTURAL RULE:
 * No API route may call Transaction, EscrowLedger, or Submission
 * tables directly for write operations. All financial mutations
 * must go through functions in this file.
 * Functions here call atomic Supabase RPCs that wrap all
 * mutations in a single BEGIN...COMMIT transaction.
 * If any step inside the RPC fails, all steps roll back.
 */

export type ServiceResult<T = void> = {
  success: boolean
  data?: T
  error?: string
  code?: string
}

/**
 * Approve a worker submission.
 * Calls approve_submission_atomic RPC which:
 * 1. Validates employer owns the task
 * 2. Updates Submission status to APPROVED
 * 3. Updates EscrowLedger releasedAmount
 * 4. Creates Transaction record (worker_payout)
 * 5. Triggers Pi Network payment via SDK
 * All five steps are atomic — partial state is impossible.
 */
export async function approveSubmission(
  submissionId: string,
  employerId: string,
  qualityRating: number
): Promise<ServiceResult> {

  // Input validation — fail fast before hitting the database
  if (!submissionId || !employerId) {
    return {
      success: false,
      error: 'Submission ID and employer ID are required.',
      code: 'MISSING_REQUIRED_PARAMS',
    }
  }

  if (!Number.isInteger(qualityRating) ||
      qualityRating < 1 ||
      qualityRating > 5) {
    return {
      success: false,
      error: 'Quality rating must be an integer between 1 and 5.',
      code: 'INVALID_QUALITY_RATING',
    }
  }

  const { data, error } = await supabaseAdmin
    .rpc('approve_submission_atomic', {
      p_submission_id: submissionId,
      p_employer_id:   employerId,
      p_quality_rating: qualityRating,
    })

  if (error) {
    // Log every failed approval to AdminAction for audit trail
    await supabaseAdmin.from('AdminAction').insert({
      adminId:    employerId,
      actionType: 'submission_approval_failed',
      targetType: 'submission',
      targetId:   submissionId,
      notes:      error.message,
      metadata:   { qualityRating, timestamp: new Date().toISOString() },
    })
    return {
      success: false,
      error: error.message,
      code: 'APPROVAL_FAILED',
    }
  }

  // Check RPC payload — RPC returns {success, error} not just transport errors
  if (data && data.success === false) {
    return {
      success: false,
      error:   data.error ?? 'RPC_APPROVAL_FAILED',
      code:    'SUBMISSION_NOT_ELIGIBLE',
    }
  }

  return { success: true, data }
}

/**
 * Reject a worker submission.
 * Calls reject_submission_atomic RPC which:
 * 1. Validates employer owns the task
 * 2. Updates Submission status to REJECTED
 * 3. Stores rejection reason
 * 4. Updates employer rejection rate metric
 * All steps are atomic.
 */
export async function rejectSubmission(
  submissionId: string,
  employerId: string,
  rejectionReason: string
): Promise<ServiceResult> {

  if (!submissionId || !employerId || !rejectionReason) {
    return {
      success: false,
      error: 'Submission ID, employer ID, and rejection reason are required.',
      code: 'MISSING_REQUIRED_PARAMS',
    }
  }

  // Enforce minimum reason length — prevents empty rejections
  // that give workers no actionable feedback
  if (rejectionReason.trim().length < 10) {
    return {
      success: false,
      error: 'Rejection reason must be at least 10 characters.',
      code: 'REJECTION_REASON_TOO_SHORT',
    }
  }

  const { data, error } = await supabaseAdmin
    .rpc('reject_submission_atomic', {
      p_submission_id:   submissionId,
      p_employer_id:     employerId,
      p_rejection_reason: rejectionReason.trim(),
    })

  if (error) {
    await supabaseAdmin.from('AdminAction').insert({
      adminId:    employerId,
      actionType: 'submission_rejection_failed',
      targetType: 'submission',
      targetId:   submissionId,
      notes:      error.message,
      metadata:   { rejectionReason, timestamp: new Date().toISOString() },
    })
    return {
      success: false,
      error:   error.message,
      code:    'REJECTION_FAILED',
    }
  }

  // Check RPC payload — RPC returns {success, error} not just transport errors
  if (data && data.success === false) {
    return {
      success: false,
      error:   data.error ?? 'RPC_REJECTION_FAILED',
      code:    'SUBMISSION_NOT_ELIGIBLE',
    }
  }

  return { success: true, data }
}
