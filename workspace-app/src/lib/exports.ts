/* Exports the user can take away. They are generated here and handed over as
   a download; nothing is sent anywhere. */

type Ob = { id: string; regime: string; label: string; date: string | null; year: number;
            why: string; derived: boolean; kind: string };

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/[,;]/g, m => '\\' + m).replace(/\n/g, '\\n');
const d8 = (iso: string) => iso.replace(/-/g, '');
const plusDay = (iso: string) => { const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10); };

/* A report obligation is known to the year, not the day. Rather than invent
   a day, it becomes an all-day event spanning the whole year — which is what
   the register actually says. */
export function toICS(obligations: Ob[], entityName: string, regimeName: (code: string) => string) {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//ReGenesis Impact//Workspace//EN', 'CALSCALE:GREGORIAN'];
  for (const o of obligations) {
    const start = o.date ?? `${o.year}-01-01`;
    const end = o.date ? plusDay(o.date) : `${o.year + 1}-01-01`;
    const precision = o.date ? (o.derived ? 'Date follows from a stated rule.' : 'Date from the register.')
                             : `Known to the year only — due during ${o.year}.`;
    lines.push('BEGIN:VEVENT',
      `UID:${o.id}-${start}@regenesisimpact.in`, `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${d8(start)}`, `DTEND;VALUE=DATE:${d8(end)}`,
      `SUMMARY:${esc(`${regimeName(o.regime)} — ${o.label}`)}`,
      `DESCRIPTION:${esc(`${o.why}\n\n${precision}${entityName ? `\nEntity: ${entityName}` : ''}`)}`,
      'TRANSP:TRANSPARENT', 'END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function toCSV(obligations: Ob[], regimeName: (code: string) => string) {
  const q = (s: string | number) => `"${String(s).replace(/"/g, '""')}"`;
  const rows = [['regime', 'obligation', 'date', 'year', 'precision', 'why'].map(q).join(',')];
  for (const o of obligations)
    rows.push([regimeName(o.regime), o.label, o.date ?? '', o.year,
      o.date ? (o.derived ? 'day, derived' : 'day') : 'year', o.why].map(q).join(','));
  return rows.join('\n');
}

export function download(name: string, body: string, type: string) {
  const url = URL.createObjectURL(new Blob([body], { type }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
