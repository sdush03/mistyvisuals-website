'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

const ALL_LINKS = [
  ['Home', '/'],
  ['Portfolio', '/stories'],
  ['Films', '/films'],
  ['Testimonials', '/#testimonials'],
  ['About', '/about'],
  ['Enquire', '/contact']
]

export default function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  // Determine if this page has a hero photo at the top
  const isOverlayPage = pathname === '/' || pathname === '/films' || pathname.startsWith('/stories')

  // Story detail pages have their own full-bleed cover — no NavBar needed
  const isStoryDetail = /^\/stories\/.+/.test(pathname || '')
  if (isStoryDetail) return null

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    // Init state in case we load already scrolled
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  // If on an overlay page, we want transparent background and WHITE text.
  // Otherwise (like admin or contact pages), we want light background and BLACK text.
  const isWhiteText = isOverlayPage && !menuOpen

  const navStyle: React.CSSProperties = {
    position: 'absolute', // Reverted to absolute so it stays at the top of the page
    top: 0, left: 0, right: 0,
    zIndex: 100,
    height: 'var(--nav-h)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: !isOverlayPage || menuOpen ? 'rgba(255,255,255,0.98)' : 'transparent',
    backdropFilter: !isOverlayPage || menuOpen ? 'blur(16px)' : 'none',
    borderBottom: 'none',
    transition: 'background 0.4s ease, border-bottom 0.4s ease, backdrop-filter 0.4s ease',
    padding: '1.25rem var(--page-x)',
  }

  const textColor = isWhiteText ? '#ffffff' : 'var(--ink)'
  const subtitleColor = isWhiteText ? 'rgba(255,255,255,0.7)' : 'var(--ink-light)'

  const linkStyle: React.CSSProperties = {
    fontFamily: 'var(--font-sans)',
    fontSize: '0.8125rem', // ~13px
    fontWeight: 400, // Regular weight
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    color: textColor,
    transition: 'color 0.4s ease',
  }

  return (
    <>
      <header style={navStyle}>
        {/* ── Logo (Left) ── */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          <Link href="/" style={{ display: 'inline-flex' }}>
          <Image
            src="/logo-white.png"
            alt="Misty Visuals"
            width={360}
            height={120}
            priority
            style={{
              height: 'clamp(45px, 5.6vw, 68px)',
              width: 'auto',
              // White logo: keep as-is on overlays, invert to black on light bg
              filter: isWhiteText ? 'none' : 'invert(1)',
              transition: 'filter 0.4s ease',
            }}
          />
          </Link>
        </div>

        {/* ── Desktop: right links ── */}
        <nav style={{ display: 'flex', gap: '2.5rem', justifyContent: 'flex-end' }} className="mv-desktop-only">
          {ALL_LINKS.map(([label, href]) => (
            <Link key={href} href={href} style={linkStyle} className="mv-nav-link">
              {label}
            </Link>
          ))}
        </nav>

        {/* ── Mobile: hamburger ── */}
        <button
          className="mv-mobile-only"
          onClick={() => setMenuOpen(o => !o)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', color: textColor, transition: 'color 0.4s ease' }}
        >
          {menuOpen
            ? <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><line x1="2" y1="2" x2="16" y2="16"/><line x1="16" y1="2" x2="2" y2="16"/></svg>
            : <svg width="22" height="14" viewBox="0 0 22 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><line x1="0" y1="1" x2="22" y2="1"/><line x1="0" y1="7" x2="22" y2="7"/><line x1="0" y1="13" x2="22" y2="13"/></svg>
          }
        </button>
      </header>

      {/* ── Mobile menu overlay ── */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 99,
        background: 'var(--linen)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: '2.75rem',
        opacity: menuOpen ? 1 : 0,
        pointerEvents: menuOpen ? 'auto' : 'none',
        transition: 'opacity 0.3s ease',
      }}>
        {ALL_LINKS.map(([label, href]) => (
          <Link
            key={href} href={href}
            onClick={() => setMenuOpen(false)}
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '1.125rem',
              fontWeight: 400, // Regular weight
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'var(--ink)',
            }}
          >
            {label}
          </Link>
        ))}
      </div>

      <style>{`
        .mv-desktop-only { display: flex; }
        .mv-mobile-only  { display: none; }
        /* Add hover effect via CSS opacity to avoid overriding dynamic text color */
        .mv-nav-link:hover { opacity: 0.6; }

        @media (max-width: 767px) {
          .mv-desktop-only { display: none !important; }
          .mv-mobile-only  { display: flex !important; }
        }
      `}</style>
    </>
  )
}
