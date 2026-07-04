// Shorthand money parsing shared by onboarding, settings and company forms.

/** Parse "50M", "$1.2b", "500k", "4,000,000" → dollars. Null when blank/invalid. */
export function parseMoney(input: string): number | null {
  const s = input.trim()
  if (!s) return null
  const m = s.match(/^\$?\s*([\d,]+(?:\.\d+)?)\s*([kmb])?\s*$/i)
  if (!m) return null
  const n = Number(m[1].replace(/,/g, ''))
  if (!Number.isFinite(n)) return null
  const mult = { k: 1e3, m: 1e6, b: 1e9 }[m[2]?.toLowerCase() as 'k' | 'm' | 'b'] ?? 1
  return n * mult
}

/** Format dollars back to compact shorthand: 50000000 → "50M". */
export function formatMoneyShort(usd: number | null): string {
  if (usd == null || !Number.isFinite(usd)) return ''
  if (usd >= 1e9) return `${trim(usd / 1e9)}B`
  if (usd >= 1e6) return `${trim(usd / 1e6)}M`
  if (usd >= 1e3) return `${trim(usd / 1e3)}k`
  return String(usd)
}

function trim(n: number): string {
  return n.toFixed(2).replace(/\.?0+$/, '')
}
