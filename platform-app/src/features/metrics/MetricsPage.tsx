import { useMemo, useState } from 'react'
import { useData } from '../../data/useData'
import { newId } from '../../data/store'
import { EmptyState, Field, Modal, SdgChip } from '../../components/ui'
import { useToast } from '../../components/toast'
import { METRICS_CATALOG, allMetrics } from '../../catalog/metrics'
import { THEMES } from '../../catalog/dimensions'
import { validateMetricDef } from '../../domain/validation'
import type { MetricDef, MetricTheme } from '../../domain/types'

export default function MetricsPage() {
  const { data, update } = useData()
  const [q, setQ] = useState('')
  const [theme, setTheme] = useState('')
  const [creating, setCreating] = useState(false)
  const [toast, showToast] = useToast()

  const catalog = useMemo(() => allMetrics(data.customMetrics), [data.customMetrics])
  const usage = useMemo(() => {
    const m = new Map<string, number>()
    for (const a of data.assignments) m.set(a.metricId, (m.get(a.metricId) ?? 0) + 1)
    return m
  }, [data.assignments])

  const results = useMemo(() => catalog.filter(m =>
    (!theme || m.theme === theme) &&
    (!q || m.name.toLowerCase().includes(q.toLowerCase()) || m.id.toLowerCase().includes(q.toLowerCase()) || m.definition.toLowerCase().includes(q.toLowerCase())),
  ), [catalog, q, theme])

  return (
    <>
      <div className="page-head page-head-row">
        <div>
          <h1 className="page-title">Metrics Catalog</h1>
          <p className="page-sub">
            {METRICS_CATALOG.length} standard metrics aligned to the IRIS+ taxonomy, plus your own.
            Assign them to companies from each company's page.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreating(true)}>+ Custom metric</button>
      </div>

      <div className="toolbar">
        <input className="field-input grow" placeholder="Search metrics by name, code or definition…"
          value={q} onChange={e => setQ(e.target.value)} aria-label="Search metrics" />
        <select className="field-select" value={theme} onChange={e => setTheme(e.target.value)} aria-label="Filter by theme">
          <option value="">All themes</option>
          {THEMES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
        </select>
      </div>

      {results.length === 0 ? (
        <EmptyState icon="◎" title="No metrics match"
          sub="Try a different search term, or create a custom metric for what you need to measure."
          action={<button className="btn btn-primary" onClick={() => setCreating(true)}>+ Create custom metric</button>} />
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {results.map(m => (
            <div key={m.id} className="card" style={{ padding: '0.85rem 1.1rem', margin: 0 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 240 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.86rem' }}>
                    {m.name}
                    {m.custom && <span className="tag cyan" style={{ marginLeft: 8 }}>Custom</span>}
                  </div>
                  <div style={{ fontSize: '0.66rem', color: 'var(--text-faint)', fontFamily: 'var(--font-mono)', margin: '3px 0' }}>
                    {m.irisRef ? `IRIS+ ${m.irisRef}` : m.id} · {m.unit} · {THEMES.find(t => t.key === m.theme)?.label}
                    {m.sdgTargets.length > 0 && ` · targets ${m.sdgTargets.join(', ')}`}
                  </div>
                  <p style={{ fontSize: '0.76rem', color: 'var(--text-dim)', lineHeight: 1.5 }}>{m.definition}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  <div style={{ display: 'flex', gap: 3 }}>
                    {m.sdgs.map(n => <SdgChip key={n} n={n} size={22} />)}
                  </div>
                  <span className="tag dim">{usage.get(m.id) ?? 0} assigned</span>
                  {m.custom && (
                    <button className="btn btn-danger btn-sm"
                      disabled={(usage.get(m.id) ?? 0) > 0}
                      title={(usage.get(m.id) ?? 0) > 0 ? 'Unassign from all companies first' : 'Delete custom metric'}
                      onClick={() => {
                        update(d => ({ ...d, customMetrics: d.customMetrics.filter(x => x.id !== m.id) }))
                        showToast('Custom metric deleted')
                      }}>Delete</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {creating && (
        <CustomMetricForm
          onClose={() => setCreating(false)}
          onSave={m => {
            update(d => ({ ...d, customMetrics: [...d.customMetrics, m] }))
            setCreating(false)
            showToast(`"${m.name}" added to your catalog`)
          }} />
      )}
      {toast}
    </>
  )
}

function CustomMetricForm({ onSave, onClose }: {
  onSave: (m: MetricDef) => void
  onClose: () => void
}) {
  const [name, setName] = useState('')
  const [definition, setDefinition] = useState('')
  const [unit, setUnit] = useState('')
  const [theme, setTheme] = useState<MetricTheme>('other')
  const [direction, setDirection] = useState<MetricDef['direction']>('higher_better')
  const [sdgs, setSdgs] = useState<number[]>([])
  const [errs, setErrs] = useState<Record<string, string>>({})

  function submit() {
    const m: MetricDef = {
      id: newId('CUSTOM').toUpperCase(),
      name: name.trim(), definition: definition.trim(), unit: unit.trim(),
      irisRef: null, theme, sdgs, sdgTargets: [], direction, custom: true,
    }
    const list = validateMetricDef(m)
    if (list.length) { setErrs(Object.fromEntries(list.map(e => [e.field, e.message]))); return }
    onSave(m)
  }

  return (
    <Modal title="Create custom metric" onClose={onClose}>
      <Field label="Metric name" error={errs.name}>
        <input className={`field-input ${errs.name ? 'invalid' : ''}`} value={name}
          onChange={e => setName(e.target.value)} placeholder="e.g. Community workshops delivered" autoFocus />
      </Field>
      <Field label="Definition" error={errs.definition} help="Write it so every company measures the same thing the same way.">
        <textarea className={`field-textarea ${errs.definition ? 'invalid' : ''}`} rows={2} value={definition}
          onChange={e => setDefinition(e.target.value)} placeholder="What exactly is counted, over what period?" />
      </Field>
      <div className="form-grid">
        <Field label="Unit" error={errs.unit}>
          <input className={`field-input ${errs.unit ? 'invalid' : ''}`} value={unit}
            onChange={e => setUnit(e.target.value)} placeholder="e.g. workshops, people, %" />
        </Field>
        <Field label="Theme">
          <select className="field-select" value={theme} onChange={e => setTheme(e.target.value as MetricTheme)}>
            {THEMES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Direction" help="Is a bigger number better (people reached) or worse (emissions)?">
        <select className="field-select" value={direction} onChange={e => setDirection(e.target.value as MetricDef['direction'])}>
          <option value="higher_better">Higher is better</option>
          <option value="lower_better">Lower is better</option>
        </select>
      </Field>
      <Field label="SDG mapping" hint="Optional — tap goals this metric contributes to.">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {Array.from({ length: 17 }, (_, i) => i + 1).map(n => (
            <button key={n} type="button" aria-pressed={sdgs.includes(n)}
              onClick={() => setSdgs(prev => prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n].sort((a, b) => a - b))}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', opacity: sdgs.includes(n) ? 1 : 0.3 }}>
              <SdgChip n={n} size={26} />
            </button>
          ))}
        </div>
      </Field>
      <div className="modal-actions">
        <button className="btn btn-subtle" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={submit}>Create metric</button>
      </div>
    </Modal>
  )
}
