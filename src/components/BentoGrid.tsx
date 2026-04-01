'use client'

import React from 'react'

interface BentoItem {
  id:        string
  children:  React.ReactNode
  colSpan?:  1 | 2 | 3
  rowSpan?:  1 | 2
  className?: string
}

interface BentoGridProps {
  items:    BentoItem[]
  columns?: 2 | 3
  gap?:     string
}

export function BentoGrid({ items, columns = 3, gap = '0.875rem' }: BentoGridProps) {
  return (
    <div
      className="bento-grid"
      style={{ gap }}
    >
      {items.map(item => (
        <div
          key={item.id}
          className={[
            'nexus-card',
            item.colSpan ? `bento-col-${item.colSpan}` : 'bento-col-1',
            item.className ?? '',
          ].join(' ')}
          style={{
            gridColumn:  item.colSpan ? `span ${item.colSpan}` : 'span 1',
            gridRow:     item.rowSpan ? `span ${item.rowSpan}` : 'span 1',
            padding:     'var(--card-padding)',
            transition:  'transform 0.2s ease, box-shadow 0.2s ease',
          }}
        >
          {item.children}
        </div>
      ))}
    </div>
  )
}

