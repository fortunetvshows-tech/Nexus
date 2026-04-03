'use client'

interface MarqueeProps {
  items:    string[]
  speed?:   number   // seconds per full scroll
  reverse?: boolean
  pauseOnHover?: boolean
}

export function Marquee({
  items,
  speed = 30,
  reverse = false,
  pauseOnHover = true,
}: MarqueeProps) {
  // Duplicate items for seamless loop
  const doubled = [...items, ...items]

  return (
    <div
      style={{
        overflow:   'hidden',
        width:      '100%',
        maskImage:  'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
        WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
      }}
    >
      <div
        className={pauseOnHover ? 'group' : ''}
        style={{
          display: 'flex',
          width:   'max-content',
          animation: `${reverse ? 'marquee-reverse' : 'marquee'} ${speed}s linear infinite`,
        }}
      >
        {doubled.map((item, i) => (
          <div
            key={i}
            style={{
              display:      'flex',
              alignItems:   'center',
              gap:          '0.5rem',
              padding:      '0.4rem 1rem',
              marginRight:  '1rem',
              background:   'rgba(99,102,241,0.08)',
              border:       '1px solid rgba(99,102,241,0.2)',
              borderRadius: '9999px',
              fontSize:     '0.8rem',
              color:        '#818CF8',
              whiteSpace:   'nowrap' as const,
              fontWeight:   '500',
            }}
          >
            <span style={{ opacity: 0.6, fontSize: '0.65rem' }}>●</span>
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}


