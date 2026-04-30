'use client'

import { WorkerApp } from '@/components/WorkerApp'

export default function WorkerAppPage() {
  return (
    <div className="w-full h-screen bg-void flex items-center justify-center">
      <div className="text-center">
        <p className="text-t1 text-4xl mb-4">Loading ProofGrid...</p>
        <div className="scale-75">
          <WorkerApp />
        </div>
      </div>
    </div>
  )
}

