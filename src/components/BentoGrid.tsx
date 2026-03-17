'use client'

import React from 'react'

interface BentoItem {
  id:        string
  children:  React.ReactNode
  colSpan?:  1 | 2 | 3      // default 1
  rowSpan?:  1 | 2           // default 1
  className?: string
}

interface BentoGridProps {
  items:    BentoItem[]
  columns?: 2 | 3            // default 3
  gap?:     string           // default '1rem'
}

export function BentoGrid({ items, columns = 3, gap = '1rem' }: BentoGridProps) {
  return (
    <div style={{
      display:             'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap,
      width:               '100%',
    }}>
      {items.map(item => (
        <div
          key={item.id}
          className={`nexus-card ${item.className ?? ''}`}
          style={{
            gridColumn: item.colSpan ? `span ${item.colSpan}` : 'span 1',
            gridRow:    item.rowSpan ? `span ${item.rowSpan}` : 'span 1',
            padding:    '1.25rem',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          }}
        >
          {item.children}
        </div>
      ))}
    </div>
  )
}
