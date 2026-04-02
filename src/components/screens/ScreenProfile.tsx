'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/context/AppContext'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'

const BADGES = [
  { id: 1, name: 'First Task', icon: '🌟', unlocked: true, progress: 100 },
  { id: 2, name: '10 Tasks', icon: '⚡', unlocked: true, progress: 100 },
  { id: 3, name: '7 Day Streak', icon: '🔥', unlocked: true, progress: 100 },
  { id: 4, name: '50 Tasks', icon: '🏆', unlocked: false, progress: 48 },
  { id: 5, name: 'Lv 4 Rep', icon: '👑', unlocked: false, progress: 85 },
  { id: 6, name: 'Expert Writer', icon: '✍️', unlocked: false, progress: 45 },
]

const SKILLS = [
  { id: 1, name: 'Writing', level: 4, completed: 8, progress: 65 },
  { id: 2, name: 'Data Research', level: 2, completed: 4, progress: 30 },
  { id: 3, name: 'Design', level: 3, completed: 6, progress: 45 },
]

export function ScreenProfile() {
  const { showToast } = useApp()
  const [avatarAnimating, setAvatarAnimating] = useState(true)
  const [repScore] = useState(4287)

  const handleEditProfile = () => {
    showToast('Profile editing coming soon', 'inf')
  }

  const handleViewBadges = () => {
    showToast('Badge collection loaded', 'ok')
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-void">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-void/95 backdrop-blur px-4 py-3 border-b border-line">
        <h1 className="text-lg font-bold text-t1">Profile</h1>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto pb-32">
        {/* Profile Hero */}
        <div className="px-4 pt-6 pb-4">
          <div className="text-center mb-4">
            {/* Avatar with SVG Ring */}
            <div className="flex justify-center mb-4">
              <div className="relative w-24 h-24">
                {/* SVG Circle - Rep Ring */}
                <svg
                  className="absolute inset-0 w-full h-full"
                  viewBox="0 0 120 120"
                  style={{ transform: 'rotate(-90deg)' }}
                >
                  {/* Background */}
                  <circle
                    cx="60"
                    cy="60"
                    r="55"
                    stroke="#0F1119"
                    strokeWidth="3"
                    fill="none"
                  />
                  {/* Progress Arc */}
                  <circle
                    cx="60"
                    cy="60"
                    r="55"
                    stroke="url(#gradient)"
                    strokeWidth="3"
                    fill="none"
                    strokeDasharray="345"
                    strokeDashoffset={345 - (repScore / 5000) * 345}
                    strokeLinecap="round"
                    style={{
                      transition: 'stroke-dashoffset 1s ease-out',
                    }}
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#0095FF" />
                      <stop offset="100%" stopColor="#38B2FF" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Avatar Emoji */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-5xl">⛏️</span>
                </div>
              </div>
            </div>

            {/* Name & Handle */}
            <h2 className="text-2xl font-bold text-t1 mb-1">You</h2>
            <p className="text-sm text-t3 mb-4">@worker.pi</p>

            {/* Profile Badges */}
            <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
              <Chip variant="blue">Lv 4</Chip>
              <Chip variant="green">KYC 2</Chip>
              <Chip variant="amber">Active</Chip>
            </div>

            {/* Edit Profile Button */}
            <Button variant="ghost" className="w-full" onClick={handleEditProfile}>
              Edit Profile
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="px-4 pb-4">
          <div className="grid grid-cols-3 gap-2">
            <Card className="p-3 text-center">
              <p className="text-lg font-bold text-pi">24</p>
              <p className="text-xs text-t3 mt-1">Tasks Done</p>
            </Card>
            <Card className="p-3 text-center">
              <p className="text-lg font-bold text-go">142.5π</p>
              <p className="text-xs text-t3 mt-1">Earned</p>
            </Card>
            <Card className="p-3 text-center">
              <p className="text-lg font-bold text-warn">7</p>
              <p className="text-xs text-t3 mt-1">Day Streak</p>
            </Card>
          </div>
        </div>

        {/* Next Level Progress */}
        <div className="px-4 pb-4">
          <p className="text-xs text-t3 uppercase tracking-wider mb-2">Next Level</p>
          <Card className="p-4 bg-gradient-to-br from-pulse/10 to-pulse/5 border border-pulse/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-t1">Level 5</span>
              <span className="text-xs font-bold text-pulse">4,287 / 5,000 Rep</span>
            </div>
            <div className="bg-surface rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-pulse to-pulse/60 h-full transition-all duration-500"
                style={{ width: '85.74%' }}
              />
            </div>
            <p className="text-xs text-t2 mt-2">
              Complete 3 more high-quality tasks to reach Level 5! 🎯
            </p>
          </Card>
        </div>

        {/* Badges Grid */}
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-t3 uppercase tracking-wider">Achievement Badges</p>
            <Button variant="ghost" size="sm" onClick={handleViewBadges}>
              View all →
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {BADGES.map(badge => (
              <Card
                key={badge.id}
                className={`p-3 text-center transition-all ${
                  badge.unlocked
                    ? 'bg-gradient-to-br from-go/10 to-go/5'
                    : 'bg-surface opacity-60'
                }`}
              >
                <div className={`text-3xl mb-1 transition-transform ${
                  badge.unlocked ? 'scale-100' : 'scale-75 opacity-50'
                }`}>
                  {badge.icon}
                </div>
                <p className={`text-xs font-semibold ${
                  badge.unlocked ? 'text-t1' : 'text-t4'
                }`}>
                  {badge.name}
                </p>
                {!badge.unlocked && (
                  <p className="text-xs text-t4 mt-1">{badge.progress}%</p>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* Skills Breakdown */}
        <div className="px-4 pb-4">
          <p className="text-xs text-t3 uppercase tracking-wider mb-3">Skills</p>

          <div className="space-y-3">
            {SKILLS.map(skill => (
              <Card key={skill.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-t1">{skill.name}</p>
                    <p className="text-xs text-t3">
                      Level {skill.level} • {skill.completed} tasks
                    </p>
                  </div>
                  <span className="text-xs font-bold text-pi-lt">
                    {skill.progress}%
                  </span>
                </div>
                <div className="bg-surface rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-go to-go/60 h-full transition-all duration-500"
                    style={{ width: `${skill.progress}%` }}
                  />
                </div>
              </Card>
            ))}
          </div>

          <Button variant="ghost" className="w-full mt-3">
            Add More Skills
          </Button>
        </div>

        {/* Account Actions */}
        <div className="px-4 pb-4">
          <Card className="p-3">
            <Button variant="ghost" className="w-full text-left justify-start">
              ⚙️ Settings
            </Button>
            <Button variant="ghost" className="w-full text-left justify-start mt-1">
              📄 Terms & Privacy
            </Button>
            <Button variant="ghost" className="w-full text-left justify-start mt-1">
              🆘 Support
            </Button>
          </Card>
        </div>

        <div className="h-8" />
      </div>
    </div>
  )
}
