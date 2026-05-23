'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export default function AnalyticsTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const lastTracked = useRef<string>('')

  // 1. Automatic Page View Tracking
  useEffect(() => {
    if (!pathname) return

    // Avoid double tracking in React Dev Mode / StrictMode
    const fullPath = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')
    if (lastTracked.current === fullPath) return
    lastTracked.current = fullPath

    // Ignore admin operations and api queries to protect statistics integrity
    if (pathname.startsWith('/admin') || pathname.startsWith('/api')) {
      return
    }

    const referrer = typeof document !== 'undefined' ? document.referrer : ''

    // Extract UTM campaign parameters from query string
    const utmSource = searchParams?.get('utm_source') || ''
    const utmMedium = searchParams?.get('utm_medium') || ''
    const utmCampaign = searchParams?.get('utm_campaign') || ''

    // Asynchronously log the page visit
    fetch('/api/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'pageview',
        path: pathname,
        referrer: referrer || null,
        utmSource: utmSource || null,
        utmMedium: utmMedium || null,
        utmCampaign: utmCampaign || null,
      }),
      keepalive: true, // Keep connection open if navigating away quickly
    }).catch((err) => {
      // Fail silently to prevent console pollution in client
    })
  }, [pathname, searchParams])

  // 2. Register Global Custom Event Tracker Helper
  useEffect(() => {
    if (typeof window !== 'undefined') {
      ;(window as any).trackEvent = (eventName: string, eventData?: Record<string, any>) => {
        fetch('/api/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'event',
            eventName,
            eventData: eventData || {},
          }),
          keepalive: true,
        }).catch(() => {
          // Fail silently
        })
      }
    }
  }, [])

  return null
}

// Declarative helper for typing custom event logs in other parts of the application
export function trackCustomEvent(name: string, data?: Record<string, any>) {
  if (typeof window !== 'undefined' && (window as any).trackEvent) {
    (window as any).trackEvent(name, data)
  }
}
