import type { AbcClass, ImpDimension, FundType, Instrument, CompanyStage, MetricTheme } from '../domain/types'

// IMP Five Dimensions of Impact — plain-language explanations for tooltips.
export const IMP_DIMENSIONS: { key: ImpDimension; label: string; help: string }[] = [
  { key: 'what', label: 'What', help: 'What outcome does this metric tell you about, and how important is it to the people experiencing it?' },
  { key: 'who', label: 'Who', help: 'Who experiences the outcome — and how underserved are they?' },
  { key: 'how_much', label: 'How Much', help: 'How many people, how deeply, and for how long?' },
  { key: 'contribution', label: 'Contribution', help: 'Would this have happened anyway without your investment?' },
  { key: 'risk', label: 'Risk', help: 'How likely is it that the impact is different from what you expect?' },
]

// ABC classification (Impact Management Project)
export const ABC_CLASSES: { key: AbcClass; label: string; help: string }[] = [
  { key: 'A', label: 'A — Act to avoid harm', help: 'The company prevents or reduces significant harm (e.g. cutting emissions).' },
  { key: 'B', label: 'B — Benefit stakeholders', help: 'The company generates positive outcomes for people or planet.' },
  { key: 'C', label: 'C — Contribute to solutions', help: 'The company delivers solutions to big social or environmental challenges for underserved groups.' },
]

export const FUND_TYPES: { key: FundType; label: string }[] = [
  { key: 'vc', label: 'Venture Capital' },
  { key: 'pe', label: 'Private Equity' },
  { key: 'debt', label: 'Private Debt' },
  { key: 'family_office', label: 'Family Office' },
  { key: 'foundation', label: 'Foundation' },
  { key: 'individual', label: 'Individual Investor' },
]

export const INSTRUMENTS: { key: Instrument; label: string }[] = [
  { key: 'equity', label: 'Equity' },
  { key: 'debt', label: 'Debt' },
  { key: 'grant', label: 'Grant' },
  { key: 'blended', label: 'Blended' },
]

export const STAGES: { key: CompanyStage; label: string }[] = [
  { key: 'pre_seed', label: 'Pre-seed' },
  { key: 'seed', label: 'Seed' },
  { key: 'early', label: 'Early stage' },
  { key: 'growth', label: 'Growth' },
  { key: 'mature', label: 'Mature' },
]

export const SECTORS = [
  'Clean Energy', 'Climate Tech', 'Financial Services', 'Healthcare', 'Education',
  'Agriculture', 'Water & Sanitation', 'Housing', 'Mobility', 'Circular Economy',
  'Forestry & Land Use', 'Digital Inclusion', 'Other',
]

export const GEOGRAPHIES = [
  'India', 'Southeast Asia', 'Singapore', 'Australia', 'Sub-Saharan Africa',
  'East Africa', 'West Africa', 'Latin America', 'Europe', 'North America',
  'MENA', 'Global',
]

export const THEMES: { key: MetricTheme; label: string }[] = [
  { key: 'climate', label: 'Climate & GHG' },
  { key: 'energy', label: 'Energy Access' },
  { key: 'financial_inclusion', label: 'Financial Inclusion' },
  { key: 'health', label: 'Health' },
  { key: 'education', label: 'Education' },
  { key: 'gender', label: 'Gender' },
  { key: 'jobs', label: 'Jobs & Livelihoods' },
  { key: 'water', label: 'Water & Sanitation' },
  { key: 'agriculture', label: 'Agriculture' },
  { key: 'other', label: 'Other' },
]

export const FRAMEWORK_INFO = [
  { key: 'iris' as const, label: 'IRIS+ (GIIN)', help: 'The most widely used catalog of standard impact metrics, maintained by the Global Impact Investing Network. Recommended for every fund.', recommended: true },
  { key: 'sdg' as const, label: 'UN SDGs', help: 'Map your portfolio to the 17 Sustainable Development Goals — the language most LPs expect.', recommended: true },
  { key: 'imp' as const, label: 'IMP Five Dimensions', help: 'A way to describe impact across What, Who, How Much, Contribution and Risk. Adds depth to reporting.', recommended: false },
  { key: 'ifc' as const, label: 'IFC Operating Principles', help: 'Nine principles for managing impact across the investment lifecycle. Often required by DFI-backed funds.', recommended: false },
]
