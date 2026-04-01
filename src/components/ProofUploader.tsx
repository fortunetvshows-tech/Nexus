'use client'

import { useState, useRef } from 'react'
import { COLORS, FONTS, RADII, SPACING } from '@/lib/design/tokens'

interface ProofUploaderProps {
  piUid:        string
  context:      'task' | 'submission'
  contextId:    string
  onUploaded:   (storagePath: string, fileName: string) => void
  label?:       string
  accept?:      string
}

export function ProofUploader({
  piUid, context, contextId, onUploaded,
  label = 'Upload file',
  accept = 'image/*,video/mp4,application/pdf,text/plain',
}: ProofUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [uploaded, setUploaded]       = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (file: File) => {
    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file',      file)
      formData.append('context',   context)
      formData.append('contextId', contextId)

      const res = await fetch(
        `${window.location.origin}/api/proof/upload`,
        {
          method:  'POST',
          headers: { 'x-pi-uid': piUid },
          body:    formData,
        }
      )
      const data = await res.json()

      if (!data.success) {
        setError(data.error ?? 'Upload failed')
        return
      }

      setUploaded(file.name)
      onUploaded(data.storagePath, file.name)

    } catch (err) {
      setError('Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div style={{ marginTop: SPACING.sm }}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleUpload(file)
        }}
      />

      {uploaded ? (
        <div style={{
          display:      'flex',
          alignItems:   'center',
          gap:          SPACING.sm,
          padding:      `${SPACING.sm} ${SPACING.md}`,
          background:   'rgba(16,185,129,0.1)',
          border:       '1px solid rgba(16,185,129,0.3)',
          borderRadius: RADII.md,
        }}>
          <span style={{ color: COLORS.emerald }}>✓</span>
          <span style={{
            fontSize: '0.82rem',
            color:    COLORS.textPrimary,
          }}>
            {uploaded}
          </span>
          <button
            onClick={() => {
              setUploaded(null)
              if (inputRef.current) inputRef.current.value = ''
            }}
            style={{
              marginLeft:  'auto',
              background:  'none',
              border:      'none',
              color:       COLORS.textMuted,
              cursor:      'pointer',
              fontSize:    '0.75rem',
            }}
          >
            Remove
          </button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          style={{
            display:      'flex',
            alignItems:   'center',
            gap:          SPACING.sm,
            padding:      `${SPACING.sm} ${SPACING.md}`,
            background:   COLORS.bgElevated,
            border:       `1px dashed ${COLORS.border}`,
            borderRadius: RADII.md,
            color:        COLORS.textSecondary,
            fontSize:     '0.82rem',
            cursor:       isUploading ? 'wait' : 'pointer',
            width:        '100%',
          }}
        >
          {isUploading ? '⏳ Uploading...' : `📎 ${label}`}
        </button>
      )}

      {error && (
        <div style={{
          marginTop: SPACING.xs,
          fontSize:  '0.75rem',
          color:     '#EF4444',
        }}>
          {error}
        </div>
      )}
    </div>
  )
}
