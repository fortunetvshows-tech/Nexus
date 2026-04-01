import { supabaseAdmin } from '@/lib/supabase-admin'

interface BoostRequest {
  taskId: string
  pulsePaid: number
  boostType: 'featured' | 'urgent' | 'highlighted'
  durationDays?: number
}

export async function POST(req: Request) {
  try {
    const { taskId, pulsePaid, boostType, durationDays = 7 } = (await req.json()) as BoostRequest
    const piUid = req.headers.get('x-pi-uid')

    if (!piUid || !taskId || !pulsePaid || pulsePaid <= 0) {
      return Response.json({ error: 'Invalid request' }, { status: 400 })
    }

    // 1. Verify task exists and user is employer
    const { data: task, error: taskError } = await supabaseAdmin
      .from('Task')
      .select('id, employerId, title')
      .eq('id', taskId)
      .single()

    if (taskError || !task) {
      return Response.json({ error: 'Task not found' }, { status: 404 })
    }

    // 2. Get user ID from piUid
    const { data: user, error: userError } = await supabaseAdmin
      .from('User')
      .select('id')
      .eq('piUid', piUid)
      .single()

    if (userError || !user || user.id !== task.employerId) {
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

    // 4. Create TaskBoost record
    const startAt = new Date()
    const endAt = new Date(startAt.getTime() + durationDays * 24 * 60 * 60 * 1000)

    const { data: boost, error: boostError } = await supabaseAdmin
      .from('TaskBoost')
      .insert([
        {
          taskId,
          employerId: user.id,
          pulsePaid,
          boostType,
          startAt,
          endAt,
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

    // 6. Mark task as featured if boost type is featured
    if (boostType === 'featured') {
      await supabaseAdmin
        .from('Task')
        .update({ isFeatured: true, featuredUntil: endAt, featuredPulsePaid: pulsePaid })
        .eq('id', taskId)
    }

    // 7. Log transaction
    await supabaseAdmin.from('PulseTransaction').insert([
      {
        userId: user.id,
        type: 'boost_spent',
        amount: pulsePaid,
        reason: `Task boost: ${task.title}`,
        taskId,
        balanceBefore: pulse.balance,
        balanceAfter: pulse.balance - pulsePaid,
      },
    ])

    return Response.json({
      success: true,
      boost,
      message: `Task boosted for ${durationDays} days`,
    })
  } catch (error) {
    console.error('Boost error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET available boosts and current status
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const taskId = searchParams.get('taskId')
    const piUid = req.headers.get('x-pi-uid')

    if (!taskId || !piUid) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 })
    }

    // Get active boosts for task
    const { data: boosts } = await supabaseAdmin
      .from('TaskBoost')
      .select('*, Task:taskId(title)')
      .eq('taskId', taskId)
      .gt('endAt', new Date().toISOString())
      .order('startAt', { ascending: false })

    // Get user's pulse balance
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
      boosts: boosts || [],
      pulseBalance: pulse?.balance || 0,
      boostTypes: [
        { type: 'featured', label: '⭐ Featured', minCost: 10 },
        { type: 'urgent', label: '🔥 Urgent', minCost: 5 },
        { type: 'highlighted', label: '✨ Highlighted', minCost: 3 },
      ],
    })
  } catch (error) {
    console.error('Fetch boosts error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

