import { useMemo, useState } from 'react'
import { useData } from '../../data/useData'
import { newId } from '../../data/store'
import { Field, Modal, Tip } from '../../components/ui'
import { allMetrics } from '../../catalog/metrics'
import { ABC_CLASSES, IMP_DIMENSIONS, THEMES } from '../../catalog/dimensions'
import { validateAssignment } from '../../domain/validation'
import type { AbcClass, ImpDimension, MetricAssignment, ReportingFrequency } from '../../domain/types'

export function AssignMetricModal({ companyId, onClose, onDone }: {
  companyId: string
  onClose: () => void
  onDone: () => void
}) {
  const { data, update } = useData()
  const [q, setQ] = useState('')
  const [theme, setTheme] = useState('')
  const [metricId, setMetricId] = useState('')
  const [baseline, setBaseline] = useState('')
  const [target, setTarget] = useState('')
  const [targetYear, setTargetYear] = useState(String(new Date().getFullYear() + 2))
  const [frequency, setFrequency] = useState<ReportingFrequency>('quarterly')
  const [dims, setDims] = useState<ImpDimension[]>(['what', 'who', 'how_much'])
  const [abc, setAbc] = useState<AbcClass>('B')
  const [err, setErr] = useState('')

  const catalog = useMemo(() => allMetrics(data.customMetrics), [data.customMetrics])
  const assigned = useMemo(
    () => new Set(data.assignments.filter(a => a.companyId === companyId).map(a => a.metricId)),
    [data.assignments, companyId],
  )

  const results = useMemo(() => catalog.filter(m =>
    !assigned.has(m.id) &&
    (!theme || m.theme === theme) &&
    (!q || m.name.toLowerCase().includes(q.toLowerCase()) || m.id.toLowerCase().includes(q.toLowerCase())),
  ), [catalog, q, theme, assigned])

  const selected = catalog.find(m => m.id === metricId)

  function save() {
    const a: MetricAssignment = {
      id: newId('as'),
      companyId,
      metricId,
      baseline: baseline.trim() === '' ? null : Number(baseline),
      target: target.trim() === '' ? null : Number(target),
      targetYear: targetYear.trim() === '' ? null : Number(targetYear),
      frequency,
      impDimensions: dims,
      abcClass: abc,
      createdAt: new Date().toISOString(),
    }
    const errs = validateAssignment(a)
    if (!metricId) { setErr('Pick a metric from the list first.'); return }
    if (errs.length) { setErr(errs[0].message); return }
    update(d => ({ ...d, assignments: [...d.assignments, a] }))
    onDone()
  }

  return (
    <Modal title="Assign impact metric" onClose={onClose} wide>
      {!selected ? (
        <>
          <div className="toolbar">
            <input className="field-input grow" placeholder="Search the IRIS+ catalog…"
              value={q} onChange={e => setQ(e.target.value)} autoFocus aria-label="Search metrics" />
            <select className="field-select" value={theme} onChange={e => setTheme(e.target.value)} aria-label="Filter by theme">
              <option value="">All themes</option>
              {THEMES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
          </div>
          <div style={{ maxHeight: 340, overflowY: 'auto', display: 'grid', gap: 6 }}>
            {results.length === 0 && (
              <p style={{ color: 'var(--text-faint)', fontSize: '0.8rem', padding: '1rem', textAlign: 'center' }}>
                No unassigned metrics match. Try a different search, or create a custom metric from the Metrics page.
              </p>
            )}
            {results.map(m => (
              <button key={m.id} type="button" onClick={() => setMetricId(m.id)}
                style={{
                  textAlign: 'left', background: 'rgba(0,232,122,.03)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)', padding: '0.65rem 0.85rem', cursor: 'pointer', color: 'var(--text)',
                }}>
                <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{m.name}</div>
                <div style={{ fontSize: '0.66rem', color: 'var(--text-faint)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                  {m.irisRef ? `IRIS+ ${m.irisRef}` : 'Custom'} · {m.unit}
                  {m.sdgs.length > 0 && ` · SDG ${m.sdgs.join(', ')}`}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 3 }}>{m.definition}</div>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div style={{ background: 'rgba(0,232,122,.05)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.7rem 0.9rem', marginBottom: '1rem' }}>
            <div style={{ fontWeight: 600, fontSize: '0.84rem' }}>{selected.name}</div>
            <div style={{ fontSize: '0.66rem', color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>
              {selected.irisRef ? `IRIS+ ${selected.irisRef}` : 'Custom'} · {selected.unit}
            </div>
            <button className="btn btn-subtle btn-sm" style={{ marginTop: 6 }} onClick={() => setMetricId('')}>← Choose different metric</button>
          </div>

          <div className="form-grid">
            <Field label={`Baseline (${selected.unit})`} help="Where the company started — usually the value when you invested. Leave blank if unknown.">
              <input type="number" className="field-input" value={baseline} onChange={e => setBaseline(e.target.value)} placeholder="optional" />
            </Field>
            <Field label={`Target (${selected.unit})`} help="The goal. Progress and scores are measured against this.">
              <input type="number" className="field-input" value={target} onChange={e => setTarget(e.target.value)} placeholder="recommended" />
            </Field>
            <Field label="Target year">
              <input type="number" className="field-input" value={targetYear} onChange={e => setTargetYear(e.target.value)} />
            </Field>
            <Field label="Reporting frequency" help="How often the company reports this number to you.">
              <select className="field-select" value={frequency} onChange={e => setFrequency(e.target.value as ReportingFrequency)}>
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
              </select>
            </Field>
          </div>

          <Field label="IMP dimensions" help="Which of the IMP Five Dimensions of Impact does this metric speak to? Tap to toggle.">
            <div className="chip-row" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {IMP_DIMENSIONS.map(d => (
                <button key={d.key} type="button"
                  className={`pick-chip ${dims.includes(d.key) ? 'on' : ''}`}
                  aria-pressed={dims.includes(d.key)}
                  title={d.help}
                  onClick={() => setDims(prev => prev.includes(d.key) ? prev.filter(x => x !== d.key) : [...prev, d.key])}>
                  {d.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="ABC classification" help="How would you class this company's impact via this metric? A = avoids harm, B = benefits stakeholders, C = contributes to solutions.">
            <div style={{ display: 'grid', gap: 6 }}>
              {ABC_CLASSES.map(c => (
                <label key={c.key} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: '0.78rem', cursor: 'pointer' }}>
                  <input type="radio" name="abc" checked={abc === c.key} onChange={() => setAbc(c.key)} style={{ marginTop: 3 }} />
                  <span><strong>{c.label}</strong> <Tip text={c.help} /></span>
                </label>
              ))}
            </div>
          </Field>

          {err && <p className="field-error" role="alert">{err}</p>}
          <div className="modal-actions">
            <button className="btn btn-subtle" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={save}>Assign metric</button>
          </div>
        </>
      )}
    </Modal>
  )
}
