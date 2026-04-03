'use client'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glow-blue' | 'glow-green' | 'glow-amber'
  pad?: boolean
}

export function Card({
  variant = 'default',
  pad = true,
  className = '',
  children,
  ...props
}: CardProps) {
  const variantClass = {
    default: 'bg-card border border-line',
    'glow-blue': 'bg-card border border-pi-glow bg-gradient-to-br from-pi-dim to-card',
    'glow-green': 'bg-card border border-go-dim bg-gradient-to-br from-go-dim to-card',
    'glow-amber': 'bg-card border border-warn-dim bg-gradient-to-br from-warn-dim to-card',
  }

  return (
    <div
      className={`${variantClass[variant]} rounded-lg transition-all ${pad ? 'p-4' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

