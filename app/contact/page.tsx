import type { Metadata } from 'next'
import NavBar from '@/components/NavBar'

export const metadata: Metadata = {
  title: 'Enquire | Misty Visuals',
  description: 'Inquire about luxury wedding photography and films with Misty Visuals.',
}

export default function ContactPage() {
  return (
    <>
      <NavBar />
      <main style={{
        paddingTop: 'var(--nav-h)',
        background: 'var(--linen)',
        minHeight: '100dvh',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          minHeight: `calc(100dvh - var(--nav-h))`,
        }}
          className="contact-grid"
        >
          {/* ── Left — intent text ── */}
          <div style={{
            padding: 'clamp(3rem,8vh,6rem) var(--page-x)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            borderRight: '1px solid var(--border)',
          }}
            className="contact-left"
          >
            <p style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.5rem',
              fontWeight: 300,
              letterSpacing: '0.35em',
              textTransform: 'uppercase',
              color: 'var(--ink-light)',
              marginBottom: '2rem',
            }}>
              Enquire
            </p>
            <h1 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
              fontWeight: 300,
              letterSpacing: '0.04em',
              color: 'var(--ink)',
              lineHeight: 1.05,
              marginBottom: '2rem',
            }}>
              Let&apos;s Begin<br />Your Story
            </h1>
            <p style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.875rem',
              fontWeight: 300,
              lineHeight: 1.9,
              color: 'var(--ink-mid)',
              maxWidth: '36ch',
              marginBottom: '3rem',
            }}>
              Tell us about your wedding and we&apos;ll be in touch within 24 hours. Every inquiry is personal — we read every message.
            </p>

            {/* Details */}
            {[
              ['Email',    'hello@mistyvisuals.com'],
              ['Phone',    '+91 7560008899'],
              ['Based in', 'Delhi, India'],
              ['Available', 'India · Worldwide'],
            ].map(([label, val]) => (
              <div key={label} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '0.625rem 0', borderTop: '1px solid var(--border)',
              }}>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.5875rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--ink-light)', fontWeight: 300 }}>
                  {label}
                </span>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.5875rem', color: 'var(--ink-mid)', fontWeight: 300, letterSpacing: '0.05em' }}>
                  {val}
                </span>
              </div>
            ))}
          </div>

          {/* ── Right — form ── */}
          <div style={{
            padding: 'clamp(3rem,8vh,6rem) var(--page-x)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}>
            <form
              action={`mailto:hello@mistyvisuals.com`}
              method="get"
              style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
            >
              {/* Field helper */}
              {([
                ['Your Name', 'name', 'text', 'Priya & Arjun'],
                ['Email Address', 'email', 'email', 'you@email.com'],
                ['Phone', 'phone', 'tel', '+91 00000 00000'],
                ['Wedding Date', 'date', 'date', ''],
                ['Venue / City', 'venue', 'text', 'Udaipur, Rajasthan'],
              ] as [string, string, string, string][]).map(([label, name, type, ph]) => (
                <div key={name} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.5rem',
                    fontWeight: 300,
                    letterSpacing: '0.3em',
                    textTransform: 'uppercase',
                    color: 'var(--ink-light)',
                  }}>
                    {label}
                  </label>
                  <input
                    type={type} name={name} placeholder={ph}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      borderBottom: '1px solid var(--border)',
                      padding: '0.5rem 0',
                      fontFamily: 'var(--font-sans)',
                      fontSize: '0.9375rem',
                      fontWeight: 300,
                      color: 'var(--ink)',
                      outline: 'none',
                      width: '100%',
                      transition: 'border-color 0.25s ease',
                    }}
                    className="contact-input"
                  />
                </div>
              ))}

              {/* Message */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.5rem', fontWeight: 300,
                  letterSpacing: '0.3em', textTransform: 'uppercase',
                  color: 'var(--ink-light)',
                }}>
                  Your Story
                </label>
                <textarea
                  name="message" rows={3}
                  placeholder="Tell us about your wedding…"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px solid var(--border)',
                    padding: '0.5rem 0',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.9375rem',
                    fontWeight: 300,
                    color: 'var(--ink)',
                    outline: 'none',
                    resize: 'none',
                    width: '100%',
                    transition: 'border-color 0.25s ease',
                  }}
                  className="contact-input"
                />
              </div>

              <button type="submit" style={{
                marginTop: '0.5rem',
                alignSelf: 'flex-start',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.5875rem',
                fontWeight: 300,
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                color: 'var(--ink)',
                background: 'none',
                border: '1px solid var(--ink)',
                padding: '0.875rem 2.25rem',
                cursor: 'pointer',
                transition: 'background 0.3s ease, color 0.3s ease',
              }}
                className="contact-submit"
              >
                Send Inquiry
              </button>
            </form>
          </div>
        </div>
      </main>

      <style>{`
        .contact-input:focus { border-bottom-color: var(--ink) !important; }
        .contact-submit:hover { background: var(--ink) !important; color: var(--linen) !important; }
        @media (max-width: 767px) {
          .contact-grid { grid-template-columns: 1fr !important; }
          .contact-left { border-right: none !important; border-bottom: 1px solid var(--border); }
        }
      `}</style>
    </>
  )
}
