import type { MetricDef } from '../domain/types'

// Representative metrics catalog aligned to the IRIS+ taxonomy (GIIN).
// IRIS+ codes reference the public catalog at iris.thegiin.org.
// Definitions are paraphrased in plain language for usability.

const M = (
  id: string, name: string, definition: string, unit: string,
  theme: MetricDef['theme'], sdgs: number[], sdgTargets: string[],
  direction: MetricDef['direction'] = 'higher_better',
): MetricDef => ({
  id, name, definition, unit, irisRef: id, theme, sdgs, sdgTargets, direction, custom: false,
})

export const METRICS_CATALOG: MetricDef[] = [
  // ── Climate / GHG ────────────────────────────────────────────
  M('PI2764', 'GHG Emissions Avoided', 'Tonnes of CO2-equivalent emissions avoided because of the company\'s products or services, vs business-as-usual.', 'tCO2e', 'climate', [13], ['13.2']),
  M('OI1697', 'GHG Emissions Generated (Scope 1+2)', 'Direct and energy-related greenhouse gas emissions from the company\'s own operations.', 'tCO2e', 'climate', [13], ['13.2'], 'lower_better'),
  M('PI5376', 'Renewable Energy Generated', 'Total renewable energy produced and delivered in the period.', 'MWh', 'climate', [7, 13], ['7.2', '13.2']),
  M('PI9878', 'Land Reforested or Restored', 'Hectares of degraded land reforested, restored or brought under sustainable management.', 'hectares', 'climate', [13, 15], ['13.2', '15.3']),
  M('PI1296', 'Waste Diverted from Landfill', 'Tonnes of waste recycled, composted or otherwise diverted from landfill.', 'tonnes', 'climate', [12], ['12.5']),

  // ── Energy access ────────────────────────────────────────────
  M('PI7783', 'People with New Energy Access', 'Number of people gaining first-time access to electricity or clean cooking through the company.', 'people', 'energy', [7], ['7.1']),
  M('PI8706', 'Clean Energy Systems Sold', 'Number of clean energy products (solar home systems, clean cookstoves, etc.) sold in the period.', 'units', 'energy', [7], ['7.1']),
  M('PD3741', 'Energy Cost Savings for Customers', 'Money customers saved on energy because of the product, vs their previous solution.', 'USD', 'energy', [7, 1], ['7.3', '1.4']),
  M('OI6697', 'Installed Renewable Capacity', 'Total renewable generation capacity installed and operational.', 'MW', 'energy', [7], ['7.2']),

  // ── Financial inclusion ──────────────────────────────────────
  M('PI4060', 'Active Clients — Financial Services', 'Number of unique clients actively using the company\'s financial products.', 'clients', 'financial_inclusion', [1, 8], ['1.4', '8.10']),
  M('PI2575', 'First-time Borrowers', 'Clients receiving formal credit for the first time.', 'people', 'financial_inclusion', [1, 8], ['1.4', '8.10']),
  M('PI9319', 'Loans Disbursed — Value', 'Total value of loans disbursed in the period.', 'USD', 'financial_inclusion', [8], ['8.3']),
  M('PI1478', 'Rural Clients Served', 'Active clients living in rural areas.', 'clients', 'financial_inclusion', [1, 10], ['1.4', '10.2']),
  M('PI3193', 'Savings Accounts Opened', 'New formal savings accounts opened by previously unbanked clients.', 'accounts', 'financial_inclusion', [8], ['8.10']),

  // ── Health ───────────────────────────────────────────────────
  M('PI4519', 'Patients Treated', 'Unique patients receiving care via the company\'s services or facilities.', 'patients', 'health', [3], ['3.8']),
  M('PI9468', 'Low-income Patients Served', 'Patients from low-income households (bottom 40% of national income) served.', 'patients', 'health', [3, 10], ['3.8', '10.2']),
  M('PI1263', 'Health Products Distributed', 'Units of health-improving products (diagnostics, devices, medicines) delivered.', 'units', 'health', [3], ['3.8']),
  M('PI6299', 'Cost Savings per Treatment', 'Average cost saving per treatment vs the standard alternative available to the patient.', 'USD', 'health', [3], ['3.8']),

  // ── Education ────────────────────────────────────────────────
  M('PI2389', 'Students Enrolled', 'Learners actively enrolled in the company\'s education programs or platforms.', 'students', 'education', [4], ['4.1']),
  M('PI8372', 'Students Completing Programs', 'Learners who completed a full course or program in the period.', 'students', 'education', [4], ['4.1', '4.4']),
  M('PI5858', 'Teachers Trained', 'Educators trained or upskilled through the company.', 'teachers', 'education', [4], ['4.c']),
  M('PI9596', 'Learning Outcome Improvement', 'Average improvement in assessed learning outcomes vs baseline cohort.', '%', 'education', [4], ['4.1']),

  // ── Gender ───────────────────────────────────────────────────
  M('PI8330', 'Women Clients Served', 'Active women clients as users of the company\'s core product or service.', 'women', 'gender', [5], ['5.a']),
  M('OI2444', 'Women in Workforce', 'Share of the company\'s full-time workforce who are women.', '%', 'gender', [5, 8], ['5.5', '8.5']),
  M('OI8124', 'Women in Senior Management', 'Share of senior management positions held by women.', '%', 'gender', [5], ['5.5']),
  M('PI3687', 'Women-led Businesses Financed', 'Number of women-owned or women-led businesses receiving financing.', 'businesses', 'gender', [5, 8], ['5.a', '8.3']),

  // ── Jobs & livelihoods ───────────────────────────────────────
  M('OI3757', 'Full-time Jobs Supported', 'Total full-time equivalent employees at the company at period end.', 'FTE', 'jobs', [8], ['8.5']),
  M('OI9028', 'New Jobs Created', 'Net new full-time equivalent jobs created during the period.', 'FTE', 'jobs', [8], ['8.5']),
  M('PI5350', 'Smallholder Income Increase', 'Average increase in income for smallholder or micro-entrepreneur beneficiaries vs baseline.', '%', 'jobs', [1, 8], ['1.2', '8.5']),
  M('PI2822', 'Livelihoods Improved', 'People whose income or economic resilience measurably improved due to the company.', 'people', 'jobs', [1, 8], ['1.2', '8.5']),
  M('OI5479', 'Average Wage vs Local Minimum', 'Average full-time wage paid as a multiple of the local legal minimum wage.', 'x', 'jobs', [8], ['8.5']),

  // ── Water & sanitation ───────────────────────────────────────
  M('PI2822W', 'People with Improved Water Access', 'People gaining access to safely managed drinking water through the company.', 'people', 'water', [6], ['6.1']),
  M('PI7059', 'Water Treated or Saved', 'Volume of water treated, recycled or saved by the company\'s solutions.', 'm³', 'water', [6, 12], ['6.3', '12.2']),
  M('PI8043', 'People with Improved Sanitation', 'People gaining access to safely managed sanitation services.', 'people', 'water', [6], ['6.2']),

  // ── Agriculture ──────────────────────────────────────────────
  M('PI6372', 'Smallholder Farmers Reached', 'Smallholder farmers actively using the company\'s products, services or offtake.', 'farmers', 'agriculture', [2], ['2.3']),
  M('PI1029', 'Hectares Under Sustainable Practices', 'Farmland converted to or maintained under certified sustainable practices.', 'hectares', 'agriculture', [2, 15], ['2.4', '15.3']),
  M('PI4127', 'Crop Yield Improvement', 'Average yield improvement for participating farmers vs their baseline.', '%', 'agriculture', [2], ['2.3', '2.4']),
  M('PI5097', 'Post-harvest Loss Reduction', 'Reduction in post-harvest losses for participating farmers.', '%', 'agriculture', [2, 12], ['2.4', '12.3']),

  // ── Cross-cutting ────────────────────────────────────────────
  M('PI4874', 'Total Beneficiaries Reached', 'Unique individuals who directly benefited from the company\'s products or services.', 'people', 'other', [1, 10], ['1.4', '10.2']),
  M('PI9652', 'Low-income Customers Share', 'Share of customers from low-income segments (bottom 40% of national income).', '%', 'other', [10], ['10.2']),
  M('PI1193', 'Customer Satisfaction (NPS)', 'Net Promoter Score among active customers — a proxy for whether the product genuinely helps.', 'NPS', 'other', [], []),
  M('OI4731', 'Local Procurement Share', 'Share of procurement spend with suppliers in the company\'s operating country.', '%', 'other', [8, 9], ['8.3', '9.3']),
  M('OI7914', 'Employees Receiving Benefits', 'Share of employees receiving health insurance or social security through the employer.', '%', 'other', [8], ['8.5']),
  M('OI8869', 'Board Independence', 'Share of board seats held by independent directors — a governance quality signal.', '%', 'other', [16], ['16.6']),
]

export function allMetrics(custom: MetricDef[]): MetricDef[] {
  return [...METRICS_CATALOG, ...custom]
}

export function metricMap(custom: MetricDef[]): Map<string, MetricDef> {
  return new Map(allMetrics(custom).map(m => [m.id, m]))
}
