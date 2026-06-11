import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../../data/useData'
import { Field } from '../../components/ui'
import { useToast } from '../../components/toast'
import { buildDemoData } from '../../seed/demoData'
import { FRAMEWORK_INFO, FUND_TYPES } from '../../catalog/dimensions'
import type { Framework, FundType } from '../../domain/types'

export default function SettingsPage() {
  const { data, update, reset } = useData()
  const nav = useNavigate()
  const [toast, showToast] = useToast()
  const [confirmReset, setConfirmReset] = useState(false)

  const fund = data.fund

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Settings</h1>
        <p className="page-sub">Fund profile, reporting frameworks and data management.</p>
      </div>

      {fund && (
        <div className="card">
          <div className="card-title">Fund profile</div>
          <div className="form-grid">
            <Field label="Fund name">
              <input className="field-input" value={fund.name}
                onChange={e => update(d => ({ ...d, fund: { ...d.fund!, name: e.target.value } }))} />
            </Field>
            <Field label="Investor type">
              <select className="field-select" value={fund.type}
                onChange={e => update(d => ({ ...d, fund: { ...d.fund!, type: e.target.value as FundType } }))}>
                {FUND_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Reporting frameworks">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {FRAMEWORK_INFO.map(f => {
                const on = fund.frameworks.includes(f.key as Framework)
                return (
                  <button key={f.key} type="button" className={`pick-chip ${on ? 'on' : ''}`} aria-pressed={on}
                    title={f.help}
                    onClick={() => update(d => ({
                      ...d,
                      fund: {
                        ...d.fund!,
                        frameworks: on
                          ? d.fund!.frameworks.filter(x => x !== f.key)
                          : [...d.fund!.frameworks, f.key as Framework],
                      },
                    }))}>
                    {f.label}
                  </button>
                )
              })}
            </div>
          </Field>
          <button className="btn btn-ghost btn-sm" onClick={() => nav('/onboarding')}>
            Re-run onboarding wizard →
          </button>
        </div>
      )}

      <div className="card">
        <div className="card-title">Demo data</div>
        {data.isDemo ? (
          <>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: 12 }}>
              You're currently using the demo dataset. Clearing it removes the fictional fund, companies and data so you can start with your own.
            </p>
            <button className="btn btn-danger" onClick={() => { reset(); nav('/onboarding') }}>
              Clear demo data &amp; start fresh
            </button>
          </>
        ) : (
          <>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: 12 }}>
              Load a realistic fictional portfolio (8 companies, 2 years of quarterly data) to explore every feature.
              <strong> This replaces your current data.</strong>
            </p>
            <button className="btn btn-ghost" onClick={() => { reset(buildDemoData()); showToast('Demo data loaded'); nav('/dashboard') }}>
              Load demo data
            </button>
          </>
        )}
      </div>

      <div className="card">
        <div className="card-title">Data management</div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: 12 }}>
          All data lives in your browser (localStorage) in this Phase 1 release — nothing is sent to a server.
          Export everything as a JSON backup, or wipe it completely.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-ghost" onClick={() => {
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
            const a = document.createElement('a')
            a.href = URL.createObjectURL(blob)
            a.download = `regenesis-imm-backup-${new Date().toISOString().slice(0, 10)}.json`
            a.click()
            URL.revokeObjectURL(a.href)
            showToast('Backup downloaded')
          }}>⬇ Download backup (JSON)</button>
          <button className="btn btn-danger" onClick={() => setConfirmReset(true)}>Erase all data</button>
        </div>
      </div>

      {confirmReset && (
        <div className="modal-scrim" onClick={e => { if (e.target === e.currentTarget) setConfirmReset(false) }}>
          <div className="modal" role="alertdialog" aria-modal="true" aria-label="Confirm erase">
            <div className="modal-title">Erase everything?</div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
              This permanently deletes your fund profile, all {data.companies.length} companies,{' '}
              {data.assignments.length} metric assignments and {data.dataPoints.length} data points from this browser.
              Download a backup first if you might want this data back.
            </p>
            <div className="modal-actions">
              <button className="btn btn-subtle" onClick={() => setConfirmReset(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => { reset(); nav('/onboarding') }}>Erase all data</button>
            </div>
          </div>
        </div>
      )}
      {toast}
    </>
  )
}
