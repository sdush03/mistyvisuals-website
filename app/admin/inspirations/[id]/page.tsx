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

  // Uploading & Drag active states
  const [uploadingTarget, setUploadingTarget] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragOverZone, setDragOverZone] = useState<string | null>(null)

  const [draggingPhotoId, setDraggingPhotoId] = useState<number | null>(null)

  const desktopInputRef = useRef<HTMLInputElement>(null)
  const mobileInputRef = useRef<HTMLInputElement>(null)
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

  const uploadCoverImage = async (file: File, type: 'desktop' | 'mobile') => {
    if (!file || !board) return
    setUploadingTarget(`cover-${type}`)
    setUploadProgress(0)

    let compressed: File = file
    try {
      compressed = await compressImage(file, {
        maxWidth: type === 'mobile' ? 900 : 1920,
        maxHeight: type === 'mobile' ? 1400 : 1200,
        quality: 0.85,
      })
    } catch {
      /* fallback */
    }

    const form = new FormData()
    form.append('file', compressed)
    form.append('type', type)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${API}/api/website/admin/inspirations/${id}/upload`)
    xhr.withCredentials = true
    xhr.upload.onprogress = e => e.lengthComputable && setUploadProgress(Math.round((e.loaded / e.total) * 100))
    xhr.onload = () => {
      setUploadingTarget(null)
      if (xhr.status === 200) {
        const res = JSON.parse(xhr.responseText)
        if (type === 'mobile') {
          setBoard((prev: any) => ({ ...prev, cover_image_mobile_url: res.url }))
        } else {
          setBoard((prev: any) => ({ ...prev, cover_image_url: res.url }))
        }
      } else {
        alert('Cover upload failed')
      }
    }
    xhr.onerror = () => {
      setUploadingTarget(null)
      alert('Cover upload failed')
    }
    xhr.send(form)
  }

  const uploadPhotosBatch = async (files: FileList | File[]) => {
    if (!files || files.length === 0 || !board) return
    setUploadingTarget('photos')
    setUploadProgress(0)

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
          setUploadProgress(Math.round((completed / fileArray.length) * 100))
          resolve()
        }
        xhr.onerror = () => {
          completed += 1
          setUploadProgress(Math.round((completed / fileArray.length) * 100))
          resolve()
        }
        xhr.send(form)
      })
    }

    setUploadingTarget(null)
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

  const handlePhotoDragOver = (targetId: number) => {
    if (!draggingPhotoId || draggingPhotoId === targetId) return
    const idxCurrent = photos.findIndex(p => p.id === draggingPhotoId)
    const idxTarget = photos.findIndex(p => p.id === targetId)
    if (idxCurrent === -1 || idxTarget === -1) return

    const updated = [...photos]
    const [moved] = updated.splice(idxCurrent, 1)
    updated.splice(idxTarget, 0, moved)
    updated.forEach((p, i) => (p.display_order = i))
    setPhotos(updated)
  }

  const handlePhotoDragEnd = async () => {
    if (!draggingPhotoId) return
    setDraggingPhotoId(null)
    try {
      await apiFetch(`/api/website/admin/inspirations/${id}/photos/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: photos.map((p, i) => ({ id: p.id, display_order: i })) }),
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

      {/* Cover Settings — Horizontal & Vertical Covers (Matching Screenshot 2) */}
      <div className="admin-card" style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: '#1c1a18', marginBottom: '0.25rem' }}>
          Cover Settings
        </h2>
        <p style={{ fontSize: '0.75rem', color: '#8c867e', marginBottom: '1.5rem' }}>
          Set optimized landscape covers for wide-screen viewports, and portrait layouts for mobile screens. Drag & drop files directly onto any cover box to update.
        </p>

        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {/* 1. Desktop / Landscape Cover (3x2 Aspect Ratio) */}
          <div style={{ flex: 1, minWidth: '260px', maxWidth: '380px' }}>
            <span style={{ fontSize: '0.6875rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1c1a18', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
              DESKTOP BANNER (3x2 LANDSCAPE)
            </span>
            <p style={{ fontSize: '0.7rem', color: '#8c867e', marginBottom: '0.75rem' }}>
              Wide 3:2 landscape cover for web & wide cards
            </p>

            <div
              onClick={() => desktopInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOverZone('desktop'); }}
              onDragLeave={e => { e.preventDefault(); setDragOverZone(null); }}
              onDrop={e => {
                e.preventDefault()
                setDragOverZone(null)
                if (e.dataTransfer.files?.[0]) uploadCoverImage(e.dataTransfer.files[0], 'desktop')
              }}
              style={{
                width: '100%',
                aspectRatio: '3/2',
                borderRadius: '10px',
                border: dragOverZone === 'desktop' ? '2px solid #9a7d52' : '1px dashed #e5e1da',
                background: '#fcfbf9',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {board.cover_image_url ? (
                <img src={board.cover_image_url} alt="Desktop Cover" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : null}

              <div style={{ position: 'relative', zIndex: 2, background: 'rgba(255,255,255,0.92)', padding: '0.5rem 1rem', borderRadius: '6px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#1c1a18', fontWeight: 600 }}>
                  {board.cover_image_url ? 'Click or drag file to replace 3x2 cover' : 'Upload 3x2 Cover'}
                </span>
              </div>

              {uploadingTarget === 'cover-desktop' && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(28,26,24,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                  <span style={{ color: '#fff', fontSize: '0.75rem', fontWeight: 500 }}>Uploading 3x2 {uploadProgress}%</span>
                </div>
              )}
            </div>

            <input
              ref={desktopInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={e => e.target.files?.[0] && uploadCoverImage(e.target.files[0], 'desktop')}
            />
          </div>

          {/* 2. Mobile / Portrait Cover (9x16 Aspect Ratio) */}
          <div style={{ flex: 1, minWidth: '180px', maxWidth: '240px' }}>
            <span style={{ fontSize: '0.6875rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1c1a18', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
              MOBILE BANNER (9x16 PORTRAIT)
            </span>
            <p style={{ fontSize: '0.7rem', color: '#8c867e', marginBottom: '0.75rem' }}>
              Tall 9:16 portrait banner displayed on mobile screens
            </p>

            <div
              onClick={() => mobileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOverZone('mobile'); }}
              onDragLeave={e => { e.preventDefault(); setDragOverZone(null); }}
              onDrop={e => {
                e.preventDefault()
                setDragOverZone(null)
                if (e.dataTransfer.files?.[0]) uploadCoverImage(e.dataTransfer.files[0], 'mobile')
              }}
              style={{
                width: '100%',
                aspectRatio: '9/16',
                borderRadius: '10px',
                border: dragOverZone === 'mobile' ? '2px solid #9a7d52' : '1px dashed #e5e1da',
                background: '#fcfbf9',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {board.cover_image_mobile_url ? (
                <img src={board.cover_image_mobile_url} alt="Mobile Cover" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : null}

              <div style={{ position: 'relative', zIndex: 2, background: 'rgba(255,255,255,0.92)', padding: '0.5rem 1rem', borderRadius: '6px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#1c1a18', fontWeight: 600 }}>
                  {board.cover_image_mobile_url ? 'Click or drag file to replace 9x16 cover' : 'Upload 9x16 Cover'}
                </span>
              </div>

              {uploadingTarget === 'cover-mobile' && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(28,26,24,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                  <span style={{ color: '#fff', fontSize: '0.75rem', fontWeight: 500 }}>Uploading 9x16 {uploadProgress}%</span>
                </div>
              )}
            </div>

            <input
              ref={mobileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={e => e.target.files?.[0] && uploadCoverImage(e.target.files[0], 'mobile')}
            />
          </div>
        </div>
      </div>

      {/* Board Photos Section — Supports Drag & Drop Desktop Files into Grid */}
      <div className="admin-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: '#1c1a18' }}>
              Collection Photos ({photos.length})
            </h2>
            <p style={{ fontSize: '0.75rem', color: '#8c867e', marginTop: '0.15rem' }}>
              Drag files from your computer to upload, or drag thumbnails to reorder photos.
            </p>
          </div>

          <button
            onClick={() => photosInputRef.current?.click()}
            disabled={uploadingTarget === 'photos'}
            className="admin-btn admin-btn-primary"
          >
            {uploadingTarget === 'photos' ? `Uploading (${uploadProgress}%)` : '+ Upload Photos'}
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

        {/* Drop Zone Area for Desktop File Dragging */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOverZone('photos-area'); }}
          onDragLeave={e => { e.preventDefault(); setDragOverZone(null); }}
          onDrop={e => {
            e.preventDefault()
            setDragOverZone(null)
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              uploadPhotosBatch(e.dataTransfer.files)
            }
          }}
          style={{
            padding: photos.length === 0 ? '3rem 2rem' : '1rem',
            border: dragOverZone === 'photos-area' ? '2px dashed #9a7d52' : photos.length === 0 ? '2px dashed #e5e1da' : '1px solid transparent',
            borderRadius: '10px',
            background: dragOverZone === 'photos-area' ? '#fbf8f3' : photos.length === 0 ? '#fcfbf9' : 'transparent',
            transition: 'all 0.2s',
          }}
        >
          {photos.length === 0 ? (
            <div
              onClick={() => photosInputRef.current?.click()}
              style={{ textAlign: 'center', cursor: 'pointer' }}
            >
              <p style={{ fontSize: '0.875rem', color: '#1c1a18', fontWeight: 600 }}>No photos added to this inspiration board yet.</p>
              <p style={{ fontSize: '0.75rem', color: '#8c867e', marginTop: '0.25rem' }}>Click or drag files here to select and upload inspiration photos in bulk.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
              {photos.map(photo => (
                <div
                  key={photo.id}
                  draggable
                  onDragStart={() => setDraggingPhotoId(photo.id)}
                  onDragOver={e => {
                    e.preventDefault()
                    if (draggingPhotoId !== null && draggingPhotoId !== photo.id) {
                      handlePhotoDragOver(photo.id)
                    }
                  }}
                  onDragEnd={handlePhotoDragEnd}
                  style={{
                    position: 'relative',
                    aspectRatio: '3/4',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    background: '#f5f5f5',
                    border: draggingPhotoId === photo.id ? '2px solid #9a7d52' : '1px solid #ece9e4',
                    opacity: draggingPhotoId === photo.id ? 0.4 : 1,
                    cursor: 'grab',
                    transition: 'transform 0.15s ease, opacity 0.15s ease',
                  }}
                >
                  <img src={photo.file_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />
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
    </div>
  )
}
