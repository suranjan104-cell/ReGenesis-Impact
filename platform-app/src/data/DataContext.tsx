import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { PlatformData } from '../domain/types'
import { EMPTY_DATA } from '../domain/types'
import type { DataStore } from './store'
import { DataContext } from './context'

export function DataProvider({ store, children }: { store: DataStore; children: ReactNode }) {
  const [data, setData] = useState<PlatformData>(EMPTY_DATA)
  const [loading, setLoading] = useState(true)
  const [saveError, setSaveError] = useState(false)

  useEffect(() => {
    let alive = true
    store.load().then(d => {
      if (alive) { setData(d); setLoading(false) }
    })
    return () => { alive = false }
  }, [store])

  const persist = useCallback((next: PlatformData) => {
    store.save(next).then(() => setSaveError(false)).catch(() => setSaveError(true))
  }, [store])

  const update = useCallback((fn: (d: PlatformData) => PlatformData) => {
    setData(prev => {
      const next = fn(prev)
      persist(next)
      return next
    })
  }, [persist])

  const reset = useCallback((next?: PlatformData) => {
    const target = next ?? structuredClone(EMPTY_DATA)
    setData(target)
    if (next) persist(target)
    else store.clear().then(() => setSaveError(false)).catch(() => setSaveError(true))
  }, [persist, store])

  const value = useMemo(
    () => ({ data, loading, saveError, update, reset }),
    [data, loading, saveError, update, reset],
  )
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}
