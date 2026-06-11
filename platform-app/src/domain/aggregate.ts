// Pure aggregation + scoring functions. No store access — everything is
// passed in, so these are trivially unit-testable and safe from bad state.

import type {
  Company, DataPoint, MetricAssignment, MetricDef, PlatformData,
} from './types'
import { comparePeriods, isStale } from './periods'

// ── Lookups ──────────────────────────────────────────────────────

export function latestPointFor(assignmentId: string, points: DataPoint[]): DataPoint | null {
  let best: DataPoint | null = null
  for (const p of points) {
    if (p.assignmentId !== assignmentId) continue
    if (!best || comparePeriods(p.period, best.period) > 0) best = p
  }
  return best
}

export function pointsFor(assignmentId: string, points: DataPoint[]): DataPoint[] {
  return points
    .filter(p => p.assignmentId === assignmentId)
    .sort((a, b) => comparePeriods(a.period, b.period))
}

// ── Progress vs target ───────────────────────────────────────────

/**
 * Progress 0..1 toward target from baseline. Handles both directions.
 * Returns null when target/baseline make progress undefined.
 */
export function progressVsTarget(
  assignment: MetricAssignment,
  metric: MetricDef | undefined,
  latest: DataPoint | null,
): number | null {
  if (!latest || assignment.target == null) return null
  const base = assignment.baseline ?? 0
  const span = assignment.target - base
  if (span === 0) return latest.value === assignment.target ? 1 : null
  const raw = (latest.value - base) / span
  // For lower_better metrics where target < baseline, span is negative and
  // the formula already yields the right direction.
  void metric
  return Math.max(0, Math.min(1.5, raw)) // cap at 150% so outliers don't distort
}

// ── Data quality ─────────────────────────────────────────────────

export type QualityFlag = 'measured' | 'estimated' | 'stale' | 'missing'

export function qualityFlag(latest: DataPoint | null): QualityFlag {
  if (!latest) return 'missing'
  if (isStale(latest.period)) return 'stale'
  return latest.quality
}

const QUALITY_WEIGHT: Record<QualityFlag, number> = {
  measured: 1,
  estimated: 0.8,
  stale: 0.6,
  missing: 0,
}

// ── Company impact score ─────────────────────────────────────────

export interface ScoreBreakdownRow {
  assignment: MetricAssignment
  metric: MetricDef | undefined
  latest: DataPoint | null
  progress: number | null
  quality: QualityFlag
  qualityWeight: number
  contribution: number | null // progress × qualityWeight, what enters the average
}

export interface CompanyScore {
  score: number | null      // 0..100, null when no scoreable metrics
  coverage: number          // share of assignments with any data, 0..1
  rows: ScoreBreakdownRow[]
}

/**
 * Transparent composite score: mean of (progress-vs-target × data-quality
 * weight) across assignments that have a target, scaled to 0–100.
 * The full row-by-row breakdown is returned so the UI can show the math.
 */
export function companyScore(
  companyId: string,
  assignments: MetricAssignment[],
  points: DataPoint[],
  metricById: Map<string, MetricDef>,
): CompanyScore {
  const mine = assignments.filter(a => a.companyId === companyId)
  const rows: ScoreBreakdownRow[] = mine.map(a => {
    const latest = latestPointFor(a.id, points)
    const metric = metricById.get(a.metricId)
    const progress = progressVsTarget(a, metric, latest)
    const quality = qualityFlag(latest)
    const qualityWeight = QUALITY_WEIGHT[quality]
    const contribution = progress == null ? null : Math.min(progress, 1) * qualityWeight
    return { assignment: a, metric, latest, progress, quality, qualityWeight, contribution }
  })

  const scoreable = rows.filter(r => r.contribution != null)
  const withData = rows.filter(r => r.latest != null)
  const score = scoreable.length
    ? Math.round((scoreable.reduce((s, r) => s + (r.contribution as number), 0) / scoreable.length) * 100)
    : null

  return {
    score,
    coverage: mine.length ? withData.length / mine.length : 0,
    rows,
  }
}

// ── Fund-level aggregates ────────────────────────────────────────

export interface FundKpis {
  totalCommitted: number
  totalDeployed: number
  activeCompanies: number
  totalCompanies: number
  metricsTracked: number
  dataCoverage: number // 0..1 across all assignments
}

export function fundKpis(data: PlatformData): FundKpis {
  const active = data.companies.filter(c => c.status === 'active')
  const withData = data.assignments.filter(a => latestPointFor(a.id, data.dataPoints) != null)
  return {
    totalCommitted: data.companies.reduce((s, c) => s + c.committedUsd, 0),
    totalDeployed: data.companies.reduce((s, c) => s + c.deployedUsd, 0),
    activeCompanies: active.length,
    totalCompanies: data.companies.length,
    metricsTracked: data.assignments.length,
    dataCoverage: data.assignments.length ? withData.length / data.assignments.length : 0,
  }
}

/** Deployed capital per SDG (a company contributes its capital to each tagged SDG). */
export function capitalBySdg(companies: Company[]): Map<number, number> {
  const out = new Map<number, number>()
  for (const c of companies) {
    for (const sdg of c.sdgs) {
      out.set(sdg, (out.get(sdg) ?? 0) + c.deployedUsd)
    }
  }
  return out
}

/** Sum of latest values for every assignment of a given metric across companies. */
export function aggregateMetricTotal(
  metricId: string,
  assignments: MetricAssignment[],
  points: DataPoint[],
): { total: number; companies: number } {
  let total = 0
  let n = 0
  for (const a of assignments) {
    if (a.metricId !== metricId) continue
    const latest = latestPointFor(a.id, points)
    if (latest) { total += latest.value; n++ }
  }
  return { total, companies: n }
}

/** Period series summed across all assignments of one metric (for trend lines). */
export function metricTrend(
  metricId: string,
  assignments: MetricAssignment[],
  points: DataPoint[],
): { period: string; value: number }[] {
  const ids = new Set(assignments.filter(a => a.metricId === metricId).map(a => a.id))
  const byPeriod = new Map<string, number>()
  for (const p of points) {
    if (!ids.has(p.assignmentId)) continue
    byPeriod.set(p.period, (byPeriod.get(p.period) ?? 0) + p.value)
  }
  return [...byPeriod.entries()]
    .map(([period, value]) => ({ period, value }))
    .sort((a, b) => comparePeriods(a.period, b.period))
}

/** Capital-weighted average score across the portfolio. */
export function capitalWeightedScore(
  companies: Company[],
  scores: Map<string, CompanyScore>,
): number | null {
  let wsum = 0
  let w = 0
  for (const c of companies) {
    const s = scores.get(c.id)
    if (s?.score == null || c.deployedUsd <= 0) continue
    wsum += s.score * c.deployedUsd
    w += c.deployedUsd
  }
  return w > 0 ? Math.round(wsum / w) : null
}

// ── Formatting helpers ───────────────────────────────────────────

export function fmtUsd(n: number): string {
  if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(1)}B`
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(1)}M`
  if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}

export function fmtNum(n: number): string {
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  if (Math.abs(n) >= 1e3) return `${(n / 1e3).toFixed(1)}k`
  if (Number.isInteger(n)) return String(n)
  return n.toFixed(1)
}
