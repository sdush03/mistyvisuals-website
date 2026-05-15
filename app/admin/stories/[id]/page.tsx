'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL || ''
const apiFetch = (path: string, init?: RequestInit) =>
  fetch(`${API}${path}`, { credentials: 'include', ...init })

type Photo = {
  id: number; file_url: string; file_url_thumb?: string
  blur_data_url?: string; is_cover: boolean; display_order: number
}

export default function AdminStoryEditorPage() {
  const { id } = useParams<{ id: string }>()
  const [story, setStory] = useState<any>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [draggingId, setDraggingId] = useState<number | null>(null)

  useEffect(() => {
    apiFetch(`/api/website/admin/stories/${id}`).then(r => r.json()).then(d => {
      setStory(d)
      setPhotos((d.photos || []).sort((a: Photo, b: Photo) => a.display_order - b.display_order))
    })
  }, [id])

  const saveStory = async () => {
    setSaving(true)
    await apiFetch(`/api/website/stories/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: story.title, subtitle: story.subtitle,
        location: story.location, year: story.year ? parseInt(story.year) : null,
        category: story.category, is_published: story.is_published,
        is_featured: story.is_featured,
      }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const uploadPhotos = async (files: File[]) => {
    if (!files.length) return
    setUploading(true)
    setUploadProgress(0)
    const form = new FormData()
    files.forEach(f => form.append('file', f))

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.upload.onprogress = e => e.lengthComputable && setUploadProgress(Math.round(e.loaded / e.total * 100))
      xhr.onload = () => {
        if (xhr.status < 300) {
          const newPhotos: Photo[] = JSON.parse(xhr.responseText)
          setPhotos(prev => [...prev, ...newPhotos].sort((a, b) => a.display_order - b.display_order))
          resolve()
        } else reject(new Error(xhr.responseText))
      }
      xhr.onerror = () => reject(new Error('Upload failed'))
      xhr.open('POST', `${API}/api/website/stories/${id}/photos`)
      xhr.withCredentials = true
      xhr.send(form)
    }).catch(console.error)

    setUploading(false)
    setUploadProgress(0)
  }

  const setCover = async (photoId: number) => {
    await apiFetch(`/api/website/story-photos/${photoId}/cover`, { method: 'PATCH' })
    setPhotos(prev => prev.map(p => ({ ...p, is_cover: p.id === photoId })))
    setStory((s: any) => ({ ...s, cover_image_url: photos.find(p => p.id === photoId)?.file_url }))
  }

  const deletePhoto = async (photoId: number) => {
    await apiFetch(`/api/website/story-photos/${photoId}`, { method: 'DELETE' })
    setPhotos(prev => prev.filter(p => p.id !== photoId))
  }

  // Drag-drop reorder
  const onDragStart = (id: number) => setDraggingId(id)
  const onDrop = useCallback(async (targetId: number) => {
    if (draggingId === null || draggingId === targetId) return
    const reordered = [...photos]
    const fromIdx = reordered.findIndex(p => p.id === draggingId)
    const toIdx   = reordered.findIndex(p => p.id === targetId)
    const [moved] = reordered.splice(fromIdx, 1)
    reordered.splice(toIdx, 0, moved)
    const updated = reordered.map((p, i) => ({ ...p, display_order: i }))
    setPhotos(updated)
    setDraggingId(null)
    await apiFetch(`/api/website/stories/${id}/photos/reorder`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: updated.map(p => ({ id: p.id, display_order: p.display_order })) }),
    })
  }, [draggingId, photos, id])

  const input = { width: '100%', padding: '0.625rem 0.875rem', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '0.9375rem' }
  const label = { fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#888', display: 'block', marginBottom: '0.35rem' }

  if (!story) return <p style={{ color: '#aaa', fontSize: '0.875rem' }}>Loading…</p>

  return (
    <div style={{ maxWidth: '900px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <a href="/admin/stories" style={{ fontSize: '0.75rem', color: '#aaa', textDecoration: 'none', marginBottom: '0.5rem', display: 'block' }}>← Stories</a>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 400 }}>{story.title}</h1>
        </div>
        <button onClick={saveStory} disabled={saving} style={{
          background: saved ? '#22c55e' : '#1a1512', color: '#fff', border: 'none',
          borderRadius: '8px', padding: '0.625rem 1.5rem', fontSize: '0.875rem', cursor: 'pointer',
        }}>
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Changes'}
        </button>
      </div>

      {/* Story details */}
      <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
          {[['Title', 'title', 'text'], ['Subtitle', 'subtitle', 'text'], ['Location', 'location', 'text'], ['Date', 'date', 'date'], ['Category', 'category', 'text']].map(([lbl, field, type]) => (
            <div key={field}>
              <label style={label}>{lbl}</label>
              <input type={type} style={input} value={(story as any)[field] || ''}
                onChange={e => setStory((s: any) => ({ ...s, [field]: e.target.value }))} />
            </div>
          ))}
          <div>
            <label style={label}>Status</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {['is_published', 'is_featured'].map(field => (
                <button key={field} onClick={() => setStory((s: any) => ({ ...s, [field]: !s[field] }))} style={{
                  fontSize: '0.6875rem', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.4rem 0.875rem',
                  borderRadius: '20px', border: 'none', cursor: 'pointer',
                  background: (story as any)[field] ? '#22c55e' : '#f0f0f0',
                  color: (story as any)[field] ? '#fff' : '#888', fontWeight: 500,
                }}>
                  {field === 'is_published' ? 'Published' : 'Featured'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Photo upload */}
      <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 400, marginBottom: '0.2rem' }}>Gallery Photos</h2>
            <p style={{ fontSize: '0.75rem', color: '#aaa' }}>{photos.length} photos · Drag to reorder · Click star to set cover</p>
          </div>
          <button onClick={() => fileRef.current?.click()} style={{
            background: '#1a1512', color: '#fff', border: 'none', borderRadius: '8px',
            padding: '0.625rem 1.25rem', fontSize: '0.8125rem', cursor: 'pointer',
          }}>
            + Upload Photos
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
            onChange={e => e.target.files && uploadPhotos(Array.from(e.target.files))} />
        </div>

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => {
            e.preventDefault(); setDragOver(false)
            const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
            if (files.length) uploadPhotos(files)
          }}
          style={{
            border: `2px dashed ${dragOver ? '#1a1512' : '#e0e0e0'}`,
            borderRadius: '8px', padding: '1.25rem', textAlign: 'center',
            marginBottom: '1.25rem', background: dragOver ? '#f7f5f2' : 'transparent',
            transition: 'all 0.2s',
          }}
        >
          {uploading ? (
            <div>
              <div style={{ height: '4px', background: '#f0f0f0', borderRadius: '4px', marginBottom: '0.5rem', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#1a1512', width: `${uploadProgress}%`, transition: 'width 0.2s' }} />
              </div>
              <p style={{ fontSize: '0.8125rem', color: '#555' }}>Uploading & optimizing {uploadProgress}%…</p>
            </div>
          ) : (
            <p style={{ fontSize: '0.8125rem', color: '#bbb' }}>Drop photos here to add them</p>
          )}
        </div>

        {/* Photo grid */}
        {photos.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem' }}>
            {photos.map(photo => (
              <div key={photo.id}
                draggable
                onDragStart={() => onDragStart(photo.id)}
                onDragOver={e => e.preventDefault()}
                onDrop={() => onDrop(photo.id)}
                style={{
                  position: 'relative', aspectRatio: '1', borderRadius: '6px', overflow: 'hidden',
                  cursor: 'grab', border: draggingId === photo.id ? '2px solid #1a1512' : '2px solid transparent',
                  background: '#f0ede8',
                }}
              >
                <img src={photo.file_url_thumb || photo.file_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {/* Cover badge */}
                {photo.is_cover && (
                  <div style={{ position: 'absolute', top: '5px', left: '5px', background: '#b8965a', borderRadius: '4px', padding: '2px 6px', fontSize: '0.5625rem', color: '#fff', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Cover
                  </div>
                )}
                {/* Actions */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(10,8,6,0.6)', padding: '0.35rem', display: 'flex', justifyContent: 'space-between' }}>
                  <button onClick={() => setCover(photo.id)} title="Set as cover" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', lineHeight: 1 }}>
                    {photo.is_cover ? '⭐' : '☆'}
                  </button>
                  <button onClick={() => deletePhoto(photo.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fc8181', fontSize: '0.75rem' }}>
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
