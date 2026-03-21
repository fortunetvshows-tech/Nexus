'use client'

import { useEffect, useState } from 'react'
import { usePiAuth }   from '@/hooks/use-pi-auth'
import { Navigation }  from '@/components/Navigation'
import {
  COLORS, FONTS, RADII, SPACING
} from '@/lib/design/tokens'

interface Category {
  id:          string
  name:        string
  emoji:       string
  description: string | null
  isActive:    boolean
  sortOrder:   number
}

export default function AdminCategoriesPage() {
  const { user } = usePiAuth()

  const [categories,  setCategories]  = useState<Category[]>([])
  const [isLoading,   setIsLoading]   = useState(true)
  const [newName,     setNewName]     = useState('')
  const [newEmoji,    setNewEmoji]    = useState('')
  const [newDesc,     setNewDesc]     = useState('')
  const [isAdding,    setIsAdding]    = useState(false)
  const [message,     setMessage]     = useState<string | null>(null)
  const [hasMounted,  setHasMounted]  = useState(false)

  useEffect(() => { setHasMounted(true) }, [])

  useEffect(() => {
    if (!user?.piUid || !hasMounted) return
    fetchCategories()
  }, [user?.piUid, hasMounted])

  const fetchCategories = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(
        `${window.location.origin}/api/admin/categories`,
        { headers: { 'x-pi-uid': user!.piUid } }
      )
      const data = await res.json()
      if (data.categories) setCategories(data.categories)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!newName.trim() || !newEmoji.trim() || !user?.piUid) return
    setIsAdding(true)
    try {
      const res = await fetch(
        `${window.location.origin}/api/admin/categories`,
        {
          method:  'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-pi-uid':     user.piUid,
          },
          body: JSON.stringify({
            name:        newName.trim(),
            emoji:       newEmoji.trim(),
            description: newDesc.trim() || null,
          }),
        }
      )
      const data = await res.json()
      if (data.success) {
        setCategories(prev => [...prev, data.category])
        setNewName('')
        setNewEmoji('')
        setNewDesc('')
        setMessage('Category added successfully')
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage(`Error: ${data.error}`)
      }
    } finally {
      setIsAdding(false)
    }
  }

  const handleToggle = async (id: string, isActive: boolean) => {
    if (!user?.piUid) return
    await fetch(
      `${window.location.origin}/api/admin/categories`,
      {
        method:  'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-pi-uid':     user.piUid,
        },
        body: JSON.stringify({ id, isActive: !isActive }),
      }
    )
    setCategories(prev => prev.map(c =>
      c.id === id ? { ...c, isActive: !isActive } : c
    ))
  }

  const handleDelete = async (id: string, name: string) => {
    if (!user?.piUid) return
    if (!confirm(`Delete category "${name}"? This cannot be undone.`)) return
    await fetch(
      `${window.location.origin}/api/admin/categories`,
      {
        method:  'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-pi-uid':     user.piUid,
        },
        body: JSON.stringify({ id }),
      }
    )
    setCategories(prev => prev.filter(c => c.id !== id))
    setMessage(`Category "${name}" deleted`)
  }

  if (!hasMounted) return null

  if (!user?.isAdmin) {
    return (
      <div style={{ minHeight: '100vh', background: COLORS.bgBase,
        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: COLORS.red }}>Admin access required.</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bgBase,
      fontFamily: FONTS.sans, color: COLORS.textPrimary }}>
      <Navigation currentPage="admin" />

      <main className="page-main" style={{ maxWidth: '700px' }}>

        <div style={{ marginBottom: SPACING.xl }}>
          <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: '700' }}>
            Category Management
          </h1>
          <p style={{ margin: 0, color: COLORS.textMuted, fontSize: '0.875rem' }}>
            Add, remove or toggle task categories shown to employers and workers
          </p>
        </div>

        {message && (
          <div style={{
            padding: SPACING.sm, marginBottom: SPACING.md,
            background: 'rgba(16,185,129,0.08)',
            border: '1px solid rgba(16,185,129,0.2)',
            borderRadius: RADII.md,
            color: COLORS.emerald, fontSize: '0.85rem',
          }}>
            {message}
          </div>
        )}

        {/* Add new category */}
        <div className="nexus-card" style={{ marginBottom: SPACING.lg }}>
          <div style={{
            fontSize: '0.65rem', fontWeight: '600', color: COLORS.textMuted,
            textTransform: 'uppercase' as const, letterSpacing: '0.1em',
            marginBottom: SPACING.md,
          }}>
            Add New Category
          </div>

          <div style={{ display: 'flex', gap: SPACING.sm, marginBottom: SPACING.sm }}>
            <input
              value={newEmoji}
              onChange={e => setNewEmoji(e.target.value)}
              placeholder="🏷️"
              style={{
                width: '60px', padding: '0.75rem', textAlign: 'center' as const,
                background: COLORS.bgElevated, border: `1px solid ${COLORS.borderAccent}`,
                borderRadius: RADII.md, color: COLORS.textPrimary,
                fontSize: '1.2rem', outline: 'none',
              }}
            />
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Category name"
              style={{
                flex: 1, padding: '0.75rem',
                background: COLORS.bgElevated, border: `1px solid ${COLORS.borderAccent}`,
                borderRadius: RADII.md, color: COLORS.textPrimary,
                fontSize: '0.9rem', outline: 'none', fontFamily: FONTS.sans,
              }}
            />
          </div>

          <input
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
            placeholder="Description (optional)"
            style={{
              width: '100%', padding: '0.75rem', marginBottom: SPACING.sm,
              background: COLORS.bgElevated, border: `1px solid ${COLORS.borderAccent}`,
              borderRadius: RADII.md, color: COLORS.textPrimary,
              fontSize: '0.85rem', outline: 'none', fontFamily: FONTS.sans,
              boxSizing: 'border-box' as const,
            }}
          />

          <button
            onClick={handleAdd}
            disabled={isAdding || !newName.trim() || !newEmoji.trim()}
            style={{
              padding: `${SPACING.sm} ${SPACING.lg}`,
              background: COLORS.indigo, border: 'none',
              borderRadius: RADII.md, color: 'white',
              fontSize: '0.85rem', fontWeight: '600',
              cursor: isAdding ? 'not-allowed' : 'pointer',
              fontFamily: FONTS.sans,
            }}
          >
            {isAdding ? 'Adding...' : '+ Add Category'}
          </button>
        </div>

        {/* Categories list */}
        <div className="nexus-card">
          <div style={{
            fontSize: '0.65rem', fontWeight: '600', color: COLORS.textMuted,
            textTransform: 'uppercase' as const, letterSpacing: '0.1em',
            marginBottom: SPACING.md,
          }}>
            All Categories ({categories.length})
          </div>

          {isLoading ? (
            <p style={{ color: COLORS.textMuted, fontSize: '0.85rem' }}>
              Loading...
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.sm }}>
              {categories.map(cat => (
                <div key={cat.id} style={{
                  display: 'flex', alignItems: 'center', gap: SPACING.sm,
                  padding: SPACING.sm,
                  background: COLORS.bgElevated,
                  border: `1px solid ${cat.isActive ? COLORS.border : 'rgba(239,68,68,0.2)'}`,
                  borderRadius: RADII.md,
                  opacity: cat.isActive ? 1 : 0.6,
                }}>
                  <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>
                    {cat.emoji}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '0.85rem', fontWeight: '600',
                      color: COLORS.textPrimary,
                    }}>
                      {cat.name}
                    </div>
                    {cat.description && (
                      <div style={{
                        fontSize: '0.72rem', color: COLORS.textMuted,
                        overflow: 'hidden', textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap' as const,
                      }}>
                        {cat.description}
                      </div>
                    )}
                  </div>

                  <span style={{
                    padding: '2px 8px',
                    background: cat.isActive
                      ? 'rgba(16,185,129,0.12)'
                      : 'rgba(239,68,68,0.12)',
                    border: `1px solid ${cat.isActive
                      ? 'rgba(16,185,129,0.3)'
                      : 'rgba(239,68,68,0.3)'}`,
                    borderRadius: RADII.full,
                    fontSize: '0.65rem', fontWeight: '700',
                    color: cat.isActive ? COLORS.emerald : COLORS.red,
                  }}>
                    {cat.isActive ? 'ACTIVE' : 'HIDDEN'}
                  </span>

                  <button
                    onClick={() => handleToggle(cat.id, cat.isActive)}
                    style={{
                      padding: '4px 10px',
                      background: 'transparent',
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: RADII.sm,
                      color: COLORS.textSecondary,
                      fontSize: '0.72rem', cursor: 'pointer',
                      fontFamily: FONTS.sans, flexShrink: 0,
                    }}
                  >
                    {cat.isActive ? 'Hide' : 'Show'}
                  </button>

                  <button
                    onClick={() => handleDelete(cat.id, cat.name)}
                    style={{
                      padding: '4px 10px',
                      background: 'transparent',
                      border: '1px solid rgba(239,68,68,0.3)',
                      borderRadius: RADII.sm,
                      color: COLORS.red,
                      fontSize: '0.72rem', cursor: 'pointer',
                      fontFamily: FONTS.sans, flexShrink: 0,
                    }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
