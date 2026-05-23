'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { compressImage } from '@/lib/compressImage'

const API = process.env.NEXT_PUBLIC_API_URL || ''
const apiFetch = (path: string, init?: RequestInit) =>
  fetch(`${API}${path}`, { credentials: 'include', ...init })

export default function AdminStoriesPage() {
  const router = useRouter()
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
    if (r.ok && story.id) {
      setStories(prev => [story, ...prev])
      setNewTitle('')
    } else {
      alert(story.error || story.message || 'Failed to create story')
    }
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
    if (!confirm('Are you sure you want to delete this story and all its photos?')) return
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

  const renderStoryCard = (story: any, isFeaturedList: boolean) => (
    <div key={story.id} 
      draggable
      onDragStart={() => onDragStart(story.id)}
      onDragOver={e => e.preventDefault()}
      onDrop={() => onDrop(story.id, isFeaturedList)}
      className="admin-card"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1.25rem',
        flexWrap: 'wrap',
        cursor: 'grab',
        borderColor: draggingId === story.id ? '#9a7d52' : '#ece9e4',
        opacity: draggingId === story.id ? 0.4 : 1,
        padding: '1rem 1.25rem'
      }}>
      
      {/* Drag handle icon */}
      <div style={{ color: '#c0b9af', cursor: 'grab', display: 'flex', alignItems: 'center' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>
      </div>

      {/* Clickable Card Content: Cover thumb + Info */}
      <div 
        onClick={() => router.push(`/admin/stories/${story.id}`)}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '1.25rem', 
          flex: 1, 
          cursor: 'pointer',
          minWidth: '220px'
        }}
      >
        {/* Cover thumb */}
        <div style={{ width: '52px', height: '52px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, background: '#fcfbf9', border: '1px solid #ece9e4' }}>
          {story.cover_image_url ? (
            <img src={story.cover_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '0.625rem', color: '#c0b9af', fontWeight: 500 }}>No Cover</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1c1a18', marginBottom: '0.15rem' }}>{story.title}</p>
          <p style={{ fontSize: '0.75rem', color: '#8c867e', fontWeight: 400 }}>
            {story.photo_count || 0} photos • {story.location || 'No location set'} • {story.date || 'No date set'}
          </p>
        </div>
      </div>

      {/* Toggles */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <Toggle label="Published" value={story.is_published} onChange={v => toggle(story.id, 'is_published', v)} color="#22c55e" />
        <Toggle label="Featured" value={story.is_featured} onChange={v => toggle(story.id, 'is_featured', v)} color="#3b82f6" />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto', alignItems: 'center' }}>
        <button 
          onClick={(e) => { e.stopPropagation(); router.push(`/admin/stories/${story.id}`); }} 
          className="admin-btn admin-btn-secondary" 
          style={{ padding: '0.4rem 0.875rem', cursor: 'pointer' }}
        >
          Edit
        </button>
        <button 
          onClick={() => deleteStory(story.id)} 
          className="admin-btn"
          style={{
            fontSize: '0.75rem', color: '#e53e3e', border: '1px solid #fecaca',
            borderRadius: '8px', padding: '0.4rem 0.875rem', background: '#fff0f0', cursor: 'pointer',
            fontWeight: 500
          }}
        >
          Delete
        </button>
      </div>
    </div>
  )

  const featuredStories = stories.filter(s => s.is_featured)
  const otherStories = stories.filter(s => !s.is_featured)

  return (
    <div style={{ maxWidth: '1000px', marginBottom: '6rem' }}>
      {/* Title block */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 400, color: '#1c1a18' }}>Stories Redaction</h1>
          <p style={{ fontSize: '0.8125rem', color: '#8c867e', marginTop: '0.15rem' }}>Create, publish, and reorder editorial entries. Drag items vertically to define home featured priority.</p>
        </div>
      </div>

      {/* Stories Page Header Image */}
      <div className="admin-card" style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 400, color: '#1c1a18', marginBottom: '0.25rem' }}>
          Stories Hub Header Media
        </h2>
        <p style={{ fontSize: '0.75rem', color: '#8c867e', marginBottom: '1.25rem' }}>Set a full-bleed cinematic image or video background representing the stories section index.</p>
        
        <div
          onClick={() => bgInputRef.current?.click()}
          onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDropBg}
          style={{
            width: '100%', height: '180px',
            background: headerBg ? 'none' : '#fcfbf9',
            border: isDragActive ? '2px solid #9a7d52' : '1px dashed #e5e1da',
            borderRadius: '10px',
            position: 'relative', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.2s',
          }}
        >
          {headerBg && headerBgType === 'video' ? (
            <video src={headerBg} muted loop playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }} />
          ) : headerBg ? (
            <img src={headerBg} alt="Header Bg" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }} />
          ) : null}
          
          <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', background: headerBg ? 'rgba(255,255,255,0.92)' : 'none', padding: headerBg ? '0.625rem 1.25rem' : '0', borderRadius: '8px', boxShadow: headerBg ? '0 4px 20px rgba(0,0,0,0.05)' : 'none' }}>
            <span style={{ fontSize: '0.8125rem', color: '#1c1a18', fontWeight: 600 }}>
              {headerBg ? 'Click or drag media to replace banner' : 'Click or drag luxury banner file here'}
            </span>
            <p style={{ fontSize: '0.7rem', color: '#8c867e', marginTop: '0.25rem' }}>Wide landscape cinematic format (e.g. 2560x1440)</p>
          </div>

          {bgUploading && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(28,26,24,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
              <div style={{ width: '50%', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: `${bgProgress}%`, height: '100%', background: '#9a7d52', transition: 'width 0.2s' }} />
              </div>
              <span style={{ color: '#fff', fontSize: '0.75rem', marginTop: '0.5rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500 }}>Optimizing {bgProgress}%</span>
            </div>
          )}
        </div>
        <input ref={bgInputRef} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && uploadHeaderBg(e.target.files[0])} />
      </div>

      {/* Create new */}
      <div className="admin-card" style={{ display: 'flex', gap: '0.875rem', marginBottom: '3rem', alignItems: 'center' }}>
        <input 
          className="admin-input"
          placeholder="Enter a title for a new story... (e.g. Ananya & Rohan in Florence)" 
          value={newTitle} 
          onChange={e => setNewTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && createStory()} 
          style={{ flex: 1 }}
        />
        <button 
          onClick={createStory} 
          disabled={creating || !newTitle.trim()} 
          className="admin-btn admin-btn-primary"
          style={{ whiteSpace: 'nowrap' }}
        >
          {creating ? 'Creating…' : 'Create Story Draft'}
        </button>
      </div>

      {loading ? (
        <p style={{ color: '#c0b9af', fontSize: '0.875rem' }}>Loading editorial collections…</p>
      ) : stories.length === 0 ? (
        <p style={{ color: '#c0b9af', fontSize: '0.875rem' }}>No stories available yet. Use the control panel above to create your first draft.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          
          {/* Featured Section */}
          <section>
            <h2 style={{ fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1c1a18', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#9a7d52' }}>★</span> Featured on Portfolio Home ({featuredStories.length})
            </h2>
            {featuredStories.length === 0 ? (
              <div style={{ padding: '2.5rem', border: '1px dashed #e5e1da', borderRadius: '10px', textAlign: 'center', color: '#8c867e', fontSize: '0.8125rem', background: '#fcfbf9' }}>
                Toggle "Featured" on any collection item below to curate home portfolio presentations.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {featuredStories.map(s => renderStoryCard(s, true))}
              </div>
            )}
          </section>

          {/* All Other Stories */}
          <section>
            <h2 style={{ fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8c867e', fontWeight: 600, marginBottom: '1rem' }}>
              All Other Editorial Entries ({otherStories.length})
            </h2>
            {otherStories.length === 0 ? (
              <p style={{ color: '#c0b9af', fontSize: '0.8125rem', padding: '1rem 0' }}>No other editorial draft entries created.</p>
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
      fontSize: '0.625rem', letterSpacing: '0.08em', textTransform: 'uppercase',
      padding: '0.35rem 0.75rem', borderRadius: '20px', border: 'none', cursor: 'pointer',
      background: value ? color : '#f7f6f4',
      color: value ? '#fff' : '#8c867e',
      fontWeight: 600, transition: 'all 0.2s',
    }}>
      {label}
    </button>
  )
}
