'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import InstagramFeed from './InstagramFeed'

export default function Footer() {
  const pathname = usePathname()

  if (pathname?.startsWith('/admin')) return null

  return (
    <footer style={{ background: 'var(--linen)' }}>
      <InstagramFeed />

      {/* ── Main Footer ── */}
      <div style={{
        borderTop: '1px solid var(--border)',
        padding: 'clamp(3rem,6vh,5rem) var(--page-x) clamp(2rem,4vh,3rem)',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 1fr',
          gap: 'clamp(2rem,4vw,4rem)',
          marginBottom: 'clamp(2.5rem,5vh,4rem)',
        }} className="footer-grid">

          {/* Brand column */}
          <div>
            <p style={{
              fontFamily: '"Futura", "Trebuchet MS", Arial, sans-serif',
              fontSize: 'clamp(1rem,1.6vw,1.375rem)',
              fontWeight: 400,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--ink)',
              marginBottom: '1rem',
            }}>
              Misty Visuals
            </p>
            <p style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.5625rem',
              fontWeight: 300,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--ink-mid)',
              lineHeight: 1.8,
              marginBottom: '1.5rem',
            }}>
              Luxury Wedding Photography<br />& Cinematic Films
            </p>
            <p style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.75rem',
              fontWeight: 300,
              color: 'var(--ink-mid)',
              lineHeight: 1.8,
              maxWidth: '30ch',
            }}>
              Misty Visuals specialises in luxury wedding photography and cinematic wedding films across Delhi, Mumbai, Jaipur, Udaipur, and destination weddings worldwide.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <p style={colHeading}>Navigate</p>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {[
                ['Home', '/'],
                ['Portfolio', '/stories'],
                ['Films', '/films'],
                ['Testimonials', '/#testimonials'],
                ['About', '/about'],
                ['Enquire', '/contact'],
              ].map(([label, href]) => (
                <Link key={href} href={href} style={navLink}>{label}</Link>
              ))}
            </nav>
          </div>

          {/* Contact */}
          <div>
            <p style={colHeading}>Contact</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <a href="mailto:hello@mistyvisuals.com" style={navLink}>hello@mistyvisuals.com</a>
              <a href="tel:+917560008899" style={navLink}>+91 7560008899</a>
              <span style={{ ...navLink, cursor: 'default' }}>Delhi, India</span>
              <span style={{ ...navLink, cursor: 'default' }}>Available Worldwide</span>
            </div>
          </div>

          {/* Social */}
          <div>
            <p style={colHeading}>Follow</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <a href="https://www.instagram.com/weddingsbymistyvisuals" target="_blank" rel="noopener noreferrer" style={navLink}>
                Instagram
              </a>
              <a href="https://www.youtube.com/@weddingsbymistyvisuals" target="_blank" rel="noopener noreferrer" style={navLink}>
                YouTube
              </a>
            </div>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div style={{
          borderTop: '1px solid var(--border)',
          paddingTop: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}>
          <span style={tiny}>© {new Date().getFullYear()} Misty Visuals. All rights reserved.</span>
          <span style={tiny}>Photography & Films · India & Worldwide</span>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 500px) {
          .footer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </footer>
  )
}

const colHeading: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: '0.5rem',
  fontWeight: 500,
  letterSpacing: '0.28em',
  textTransform: 'uppercase',
  color: 'var(--ink)',
  marginBottom: '1.25rem',
}

const navLink: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: '0.75rem',
  fontWeight: 300,
  letterSpacing: '0.04em',
  color: 'var(--ink-mid)',
  textDecoration: 'none',
  transition: 'color 0.2s ease',
}

const tiny: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: '0.5rem',
  fontWeight: 300,
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: 'var(--ink-mid)',
}
