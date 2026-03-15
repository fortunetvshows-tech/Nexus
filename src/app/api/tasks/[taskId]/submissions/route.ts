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

    // Verify requester is task employer
    const { data: task } = await supabaseAdmin
      .from('Task')
      .select('employerId')
      .eq('id', taskId)
      .single()

    const { data: employer } = await supabaseAdmin
      .from('User')
      .select('id')
      .eq('piUid', piUid)
      .single()

    if (!task || !employer || task.employerId !== employer.id) {
      return NextResponse.json(
        { error: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    // Fetch submissions with worker details
    const { data: submissions, error } = await supabaseAdmin
      .from('Submission')
      .select(`
        id,
        taskId,
        workerId,
        proofContent,
        proofFileUrl,
        submissionType,
        status,
        employerQualityRating,
        approvedAt,
        createdAt,
        worker:User!Submission_workerId_fkey (
          id,
          piUsername,
          displayName,
          reputationScore,
          level,
          KYCStatus,
          profileImageUrl
        )
      `)
      .eq('taskId', taskId)
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('[Nexus:GetSubmissionsRoute] Error:', error)
      return NextResponse.json(
        { error: 'INTERNAL_ERROR' },
        { status: 500 }
      )
    }

    return NextResponse.json(submissions || [], { status: 200 })

  } catch (err) {
    console.error('[Nexus:GetSubmissionsRoute] Error:', err)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
