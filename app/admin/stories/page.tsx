'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { compressImage } from '@/lib/compressImage'

const API = process.env.NEXT_PUBLIC_API_URL || ''
const apiFetch = (path: string, init?: RequestInit) =>
  fetch(`${API}${path}`, { credentials: 'include', ...init })

export default function AdminStoriesPage() {
  const [stories, setStories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [draggingId, setDraggingId] = useState<number | null>(null)

  // Header background state
  const [headerBg, setHeaderBg] = useState<string | null>(null)
  const [headerBgType, setHeaderBgType] = useState<'image' | 'video'>('image')
  const [bgUploading, setBgUploading] = useState(false)
  const [bgProgress, setBgProgress] = useState(0)
  const [isDragActive, setIsDragActive] = useState(false)
  const bgInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    Promise.all([
      apiFetch('/api/website/admin/stories').then(r => r.json()),
      apiFetch('/api/website/sections').then(r => r.json())
    ]).then(([storiesData, sectionsData]) => {
      setStories(storiesData)
      const storiesSection = sectionsData.find((s: any) => s.key === 'stories')
      if (storiesSection?.content?.bgImage) {
        setHeaderBg(storiesSection.content.bgImage)
        setHeaderBgType(storiesSection.content.bgType || 'image')
      }
    }).finally(() => setLoading(false))
  }, [])

  const uploadHeaderBg = useCallback(async (file: File) => {
    if (!file) return
    setBgUploading(true)
    setBgProgress(0)

    const isVideo = file.type.startsWith('video/')

    let toUpload: File = file
    if (!isVideo) {
      try {
        toUpload = await compressImage(file, { maxWidth: 2560, maxHeight: 1600, quality: 0.82 })
      } catch { /* fall back to original */ }
    }

    const form = new FormData()
    form.append('file', toUpload)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${API}/api/website/sections/stories/bg`)
    xhr.withCredentials = true
    xhr.upload.onprogress = e => e.lengthComputable && setBgProgress(Math.round((e.loaded / e.total) * 100))
    xhr.onload = () => {
      setBgUploading(false)
      if (xhr.status === 200) {
        const res = JSON.parse(xhr.responseText)
        setHeaderBg(res.url)
        setHeaderBgType(res.type || 'image')
      } else {
        alert('Upload failed')
      }
    }
    xhr.onerror = () => {
      setBgUploading(false)
      alert('Upload failed')
    }
    xhr.send(form)
  }, [])

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragActive(true) }
  const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragActive(false) }
  const onDropBg = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(false)
    if (e.dataTransfer.files?.[0]) uploadHeaderBg(e.dataTransfer.files[0])
  }

  const createStory = async () => {
    if (!newTitle.trim()) return
    setCreating(true)
    const r = await apiFetch('/api/website/stories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle }),
    })
    const story = await r.json()
    setStories(prev => [story, ...prev])
    setNewTitle('')
    setCreating(false)
  }

  const toggle = async (id: number, field: string, val: boolean) => {
    await apiFetch(`/api/website/stories/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: val }),
    })
    setStories(prev => prev.map(s => s.id === id ? { ...s, [field]: val } : s))
  }

  const deleteStory = async (id: number) => {
    if (!confirm('Delete this story and all its photos?')) return
    await apiFetch(`/api/website/stories/${id}`, { method: 'DELETE' })
    setStories(prev => prev.filter(s => s.id !== id))
  }

  const onDragStart = (id: number) => setDraggingId(id)

  const onDrop = async (dropId: number, isFeaturedList: boolean) => {
    if (!draggingId || draggingId === dropId) return setDraggingId(null)
    
    const list = isFeaturedList ? stories.filter(s => s.is_featured) : stories.filter(s => !s.is_featured)
    const dragIdx = list.findIndex(s => s.id === draggingId)
    const dropIdx = list.findIndex(s => s.id === dropId)
    
    if (dragIdx === -1 || dropIdx === -1) return setDraggingId(null)

    const updated = [...list]
    const [dragged] = updated.splice(dragIdx, 1)
    updated.splice(dropIdx, 0, dragged)

    updated.forEach((s, i) => s.display_order = i)

    setStories(prev => {
      const newList = prev.map(s => {
        const found = updated.find(u => u.id === s.id)
        return found ? { ...s, display_order: found.display_order } : s
      })
      // preserve sort order based on display_order
      return newList.sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
    })
    setDraggingId(null)

    await apiFetch('/api/website/admin/stories/reorder', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: updated.map(s => ({ id: s.id, display_order: s.display_order })) })
    })
  }

  const input = { padding: '0.625rem 0.875rem', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '0.9375rem', flex: '1' }

  const renderStoryCard = (story: any, isFeaturedList: boolean) => (
    <div key={story.id} 
      draggable
      onDragStart={() => onDragStart(story.id)}
      onDragOver={e => e.preventDefault()}
      onDrop={() => onDrop(story.id, isFeaturedList)}
      style={{
        background: '#fff', border: draggingId === story.id ? '2px solid #1a1512' : '1px solid #eee', 
        borderRadius: '10px', padding: '1rem 1.25rem',
        display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
        cursor: 'grab', opacity: draggingId === story.id ? 0.5 : 1,
        transition: 'border 0.2s, opacity 0.2s',
      }}>
      
      {/* Drag handle icon */}
      <div style={{ color: '#ccc', cursor: 'grab', paddingRight: '0.5rem' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>
      </div>

      {/* Cover thumb */}
      <div style={{ width: '56px', height: '56px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0, background: '#f0ede8' }}>
        {story.cover_image_url ? (
          <img src={story.cover_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.6875rem', color: '#bbb' }}>No cover</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: '140px' }}>
        <p style={{ fontSize: '0.9375rem', fontWeight: 500, color: '#1a1512', marginBottom: '0.2rem' }}>{story.title}</p>
        <p style={{ fontSize: '0.75rem', color: '#bbb' }}>
          {story.photo_count || 0} photos · {story.location || 'No location'} · {story.date || '—'}
        </p>
      </div>

      {/* Toggles */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <Toggle label="Published" value={story.is_published} onChange={v => toggle(story.id, 'is_published', v)} color="#22c55e" />
        <Toggle label="Featured" value={story.is_featured} onChange={v => toggle(story.id, 'is_featured', v)} color="#3b82f6" />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
        <Link href={`/admin/stories/${story.id}`} style={{
          fontSize: '0.75rem', color: '#555', border: '1px solid #e0e0e0',
          borderRadius: '6px', padding: '0.375rem 0.75rem', textDecoration: 'none',
        }}>
          Edit
        </Link>
        <button onClick={() => deleteStory(story.id)} style={{
          fontSize: '0.75rem', color: '#e53e3e', border: '1px solid #fecaca',
          borderRadius: '6px', padding: '0.375rem 0.75rem', background: 'none', cursor: 'pointer',
        }}>
          Delete
        </button>
      </div>
    </div>
  )

  const featuredStories = stories.filter(s => s.is_featured)
  const otherStories = stories.filter(s => !s.is_featured)

  return (
    <div style={{ maxWidth: '1000px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 400 }}>Stories</h1>
          <p style={{ fontSize: '0.875rem', color: '#888' }}>Manage your portfolio. Drag to reorder your homepage featured editorials.</p>
        </div>
      </div>

      {/* ── Header Background Upload ── */}
      <div id="header" style={{ marginBottom: '4rem' }}>
        <h2 style={{ fontSize: '0.875rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1a1512', fontWeight: 600, marginBottom: '1rem' }}>
          Stories Page Header Image
        </h2>
        
        <div
          onClick={() => bgInputRef.current?.click()}
          onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDropBg}
          style={{
            width: '100%', height: '160px',
            background: headerBg ? 'none' : '#fff',
            border: isDragActive ? '2px solid #1a1512' : '1px dashed #ccc',
            borderRadius: '12px',
            position: 'relative', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'border 0.2s',
          }}
        >
          {headerBg && headerBgType === 'video' ? (
            <video src={headerBg} muted loop playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
          ) : headerBg ? (
            <img src={headerBg} alt="Header Bg" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
          ) : null}
          
          <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', background: headerBg ? 'rgba(255,255,255,0.9)' : 'none', padding: headerBg ? '0.5rem 1rem' : '0', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.875rem', color: '#1a1512', fontWeight: 500 }}>
              {headerBg ? 'Click or drag to replace' : 'Click or drag image here'}
            </span>
            <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.25rem' }}>Full bleed landscape (e.g. 2560x1440)</p>
          </div>

          {bgUploading && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(26,21,18,0.8)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
              <div style={{ width: '60%', height: '4px', background: '#333', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: `${bgProgress}%`, height: '100%', background: '#fff', transition: 'width 0.2s' }} />
              </div>
              <span style={{ color: '#fff', fontSize: '0.75rem', marginTop: '0.5rem', letterSpacing: '0.1em' }}>UPLOADING {bgProgress}%</span>
            </div>
          )}
        </div>
        <input ref={bgInputRef} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && uploadHeaderBg(e.target.files[0])} />
      </div>

      {/* Create new */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '3rem', background: '#fff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #eee' }}>
        <input style={input} placeholder="Start a new story... (e.g. Ananya & Rohan)" value={newTitle} onChange={e => setNewTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && createStory()} />
        <button onClick={createStory} disabled={creating || !newTitle.trim()} style={{
          background: '#1a1512', color: '#fff', border: 'none', borderRadius: '8px',
          padding: '0.625rem 1.5rem', fontSize: '0.875rem', cursor: 'pointer', whiteSpace: 'nowrap',
        }}>
          {creating ? 'Creating…' : 'Create Draft'}
        </button>
      </div>

      {loading ? (
        <p style={{ color: '#aaa', fontSize: '0.875rem' }}>Loading stories…</p>
      ) : stories.length === 0 ? (
        <p style={{ color: '#aaa', fontSize: '0.875rem' }}>No stories yet. Create your first one above.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          
          {/* Featured Section */}
          <section>
            <h2 style={{ fontSize: '0.875rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1a1512', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#3b82f6' }}>★</span> Featured Editorials (Homepage)
            </h2>
            {featuredStories.length === 0 ? (
              <div style={{ padding: '2rem', border: '1px dashed #ccc', borderRadius: '10px', textAlign: 'center', color: '#888', fontSize: '0.875rem' }}>
                Toggle "Featured" on any story below to show it on your homepage.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {featuredStories.map(s => renderStoryCard(s, true))}
              </div>
            )}
          </section>

          {/* All Other Stories */}
          <section>
            <h2 style={{ fontSize: '0.875rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888', fontWeight: 600, marginBottom: '1rem' }}>
              All Other Stories (Gallery)
            </h2>
            {otherStories.length === 0 ? (
              <p style={{ color: '#aaa', fontSize: '0.875rem' }}>No other stories.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {otherStories.map(s => renderStoryCard(s, false))}
              </div>
            )}
          </section>

        </div>
      )}
    </div>
  )
}

function Toggle({ label, value, onChange, color }: { label: string; value: boolean; onChange: (v: boolean) => void; color: string }) {
  return (
    <button onClick={() => onChange(!value)} style={{
      fontSize: '0.625rem', letterSpacing: '0.1em', textTransform: 'uppercase',
      padding: '0.3rem 0.625rem', borderRadius: '20px', border: 'none', cursor: 'pointer',
      background: value ? color : '#f0f0f0',
      color: value ? '#fff' : '#888',
      fontWeight: 500, transition: 'all 0.2s',
    }}>
      {label}
    </button>
  )
}
