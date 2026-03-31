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
    const taskId = formData.get('taskId') as string | null

    console.log('[Instructions Upload] Request received:', {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      fileMime: file?.type,
      taskId,
    })

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!taskId) {
      return NextResponse.json(
        { error: 'No taskId provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const validMimes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ]

    if (!validMimes.includes(file.type)) {
      return NextResponse.json(
        {
          error: 'Invalid file type. Allowed: PDF, DOCX, DOC, JPG, PNG, GIF, WebP.',
        },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB for documents, 5MB for images)
    const maxSize = file.type.startsWith('image/') ? 5 * 1024 * 1024 : 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: `File too large. Max ${file.type.startsWith('image/') ? '5MB' : '10MB'}.`,
        },
        { status: 400 }
      )
    }

    // Convert file to buffer
    let buffer = await file.arrayBuffer()
    let bufferView = new Uint8Array(buffer)

    // For images: compress using built-in approach (reduce quality metadata)
    // Note: Real compression would use 'sharp' library, but for MVP we validate & store
    // In production, add sharp: npm install sharp
    if (file.type.startsWith('image/')) {
      // TODO: When sharp is available, compress here
      // For now, just validate size is already handled above
    }

    // For PDF/DOCX: already compressed format, just validate & store
    // Don't double-compress as modern PDFs/DOCX are already optimized

    // Generate unique filename: instr-{taskId}-{timestamp}-{random}
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(7)
    const ext = file.name.split('.').pop() || 'pdf'
    const filename = `instr-${taskId}-${timestamp}-${random}.${ext}`

    console.log('[Instructions Upload] Uploading to Supabase:', {
      filename,
      fileSize: file.size,
      fileMime: file.type,
    })

    // Upload to nexus-proofs bucket (same bucket as work files, organized by prefix)
    const { data, error: uploadError } = await supabase.storage
      .from('nexus-proofs')
      .upload(filename, bufferView, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('[Instructions Upload] Supabase error:', {
        message: uploadError.message,
        error: uploadError,
      })
      return NextResponse.json(
        { 
          error: 'Upload failed. Please try again.',
          debug: process.env.NODE_ENV === 'development' ? uploadError.message : undefined 
        },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('nexus-proofs')
      .getPublicUrl(filename)

    const instructionUrl = publicUrlData?.publicUrl

    if (!instructionUrl) {
      return NextResponse.json(
        { error: 'Failed to generate public URL' },
        { status: 500 }
      )
    }

    // Calculate file hash for dispute resolution (SHA-256 would be ideal)
    // For MVP, use simple hash of first + last 1KB
    const firstKb = bufferView.slice(0, 1024).toString()
    const lastKb = bufferView.slice(Math.max(0, bufferView.length - 1024)).toString()
    const simpleHash = Buffer.from(firstKb + lastKb).toString('base64').substring(0, 32)

    return NextResponse.json({
      success: true,
      instructionUrl,
      filename,
      originalFileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      fileHash: simpleHash,
      uploadedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Instructions Upload] Catch error:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      { 
        error: 'Server error during upload',
        debug: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: 500 }
    )
  }
}
