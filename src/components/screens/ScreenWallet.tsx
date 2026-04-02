'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/context/AppContext'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'

const TRANSACTIONS = [
  {
    id: 1,
    type: 'payout',
    title: 'Task Completed: Product Review',
    amount: '+1.2π',
    date: 'Today 2:45 PM',
    icon: '✓',
    status: 'approved',
  },
  {
    id: 2,
    type: 'escrow',
    title: 'Escrow Lock: Screenshot Tasks',
    amount: '−0.8π',
    date: 'Today 1:12 PM',
    icon: '🔒',
    status: 'locked',
  },
  {
    id: 3,
    type: 'payout',
    title: 'Slot Claimed: Survey Response',
    amount: '+0.5π',
    date: 'Mar 31 3:00 PM',
    icon: '✓',
    status: 'approved',
  },
  {
    id: 4,
    type: 'refund',
    title: 'Escrow Released: Mobile Testing',
    amount: '+2.1π',
    date: 'Mar 30 11:22 AM',
    icon: '↩️',
    status: 'released',
  },
  {
    id: 5,
    type: 'payout',
    title: 'Task Completed: Design Graphics',
    amount: '+2.5π',
    date: 'Mar 29 9:15 AM',
    icon: '✓',
    status: 'approved',
  },
]

const WEEKLY_EARNINGS = [
  { day: 'Mon', amount: 0.8 },
  { day: 'Tue', amount: 1.5 },
  { day: 'Wed', amount: 0.3 },
  { day: 'Thu', amount: 2.1 },
  { day: 'Fri', amount: 1.2 },
  { day: 'Sat', amount: 0.0 },
  { day: 'Sun', amount: 0.6 },
]

export function ScreenWallet() {
  const { navigate } = useApp()
  const [balance, setBalance] = useState(0)
  const [balanceAnimating, setBalanceAnimating] = useState(true)
  const [chartBars, setChartBars] = useState<{ day: string; height: number }[]>([])

  // Animate balance count-up
  useEffect(() => {
    if (balanceAnimating) {
      const target = 142.5
      const steps = 30
      const stepValue = target / steps

      for (let i = 0; i <= steps; i++) {
        setTimeout(() => {
          setBalance(Number((stepValue * i).toFixed(2)))
        }, (1000 / steps) * i)
      }
    }
  }, [balanceAnimating])

  // Animate chart bars
  useEffect(() => {
    const maxAmount = Math.max(...WEEKLY_EARNINGS.map(d => d.amount)) || 1
    const bars = WEEKLY_EARNINGS.map((d, idx) => ({
      day: d.day,
      height: (d.amount / maxAmount) * 100,
    }))

    bars.forEach((bar, idx) => {
      setTimeout(() => {
        setChartBars(prev => [...prev, bar])
      }, idx * 60)
    })
  }, [])

  return (
    <div className="fixed inset-0 flex flex-col bg-void">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-void/95 backdrop-blur px-4 py-3 border-b border-line">
        <h1 className="text-lg font-bold text-t1">Wallet</h1>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto pb-32">
        {/* Balance Hero Card */}
        <div className="px-4 pt-4 pb-3">
          <Card
            variant="glow-blue"
            className="p-6 bg-gradient-to-br from-pi/20 to-pi-lt/10 text-center"
          >
            <p className="text-xs text-t3 mb-1">Total Balance</p>
            <div className="text-4xl font-bold text-pi-lt mb-1">
              {balance.toFixed(2)}π
            </div>
            <p className="text-xs text-t2 mb-4">
              Ready to cash out
            </p>
            <Button variant="primary" className="w-full">
              Cash Out
            </Button>
          </Card>
        </div>

        {/* Status Trio */}
        <div className="px-4 py-3">
          <div className="grid grid-cols-3 gap-2">
            {/* Locked Escrow */}
            <Card className="p-3 text-center">
              <p className="text-xs text-t3 mb-1">Locked</p>
              <p className="text-lg font-bold text-warn">2.1π</p>
              <p className="text-xs text-t4 mt-1">In Escrow</p>
            </Card>

            {/* Pending Review */}
            <Card className="p-3 text-center">
              <p className="text-xs text-t3 mb-1">Pending</p>
              <p className="text-lg font-bold text-amber-400">0.8π</p>
              <p className="text-xs text-t4 mt-1">Under Review</p>
            </Card>

            {/* Earning Rate */}
            <Card className="p-3 text-center bg-go/5 border border-go/20">
              <p className="text-xs text-t3 mb-1">Weekly</p>
              <p className="text-lg font-bold text-go">+8.2π</p>
              <p className="text-xs text-t4 mt-1">Avg Rate</p>
            </Card>
          </div>
        </div>

        {/* Escrow Status Bar */}
        <div className="px-4 py-3">
          <p className="text-xs text-t3 uppercase tracking-wider mb-2">Escrow Status</p>
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-t1 font-semibold">Locked Amount</span>
              <span className="text-sm font-bold text-warn">2.1π</span>
            </div>
            <div className="bg-surface rounded-full h-3 overflow-hidden mb-2">
              <div
                className="bg-warn h-full transition-all duration-500"
                style={{ width: '35%' }}
              />
            </div>
            <p className="text-xs text-t3">
              Released when employer approves your work (usually 24-48 hours)
            </p>
          </Card>
        </div>

        {/* Weekly Earnings Chart */}
        <div className="px-4 py-3">
          <p className="text-xs text-t3 uppercase tracking-wider mb-3">This Week</p>
          <Card className="p-4">
            <div className="flex items-flex-end justify-around h-32 gap-1">
              {WEEKLY_EARNINGS.map((day, idx) => {
                const animated = chartBars.find(b => b.day === day.day)
                const height = animated?.height || 0

                return (
                  <div key={day.day} className="flex flex-col items-center gap-1 flex-1">
                    <div className="w-full bg-surface rounded-sm relative overflow-hidden h-24 flex items-flex-end justify-center">
                      <div
                        className="w-full bg-gradient-to-t from-go to-go/60 rounded-sm transition-all duration-500"
                        style={{ height: `${height}%`, minHeight: height > 0 ? '4px' : '0' }}
                      />
                    </div>
                    <span className="text-xs text-t4 mt-1">{day.day}</span>
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-t2 mt-3 text-center font-semibold">
              Total This Week: 8.2π
            </p>
          </Card>
        </div>

        {/* Transaction History */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-t3 uppercase tracking-wider">Recent Transactions</p>
            <Button variant="ghost" size="sm" onClick={() => navigate('profile')}>
              View all →
            </Button>
          </div>

          <div className="space-y-2">
            {TRANSACTIONS.map(tx => (
              <Card key={tx.id} className="p-3 hover:bg-card-h transition-colors cursor-pointer">
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${
                      tx.status === 'approved'
                        ? 'bg-go/10 text-go'
                        : tx.status === 'locked'
                        ? 'bg-warn/10 text-warn'
                        : 'bg-pulse/10 text-pulse'
                    }`}
                  >
                    {tx.icon}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-t1 truncate">{tx.title}</p>
                    <p className="text-xs text-t4">{tx.date}</p>
                  </div>

                  {/* Amount */}
                  <p
                    className={`text-sm font-bold flex-shrink-0 ${
                      tx.type === 'payout' || tx.type === 'refund'
                        ? 'text-go'
                        : 'text-warn'
                    }`}
                  >
                    {tx.amount}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="h-8" />
      </div>
    </div>
  )
}
