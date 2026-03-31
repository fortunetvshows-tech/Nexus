import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase config')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function POST(request: NextRequest) {
  try {
    const piUid = request.headers.get('x-pi-uid')
    if (!piUid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const submissionId = formData.get('submissionId') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!submissionId) {
      return NextResponse.json({ error: 'No submissionId provided' }, { status: 400 })
    }

    // Validate file type (same as instructions)
    const validMimes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ]

    if (!validMimes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: PDF, DOCX, DOC, JPG, PNG, GIF, WebP.' },
        { status: 400 }
      )
    }

    // Validate file size
    const maxSize = file.type.startsWith('image/') ? 5 * 1024 * 1024 : 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Max ${file.type.startsWith('image/') ? '5MB' : '10MB'}.` },
        { status: 400 }
      )
    }

    const buffer = await file.arrayBuffer()
    const bufferView = new Uint8Array(buffer)

    // Generate unique filename: {submissionId}-work-{timestamp}-{random}
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(7)
    const ext = file.name.split('.').pop() || 'pdf'
    const filename = `${submissionId}-work-${timestamp}-${random}.${ext}`

    // Upload to nexus-proofs bucket (same bucket, organized by prefix)
    const { data, error: uploadError } = await supabase.storage
      .from('nexus-proofs')
      .upload(filename, bufferView, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: 'Upload failed. Please try again.' },
        { status: 500 }
      )
    }

    const { data: publicUrlData } = supabase.storage
      .from('nexus-proofs')
      .getPublicUrl(filename)

    const workFileUrl = publicUrlData?.publicUrl

    if (!workFileUrl) {
      return NextResponse.json(
        { error: 'Failed to generate public URL' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      workFileUrl,
      filename,
      originalFileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      uploadedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Work file upload error:', error)
    return NextResponse.json(
      { error: 'Server error during upload' },
      { status: 500 }
    )
  }
}
