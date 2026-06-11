// UN Sustainable Development Goals — official numbers, short names, brand colors.
export interface SdgInfo { n: number; name: string; color: string }

export const SDGS: SdgInfo[] = [
  { n: 1, name: 'No Poverty', color: '#E5243B' },
  { n: 2, name: 'Zero Hunger', color: '#DDA63A' },
  { n: 3, name: 'Good Health & Well-being', color: '#4C9F38' },
  { n: 4, name: 'Quality Education', color: '#C5192D' },
  { n: 5, name: 'Gender Equality', color: '#FF3A21' },
  { n: 6, name: 'Clean Water & Sanitation', color: '#26BDE2' },
  { n: 7, name: 'Affordable & Clean Energy', color: '#FCC30B' },
  { n: 8, name: 'Decent Work & Economic Growth', color: '#A21942' },
  { n: 9, name: 'Industry, Innovation & Infrastructure', color: '#FD6925' },
  { n: 10, name: 'Reduced Inequalities', color: '#DD1367' },
  { n: 11, name: 'Sustainable Cities & Communities', color: '#FD9D24' },
  { n: 12, name: 'Responsible Consumption & Production', color: '#BF8B2E' },
  { n: 13, name: 'Climate Action', color: '#3F7E44' },
  { n: 14, name: 'Life Below Water', color: '#0A97D9' },
  { n: 15, name: 'Life on Land', color: '#56C02B' },
  { n: 16, name: 'Peace, Justice & Strong Institutions', color: '#00689D' },
  { n: 17, name: 'Partnerships for the Goals', color: '#19486A' },
]

export const sdgByNumber = new Map(SDGS.map(s => [s.n, s]))
