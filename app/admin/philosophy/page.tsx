'use client'

import { useEffect, useState, useRef } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || ''
const apiFetch = (path: string, init?: RequestInit) =>
  fetch(`${API}${path}`, { credentials: 'include', ...init })

export default function AdminPhilosophyPage() {
  const [content, setContent] = useState<any>({})
  const [uploading, setUploading] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const file1Ref = useRef<HTMLInputElement>(null)
  const file2Ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    apiFetch(`/api/website/sections?t=${Date.now()}`)
      .then(r => r.json())
      .then((rows: any[]) => {
        const phil = rows.find(s => s.key === 'philosophy')
        setContent(phil?.content || {})
      })
      .finally(() => setLoading(false))
  }, [])

  const uploadPhoto = async (file: File, slot: '1' | '2') => {
    setUploading(u => ({ ...u, [slot]: true }))
    const form = new FormData()
    form.append('file', file)
    form.append('slot', slot)
    const r = await apiFetch('/api/website/sections/philosophy/photos', {
      method: 'POST',
      body: form,
    })
    const data = await r.json()
    if (data.content) setContent(data.content)
    setUploading(u => ({ ...u, [slot]: false }))
  }

  const saveText = async () => {
    setSaving(true)
    await apiFetch('/api/website/sections', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sections: [{ key: 'philosophy', content }]
      }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const photoBox = (slot: '1' | '2', label: string, fileRef: React.RefObject<HTMLInputElement | null>) => {
    const url = content[`photo${slot}`]
    const isUploading = uploading[slot]
    return (
      <div>
        <p style={{ fontSize: '0.6875rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#888', marginBottom: '0.5rem' }}>
          {label}
        </p>
        <div style={{
          width: '100%', aspectRatio: '3/4', background: '#f5f5f5',
          border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden',
          position: 'relative', cursor: 'pointer',
        }} onClick={() => fileRef.current?.click()}>
          {url ? (
            <img src={`${url}?t=${Date.now()}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '0.5rem', color: '#bbb' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              <span style={{ fontSize: '0.75rem' }}>Click to upload</span>
            </div>
          )}
          {isUploading && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '0.875rem', color: '#555' }}>Uploading…</span>
            </div>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={e => e.target.files?.[0] && uploadPhoto(e.target.files[0], slot)}
        />
        {url && (
          <button
            onClick={() => setContent((c: any) => ({ ...c, [`photo${slot}`]: null }))}
            style={{ marginTop: '0.5rem', fontSize: '0.6875rem', color: '#e53e3e', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            Remove photo
          </button>
        )}
      </div>
    )
  }

  if (loading) return <p style={{ color: '#aaa', fontSize: '0.875rem' }}>Loading…</p>

  return (
    <div style={{ maxWidth: '760px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 400 }}>Philosophy Section</h1>
          <p style={{ fontSize: '0.875rem', color: '#888', marginTop: '0.25rem' }}>
            Upload 2 editorial photos and customise the heading and text.
          </p>
        </div>
        <button onClick={saveText} disabled={saving} style={{
          background: saved ? '#22c55e' : '#1a1512', color: '#fff', border: 'none',
          borderRadius: '8px', padding: '0.625rem 1.5rem', fontSize: '0.875rem', cursor: 'pointer',
        }}>
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Text'}
        </button>
      </div>

      {/* Photos */}
      <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '1.25rem' }}>Section Photos</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {photoBox('1', 'Small Photo (Left)', file1Ref)}
          {photoBox('2', 'Large Photo (Right)', file2Ref)}
        </div>
        <p style={{ fontSize: '0.6875rem', color: '#bbb', marginTop: '1rem' }}>
          Click a photo to replace it. Images are saved instantly.
        </p>
      </div>

      {/* Text fields */}
      <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: '12px', padding: '1.5rem' }}>
        <h2 style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '1.25rem' }}>Section Text</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ fontSize: '0.6875rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#888', display: 'block', marginBottom: '0.4rem' }}>
              Heading
            </label>
            <input
              value={content.heading || ''}
              onChange={e => setContent((c: any) => ({ ...c, heading: e.target.value }))}
              placeholder="FOR MOMENTS\nTHAT DESERVE\nTO BE FELT AGAIN"
              style={{ width: '100%', padding: '0.625rem 0.875rem', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '0.9375rem' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.6875rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#888', display: 'block', marginBottom: '0.4rem' }}>
              Body Text (separate paragraphs with a blank line)
            </label>
            <textarea
              rows={6}
              value={content.body || ''}
              onChange={e => setContent((c: any) => ({ ...c, body: e.target.value }))}
              placeholder="Every wedding holds moments that can never be recreated..."
              style={{ width: '100%', padding: '0.625rem 0.875rem', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '0.9375rem', resize: 'vertical', lineHeight: 1.7 }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
