'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/context/AppContext'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'

export function ScreenDashboard() {
  const { currentScreen, navigate, showToast } = useApp()
  const [stats, setStats] = useState({
    repScore: 0,
    streak: 0,
    tasksCompleted: 0,
    earned: 0,
  })
  const [animating, setAnimating] = useState(false)
  const [activeTask, setActiveTask] = useState({
    title: 'Write Product Review',
    status: 'in-progress',
    timeLeft: '2h 14m',
    progress: 65,
  })

  // Animate stats on mount
  useEffect(() => {
    if (currentScreen === 'dashboard' && !animating) {
      setAnimating(true)
      // Count up animation for each stat
      const startRep = 0
      const endRep = 4287
      const startTasks = 0
      const endTasks = 24
      const startEarned = 0
      const endEarned = 142.50

      const duration = 800 // ms
      const steps = 30
      const stepDuration = duration / steps

      for (let i = 0; i <= steps; i++) {
        setTimeout(() => {
          const progress = i / steps
          setStats({
            repScore: Math.floor(startRep + (endRep - startRep) * progress),
            streak: 7,
            tasksCompleted: Math.floor(startTasks + (endTasks - startTasks) * progress),
            earned: Number(
              (startEarned + (endEarned - startEarned) * progress).toFixed(2)
            ),
          })
        }, stepDuration * i)
      }
    }
  }, [currentScreen, animating])

  const openTaskDetail = (taskId: string) => {
    // In real app, would pass taskId via context
    showToast('Loading task...', 'inf')
    navigate('slot')
  }

  const hotTasks = [
    {
      id: '1',
      title: 'Beta Test Mobile App',
      bounty: '+2.5π',
      urgency: 'HOT',
      time: '4h left',
    },
    {
      id: '2',
      title: 'Survey response - AI usage',
      bounty: '+0.8π',
      urgency: 'CLOSING',
      time: '2h left',
    },
    {
      id: '3',
      title: 'Screenshot proof upload',
      bounty: '+1.2π',
      urgency: 'NEW',
      time: 'Just posted',
    },
  ]

  return (
    <div className="fixed inset-0 flex flex-col bg-void">
      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto pb-32">
        {/* Header with Greeting */}
        <div className="px-4 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-t1">Welcome back!</h1>
              <p className="text-sm text-t3">You're on a 🔥 streak</p>
            </div>
            <div className="text-3xl">⛏️</div>
          </div>
        </div>

        {/* Rep Ring & Streak Section */}
        <div className="px-4 pb-6">
          <div className="grid grid-cols-2 gap-4">
            {/* Rep Score Card with SVG Animation */}
            <Card variant="glow-blue" className="p-4 flex flex-col items-center justify-center">
              <div className="relative w-20 h-20 mb-2">
                {/* SVG Circle Progress - Rep Score */}
                <svg
                  className="absolute inset-0 w-full h-full"
                  viewBox="0 0 120 120"
                  style={{ transform: 'rotate(-90deg)' }}
                >
                  {/* Background circle */}
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    stroke="#0F1119"
                    strokeWidth="8"
                    fill="none"
                  />
                  {/* Progress circle - animates on mount */}
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    stroke="#0095FF"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray="314"
                    strokeDashoffset={314 - (stats.repScore / 5000) * 314}
                    strokeLinecap="round"
                    style={{
                      transition: 'stroke-dashoffset 300ms ease-out',
                    }}
                  />
                </svg>
                {/* Rep number in center */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-pi-lt">
                    {stats.repScore}
                  </span>
                </div>
              </div>
              <p className="text-xs text-t3 text-center">
                Rep Score
              </p>
              <p className="text-xs text-t2 mt-1">Lv 4</p>
            </Card>

            {/* Streak Card with Flame Animation */}
            <Card variant="glow-amber" className="p-4 flex flex-col items-center justify-center">
              <div className="text-4xl mb-2 animate-bounce" style={{
                animation: 'flame-flick 0.6s infinite',
              }}>
                🔥
              </div>
              <p className="text-2xl font-bold text-warn">{stats.streak}</p>
              <p className="text-xs text-t3 text-center mt-1">Day Streak</p>
            </Card>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="px-4 pb-6">
          <div className="grid grid-cols-2 gap-4">
            {/* Tasks Completed */}
            <Card className="p-4">
              <p className="text-xs text-t3 mb-2">Tasks Completed</p>
              <p className="text-2xl font-bold text-t1">{stats.tasksCompleted}</p>
              <p className="text-xs text-t4 mt-1">+3 this week</p>
            </Card>

            {/* Total Earned */}
            <Card className="p-4">
              <p className="text-xs text-t3 mb-2">Total Earned</p>
              <p className="text-2xl font-bold text-go">{stats.earned.toFixed(2)}π</p>
              <p className="text-xs text-t4 mt-1">Next level: 200π</p>
            </Card>
          </div>
        </div>

        {/* Active Task Card */}
        <div className="px-4 pb-6">
          <p className="text-xs text-t3 mb-3 uppercase tracking-wider">Active Now</p>
          <Card variant="glow-green" className="p-4">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-sm font-semibold text-t1 flex-1">
                {activeTask.title}
              </h3>
              <Chip variant="green">IN PROGRESS</Chip>
            </div>

            {/* Progress Bar */}
            <div className="mb-3">
              <div className="bg-surface rounded-full h-2 overflow-hidden">
                <div
                  className="bg-go h-full transition-all duration-500"
                  style={{ width: `${activeTask.progress}%` }}
                />
              </div>
              <p className="text-xs text-t3 mt-1">
                {activeTask.progress}% • {activeTask.timeLeft} remaining
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              className="w-full"
              onClick={() => openTaskDetail('active')}
            >
              Continue
            </Button>
          </Card>
        </div>

        {/* Hot Tasks Section */}
        <div className="px-4 pb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-t3 uppercase tracking-wider">🔥 Hot Tasks</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('discover')}
            >
              See all →
            </Button>
          </div>

          <div className="space-y-3">
            {hotTasks.map((task) => (
              <Card
                key={task.id}
                className="p-3 cursor-pointer hover:bg-card-h transition-colors"
                onClick={() => openTaskDetail(task.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-sm font-medium text-t1 flex-1">
                    {task.title}
                  </h4>
                  <p className="text-xs font-bold text-go ml-2">{task.bounty}</p>
                </div>
                <div className="flex items-center gap-2">
                  {task.urgency === 'HOT' && (
                    <Chip variant="amber" className="text-xs">
                      🔥 {task.urgency}
                    </Chip>
                  )}
                  {task.urgency === 'CLOSING' && (
                    <Chip variant="red" className="text-xs">
                      ⚠️ {task.urgency}
                    </Chip>
                  )}
                  {task.urgency === 'NEW' && (
                    <Chip variant="pulse" className="text-xs">
                      ✨ {task.urgency}
                    </Chip>
                  )}
                  <p className="text-xs text-t4 ml-auto">{task.time}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Spacer for bottom nav */}
        <div className="h-8" />
      </div>

      {/* Flame flick animation */}
      <style>{`
        @keyframes flame-flick {
          0%, 100% { transform: scale(1) rotate(0deg); }
          25% { transform: scale(1.1) rotate(2deg); }
          50% { transform: scale(0.95) rotate(-1deg); }
          75% { transform: scale(1.05) rotate(1deg); }
        }
      `}</style>
    </div>
  )
}

