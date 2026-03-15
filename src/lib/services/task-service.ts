import { supabaseAdmin } from '@/lib/supabase-admin'

export type TaskCreateInput = {
  employerId:     string
  title:          string
  description:    string
  instructions:   string
  category:       string
  proofType:      string
  piReward:       number
  slotsAvailable: number
  timeEstimateMin: number
  deadlineHours:  number
  minReputation:  number
  minBadgeLevel:  string
  targetKycLevel: number
  tags:           string[]
}

export type TaskCreateResult = {
  success:       boolean
  taskId?:       string
  totalEscrowed?: number
  deadline?:     string
  error?:        string
  code?:         string
}

/**
 * Called after Pi payment is confirmed on-chain.
 * Creates task and escrow atomically via RPC.
 * Never call this before payment is confirmed.
 */
export async function createTaskWithEscrow(
  input: TaskCreateInput,
  escrowTxid: string,
  piPaymentId: string
): Promise<TaskCreateResult> {

  if (!escrowTxid || !piPaymentId) {
    return {
      success: false,
      error:   'Payment transaction details are required',
      code:    'MISSING_PAYMENT_DETAILS',
    }
  }

  const { data, error } = await supabaseAdmin
    .rpc('create_task_with_escrow', {
      p_employer_id:      input.employerId,
      p_title:            input.title,
      p_description:      input.description,
      p_instructions:     input.instructions,
      p_category:         input.category,
      p_proof_type:       input.proofType,
      p_pi_reward:        input.piReward,
      p_slots_available:  input.slotsAvailable,
      p_time_estimate:    input.timeEstimateMin,
      p_deadline_hours:   input.deadlineHours,
      p_min_reputation:   input.minReputation,
      p_min_badge_level:  input.minBadgeLevel,
      p_target_kyc_level: input.targetKycLevel,
      p_tags:             input.tags,
      p_escrow_txid:      escrowTxid,
      p_pi_payment_id:    piPaymentId,
    })

  if (error) {
    console.error('[Nexus:TaskService] RPC failed:', error)
    return {
      success: false,
      error:   error.message,
      code:    'RPC_FAILED',
    }
  }

  const result = data as {
    success:       boolean
    taskId?:       string
    totalEscrowed?: number
    deadline?:     string
    error?:        string
  }

  if (!result.success) {
    return {
      success: false,
      error:   result.error,
      code:    'TASK_CREATION_FAILED',
    }
  }

  return {
    success:       true,
    taskId:        result.taskId,
    totalEscrowed: result.totalEscrowed,
    deadline:      result.deadline,
  }
}

/**
 * Fetch active tasks for worker feed.
 * Filters by worker's reputation and badge level.
 */
export async function getActiveTasks(
  workerId: string,
  limit    = 20,
  offset   = 0
) {
  // Get worker profile for filtering
  const { data: worker } = await supabaseAdmin
    .from('User')
    .select('reputationScore, kycLevel, preferredCategories')
    .eq('id', workerId)
    .single()

  if (!worker) {
    return { tasks: [], error: 'WORKER_NOT_FOUND' }
  }

  const { data: tasks, error } = await supabaseAdmin
    .from('Task')
    .select(`
      id,
      title,
      description,
      category,
      proofType,
      piReward,
      slotsAvailable,
      slotsRemaining,
      timeEstimateMin,
      deadline,
      minReputationReq,
      minBadgeLevel,
      isFeatured,
      tags,
      createdAt,
      employer:employerId (
        piUsername,
        reputationScore,
        reputationLevel
      )
    `)
    .eq('taskStatus', 'escrowed')
    .gt('slotsRemaining', 0)
    .gt('deadline', new Date().toISOString())
    .lte('minReputationReq', worker.reputationScore)
    .lte('targetKycLevel', worker.kycLevel)
    .is('deletedAt', null)
    .order('isFeatured', { ascending: false })
    .order('createdAt', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('[Nexus:TaskService] Feed query failed:', error)
    return { tasks: [], error: error.message }
  }

  return { tasks: tasks ?? [], error: null }
}
