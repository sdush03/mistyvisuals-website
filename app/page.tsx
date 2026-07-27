import type { Metadata } from 'next'
import { fetchHomeData } from '@/lib/api'
import NavBar from '@/components/NavBar'
import HeroSection from '@/components/HeroSection'
import FeaturedStories from '@/components/FeaturedStories'
import PhilosophySection from '@/components/PhilosophySection'
import FilmsSection from '@/components/FilmsSection'
import TestimonialsSection from '@/components/TestimonialsSection'
import InquiryCTA from '@/components/InquiryCTA'
import FullBleedVideo from '@/components/FullBleedVideo'
import InstagramFeed from '@/components/InstagramFeed'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  let ogImage = ''

  try {
    const homeData = await fetchHomeData()
    const hero = homeData?.hero
    if (hero) {
      ogImage = hero.media_type === 'image' ? hero.media_url : hero.poster_url || ''
    }
  } catch {}

  const ogUrl = ogImage ? `/api/og/home?img=${encodeURIComponent(ogImage)}` : '/api/og/home'

  return {
    title: 'Weddings by Misty Visuals — Luxury Wedding Photography & Films',
    description: 'Luxury wedding photography and cinematic films by Weddings by Misty Visuals. Creative wedding storytellers based in Gurgaon, India and available worldwide.',
    openGraph: {
      title: 'Weddings by Misty Visuals — Luxury Wedding Photography & Films',
      description: 'Luxury wedding photography and cinematic films by Weddings by Misty Visuals. Creative wedding storytellers based in Gurgaon, India and available worldwide.',
      type: 'website',
      images: [{ url: ogUrl, width: 1200, height: 630, alt: 'Misty Visuals' }],
    },
  }
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

  const SITE_URL = 'https://www.mistyvisuals.com'
  const heroImage = hero 
    ? (hero.media_type === 'image' ? hero.media_url : hero.poster_url || '/philosophy-detail.jpg') 
    : '/philosophy-detail.jpg'
  const absoluteHeroImage = heroImage.startsWith('http') ? heroImage : `${SITE_URL}${heroImage}`

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Misty Visuals",
            "alternateName": [
              "Weddings by Misty Visuals",
              "Misty Visuals Gurgaon",
              "Misty Visuals Photography",
              "Misty Visuals Wedding Films"
            ],
            "url": "https://www.mistyvisuals.com",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://www.mistyvisuals.com/stories?q={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          })
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ProfessionalService",
            "name": "Misty Visuals",
            "alternateName": [
              "Weddings by Misty Visuals",
              "Misty Visuals Gurgaon",
              "Misty Visuals Photography",
              "Misty Visuals Wedding Films"
            ],
            "image": absoluteHeroImage,
            "logo": "https://www.mistyvisuals.com/logo-white.png",
            "url": "https://www.mistyvisuals.com",
            "telephone": "+91-7560008899",
            "email": "info@mistyvisuals.com",
            "priceRange": "$$$$",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "415 Basement, Urban Estate, Sector 40",
              "addressLocality": "Gurugram",
              "addressRegion": "Haryana",
              "postalCode": "122001",
              "addressCountry": "IN"
            },
            "sameAs": [
              "https://www.instagram.com/weddingsbymistyvisuals",
              "https://www.youtube.com/@weddingsbymistyvisuals"
            ]
          })
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            "itemListElement": [
              {
                "@type": "SiteNavigationElement",
                "position": 1,
                "name": "Portfolio",
                "description": "Explore the luxury wedding photography portfolio and love stories by Misty Visuals.",
                "url": "https://www.mistyvisuals.com/stories"
              },
              {
                "@type": "SiteNavigationElement",
                "position": 2,
                "name": "Films",
                "description": "Watch cinematic destination wedding films captured by Weddings by Misty Visuals.",
                "url": "https://www.mistyvisuals.com/films"
              },
              {
                "@type": "SiteNavigationElement",
                "position": 3,
                "name": "Enquire / Contact",
                "description": "Get in touch with us to discuss dates, availability, and pricing packages for your wedding.",
                "url": "https://www.mistyvisuals.com/contact"
              }
            ]
          })
        }}
      />
      <NavBar />
      <main>
        {sections?.filter((s: any) => s.is_visible).map((s: any) => {
          switch (s.key) {
            case 'hero':
              return hero ? <HeroSection key="hero" hero={hero} /> : null
            case 'stories':
              return stories.length > 0 ? <FeaturedStories key="stories" stories={stories} /> : null
            case 'philosophy':
              return (
                <PhilosophySection
                  key="philosophy"
                  photo1={philContent.photo1 || null}
                  photo2={philContent.photo2 || null}
                  heading={philContent.heading || undefined}
                  body={philContent.body || undefined}
                />
              )
            case 'full_bleed_video':
              return <FullBleedVideo key="full_bleed_video" videoUrl={s.content?.videoUrl} mediaType={s.content?.mediaType} />
            case 'films':
              return films.length > 0 ? (
                <FilmsSection 
                  key="films" 
                  films={films} 
                  body="Every love story has a rhythm and a sound that photographs can't quite hold. Our cinematic wedding videography captures your destination wedding exactly as it felt, built to make you feel it all over again."
                />
              ) : null
            case 'testimonials':
              return testimonials.length > 0 ? <TestimonialsSection key="testimonials" testimonials={testimonials} /> : null
            case 'inquiry':
              return <InquiryCTA key="inquiry" bgImage={s.content?.bgHome || s.content?.bgImage} />
            default:
              return null
          }
        })}
      </main>

    </>
  )
}
