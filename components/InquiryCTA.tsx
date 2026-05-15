import Link from 'next/link'

interface Props {
  headline?: string
  subline?: string
  bgImage?: string
}

export default function InquiryCTA({
  headline = "Let's Connect",
  subline = 'I look forward to hearing from you and helping you create memories that will last a lifetime.',
  bgImage,
}: Props) {
  return (
    <section style={{
      position: 'relative',
      minHeight: '520px',
      overflow: 'hidden',
      background: 'var(--ink)',
      display: 'flex',
      alignItems: 'flex-end',
    }}>
      {/* Full-bleed background image */}
      {bgImage && (
        <>
          <img
            src={bgImage}
            alt=""
            aria-hidden
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'cover', objectPosition: 'center',
            }}
          />
          {/* Very light scrim */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(10,8,6,0.42)',
          }} />
        </>
      )}

      {/* Content — Morgan Wells layout: text left, button right */}
      <div style={{
        position: 'relative',
        width: '100%',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: '2rem',
        padding: 'clamp(3rem,8vh,6rem) var(--page-x)',
        flexWrap: 'wrap',
      }}>
        {/* Left: headline + subline */}
        <div>
          <h2 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(3rem, 7vw, 6rem)',
            fontWeight: 300,
            color: '#fff',
            lineHeight: 0.95,
            letterSpacing: '0.03em',
            marginBottom: '1.25rem',
          }}>
            {headline}
          </h2>
          <p style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.625rem',
            fontWeight: 300,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.5)',
            maxWidth: '36ch',
            lineHeight: 1.9,
          }}>
            {subline}
          </p>
        </div>

        {/* Right: GET IN TOUCH button — Morgan style */}
        <Link href="/contact" className="cta-btn">
          Get In Touch
        </Link>
      </div>

      <style>{`
        .cta-btn {
          font-family: var(--font-sans);
          font-size: 0.5875rem;
          font-weight: 300;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.75);
          border: 1px solid rgba(255,255,255,0.35);
          padding: 0.875rem 1.875rem;
          text-decoration: none;
          white-space: nowrap;
          align-self: flex-end;
          transition: color 0.3s ease, border-color 0.3s ease;
        }
        .cta-btn:hover {
          color: #fff;
          border-color: rgba(255,255,255,0.8);
        }
      `}</style>
    </section>
  )
}
