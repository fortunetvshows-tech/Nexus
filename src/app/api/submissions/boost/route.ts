import { supabaseAdmin } from '@/lib/supabase-admin'

interface WorkerBoostRequest {
  submissionId: string
  pulsePaid: number
  boostType: 'priority_review' | 'visibility' | 'quality_boost'
}

export async function POST(req: Request) {
  try {
    const { submissionId, pulsePaid, boostType } = (await req.json()) as WorkerBoostRequest
    const piUid = req.headers.get('x-pi-uid')

    if (!piUid || !submissionId || !pulsePaid || pulsePaid <= 0) {
      return Response.json({ error: 'Invalid request' }, { status: 400 })
    }

    // 1. Get user
    const { data: user, error: userError } = await supabaseAdmin
      .from('User')
      .select('id')
      .eq('piUid', piUid)
      .single()

    if (userError || !user) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    // 2. Verify submission exists and belongs to user
    const { data: submission, error: submissionError } = await supabaseAdmin
      .from('Submission')
      .select('id, workerId, taskId, status, agreedReward')
      .eq('id', submissionId)
      .single()

    if (submissionError || !submission) {
      return Response.json({ error: 'Submission not found' }, { status: 404 })
    }

    if (submission.workerId !== user.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // 3. Check user has enough pulse
    const { data: pulse } = await supabaseAdmin
      .from('PulseToken')
      .select('balance')
      .eq('userId', user.id)
      .single()

    if (!pulse || pulse.balance < pulsePaid) {
      return Response.json({ error: 'Insufficient pulse balance' }, { status: 400 })
    }

    // 4. Create WorkerBoost record
    const { data: boost, error: boostError } = await supabaseAdmin
      .from('WorkerBoost')
      .insert([
        {
          submissionId,
          workerId: user.id,
          pulsePaid,
          boostType,
          appliedAt: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (boostError) {
      return Response.json({ error: 'Failed to create boost' }, { status: 500 })
    }

    // 5. Deduct pulse
    const { error: deductError } = await supabaseAdmin
      .from('PulseToken')
      .update({ balance: pulse.balance - pulsePaid })
      .eq('userId', user.id)

    if (deductError) {
      return Response.json({ error: 'Failed to deduct pulse' }, { status: 500 })
    }

    // 6. Log transaction
    await supabaseAdmin.from('PulseTransaction').insert([
      {
        userId: user.id,
        type: 'worker_boost_spent',
        amount: pulsePaid,
        reason: `Submission boost: ${boostType}`,
        submissionId,
        balanceBefore: pulse.balance,
        balanceAfter: pulse.balance - pulsePaid,
      },
    ])

    return Response.json({
      success: true,
      boost,
      message: `Submission boost applied: ${boostType}`,
    })
  } catch (error) {
    console.error('Worker boost error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET worker's pulse balance and boost options
export async function GET(req: Request) {
  try {
    const piUid = req.headers.get('x-pi-uid')

    if (!piUid) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: user } = await supabaseAdmin
      .from('User')
      .select('id')
      .eq('piUid', piUid)
      .single()

    const { data: pulse } = await supabaseAdmin
      .from('PulseToken')
      .select('balance')
      .eq('userId', user?.id || '')
      .single()

    return Response.json({
      pulseBalance: pulse?.balance || 0,
      boostOptions: [
        { type: 'priority_review', label: '⚡ Priority Review', cost: 3, description: 'Get reviewed within 1 hour' },
        { type: 'visibility', label: '👁 High Visibility', cost: 2, description: 'Increases employer visibility' },
        { type: 'quality_boost', label: '⭐ Quality Badge', cost: 5, description: 'Shows quality dedication' },
      ],
    })
  } catch (error) {
    console.error('Get boost options error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}


