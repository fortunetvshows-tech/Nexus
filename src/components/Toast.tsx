'use client'

import { useApp } from '@/context/AppContext'

export function Toast() {
  const { toastMessage, toastType } = useApp()

  const typeClass = {
    ok: 'border-go text-go',
    err: 'border-stop text-stop',
    inf: 'border-pi-lt text-pi-lt',
    null: '',
  }

  if (!toastMessage) return null

  return (
    <div
      className={`fixed top-5 left-1/2 z-50 transform -translate-x-1/2 transition-all duration-300
        ${toastMessage ? 'translate-y-0 opacity-100' : '-translate-y-20 opacity-0'}
        bg-raised border rounded-pill px-6 py-2 text-sm font-bold whitespace-nowrap shadow-glass ${typeClass[toastType || 'null']}`}
    >
      {toastMessage}
    </div>
  )
}

