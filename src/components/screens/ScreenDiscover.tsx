'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/context/AppContext'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'

const CATEGORIES = [
  'Data Entry',
  'Web Research',
  'Writing',
  'Design',
  'Photography',
  'Tech',
  'Local',
  'Audio',
]

const FEATURED_TASK = {
  id: 'featured-001',
  title: 'β Beta Test: New Mobile Dashboard',
  description: 'Test the updated mobile interface and report UX issues',
  bounty: '3.5π',
  difficulty: 'Easy',
  slots: '5 available',
  tags: ['Tech', 'Testing', 'NEW'],
  background: 'from-pi/20 to-pi-lt/10',
}

const SAMPLE_TASKS = [
  {
    id: 'task-001',
    title: 'Write 500-word product review',
    bounty: '+1.2π',
    difficulty: 'Easy',
    category: 'Writing',
    slots: '2/5',
    time: '2 days',
  },
  {
    id: 'task-002',
    title: 'Screenshot proof upload - Pi ecosystem',
    bounty: '+0.8π',
    difficulty: 'Easy',
    category: 'Data Entry',
    slots: '1/3',
    time: '1 day',
  },
  {
    id: 'task-003',
    title: 'Research blockchain adoption trends',
    bounty: '+2.1π',
    difficulty: 'Medium',
    category: 'Web Research',
    slots: '3/4',
    time: '3 days',
  },
  {
    id: 'task-004',
    title: 'Design social media graphics',
    bounty: '+2.5π',
    difficulty: 'Medium',
    category: 'Design',
    slots: '1/2',
    time: '4 days',
  },
  {
    id: 'task-005',
    title: 'Record product demo voice-over',
    bounty: '+1.8π',
    difficulty: 'Medium',
    category: 'Audio',
    slots: '2/3',
    time: '2 days',
  },
]

export function ScreenDiscover() {
  const { navigate, showToast } = useApp()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [tasks, setTasks] = useState(SAMPLE_TASKS)

  // Filter tasks based on search + categories
  useEffect(() => {
    let filtered = SAMPLE_TASKS

    if (searchQuery.trim()) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (selectedCategories.length > 0) {
      filtered = filtered.filter(task =>
        selectedCategories.includes(task.category)
      )
    }

    setTasks(filtered)
  }, [searchQuery, selectedCategories])

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const claimTask = (taskId: string, taskTitle: string) => {
    showToast(`Claimed: ${taskTitle}`, 'ok')
    navigate('slot')
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-void">
      {/* Search Header */}
      <div className="sticky top-0 z-40 bg-void/95 backdrop-blur px-4 pt-4 pb-3 border-b border-line">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-surface text-t1 placeholder-t3 border border-line focus:outline-none focus:border-pi text-sm focus:ring-1 focus:ring-pi/30"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-t3">🔍</span>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map(category => (
            <button
              key={category}
              onClick={() => toggleCategory(category)}
              className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium transition-all ${
                selectedCategories.includes(category)
                  ? 'bg-pi text-void'
                  : 'bg-surface text-t2 border border-line'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        {/* Featured Task */}
        <div className="px-4 pt-4 pb-3">
          <p className="text-xs text-t3 uppercase tracking-wider mb-2">✨ Featured</p>
          <Card
            variant="glow-blue"
            className={`p-4 bg-gradient-to-br ${FEATURED_TASK.background} cursor-pointer hover:shadow-lg transition-shadow`}
            onClick={() => claimTask(FEATURED_TASK.id, FEATURED_TASK.title)}
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-sm font-bold text-t1 flex-1">
                {FEATURED_TASK.title}
              </h3>
              <p className="text-xs font-bold text-pi-lt ml-2">{FEATURED_TASK.bounty}</p>
            </div>
            <p className="text-xs text-t2 mb-2">{FEATURED_TASK.description}</p>
            <div className="flex flex-wrap gap-1 mb-3">
              {FEATURED_TASK.tags.map(tag => (
                <Chip key={tag} variant="blue" className="text-xs">
                  {tag}
                </Chip>
              ))}
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-t3">{FEATURED_TASK.slots}</span>
              <Button variant="primary" size="sm">Claim Now</Button>
            </div>
          </Card>
        </div>

        {/* Task List */}
        <div className="px-4 pb-32">
          <p className="text-xs text-t3 uppercase tracking-wider mb-3">
            {tasks.length} Available
          </p>

          {tasks.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-t3 text-sm">No tasks match your filters</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-3"
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategories([])
                }}
              >
                Clear filters
              </Button>
            </Card>
          ) : (
            <div className="space-y-2">
              {tasks.map(task => (
                <Card
                  key={task.id}
                  className="p-3 cursor-pointer hover:bg-card-h transition-colors"
                  onClick={() => claimTask(task.id, task.title)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-sm font-medium text-t1 flex-1">{task.title}</h4>
                    <p className="text-xs font-bold text-go ml-2">{task.bounty}</p>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <Chip
                      variant={task.difficulty === 'Easy' ? 'blue' : 'amber'}
                      className="text-xs"
                    >
                      {task.difficulty}
                    </Chip>
                    <span className="text-xs text-t4">{task.category}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-t3">
                    <span>{task.slots}</span>
                    <span>⏱ {task.time}</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
