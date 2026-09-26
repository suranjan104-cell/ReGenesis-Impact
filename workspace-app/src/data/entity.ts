import { EMPTY, EXAMPLES } from './examples.js';

/* The entity lives in this browser and nowhere else — the same promise the
   tools make. Export and import exist so it can move between machines by a
   route the user chooses. */

const KEY = 'rg_entity_v1';

export { EMPTY, EXAMPLES };

export type EntityState = typeof EMPTY;

export function loadEntity(): EntityState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(EMPTY);
    const v = JSON.parse(raw);
    // Merge over EMPTY so an entity saved by an older version still has every field.
    return {
      ...structuredClone(EMPTY), ...v,
      regions: { ...EMPTY.regions, ...v.regions },
      eu: { ...EMPTY.eu, ...v.eu }, au: { ...EMPTY.au, ...v.au }, sg: { ...EMPTY.sg, ...v.sg },
    };
  } catch {
    return structuredClone(EMPTY);
  }
}

export function saveEntity(e: EntityState) {
  try { localStorage.setItem(KEY, JSON.stringify(e)); } catch { /* private mode: the session still works */ }
}

