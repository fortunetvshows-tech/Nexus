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

    const { data: employer } = await supabaseAdmin
      .from('User')
      .select('id')
      .eq('piUid', piUid)
      .single()

    if (!employer) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    const { data: tasks, error } = await supabaseAdmin
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
      .eq('employerId', employer.id)
      .is('deletedAt', null)
      .order('createdAt', { ascending: false })
      .limit(20)

    if (error) {
      return NextResponse.json(
        { error: 'FETCH_FAILED' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, tasks: tasks ?? [] },
      { status: 200 }
    )

  } catch (err) {
    console.error('[Nexus:EmployerTasks] Error:', err)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
