import { supabaseAdmin }     from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

// GET — list all categories including inactive
export async function GET(req: NextRequest) {
  try {
    const piUid = req.headers.get('x-pi-uid')
    if (!piUid) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

    const { data: admin } = await supabaseAdmin
      .from('User').select('isAdmin').eq('piUid', piUid).single()
    if (!admin?.isAdmin) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })

    const { data } = await supabaseAdmin
      .from('Category')
      .select('*')
      .order('sortOrder', { ascending: true })

    return NextResponse.json({ success: true, categories: data ?? [] })

  } catch (err) {
    console.error('[Nexus:AdminCategories] GET Error:', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

// POST — add new category
export async function POST(req: NextRequest) {
  try {
    const piUid = req.headers.get('x-pi-uid')
    if (!piUid) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

    const { data: admin } = await supabaseAdmin
      .from('User').select('isAdmin').eq('piUid', piUid).single()
    if (!admin?.isAdmin) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })

    const { name, emoji, description } = await req.json()
    if (!name || !emoji) {
      return NextResponse.json({ error: 'MISSING_FIELDS' }, { status: 400 })
    }

    // Get max sortOrder
    const { data: last } = await supabaseAdmin
      .from('Category')
      .select('sortOrder')
      .order('sortOrder', { ascending: false })
      .limit(1)
      .single()

    const sortOrder = (last?.sortOrder ?? 0) + 1

    const { data, error } = await supabaseAdmin
      .from('Category')
      .insert({
        name,
        emoji,
        description: description ?? null,
        isActive:    true,
        sortOrder,
        updatedAt:   new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('[Nexus:AdminCategories] Insert Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, category: data })

  } catch (err) {
    console.error('[Nexus:AdminCategories] POST Error:', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

// PATCH — toggle active / update
export async function PATCH(req: NextRequest) {
  try {
    const piUid = req.headers.get('x-pi-uid')
    if (!piUid) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

    const { data: admin } = await supabaseAdmin
      .from('User').select('isAdmin').eq('piUid', piUid).single()
    if (!admin?.isAdmin) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })

    const { id, isActive, name, emoji, description } = await req.json()
    if (!id) return NextResponse.json({ error: 'MISSING_ID' }, { status: 400 })

    const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() }
    if (isActive !== undefined) updates.isActive    = isActive
    if (name      !== undefined) updates.name       = name
    if (emoji     !== undefined) updates.emoji      = emoji
    if (description !== undefined) updates.description = description

    const { data, error } = await supabaseAdmin
      .from('Category')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[Nexus:AdminCategories] Update Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, category: data })

  } catch (err) {
    console.error('[Nexus:AdminCategories] PATCH Error:', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

// DELETE — remove category
export async function DELETE(req: NextRequest) {
  try {
    const piUid = req.headers.get('x-pi-uid')
    if (!piUid) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

    const { data: admin } = await supabaseAdmin
      .from('User').select('isAdmin').eq('piUid', piUid).single()
    if (!admin?.isAdmin) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })

    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'MISSING_ID' }, { status: 400 })

    const { error } = await supabaseAdmin
      .from('Category')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[Nexus:AdminCategories] Delete Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (err) {
    console.error('[Nexus:AdminCategories] DELETE Error:', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
