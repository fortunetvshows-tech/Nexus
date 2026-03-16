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

    const { data: submissions, error } = await supabaseAdmin
      .from('Submission')
      .select(`
        id,
        status,
        proofContent,
        agreedReward,
        qualityRating,
        rejectionReason,
        autoApproved,
        submittedAt,
        reviewedAt,
        task:taskId (
          id,
          title,
          category,
          piReward
        )
      `)
      .eq('workerId', worker.id)
      .order('submittedAt', { ascending: false })
      .limit(20)

    if (error) {
      console.error('[Nexus:WorkerSubmissions] Error:', error)
      return NextResponse.json(
        { error: 'FETCH_FAILED' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, submissions: submissions ?? [] },
      { status: 200 }
    )

  } catch (err) {
    console.error('[Nexus:WorkerSubmissions] Unhandled error:', err)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
