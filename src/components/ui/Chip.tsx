'use client'

interface ChipProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'blue' | 'green' | 'amber' | 'red' | 'pulse' | 'grey'
}

export function Chip({ variant = 'blue', className = '', ...props }: ChipProps) {
  const variantClass = {
    blue: 'bg-pi-dim text-pi-lt border-pi-glow',
    green: 'bg-go-dim text-go border-go-dim',
    amber: 'bg-warn-dim text-warn border-warn-dim',
    red: 'bg-stop-dim text-stop border-stop-dim',
    pulse: 'bg-pulse-dim text-pulse border-pulse-dim',
    grey: 'bg-surface text-t2 border-line',
  }

  return (
    <div
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-pill border text-xs font-bold uppercase letter-spacing-0.5 whitespace-nowrap ${variantClass[variant]} ${className}`}
      {...props}
    />
  )
}
