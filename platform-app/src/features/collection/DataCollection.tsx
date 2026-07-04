import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useData } from '../../data/useData'
import { newId } from '../../data/store'
import { EmptyState, Field, QualityDot, Tip } from '../../components/ui'
import { useToast } from '../../components/toast'
import { metricMap } from '../../catalog/metrics'
import { formatPeriod, isValidPeriod, recentPeriods } from '../../domain/periods'
import { validateDataPoint } from '../../domain/validation'
import { qualityFlag, latestPointFor } from '../../domain/aggregate'
import { downloadCsv } from '../../components/exporters'
import { CsvImport } from './CsvImport'
import type { DataPoint, DataQuality } from '../../domain/types'

export default function DataCollection() {
  const { data, update } = useData()
  // ?company=<id>&period=<key> deep-links straight into an entry context
  // (the dashboard's "Data gaps" card relies on this).
  const [params, setParams] = useSearchParams()
  const companyId = params.get('company') ?? ''
  const urlPeriod = params.get('period')
  const [period, setPeriod] = useState(() =>
    urlPeriod && isValidPeriod(urlPeriod) ? urlPeriod : recentPeriods('quarterly', 1)[0])
  const [importing, setImporting] = useState(false)
  const [toast, showToast] = useToast()
  const setCompanyId = (id: string) => setParams(prev => {
    const p = new URLSearchParams(prev)
    if (id) p.set('company', id); else p.delete('company')
    return p
  }, { replace: true })

  const metrics = useMemo(() => metricMap(data.customMetrics), [data.customMetrics])
  const company = data.companies.find(c => c.id === companyId) ?? data.companies[0]
  const effectiveCompanyId = company?.id ?? ''

  const myAssignments = useMemo(
    () => data.assignments.filter(a => a.companyId === effectiveCompanyId),
    [data.assignments, effectiveCompanyId],
  )

  const periodOptions = useMemo(() => {
    const qs = recentPeriods('quarterly', 10)
    const ys = recentPeriods('annual', 3)
    const opts = [...qs.reverse(), ...ys.reverse()]
    // Keep a deep-linked or previously-entered period selectable even when
    // it falls outside the default window (e.g. multi-year backfill).
    if (period && isValidPeriod(period) && !opts.includes(period)) opts.push(period)
    return opts
  }, [period])

  // Draft state per assignment for the chosen period
  const existing = useMemo(() => {
    const m = new Map<string, DataPoint>()
    for (const p of data.dataPoints) {
      if (p.period === period) m.set(p.assignmentId, p)
    }
    return m
  }, [data.dataPoints, period])

  function saveValue(assignmentId: string, raw: string, quality: DataQuality, evidence: string, note: string) {
    if (raw.trim() === '') {
      // empty input = remove the point for this period if it exists
      const prev = existing.get(assignmentId)
      if (prev) {
        update(d => ({ ...d, dataPoints: d.dataPoints.filter(p => p.id !== prev.id) }))
        showToast('Entry removed')
      }
      return
    }
    const value = Number(raw)
    const draft: Partial<DataPoint> = {
      assignmentId, period, value,
      quality,
      evidenceUrl: evidence.trim() || null,
      note: note.trim() || null,
    }
    const errs = validateDataPoint(draft)
    if (errs.length) { showToast(errs[0].message); return }

    update(d => {
      const prev = d.dataPoints.find(p => p.assignmentId === assignmentId && p.period === period)
      if (prev) {
        return {
          ...d,
          dataPoints: d.dataPoints.map(p => p.id === prev.id
            ? { ...p, value, quality, evidenceUrl: draft.evidenceUrl ?? null, note: draft.note ?? null, enteredAt: new Date().toISOString() }
            : p),
        }
      }
      return {
        ...d,
        dataPoints: [...d.dataPoints, {
          id: newId('dp'), assignmentId, period, value, quality,
          evidenceUrl: draft.evidenceUrl ?? null, note: draft.note ?? null,
          enteredAt: new Date().toISOString(),
        }],
      }
    })
    showToast('Saved')
  }

  if (data.companies.length === 0) {
    return (
      <>
        <div className="page-head">
          <h1 className="page-title">Data Collection</h1>
          <p className="page-sub">Enter impact data per company per period, or import a CSV.</p>
        </div>
        <EmptyState icon="✎" title="Nothing to collect yet"
          sub="Add a portfolio company and assign it metrics first — then enter its numbers here."
          action={<Link to="/portfolio" className="btn btn-primary">Go to Portfolio →</Link>} />
      </>
    )
  }

  return (
    <>
      <div className="page-head page-head-row">
        <div>
          <h1 className="page-title">Data Collection</h1>
          <p className="page-sub">Enter values for one company and period at a time — or bulk-import a CSV.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-subtle" onClick={() => {
            const metricsById = metrics
            const rows: (string | number | null)[][] = [['company', 'metric', 'period', 'value', 'quality', 'evidence_url', 'note']]
            for (const a of data.assignments) {
              const c = data.companies.find(x => x.id === a.companyId)
              const m = metricsById.get(a.metricId)
              if (!c || !m) continue
              rows.push([c.name, m.name, period, '', 'measured', '', ''])
            }
            downloadCsv(`imm-data-template-${period}.csv`, rows)
            showToast('Template downloaded — fill in the value column and import it back')
          }}>⬇ CSV template</button>
          <button className="btn btn-ghost" onClick={() => setImporting(true)}>⬆ Import CSV</button>
        </div>
      </div>

      <div className="toolbar">
        <select className="field-select" value={effectiveCompanyId} onChange={e => setCompanyId(e.target.value)} aria-label="Select company">
          {data.companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="field-select" value={period} onChange={e => setPeriod(e.target.value)} aria-label="Select period">
          {periodOptions.map(p => <option key={p} value={p}>{formatPeriod(p)}</option>)}
        </select>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-faint)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          Entering data for <strong style={{ color: 'var(--text-dim)' }}>{formatPeriod(period)}</strong>
          <Tip text="Pick the reporting period, then fill in each metric below. Mark values as Measured (from real records) or Estimated (modelled). Save happens per row." />
        </span>
      </div>

      {myAssignments.length === 0 ? (
        <EmptyState icon="◎" title={`${company?.name ?? 'This company'} has no metrics assigned`}
          sub="Assign metrics from the company page first — then their data entry rows appear here."
          action={<Link to={`/portfolio/${effectiveCompanyId}`} className="btn btn-primary">Open company page →</Link>} />
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {myAssignments.map(a => {
            const metric = metrics.get(a.metricId)
            return (
              <EntryRow key={`${a.id}-${period}`} assignmentId={a.id}
                metricName={metric?.name ?? a.metricId}
                unit={metric?.unit ?? ''}
                irisRef={metric?.irisRef ?? null}
                latestFlag={qualityFlag(latestPointFor(a.id, data.dataPoints))}
                existing={existing.get(a.id)}
                onSave={saveValue} />
            )
          })}
        </div>
      )}

      {importing && (
        <CsvImport onClose={() => setImporting(false)}
          onDone={n => { setImporting(false); showToast(`${n} data points imported`) }} />
      )}
      {toast}
    </>
  )
}

