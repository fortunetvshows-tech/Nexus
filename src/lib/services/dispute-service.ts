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

/** Count eligible arbitrators (Sovereign-level, excluding specified user IDs) */
async function countEligibleArbitrators(
  excludeUserIds: string[]
): Promise<number> {
  const { count } = await supabaseAdmin
    .from('User')
    .select('id', { count: 'exact' })
    .eq('reputationLevel', 'Sovereign')
    .not('id', 'in', `(${excludeUserIds.map(id => `'${id}'`).join(',')})`)

  return count ?? 0
}

/**
 * File a dispute on a rejected submission.
 * Worker provides their reason for challenging the rejection.
 * Includes arbitrator eligibility guard before escalating to tier2.
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
    employerId?: string
    error?:    string
  }

  if (!result.success) {
    return {
      success: false,
      error:   result.error,
      code:    'DISPUTE_FAILED',
    }
  }

  // Arbitrator eligibility guard: Check if ≥3 Sovereign-level arbitrators available
  const eligibleCount = await countEligibleArbitrators([workerId, result.employerId ?? ''])

  if (eligibleCount < 3) {
    // Insufficient arbitrators — escalate to tier3_review
    const { error: escalateError } = await supabaseAdmin
      .from('Dispute')
      .update({
        status: 'tier3_review',
        updatedAt: new Date().toISOString(),
      })
      .eq('id', result.disputeId)

    if (escalateError) {
      console.error('[Nexus:DisputeService] Failed to escalate to tier3:', escalateError)
    }

    // Create notification for admins
    const notifyError = await supabaseAdmin
      .from('Notification')
      .insert({
        userId: null, // Will be handled by admin notifications system
        type: 'DISPUTE_TIER3_ESCALATED',
        title: 'Dispute Escalated to Admin Review',
        message: `Dispute ${result.disputeId} escalated due to insufficient arbitrators.`,
        metadata: { disputeId: result.disputeId },
        createdAt: new Date().toISOString(),
      })

    if (notifyError) {
      console.warn('[Nexus:DisputeService] Failed to create admin notification:', notifyError)
    }

    return {
      success:    true,
      disputeId:  result.disputeId,
      resolution: 'ESCALATE_TO_TIER3',
      checks:     { eligibleArbitrators: eligibleCount },
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
