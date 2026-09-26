const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export const todayISO = () => new Date().toISOString().slice(0, 10);

export function fmtDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/** An obligation is either a day or a year; say which, never round one into the other. */
export function fmtWhen(o: { date: string | null; year: number }) {
  return o.date ? fmtDate(o.date) : `during ${o.year}`;
}

export const fmtNum = (n: number | null | undefined) =>
  n === null || n === undefined ? '—' : n.toLocaleString('en-GB');

export function fmtAgo(iso: string, now = Date.now()) {
  const s = Math.max(0, (now - new Date(iso).getTime()) / 1000);
  if (s < 90) return 'just now';
  const m = s / 60; if (m < 90) return `${Math.round(m)} min ago`;
  const h = m / 60; if (h < 36) return `${Math.round(h)} h ago`;
  const d = h / 24; if (d < 60) return `${Math.round(d)} days ago`;
  return `${Math.round(d / 30)} months ago`;
}

/** Days from today to an obligation; a year-only obligation is live until its year ends. */
export function daysUntil(o: { date: string | null; year: number }, today: string) {
  const end = o.date ?? `${o.year}-12-31`;
  return Math.round((Date.parse(end) - Date.parse(today)) / 86_400_000);
}