function EntryRow(props: {
  assignmentId: string
  metricName: string
  unit: string
  irisRef: string | null
  latestFlag: ReturnType<typeof qualityFlag>
  existing?: DataPoint
  onSave: (assignmentId: string, raw: string, quality: DataQuality, evidence: string, note: string) => void
}) {
  const [value, setValue] = useState(props.existing ? String(props.existing.value) : '')
  const [quality, setQuality] = useState<DataQuality>(props.existing?.quality ?? 'measured')
  const [evidence, setEvidence] = useState(props.existing?.evidenceUrl ?? '')
  const [note, setNote] = useState(props.existing?.note ?? '')
  const [expanded, setExpanded] = useState(false)

  const dirty = value !== (props.existing ? String(props.existing.value) : '')
    || quality !== (props.existing?.quality ?? 'measured')
    || evidence !== (props.existing?.evidenceUrl ?? '')
    || note !== (props.existing?.note ?? '')

  return (
    <div className="card" style={{ margin: 0, padding: '0.85rem 1.1rem' }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontWeight: 600, fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <QualityDot flag={props.latestFlag} />
            {props.metricName}
          </div>
          <div style={{ fontSize: '0.64rem', color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>
            {props.irisRef ? `IRIS+ ${props.irisRef}` : 'Custom'} · {props.unit}
          </div>
        </div>

        <input type="number" className="field-input" style={{ width: 130 }}
          placeholder="value" value={value} onChange={e => setValue(e.target.value)}
          aria-label={`Value for ${props.metricName}`} />

        <select className="field-select" value={quality} onChange={e => setQuality(e.target.value as DataQuality)}
          aria-label="Data quality" style={{ width: 120 }}>
          <option value="measured">Measured</option>
          <option value="estimated">Estimated</option>
        </select>

        <button className="btn btn-subtle btn-sm" onClick={() => setExpanded(x => !x)}
          aria-expanded={expanded}>{expanded ? '− details' : '+ evidence'}</button>

        <button className="btn btn-primary btn-sm" disabled={!dirty}
          onClick={() => props.onSave(props.assignmentId, value, quality, evidence, note)}>
          {props.existing ? 'Update' : 'Save'}
        </button>
      </div>

      {expanded && (
        <div className="form-grid" style={{ marginTop: 12 }}>
          <Field label="Evidence link" hint="URL of the source document, report or data export.">
            <input className="field-input" value={evidence} onChange={e => setEvidence(e.target.value)}
              placeholder="https://…" inputMode="url" />
          </Field>
          <Field label="Note">
            <input className="field-input" value={note} onChange={e => setNote(e.target.value)}
              placeholder="Anything reviewers should know" />
          </Field>
        </div>
      )}
    </div>
  )
}
