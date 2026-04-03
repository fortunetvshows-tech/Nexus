import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/notifications — fetch recent notifications for user
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

    const { data: notifications, error } = await supabaseAdmin
      .from('Notification')
      .select('id, type, title, body, metadata, isRead, createdAt')
      .eq('userId', user.id)
      .order('createdAt', { ascending: false })
      .limit(20)

    if (error) {
      console.error('[ProofGrid:Notifications] Fetch error:', error)
      return NextResponse.json(
        { error: 'FETCH_FAILED' },
        { status: 500 }
      )
    }

    const unreadCount = (notifications ?? [])
      .filter(n => !n.isRead).length

    return NextResponse.json(
      {
        success:        true,
        notifications: notifications ?? [],
        unreadCount,
      },
      { status: 200 }
    )

  } catch (err) {
    console.error('[ProofGrid:Notifications] Error:', err)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

// POST /api/notifications — mark notifications as read
export async function POST(req: NextRequest) {
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

    const body = await req.json()
    const { notificationIds } = body as {
      notificationIds: string[]
    }

    // If notificationIds provided — mark specific ones read
    // If empty array — mark all read
    let query = supabaseAdmin
      .from('Notification')
      .update({ isRead: true })
      .eq('userId', user.id)

    if (notificationIds && notificationIds.length > 0) {
      query = query.in('id', notificationIds)
    }

    const { error } = await query

    if (error) {
      console.error('[ProofGrid:Notifications] Mark read error:', error)
      return NextResponse.json(
        { error: 'UPDATE_FAILED' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true },
      { status: 200 }
    )

  } catch (err) {
    console.error('[ProofGrid:Notifications] POST error:', err)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}


