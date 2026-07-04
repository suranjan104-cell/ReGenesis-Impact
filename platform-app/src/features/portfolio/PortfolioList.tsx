import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../../data/useData'
import { CompanyForm } from './CompanyForm'
import { EmptyState, QualityDot, SdgChip } from '../../components/ui'
import { useToast } from '../../components/toast'
import { downloadCsv, scoreColor } from '../../components/exporters'
import { companyScore, fmtUsd, qualityFlag, latestPointFor } from '../../domain/aggregate'

import { metricMap } from '../../catalog/metrics'
import { STAGES } from '../../catalog/dimensions'
import type { Company } from '../../domain/types'

type SortKey = 'name' | 'sector' | 'deployedUsd' | 'investmentDate' | 'score'

export default function PortfolioList() {
  const { data, update } = useData()
  const nav = useNavigate()
  const [showForm, setShowForm] = useState(false)
  const [q, setQ] = useState('')
  const [sector, setSector] = useState('')
  const [status, setStatus] = useState('')
  const [sort, setSort] = useState<SortKey>('deployedUsd')
  const [dir, setDir] = useState<1 | -1>(-1)
  const [toast, showToast] = useToast()

  const metrics = useMemo(() => metricMap(data.customMetrics), [data.customMetrics])
  const scores = useMemo(() => {
    const m = new Map<string, number | null>()
    for (const c of data.companies) {
      m.set(c.id, companyScore(c.id, data.assignments, data.dataPoints, metrics).score)
    }
    return m
  }, [data, metrics])

  const sectors = useMemo(() => [...new Set(data.companies.map(c => c.sector))].sort(), [data.companies])

  const rows = useMemo(() => {
    let list = data.companies.filter(c =>
      (!q || c.name.toLowerCase().includes(q.toLowerCase()) || c.geography.toLowerCase().includes(q.toLowerCase())) &&
      (!sector || c.sector === sector) &&
      (!status || c.status === status),
    )
    list = [...list].sort((a, b) => {
      let cmp: number
      if (sort === 'score') cmp = (scores.get(a.id) ?? -1) - (scores.get(b.id) ?? -1)
      else if (sort === 'deployedUsd') cmp = a.deployedUsd - b.deployedUsd
      else if (sort === 'investmentDate') cmp = a.investmentDate.localeCompare(b.investmentDate)
      else cmp = String(a[sort]).localeCompare(String(b[sort]))
      return cmp * dir
    })
    return list
  }, [data.companies, q, sector, status, sort, dir, scores])

  function headerClick(k: SortKey) {
    if (sort === k) setDir(d => (d === 1 ? -1 : 1))
    else { setSort(k); setDir(k === 'name' || k === 'sector' ? 1 : -1) }
  }

  /** Keyboard + screen-reader support for sortable column headers. */
  function sortHeaderProps(k: SortKey) {
    return {
      tabIndex: 0,
      role: 'button' as const,
      'aria-sort': sort === k ? (dir === 1 ? 'ascending' as const : 'descending' as const) : undefined,
      onClick: () => headerClick(k),
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); headerClick(k) }
      },
    }
  }

  function dataHealth(c: Company): { flag: ReturnType<typeof qualityFlag>; n: number } {
    const mine = data.assignments.filter(a => a.companyId === c.id)
    if (!mine.length) return { flag: 'missing', n: 0 }
    let worst: ReturnType<typeof qualityFlag> = 'measured'
    const rank = { measured: 0, estimated: 1, stale: 2, missing: 3 }
    for (const a of mine) {
      const f = qualityFlag(latestPointFor(a.id, data.dataPoints))
      if (rank[f] > rank[worst]) worst = f
    }
    return { flag: worst, n: mine.length }
  }

  function exportCsv() {
    downloadCsv('portfolio.csv', [
      ['Company', 'Sector', 'Geography', 'Instrument', 'Stage', 'Status', 'Invested', 'Committed USD', 'Deployed USD', 'Ownership %', 'SDGs', 'Impact Score'],
      ...rows.map(c => [
        c.name, c.sector, c.geography, c.instrument,
        STAGES.find(s => s.key === c.stage)?.label ?? c.stage, c.status,
        c.investmentDate, c.committedUsd, c.deployedUsd, c.ownershipPct,
        c.sdgs.join(' '), scores.get(c.id) ?? '',
      ]),
    ])
    showToast('Portfolio exported as CSV')
  }

  return (
    <>
      <div className="page-head page-head-row">
        <div>
          <h1 className="page-title">Portfolio</h1>
          <p className="page-sub">Every investment you track, with live impact scores and data health.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={exportCsv} disabled={!rows.length}>⬇ CSV</button>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Add investment</button>
        </div>
      </div>

      {data.companies.length > 0 && (
        <div className="toolbar">
          <input className="field-input grow" placeholder="Search by name or geography…"
            value={q} onChange={e => setQ(e.target.value)} aria-label="Search portfolio" />
          <select className="field-select" value={sector} onChange={e => setSector(e.target.value)} aria-label="Filter by sector">
            <option value="">All sectors</option>
            {sectors.map(s => <option key={s}>{s}</option>)}
          </select>
          <select className="field-select" value={status} onChange={e => setStatus(e.target.value)} aria-label="Filter by status">
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="exited">Exited</option>
            <option value="written_off">Written off</option>
          </select>
        </div>
      )}

      {data.companies.length === 0 ? (
        <EmptyState icon="▤" title="No investments yet"
          sub="Add your first portfolio company — name, capital, and sector is all you need to start."
          action={<button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Add your first investment</button>} />
      ) : rows.length === 0 ? (
        <EmptyState icon="◌" title="No matches"
          sub="No companies match your current search and filters." />
      ) : (
        <div className="card" style={{ padding: '0.4rem 0' }}>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th className="sortable" {...sortHeaderProps('name')}>Company {sort === 'name' && (dir === 1 ? '↑' : '↓')}</th>
                  <th className="sortable" {...sortHeaderProps('sector')}>Sector {sort === 'sector' && (dir === 1 ? '↑' : '↓')}</th>
                  <th>SDGs</th>
                  <th className="sortable" {...sortHeaderProps('deployedUsd')}>Deployed {sort === 'deployedUsd' && (dir === 1 ? '↑' : '↓')}</th>
                  <th>Data</th>
                  <th className="sortable" {...sortHeaderProps('score')}>Score {sort === 'score' && (dir === 1 ? '↑' : '↓')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(c => {
                  const health = dataHealth(c)
                  const score = scores.get(c.id) ?? null
                  return (
                    <tr key={c.id} className="clickable" onClick={() => nav(`/portfolio/${c.id}`)}
                      tabIndex={0} onKeyDown={e => { if (e.key === 'Enter') nav(`/portfolio/${c.id}`) }}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{c.name}
                          {c.status !== 'active' && <span className="tag dim" style={{ marginLeft: 8 }}>{c.status === 'exited' ? 'Exited' : 'Written off'}</span>}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-faint)' }}>{c.geography} · {c.instrument}</div>
                      </td>
                      <td>{c.sector}</td>
                      <td><div style={{ display: 'flex', gap: 3 }}>{c.sdgs.slice(0, 4).map(n => <SdgChip key={n} n={n} size={20} />)}{c.sdgs.length > 4 && <span className="tag dim">+{c.sdgs.length - 4}</span>}</div></td>
                      <td className="num">{fmtUsd(c.deployedUsd)}</td>
                      <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><QualityDot flag={health.flag} /><span style={{ fontSize: '0.7rem', color: 'var(--text-faint)' }}>{health.n} metrics</span></span></td>
                      <td className="num">
                        {score == null
                          ? <span style={{ color: 'var(--text-faint)' }}>—</span>
                          : <span style={{ color: scoreColor(score), fontWeight: 700 }}>{score}</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <CompanyForm
          onClose={() => setShowForm(false)}
          onSave={c => {
            update(d => ({ ...d, companies: [...d.companies, c] }))
            setShowForm(false)
            showToast(`${c.name} added to portfolio`)
          }} />
      )}
      {toast}
    </>
  )
}
