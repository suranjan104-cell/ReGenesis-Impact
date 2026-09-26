/* The empty entity and the worked examples, in plain JavaScript so the
   repository's tests can import exactly what the workspace shows. */

/** @type {import('../engine/applicability.js').Entity & { name: string }} */
export const EMPTY = {
  name: '',
  regions: { eu: false, au: false, sg: false },
  eu: { kind: 'eu-company', employees: null, turnoverEurM: null, euTurnoverEurM: null, alreadyReporting: false },
  au: { revenueAudM: null, assetsAudM: null, employees: null, nger: 'none', assetOwnerAumAudBn: null },
  sg: { listed: null, sti: false, revenueSgdM: null, assetsSgdM: null },
};

/* Worked examples. Every name is invented and says so; the workspace never
   attributes an assessment to a real company. */
/** @type {{ id: string, label: string, blurb: string, entity: typeof EMPTY }[]} */
export const EXAMPLES = [
  {
    id: 'eu-wave1', label: 'EU manufacturer, already reporting',
    blurb: '4,200 staff, €1.85bn turnover — wave one, facing the FY2026 basis decision.',
    entity: { ...structuredClone(EMPTY), name: 'Example Industrie AG (fictional)',
      regions: { eu: true, au: false, sg: false },
      eu: { ...EMPTY.eu, kind: 'eu-company', employees: 4200, turnoverEurM: 1850, alreadyReporting: true } },
  },
  {
    id: 'asx-mid', label: 'ASX mid-cap',
    blurb: 'A$320m revenue, A$610m assets — two of three Group 2 tests.',
    entity: { ...structuredClone(EMPTY), name: 'Example Harbour Group Ltd (fictional)',
      regions: { eu: false, au: true, sg: false },
      au: { ...EMPTY.au, revenueAudM: 320, assetsAudM: 610, employees: 180, nger: 'none' } },
  },
  {
    id: 'sgx-eu', label: 'SGX-listed, selling into the EU',
    blurb: 'Straits Times Index constituent with €520m of EU-generated turnover.',
    entity: { ...structuredClone(EMPTY), name: 'Example Straits Holdings (fictional)',
      regions: { eu: true, au: false, sg: true },
      eu: { ...EMPTY.eu, kind: 'non-eu-group', euTurnoverEurM: 520 },
      sg: { ...EMPTY.sg, listed: true, sti: true } },
  },
  {
    id: 'three-market', label: 'Three-market group',
    blurb: 'Enters CSRD in wave two, Group 1 in Australia, listed in Singapore.',
    entity: { ...structuredClone(EMPTY), name: 'Example Tri-Market plc (fictional)',
      regions: { eu: true, au: true, sg: true },
      eu: { ...EMPTY.eu, kind: 'eu-company', employees: 1500, turnoverEurM: 900, alreadyReporting: false },
      au: { ...EMPTY.au, revenueAudM: 700, assetsAudM: 1400, employees: 320, nger: 'none' },
      sg: { ...EMPTY.sg, listed: true, sti: false } },
  },
];
