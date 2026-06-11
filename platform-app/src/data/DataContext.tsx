import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { PlatformData } from '../domain/types'
import { EMPTY_DATA } from '../domain/types'
import type { DataStore } from './store'
import { DataContext } from './context'

export function DataProvider({ store, children }: { store: DataStore; children: ReactNode }) {
  const [data, setData] = useState<PlatformData>(EMPTY_DATA)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    store.load().then(d => {
      if (alive) { setData(d); setLoading(false) }
    })
    return () => { alive = false }
  }, [store])

  const update = useCallback((fn: (d: PlatformData) => PlatformData) => {
    setData(prev => {
      const next = fn(prev)
      void store.save(next)
      return next
    })
  }, [store])

  const reset = useCallback((next?: PlatformData) => {
    const target = next ?? structuredClone(EMPTY_DATA)
    setData(target)
    if (next) void store.save(target)
    else void store.clear()
  }, [store])

  const value = useMemo(() => ({ data, loading, update, reset }), [data, loading, update, reset])
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}
