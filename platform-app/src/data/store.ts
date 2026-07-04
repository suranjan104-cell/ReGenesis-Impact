import type { PlatformData } from '../domain/types'
import { EMPTY_DATA } from '../domain/types'

/**
 * DataStore is the single seam between the UI and persistence.
 *
 * Phase 1 ships LocalStorageStore (below). To swap in a real backend
 * (e.g. Supabase), implement this interface against your API and pass the
 * new store to <DataProvider store={...}> in main.tsx — nothing else in
 * the app touches persistence. See README "Swapping in a backend".
 */
export interface DataStore {
  load(): Promise<PlatformData>
  save(data: PlatformData): Promise<void>
  clear(): Promise<void>
}

const KEY = 'rg-imm-platform-v1'

export class LocalStorageStore implements DataStore {
  async load(): Promise<PlatformData> {
    try {
      const raw = localStorage.getItem(KEY)
      if (!raw) return structuredClone(EMPTY_DATA)
      const parsed = JSON.parse(raw) as PlatformData
      if (parsed.schemaVersion !== 1) return structuredClone(EMPTY_DATA)
      // Defensive defaults so older saves never crash newer code
      return { ...structuredClone(EMPTY_DATA), ...parsed }
    } catch {
      return structuredClone(EMPTY_DATA)
    }
  }

  async save(data: PlatformData): Promise<void> {
    // Throws on quota-exceeded / private-mode restrictions; DataProvider
    // catches it and surfaces a persistent "not saved" banner.
    localStorage.setItem(KEY, JSON.stringify(data))
  }

  async clear(): Promise<void> {
    localStorage.removeItem(KEY)
  }
}

export function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}
