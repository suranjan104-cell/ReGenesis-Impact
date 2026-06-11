import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { DataProvider } from './data/DataContext'
import { LocalStorageStore } from './data/store'
import './styles/global.css'
import './components/ui.css'

// HashRouter so deep links work on any static host without rewrite rules.
// Swap LocalStorageStore for a backend store here — see README.
const store = new LocalStorageStore()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DataProvider store={store}>
      <HashRouter>
        <App />
      </HashRouter>
    </DataProvider>
  </StrictMode>,
)
