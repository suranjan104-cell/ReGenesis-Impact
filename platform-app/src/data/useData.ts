import { useContext } from 'react'
import { DataContext } from './context'
import type { DataContextValue } from './context'

export function useData(): DataContextValue {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used inside <DataProvider>')
  return ctx
}
