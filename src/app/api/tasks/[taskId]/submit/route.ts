import { checkRateLimit }    from '@/lib/rate-limit'
import { supabaseAdmin }      from '@/lib/supabase-admin'
import { submitTaskProof }    from '@/lib/services/submission-service'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  req:     NextRequest,
  context: { params: Promise<{ taskId: string }> }
) {
  try {
    const limited = await checkRateLimit(req, 'submission')
    if (limited) return limited

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
      .select('id, reputationScore, accountStatus')
      .eq('piUid', piUid)
      .single()

    if (!worker || worker.accountStatus !== 'active') {
      return NextResponse.json(
        { error: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { proofContent, proofFileUrl, submissionType, proofStoragePath } = body

    if (!proofContent && !proofFileUrl && !proofStoragePath) {
      return NextResponse.json(
        { error: 'MISSING_PROOF' },
        { status: 400 }
      )
    }

    const result = await submitTaskProof(
      taskId,
      worker.id,
      proofContent || '',
      proofFileUrl,
      submissionType,
      proofStoragePath
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success:      true,
        submissionId: result.submissionId,
        autoApproveAt: result.autoApproveAt,
        agreedReward: result.agreedReward,
      },
      { status: 200 }
    )

  } catch (err) {
    console.error('[Nexus:SubmitRoute] Error:', err)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
