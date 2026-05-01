'use client'

import { useRouter } from 'next/navigation'
import React from 'react'

interface PageTopbarProps {
  title: string
  showBack?: boolean
  backHref?: string
  actions?: React.ReactNode
}

export function PageTopbar({
  title,
  showBack = false,
  backHref,
  actions,
}: PageTopbarProps) {
  const router = useRouter()

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 0 12px',
      marginBottom: '4px',
      position: 'sticky',
      top: 0,
      zIndex: 20,
      background: 'linear-gradient(180deg, rgba(7,9,14,0.98) 70%, transparent)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {showBack && (
          <button
            onClick={() => backHref ? router.push(backHref) : router.back()}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              padding: '6px 10px',
              color: '#8892A8',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            ← Back
          </button>
        )}
        <div style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: '20px',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          color: '#EEF2FF',
        }}>
          {title}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {actions}
      </div>
    </div>
  )
}
