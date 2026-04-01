import { supabaseAdmin } from '@/lib/supabase-admin'

export type ArbitrationResult = {
  success:          boolean
  arbitratorCount?: number
  arbitrators?:     string[]
  votesWorker?:     number
  votesEmployer?:   number
  totalArbs?:       number
  resolved?:        boolean
  error?:           string
  code?:            string
}

/**
 * Select arbitrators for a Tier 2 dispute.
 * Called automatically when a dispute reaches tier2_review.
 */
export async function selectArbitrators(
  disputeId: string,
  count      = 3
): Promise<ArbitrationResult> {

  const { data, error } = await supabaseAdmin
    .rpc('select_arbitrators', {
      p_dispute_id: disputeId,
      p_count:      count,
    })

  if (error) {
    console.error('[ProofGrid:Arbitration] select_arbitrators error:', error)
    return { success: false, error: error.message, code: 'RPC_FAILED' }
  }

  const result = data as {
    success:         boolean
    arbitratorCount?: number
    arbitrators?:    string[]
    error?:          string
  }

  if (!result.success) {
    return {
      success: false,
      error:   result.error,
      code:    result.error === 'NO_ELIGIBLE_ARBITRATORS'
               ? 'NO_ELIGIBLE_ARBITRATORS'
               : 'SELECTION_FAILED',
    }
  }

  return {
    success:         true,
    arbitratorCount: result.arbitratorCount,
    arbitrators:     result.arbitrators,
  }
}

/**
 * Cast a vote on a dispute as an arbitrator.
 */
export async function castVote(
  disputeId:    string,
  arbitratorId: string,
  vote:         'worker' | 'employer',
  reasoning:    string
): Promise<ArbitrationResult> {

  if (!reasoning || reasoning.trim().length < 10) {
    return {
      success: false,
      error:   'Reasoning must be at least 10 characters',
      code:    'REASONING_TOO_SHORT',
    }
  }

  const { data, error } = await supabaseAdmin
    .rpc('cast_arbitration_vote', {
      p_dispute_id:    disputeId,
      p_arbitrator_id: arbitratorId,
      p_vote:          vote,
      p_reasoning:     reasoning,
    })

  if (error) {
    console.error('[ProofGrid:Arbitration] cast_arbitration_vote error:', error)
    return { success: false, error: error.message, code: 'RPC_FAILED' }
  }

  const result = data as {
    success:      boolean
    votesWorker:  number
    votesEmployer: number
    totalArbs:    number
    resolved:     boolean
    error?:       string
  }

  if (!result.success) {
    return { success: false, error: result.error, code: 'VOTE_FAILED' }
  }

  return {
    success:      true,
    votesWorker:  result.votesWorker,
    votesEmployer: result.votesEmployer,
    totalArbs:    result.totalArbs,
    resolved:     result.resolved,
  }
}

/**
 * Get pending arbitration assignments for a user.
 */
export async function getPendingArbitrations(
  arbitratorId: string
): Promise<{
  arbitrations: Array<{
    id:        string
    disputeId: string
    createdAt: string
    dispute: {
      id:           string
      status:       string
      tier1Result:  Record<string, unknown>
      submissionId: string
      taskId:       string
    }
  }>
  error: string | null
}> {
  const { data, error } = await supabaseAdmin
    .from('PeerArbitration')
    .select(`
      id,
      disputeId,
      createdAt,
      dispute:disputeId (
        id,
        status,
        tier1Result,
        submissionId,
        taskId
      )
    `)
    .eq('arbitratorId', arbitratorId)
    .is('vote', null)
    .order('createdAt', { ascending: true })

  if (error) {
    console.error('[ProofGrid:Arbitration] getPendingArbitrations error:', error)
    return { arbitrations: [], error: error.message }
  }

  return { arbitrations: (data ?? []) as unknown as Array<{
    id:        string
    disputeId: string
    createdAt: string
    dispute: {
      id:           string
      status:       string
      tier1Result:  Record<string, unknown>
      submissionId: string
      taskId:       string
    }
  }>, error: null }
}

