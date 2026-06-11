// ── Core domain types for the IMM platform ──────────────────────

export type FundType = 'vc' | 'pe' | 'debt' | 'family_office' | 'foundation' | 'individual'

export type Framework = 'iris' | 'sdg' | 'imp' | 'ifc'

export interface TheoryOfChange {
  inputs: string
  activities: string
  outputs: string
  outcomes: string
  impact: string
}

export interface FundProfile {
  id: string
  name: string
  type: FundType
  aumUsd: number | null
  geographies: string[]
  sectors: string[]
  frameworks: Framework[]
  theoryOfChange: TheoryOfChange
  createdAt: string
  onboarded: boolean
}

export type Instrument = 'equity' | 'debt' | 'grant' | 'blended'
export type CompanyStage = 'pre_seed' | 'seed' | 'early' | 'growth' | 'mature'
export type CompanyStatus = 'active' | 'exited' | 'written_off'

export interface Company {
  id: string
  name: string
  sector: string
  geography: string
  instrument: Instrument
  investmentDate: string // ISO date
  committedUsd: number
  deployedUsd: number
  ownershipPct: number | null
  stage: CompanyStage
  status: CompanyStatus
  impactThesis: string
  sdgs: number[] // SDG goal numbers 1-17
  createdAt: string
}

// ── Metrics ──────────────────────────────────────────────────────

export type MetricTheme =
  | 'climate' | 'energy' | 'financial_inclusion' | 'health' | 'education'
  | 'gender' | 'jobs' | 'water' | 'agriculture' | 'other'

export type ImpDimension = 'what' | 'who' | 'how_much' | 'contribution' | 'risk'
export type AbcClass = 'A' | 'B' | 'C' // Avoid harm / Benefit stakeholders / Contribute to solutions

export type MetricDirection = 'higher_better' | 'lower_better'

export interface MetricDef {
  id: string            // e.g. 'PI4060' for IRIS+ refs, 'CUSTOM-xxx' for custom
  name: string
  definition: string
  unit: string
  irisRef: string | null // IRIS+ catalog code, null for custom
  theme: MetricTheme
  sdgs: number[]
  sdgTargets: string[]   // e.g. ['7.1', '13.2']
  direction: MetricDirection
  custom: boolean
}

export type ReportingFrequency = 'quarterly' | 'annual'

export interface MetricAssignment {
  id: string
  companyId: string
  metricId: string
  baseline: number | null
  target: number | null
  targetYear: number | null
  frequency: ReportingFrequency
  impDimensions: ImpDimension[]
  abcClass: AbcClass
  createdAt: string
}

// ── Data collection ──────────────────────────────────────────────

/** Period key: '2024-Q1' .. '2024-Q4' or '2024' for annual. */
export type PeriodKey = string

export type DataQuality = 'measured' | 'estimated'

export interface DataPoint {
  id: string
  assignmentId: string
  period: PeriodKey
  value: number
  quality: DataQuality
  evidenceUrl: string | null
  note: string | null
  enteredAt: string
}

// ── Reports ──────────────────────────────────────────────────────

export type ReportKind = 'annual' | 'lp_quarterly' | 'sdg_alignment'

export interface ReportNarratives {
  intro: string
  highlights: string
  outlook: string
}

// ── Store shape ──────────────────────────────────────────────────

export interface PlatformData {
  schemaVersion: 1
  fund: FundProfile | null
  companies: Company[]
  customMetrics: MetricDef[]
  assignments: MetricAssignment[]
  dataPoints: DataPoint[]
  reportNarratives: Partial<Record<ReportKind, ReportNarratives>>
  isDemo: boolean
}

export const EMPTY_DATA: PlatformData = {
  schemaVersion: 1,
  fund: null,
  companies: [],
  customMetrics: [],
  assignments: [],
  dataPoints: [],
  reportNarratives: {},
  isDemo: false,
}
