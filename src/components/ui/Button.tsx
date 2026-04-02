'use client'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'go' | 'stop'
  size?: 'sm' | 'md' | 'lg'
  full?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  full = false,
  className = '',
  ...props
}: ButtonProps) {
  const baseClass = 'inline-flex items-center justify-center gap-2 border-none rounded-md cursor-pointer font-bold letter-spacing-0.5 transition-all'
  
  const variantClass = {
    primary: 'bg-pi text-white shadow-glass hover:bg-pi-lt active:scale-97',
    ghost: 'bg-transparent text-t2 border border-line-md hover:bg-raised hover:text-t1 active:scale-97',
    go: 'bg-go-dim text-go border border-go hover:border-go active:scale-97',
    stop: 'bg-stop-dim text-stop border border-stop hover:border-stop active:scale-97',
  }
  
  const sizeClass = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-6 py-4 text-lg',
  }
  
  return (
    <button
      className={`${baseClass} ${variantClass[variant]} ${sizeClass[size]} ${full ? 'w-full' : ''} ${className}`}
      {...props}
    />
  )
}
