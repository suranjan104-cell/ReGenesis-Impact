import type {
  Company, DataPoint, MetricAssignment, PlatformData,
} from '../domain/types'

// Deterministic demo dataset: 1 fund, 8 companies, 8 quarters (2024–2025),
// mixed data quality, a few gaps — so dashboards feel alive on first open.

const Q_PERIODS = [
  '2024-Q1', '2024-Q2', '2024-Q3', '2024-Q4',
  '2025-Q1', '2025-Q2', '2025-Q3', '2025-Q4',
]

interface SeedCompany {
  c: Omit<Company, 'createdAt'>
  metrics: {
    metricId: string
    baseline: number
    target: number
    start: number          // value at 2024-Q1
    growth: number         // multiplicative growth per quarter
    quality: ('m' | 'e')[] // per-quarter quality pattern, cycled
    skip?: number[]        // quarter indexes with missing data
  }[]
}

const SEED: SeedCompany[] = [
  {
    c: {
      id: 'co_suryagrid', name: 'SuryaGrid Energy', sector: 'Clean Energy', geography: 'India',
      instrument: 'equity', investmentDate: '2023-06-15', committedUsd: 4_000_000, deployedUsd: 3_200_000,
      ownershipPct: 18, stage: 'growth', status: 'active',
      impactThesis: 'Distributed rooftop solar for SME industrial clusters, displacing diesel generation across Tier-2 Indian cities.',
      sdgs: [7, 13],
    },
    metrics: [
      { metricId: 'PI5376', baseline: 800, target: 9000, start: 1400, growth: 1.22, quality: ['m'] },
      { metricId: 'PI2764', baseline: 500, target: 6000, start: 900, growth: 1.21, quality: ['m', 'm', 'e'] },
      { metricId: 'OI3757', baseline: 35, target: 120, start: 44, growth: 1.10, quality: ['m'], skip: [6] },
    ],
  },
  {
    c: {
      id: 'co_kisanleaf', name: 'KisanLeaf Agri', sector: 'Agriculture', geography: 'India',
      instrument: 'blended', investmentDate: '2023-09-01', committedUsd: 2_500_000, deployedUsd: 2_500_000,
      ownershipPct: 12, stage: 'early', status: 'active',
      impactThesis: 'Regenerative-agriculture inputs and guaranteed offtake for smallholder farmers in Maharashtra and Karnataka.',
      sdgs: [2, 15],
    },
    metrics: [
      { metricId: 'PI6372', baseline: 2000, target: 25000, start: 3500, growth: 1.18, quality: ['m', 'e'] },
      { metricId: 'PI1029', baseline: 600, target: 8000, start: 950, growth: 1.17, quality: ['e'] },
      { metricId: 'PI4127', baseline: 0, target: 30, start: 6, growth: 1.16, quality: ['e', 'e', 'm'], skip: [2, 5] },
    ],
  },
  {
    c: {
      id: 'co_mekongsave', name: 'MekongSave Financial', sector: 'Financial Services', geography: 'Southeast Asia',
      instrument: 'equity', investmentDate: '2024-01-20', committedUsd: 5_000_000, deployedUsd: 3_750_000,
      ownershipPct: 15, stage: 'growth', status: 'active',
      impactThesis: 'Micro-savings and credit for unbanked garment and gig workers in Vietnam and Cambodia, women-first product design.',
      sdgs: [1, 5, 8],
    },
    metrics: [
      { metricId: 'PI4060', baseline: 12000, target: 150000, start: 21000, growth: 1.19, quality: ['m'] },
      { metricId: 'PI8330', baseline: 8000, target: 100000, start: 14500, growth: 1.19, quality: ['m'] },
      { metricId: 'PI2575', baseline: 1500, target: 30000, start: 3100, growth: 1.20, quality: ['m', 'e'], skip: [7] },
    ],
  },
  {
    c: {
      id: 'co_aquapure', name: 'AquaPura Systems', sector: 'Water & Sanitation', geography: 'East Africa',
      instrument: 'debt', investmentDate: '2024-03-10', committedUsd: 1_800_000, deployedUsd: 1_200_000,
      ownershipPct: null, stage: 'early', status: 'active',
      impactThesis: 'Solar-powered community water purification kiosks across peri-urban Kenya and Tanzania.',
      sdgs: [6, 3],
    },
    metrics: [
      { metricId: 'PI2822W', baseline: 5000, target: 80000, start: 9000, growth: 1.17, quality: ['e', 'm'] },
      { metricId: 'PI7059', baseline: 1200, target: 20000, start: 2100, growth: 1.18, quality: ['e'], skip: [5, 6, 7] },
    ],
  },
  {
    c: {
      id: 'co_shikshanet', name: 'ShikshaNet Learning', sector: 'Education', geography: 'India',
      instrument: 'equity', investmentDate: '2023-11-05', committedUsd: 3_000_000, deployedUsd: 3_000_000,
      ownershipPct: 20, stage: 'growth', status: 'active',
      impactThesis: 'Vernacular-language vocational learning platform for first-generation learners in semi-urban India.',
      sdgs: [4, 8],
    },
    metrics: [
      { metricId: 'PI2389', baseline: 30000, target: 400000, start: 52000, growth: 1.2, quality: ['m'] },
      { metricId: 'PI8372', baseline: 6000, target: 120000, start: 11000, growth: 1.21, quality: ['m', 'm', 'm', 'e'] },
      { metricId: 'PI9596', baseline: 0, target: 25, start: 5, growth: 1.15, quality: ['e'], skip: [1, 3] },
    ],
  },
  {
    c: {
      id: 'co_carecircle', name: 'CareCircle Health', sector: 'Healthcare', geography: 'Sub-Saharan Africa',
      instrument: 'equity', investmentDate: '2024-05-22', committedUsd: 2_200_000, deployedUsd: 1_550_000,
      ownershipPct: 14, stage: 'early', status: 'active',
      impactThesis: 'Telehealth plus last-mile pharmacy network serving low-income households in Nigeria and Ghana.',
      sdgs: [3, 10],
    },
    metrics: [
      { metricId: 'PI4519', baseline: 4000, target: 90000, start: 7200, growth: 1.22, quality: ['m', 'e'] },
      { metricId: 'PI9468', baseline: 2500, target: 60000, start: 4600, growth: 1.22, quality: ['e'] },
      { metricId: 'OI2444', baseline: 38, target: 50, start: 40, growth: 1.015, quality: ['m'], skip: [6, 7] },
    ],
  },
  {
    c: {
      id: 'co_loopworks', name: 'LoopWorks Materials', sector: 'Circular Economy', geography: 'Australia',
      instrument: 'equity', investmentDate: '2024-08-01', committedUsd: 3_500_000, deployedUsd: 2_100_000,
      ownershipPct: 16, stage: 'growth', status: 'active',
      impactThesis: 'Chemical recycling of mixed plastics into food-grade feedstock, replacing virgin polymer demand.',
      sdgs: [12, 13],
    },
    metrics: [
      { metricId: 'PI1296', baseline: 300, target: 12000, start: 700, growth: 1.25, quality: ['m'] },
      { metricId: 'OI1697', baseline: 450, target: 280, start: 430, growth: 0.97, quality: ['m', 'e'] },
      { metricId: 'OI9028', baseline: 0, target: 60, start: 6, growth: 1.18, quality: ['m'], skip: [4] },
    ],
  },
  {
    c: {
      id: 'co_grameenpwr', name: 'GrameenPower Micro', sector: 'Clean Energy', geography: 'Sub-Saharan Africa',
      instrument: 'grant', investmentDate: '2023-04-12', committedUsd: 900_000, deployedUsd: 900_000,
      ownershipPct: null, stage: 'seed', status: 'active',
      impactThesis: 'Pay-as-you-go solar home systems with mobile-money financing for off-grid households in Uganda.',
      sdgs: [7, 1],
    },
    metrics: [
      { metricId: 'PI7783', baseline: 9000, target: 120000, start: 16000, growth: 1.16, quality: ['e', 'm'] },
      { metricId: 'PI8706', baseline: 2000, target: 30000, start: 3600, growth: 1.17, quality: ['e'], skip: [3, 6] },
    ],
  },
]

