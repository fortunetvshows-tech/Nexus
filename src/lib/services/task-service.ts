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

export interface TaskFilters {
  search?:       string
  category?:     string
  minReward?:    number
  maxReward?:    number
  badgeLevel?:   string
  status?:       string
  sort?:         'newest' | 'reward_high' | 'reward_low' | 'ending_soon'
}

/**
 * Fetch active tasks for worker feed (TB-011).
 * Supports: search, category, reward range, sort, badge filtering
 * Returns tasks with total count for pagination
 */
export async function getActiveTasks(
  workerId: string,
  limit    = 10,
  offset   = 0,
  filters: TaskFilters = {}
) {
  // Get worker profile for filtering
  const { data: worker } = await supabaseAdmin
    .from('User')
    .select('reputationScore, kycLevel, preferredCategories')
    .eq('id', workerId)
    .single()

  if (!worker) {
    return { tasks: [], total: 0, error: 'WORKER_NOT_FOUND' }
  }

  // Start building the query with count
  let query = supabaseAdmin
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
        id,
        piUsername,
        reputationScore,
        reputationLevel
      )
    `, { count: 'exact' })

  // Apply status filter (default: escrowed)
  const status = filters.status || 'escrowed'
  query = query.eq('taskStatus', status)
  
  // Self-submission firewall: workers never see their own posted tasks
  query = query.neq('employerId', workerId)

  // Apply category filter
  if (filters.category) {
    query = query.eq('category', filters.category)
  }

  // Apply reward range filters
  if (filters.minReward !== undefined) {
    query = query.gte('piReward', filters.minReward)
  }
  if (filters.maxReward !== undefined) {
    query = query.lte('piReward', filters.maxReward)
  }

  // Apply worker's reputation filter
  query = query.lte('minReputationReq', worker.reputationScore)

  // Apply badge level filter if specified
  if (filters.badgeLevel) {
    query = query.eq('minBadgeLevel', filters.badgeLevel)
  }

  // Apply standard filters
  query = query
    .gt('slotsRemaining', 0)
    .gt('deadline', new Date().toISOString())
    .lte('targetKycLevel', worker.kycLevel)
    .is('deletedAt', null)

  // Apply search filter if specified (TB-011: search title/description)
  if (filters.search) {
    const searchTerm = `%${filters.search}%`
    query = query.or(
      `title.ilike.${searchTerm},description.ilike.${searchTerm}`
    )
  }

  // Apply sorting (TB-011 sort options)
  const sort = filters.sort || 'newest'
  switch (sort) {
    case 'reward_high':
      query = query.order('piReward', { ascending: false })
      break
    case 'reward_low':
      query = query.order('piReward', { ascending: true })
      break
    case 'ending_soon':
      query = query.order('deadline', { ascending: true })
      break
    case 'newest':
    default:
      query = query
        .order('isFeatured', { ascending: false })
        .order('createdAt', { ascending: false })
      break
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1)

  const { data: tasks, error, count } = await query

  if (error) {
    console.error('[Nexus:TaskService] Feed query failed:', error)
    return { tasks: [], total: 0, error: error.message }
  }

  return { tasks: tasks ?? [], total: count ?? 0, error: null }
}

