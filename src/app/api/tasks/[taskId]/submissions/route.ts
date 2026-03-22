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

    // Verify requester is the task employer
    const { data: task } = await supabaseAdmin
      .from('Task')
      .select('employerId')
      .eq('id', taskId)
      .single()

    if (!task) {
      return NextResponse.json(
        { error: 'TASK_NOT_FOUND' },
        { status: 404 }
      )
    }

    const { data: employer } = await supabaseAdmin
      .from('User')
      .select('id')
      .eq('piUid', piUid)
      .single()

    if (!employer || employer.id !== task.employerId) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED' },
        { status: 403 }
      )
    }

    const { data: submissions, error } = await supabaseAdmin
      .from('Submission')
      .select(`
        id,
        status,
        proofContent,
        proofFileUrl,
        submissionType,
        agreedReward,
        qualityRating,
        rejectionReason,
        autoApproved,
        autoApproveAt,
        submittedAt,
        reviewedAt,
        worker:workerId (
          id,
          piUsername,
          reputationScore,
          reputationLevel,
          kycLevel
        ),
        slotReservation:SlotReservation!inner(verificationCode)
      `)
      .eq('taskId', taskId)
      .order('submittedAt', { ascending: false })

    if (error) {
      console.error('[Nexus:GetSubmissionsRoute] Error:', error)
      return NextResponse.json(
        { error: 'FETCH_FAILED' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, submissions: (submissions ?? []).map(sub => ({
        ...sub,
        verificationCode: sub.slotReservation?.[0]?.verificationCode ?? null,
      })) },
      { status: 200 }
    )

  } catch (err) {
    console.error('[Nexus:GetSubmissionsRoute] Unhandled error:', err)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
