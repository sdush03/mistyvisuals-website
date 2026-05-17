import type { Metadata, Viewport } from 'next'
import './globals.css'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3002'),
  title: { default: 'Misty Visuals — Wedding Photography & Films', template: '%s | Misty Visuals' },
  description: 'Luxury wedding photography and cinematic films across India and worldwide. Soft editorial. Emotional. Timeless.',
  openGraph: {
    siteName: 'Misty Visuals',
    type: 'website',
    locale: 'en_IN',
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#f0eeeb',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        {children}
        <Footer />
      </body>
    </html>
  )
}

