// Hand-rolled SVG charts — no chart library, full control of brand styling.
// Every chart renders into a plain <svg> so downloadSvgAsPng works on all.

import { useRef } from 'react'
import { downloadSvgAsPng } from './exporters'
import { formatPeriod } from '../domain/periods'
import { fmtNum } from '../domain/aggregate'

const MONO = 'DM Mono, monospace'
const DIM = 'rgba(240,237,232,.4)'
const GRID = 'rgba(0,232,122,.07)'

export function ChartExportButton({ svgRef, name }: { svgRef: React.RefObject<SVGSVGElement | null>; name: string }) {
  return (
    <button
      className="btn btn-subtle btn-sm no-print"
      onClick={() => { if (svgRef.current) downloadSvgAsPng(svgRef.current, `${name}.png`) }}
      aria-label={`Download ${name} chart as image`}
    >⬇ PNG</button>
  )
}

// ── Donut ────────────────────────────────────────────────────────

export interface DonutSlice { label: string; value: number; color: string }

export function DonutChart({ slices, centerLabel, svgRef }: {
  slices: DonutSlice[]
  centerLabel?: string
  svgRef?: React.RefObject<SVGSVGElement | null>
}) {
  const internalRef = useRef<SVGSVGElement>(null)
  const ref = svgRef ?? internalRef
  const total = slices.reduce((s, x) => s + x.value, 0)
  const R = 70, r = 44, cx = 110, cy = 110
  let angle = -Math.PI / 2

  const paths = slices.filter(s => s.value > 0).map((s, i) => {
    const frac = s.value / total
    const a0 = angle
    const a1 = angle + frac * Math.PI * 2
    angle = a1
    const large = frac > 0.5 ? 1 : 0
    // full-circle edge case
    if (frac >= 0.999) {
      return <circle key={i} cx={cx} cy={cy} r={(R + r) / 2} fill="none" stroke={s.color} strokeWidth={R - r} />
    }
    const p = [
      `M ${cx + R * Math.cos(a0)} ${cy + R * Math.sin(a0)}`,
      `A ${R} ${R} 0 ${large} 1 ${cx + R * Math.cos(a1)} ${cy + R * Math.sin(a1)}`,
      `L ${cx + r * Math.cos(a1)} ${cy + r * Math.sin(a1)}`,
      `A ${r} ${r} 0 ${large} 0 ${cx + r * Math.cos(a0)} ${cy + r * Math.sin(a0)}`,
      'Z',
    ].join(' ')
    return <path key={i} d={p} fill={s.color} opacity={0.92}><title>{`${s.label}: ${fmtNum(s.value)}`}</title></path>
  })

  return (
    <svg ref={ref} viewBox="0 0 220 220" style={{ width: '100%', maxWidth: 230, display: 'block', margin: '0 auto' }}
      role="img" aria-label={`Donut chart. ${slices.map(s => `${s.label}: ${fmtNum(s.value)}`).join('; ')}`}>
      {total === 0
        ? <circle cx={cx} cy={cy} r={(R + r) / 2} fill="none" stroke={GRID} strokeWidth={R - r} />
        : paths}
      {centerLabel && (
        <text x={cx} y={cy + 4} textAnchor="middle" fill="#f0ede8" fontSize="13" fontFamily={MONO}>
          {centerLabel}
        </text>
      )}
    </svg>
  )
}

// ── Horizontal bars ──────────────────────────────────────────────

export interface BarRow { label: string; value: number; color?: string; sub?: string }

