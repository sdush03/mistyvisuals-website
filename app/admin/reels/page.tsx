'use client'

import { useEffect, useState } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || ''
const apiFetch = (path: string, init?: RequestInit) =>
  fetch(`${API}${path}`, { credentials: 'include', ...init })

export default function AdminReelsPage() {
  const [items, setItems] = useState<any[]>([])
  const [form, setForm] = useState({ title: '', youtube_video_id: '', is_published: true })
  const [editing, setEditing] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingId, setUploadingId] = useState<number | null>(null)

  useEffect(() => {
    apiFetch('/api/website/admin/reels')
      .then(r => r.json())
      .then(setItems)
      .catch(err => console.error('Failed to fetch reels:', err))
  }, [])

  const save = async () => {
    setSaving(true)
    const body = { 
      title: form.title, 
      youtube_video_id: form.youtube_video_id, 
      is_published: form.is_published 
    }
    
    try {
      if (editing !== null) {
        const r = await apiFetch(`/api/website/reels/${editing}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const updated = await r.json()
        setItems(prev => prev.map(t => t.id === editing ? updated : t))
        setEditing(null)
      } else {
        const r = await apiFetch('/api/website/reels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const created = await r.json()
        setItems(prev => [...prev, created])
      }
      setForm({ title: '', youtube_video_id: '', is_published: true })
    } catch (e) {
      console.error(e)
      alert('Failed to save reel')
    }
    setSaving(false)
  }

  const deleteItem = async (id: number) => {
    if (!confirm('Are you sure you want to delete this Reel?')) return
    await apiFetch(`/api/website/reels/${id}`, { method: 'DELETE' })
    setItems(prev => prev.filter(t => t.id !== id))
  }

  const startEdit = (t: any) => {
    setEditing(t.id)
    setForm({ 
      title: t.title, 
      youtube_video_id: t.youtube_video_id || '', 
      is_published: t.is_published 
    })
  }

  const handleThumbnailUpload = async (reelId: number, file: File) => {
    setUploadingId(reelId)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await apiFetch(`/api/website/reels/${reelId}/thumbnail`, {
        method: 'POST',
        body: formData
      })
      if (res.ok) {
        const updated = await res.json()
        setItems(prev => prev.map(r => r.id === reelId ? updated : r))
      } else {
        alert('Failed to upload portrait thumbnail')
      }
    } catch (e) {
      console.error(e)
      alert('Error uploading thumbnail')
    }
    setUploadingId(null)
  }

  const input = { width: '100%', padding: '0.625rem 0.875rem', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '0.875rem' }
  const label = { fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#888', display: 'block', marginBottom: '0.3rem' }

  return (
    <div style={{ maxWidth: '780px' }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 400, marginBottom: '2rem' }}>Reels Manager</h1>

      {/* Form */}
      <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '1.25rem', color: '#555' }}>
          {editing !== null ? 'Edit Reel Details' : 'Add New Vertical Reel'}
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label style={label}>Reel Title *</label>
              <input style={input} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. The Sangeet Highlights" />
            </div>
            <div>
              <label style={label}>YouTube Video ID *</label>
              <input style={input} value={form.youtube_video_id} onChange={e => setForm(f => ({ ...f, youtube_video_id: e.target.value }))} placeholder="e.g. dQw4w9WgXcQ" />
            </div>
          </div>
          
          <div>
            <label style={label}>Status</label>
            <button 
              onClick={() => setForm(f => ({ ...f, is_published: !f.is_published }))} 
              style={{
                fontSize: '0.625rem', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.45rem 0.875rem',
                borderRadius: '20px', border: 'none', cursor: 'pointer',
                background: form.is_published ? '#22c55e' : '#f0f0f0',
                color: form.is_published ? '#fff' : '#888', fontWeight: 600,
                transition: 'all 0.2s',
              }}
            >
              {form.is_published ? 'Published' : 'Draft'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button onClick={save} disabled={saving || !form.title || !form.youtube_video_id} style={{
              background: '#1a1512', color: '#fff', border: 'none', borderRadius: '8px',
              padding: '0.625rem 1.5rem', fontSize: '0.875rem', cursor: 'pointer',
            }}>
              {saving ? 'Saving…' : editing !== null ? 'Update' : 'Create Reel'}
            </button>
            {editing !== null && (
              <button onClick={() => { setEditing(null); setForm({ title: '', youtube_video_id: '', is_published: true }) }} style={{
                background: 'none', border: '1px solid #e0e0e0', borderRadius: '8px',
                padding: '0.625rem 1.25rem', fontSize: '0.875rem', cursor: 'pointer', color: '#555',
              }}>
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* List */}
      <h2 style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '1rem', color: '#1c1a18' }}>Manage Library</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {items.map(t => (
          <div key={t.id} style={{
            background: '#fff', border: '1px solid #eee', borderRadius: '10px', padding: '1rem 1.25rem',
            display: 'flex', gap: '1.5rem', alignItems: 'center',
          }}>
            {/* Aspect Ratio 9:16 Portrait Thumbnail Upload Box */}
            <div style={{
              width: '72px',
              aspectRatio: '9/16',
              background: '#fcfbf9',
              border: '1px solid #e5e1da',
              borderRadius: '6px',
              overflow: 'hidden',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              {t.thumbnail_url ? (
                <img src={t.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#c0b9af', cursor: 'pointer' }}
                  onClick={() => document.getElementById(`thumb-${t.id}`)?.click()}
                >
                  <span style={{ fontSize: '1.25rem', fontWeight: 300 }}>+</span>
                  <span style={{ fontSize: '0.55rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Portrait</span>
                </div>
              )}

              {/* Upload Hover Overlay */}
              {t.thumbnail_url && (
                <div style={{
                  position: 'absolute', inset: 0, background: 'rgba(28,26,24,0.6)',
                  opacity: 0, transition: 'opacity 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer'
                }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '0'}
                  onClick={() => document.getElementById(`thumb-${t.id}`)?.click()}
                >
                  <span style={{ color: '#fff', fontSize: '0.55rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Change</span>
                </div>
              )}

              {uploadingId === t.id && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(28,26,24,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: '#fff', fontSize: '0.5rem', fontWeight: 600 }}>CROP...</span>
                </div>
              )}

              <input 
                type="file" 
                id={`thumb-${t.id}`} 
                style={{ display: 'none' }} 
                accept="image/*"
                onChange={e => {
                  if (e.target.files?.[0]) handleThumbnailUpload(t.id, e.target.files[0])
                }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#1c1a18', marginBottom: '0.25rem' }}>
                {t.title}
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#888', margin: 0, fontFamily: 'monospace' }}>
                YouTube ID: {t.youtube_video_id || 'None'}
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', alignItems: 'center' }}>
                <span style={{
                  fontSize: '0.55rem', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.15rem 0.5rem',
                  borderRadius: '10px', background: t.is_published ? '#22c55e' : '#f0f0f0',
                  color: t.is_published ? '#fff' : '#888', fontWeight: 600
                }}>
                  {t.is_published ? 'Published' : 'Draft'}
                </span>
                {t.story_id && (
                  <span style={{ fontSize: '0.65rem', color: '#9a7d52', fontWeight: 500 }}>
                    Linked to Story #{t.story_id}
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
              <button onClick={() => startEdit(t)} style={{ fontSize: '0.75rem', color: '#555', border: '1px solid #e0e0e0', borderRadius: '6px', padding: '0.3rem 0.6rem', background: 'none', cursor: 'pointer' }}>Edit</button>
              <button onClick={() => deleteItem(t.id)} style={{ fontSize: '0.75rem', color: '#e53e3e', border: '1px solid #fecaca', borderRadius: '6px', padding: '0.3rem 0.6rem', background: 'none', cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
