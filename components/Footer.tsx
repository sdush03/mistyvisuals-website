'use client'

import { usePathname } from 'next/navigation'
import InstagramFeed from './InstagramFeed'

export default function Footer() {
  const pathname = usePathname()

  // Hide footer entirely on admin routes
  if (pathname?.startsWith('/admin')) {
    return null
  }

  return (
    <footer style={{ background: 'var(--linen)' }}>
      <InstagramFeed />

      <div style={{
        padding: 'clamp(2rem,4vh,3rem) var(--page-x)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <span style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '0.5rem',
          fontWeight: 300,
          letterSpacing: '0.28em',
          textTransform: 'uppercase',
          color: 'var(--ink-light)',
        }}>
          © {new Date().getFullYear()} Misty Visuals
        </span>
        <span style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '0.5rem',
          fontWeight: 300,
          letterSpacing: '0.28em',
          textTransform: 'uppercase',
          color: 'var(--ink-light)',
        }}>
          Photography &amp; Films
        </span>
      </div>
    </footer>
  )
}
