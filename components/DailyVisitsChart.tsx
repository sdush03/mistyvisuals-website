'use client'

import { useState } from 'react'

interface DailyData {
  dateStr: string
  label: string
  views: number
  visitors: number
}

interface Props {
  data: DailyData[]
}

export default function DailyVisitsChart({ data }: Props) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null)
  const [chartMode, setChartMode] = useState<'both' | 'views' | 'visitors'>('both')

  if (!data || data.length === 0) {
    return (
      <div style={emptyContainer}>
        <p style={emptyText}>No data available for rendering traction chart.</p>
      </div>
    )
  }

  // Dimension helpers (SVG viewport is 800 x 240)
  const width = 800
  const height = 240
  const paddingX = 40
  const paddingY = 40

  const getX = (index: number) => {
    return paddingX + (index / (data.length - 1)) * (width - paddingX * 2)
  }

  // Calculate scales
  const maxVal = Math.max(...data.map(d => Math.max(d.views, d.visitors)), 10)
  const getY = (val: number) => {
    const usableHeight = height - paddingY * 2
    return height - paddingY - (val / maxVal) * usableHeight
  }

  // Generate Bezier path
  const getBezierPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return ''
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`

    let d = `M ${points[0].x} ${points[0].y}`
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i]
      const next = points[i + 1]
      const cp1x = curr.x + (next.x - curr.x) * 0.35
      const cp1y = curr.y
      const cp2x = curr.x + (next.x - curr.x) * 0.65
      const cp2y = next.y
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`
    }
    return d
  }

  // Points arrays
  const viewsPoints = data.map((d, i) => ({ x: getX(i), y: getY(d.views) }))
  const visitorsPoints = data.map((d, i) => ({ x: getX(i), y: getY(d.visitors) }))

  const viewsPath = getBezierPath(viewsPoints)
  const visitorsPath = getBezierPath(visitorsPoints)

  const viewsArea = viewsPoints.length > 0 
    ? `${viewsPath} L ${viewsPoints[viewsPoints.length - 1].x} ${height - paddingY} L ${viewsPoints[0].x} ${height - paddingY} Z`
    : ''

  const visitorsArea = visitorsPoints.length > 0
    ? `${visitorsPath} L ${visitorsPoints[visitorsPoints.length - 1].x} ${height - paddingY} L ${visitorsPoints[0].x} ${height - paddingY} Z`
    : ''

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const svgX = (e.clientX - rect.left) * (width / rect.width)

    let closestIdx = 0
    let minDist = Infinity
    for (let i = 0; i < data.length; i++) {
      const ptX = getX(i)
      const dist = Math.abs(svgX - ptX)
      if (dist < minDist) {
        minDist = dist
        closestIdx = i
      }
    }
    setActiveIdx(closestIdx)
  }

  const activeData = activeIdx !== null ? data[activeIdx] : null

  return (
    <div style={cardContainer}>
      {/* Chart controls & title */}
      <div style={chartHeader}>
        <div>
          <h3 style={chartTitle}>Daily Audience Activity</h3>
          <p style={chartSub}>Traction over the last 14 days</p>
        </div>
        <div style={btnGroup}>
          <button 
            style={{ ...btnStyle, ...(chartMode === 'both' ? activeBtn : {}) }}
            onClick={() => setChartMode('both')}
          >
            All Traffic
          </button>
          <button 
            style={{ ...btnStyle, ...(chartMode === 'views' ? activeBtn : {}) }}
            onClick={() => setChartMode('views')}
          >
            Views Only
          </button>
          <button 
            style={{ ...btnStyle, ...(chartMode === 'visitors' ? activeBtn : {}) }}
            onClick={() => setChartMode('visitors')}
          >
            Visitors Only
          </button>
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        {/* Main SVG Area */}
        <svg 
          width="100%" 
          height={height} 
          viewBox={`0 0 ${width} ${height}`} 
          style={svgStyle}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setActiveIdx(null)}
        >
          <defs>
            {/* Page views gradient */}
            <linearGradient id="viewsAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a39274" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#a39274" stopOpacity="0.00" />
            </linearGradient>
            
            {/* Visitors gradient */}
            <linearGradient id="visitorsAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8a8276" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#8a8276" stopOpacity="0.00" />
            </linearGradient>
          </defs>

          {/* Grid Lines */}
          <line x1={paddingX} y1={getY(0)} x2={width - paddingX} y2={getY(0)} stroke="#ece9e4" strokeWidth="1" />
          <line x1={paddingX} y1={getY(maxVal / 2)} x2={width - paddingX} y2={getY(maxVal / 2)} stroke="#f5f4f0" strokeWidth="1" strokeDasharray="4 4" />
          <line x1={paddingX} y1={getY(maxVal)} x2={width - paddingX} y2={getY(maxVal)} stroke="#f5f4f0" strokeWidth="1" />

          {/* Render Area fills first */}
          {chartMode !== 'visitors' && (
            <path d={viewsArea} fill="url(#viewsAreaGrad)" />
          )}
          {chartMode !== 'views' && (
            <path d={visitorsArea} fill="url(#visitorsAreaGrad)" />
          )}

          {/* Render Lines */}
          {chartMode !== 'visitors' && (
            <path d={viewsPath} fill="none" stroke="#a39274" strokeWidth="2.5" strokeLinecap="round" />
          )}
          {chartMode !== 'views' && (
            <path d={visitorsPath} fill="none" stroke="#8a8276" strokeWidth="1.5" strokeDasharray="3 3" strokeLinecap="round" opacity="0.8" />
          )}

          {/* Intersecting vertical guide line */}
          {activeIdx !== null && (
            <line 
              x1={getX(activeIdx)} 
              y1={paddingY - 10} 
              x2={getX(activeIdx)} 
              y2={height - paddingY} 
              stroke="#a39274" 
              strokeWidth="1.5" 
              strokeDasharray="3 3" 
              opacity="0.6"
            />
          )}

          {/* Intersecting points */}
          {activeIdx !== null && (
            <>
              {chartMode !== 'visitors' && (
                <g>
                  <circle cx={getX(activeIdx)} cy={getY(data[activeIdx].views)} r="6" fill="#a39274" stroke="#fff" strokeWidth="2" />
                  <circle cx={getX(activeIdx)} cy={getY(data[activeIdx].views)} r="12" fill="none" stroke="#a39274" strokeWidth="1.5" opacity="0.3" />
                </g>
              )}
              {chartMode !== 'views' && (
                <g>
                  <circle cx={getX(activeIdx)} cy={getY(data[activeIdx].visitors)} r="5" fill="#8a8276" stroke="#fff" strokeWidth="2" />
                </g>
              )}
            </>
          )}

          {/* X Axis Labels */}
          {data.map((d, i) => {
            // Show every 2nd label to prevent crowding on small viewports
            if (i % 2 !== 0 && i !== data.length - 1 && i !== 0) return null
            return (
              <text 
                key={i}
                x={getX(i)} 
                y={height - 15} 
                textAnchor="middle" 
                fontSize="10" 
                fill="#b0a99e"
                fontFamily="var(--font-sans)"
              >
                {d.label}
              </text>
            )
          })}

          {/* Y Axis Max Label */}
          <text 
            x={paddingX} 
            y={paddingY - 12} 
            fontSize="9" 
            fontWeight="bold"
            fill="#b0a99e"
            fontFamily="var(--font-sans)"
          >
            MAX: {maxVal}
          </text>
        </svg>

        {/* Hover Floating Tooltip */}
        {activeIdx !== null && activeData && (
          <div style={tooltipContainer}>
            <div style={tooltipDate}>{activeData.label}</div>
            <div style={tooltipRow}>
              <span style={tooltipDotViews} />
              <span style={tooltipLabel}>Page Views:</span>
              <span style={tooltipVal}>{activeData.views}</span>
            </div>
            <div style={tooltipRow}>
              <span style={tooltipDotVisitors} />
              <span style={tooltipLabel}>Unique Visitors:</span>
              <span style={tooltipVal}>{activeData.visitors}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* --- Styles --- */

const cardContainer: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #ece9e4',
  borderRadius: '6px',
  padding: '1.5rem',
  boxShadow: '0 1px 3px rgba(28, 26, 24, 0.02)',
  position: 'relative',
}

const chartHeader: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1.25rem',
  flexWrap: 'wrap',
  gap: '0.75rem',
}

