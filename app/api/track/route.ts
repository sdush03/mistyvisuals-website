import { NextRequest, NextResponse, userAgent } from 'next/server'
import crypto from 'crypto'
import { query } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type } = body

    if (!type || (type !== 'pageview' && type !== 'event')) {
      return NextResponse.json({ error: 'Invalid tracking event type' }, { status: 400 })
    }

    // 1. Get Client IP (for hashing, not storage)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
               request.headers.get('x-real-ip') || 
               '127.0.0.1'

    // 2. Parse User Agent details natively
    const ua = userAgent(request)
    const browser = ua.browser.name || 'Unknown Browser'
    const os = ua.os.name || 'Unknown OS'
    const deviceType = ua.device.type || 'desktop' // Default to desktop if null
    const userAgentStr = request.headers.get('user-agent') || ''

    // 3. Generate a stateless, daily-rotating session hash (Plausible-style privacy compliance)
    const todayStr = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
    const hashInput = `${ip}-${userAgentStr}-${todayStr}`
    const sessionHash = crypto.createHash('sha256').update(hashInput).digest('hex')

    // 4. Extract location from proxy/geo headers (Cloudflare, Vercel, or custom Nginx geoip)
    const country = request.headers.get('cf-ipcountry') || 
                    request.headers.get('x-vercel-ip-country') || 
                    request.headers.get('x-country') || 
                    'Unknown'
                    
    const city = request.headers.get('x-vercel-ip-city') || 
                 request.headers.get('x-city') || 
                 null

    if (type === 'pageview') {
      const { path, referrer, utmSource, utmMedium } = body
      if (!path) {
        return NextResponse.json({ error: 'Missing pathname for pageview' }, { status: 400 })
      }

      // Clean path to prevent index differences (e.g. /films/ and /films)
      let cleanedPath = path.trim()
      if (cleanedPath !== '/' && cleanedPath.endsWith('/')) {
        cleanedPath = cleanedPath.slice(0, -1)
      }

      // Enrich referrer using UTM parameter if present (e.g. "instagram (bio)", "whatsapp (chat)")
      let finalReferrer = referrer || null
      if (utmSource) {
        finalReferrer = `${utmSource.toLowerCase()}${utmMedium ? ` (${utmMedium.toLowerCase()})` : ' (campaign)'}`
      }

      // Record page view in DB
      await query(
        `INSERT INTO website_analytics_views 
         (session_hash, path, referrer, country, city, browser, os, device_type)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [sessionHash, cleanedPath, finalReferrer, country, city, browser, os, deviceType]
      )
    } else if (type === 'event') {
      const { eventName, eventData } = body
      if (!eventName) {
        return NextResponse.json({ error: 'Missing event name' }, { status: 400 })
      }

      // Record custom event in DB
      await query(
        `INSERT INTO website_analytics_events 
         (session_hash, event_name, event_data)
         VALUES ($1, $2, $3)`,
        [sessionHash, eventName, JSON.stringify(eventData || {})]
      )
    }

    // Return a lightweight 204 No Content for tracking calls
    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('Analytics tracking endpoint error:', error)
    // Fail silently to client to ensure website layout/load never breaks due to analytics failure
    return new Response(null, { status: 204 })
  }
}
