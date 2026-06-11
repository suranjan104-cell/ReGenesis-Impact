# ReGenesis IMM Platform

An in-browser Impact Measurement & Management (IMM) tool for impact fund managers.
Zero backend required in Phase 1 — all data lives in `localStorage`.

## Architecture

```
platform-app/          Vite + React + TypeScript source
  src/
    catalog/           Static data: IRIS+ metrics, SDGs, dimensions
    components/        Shared UI kit, charts (pure SVG), exporters, toast
    data/              DataProvider, LocalStorageStore, DataContext, useData hook
    domain/            Pure logic: types, aggregate functions, periods, validation
    features/          Page-level feature modules
      onboarding/      3-step wizard
      portfolio/       Company list + detail + form
      metrics/         IRIS+ catalog browser + custom metric creation
      collection/      Data entry form + CSV bulk import
      dashboards/      Fund-level KPI dashboard
      scoring/         Heat-map + transparent score breakdown
      reports/         Report type selector + full report renderer
      settings/        Fund profile + data management
    seed/              buildDemoData() — fictional fund, 8 cos, 2 yrs of data
    styles/            CSS tokens + global layout
  index.html
  vite.config.ts       base: '/platform/', outDir: '../platform'

platform/              Built static output — committed to repo, served at /platform/
```

## Data model

```typescript
PlatformData {
  schemaVersion: 1
  fund:           FundProfile | null
  companies:      Company[]
  assignments:    MetricAssignment[]   // company <-> metric + targets
  dataPoints:     DataPoint[]          // reported values per period
  customMetrics:  MetricDef[]          // user-defined beyond IRIS+ catalog
  reportNarratives: Record<ReportKind, ReportNarratives>
  isDemo:         boolean
}
```

Period keys use the format `'2024-Q1'` (quarterly) or `'2024'` (annual).

## Scoring

`companyScore()` returns a 0–100 integer:

```
score = mean over metrics-with-target-and-data of:
          clamp(progress, 0, 1) x qualityWeight x 100

qualityWeight: measured=1.0  estimated=0.8  stale=0.6  missing -> excluded
progress = (latest - baseline) / (target - baseline)
```

## Running locally

```bash
cd platform-app
npm install
npm run dev          # http://localhost:5173/platform/
npm run build        # writes to ../platform/
npm run lint
```

## Deploying

The `platform/` directory is the built output and is committed to the repository.
Any static host (Cloudflare Pages, Netlify, Vercel, GitHub Pages) serving the repo
will serve the app at `/platform/`.

Because the app uses `HashRouter`, no server-side URL rewrite rules are needed —
all routing happens in the browser fragment.

## Swapping localStorage for Supabase / Postgres

The persistence layer is abstracted behind a single interface in
`src/data/store.ts`:

```typescript
interface DataStore {
  load(): PlatformData
  save(data: PlatformData): void
  clear(): void
}
```

`LocalStorageStore` is the only implementation today.
To add a Supabase backend:

1. Create `src/data/SupabaseStore.ts` implementing `DataStore`.
2. Replace `new LocalStorageStore()` in `DataContext.tsx` with your new class.
3. Update `load()` to fetch from Supabase and return `PlatformData`.
4. Update `save()` to upsert rows — map each top-level array to its own table.
5. Add auth (Supabase Auth or Clerk) and scope all queries to `fund_id`.

No other files need to change — the `useData()` hook and all feature modules
consume the abstraction, not the implementation.

## Phase 2 stubs

The scoring page has a "Coming in Phase 2" card covering:
- Custom metric weighting
- Peer benchmarks against industry datasets
- Score history over time
- Portfolio-company data submission portal with review & approve
