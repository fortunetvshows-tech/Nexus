import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ storagePath: string[] }> }
) {
  try {
    const { storagePath: storagePaths } = await params
    const piUid = req.headers.get('x-pi-uid')
    if (!piUid) return NextResponse.json(
      { error: 'UNAUTHORIZED' }, { status: 401 }
    )

    const storagePath = storagePaths.join('/')

    // Generate signed URL valid for 1 hour
    const { data, error } = await supabaseAdmin
      .storage
      .from('proofgrid-proofs')
      .createSignedUrl(storagePath, 3600)

    if (error || !data?.signedUrl) {
      return NextResponse.json(
        { error: 'FILE_NOT_FOUND' }, { status: 404 }
      )
    }

    return NextResponse.json({
      success:   true,
      signedUrl: data.signedUrl,
      expiresIn: 3600,
    })

  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
