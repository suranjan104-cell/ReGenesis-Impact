import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useData } from '../../data/useData'
import { SdgChip } from '../../components/ui'
import { DonutChart } from '../../components/charts'
import { scoreColor } from '../../components/exporters'
import {
  aggregateMetricTotal, capitalBySdg, capitalWeightedScore, companyScore,
  fmtNum, fmtUsd, fundKpis,
} from '../../domain/aggregate'
import { metricMap } from '../../catalog/metrics'
import { sdgByNumber } from '../../catalog/sdgs'
import { FUND_TYPES } from '../../catalog/dimensions'
import { recentPeriods, formatPeriod } from '../../domain/periods'
import type { ReportKind, ReportNarratives } from '../../domain/types'
import './report.css'

const KIND_TITLES: Record<ReportKind, string> = {
  annual: 'Annual Impact Report',
  lp_quarterly: 'LP Quarterly Summary',
  sdg_alignment: 'SDG Alignment Summary',
}

const DEFAULT_NARRATIVES: Record<ReportKind, ReportNarratives> = {
  annual: {
    intro: 'This report summarises the impact performance of the portfolio over the past year, prepared in line with our commitment to transparent, evidence-based impact management.',
    highlights: 'Edit this section to call out the year\'s biggest wins — companies that beat targets, new investments, milestones reached.',
    outlook: 'Edit this section to describe priorities for the coming year: pipeline, data quality improvements, and impact goals.',
  },
  lp_quarterly: {
    intro: 'A summary of portfolio impact activity for the most recent quarter.',
    highlights: 'Edit this section with the quarter\'s key movements and any items needing LP attention.',
    outlook: 'Edit this section with what to expect next quarter.',
  },
  sdg_alignment: {
    intro: 'This summary maps the portfolio\'s deployed capital and reported outcomes to the UN Sustainable Development Goals.',
    highlights: 'Edit this section to highlight the strongest SDG contributions.',
    outlook: 'Edit this section to note planned changes in SDG focus.',
  },
}

