import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req:     NextRequest,
  context: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await context.params

    const { data: task, error: taskError } = await supabaseAdmin
      .from('Task')
      .select(`
        id,
        title,
        description,
        categoryId,
        reward,
        maxWorks,
        reservedCount,
        completedCount,
        status,
        qualityRatingMin,
        createdAt,
        updatedAt,
        employerId,
        employer:User!Task_employerId_fkey (
          id,
          piUsername,
          displayName,
          reputationScore,
          level,
          profileImageUrl,
          accountStatus
        )
      `)
      .eq('id', taskId)
      .single()

    if (taskError || !task) {
      return NextResponse.json(
        { error: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    return NextResponse.json(task, { status: 200 })

  } catch (err) {
    console.error('[Nexus:GetTaskRoute] Error:', err)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
