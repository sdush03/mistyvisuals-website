'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

const OS_URL = (() => {
  const raw = process.env.NEXT_PUBLIC_OS_URL
  if (raw && raw.startsWith('http')) return raw
  return 'http://localhost:3000'
})()
const API    = process.env.NEXT_PUBLIC_API_URL || ''

type AuthState = 'checking' | 'ok' | 'unauth' | 'unreachable'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>('checking')
  const router   = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    fetch(`${API}/api/auth/me`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(user => {
        if (user?.role === 'admin') {
          setAuth('ok')
        } else {
          setAuth('unauth')
        }
      })
      .catch(() => setAuth('unreachable'))
  }, [])

  // Redirect to OS login when not authenticated
  useEffect(() => {
    if (auth === 'unauth') {
      window.location.href = `${OS_URL}/login`
    }
  }, [auth])

  /* ── Checking ── */
  if (auth === 'checking') {
    return (
      <div style={overlay}>
        <span style={dot} />
        <p style={label}>Authenticating…</p>
      </div>
    )
  }

  /* ── Backend unreachable — show helpful message ── */
  if (auth === 'unreachable') {
    return (
      <div style={overlay}>
        <div style={{ textAlign: 'center', maxWidth: '380px' }}>
          <p style={{ ...label, marginBottom: '0.75rem' }}>Backend unavailable</p>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8125rem', color: '#888', lineHeight: 1.7, marginBottom: '1.5rem' }}>
            The Misty Visuals backend is not reachable at <code style={{ background: '#f0f0f0', padding: '1px 5px', borderRadius: '3px' }}>{API || 'http://localhost:3001'}</code>.
            <br />Start the backend server and refresh.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{ fontFamily: 'var(--font-sans)', fontSize: '0.625rem', letterSpacing: '0.2em', textTransform: 'uppercase', background: '#1c1a18', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', cursor: 'pointer', borderRadius: '2px' }}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  /* ── Unauth — redirect in progress ── */
  if (auth === 'unauth') {
    return (
      <div style={overlay}>
        <p style={label}>Redirecting to login…</p>
      </div>
    )
  }

  /* ── Authenticated admin ── */
  const navLinks: [string, string][] = [
    ['Hero',         '/admin/hero'],
    ['Stories',      '/admin/stories'],
    ['Films',        '/admin/films'],
    ['Philosophy',   '/admin/philosophy'],
    ['Testimonials', '/admin/testimonials'],
    ['Sections',     '/admin/sections'],
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f7f6f4', display: 'flex' }}>
      {/* ── Sidebar ── */}
      <aside style={{
        width: '210px',
        flexShrink: 0,
        background: '#fff',
        borderRight: '1px solid #ece9e4',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
      }}>
        {/* Brand */}
        <div style={{ padding: '1.5rem 1.375rem 1.25rem', borderBottom: '1px solid #ece9e4' }}>
          <p style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '0.9375rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#1c1a18',
            marginBottom: '2px',
          }}>
            Misty Visuals
          </p>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.5625rem', color: '#b0a99e', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            CMS
          </p>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '0.75rem 0' }}>
          {navLinks.map(([label, href]) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <a
                key={href}
                href={href}
                style={{
                  display: 'block',
                  padding: '0.5625rem 1.375rem',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.75rem',
                  fontWeight: active ? 400 : 300,
                  letterSpacing: '0.06em',
                  color: active ? '#1c1a18' : '#888',
                  background: active ? '#f7f6f4' : 'transparent',
                  textDecoration: 'none',
                  borderLeft: active ? '2px solid #1c1a18' : '2px solid transparent',
                  transition: 'color 0.2s',
                }}
              >
                {label}
              </a>
            )
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: '1rem 1.375rem', borderTop: '1px solid #ece9e4', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <a href="/" target="_blank" rel="noopener" style={{ fontFamily: 'var(--font-sans)', fontSize: '0.625rem', color: '#b0a99e', textDecoration: 'none', letterSpacing: '0.1em' }}>
            View Site ↗
          </a>
          <a href={`${OS_URL}`} target="_blank" rel="noopener" style={{ fontFamily: 'var(--font-sans)', fontSize: '0.625rem', color: '#b0a99e', textDecoration: 'none', letterSpacing: '0.1em' }}>
            OS Dashboard ↗
          </a>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main style={{ flex: 1, padding: '2.5rem', overflow: 'auto', minWidth: 0 }}>
        {children}
      </main>
    </div>
  )
}

/* ── Shared styles ── */
const overlay: React.CSSProperties = {
  minHeight: '100vh',
  background: '#f7f6f4',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.75rem',
}

const dot: React.CSSProperties = {
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  background: '#c8bfb0',
  animation: 'pulse 1.4s ease-in-out infinite',
}

const label: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: '0.625rem',
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: '#b0a99e',
}
