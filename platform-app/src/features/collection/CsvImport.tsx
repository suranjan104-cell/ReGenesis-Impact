import { useMemo, useState } from 'react'
import { useData } from '../../data/useData'
import { newId } from '../../data/store'
import { Field, Modal } from '../../components/ui'
import { metricMap } from '../../catalog/metrics'
import { isValidPeriod } from '../../domain/periods'
import { parseNumericCell } from '../../domain/validation'
import type { DataPoint, DataQuality } from '../../domain/types'

/** Minimal CSV parser that handles quoted cells and commas. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++ }
        else inQuotes = false
      } else cell += ch
    } else if (ch === '"') inQuotes = true
    else if (ch === ',') { row.push(cell); cell = '' }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(cell); cell = ''
      if (row.some(c => c.trim() !== '')) rows.push(row)
      row = []
    } else cell += ch
  }
  row.push(cell)
  if (row.some(c => c.trim() !== '')) rows.push(row)
  return rows
}

type ColMap = { company: number; metric: number; period: number; value: number; quality: number }

interface PreviewRow {
  raw: string[]
  status: 'ok' | 'error'
  message: string
  assignmentId?: string
  period?: string
  value?: number
  quality?: DataQuality
}

export function CsvImport({ onClose, onDone }: { onClose: () => void; onDone: (count: number) => void }) {
  const { data, update } = useData()
  const [rows, setRows] = useState<string[][] | null>(null)
  const [map, setMap] = useState<ColMap>({ company: 0, metric: 1, period: 2, value: 3, quality: -1 })
  const metrics = useMemo(() => metricMap(data.customMetrics), [data.customMetrics])

  const header = rows?.[0] ?? []
  const body = useMemo(() => rows?.slice(1) ?? [], [rows])

  function autoMap(h: string[]) {
    const find = (...names: string[]) => h.findIndex(c => names.some(n => c.trim().toLowerCase().includes(n)))
    const m: ColMap = {
      company: Math.max(0, find('company', 'investee', 'name')),
      metric: Math.max(0, find('metric', 'indicator', 'iris')),
      period: Math.max(0, find('period', 'quarter', 'date', 'year')),
      value: Math.max(0, find('value', 'amount', 'result', 'number')),
      quality: find('quality', 'measured', 'source'),
    }
    setMap(m)
  }

  function onFile(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      const parsed = parseCsv(String(reader.result ?? ''))
      if (parsed.length < 2) {
        setRows([['error']])
        return
      }
      setRows(parsed)
      autoMap(parsed[0])
    }
    reader.readAsText(file)
  }

  // Resolve each row: company name → company, metric name/ID → assignment
  const preview: PreviewRow[] = useMemo(() => {
    if (!rows || rows.length < 2) return []
    return body.map(r => {
      const companyName = (r[map.company] ?? '').trim()
      const metricKey = (r[map.metric] ?? '').trim()
      const period = (r[map.period] ?? '').trim().toUpperCase().replace(/\s+/g, '-')
      const valueRaw = (r[map.value] ?? '').trim()
      const qualityRaw = map.quality >= 0 ? (r[map.quality] ?? '').trim().toLowerCase() : ''

      const company = data.companies.find(c => c.name.toLowerCase() === companyName.toLowerCase())
      if (!company) return { raw: r, status: 'error' as const, message: `Unknown company "${companyName}"` }

      const metric = [...metrics.values()].find(m =>
        m.id.toLowerCase() === metricKey.toLowerCase() ||
        m.name.toLowerCase() === metricKey.toLowerCase() ||
        (m.irisRef ?? '').toLowerCase() === metricKey.toLowerCase())
      if (!metric) return { raw: r, status: 'error' as const, message: `Unknown metric "${metricKey}"` }

      const assignment = data.assignments.find(a => a.companyId === company.id && a.metricId === metric.id)
      if (!assignment) return { raw: r, status: 'error' as const, message: `"${metric.name}" is not assigned to ${company.name}` }

      if (!isValidPeriod(period)) return { raw: r, status: 'error' as const, message: `Bad period "${r[map.period]}" — use 2024-Q1 or 2024` }

      const value = parseNumericCell(valueRaw)
      if (value == null) return { raw: r, status: 'error' as const, message: `Bad value "${valueRaw}" — must be a number` }

      const quality: DataQuality = qualityRaw.startsWith('est') ? 'estimated' : 'measured'
      return { raw: r, status: 'ok' as const, message: 'Ready', assignmentId: assignment.id, period, value, quality }
    })
  }, [rows, body, map, data, metrics])

  const okRows = preview.filter(p => p.status === 'ok')

  function doImport() {
    const now = new Date().toISOString()
    update(d => {
      let points = [...d.dataPoints]
      for (const p of okRows) {
        const prev = points.find(x => x.assignmentId === p.assignmentId && x.period === p.period)
        if (prev) {
          points = points.map(x => x.id === prev.id
            ? { ...x, value: p.value!, quality: p.quality!, enteredAt: now }
            : x)
        } else {
          points.push({
            id: newId('dp'), assignmentId: p.assignmentId!, period: p.period!,
            value: p.value!, quality: p.quality!, evidenceUrl: null, note: 'CSV import', enteredAt: now,
          } satisfies DataPoint)
        }
      }
      return { ...d, dataPoints: points }
    })
    onDone(okRows.length)
  }

  return (
    <Modal title="Import data from CSV" onClose={onClose} wide>
      {!rows ? (
        <>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: 14, lineHeight: 1.55 }}>
            Your CSV needs one row per data point with columns for <strong>company</strong>, <strong>metric</strong> (name or IRIS+ code),{' '}
            <strong>period</strong> (like <code>2024-Q1</code> or <code>2024</code>) and <strong>value</strong>.
            An optional <strong>quality</strong> column can say "measured" or "estimated".
            Companies and metric assignments must already exist — nothing is created implicitly, so a typo can't corrupt your data.
          </p>
          <Field label="Choose CSV file">
            <input type="file" accept=".csv,text/csv" className="field-input"
              onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f) }} />
          </Field>
        </>
      ) : rows.length < 2 ? (
        <>
          <p className="field-error">That file doesn't look like a CSV with a header row and data. Try another file.</p>
          <div className="modal-actions"><button className="btn btn-subtle" onClick={() => setRows(null)}>← Back</button></div>
        </>
      ) : (
        <>
          <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))' }}>
            {(['company', 'metric', 'period', 'value', 'quality'] as const).map(k => (
              <Field key={k} label={`${k[0].toUpperCase()}${k.slice(1)} column${k === 'quality' ? ' (optional)' : ''}`}>
                <select className="field-select" value={map[k]}
                  onChange={e => setMap({ ...map, [k]: Number(e.target.value) })}>
                  {k === 'quality' && <option value={-1}>— none —</option>}
                  {header.map((h, i) => <option key={i} value={i}>{h || `Column ${i + 1}`}</option>)}
                </select>
              </Field>
            ))}
          </div>

          <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', margin: '4px 0 10px' }}>
            <strong style={{ color: 'var(--accent)' }}>{okRows.length}</strong> of {preview.length} rows ready to import
            {okRows.length < preview.length && ' — rows with problems are skipped, never guessed'}
          </div>

          <div style={{ maxHeight: 260, overflowY: 'auto' }}>
            <table className="tbl">
              <thead><tr><th>Status</th><th>Row</th><th>Why</th></tr></thead>
              <tbody>
                {preview.slice(0, 100).map((p, i) => (
                  <tr key={i}>
                    <td>{p.status === 'ok' ? <span className="tag">OK</span> : <span className="tag danger">Skip</span>}</td>
                    <td style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)' }}>{p.raw.slice(0, 4).join(' · ').slice(0, 60)}</td>
                    <td style={{ fontSize: '0.7rem', color: p.status === 'ok' ? 'var(--text-faint)' : 'var(--danger)' }}>{p.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.length > 100 && <p style={{ fontSize: '0.68rem', color: 'var(--text-faint)', padding: 8 }}>…and {preview.length - 100} more rows</p>}
          </div>

          <div className="modal-actions">
            <button className="btn btn-subtle" onClick={() => setRows(null)}>← Different file</button>
            <button className="btn btn-primary" disabled={okRows.length === 0} onClick={doImport}>
              Import {okRows.length} data point{okRows.length === 1 ? '' : 's'}
            </button>
          </div>
        </>
      )}
    </Modal>
  )
}