export default function ReportView() {
  const { kind: kindParam } = useParams()
  const kind = (['annual', 'lp_quarterly', 'sdg_alignment'].includes(kindParam ?? '') ? kindParam : 'annual') as ReportKind
  const { data, update } = useData()

  const saved = data.reportNarratives[kind]
  const [narr, setNarr] = useState<ReportNarratives>(saved ?? DEFAULT_NARRATIVES[kind])
  const [editing, setEditing] = useState<keyof ReportNarratives | null>(null)

  const metrics = useMemo(() => metricMap(data.customMetrics), [data.customMetrics])
  const kpis = useMemo(() => fundKpis(data), [data])
  const scores = useMemo(() => {
    const m = new Map<string, ReturnType<typeof companyScore>>()
    for (const c of data.companies) m.set(c.id, companyScore(c.id, data.assignments, data.dataPoints, metrics))
    return m
  }, [data, metrics])
  const cwScore = useMemo(() => capitalWeightedScore(data.companies, scores), [data.companies, scores])

  const sdgCapital = useMemo(() =>
    [...capitalBySdg(data.companies).entries()].sort((a, b) => b[1] - a[1]),
  [data.companies])

  const topMetrics = useMemo(() => {
    const ids = [...new Set(data.assignments.map(a => a.metricId))]
    return ids
      .map(id => ({ metric: metrics.get(id), ...aggregateMetricTotal(id, data.assignments, data.dataPoints) }))
      .filter(x => x.metric && x.companies > 0)
      .sort((a, b) => b.companies - a.companies)
      .slice(0, 8)
  }, [data, metrics])

  const lastQuarter = recentPeriods('quarterly', 1)[0]
  const today = new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
  const fundTypeLabel = FUND_TYPES.find(t => t.key === data.fund?.type)?.label ?? ''

  function saveNarrative(key: keyof ReportNarratives, value: string) {
    const next = { ...narr, [key]: value }
    setNarr(next)
    update(d => ({ ...d, reportNarratives: { ...d.reportNarratives, [kind]: next } }))
  }

  const narrativeProps = (k: keyof ReportNarratives) => ({
    text: narr[k],
    editing: editing === k,
    onStartEdit: () => setEditing(k),
    onChange: (v: string) => setNarr(prev => ({ ...prev, [k]: v })),
    onSave: () => { saveNarrative(k, narr[k]); setEditing(null) },
    onDone: () => setEditing(null),
  })

  return (
    <div className="rpt-page">
      <div className="rpt-toolbar no-print">
        <Link to="/reports" className="btn btn-subtle btn-sm">← Back to reports</Link>
        <span style={{ flex: 1 }} />
        <button className="btn btn-primary" onClick={() => window.print()}>🖨 Print / Save PDF</button>
      </div>

      <header className="rpt-header">
        <div className="rpt-brand">
          <div className="app-logo-mark" aria-hidden>RI</div>
          <span className="rpt-brand-name">ReGenesis IMM</span>
        </div>
        <h1 className="rpt-title">{KIND_TITLES[kind]}</h1>
        <div className="rpt-meta">
          <strong>{data.fund?.name}</strong>
          {fundTypeLabel && <> · {fundTypeLabel}</>}
          {data.fund?.aumUsd != null && <> · {fmtUsd(data.fund.aumUsd)} AUM</>}
          <br />
          {kind === 'lp_quarterly' ? `Reporting period: ${formatPeriod(lastQuarter)} · ` : ''}
          Generated {today}
        </div>
      </header>

      <NarrativeBlock label="Introduction" {...narrativeProps('intro')} />

      <section className="rpt-section">
        <h2 className="rpt-h2">Portfolio at a glance</h2>
        <div className="rpt-kpis">
          <div className="rpt-kpi"><div className="rpt-kpi-v">{fmtUsd(kpis.totalDeployed)}</div><div className="rpt-kpi-l">Capital deployed</div></div>
          <div className="rpt-kpi"><div className="rpt-kpi-v">{fmtUsd(kpis.totalCommitted)}</div><div className="rpt-kpi-l">Capital committed</div></div>
          <div className="rpt-kpi"><div className="rpt-kpi-v">{kpis.activeCompanies}</div><div className="rpt-kpi-l">Active companies</div></div>
          <div className="rpt-kpi"><div className="rpt-kpi-v">{kpis.metricsTracked}</div><div className="rpt-kpi-l">Metrics tracked</div></div>
          <div className="rpt-kpi"><div className="rpt-kpi-v">{Math.round(kpis.dataCoverage * 100)}%</div><div className="rpt-kpi-l">Data coverage</div></div>
          <div className="rpt-kpi"><div className="rpt-kpi-v" style={{ color: scoreColor(cwScore) }}>{cwScore ?? '—'}</div><div className="rpt-kpi-l">Capital-weighted impact score</div></div>
        </div>
      </section>

      {(kind === 'annual' || kind === 'lp_quarterly') && topMetrics.length > 0 && (
        <section className="rpt-section">
          <h2 className="rpt-h2">Aggregate impact</h2>
          <table className="rpt-table">
            <thead><tr><th>Metric</th><th>IRIS+</th><th>Latest total</th><th>Companies</th></tr></thead>
            <tbody>
              {topMetrics.map(t => (
                <tr key={t.metric!.id}>
                  <td>{t.metric!.name}</td>
                  <td className="mono">{t.metric!.irisRef ?? 'custom'}</td>
                  <td className="mono">{fmtNum(t.total)} {t.metric!.unit}</td>
                  <td className="mono">{t.companies}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <NarrativeBlock label="Highlights" {...narrativeProps('highlights')} />

      {(kind === 'annual' || kind === 'sdg_alignment') && sdgCapital.length > 0 && (
        <section className="rpt-section">
          <h2 className="rpt-h2">SDG alignment</h2>
          <div className="rpt-sdg-flex">
            <div style={{ width: 200, flexShrink: 0 }}>
              <DonutChart
                slices={sdgCapital.map(([n, v]) => ({ label: `SDG ${n}`, value: v, color: sdgByNumber.get(n)?.color ?? '#888' }))}
                centerLabel={`${sdgCapital.length} SDGs`} />
            </div>
            <table className="rpt-table" style={{ flex: 1 }}>
              <thead><tr><th>Goal</th><th>Capital deployed</th><th>Companies</th></tr></thead>
              <tbody>
                {sdgCapital.map(([n, v]) => (
                  <tr key={n}>
                    <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><SdgChip n={n} size={22} /> {sdgByNumber.get(n)?.name}</span></td>
                    <td className="mono">{fmtUsd(v)}</td>
                    <td className="mono">{data.companies.filter(c => c.sdgs.includes(n)).length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {kind !== 'sdg_alignment' && (
        <section className="rpt-section">
          <h2 className="rpt-h2">Company scorecards</h2>
          <table className="rpt-table">
            <thead><tr><th>Company</th><th>Sector</th><th>Deployed</th><th>SDGs</th><th>Score</th><th>Data coverage</th></tr></thead>
            <tbody>
              {data.companies.map(c => {
                const s = scores.get(c.id)
                return (
                  <tr key={c.id}>
                    <td><strong>{c.name}</strong><br /><span style={{ fontSize: '0.66rem', opacity: 0.6 }}>{c.geography}</span></td>
                    <td>{c.sector}</td>
                    <td className="mono">{fmtUsd(c.deployedUsd)}</td>
                    <td><span style={{ display: 'flex', gap: 2 }}>{c.sdgs.slice(0, 5).map(n => <SdgChip key={n} n={n} size={18} />)}</span></td>
                    <td className="mono" style={{ color: scoreColor(s?.score ?? null), fontWeight: 700 }}>{s?.score ?? '—'}</td>
                    <td className="mono">{s ? Math.round(s.coverage * 100) : 0}%</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>
      )}

      {kind === 'annual' && data.fund?.theoryOfChange && Object.values(data.fund.theoryOfChange).some(v => v.trim()) && (
        <section className="rpt-section">
          <h2 className="rpt-h2">Theory of Change</h2>
          <div className="rpt-toc">
            {(['inputs', 'activities', 'outputs', 'outcomes', 'impact'] as const).map(k =>
              data.fund!.theoryOfChange[k].trim() ? (
                <div key={k} className="rpt-toc-item">
                  <div className="rpt-toc-label">{k}</div>
                  <p>{data.fund!.theoryOfChange[k]}</p>
                </div>
              ) : null)}
          </div>
        </section>
      )}

      <NarrativeBlock label="Outlook" {...narrativeProps('outlook')} />

      <footer className="rpt-footer">
        Generated by ReGenesis IMM Platform · Data as entered by the fund · {today}
      </footer>
    </div>
  )
}

function NarrativeBlock(props: {
  label: string
  text: string
  editing: boolean
  onStartEdit: () => void
  onChange: (v: string) => void
  onSave: () => void
  onDone: () => void
}) {
  return (
    <section className="rpt-section">
      <h2 className="rpt-h2">{props.label}</h2>
      {props.editing ? (
        <div>
          <textarea className="field-textarea no-print" rows={4} value={props.text} autoFocus
            onChange={e => props.onChange(e.target.value)} />
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }} className="no-print">
            <button className="btn btn-primary btn-sm" onClick={props.onSave}>Save</button>
            <button className="btn btn-subtle btn-sm" onClick={props.onDone}>Done</button>
          </div>
        </div>
      ) : (
        <p className="rpt-narrative" onClick={props.onStartEdit} title="Click to edit">
          {props.text}
          <span className="rpt-edit-hint no-print"> ✎ edit</span>
        </p>
      )}
    </section>
  )
}
