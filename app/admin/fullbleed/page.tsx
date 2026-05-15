'use client'

import { useEffect, useState } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || ''
const apiFetch = (path: string, init?: RequestInit) =>
  fetch(`${API}${path}`, { credentials: 'include', ...init })

export default function AdminFullBleedPage() {
  const [videoUrl, setVideoUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    apiFetch('/api/website/sections')
      .then(r => r.json())
      .then(sections => {
        const fb = sections.find((s: any) => s.key === 'full_bleed_video')
        if (fb?.content?.videoUrl) {
          setVideoUrl(fb.content.videoUrl)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      await apiFetch('/api/website/sections', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sections: [
            { key: 'full_bleed_video', content: { videoUrl } }
          ]
        })
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      console.error(e)
      alert('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p style={{ color: '#888' }}>Loading...</p>

  return (
    <div style={{ maxWidth: '600px' }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 400, marginBottom: '0.5rem' }}>
        Full Bleed Video
      </h1>
      <p style={{ fontSize: '0.875rem', color: '#888', marginBottom: '2rem', lineHeight: 1.6 }}>
        Provide a direct URL to an MP4 or WebM video file to be played seamlessly between sections. 
        We currently support providing a direct video link (e.g. from a cloud storage bucket).
      </p>

      <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e0e0e0', padding: '1.5rem' }}>
        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, letterSpacing: '0.05em', color: '#1a1512', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          Video URL
        </label>
        <input 
          type="url" 
          value={videoUrl}
          onChange={e => setVideoUrl(e.target.value)}
          placeholder="https://.../video.mp4"
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            fontFamily: 'var(--font-sans)',
            fontSize: '0.875rem',
            outline: 'none',
            marginBottom: '1.5rem'
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#1a1512',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.75rem',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1
            }}
          >
            {saving ? 'Saving...' : 'Save Video Link'}
          </button>
          
          {saved && <span style={{ color: '#2ecc71', fontSize: '0.875rem' }}>Saved successfully!</span>}
        </div>
      </div>

      {videoUrl && (
        <div style={{ marginTop: '2rem' }}>
          <p style={{ fontSize: '0.75rem', letterSpacing: '0.05em', color: '#888', textTransform: 'uppercase', marginBottom: '1rem' }}>
            Preview
          </p>
          <video 
            src={videoUrl} 
            autoPlay 
            muted 
            loop 
            playsInline 
            style={{ width: '100%', borderRadius: '8px', background: '#000' }} 
          />
        </div>
      )}
    </div>
  )
}
