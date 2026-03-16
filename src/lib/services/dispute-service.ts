import { supabaseAdmin } from '@/lib/supabase-admin'
import { selectArbitrators } from '@/lib/services/arbitration-service'

export type DisputeResult = {
  success:     boolean
  disputeId?:  string
  resolution?: string
  checks?:     Record<string, unknown>
  error?:      string
  code?:       string
}

/**
 * File a dispute on a rejected submission.
 * Worker provides their reason for challenging the rejection.
 */
export async function fileDispute(
  submissionId: string,
  workerId:     string,
  reason:       string
): Promise<DisputeResult> {

  if (!submissionId || !workerId || !reason) {
    return {
      success: false,
      error:   'All fields are required',
      code:    'MISSING_FIELDS',
    }
  }

  if (reason.trim().length < 20) {
    return {
      success: false,
      error:   'Dispute reason must be at least 20 characters',
      code:    'REASON_TOO_SHORT',
    }
  }

  const { data, error } = await supabaseAdmin
    .rpc('file_dispute', {
      p_submission_id: submissionId,
      p_worker_id:     workerId,
      p_reason:        reason,
    })

  if (error) {
    console.error('[Nexus:DisputeService] file_dispute error:', error)
    return {
      success: false,
      error:   error.message,
      code:    'RPC_FAILED',
    }
  }

  const result = data as {
    success:   boolean
    disputeId?: string
    error?:    string
  }

  if (!result.success) {
    return {
      success: false,
      error:   result.error,
      code:    'DISPUTE_FAILED',
    }
  }

  // Immediately run Tier 1 resolution
  const tier1Result = await runTier1Resolution(result.disputeId!)

  // If escalated to Tier 2, select arbitrators immediately
  if (tier1Result.resolution === 'ESCALATE_TO_TIER2' && result.disputeId) {
    const arbResult = await selectArbitrators(result.disputeId)
    if (!arbResult.success && arbResult.code !== 'NO_ELIGIBLE_ARBITRATORS') {
      console.error('[Nexus:DisputeService] Failed to select arbitrators:', arbResult.error)
    }
  }

  return {
    success:    true,
    disputeId:  result.disputeId,
    resolution: tier1Result.resolution,
    checks:     tier1Result.checks,
  }
}

/**
 * Run Tier 1 automated resolution on a dispute.
 * Called immediately after a dispute is filed.
 */
export async function runTier1Resolution(
  disputeId: string
): Promise<DisputeResult> {

  const { data, error } = await supabaseAdmin
    .rpc('resolve_dispute_tier1', {
      p_dispute_id: disputeId,
    })

  if (error) {
    console.error('[Nexus:DisputeService] tier1 error:', error)
    return {
      success: false,
      error:   error.message,
      code:    'TIER1_FAILED',
    }
  }

  const result = data as {
    success:    boolean
    resolution: string
    checks:     Record<string, unknown>
    passed:     number
    failed:     number
  }

  return {
    success:    result.success,
    resolution: result.resolution,
    checks:     result.checks,
  }
}

/**
 * Get dispute status for a submission.
 */
export async function getDisputeForSubmission(
  submissionId: string
): Promise<{
  dispute: Record<string, unknown> | null
  error:   string | null
}> {
  const { data, error } = await supabaseAdmin
    .from('Dispute')
    .select(`
      id,
      status,
      tier,
      workerReason,
      tier1Result,
      resolution,
      filedAt,
      tier1ResolvedAt
    `)
    .eq('submissionId', submissionId)
    .order('filedAt', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    return { dispute: null, error: error.message }
  }

  return { dispute: data, error: null }
}
