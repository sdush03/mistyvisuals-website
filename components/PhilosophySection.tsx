import Link from 'next/link'
import Image from 'next/image'

interface Props {
  photo1?: string | null   // small photo (left)
  photo2?: string | null   // large photo (center-right)
  heading?: string
  body?: string
}

export default function PhilosophySection({
  photo1,
  photo2,
  heading = 'FOR MOMENTS\nTHAT DESERVE\nTO BE FELT AGAIN',
  body = "Every wedding holds moments that can never be recreated — the quiet anticipation, fleeting glances, and overwhelming joy shared in between.\n\nThrough thoughtful photographs and films, we preserve not only how your day looked, but how it truly felt with imagery that remains honest, timeless, and deeply personal.",
}: Props) {

  const img1 = photo1 || '/philosophy-detail.jpg'
  const img2 = photo2 || '/philosophy-portrait.jpg'

  return (
    <section className="phil-section" style={{
      background: 'var(--linen)',
      display: 'flex',
      alignItems: 'center',
    }}>
      <div
        style={{
          width: '100%',
          maxWidth: '1400px', // 1350-1450px container
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '2.3fr 3.3fr 4.1fr', // Shrunk center column, expanded text column to move the text left natively
          gap: 'clamp(1rem, 3.5vw, 4.5rem)', // Tightened structural gaps instead of using leftward transforms
          alignItems: 'center', // Vertically centered relative to each other
        }}
        className="phil-grid"
      >

        {/* ── Left Image Column ── */}
        <div style={{
          position: 'relative',
          width: '93%', // Extended width slightly rightwards
          marginRight: 'auto', 
          aspectRatio: '3.1/4.8', // Adjusted ratio to keep height exactly the same
          overflow: 'hidden',
          alignSelf: 'center', 
        }} className="phil-img-small">
          <Image
            src={img1}
            alt="Wedding detail"
            fill
            sizes="20vw"
            style={{ objectFit: 'cover' }}
          />
        </div>

        {/* ── Center Image Column ── */}
        <div style={{
          position: 'relative',
          width: '94%', // Increased 10% (scales both width and height up proportionally)
          aspectRatio: '3/4.5',
          overflow: 'hidden',
          alignSelf: 'center', 
        }} className="phil-img-large">
          <Image
            src={img2}
            alt="Wedding portrait"
            fill
            sizes="35vw"
            style={{ objectFit: 'cover' }}
            priority
          />
        </div>

        {/* ── Right Text Column ── */}
        {/* ── Right Text Column ── */}
        <div className="phil-text-col" style={{ 
          paddingLeft: 'clamp(0rem, 2vw, 2rem)',
        }}>
          {/* Label */}
          <p className="mv-label phil-label" style={{
            color: '#888', // muted gray
            marginBottom: '1.8rem', // Uniform tighter spacing
          }}>
            Our Philosophy
          </p>

          {/* Heading — extremely thin, generous line-height, airy */}
          <h2 className="mv-heading phil-heading" style={{
            color: 'var(--ink)',
            marginBottom: '1.8rem', // Uniform tighter spacing
            maxWidth: '75%', // Force tighter wrapping
            whiteSpace: 'pre-line', // Ensures \n is rendered as new lines
          }}>
            {heading}
          </h2>

          {/* Body text — muted gray, elegant line height */}
          <div className="phil-body-wrapper" style={{ marginBottom: '1.8rem' }}>
            {body.split('\n\n').map((para, i, arr) => (
              <p
                key={i}
                className="mv-body"
                style={{
                  marginBottom: i < arr.length - 1 ? '1.5rem' : 0,
                  maxWidth: '100%', // Allow text to reach right edge
                }}
              >
                {para}
              </p>
            ))}
          </div>

          {/* CTA — black rectangle, white text, exact proportions */}
          <Link href="/about" className="phil-cta" style={{
            display: 'inline-block',
            fontFamily: 'var(--font-sans)',
            fontSize: '0.6875rem',
            fontWeight: 400,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: '#ffffff',
            background: '#222', // Black rectangle
            padding: '1.25rem 2rem', // Reduced horizontal width
            transition: 'background 0.3s ease',
          }}>
            Learn More
          </Link>
        </div>
      </div>

      <style>{`
        .phil-section {
          padding: clamp(6rem, 12vh, 10rem) var(--page-x);
          min-height: 100dvh;
        }
        @media (max-width: 960px) {
          .phil-section {
            padding: 4rem var(--page-x) 1rem;
            min-height: auto;
          }
          .phil-grid {
             grid-template-columns: 1fr 1.3fr !important;
             gap: 1.5rem !important;
             align-items: start !important;
          }
          .phil-text-col { display: contents; }
          .phil-label { grid-column: 1 / -1; grid-row: 1; margin-bottom: 0.5rem !important; }
          .phil-heading { grid-column: 1 / -1; grid-row: 2; max-width: 100% !important; margin-bottom: 2.5rem !important; }
          .phil-img-small { grid-column: 1; grid-row: 3; width: 100% !important; margin: 0 !important; aspect-ratio: 3.1/4.8 !important; }
          .phil-img-large { grid-column: 2; grid-row: 3; width: 100% !important; margin: 0 !important; aspect-ratio: 3/4.5 !important; }
          .phil-body-wrapper { grid-column: 1 / -1; grid-row: 4; margin-top: 1.5rem !important; margin-bottom: 1.5rem !important; }
          .phil-body-wrapper p { text-align: justify !important; text-align-last: left !important; }
          .phil-cta { grid-column: 1 / -1; grid-row: 5; justify-self: center; }
        }
        .phil-cta:hover { background: #000 !important; }
      `}</style>
    </section>
  )
}
