'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL || ''
const apiFetch = (path: string, init?: RequestInit) =>
  fetch(`${API}${path}`, { credentials: 'include', ...init })

function StatusToggle({ label, value, onChange, color }: { label: string; value: boolean; onChange: (val: boolean) => void; color: string }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        fontSize: '0.625rem',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        padding: '0.35rem 0.75rem',
        borderRadius: '20px',
        border: 'none',
        cursor: 'pointer',
        background: value ? color : '#f7f6f4',
        color: value ? '#fff' : '#8c867e',
        fontWeight: 600,
        transition: 'all 0.2s',
      }}
    >
      {label}
    </button>
  )
}

export default function AdminInspirationsPage() {
  const router = useRouter()
  const [boards, setBoards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newSubtitle, setNewSubtitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [draggingId, setDraggingId] = useState<number | null>(null)

  const fetchBoards = useCallback(async () => {
    try {
      const res = await apiFetch('/api/website/admin/inspirations')
      if (res.ok) {
        const data = await res.json()
        setBoards(data)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBoards()
  }, [fetchBoards])

  const handleCreate = async () => {
    if (!newTitle.trim()) return
    setCreating(true)
    try {
      const res = await apiFetch('/api/website/admin/inspirations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          subtitle: newSubtitle || null,
          description: newDescription || null,
          is_published: true,
        }),
      })
      const data = await res.json()
      if (res.ok && data.id) {
        setBoards(prev => [data, ...prev])
        setNewTitle('')
        setNewSubtitle('')
        setNewDescription('')
        router.push(`/admin/inspirations/${data.id}`)
      } else {
        alert(data.error || 'Failed to create inspiration board')
      }
    } catch {
      alert('Failed to create inspiration board')
    } finally {
      setCreating(false)
    }
  }

  const handleUpdate = async (id: number, field: string, val: any) => {
    try {
      await apiFetch(`/api/website/admin/inspirations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: val }),
      })
      setBoards(prev => prev.map(b => (b.id === id ? { ...b, [field]: val } : b)))
    } catch {
      alert('Update failed')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this inspiration collection and all its photos?')) return
    try {
      await apiFetch(`/api/website/admin/inspirations/${id}`, { method: 'DELETE' })
      setBoards(prev => prev.filter(b => b.id !== id))
    } catch {
      alert('Failed to delete')
    }
  }

  const handleBoardDragOver = (targetId: number) => {
    if (!draggingId || draggingId === targetId) return
    const idxCurrent = boards.findIndex(b => b.id === draggingId)
    const idxTarget = boards.findIndex(b => b.id === targetId)
    if (idxCurrent === -1 || idxTarget === -1) return

    const updated = [...boards]
    const [moved] = updated.splice(idxCurrent, 1)
    updated.splice(idxTarget, 0, moved)
    updated.forEach((b, i) => (b.display_order = i))
    setBoards(updated)
  }

  const handleBoardDragEnd = async () => {
    if (!draggingId) return
    setDraggingId(null)
    try {
      await apiFetch('/api/website/admin/inspirations/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: boards.map((b, i) => ({ id: b.id, display_order: i })) }),
      })
    } catch {
      fetchBoards()
    }
  }

  return (
    <div style={{ maxWidth: '1000px', marginBottom: '6rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 400, color: '#1c1a18' }}>
            Aesthetics (Mobile App Only)
          </h1>
          <p style={{ fontSize: '0.8125rem', color: '#8c867e', marginTop: '0.15rem' }}>
            Curate moodboard aesthetic collections for the mobile app. Uploaded assets save directly to Cloudflare R2 under <code style={{ background: '#eee', padding: '2px 6px', borderRadius: '4px' }}>website/inspirations/&lt;slug&gt;/</code>.
          </p>
        </div>
      </div>

      {/* Create New Form */}
      <div className="admin-card" style={{ marginBottom: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 400, color: '#1c1a18' }}>
          Create New Aesthetic Collection
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <input
            className="admin-input"
            placeholder="Collection Title (e.g. Golden Hour, Mehendi Poses)"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
          />
          <input
            className="admin-input"
            placeholder="Subtitle (e.g. Warm Sunset & Glowing Portraits)"
            value={newSubtitle}
            onChange={e => setNewSubtitle(e.target.value)}
          />
          <textarea
            className="admin-input"
            rows={2}
            placeholder="Description for moodboard collection..."
            value={newDescription}
            onChange={e => setNewDescription(e.target.value)}
            style={{ padding: '0.75rem 1rem' }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleCreate}
            disabled={creating || !newTitle.trim()}
            className="admin-btn admin-btn-primary"
          >
            {creating ? 'Creating…' : '+ Create Inspiration Board'}
          </button>
        </div>
      </div>

      {/* List of Boards */}
      {loading ? (
        <p style={{ color: '#c0b9af', fontSize: '0.875rem' }}>Loading inspiration collections…</p>
      ) : boards.length === 0 ? (
        <p style={{ color: '#c0b9af', fontSize: '0.875rem' }}>No inspiration collections created yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {boards.map(board => (
            <div
              key={board.id}
              draggable
              onDragStart={() => setDraggingId(board.id)}
              onDragOver={e => {
                e.preventDefault()
                if (draggingId !== null && draggingId !== board.id) {
                  handleBoardDragOver(board.id)
                }
              }}
              onDragEnd={handleBoardDragEnd}
              className="admin-card"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.25rem',
                flexWrap: 'wrap',
                cursor: 'grab',
                borderColor: draggingId === board.id ? '#9a7d52' : '#ece9e4',
                opacity: draggingId === board.id ? 0.4 : 1,
                padding: '1rem 1.25rem',
                transition: 'transform 0.15s ease, opacity 0.15s ease',
              }}
            >
              <div style={{ color: '#c0b9af', cursor: 'grab', display: 'flex', alignItems: 'center' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
                </svg>
              </div>

              <div
                onClick={() => router.push(`/admin/inspirations/${board.id}`)}
                style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flex: 1, cursor: 'pointer', minWidth: '220px' }}
              >
                <div style={{ width: '56px', height: '56px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, background: '#fcfbf9', border: '1px solid #ece9e4' }}>
                  {board.cover_image_url ? (
                    <img src={board.cover_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '0.625rem', color: '#c0b9af', fontWeight: 500 }}>No Cover</span>
                    </div>
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1c1a18', marginBottom: '0.15rem' }}>
                    {board.title}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#8c867e', fontWeight: 400 }}>
                    {board.photo_count || 0} photos • <code style={{ fontSize: '0.7rem' }}>website/inspirations/{board.slug}</code>
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <StatusToggle
                  label="Published"
                  value={board.is_published}
                  onChange={val => handleUpdate(board.id, 'is_published', val)}
                  color="#22c55e"
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto', alignItems: 'center' }}>
                <button
                  onClick={e => { e.stopPropagation(); router.push(`/admin/inspirations/${board.id}`); }}
                  className="admin-btn admin-btn-secondary"
                  style={{ padding: '0.4rem 0.875rem', cursor: 'pointer' }}
                >
                  Edit Photos
                </button>
                <button
                  onClick={() => handleDelete(board.id)}
                  className="admin-btn"
                  style={{ fontSize: '0.75rem', color: '#e53e3e', border: '1px solid #fecaca', borderRadius: '8px', padding: '0.4rem 0.875rem', background: '#fff0f0', cursor: 'pointer', fontWeight: 500 }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
