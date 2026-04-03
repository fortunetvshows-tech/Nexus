'use client'

interface ShinyButtonProps {
  children:  React.ReactNode
  onClick?:  () => void
  disabled?: boolean
  className?: string
}

export function ShinyButton({
  children,
  onClick,
  disabled,
  className = '',
}: ShinyButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`proofgrid-btn-primary ${className}`}
      style={{
        position:    'relative',
        overflow:    'hidden',
        padding:     '0.9rem 2.5rem',
        fontSize:    '1rem',
        letterSpacing: '-0.01em',
        minWidth:    '200px',
      }}
    >
      {/* Shimmer overlay */}
      <span
        aria-hidden
        style={{
          position:   'absolute',
          inset:      0,
          background: `linear-gradient(
            105deg,
            transparent 40%,
            rgba(255,255,255,0.15) 50%,
            transparent 60%
          )`,
          backgroundSize: '200% 100%',
          animation:  disabled ? 'none' : 'shimmer 2.5s infinite',
          borderRadius: 'inherit',
          pointerEvents: 'none',
        }}
      />

      {/* Border beam */}
      <span
        aria-hidden
        style={{
          position:     'absolute',
          inset:        0,
          borderRadius: 'inherit',
          padding:      '1px',
          background:   `linear-gradient(
            135deg,
            rgba(255,255,255,0.3),
            transparent 40%,
            rgba(255,255,255,0.1)
          )`,
          WebkitMask:   'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          pointerEvents: 'none',
        }}
      />

      <span style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </span>
    </button>
  )
}