export function HBarChart({ rows, format = fmtNum, svgRef }: {
  rows: BarRow[]
  format?: (n: number) => string
  svgRef?: React.RefObject<SVGSVGElement | null>
}) {
  const internalRef = useRef<SVGSVGElement>(null)
  const ref = svgRef ?? internalRef
  const max = Math.max(...rows.map(r => r.value), 1)
  const rowH = 30
  const H = rows.length * rowH + 8
  const labelW = 130
  const W = 460

  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block' }}
      role="img" aria-label={`Bar chart. ${rows.map(r => `${r.label}: ${format(r.value)}`).join('; ')}`}>
      {rows.map((r, i) => {
        const y = i * rowH + 4
        const w = Math.max(2, (r.value / max) * (W - labelW - 70))
        return (
          <g key={i}>
            <text x={labelW - 8} y={y + 15} textAnchor="end" fill={DIM} fontSize="9.5" fontFamily="DM Sans">
              {r.label.length > 20 ? r.label.slice(0, 19) + '…' : r.label}
            </text>
            <rect x={labelW} y={y + 5} width={w} height={14} rx={3}
              fill={r.color ?? 'url(#hbar-grad)'} opacity={0.9}>
              <title>{`${r.label}: ${format(r.value)}`}</title>
            </rect>
            <text x={labelW + w + 8} y={y + 15} fill="#0affdb" fontSize="9" fontFamily={MONO}>
              {format(r.value)}
            </text>
          </g>
        )
      })}
      <defs>
        <linearGradient id="hbar-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#00e87a" />
          <stop offset="100%" stopColor="#0affdb" />
        </linearGradient>
      </defs>
    </svg>
  )
}

// ── Trend line ───────────────────────────────────────────────────

export function TrendLine({ series, svgRef, height = 180 }: {
  series: { period: string; value: number }[]
  svgRef?: React.RefObject<SVGSVGElement | null>
  height?: number
}) {
  const internalRef = useRef<SVGSVGElement>(null)
  const ref = svgRef ?? internalRef
  const W = 520, H = height
  const pad = { l: 48, r: 14, t: 12, b: 26 }

  if (series.length === 0) {
    return <div className="empty" style={{ padding: '1.6rem' }}><div className="empty-sub">No data yet for this period range.</div></div>
  }

  const max = Math.max(...series.map(s => s.value), 1)
  const xs = (i: number) => series.length === 1
    ? pad.l + (W - pad.l - pad.r) / 2
    : pad.l + (i / (series.length - 1)) * (W - pad.l - pad.r)
  const ys = (v: number) => pad.t + (1 - v / max) * (H - pad.t - pad.b)

  const pts = series.map((s, i) => `${xs(i)},${ys(s.value)}`).join(' ')
  const area = `${xs(0)},${ys(0)} ${pts} ${xs(series.length - 1)},${H - pad.b}`

  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block' }}
      role="img" aria-label={`Trend line. ${series.map(s => `${formatPeriod(s.period)}: ${fmtNum(s.value)}`).join('; ')}`}>
      <defs>
        <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00e87a" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#00e87a" stopOpacity="0.01" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map(f => (
        <g key={f}>
          <line x1={pad.l} x2={W - pad.r} y1={ys(max * f)} y2={ys(max * f)} stroke={GRID} />
          <text x={pad.l - 6} y={ys(max * f) + 3} textAnchor="end" fill={DIM} fontSize="8" fontFamily={MONO}>
            {fmtNum(max * f)}
          </text>
        </g>
      ))}
      <polygon points={area} fill="url(#trend-fill)" />
      <polyline points={pts} fill="none" stroke="#00e87a" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
      {series.map((s, i) => (
        <g key={s.period}>
          <circle cx={xs(i)} cy={ys(s.value)} r="3.2" fill="#0affdb" stroke="#021008" strokeWidth="1">
            <title>{`${formatPeriod(s.period)}: ${fmtNum(s.value)}`}</title>
          </circle>
          {(series.length <= 9 || i % 2 === 0) && (
            <text x={xs(i)} y={H - 8} textAnchor="middle" fill={DIM} fontSize="8" fontFamily={MONO}>
              {formatPeriod(s.period)}
            </text>
          )}
        </g>
      ))}
    </svg>
  )
}
