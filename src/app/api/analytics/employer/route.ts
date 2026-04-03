import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const piUid = req.headers.get('x-pi-uid')
    if (!piUid) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    const { data: user } = await supabaseAdmin
      .from('User')
      .select('id')
      .eq('piUid', piUid)
      .single()

    if (!user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // Fetch posted tasks with submission counts
    const { data: tasks, error: tasksError } = await supabaseAdmin
      .from('Task')
      .select(`
        id,
        title,
        category,
        piReward,
        slotsAvailable,
        slotsRemaining,
        taskStatus,
        createdAt
      `)
      .eq('employerId', user.id)
      .order('createdAt', { ascending: false })

    if (tasksError) {
      console.error('[ProofGrid:Analytics:Employer] Tasks error:', tasksError)
      return NextResponse.json(
        { error: 'FETCH_FAILED' },
        { status: 500 }
      )
    }

    // Fetch employer payouts (worker_payout transactions paid by employer)
    const { data: payouts } = await supabaseAdmin
      .from('Transaction')
      .select('amount, status, createdAt')
      .eq('senderId', user.id)
      .eq('type', 'worker_payout')
      .eq('status', 'confirmed')
      .order('createdAt', { ascending: false })

    const taskList = tasks ?? []
    const payoutList = payouts ?? []

    // Calculate summary
    const totalTasksPosted = taskList.length
    const totalSlotsPosted = taskList.reduce(
      (sum, t) => sum + t.slotsAvailable, 0
    )
    const totalSlotsFilled = taskList.reduce(
      (sum, t) => sum + (t.slotsAvailable - t.slotsRemaining), 0
    )
    // Calculate total escrowed from tasks in 'escrowed' status
    // Total escrowed = sum of (piReward × slotsAvailable) for each escrowed task
    const totalEscrowed = taskList
      .filter(t => t.taskStatus === 'escrowed')
      .reduce((sum, t) => sum + (Number(t.piReward) * t.slotsAvailable), 0)
    
    const totalSpent = payoutList
      .reduce((sum, t) => sum + Number(t.amount), 0)

    return NextResponse.json(
      {
        success: true,
        summary: {
          totalTasksPosted,
          totalSlotsPosted,
          totalSlotsFilled,
          fillRate: totalSlotsPosted > 0
            ? (totalSlotsFilled / totalSlotsPosted * 100).toFixed(1)
            : '0.0',
          totalEscrowed,
          totalSpent,
        },
        tasks: taskList,
      },
      { status: 200 }
    )

  } catch (err) {
    console.error('[ProofGrid:Analytics:Employer] Unhandled:', err)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}


