import { query } from '@/lib/db'
import { 
  Users, 
  Eye, 
  Activity, 
  Layers, 
  Globe, 
  Compass, 
  Smartphone, 
  MousePointer 
} from 'lucide-react'

export const dynamic = 'force-dynamic'

interface DBCountRow {
  count: string
}

interface PathRow {
  path: string
  views: string
  visitors: string
}

interface ReferrerRow {
  referrer: string | null
  count: string
}

interface CountryRow {
  country: string
  count: string
}

interface DeviceRow {
  device_type: string
  count: string
}

interface EventRow {
  event_name: string
  count: string
}

interface LiveViewRow {
  id: number
  session_hash: string
  path: string
  referrer: string | null
  country: string
  city: string | null
  browser: string
  os: string
  device_type: string
  created_at: Date
}

export default async function AnalyticsPage() {
  let uniqueVisitors = 0
  let totalPageViews = 0
  let topPaths: PathRow[] = []
  let topReferrers: ReferrerRow[] = []
  let topCountries: CountryRow[] = []
  let deviceStats: DeviceRow[] = []
  let customEvents: EventRow[] = []
  let liveViews: LiveViewRow[] = []
  
  let dbError = false

  try {
    // 1. Fetch Aggregated Metrics
    const uniqueRes = await query('SELECT COUNT(DISTINCT session_hash) as count FROM website_analytics_views')
    uniqueVisitors = parseInt(uniqueRes.rows[0]?.count || '0', 10)

    const viewsRes = await query('SELECT COUNT(*) as count FROM website_analytics_views')
    totalPageViews = parseInt(viewsRes.rows[0]?.count || '0', 10)

    // 2. Fetch Top Performing Paths
    const pathsRes = await query(`
      SELECT path, COUNT(*) as views, COUNT(DISTINCT session_hash) as visitors 
      FROM website_analytics_views 
      GROUP BY path 
      ORDER BY views DESC 
      LIMIT 6
    `)
    topPaths = pathsRes.rows

    // 3. Fetch Top Referral Domains
    const referrersRes = await query(`
      SELECT COALESCE(referrer, 'Direct / Organic') as referrer, COUNT(*) as count 
      FROM website_analytics_views 
      GROUP BY referrer 
      ORDER BY count DESC 
      LIMIT 6
    `)
    topReferrers = referrersRes.rows

    // 4. Fetch Top Countries
    const countriesRes = await query(`
      SELECT country, COUNT(*) as count 
      FROM website_analytics_views 
      GROUP BY country 
      ORDER BY count DESC 
      LIMIT 6
    `)
    topCountries = countriesRes.rows

    // 5. Fetch Device Type Splits
    const devicesRes = await query(`
      SELECT COALESCE(device_type, 'desktop') as device_type, COUNT(*) as count 
      FROM website_analytics_views 
      GROUP BY device_type 
      ORDER BY count DESC
    `)
    deviceStats = devicesRes.rows

    // 6. Fetch Logged Custom Events
    const eventsRes = await query(`
      SELECT event_name, COUNT(*) as count 
      FROM website_analytics_events 
      GROUP BY event_name 
      ORDER BY count DESC 
      LIMIT 6
    `)
    customEvents = eventsRes.rows

    // 7. Fetch Live Log of Last 20 Hits
    const liveRes = await query(`
      SELECT id, session_hash, path, referrer, country, city, browser, os, device_type, created_at 
      FROM website_analytics_views 
      ORDER BY created_at DESC 
      LIMIT 20
    `)
    liveViews = liveRes.rows

  } catch (err) {
    console.error('Error fetching analytics metrics:', err)
    dbError = true
  }

  // Derived metrics calculations
  const avgPagesPerSession = uniqueVisitors > 0 ? (totalPageViews / uniqueVisitors).toFixed(1) : '0.0'
  
  const desktopCount = parseInt(deviceStats.find(d => d.device_type === 'desktop')?.count || '0', 10)
  const mobileCount = parseInt(deviceStats.find(d => d.device_type === 'mobile')?.count || '0', 10)
  const tabletCount = parseInt(deviceStats.find(d => d.device_type === 'tablet')?.count || '0', 10)
  const totalDevices = desktopCount + mobileCount + tabletCount || 1

  const desktopPercent = Math.round((desktopCount / totalDevices) * 100)
  const mobilePercent = Math.round((mobileCount / totalDevices) * 100)
  const tabletPercent = 100 - desktopPercent - mobilePercent

  return (
    <div style={containerStyle}>
      {/* --- Top Header --- */}
      <header style={headerStyle}>
        <div>
          <h1 style={titleStyle}>Website Traction Analytics</h1>
          <p style={subTitleStyle}>Real-time audience monitoring and custom conversion metrics.</p>
        </div>
        <div style={pulseIndicatorContainer}>
          <span style={pulseDot} />
          <span style={pulseLabel}>LIVE MONITOR ACTIVE</span>
        </div>
      </header>

      {dbError && (
        <div style={errorBanner}>
          <p style={errorText}>
            <strong>Database Connection Error:</strong> Unable to retrieve real-time logs. Make sure database migrations have been successfully run.
          </p>
        </div>
      )}

      {/* --- Metric Card Grid --- */}
      <div style={grid4Cols}>
        <div style={kpiCard}>
          <div style={cardHeader}>
            <span style={cardTitle}>Unique Visitors</span>
            <Users size={16} color="#8a8276" />
          </div>
          <div style={cardBody}>
            <h2 style={kpiValue}>{uniqueVisitors.toLocaleString()}</h2>
            <p style={kpiHelp}>Unique daily browser sessions</p>
          </div>
        </div>

        <div style={kpiCard}>
          <div style={cardHeader}>
            <span style={cardTitle}>Total Page Views</span>
            <Eye size={16} color="#8a8276" />
          </div>
          <div style={cardBody}>
            <h2 style={kpiValue}>{totalPageViews.toLocaleString()}</h2>
            <p style={kpiHelp}>Total navigation hits recorded</p>
          </div>
        </div>

        <div style={kpiCard}>
          <div style={cardHeader}>
            <span style={cardTitle}>Engagement Depth</span>
            <Layers size={16} color="#8a8276" />
          </div>
          <div style={cardBody}>
            <h2 style={kpiValue}>{avgPagesPerSession}</h2>
            <p style={kpiHelp}>Average pages viewed per session</p>
          </div>
        </div>

        <div style={kpiCard}>
          <div style={cardHeader}>
            <span style={cardTitle}>Device Distribution</span>
            <Smartphone size={16} color="#8a8276" />
          </div>
          <div style={cardBody}>
            <div style={deviceRatioBarContainer}>
              <div style={{ ...deviceRatioSegment, width: `${desktopPercent}%`, backgroundColor: '#8a8276' }} title={`Desktop: ${desktopPercent}%`} />
              <div style={{ ...deviceRatioSegment, width: `${mobilePercent}%`, backgroundColor: '#c5bcb0' }} title={`Mobile: ${mobilePercent}%`} />
              <div style={{ ...deviceRatioSegment, width: `${tabletPercent}%`, backgroundColor: '#e2ded9' }} title={`Tablet: ${tabletPercent}%`} />
            </div>
            <div style={deviceLegend}>
              <span style={legendItem}><span style={{ ...legendDot, backgroundColor: '#8a8276' }} /> Desk {desktopPercent}%</span>
              <span style={legendItem}><span style={{ ...legendDot, backgroundColor: '#c5bcb0' }} /> Mob {mobilePercent}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- Main 2-Column Split --- */}
      <div style={grid2Cols}>
        {/* Left Side: Pages and Referrers */}
        <div style={paneColumn}>
          {/* Top Pages Pane */}
          <div style={paneCard}>
            <div style={paneHeader}>
              <Compass size={15} style={paneIcon} />
              <h3 style={paneTitle}>Most Popular Content</h3>
            </div>
            <div style={listContainer}>
              {topPaths.length === 0 ? (
                <p style={emptyText}>Waiting for initial page navigation traffic...</p>
              ) : (
                topPaths.map((p, idx) => (
                  <div key={p.path} style={listItem}>
                    <div style={listItemName}>
                      <span style={listIndex}>0{idx + 1}</span>
                      <span style={listLabel} title={p.path}>{p.path}</span>
                    </div>
                    <div style={listItemBadge}>
                      <span style={badgePrimary}>{parseInt(p.views, 10).toLocaleString()} views</span>
                      <span style={badgeSecondary}>{parseInt(p.visitors, 10).toLocaleString()} users</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Traffic Channels Pane */}
          <div style={paneCard}>
            <div style={paneHeader}>
              <Activity size={15} style={paneIcon} />
              <h3 style={paneTitle}>Traffic Acquisition Channels</h3>
            </div>
            <div style={listContainer}>
              {topReferrers.length === 0 ? (
                <p style={emptyText}>No acquisition logs captured yet.</p>
              ) : (
                topReferrers.map((r, idx) => {
                  const referrerStr = r.referrer || 'Direct / Organic'
                  let hostName = referrerStr
                  if (hostName.startsWith('http://') || hostName.startsWith('https://')) {
                    try {
                      hostName = new URL(hostName).hostname
                    } catch {}
                  }
                  return (
                    <div key={referrerStr} style={listItem}>
                      <div style={listItemName}>
                        <span style={listIndex}># {idx + 1}</span>
                        <span style={listLabel} title={referrerStr}>{hostName}</span>
                      </div>
                      <span style={badgePrimary}>{parseInt(r.count, 10).toLocaleString()} sessions</span>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Countries and Actions */}
        <div style={paneColumn}>
          {/* Top Countries Pane */}
          <div style={paneCard}>
            <div style={paneHeader}>
              <Globe size={15} style={paneIcon} />
              <h3 style={paneTitle}>Audience Geographic Spread</h3>
            </div>
            <div style={listContainer}>
              {topCountries.length === 0 ? (
                <p style={emptyText}>Waiting to resolve visitor IP coordinates...</p>
              ) : (
                topCountries.map((c, idx) => (
                  <div key={c.country} style={listItem}>
                    <div style={listItemName}>
                      <span style={globeEmoji}>{c.country === 'Unknown' ? '🌐' : '📍'}</span>
                      <span style={listLabel}>{c.country}</span>
                    </div>
                    <span style={badgePrimary}>{parseInt(c.count, 10).toLocaleString()} hits</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Custom Tracked Events Pane */}
          <div style={paneCard}>
            <div style={paneHeader}>
              <MousePointer size={15} style={paneIcon} />
              <h3 style={paneTitle}>Goal Conversions & Interaction Events</h3>
            </div>
            <div style={listContainer}>
              {customEvents.length === 0 ? (
                <div style={emptyEventState}>
                  <p style={emptyText}>No custom interaction events recorded.</p>
                  <p style={emptyHelp}>Call <code style={codeHelp}>trackCustomEvent("name", data)</code> on key forms or CTAs to start tracking engagement rates!</p>
                </div>
              ) : (
                customEvents.map((e, idx) => (
                  <div key={e.event_name} style={listItem}>
                    <div style={listItemName}>
                      <span style={listIndex}>⚡</span>
                      <span style={listLabel}>{e.event_name}</span>
                    </div>
                    <span style={badgeConversion}>{parseInt(e.count, 10).toLocaleString()} triggers</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- Live Visitor Journey Stream --- */}
      <section style={liveStreamSection}>
        <div style={liveStreamHeader}>
          <div style={liveTitleContainer}>
            <Activity size={16} color="#1c1a18" />
            <h3 style={liveStreamTitle}>Live Visitor Activity Stream</h3>
          </div>
          <p style={liveStreamSub}>Chronological logs of the most recent 20 visitor transactions.</p>
        </div>

        <div style={tableWrapper}>
          <table style={tableStyle}>
            <thead>
              <tr style={tableHeaderRow}>
                <th style={{ ...tableHeaderCell, width: '13%' }}>Timestamp</th>
                <th style={{ ...tableHeaderCell, width: '15%' }}>User Hash</th>
                <th style={{ ...tableHeaderCell, width: '25%' }}>Path Visited</th>
                <th style={{ ...tableHeaderCell, width: '12%' }}>Origin</th>
                <th style={{ ...tableHeaderCell, width: '20%' }}>Referrer</th>
                <th style={{ ...tableHeaderCell, width: '15%' }}>Device & OS</th>
              </tr>
            </thead>
            <tbody>
              {liveViews.length === 0 ? (
                <tr>
                  <td colSpan={6} style={tableEmptyCell}>
                    No page transitions logged in the active buffer. Go visit your website homepage to see live activity populate here!
                  </td>
                </tr>
              ) : (
                liveViews.map((view) => {
                  const localTime = new Date(view.created_at).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true
                  })
                  
                  let displayReferrer = 'Direct Visit'
                  if (view.referrer) {
                    try {
                      displayReferrer = new URL(view.referrer).hostname
                    } catch {
                      displayReferrer = view.referrer
                    }
                  }

                  const hashAbbrev = view.session_hash.slice(0, 10) + '...'

                  return (
                    <tr key={view.id} style={tableRow}>
                      <td style={{ ...tableCell, fontFamily: 'var(--font-sans)', color: '#888' }}>
                        {localTime}
                      </td>
                      <td style={{ ...tableCell, fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: '#8a8276' }}>
                        {hashAbbrev}
                      </td>
                      <td style={{ ...tableCell, fontWeight: 500, color: '#1c1a18' }}>
                        {view.path}
                      </td>
                      <td style={tableCell}>
                        <span style={flagBadge}>
                          {view.country} {view.city ? `(${view.city})` : ''}
                        </span>
                      </td>
                      <td style={{ ...tableCell, color: view.referrer ? '#8a8276' : '#b8b2a8', fontStyle: view.referrer ? 'normal' : 'italic' }}>
                        {displayReferrer}
                      </td>
                      <td style={{ ...tableCell, fontSize: '0.75rem', color: '#666' }}>
                        <span style={deviceTextLabel}>
                          {view.device_type.toUpperCase()} • {view.browser} ({view.os})
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

/* --- Styled Styles --- */

const containerStyle: React.CSSProperties = {
  fontFamily: 'var(--font-sans), system-ui, sans-serif',
  color: '#1c1a18',
  display: 'flex',
  flexDirection: 'column',
  gap: '2rem',
  paddingBottom: '3rem',
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: '1px solid #ece9e4',
  paddingBottom: '1.25rem',
}

const titleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-serif), Georgia, serif',
  fontSize: '1.75rem',
  fontWeight: 400,
  letterSpacing: '0.02em',
  color: '#1c1a18',
  margin: 0,
}

const subTitleStyle: React.CSSProperties = {
  fontSize: '0.8125rem',
  color: '#8a8276',
  marginTop: '0.25rem',
  margin: 0,
}

const pulseIndicatorContainer: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  background: '#fff',
  border: '1px solid #ece9e4',
  padding: '0.5rem 0.875rem',
  borderRadius: '4px',
}

const pulseDot: React.CSSProperties = {
  width: '7px',
  height: '7px',
  borderRadius: '50%',
  backgroundColor: '#a39274',
  boxShadow: '0 0 0 0 rgba(163, 146, 116, 0.4)',
  animation: 'pulse 2s infinite',
}

const pulseLabel: React.CSSProperties = {
  fontSize: '0.625rem',
  fontWeight: 500,
  letterSpacing: '0.1em',
  color: '#8a8276',
}

const errorBanner: React.CSSProperties = {
  background: '#fdf3f2',
  border: '1px solid #f8d7da',
  borderRadius: '4px',
  padding: '0.875rem 1.25rem',
}

const errorText: React.CSSProperties = {
  fontSize: '0.8125rem',
  color: '#721c24',
  margin: 0,
}

const grid4Cols: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
  gap: '1.25rem',
}

const kpiCard: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #ece9e4',
  borderRadius: '6px',
  padding: '1.25rem',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  minHeight: '110px',
  boxShadow: '0 1px 3px rgba(28, 26, 24, 0.02)',
  transition: 'transform 0.2s, box-shadow 0.2s',
}

const cardHeader: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}

const cardTitle: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 500,
  color: '#8a8276',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
}

const cardBody: React.CSSProperties = {
  marginTop: '0.75rem',
}

const kpiValue: React.CSSProperties = {
  fontFamily: 'var(--font-serif), Georgia, serif',
  fontSize: '2rem',
  fontWeight: 400,
  color: '#1c1a18',
  margin: 0,
}

const kpiHelp: React.CSSProperties = {
  fontSize: '0.6875rem',
  color: '#b0a99e',
  marginTop: '0.25rem',
  margin: 0,
}

const deviceRatioBarContainer: React.CSSProperties = {
  display: 'flex',
  height: '8px',
  width: '100%',
  borderRadius: '4px',
  overflow: 'hidden',
  backgroundColor: '#f5f4f0',
  marginTop: '0.5rem',
}

const deviceRatioSegment: React.CSSProperties = {
  height: '100%',
  transition: 'width 0.4s ease',
}

const deviceLegend: React.CSSProperties = {
  display: 'flex',
  gap: '0.75rem',
  marginTop: '0.5rem',
}

const legendItem: React.CSSProperties = {
  fontSize: '0.6875rem',
  color: '#8a8276',
  display: 'flex',
  alignItems: 'center',
  gap: '0.25rem',
}

const legendDot: React.CSSProperties = {
  width: '5px',
  height: '5px',
  borderRadius: '50%',
}

const grid2Cols: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
  gap: '1.5rem',
}

const paneColumn: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem',
}

const paneCard: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #ece9e4',
  borderRadius: '6px',
  padding: '1.5rem',
  boxShadow: '0 1px 3px rgba(28, 26, 24, 0.02)',
}

const paneHeader: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  borderBottom: '1px solid #ece9e4',
  paddingBottom: '0.75rem',
  marginBottom: '1rem',
}

const paneIcon: React.CSSProperties = {
  color: '#8a8276',
}

const paneTitle: React.CSSProperties = {
  fontSize: '0.875rem',
  fontWeight: 500,
  letterSpacing: '0.02em',
  color: '#1c1a18',
  margin: 0,
}

const listContainer: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
}

const listItem: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingBottom: '0.75rem',
  borderBottom: '1px dotted #e2ded9',
}

const listItemName: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.625rem',
  maxWidth: '70%',
}

const listIndex: React.CSSProperties = {
  fontSize: '0.6875rem',
  color: '#c5bcb0',
  fontFamily: 'var(--font-mono), monospace',
}

const listLabel: React.CSSProperties = {
  fontSize: '0.8125rem',
  color: '#444',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}

const globeEmoji: React.CSSProperties = {
  fontSize: '0.875rem',
}

const listItemBadge: React.CSSProperties = {
  display: 'flex',
  gap: '0.375rem',
}

const badgePrimary: React.CSSProperties = {
  fontSize: '0.6875rem',
  background: '#f5f4f0',
  color: '#8a8276',
  padding: '0.125rem 0.5rem',
  borderRadius: '3px',
  fontWeight: 500,
}

const badgeSecondary: React.CSSProperties = {
  fontSize: '0.6875rem',
  background: '#fcfcf9',
  border: '1px solid #ece9e4',
  color: '#b0a99e',
  padding: '0.125rem 0.5rem',
  borderRadius: '3px',
}

const badgeConversion: React.CSSProperties = {
  fontSize: '0.6875rem',
  background: '#eef6f3',
  color: '#2e7d32',
  padding: '0.125rem 0.5rem',
  borderRadius: '3px',
  fontWeight: 500,
}

const emptyEventState: React.CSSProperties = {
  padding: '1rem 0',
  textAlign: 'center',
}

const emptyText: React.CSSProperties = {
  fontSize: '0.75rem',
  color: '#b0a99e',
  textAlign: 'center',
  margin: 0,
}

const emptyHelp: React.CSSProperties = {
  fontSize: '0.6875rem',
  color: '#c5bcb0',
  lineHeight: 1.4,
  marginTop: '0.5rem',
  margin: 0,
}

const codeHelp: React.CSSProperties = {
  background: '#f5f4f0',
  padding: '2px 4px',
  borderRadius: '3px',
  fontFamily: 'monospace',
}

const liveStreamSection: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #ece9e4',
  borderRadius: '6px',
  padding: '1.5rem',
  boxShadow: '0 1px 3px rgba(28, 26, 24, 0.02)',
  marginTop: '0.5rem',
}

const liveStreamHeader: React.CSSProperties = {
  borderBottom: '1px solid #ece9e4',
  paddingBottom: '1rem',
  marginBottom: '1rem',
}

const liveTitleContainer: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
}

const liveStreamTitle: React.CSSProperties = {
  fontFamily: 'var(--font-serif), Georgia, serif',
  fontSize: '1rem',
  fontWeight: 400,
  color: '#1c1a18',
  margin: 0,
}

const liveStreamSub: React.CSSProperties = {
  fontSize: '0.75rem',
  color: '#8a8276',
  marginTop: '0.25rem',
  margin: 0,
}

const tableWrapper: React.CSSProperties = {
  overflowX: 'auto',
}

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  textAlign: 'left',
}

