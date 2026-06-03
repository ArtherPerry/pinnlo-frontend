'use client'

import { useState, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'
import type { FollowerSnapshot } from '@/lib/types'
import styles from './FollowerChart.module.css'

type Range = 7 | 14 | 30

interface TooltipState {
  x: number
  y: number
  date: string
  followers: number
  change: number
  visible: boolean
}

interface FollowerChartProps {
  snapshots:  FollowerSnapshot[]
  color?:     string
}

function formatFollowers(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(2)}M`
  if (n >= 1000)    return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

export function FollowerChart({ snapshots, color = '#1D9E75' }: FollowerChartProps) {
  const [range,   setRange  ] = useState<Range>(30)
  const [tooltip, setTooltip] = useState<TooltipState>({
    x: 0, y: 0, date: '', followers: 0, change: 0, visible: false,
  })
  const svgRef = useRef<SVGSVGElement>(null)

  const data   = snapshots.slice(-range)
  const W      = 360
  const H      = 140
  const PAD    = { top: 10, right: 10, bottom: 24, left: 48 }
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom

  const values   = data.map((s) => s.followers)
  const minVal   = Math.min(...values)
  const maxVal   = Math.max(...values)
  const range_   = maxVal - minVal || 1

  const xScale = (i: number) => PAD.left + (i / Math.max(data.length - 1, 1)) * innerW
  const yScale = (v: number) => PAD.top + innerH - ((v - minVal) / range_) * innerH

  // Build SVG path
  const points = data.map((s, i) => ({ x: xScale(i), y: yScale(s.followers) }))
  const linePath = points.reduce((acc, pt, i) => {
    return acc + (i === 0 ? `M ${pt.x} ${pt.y}` : ` L ${pt.x} ${pt.y}`)
  }, '')
  const lastPoint = points[points.length - 1]
const areaPath = points.length > 0 && lastPoint
  ? linePath
    + ` L ${lastPoint.x} ${PAD.top + innerH}`
    + ` L ${PAD.left} ${PAD.top + innerH} Z`
  : ''

  // Y-axis labels
  const yTicks = [minVal, minVal + range_ * 0.5, maxVal]

  // X-axis labels — show first, middle, last
  const xLabels = data.length > 0
    ? [0, Math.floor((data.length - 1) / 2), data.length - 1].map((i) => ({
        i,
        label: new Date(data[i].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      }))
    : []

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || data.length === 0) return
    const rect = svgRef.current.getBoundingClientRect()
    const mouseX = (e.clientX - rect.left) * (W / rect.width)
    const idx = Math.round(((mouseX - PAD.left) / innerW) * (data.length - 1))
    const clampedIdx = Math.max(0, Math.min(data.length - 1, idx))
    const snap = data[clampedIdx]
    if (!snap) return

    setTooltip({
      x:         (xScale(clampedIdx) / W) * 100,
      y:         (yScale(snap.followers) / H) * 100,
      date:      new Date(snap.date).toLocaleDateString('th-TH', { dateStyle: 'medium' }),
      followers: snap.followers,
      change:    snap.change,
      visible:   true,
    })
  }, [data, W, H, PAD, innerW])

  const handleMouseLeave = useCallback(() => {
    setTooltip((prev) => ({ ...prev, visible: false }))
  }, [])

  if (data.length === 0) {
    return (
      <div style={{
        padding: 'var(--space-8)',
        textAlign: 'center',
        color: 'var(--color-muted)',
        fontSize: 'var(--text-body)',
      }}>
        No data yet — syncs daily after tracking begins
      </div>
    )
  }

  return (
    <div className={styles.wrapper}>

      {/* Range selector */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div className={styles.rangeRow}>
          {([7, 14, 30] as Range[]).map((r) => (
            <button
              key={r}
              className={cn(styles.rangeBtn, range === r && styles.rangeBtnActive)}
              onClick={() => setRange(r)}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className={styles.chartArea}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className={styles.svg}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            <linearGradient id="followerGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={color} stopOpacity="0.18" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yTicks.map((tick, i) => (
            <line
              key={i}
              x1={PAD.left} y1={yScale(tick)}
              x2={PAD.left + innerW} y2={yScale(tick)}
              stroke="var(--color-border)" strokeWidth="0.5"
            />
          ))}

          {/* Y axis labels */}
          {yTicks.map((tick, i) => (
            <text
              key={i}
              x={PAD.left - 6}
              y={yScale(tick) + 4}
              textAnchor="end"
              fontSize="9"
              fill="var(--color-muted)"
            >
              {formatFollowers(tick)}
            </text>
          ))}

          {/* X axis labels */}
          {xLabels.map(({ i, label }) => (
            <text
              key={i}
              x={xScale(i)}
              y={H - 4}
              textAnchor="middle"
              fontSize="9"
              fill="var(--color-muted)"
            >
              {label}
            </text>
          ))}

          {/* Area fill */}
          <path d={areaPath} fill="url(#followerGrad)" />

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Hover dot */}
          {tooltip.visible && (
            <circle
              cx={xScale(
                Math.round(
                  ((tooltip.x / 100) * W - PAD.left) / innerW * (data.length - 1)
                )
              )}
              cy={yScale(tooltip.followers)}
              r="4"
              fill={color}
              stroke="white"
              strokeWidth="2"
            />
          )}
        </svg>

        {/* Tooltip */}
        {tooltip.visible && (
          <div
            className={styles.tooltip}
            style={{
              left:    `${tooltip.x}%`,
              bottom:  `${100 - tooltip.y + 5}%`,
              opacity: tooltip.visible ? 1 : 0,
            }}
          >
            <div style={{ fontWeight: 600 }}>{formatFollowers(tooltip.followers)}</div>
            <div style={{ opacity: 0.7, fontSize: '11px' }}>
              {tooltip.date}
              {tooltip.change !== 0 && (
                <span style={{ color: tooltip.change > 0 ? '#9FE1CB' : '#F09595' }}>
                  {' '}{tooltip.change > 0 ? '+' : ''}{tooltip.change.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: color }} />
          Followers over time
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: 'var(--color-success)' }} />
          Growth: +{data.filter((s) => s.change > 0).length} of {data.length} days
        </div>
      </div>
    </div>
  )
}