'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { compressImage } from '@/lib/compressImage'

const API = process.env.NEXT_PUBLIC_API_URL || ''
const apiFetch = (path: string, init?: RequestInit) =>
  fetch(`${API}${path}`, { credentials: 'include', ...init })

type InspirationPhoto = {
  id: number
  file_url: string
  file_url_thumb?: string
  display_order: number
}

export default function AdminInspirationEditorPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [board, setBoard] = useState<any>(null)
  const [photos, setPhotos] = useState<InspirationPhoto[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [coverUploading, setCoverUploading] = useState(false)
  const [coverProgress, setCoverProgress] = useState(0)

  const [photosUploading, setPhotosUploading] = useState(false)
  const [photosProgress, setPhotosProgress] = useState(0)

  const [draggingId, setDraggingId] = useState<number | null>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const photosInputRef = useRef<HTMLInputElement>(null)

  const fetchBoardDetails = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/website/admin/inspirations/${id}`)
      if (res.ok) {
        const data = await res.json()
        setBoard(data)
        setPhotos(data.photos || [])
      }
    } catch {
      alert('Failed to load board details')
    }
  }, [id])

  useEffect(() => {
    fetchBoardDetails()
  }, [fetchBoardDetails])

  const handleSaveMetadata = async () => {
    if (!board) return
    setSaving(true)
    setSaved(false)
    try {
      const res = await apiFetch(`/api/website/admin/inspirations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: board.title,
          subtitle: board.subtitle,
          description: board.description,
          slug: board.slug,
          is_published: board.is_published,
        }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      } else {
        alert('Failed to save changes')
      }
    } catch {
      alert('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const uploadCoverImage = async (file: File) => {
    if (!file || !board) return
    setCoverUploading(true)
    setCoverProgress(0)

    let compressed: File = file
    try {
      compressed = await compressImage(file, { maxWidth: 1920, maxHeight: 1200, quality: 0.85 })
    } catch {
      /* fallback */
    }

    const form = new FormData()
    form.append('file', compressed)
    form.append('type', 'cover')

    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${API}/api/website/admin/inspirations/${id}/upload`)
    xhr.withCredentials = true
    xhr.upload.onprogress = e => e.lengthComputable && setCoverProgress(Math.round((e.loaded / e.total) * 100))
    xhr.onload = () => {
      setCoverUploading(false)
      if (xhr.status === 200) {
        const res = JSON.parse(xhr.responseText)
        setBoard((prev: any) => ({ ...prev, cover_image_url: res.url }))
      } else {
        alert('Cover upload failed')
      }
    }
    xhr.onerror = () => {
      setCoverUploading(false)
      alert('Cover upload failed')
    }
    xhr.send(form)
  }

  const uploadPhotosBatch = async (files: FileList | File[]) => {
    if (!files || files.length === 0 || !board) return
    setPhotosUploading(true)
    setPhotosProgress(0)

    const fileArray = Array.from(files)
    let completed = 0

    for (const rawFile of fileArray) {
      let compressed = rawFile
      try {
        compressed = await compressImage(rawFile, { maxWidth: 1920, maxHeight: 1920, quality: 0.84 })
      } catch {
        /* fallback */
      }

      const form = new FormData()
      form.append('file', compressed)
      form.append('type', 'photo')

      await new Promise<void>((resolve) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', `${API}/api/website/admin/inspirations/${id}/upload`)
        xhr.withCredentials = true
        xhr.onload = () => {
          if (xhr.status === 200) {
            const res = JSON.parse(xhr.responseText)
            if (res.photo) {
              setPhotos(prev => [...prev, res.photo])
            }
          }
          completed += 1
          setPhotosProgress(Math.round((completed / fileArray.length) * 100))
          resolve()
        }
        xhr.onerror = () => {
          completed += 1
          setPhotosProgress(Math.round((completed / fileArray.length) * 100))
          resolve()
        }
        xhr.send(form)
      })
    }

    setPhotosUploading(false)
  }

  const handleDeletePhoto = async (photoId: number) => {
    if (!confirm('Delete this photo from inspiration collection?')) return
    try {
      await apiFetch(`/api/website/admin/inspirations/${id}/photos/${photoId}`, { method: 'DELETE' })
      setPhotos(prev => prev.filter(p => p.id !== photoId))
    } catch {
      alert('Failed to delete photo')
    }
  }

  const handlePhotoDrop = async (targetId: number) => {
    if (!draggingId || draggingId === targetId) return setDraggingId(null)
    const idxCurrent = photos.findIndex(p => p.id === draggingId)
    const idxTarget = photos.findIndex(p => p.id === targetId)
    if (idxCurrent === -1 || idxTarget === -1) return setDraggingId(null)

    const updated = [...photos]
    const [moved] = updated.splice(idxCurrent, 1)
    updated.splice(idxTarget, 0, moved)
    updated.forEach((p, i) => (p.display_order = i))
    setPhotos(updated)
    setDraggingId(null)

    try {
      await apiFetch(`/api/website/admin/inspirations/${id}/photos/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: updated.map(p => ({ id: p.id, display_order: p.display_order })) }),
      })
    } catch {
      fetchBoardDetails()
    }
  }

  if (!board) {
    return <p style={{ padding: '2rem', color: '#8c867e' }}>Loading board details...</p>
  }

  return (
    <div style={{ maxWidth: '1000px', marginBottom: '6rem' }}>
      {/* Top Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => router.push('/admin/inspirations')}
            className="admin-btn admin-btn-secondary"
            style={{ padding: '0.4rem 0.875rem' }}
          >
            ← Back to Inspirations
          </button>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 400, color: '#1c1a18' }}>
            Editing: {board.title}
          </h1>
        </div>

        <button
          onClick={handleSaveMetadata}
          disabled={saving}
          className="admin-btn admin-btn-primary"
          style={{ padding: '0.625rem 1.5rem' }}
        >
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Details'}
        </button>
      </div>

      {/* R2 Path Notice */}
      <div style={{ padding: '0.875rem 1.25rem', background: '#fff', border: '1px solid #ece9e4', borderRadius: '8px', marginBottom: '2rem' }}>
        <p style={{ fontSize: '0.75rem', color: '#8c867e' }}>
          ☁️ <strong>Cloudflare R2 Bucket Directory:</strong> <code style={{ color: '#9a7d52', background: '#f7f6f4', padding: '2px 6px', borderRadius: '4px' }}>website/inspirations/{board.slug}</code>
        </p>
      </div>

      {/* Metadata Section */}
      <div className="admin-card" style={{ marginBottom: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: '#1c1a18' }}>Collection Details</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.75rem', color: '#8c867e', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Title</label>
            <input
              className="admin-input"
              value={board.title || ''}
              onChange={e => setBoard({ ...board, title: e.target.value })}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', color: '#8c867e', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Slug (R2 Folder Name)</label>
            <input
              className="admin-input"
              value={board.slug || ''}
              onChange={e => setBoard({ ...board, slug: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label style={{ fontSize: '0.75rem', color: '#8c867e', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Subtitle</label>
          <input
            className="admin-input"
            value={board.subtitle || ''}
            onChange={e => setBoard({ ...board, subtitle: e.target.value })}
          />
        </div>

        <div>
          <label style={{ fontSize: '0.75rem', color: '#8c867e', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Description</label>
          <textarea
            className="admin-input"
            rows={3}
            value={board.description || ''}
            onChange={e => setBoard({ ...board, description: e.target.value })}
            style={{ padding: '0.75rem 1rem' }}
          />
        </div>
      </div>

      {/* Cover Image Upload */}
      <div className="admin-card" style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: '#1c1a18', marginBottom: '0.25rem' }}>
          Cover Image
        </h2>
        <p style={{ fontSize: '0.75rem', color: '#8c867e', marginBottom: '1rem' }}>
          Appears as the main card image in the mobile app Inspirations grid.
        </p>

        <div
          onClick={() => coverInputRef.current?.click()}
          style={{
            width: '100%',
            height: '200px',
            borderRadius: '10px',
            border: '1px dashed #e5e1da',
            background: '#fcfbf9',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          {board.cover_image_url ? (
            <img src={board.cover_image_url} alt="Cover" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : null}

          <div style={{ position: 'relative', zIndex: 2, background: 'rgba(255,255,255,0.92)', padding: '0.625rem 1.25rem', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.8125rem', color: '#1c1a18', fontWeight: 600 }}>
              {board.cover_image_url ? 'Click or drag file to replace cover image' : 'Upload Cover Image'}
            </span>
          </div>

          {coverUploading && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(28,26,24,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
              <span style={{ color: '#fff', fontSize: '0.75rem', fontWeight: 500 }}>Uploading Cover {coverProgress}%</span>
            </div>
          )}
        </div>

        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={e => e.target.files?.[0] && uploadCoverImage(e.target.files[0])}
        />
      </div>

      {/* Board Photos Section */}
      <div className="admin-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: '#1c1a18' }}>
              Collection Photos ({photos.length})
            </h2>
            <p style={{ fontSize: '0.75rem', color: '#8c867e', marginTop: '0.15rem' }}>
              Drag to reorder photos. Uploaded photos are auto-optimized and saved directly to R2.
            </p>
          </div>

          <button
            onClick={() => photosInputRef.current?.click()}
            disabled={photosUploading}
            className="admin-btn admin-btn-primary"
          >
            {photosUploading ? `Uploading (${photosProgress}%)` : '+ Upload Photos'}
          </button>

          <input
            ref={photosInputRef}
            type="file"
            multiple
            accept="image/*"
            style={{ display: 'none' }}
            onChange={e => e.target.files && uploadPhotosBatch(e.target.files)}
          />
        </div>

        {photos.length === 0 ? (
          <div
            onClick={() => photosInputRef.current?.click()}
            style={{
              padding: '3rem 2rem',
              border: '2px dashed #e5e1da',
              borderRadius: '10px',
              textAlign: 'center',
              cursor: 'pointer',
              background: '#fcfbf9',
            }}
          >
            <p style={{ fontSize: '0.875rem', color: '#1c1a18', fontWeight: 600 }}>No photos added to this inspiration board yet.</p>
            <p style={{ fontSize: '0.75rem', color: '#8c867e', marginTop: '0.25rem' }}>Click here to select and upload inspiration photos in bulk.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
            {photos.map(photo => (
              <div
                key={photo.id}
                draggable
                onDragStart={() => setDraggingId(photo.id)}
                onDragOver={e => e.preventDefault()}
                onDrop={() => handlePhotoDrop(photo.id)}
                style={{
                  position: 'relative',
                  aspectRatio: '3/4',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  background: '#f5f5f5',
                  border: draggingId === photo.id ? '2px solid #9a7d52' : '1px solid #ece9e4',
                  opacity: draggingId === photo.id ? 0.4 : 1,
                  cursor: 'grab',
                }}
              >
                <img src={photo.file_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button
                  onClick={() => handleDeletePhoto(photo.id)}
                  style={{
                    position: 'absolute',
                    top: '6px',
                    right: '6px',
                    background: 'rgba(239, 68, 68, 0.9)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
