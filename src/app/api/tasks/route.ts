import { checkRateLimit }       from '@/lib/rate-limit'
import { supabaseAdmin }        from '@/lib/supabase-admin'
import { createTaskWithEscrow, getActiveTasks } from '@/lib/services/task-service'
import {
  approvePiPayment,
  completePiPayment,
} from '@/lib/services/pi-payment-service'
import { NextRequest, NextResponse } from 'next/server'

// Validation constants matching Master Architecture Document
const VALID_CATEGORIES = [
  'Survey & Research',
  'App Testing',
  'Translation',
  'Audio Recording',
  'Photo Capture',
  'Content Review',
  'Data Labeling',
  'Micro-Consulting',
  'Social Verification',
] as const

const VALID_PROOF_TYPES = [
  'TEXT',
  'FILE',
  'IMAGE',
  'AUDIO',
  'VIDEO',
  'STRUCTURED_FORM',
] as const

const VALID_BADGE_LEVELS = [
  'UNVERIFIED',
  'BEGINNER',
  'COMPETENT',
  'PROFICIENT',
  'EXPERT',
] as const

// POST /api/tasks — create a new task
// Called AFTER Pi payment is confirmed on-chain
export async function POST(req: NextRequest) {
  try {
    const limited = await checkRateLimit(req, 'taskCreation')
    if (limited) return limited

    const piUid = req.headers.get('x-pi-uid')
    if (!piUid) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Resolve employer User record
    const { data: employer } = await supabaseAdmin
      .from('User')
      .select('id, accountStatus, reputationScore')
      .eq('piUid', piUid)
      .single()

    if (!employer || employer.accountStatus !== 'active') {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Invalid or suspended account' },
        { status: 401 }
      )
    }

    let body: Record<string, unknown>
    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        { error: 'INVALID_REQUEST', message: 'Request body must be valid JSON' },
        { status: 400 }
      )
    }

    // Destructure and validate all required fields
    const {
      title,
      description,
      instructions,
      category,
      proofType,
      piReward,
      slotsAvailable,
      timeEstimateMin,
      deadlineHours,
      minReputation    = 100,
      minBadgeLevel    = 'UNVERIFIED',
      targetKycLevel   = 0,
      tags             = [],
      escrowTxid,
      piPaymentId,
    } = body as Record<string, unknown>

    // Field presence validation
    const missingFields = []
    if (!title)          missingFields.push('title')
    if (!description)    missingFields.push('description')
    if (!instructions)   missingFields.push('instructions')
    if (!category)       missingFields.push('category')
    if (!proofType)      missingFields.push('proofType')
    if (!piReward)       missingFields.push('piReward')
    if (!slotsAvailable) missingFields.push('slotsAvailable')
    if (!timeEstimateMin) missingFields.push('timeEstimateMin')
    if (!deadlineHours)  missingFields.push('deadlineHours')
    if (!escrowTxid)     missingFields.push('escrowTxid')
    if (!piPaymentId)    missingFields.push('piPaymentId')

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error:   'VALIDATION_ERROR',
          message: `Missing required fields: ${missingFields.join(', ')}`,
        },
        { status: 400 }
      )
    }

    // Type and range validation
    if (typeof title !== 'string' ||
        title.length < 5 ||
        title.length > 200) {
      return NextResponse.json(
        {
          error:   'VALIDATION_ERROR',
          message: 'Title must be between 5 and 200 characters',
        },
        { status: 400 }
      )
    }

    if (typeof description !== 'string' ||
        description.length < 20) {
      return NextResponse.json(
        {
          error:   'VALIDATION_ERROR',
          message: 'Description must be at least 20 characters',
        },
        { status: 400 }
      )
    }

    if (typeof instructions !== 'string' ||
        instructions.length < 20) {
      return NextResponse.json(
        {
          error:   'VALIDATION_ERROR',
          message: 'Instructions must be at least 20 characters',
        },
        { status: 400 }
      )
    }

    if (!VALID_CATEGORIES.includes(
          category as typeof VALID_CATEGORIES[number]
        )) {
      return NextResponse.json(
        {
          error:   'VALIDATION_ERROR',
          message: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`,
        },
        { status: 400 }
      )
    }

    if (!VALID_PROOF_TYPES.includes(
          proofType as typeof VALID_PROOF_TYPES[number]
        )) {
      return NextResponse.json(
        {
          error:   'VALIDATION_ERROR',
          message: `Invalid proof type`,
        },
        { status: 400 }
      )
    }

    if (typeof piReward !== 'number' || piReward <= 0 || piReward > 10000) {
      return NextResponse.json(
        {
          error:   'VALIDATION_ERROR',
          message: 'Pi reward must be a positive number up to 10000',
        },
        { status: 400 }
      )
    }

    if (typeof slotsAvailable !== 'number' ||
        slotsAvailable < 1 ||
        slotsAvailable > 10000) {
      return NextResponse.json(
        {
          error:   'VALIDATION_ERROR',
          message: 'Slots must be between 1 and 10000',
        },
        { status: 400 }
      )
    }

    if (!VALID_BADGE_LEVELS.includes(
          minBadgeLevel as typeof VALID_BADGE_LEVELS[number]
        )) {
      return NextResponse.json(
        {
          error:   'VALIDATION_ERROR',
          message: 'Invalid badge level',
        },
        { status: 400 }
      )
    }

    // Create task atomically
    const result = await createTaskWithEscrow(
      {
        employerId:      employer.id,
        title:           title as string,
        description:     description as string,
        instructions:    instructions as string,
        category:        category as string,
        proofType:       proofType as string,
        piReward:        piReward as number,
        slotsAvailable:  slotsAvailable as number,
        timeEstimateMin: timeEstimateMin as number,
        deadlineHours:   deadlineHours as number,
        minReputation:   minReputation as number,
        minBadgeLevel:   minBadgeLevel as string,
        targetKycLevel:  targetKycLevel as number,
        tags:            tags as string[],
      },
      escrowTxid as string,
      piPaymentId as string
    )

    if (!result.success) {
      return NextResponse.json(
        {
          error:   result.code,
          message: result.error,
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success:       true,
        taskId:        result.taskId,
        totalEscrowed: result.totalEscrowed,
        deadline:      result.deadline,
      },
      { status: 201 }
    )

  } catch (err) {
    console.error('[Nexus:TasksRoute] Unhandled error:', err)
    return NextResponse.json(
      {
        error:   'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}

// GET /api/tasks — fetch active tasks for worker feed
export async function GET(req: NextRequest) {
  try {
    const piUid = req.headers.get('x-pi-uid')
    if (!piUid) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      )
    }

    const { data: worker } = await supabaseAdmin
      .from('User')
      .select('id')
      .eq('piUid', piUid)
      .single()

    if (!worker) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'User not found' },
        { status: 401 }
      )
    }

    const url    = new URL(req.url)
    const limit  = Math.min(
      parseInt(url.searchParams.get('limit')  ?? '20'), 50
    )
    const offset = parseInt(url.searchParams.get('offset') ?? '0')

    const { tasks, error } = await getActiveTasks(
      worker.id, limit, offset
    )

    if (error) {
      return NextResponse.json(
        { error: 'FEED_ERROR', message: error },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, tasks }, { status: 200 })

  } catch (err) {
    console.error('[Nexus:TasksRoute] Unhandled GET error:', err)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

