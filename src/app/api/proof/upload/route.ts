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
    // Get auth header
    const piUid = request.headers.get('x-pi-uid')
    if (!piUid) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const submissionId = formData.get('submissionId') as string | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!submissionId) {
      return NextResponse.json(
        { error: 'No submissionId provided' },
        { status: 400 }
      )
    }

    // Validate file type (image only)
    const validMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!validMimes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPG, PNG, GIF, WebP allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Max 5MB.' },
        { status: 400 }
      )
    }

    // Generate unique filename: {submissionId}-{timestamp}-{random}
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(7)
    const ext = file.name.split('.').pop() || 'jpg'
    const filename = `${submissionId}-${timestamp}-${random}.${ext}`

    // Convert file to buffer
    const buffer = await file.arrayBuffer()

    // Upload to Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from('proofgrid-proofs')
      .upload(filename, buffer, {
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

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('proofgrid-proofs')
      .getPublicUrl(filename)

    const proofUrl = publicUrlData?.publicUrl

    if (!proofUrl) {
      return NextResponse.json(
        { error: 'Failed to generate public URL' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      proofUrl,
      filename,
    })
  } catch (error) {
    console.error('Proof upload error:', error)
    return NextResponse.json(
      { error: 'Server error during upload' },
      { status: 500 }
    )
  }
}

