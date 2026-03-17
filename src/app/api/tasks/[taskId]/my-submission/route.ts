import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req:     NextRequest,
  context: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await context.params
    const piUid = req.headers.get('x-pi-uid')

    if (!piUid) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED' },
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
        { error: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    const { data: submission } = await supabaseAdmin
      .from('Submission')
      .select('id, status, proofContent, agreedReward, submittedAt')
      .eq('taskId', taskId)
      .eq('workerId', worker.id)
      .order('submittedAt', { ascending: false })
      .limit(1)
      .maybeSingle()

    return NextResponse.json(
      { success: true, submission: submission ?? null },
      { status: 200 }
    )

  } catch (err) {
    console.error('[Nexus:MySubmission] Error:', err)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