export function buildDemoData(): PlatformData {
  const now = new Date().toISOString()
  const companies: Company[] = []
  const assignments: MetricAssignment[] = []
  const dataPoints: DataPoint[] = []

  for (const seed of SEED) {
    companies.push({ ...seed.c, createdAt: now })
    seed.metrics.forEach((m, mi) => {
      const aid = `as_${seed.c.id}_${mi}`
      assignments.push({
        id: aid,
        companyId: seed.c.id,
        metricId: m.metricId,
        baseline: m.baseline,
        target: m.target,
        targetYear: 2027,
        frequency: 'quarterly',
        impDimensions: ['what', 'who', 'how_much'],
        abcClass: mi === 0 ? 'C' : 'B',
        createdAt: now,
      })
      Q_PERIODS.forEach((period, qi) => {
        if (m.skip?.includes(qi)) return
        const value = Math.round(m.start * Math.pow(m.growth, qi) * 100) / 100
        const q = m.quality[qi % m.quality.length]
        dataPoints.push({
          id: `dp_${aid}_${qi}`,
          assignmentId: aid,
          period,
          value,
          quality: q === 'm' ? 'measured' : 'estimated',
          evidenceUrl: q === 'm' && qi % 4 === 3 ? 'https://example.com/evidence.pdf' : null,
          note: null,
          enteredAt: now,
        })
      })
    })
  }

  return {
    schemaVersion: 1,
    fund: {
      id: 'fund_demo',
      name: 'Meridian Impact Ventures (Demo)',
      type: 'vc',
      aumUsd: 50_000_000,
      geographies: ['India', 'Southeast Asia', 'Sub-Saharan Africa', 'Australia'],
      sectors: ['Clean Energy', 'Financial Services', 'Agriculture', 'Healthcare', 'Education'],
      frameworks: ['iris', 'sdg'],
      theoryOfChange: {
        inputs: 'US$50M fund; sector expertise in energy access and inclusive finance; local operating partners in 4 regions.',
        activities: 'Invest US$1–5M growth equity in companies serving low-income and climate-exposed populations; provide hands-on impact and governance support.',
        outputs: 'Portfolio companies scale products: clean energy systems, financial accounts, learning seats, healthcare visits.',
        outcomes: 'Households gain reliable energy, formal financial access, better learning and health outcomes; emissions avoided at scale.',
        impact: 'Measurably improved economic resilience and well-being for 1M+ underserved people, and 100k tCO2e avoided, by 2030.',
      },
      createdAt: now,
      onboarded: true,
    },
    companies,
    customMetrics: [],
    assignments,
    dataPoints,
    reportNarratives: {},
    isDemo: true,
  }
}
