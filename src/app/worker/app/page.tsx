'use client'

import { Suspense } from 'react'
import { WorkerApp } from '@/components/WorkerApp'

export default function WorkerAppPage() {
  return (
    <Suspense fallback={
      <div style={{ width: '100%', height: '100vh', backgroundColor: '#07090E', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EEF2FF' }}>
        <p>Loading ProofGrid...</p>
      </div>
    }>
      <WorkerApp />
    </Suspense>
  )
}

