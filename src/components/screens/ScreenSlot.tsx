'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/context/AppContext'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'

const SLOT_TASK = {
  id: 'task-001',
  title: 'Write 500-word product review for Pi Network',
  description: 'Please write an honest, detailed review of your experience with the Pi Network ecosystem. Focus on usability, community, and future potential.',
  employer: {
    name: 'Pi Ecosystem Research',
    handle: '@piresearch',
  },
  bounty: '1.2π',
  deadline: '2 days',
  requirements: ['Min 500 words', 'Original content', 'No profanity', 'Submit by deadline'],
  category: 'Writing',
  difficulty: 'Easy',
  tags: ['Writing', 'Pi Network', 'Review'],
}

const SLOTS = [
  { id: 1, status: 'taken', worker: 'User123' },
  { id: 2, status: 'open', worker: null },
  { id: 3, status: 'mine', worker: 'You' },
  { id: 4, status: 'open', worker: null },
  { id: 5, status: 'taken', worker: 'Worker456' },
]

export function ScreenSlot() {
  const { navigate, showToast, slotClaimed, fileUploaded } = useApp()
  const [countdownMs, setCountdownMs] = useState(120000) // 120 seconds pre-claim
  const [workTimerMs, setWorkTimerMs] = useState(7200000) // 2 hours post-claim
  const [checklist, setChecklist] = useState([
    { id: 1, text: 'Task instructions understood', done: false },
    { id: 2, text: 'Content meets requirements', done: false },
    { id: 3, text: 'Quality check passed', done: false },
    { id: 4, text: 'Screenshot proof ready', done: false },
    { id: 5, text: 'Ready to submit', done: false },
  ])
  const [isClaimed, setIsClaimed] = useState(slotClaimed || false)

  // Pre-claim countdown timer (120 seconds)
  useEffect(() => {
    if (!isClaimed && countdownMs > 0) {
      const interval = setInterval(() => {
        setCountdownMs(prev => Math.max(0, prev - 1000))
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [isClaimed, countdownMs])

  // Post-claim work timer (2 hours)
  useEffect(() => {
    if (isClaimed && workTimerMs > 0) {
      const interval = setInterval(() => {
        setWorkTimerMs(prev => Math.max(0, prev - 1000))
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [isClaimed, workTimerMs])

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleClaimSlot = () => {
    setIsClaimed(true)
    showToast('Slot claimed! ✓ You have 2 hours to complete', 'ok')
  }

  const handleToggleChecklistItem = (id: number) => {
    setChecklist(prev =>
      prev.map(item => (item.id === id ? { ...item, done: !item.done } : item))
    )
  }

  const handleSubmit = () => {
    const allChecked = checklist.every(item => item.done)
    if (!allChecked) {
      showToast('Complete all checklist items first', 'err')
      return
    }
    showToast('Proof submitted! Moving to review...', 'ok')
    navigate('proof')
  }

  const slotCirclePercent = isClaimed ? (workTimerMs / 7200000) * 100 : 0

  return (
    <div className="fixed inset-0 flex flex-col bg-void">
      {/* Header with Back Button */}
      <div className="sticky top-0 z-40 bg-void/95 backdrop-blur px-4 py-3 border-b border-line flex items-center gap-3">
        <button
          onClick={() => navigate('discover')}
          className="text-xl text-t2 hover:text-t1 transition-colors"
        >
          ←
        </button>
        <h1 className="text-lg font-bold text-t1 flex-1">Slot Details</h1>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto pb-32">
        {/* Task Detail Card */}
        <div className="px-4 pt-4 pb-3">
          <Card variant="glow-blue" className="p-4">
            <div className="flex items-start justify-between mb-2">
              <h2 className="text-sm font-bold text-t1 flex-1">{SLOT_TASK.title}</h2>
              <p className="text-xs font-bold text-go ml-2">{SLOT_TASK.bounty}</p>
            </div>
            <p className="text-xs text-t2 mb-3">{SLOT_TASK.description}</p>

            <div className="flex items-center gap-2 mb-3">
              <Chip variant="blue" className="text-xs">
                {SLOT_TASK.difficulty}
              </Chip>
              <Chip variant="grey" className="text-xs">
                {SLOT_TASK.category}
              </Chip>
            </div>

            <div className="text-xs text-t3 space-y-1">
              <p>👤 {SLOT_TASK.employer.name}</p>
              <p>⏱ {SLOT_TASK.deadline} to complete</p>
            </div>
          </Card>
        </div>

        {/* Slot Grid */}
        <div className="px-4 py-3">
          <p className="text-xs text-t3 uppercase tracking-wider mb-2">5 Slots Available</p>
          <div className="grid grid-cols-5 gap-2">
            {SLOTS.map(slot => (
              <div
                key={slot.id}
                className={`aspect-square rounded-lg border-2 flex items-center justify-center font-bold text-xs transition-all ${
                  slot.status === 'taken'
                    ? 'border-line bg-surface text-t4'
                    : slot.status === 'mine'
                    ? 'border-go bg-go/10 text-go'
                    : 'border-pi bg-pi/10 text-pi'
                }`}
              >
                {slot.status === 'taken' && '✓'}
                {slot.status === 'mine' && '👤'}
                {slot.status === 'open' && 'Open'}
              </div>
            ))}
          </div>
        </div>

        {/* Timer Section - Changes based on claim status */}
        <div className="px-4 py-3">
          {!isClaimed ? (
            <>
              {/* Pre-Claim Countdown */}
              <p className="text-xs text-t3 uppercase tracking-wider mb-2">⏱ Claim Countdown</p>
              <Card variant="glow-amber" className="p-4 text-center">
                <div className="relative w-24 h-24 mx-auto mb-3">
                  {/* SVG Circle - Countdown Arc */}
                  <svg
                    className="absolute inset-0 w-full h-full"
                    viewBox="0 0 120 120"
                    style={{ transform: 'rotate(-90deg)' }}
                  >
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      stroke="#0F1119"
                      strokeWidth="6"
                      fill="none"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      stroke="#FFB020"
                      strokeWidth="6"
                      fill="none"
                      strokeDasharray="314"
                      strokeDashoffset={314 - (countdownMs / 120000) * 314}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 1s linear' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-sm text-t3">Time left</p>
                    <p className="text-2xl font-bold text-warn">
                      {formatTime(countdownMs)}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-t2 mb-3">Slots fill fast! Claim before countdown ends.</p>
                <Button variant="primary" className="w-full" onClick={handleClaimSlot}>
                  🎯 Claim Slot
                </Button>
              </Card>
            </>
          ) : (
            <>
              {/* Post-Claim Work Timer */}
              <p className="text-xs text-t3 uppercase tracking-wider mb-2">⏱ Time Remaining</p>
              <Card variant="glow-green" className="p-4 text-center">
                <div className="relative w-24 h-24 mx-auto mb-3">
                  {/* SVG Circle - Work Timer Arc */}
                  <svg
                    className="absolute inset-0 w-full h-full"
                    viewBox="0 0 120 120"
                    style={{ transform: 'rotate(-90deg)' }}
                  >
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      stroke="#0F1119"
                      strokeWidth="6"
                      fill="none"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      stroke="#00D68F"
                      strokeWidth="6"
                      fill="none"
                      strokeDasharray="314"
                      strokeDashoffset={314 - slotCirclePercent * 3.14}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 1s linear' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-sm text-t3">2 hours</p>
                    <p className="text-2xl font-bold text-go">
                      {formatTime(workTimerMs)}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-t2">Complete within 2 hours to maximize reputation</p>
              </Card>
            </>
          )}
        </div>

        {/* Requirements Checklist */}
        {isClaimed && (
          <div className="px-4 py-3">
            <p className="text-xs text-t3 uppercase tracking-wider mb-2">✓ Checklist</p>
            <Card className="p-0 overflow-hidden">
              {checklist.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => handleToggleChecklistItem(item.id)}
                  className={`w-full px-4 py-3 flex items-center gap-3 border-b border-line last:border-b-0 hover:bg-card-h transition-colors text-left ${
                    item.done ? 'bg-go/5' : ''
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      item.done ? 'bg-go border-go text-void' : 'border-line'
                    }`}
                  >
                    {item.done && '✓'}
                  </div>
                  <span
                    className={`text-sm ${item.done ? 'text-t3 line-through' : 'text-t1'}`}
                  >
                    {item.text}
                  </span>
                </button>
              ))}
            </Card>
          </div>
        )}

        {/* Submit Button */}
        {isClaimed && (
          <div className="px-4 py-4">
            <Button
              variant="go"
              className="w-full"
              onClick={handleSubmit}
            >
              Continue to Proof Submission
            </Button>
          </div>
        )}

        <div className="h-8" />
      </div>
    </div>
  )
}
