import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../../data/useData'
import { Field } from '../../components/ui'
import { useToast } from '../../components/toast'
import { buildDemoData } from '../../seed/demoData'
import { FRAMEWORK_INFO, FUND_TYPES, GEOGRAPHIES, SECTORS } from '../../catalog/dimensions'
import { formatMoneyShort, parseMoney } from '../../domain/money'
import type { Framework, FundType, PlatformData, TheoryOfChange } from '../../domain/types'

const TOC_LABELS: { key: keyof TheoryOfChange; label: string }[] = [
  { key: 'inputs', label: 'Inputs' },
  { key: 'activities', label: 'Activities' },
  { key: 'outputs', label: 'Outputs' },
  { key: 'outcomes', label: 'Outcomes' },
  { key: 'impact', label: 'Impact' },
]

export default function SettingsPage() {
  const { data, update, reset } = useData()
  const nav = useNavigate()
  const [toast, showToast] = useToast()
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmDemo, setConfirmDemo] = useState(false)
  const [aumDraft, setAumDraft] = useState<string | null>(null)
  const restoreInput = useRef<HTMLInputElement>(null)

  const fund = data.fund
  const hasRealData = !data.isDemo && (data.companies.length > 0 || data.dataPoints.length > 0)

  function restoreBackup(file: File) {
    file.text().then(text => {
      let parsed: PlatformData
      try { parsed = JSON.parse(text) } catch { showToast('That file is not valid JSON'); return }
      if (parsed?.schemaVersion !== 1 || !Array.isArray(parsed.companies) || !('fund' in parsed)) {
        showToast('Not a ReGenesis IMM backup file')
        return
      }
      reset(parsed)
      showToast('Backup restored')
      nav('/dashboard')
    }).catch(() => showToast('Could not read that file'))
  }

  const toggle = <T,>(arr: T[], v: T): T[] =>
    arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]

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
                onChange={e => update(d => ({ ...d, fund: { ...d.fund!, name: e.target.value } }))}
                onBlur={e => {
                  if (!e.target.value.trim()) {
                    update(d => ({ ...d, fund: { ...d.fund!, name: 'My Fund' } }))
                    showToast('Fund name can’t be empty — reset to "My Fund"')
                  }
                }} />
            </Field>
            <Field label="Investor type">
              <select className="field-select" value={fund.type}
                onChange={e => update(d => ({ ...d, fund: { ...d.fund!, type: e.target.value as FundType } }))}>
                {FUND_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
              </select>
            </Field>
            <Field label="Assets under management" hint='Shorthand works: "50M", "1.2B".'>
              <input className="field-input" inputMode="decimal"
                value={aumDraft ?? formatMoneyShort(fund.aumUsd)}
                onChange={e => setAumDraft(e.target.value)}
                onBlur={() => {
                  if (aumDraft == null) return
                  update(d => ({ ...d, fund: { ...d.fund!, aumUsd: parseMoney(aumDraft) } }))
                  setAumDraft(null)
                }} />
            </Field>
          </div>
          <Field label="Geographies">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {GEOGRAPHIES.map(g => (
                <button key={g} type="button" className={`pick-chip ${fund.geographies.includes(g) ? 'on' : ''}`}
                  aria-pressed={fund.geographies.includes(g)}
                  onClick={() => update(d => ({ ...d, fund: { ...d.fund!, geographies: toggle(d.fund!.geographies, g) } }))}>
                  {g}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Sectors">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {SECTORS.map(s => (
                <button key={s} type="button" className={`pick-chip ${fund.sectors.includes(s) ? 'on' : ''}`}
                  aria-pressed={fund.sectors.includes(s)}
                  onClick={() => update(d => ({ ...d, fund: { ...d.fund!, sectors: toggle(d.fund!.sectors, s) } }))}>
                  {s}
                </button>
              ))}
            </div>
          </Field>
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
          <details style={{ marginTop: 10 }}>
            <summary style={{ cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-dim)' }}>Theory of Change</summary>
            {TOC_LABELS.map(t => (
              <Field key={t.key} label={t.label}>
                <textarea className="field-textarea" rows={2} value={fund.theoryOfChange[t.key]}
                  onChange={e => update(d => ({
                    ...d,
                    fund: { ...d.fund!, theoryOfChange: { ...d.fund!.theoryOfChange, [t.key]: e.target.value } },
                  }))} />
              </Field>
            ))}
          </details>
          <button className="btn btn-ghost btn-sm" style={{ marginTop: 10 }} onClick={() => nav('/onboarding')}>
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
            <button className="btn btn-ghost" onClick={() => {
              if (hasRealData) { setConfirmDemo(true); return }
              reset(buildDemoData()); showToast('Demo data loaded'); nav('/dashboard')
            }}>
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
          <button className="btn btn-ghost" onClick={() => restoreInput.current?.click()}>⬆ Restore from backup</button>
          <input ref={restoreInput} type="file" accept=".json,application/json" style={{ display: 'none' }}
            onChange={e => {
              const f = e.target.files?.[0]
              if (f) restoreBackup(f)
              e.target.value = ''
            }} />
          <button className="btn btn-danger" onClick={() => setConfirmReset(true)}>Erase all data</button>
        </div>
      </div>

      {confirmDemo && (
        <div className="modal-scrim" onClick={e => { if (e.target === e.currentTarget) setConfirmDemo(false) }}>
          <div className="modal" role="alertdialog" aria-modal="true" aria-label="Confirm demo data">
            <div className="modal-title">Replace your data with the demo?</div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
              This replaces your fund profile, {data.companies.length} companies and {data.dataPoints.length} data
              points with a fictional portfolio. Download a backup first if you might want this data back.
            </p>
            <div className="modal-actions">
              <button className="btn btn-subtle" onClick={() => setConfirmDemo(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => {
                reset(buildDemoData()); setConfirmDemo(false); showToast('Demo data loaded'); nav('/dashboard')
              }}>Load demo anyway</button>
            </div>
          </div>
        </div>
      )}

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
