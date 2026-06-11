import { useState } from 'react'
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useData } from './data/useData'
import { LoadingPane } from './components/ui'
import Onboarding from './features/onboarding/Onboarding'
import FundDashboard from './features/dashboards/FundDashboard'
import PortfolioList from './features/portfolio/PortfolioList'
import CompanyDetail from './features/portfolio/CompanyDetail'
import MetricsPage from './features/metrics/MetricsPage'
import DataCollection from './features/collection/DataCollection'
import ScoringPage from './features/scoring/ScoringPage'
import ReportsPage from './features/reports/ReportsPage'
import ReportView from './features/reports/ReportView'
import SettingsPage from './features/settings/SettingsPage'

const NAV = [
  { to: '/dashboard', ico: '◳', label: 'Dashboard' },
  { to: '/portfolio', ico: '▤', label: 'Portfolio' },
  { to: '/metrics', ico: '◎', label: 'Metrics' },
  { to: '/data', ico: '✎', label: 'Data Collection' },
  { to: '/scoring', ico: '◧', label: 'Impact Scores' },
  { to: '/reports', ico: '▣', label: 'Reports' },
]

export default function App() {
  const { data, loading } = useData()
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const closeMenu = () => setMenuOpen(false)

  if (loading) return <LoadingPane label="LOADING PLATFORM" />

  const onboarded = data.fund?.onboarded ?? false
  const isReportView = location.pathname.startsWith('/reports/view')

  // Report web view renders chrome-free (shareable / printable)
  if (isReportView) {
    return (
      <Routes>
        <Route path="/reports/view/:kind" element={<ReportView />} />
        <Route path="*" element={<Navigate to="/reports" replace />} />
      </Routes>
    )
  }

  if (!onboarded && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  if (location.pathname === '/onboarding') {
    return (
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
      </Routes>
    )
  }

  return (
    <div className="app-shell">
      {menuOpen && <div className="sidebar-scrim" onClick={() => setMenuOpen(false)} />}
      <aside className={`app-sidebar ${menuOpen ? 'open' : ''}`} aria-label="Main navigation">
        <div className="app-logo">
          <div className="app-logo-mark" aria-hidden>RI</div>
          <div>
            <div className="app-logo-name">ReGenesis IMM</div>
            <div className="app-logo-sub">Impact Platform</div>
          </div>
        </div>

        <div className="nav-section">Manage</div>
        {NAV.map(n => (
          <NavLink key={n.to} to={n.to} onClick={closeMenu}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span className="ico" aria-hidden>{n.ico}</span>{n.label}
          </NavLink>
        ))}

        <div className="nav-section">Account</div>
        <NavLink to="/settings" onClick={closeMenu} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <span className="ico" aria-hidden>⚙</span>Settings
        </NavLink>
        <a className="nav-link" href="/" target="_blank" rel="noreferrer">
          <span className="ico" aria-hidden>↗</span>Main Site
        </a>

        <div style={{ flex: 1 }} />
        <div style={{ padding: '0.8rem 0.6rem', fontSize: '0.62rem', color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>
          {data.fund?.name ?? ''}
        </div>
      </aside>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="mobile-topbar">
          <button className="burger" onClick={() => setMenuOpen(true)} aria-label="Open navigation menu">☰</button>
          <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>ReGenesis IMM</span>
        </div>
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<FundDashboard />} />
            <Route path="/portfolio" element={<PortfolioList />} />
            <Route path="/portfolio/:id" element={<CompanyDetail />} />
            <Route path="/metrics" element={<MetricsPage />} />
            <Route path="/data" element={<DataCollection />} />
            <Route path="/scoring" element={<ScoringPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
