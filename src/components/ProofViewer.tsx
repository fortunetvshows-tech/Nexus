'use client'

import { useState, useEffect } from 'react'
import { COLORS, RADII, SPACING } from '@/lib/design/tokens'

interface ProofViewerProps {
  storagePath: string
  piUid:       string
  fileName?:   string
  mimeType?:   string
}

export function ProofViewer({
  storagePath, piUid, fileName, mimeType
}: ProofViewerProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(false)

  useEffect(() => {
    const fetchUrl = async () => {
      try {
        const res = await fetch(
          `${window.location.origin}/api/proof/${storagePath}`,
          { headers: { 'x-pi-uid': piUid } }
        )
        const data = await res.json()
        if (data.signedUrl) setSignedUrl(data.signedUrl)
        else setError(true)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetchUrl()
  }, [storagePath, piUid])

  if (loading) return (
    <div style={{ color: COLORS.textMuted, fontSize: '0.82rem' }}>
      Loading proof...
    </div>
  )

  if (error || !signedUrl) return (
    <div style={{ color: '#EF4444', fontSize: '0.82rem' }}>
      Proof file unavailable
    </div>
  )

  const isImage = mimeType?.startsWith('image/')
  const isVideo = mimeType?.startsWith('video/')
  const isPdf   = mimeType === 'application/pdf'

  return (
    <div style={{
      marginTop:    SPACING.sm,
      borderRadius: RADII.md,
      overflow:     'hidden',
      border:       `1px solid ${COLORS.border}`,
    }}>
      {isImage && (
        <img
          src={signedUrl}
          alt="Proof"
          style={{
            width:     '100%',
            maxHeight: '400px',
            objectFit: 'contain',
            background: COLORS.bgElevated,
          }}
        />
      )}
      {isVideo && (
        <video
          src={signedUrl}
          controls
          style={{ width: '100%', maxHeight: '400px' }}
        />
      )}
      {!isImage && !isVideo && (
        <a
          href={signedUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display:        'flex',
            alignItems:     'center',
            gap:            SPACING.sm,
            padding:        SPACING.md,
            background:     COLORS.bgElevated,
            color:          COLORS.textPrimary,
            textDecoration: 'none',
            fontSize:       '0.85rem',
          }}
        >
          📎 {fileName ?? 'View proof file'}
          <span style={{ marginLeft: 'auto', color: COLORS.textMuted }}>
            Download ↓
          </span>
        </a>
      )}
    </div>
  )
}