const chartTitle: React.CSSProperties = {
  fontFamily: 'var(--font-serif), Georgia, serif',
  fontSize: '1rem',
  fontWeight: 400,
  color: '#1c1a18',
  margin: 0,
}

const chartSub: React.CSSProperties = {
  fontSize: '0.75rem',
  color: '#8a8276',
  marginTop: '0.25rem',
  margin: 0,
}

const btnGroup: React.CSSProperties = {
  display: 'flex',
  gap: '0.25rem',
  background: '#f5f4f0',
  padding: '2px',
  borderRadius: '6px',
}

const btnStyle: React.CSSProperties = {
  fontSize: '0.6875rem',
  fontWeight: 500,
  color: '#8a8276',
  background: 'none',
  border: 'none',
  padding: '0.35rem 0.75rem',
  borderRadius: '4px',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
}

const activeBtn: React.CSSProperties = {
  background: '#fff',
  color: '#1c1a18',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
}

const svgStyle: React.CSSProperties = {
  display: 'block',
  overflow: 'visible',
  cursor: 'crosshair',
}

const tooltipContainer: React.CSSProperties = {
  position: 'absolute',
  top: '10px',
  right: '10px',
  background: 'rgba(28, 26, 24, 0.9)',
  backdropFilter: 'blur(8px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '6px',
  padding: '0.625rem 0.875rem',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.35rem',
  pointerEvents: 'none',
  zIndex: 10,
}

const tooltipDate: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  color: '#fff',
  borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
  paddingBottom: '0.25rem',
  marginBottom: '0.15rem',
}

const tooltipRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem',
}

const tooltipDotViews: React.CSSProperties = {
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  backgroundColor: '#a39274',
}

const tooltipDotVisitors: React.CSSProperties = {
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  backgroundColor: '#8a8276',
}

const tooltipLabel: React.CSSProperties = {
  fontSize: '0.6875rem',
  color: '#c5bcb0',
}

const tooltipVal: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  color: '#fff',
  marginLeft: 'auto',
  paddingLeft: '0.5rem',
}

const emptyContainer: React.CSSProperties = {
  background: '#fff',
  border: '1px dashed #ece9e4',
  borderRadius: '6px',
  padding: '3rem 1.5rem',
  textAlign: 'center',
}

const emptyText: React.CSSProperties = {
  fontSize: '0.8125rem',
  color: '#b0a99e',
  margin: 0,
}
