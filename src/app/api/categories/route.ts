import { supabaseAdmin }     from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('Category')
      .select('id, name, emoji, description, "isActive", "sortOrder"')
      .eq('"isActive"', true)
      .order('"sortOrder"', { ascending: true })

    if (error) {
      console.error('[ProofGrid:Categories] Fetch failed:', error)
      return NextResponse.json(
        { error: 'Failed to fetch categories' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, categories: data ?? [] })

  } catch (err) {
    console.error('[ProofGrid:Categories] Error:', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}


