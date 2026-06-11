import type { PeriodKey, ReportingFrequency } from './types'

/** '2024-Q1' → { year: 2024, quarter: 1 }; '2024' → { year: 2024, quarter: null } */
export function parsePeriod(p: PeriodKey): { year: number; quarter: number | null } {
  const m = /^(\d{4})(?:-Q([1-4]))?$/.exec(p)
  if (!m) return { year: 0, quarter: null }
  return { year: Number(m[1]), quarter: m[2] ? Number(m[2]) : null }
}

export function isValidPeriod(p: string): boolean {
  return /^(\d{4})(-Q[1-4])?$/.test(p)
}

/** Sortable numeric key: 2024-Q1 → 2024.1, 2024 → 2024.5 (annual sorts after Q4 of same year). */
export function periodSortKey(p: PeriodKey): number {
  const { year, quarter } = parsePeriod(p)
  return year + (quarter ? quarter / 10 : 0.5)
}

export function comparePeriods(a: PeriodKey, b: PeriodKey): number {
  return periodSortKey(a) - periodSortKey(b)
}

export function formatPeriod(p: PeriodKey): string {
  const { year, quarter } = parsePeriod(p)
  return quarter ? `Q${quarter} ${year}` : `FY ${year}`
}

/** Most recent N period keys for a frequency, ending at the current date. */
export function recentPeriods(freq: ReportingFrequency, count: number, now = new Date()): PeriodKey[] {
  const out: PeriodKey[] = []
  if (freq === 'annual') {
    const y = now.getFullYear() - 1 // last complete year
    for (let i = 0; i < count; i++) out.unshift(String(y - i))
  } else {
    let y = now.getFullYear()
    let q = Math.floor(now.getMonth() / 3) // 0-based current quarter; report last complete
    for (let i = 0; i < count; i++) {
      if (q === 0) { q = 4; y -= 1 } // step back into previous year
      out.unshift(`${y}-Q${q}`)
      q -= 1
    }
  }
  return out
}

/** Is this period older than `staleQuarters` quarters before now? */
export function isStale(p: PeriodKey, staleQuarters = 2, now = new Date()): boolean {
  const { year, quarter } = parsePeriod(p)
  const nowAbs = now.getFullYear() * 4 + Math.floor(now.getMonth() / 3)
  const pAbs = quarter ? year * 4 + (quarter - 1) : year * 4 + 3
  return nowAbs - pAbs > staleQuarters
}
