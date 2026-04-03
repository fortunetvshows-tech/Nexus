import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  try {
    const piUid = req.headers.get('x-pi-uid')
    if (!piUid) return NextResponse.json(
      { error: 'UNAUTHORIZED' }, { status: 401 }
    )

    const { data: user } = await supabaseAdmin
      .from('User')
      .select('id')
      .eq('piUid', piUid)
      .single()

    if (!user) return NextResponse.json(
      { error: 'USER_NOT_FOUND' }, { status: 404 }
    )

    const formData = await req.formData()
    const file     = formData.get('file') as File
    const context  = formData.get('context') as string // 'task' | 'submission'
    const contextId = formData.get('contextId') as string

    if (!file || !context || !contextId) {
      return NextResponse.json(
        { error: 'MISSING_FIELDS' }, { status: 400 }
      )
    }

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'FILE_TOO_LARGE', maxMB: 50 }, { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'video/mp4', 'video/webm',
      'audio/mpeg', 'audio/wav', 'audio/ogg',
      'application/pdf',
      'text/plain',
    ]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'INVALID_FILE_TYPE', allowed: allowedTypes },
        { status: 400 }
      )
    }

    const buffer    = Buffer.from(await file.arrayBuffer())
    const ext       = file.name.split('.').pop() ?? 'bin'
    const timestamp = Date.now()
    const storagePath = `${context}/${contextId}/${user.id}/${timestamp}.${ext}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseAdmin
      .storage
      .from('proofgrid-proofs')
      .upload(storagePath, buffer, {
        contentType:  file.type,
        cacheControl: '3600',
        upsert:       false,
      })

    if (uploadError) {
      console.error('[ProofGrid:Proof] Upload error:', uploadError)
      return NextResponse.json(
        { error: 'UPLOAD_FAILED', detail: uploadError.message },
        { status: 500 }
      )
    }

    // Update submission with storage key if context is submission
    if (context === 'submission') {
      await supabaseAdmin
        .from('Submission')
        .update({
          proofStorageKey: storagePath,
          proofFileSize:   file.size,
          proofMimeType:   file.type,
          updatedAt:       new Date().toISOString(),
        })
        .eq('id', contextId)
    }

    console.log('[ProofGrid:Proof] Uploaded:', storagePath)

    return NextResponse.json({
      success:     true,
      storagePath,
      fileName:    file.name,
      fileSize:    file.size,
      mimeType:    file.type,
    })

  } catch (err: any) {
    console.error('[ProofGrid:Proof] Error:', err?.message ?? err)
    return NextResponse.json(
      { error: err?.message ?? 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}


