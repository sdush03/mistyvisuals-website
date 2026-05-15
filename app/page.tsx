import type { Metadata } from 'next'
import { fetchHomeData } from '@/lib/api'
import NavBar from '@/components/NavBar'
import HeroSection from '@/components/HeroSection'
import FeaturedStories from '@/components/FeaturedStories'
import PhilosophySection from '@/components/PhilosophySection'
import FilmsSection from '@/components/FilmsSection'
import TestimonialsSection from '@/components/TestimonialsSection'
import InquiryCTA from '@/components/InquiryCTA'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Misty Visuals — Luxury Wedding Photography & Films',
  description: 'Soft editorial luxury wedding photography and cinematic films across India and worldwide.',
  openGraph: {
    title: 'Misty Visuals — Luxury Wedding Photography & Films',
    description: 'Soft editorial luxury wedding photography and cinematic films across India and worldwide.',
    type: 'website',
  },
}

export default async function HomePage() {
  let data: Awaited<ReturnType<typeof fetchHomeData>>
  try {
    data = await fetchHomeData()
  } catch {
    data = { hero: null, stories: [], films: [], testimonials: [], sections: [] }
  }

  const { hero, stories, films, testimonials, sections } = data
  const philSection = sections?.find((s: any) => s.key === 'philosophy')
  const philContent = philSection?.content || {}

  return (
    <>
      <NavBar />
      <main>
        <HeroSection hero={hero} />
        <FeaturedStories stories={stories} />
        <PhilosophySection
          photo1={philContent.photo1 || null}
          photo2={philContent.photo2 || null}
          heading={philContent.heading || undefined}
          body={philContent.body || undefined}
        />
        {films.length > 0 && <FilmsSection films={films} />}
        {testimonials.length > 0 && <TestimonialsSection testimonials={testimonials} />}
        <InquiryCTA />
      </main>

      <footer style={{
        padding: 'clamp(2rem,4vh,3rem) var(--page-x)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        background: 'var(--linen)',
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
      </footer>
    </>
  )
}
