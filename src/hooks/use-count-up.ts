'use client'

import { useState, useEffect, useRef } from 'react'

export function useCountUp(
  target:   number,
  duration: number = 1200,
  decimals: number = 4,
): string {
  const [current, setCurrent] = useState(0)
  const startRef  = useRef<number | null>(null)
  const frameRef  = useRef<number>(0)

  useEffect(() => {
    if (target === 0) {
      setCurrent(0)
      return
    }

    startRef.current = null

    const animate = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp
      const elapsed  = timestamp - startRef.current
      const progress = Math.min(elapsed / duration, 1)

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setCurrent(eased * target)

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate)
      } else {
        setCurrent(target)
      }
    }

    frameRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frameRef.current)
  }, [target, duration])

  return current.toFixed(decimals)
}

