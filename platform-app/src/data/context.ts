import { createContext } from 'react'
import type { PlatformData } from '../domain/types'

export interface DataContextValue {
  data: PlatformData
  loading: boolean
  /** Apply a pure update and persist. Always go through this — never mutate. */
  update(fn: (d: PlatformData) => PlatformData): void
  /** Wipe everything (used by "clear demo data" and settings reset). */
  reset(next?: PlatformData): void
}

export const DataContext = createContext<DataContextValue | null>(null)