const tableHeaderRow: React.CSSProperties = {
  borderBottom: '1px solid #ece9e4',
}

const tableHeaderCell: React.CSSProperties = {
  fontSize: '0.6875rem',
  fontWeight: 500,
  letterSpacing: '0.05em',
  color: '#8a8276',
  padding: '0.75rem 0.5rem',
  textTransform: 'uppercase',
}

const tableRow: React.CSSProperties = {
  borderBottom: '1px solid #f5f4f0',
  transition: 'background-color 0.2s',
}

const tableCell: React.CSSProperties = {
  fontSize: '0.8125rem',
  padding: '0.875rem 0.5rem',
  verticalAlign: 'middle',
}

const tableEmptyCell: React.CSSProperties = {
  fontSize: '0.75rem',
  color: '#b0a99e',
  textAlign: 'center',
  padding: '2rem 0',
}

const flagBadge: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  backgroundColor: '#f5f4f0',
  padding: '0.125rem 0.375rem',
  borderRadius: '3px',
  fontSize: '0.75rem',
  color: '#444',
}

const deviceTextLabel: React.CSSProperties = {
  backgroundColor: '#fcfcf9',
  border: '1px solid #ece9e4',
  padding: '0.125rem 0.375rem',
  borderRadius: '3px',
  fontSize: '0.6875rem',
  color: '#666',
}
