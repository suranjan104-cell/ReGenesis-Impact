import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useData } from '../../data/useData'
import { CompanyForm } from './CompanyForm'
import { AssignMetricModal } from '../metrics/AssignMetricModal'
import { EmptyState, ProgressBar, QualityDot, SdgChip } from '../../components/ui'
import { useToast } from '../../components/toast'
import { downloadCsv, scoreColor } from '../../components/exporters'
import { TrendLine } from '../../components/charts'
import { companyScore, fmtNum, fmtUsd, pointsFor, qualityFlag } from '../../domain/aggregate'
import { metricMap } from '../../catalog/metrics'
import { INSTRUMENTS, STAGES } from '../../catalog/dimensions'
import { formatPeriod } from '../../domain/periods'

export default function CompanyDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const { data, update } = useData()
  const [editing, setEditing] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmUnassign, setConfirmUnassign] = useState<string | null>(null)
  const [toast, showToast] = useToast()

  const company = data.companies.find(c => c.id === id)
  const metrics = useMemo(() => metricMap(data.customMetrics), [data.customMetrics])
  const score = useMemo(
    () => company ? companyScore(company.id, data.assignments, data.dataPoints, metrics) : null,
    [company, data, metrics],
  )

  if (!company || !score) {
    return (
      <EmptyState icon="◌" title="Company not found"
        sub="This investment may have been removed."
        action={<Link className="btn btn-ghost" to="/portfolio">← Back to portfolio</Link>} />
    )
  }

  const myAssignments = data.assignments.filter(a => a.companyId === company.id)

  function removeCompany() {
    const aIds = new Set(myAssignments.map(a => a.id))
    update(d => ({
      ...d,
      companies: d.companies.filter(c => c.id !== company!.id),
      assignments: d.assignments.filter(a => a.companyId !== company!.id),
      dataPoints: d.dataPoints.filter(p => !aIds.has(p.assignmentId)),
    }))
    nav('/portfolio')
  }

  function exportScorecard() {
    downloadCsv(`${company!.name.replace(/\s+/g, '_')}_scorecard.csv`, [
      ['Metric', 'Unit', 'IRIS+', 'Baseline', 'Target', 'Latest period', 'Latest value', 'Progress %', 'Data quality'],
      ...score!.rows.map(r => [
        r.metric?.name ?? r.assignment.metricId,
        r.metric?.unit ?? '', r.metric?.irisRef ?? 'custom',
        r.assignment.baseline, r.assignment.target,
        r.latest ? formatPeriod(r.latest.period) : '',
        r.latest?.value ?? '',
        r.progress == null ? '' : Math.round(Math.min(r.progress, 1) * 100),
        r.quality,
      ]),
    ])
    showToast('Scorecard exported')
  }

  return (
    <>
      <div className="page-head">
        <Link to="/portfolio" style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>← Portfolio</Link>
        <div className="page-head-row" style={{ marginTop: 6 }}>
          <div>
            <h1 className="page-title">{company.name}</h1>
            <p className="page-sub">
              {company.sector} · {company.geography} · {INSTRUMENTS.find(i => i.key === company.instrument)?.label} · {STAGES.find(s => s.key === company.stage)?.label}
              {company.status !== 'active' && <span className="tag dim" style={{ marginLeft: 8 }}>{company.status === 'exited' ? 'Exited' : 'Written off'}</span>}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-ghost btn-sm" onClick={exportScorecard} disabled={!score.rows.length}>⬇ CSV</button>
            <button className="btn btn-subtle btn-sm" onClick={() => setEditing(true)}>Edit</button>
            <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(true)}>Remove</button>
          </div>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-value">{fmtUsd(company.deployedUsd)}</div>
          <div className="kpi-label">Deployed / {fmtUsd(company.committedUsd)} committed</div>
        </div>
        <div className="kpi">
          <div className="kpi-value" style={{ color: scoreColor(score.score) }}>{score.score ?? '—'}</div>
          <div className="kpi-label">Impact score (0–100)</div>
        </div>
        <div className="kpi">
          <div className="kpi-value">{Math.round(score.coverage * 100)}%</div>
          <div className="kpi-label">Metrics with data</div>
        </div>
        <div className="kpi">
          <div className="kpi-value" style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
            {company.sdgs.length ? company.sdgs.map(n => <SdgChip key={n} n={n} size={24} />) : '—'}
          </div>
          <div className="kpi-label">SDG alignment</div>
        </div>
      </div>

      {company.impactThesis && (
        <div className="card">
          <div className="card-title">Impact thesis</div>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>{company.impactThesis}</p>
        </div>
      )}

      <div className="card">
        <div className="card-title">
          Metric scorecards
          <span className="spacer" />
          <button className="btn btn-ghost btn-sm no-print" onClick={() => setAssigning(true)}>+ Assign metric</button>
        </div>

        {score.rows.length === 0 ? (
          <EmptyState icon="◎" title="No metrics assigned yet"
            sub="Pick impact metrics from the IRIS+ catalog and set targets — that's what powers dashboards and reports."
            action={<button className="btn btn-primary" onClick={() => setAssigning(true)}>+ Assign first metric</button>} />
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {score.rows.map(r => {
              const series = pointsFor(r.assignment.id, data.dataPoints).map(p => ({ period: p.period, value: p.value }))
              const latest = r.latest
              const pct = r.progress == null ? null : Math.round(Math.min(r.progress, 1) * 100)
              return (
                <div key={r.assignment.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '0.9rem 1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 220 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <QualityDot flag={qualityFlag(latest)} />
                        {r.metric?.name ?? 'Unknown metric'}
                      </div>
                      <div style={{ fontSize: '0.66rem', color: 'var(--text-faint)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                        {r.metric?.irisRef ? `IRIS+ ${r.metric.irisRef}` : 'Custom'} · {r.metric?.unit} · {r.assignment.frequency}
                        {' · '}{r.assignment.abcClass === 'A' ? 'Avoid harm' : r.assignment.abcClass === 'B' ? 'Benefit stakeholders' : 'Contribute to solutions'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: '1.05rem', color: 'var(--phosphor)' }}>
                        {latest ? fmtNum(latest.value) : '—'}
                        <span style={{ fontSize: '0.62rem', color: 'var(--text-faint)' }}> {r.metric?.unit}</span>
                      </div>
                      <div style={{ fontSize: '0.62rem', color: 'var(--text-faint)' }}>
                        {latest ? formatPeriod(latest.period) : 'no data'}
                        {r.assignment.target != null && ` · target ${fmtNum(r.assignment.target)}`}
                      </div>
                    </div>
                    <button className="btn btn-subtle btn-sm no-print" aria-label={`Remove metric ${r.metric?.name}`}
                      onClick={() => setConfirmUnassign(r.assignment.id)}>✕</button>
                  </div>

                  {pct != null && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
                      <div style={{ flex: 1 }}><ProgressBar pct={pct} /></div>
                      <span className="num" style={{ fontSize: '0.7rem', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>{pct}% of target</span>
                    </div>
                  )}

                  {series.length > 1 && (
                    <div style={{ marginTop: 12 }}>
                      <TrendLine series={series} height={120} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {editing && (
        <CompanyForm initial={company}
          onClose={() => setEditing(false)}
          onSave={c => {
            update(d => ({ ...d, companies: d.companies.map(x => x.id === c.id ? c : x) }))
            setEditing(false)
            showToast('Saved')
          }} />
      )}

      {assigning && (
        <AssignMetricModal companyId={company.id}
          onClose={() => setAssigning(false)}
          onDone={() => { setAssigning(false); showToast('Metric assigned') }} />
      )}

      {confirmUnassign && (() => {
        const a = data.assignments.find(x => x.id === confirmUnassign)
        const m = a ? metrics.get(a.metricId) : undefined
        const nPoints = data.dataPoints.filter(p => p.assignmentId === confirmUnassign).length
        return (
          <div className="modal-scrim" onClick={e => { if (e.target === e.currentTarget) setConfirmUnassign(null) }}>
            <div className="modal" role="alertdialog" aria-modal="true" aria-label="Confirm metric removal">
              <div className="modal-title">Remove {m?.name ?? 'this metric'}?</div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                {nPoints > 0
                  ? `This deletes the assignment and its ${nPoints} reported data point${nPoints === 1 ? '' : 's'}. This cannot be undone.`
                  : 'No data has been reported against this metric yet, so nothing else is lost.'}
              </p>
              <div className="modal-actions">
                <button className="btn btn-subtle" onClick={() => setConfirmUnassign(null)}>Cancel</button>
                <button className="btn btn-danger" onClick={() => {
                  update(d => ({
                    ...d,
                    assignments: d.assignments.filter(x => x.id !== confirmUnassign),
                    dataPoints: d.dataPoints.filter(p => p.assignmentId !== confirmUnassign),
                  }))
                  setConfirmUnassign(null)
                  showToast('Metric removed')
                }}>Remove metric</button>
              </div>
            </div>
          </div>
        )
      })()}

      {confirmDelete && (
        <div className="modal-scrim" onClick={e => { if (e.target === e.currentTarget) setConfirmDelete(false) }}>
          <div className="modal" role="alertdialog" aria-modal="true" aria-label="Confirm removal">
            <div className="modal-title">Remove {company.name}?</div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
              This deletes the company, its {myAssignments.length} metric assignment{myAssignments.length === 1 ? '' : 's'} and all reported data. This cannot be undone.
            </p>
            <div className="modal-actions">
              <button className="btn btn-subtle" onClick={() => setConfirmDelete(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={removeCompany}>Remove permanently</button>
            </div>
          </div>
        </div>
      )}
      {toast}
    </>
  )
}
