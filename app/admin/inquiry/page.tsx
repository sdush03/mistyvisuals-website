'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL || ''
const apiFetch = (path: string, init?: RequestInit) =>
  fetch(`${API}${path}`, { credentials: 'include', ...init })

export default function AdminInquiry() {
  const [uploading, setUploading] = useState(false)
  const router = useRouter()

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    
    try {
      const res = await apiFetch('/api/website/sections/inquiry/bg', {
        method: 'POST',
        body: fd
      })
      if (res.ok) {
        alert('Background updated successfully!')
        router.refresh()
      } else {
        alert('Failed to upload background.')
      }
    } catch (err) {
      console.error(err)
      alert('Error uploading background.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <p style={{ fontSize: '0.625rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#888', marginBottom: '0.5rem' }}>Edit Section</p>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', fontWeight: 300, fontStyle: 'italic', color: '#1a1512' }}>Let's Connect</h1>
      </div>

      <div style={{ maxWidth: '600px', background: '#fff', border: '1px solid #e0e0e0', borderRadius: '4px', padding: '2rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 400, color: '#1a1512', marginBottom: '1rem' }}>Background Image</h2>
        <p style={{ fontSize: '0.8125rem', color: '#888', marginBottom: '1.5rem', lineHeight: 1.6 }}>
          Upload a high-quality background image for the Let's Connect section. It will be automatically optimized.
        </p>
        
        <label style={{ 
          display: 'inline-block',
          cursor: uploading ? 'wait' : 'pointer', 
          fontSize: '0.75rem', 
          textTransform: 'uppercase', 
          letterSpacing: '0.15em', 
          color: uploading ? '#888' : '#1a1512', 
          border: `1px solid ${uploading ? '#ccc' : '#1a1512'}`, 
          padding: '0.75rem 1.5rem', 
          borderRadius: '4px',
          opacity: uploading ? 0.7 : 1
        }}>
          {uploading ? 'Uploading...' : 'Upload Image'}
          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUpload} disabled={uploading} />
        </label>
      </div>
    </div>
  )
}
