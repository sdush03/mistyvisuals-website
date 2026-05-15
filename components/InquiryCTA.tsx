import Link from 'next/link'

interface Props {
  headline?: string
  subline?: string
  bgImage?: string
}

export default function InquiryCTA({
  headline = "Let's Connect",
  subline = 'We look forward to hearing from you and helping you create memories that will last a lifetime.',
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
          <h2 className="mv-heading" style={{
            fontSize: '3.5rem',
            color: '#fff',
            marginBottom: '1.25rem',
          }}>
            {headline}
          </h2>
          <p style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.75rem',
            fontWeight: 400,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: '#fff',
            maxWidth: '70ch',
            lineHeight: 1.9,
            marginLeft: '0.25rem', // Slight optical adjustment to align with large headline
          }}>
            {subline}
          </p>
        </div>

        {/* Right: GET IN TOUCH button */}
        <Link href="/contact" className="cta-btn">
          Get In Touch
        </Link>
      </div>

      <style>{`
        .cta-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-family: var(--font-sans);
          font-size: 0.6875rem;
          fontWeight: 400;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #ffffff;
          background: #222;
          padding: 1.25rem 2rem;
          text-decoration: none;
          white-space: nowrap;
          align-self: flex-end;
          transition: background 0.3s ease;
        }
        .cta-btn:hover {
          background: #000;
        }
      `}</style>
    </section>
  )
}
