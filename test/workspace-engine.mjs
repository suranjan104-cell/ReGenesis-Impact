/* The workspace's applicability engine, tested three ways.
   Run:  node test/workspace-engine.mjs   (SEED=n to vary the property run)

   1. Golden scenarios, with every expected value written out by hand from
      the registers. An oracle that shares the engine's reading of the data
      would share its mistakes; these do not.
   2. An independent oracle, table-driven and written without looking at the
      engine's structure, compared on thousands of generated entities that
      cluster at the thresholds — including exactly on them.
   3. Properties that must hold for any entity: growing never moves you to a
      later Australian group, equality never produces a confident verdict on
      its own, every dated obligation either appears in a register or is
      marked as derived, and regions do not leak into one another. */
import { readFileSync } from 'fs';
import { assess, _internals } from '../workspace-app/src/engine/applicability.js';

const ROOT = new URL('..', import.meta.url).pathname;
const read = f => JSON.parse(readFileSync(`${ROOT}knowledge/${f}`, 'utf8'));
const DATA = { scope: read('esrs/scope.json'), transition: read('esrs/transition.json'),
               au: read('markets/australia.json'), sg: read('markets/singapore.json') };
const TODAY = '2026-09-26';
const fail = [];
const check = (cond, msg) => { if (!cond) fail.push(msg); };
const reg = (a, code) => a.regimes.find(r => r.code === code);

/* ── 1. golden scenarios ─────────────────────────────────────────────── */
const G = [
  ['EU wave 1, in scope', { regions: { eu: true }, eu: { kind: 'eu-company', employees: 1200, turnoverEurM: 600, alreadyReporting: true } },
    a => { const r = reg(a, 'csrd');
      check(r.verdict === 'yes', `wave-1 verdict ${r.verdict}`);
      check(r.cohort?.name === 'Wave 1', `wave-1 cohort ${r.cohort?.name}`);
      const ids = r.obligations.map(o => `${o.id}:${o.date || o.year}`);
      check(ids.includes('csrd-fy26-basis:2026'), `wave-1 should carry the FY2026 basis decision: ${ids}`);
      check(ids.includes('csrd-fy26-report:2027'), `wave-1 FY2026 report in 2027: ${ids}`);
      check(ids.includes('csrd-revised-binds:2027-01-01'), `revised ESRS bind 2027-01-01: ${ids}`);
      check(ids.includes('csrd-revised-report:2028'), `first revised report 2028: ${ids}`); }],
  ['EU wave 2', { regions: { eu: true }, eu: { kind: 'eu-company', employees: 1200, turnoverEurM: 600, alreadyReporting: false } },
    a => { const r = reg(a, 'csrd');
      check(r.cohort?.name === 'Wave 2', `wave-2 cohort ${r.cohort?.name}`);
      check(r.obligations.some(o => o.id === 'csrd-w2-period' && o.date === '2027-01-01' && o.derived), 'wave-2 period 2027-01-01, derived');
      check(r.obligations.some(o => o.id === 'csrd-w2-report' && o.year === 2028), 'wave-2 first report 2028'); }],
  ['EU exactly 1,000 staff', { regions: { eu: true }, eu: { kind: 'eu-company', employees: 1000, turnoverEurM: 600 } },
    a => check(reg(a, 'csrd').verdict === 'boundary', `1,000 staff is the line, got ${reg(a, 'csrd').verdict}`)],
  ['EU wave 1 below new thresholds', { regions: { eu: true }, eu: { kind: 'eu-company', employees: 800, turnoverEurM: 600, alreadyReporting: true } },
    a => { const r = reg(a, 'csrd');
      check(r.verdict === 'no', `800 staff verdict ${r.verdict}`);
      check(r.gaps.some(g => /stops reporting/.test(g)), 'a wave-one reporter dropping out must be told the date is unknown'); }],
  ['Non-EU group over EU turnover', { regions: { eu: true }, eu: { kind: 'non-eu-group', euTurnoverEurM: 500 } },
    a => { const r = reg(a, 'csrd');
      check(r.verdict === 'yes', `non-EU verdict ${r.verdict}`);
      check(r.obligations.length === 0, 'no invented dates for non-EU groups');
      check(r.gaps.some(g => /do not state one/.test(g)), 'the missing year must be declared'); }],
  ['AU two of three for Group 1', { regions: { au: true }, au: { revenueAudM: 600, assetsAudM: 1200, employees: 100, nger: 'none' } },
    a => { const r = reg(a, 'aasb-s2');
      check(r.cohort?.code === 'g1', `expected g1, got ${r.cohort?.code}`);
      const o = Object.fromEntries(r.obligations.map(x => [x.kind, x]));
      check(o.period?.date === '2025-01-01', `g1 period ${o.period?.date}`);
      check(o.report?.year === 2026, `g1 report ${o.report?.year}`);
      check(o.scope3?.date === '2026-01-01' && o.scope3?.derived, `g1 scope 3 from the second period ${o.scope3?.date}`); }],
  ['AU Group 2 by size', { regions: { au: true }, au: { revenueAudM: 300, assetsAudM: 100, employees: 300, nger: 'none' } },
    a => check(reg(a, 'aasb-s2').cohort?.code === 'g2', `expected g2, got ${reg(a, 'aasb-s2').cohort?.code}`)],
  ['AU Group 3 by size', { regions: { au: true }, au: { revenueAudM: 60, assetsAudM: 30, employees: 50, nger: 'none' } },
    a => { const r = reg(a, 'aasb-s2');
      check(r.cohort?.code === 'g3', `expected g3, got ${r.cohort?.code}`);
      check(r.obligations.some(o => o.kind === 'period' && o.date === '2027-07-01'), 'g3 period 2027-07-01'); }],
  ['AU small but NGER publication', { regions: { au: true }, au: { revenueAudM: 10, assetsAudM: 10, employees: 10, nger: 'publication' } },
    a => check(reg(a, 'aasb-s2').cohort?.code === 'g1', `NGER publication reporter is Group 1, got ${reg(a, 'aasb-s2').cohort?.code}`)],
  ['AU asset owner exactly A$5bn', { regions: { au: true }, au: { revenueAudM: 10, assetsAudM: 10, employees: 10, nger: 'none', assetOwnerAumAudBn: 5 } },
    a => check(reg(a, 'aasb-s2').cohort?.code === 'g2', `the register says "or more": A$5bn is Group 2, got ${reg(a, 'aasb-s2').cohort?.code}`)],
  ['AU on Group 1 revenue line, clearly Group 2', { regions: { au: true }, au: { revenueAudM: 500, assetsAudM: 1200, employees: 100, nger: 'none' } },
    a => { const r = reg(a, 'aasb-s2');
      check(r.cohort?.code === 'g2', `expected g2, got ${r.cohort?.code}`);
      check(r.gaps.some(g => /Group 1/.test(g) && /exactly on/.test(g)), 'must warn the entity may be Group 1'); }],
  ['AU below everything', { regions: { au: true }, au: { revenueAudM: 20, assetsAudM: 10, employees: 20, nger: 'none' } },
    a => check(reg(a, 'aasb-s2').verdict === 'no', `expected no, got ${reg(a, 'aasb-s2').verdict}`)],
  ['SG listed STI constituent', { regions: { sg: true }, sg: { listed: true, sti: true } },
    a => { const r = reg(a, 'sg');
      check(r.cohort?.code === 'sgx', `expected sgx, got ${r.cohort?.code}`);
      check(r.obligations.some(o => o.kind === 'scope3' && o.date === '2026-01-01'), 'STI Scope 3 from 2026-01-01'); }],
  ['SG large non-listed', { regions: { sg: true }, sg: { listed: false, revenueSgdM: 1500, assetsSgdM: 800 } },
    a => { const r = reg(a, 'sg');
      check(r.cohort?.code === 'nlco', `expected nlco, got ${r.cohort?.code}`);
      check(r.obligations.some(o => o.kind === 'period' && o.date === '2030-01-01'), 'non-listed from FY2030 after the August 2025 deferral'); }],
  ['SG non-listed on the revenue line', { regions: { sg: true }, sg: { listed: false, revenueSgdM: 1000, assetsSgdM: 800 } },
    a => { const r = reg(a, 'sg');
      check(r.verdict === 'boundary', `expected boundary, got ${r.verdict}`);
      check(r.gaps.some(g => /at least/.test(g)), 'must surface the at-least / over wording conflict'); }],
  ['SG listing unknown', { regions: { sg: true }, sg: {} },
    a => check(reg(a, 'sg').verdict === 'unknown', `expected unknown, got ${reg(a, 'sg').verdict}`)],
  ['Three regions, next obligation', { regions: { eu: true, au: true, sg: true },
      eu: { kind: 'eu-company', employees: 1200, turnoverEurM: 600, alreadyReporting: true },
      au: { revenueAudM: 300, assetsAudM: 100, employees: 300, nger: 'none' }, sg: { listed: true, sti: true } },
    a => { check(a.summary.applies === 3, `three regimes should apply, got ${a.summary.applies}`);
      check(a.next && a.next.when >= TODAY, `next obligation must not be in the past: ${a.next?.when}`);
      const whens = a.obligations.map(o => o.when);
      check(whens.every((w, i) => i === 0 || whens[i - 1] <= w), 'obligations must be in date order'); }],
];
for (const [name, entity, verify] of G) {
  const before = fail.length;
  try { verify(assess(entity, DATA, TODAY)); } catch (e) { fail.push(`${name}: threw ${e.message}`); }
  for (let i = before; i < fail.length; i++) fail[i] = `${name} — ${fail[i]}`;
}

/* ── 2. independent oracle ───────────────────────────────────────────── */
// Written as tables over the registers, deliberately not mirroring the engine.
const V = { Y: 'yes', N: 'no', B: 'boundary', U: 'unknown' };
function cmp(v, t) { return v == null ? 'U' : v > t ? 'Y' : v === t ? 'B' : 'N'; }
function oracleCsrd(eu) {
  const th = DATA.scope.thresholds.eu_company;
  const c = [cmp(eu.employees, th.employees_over), cmp(eu.turnoverEurM, th.net_turnover_over_eur_m)];
  return V[c.includes('N') ? 'N' : c.includes('U') ? 'U' : c.includes('B') ? 'B' : 'Y'];
}
function oracleAu(au) {
  const results = DATA.au.cohorts.map(c => {
    const s = [cmp(au.revenueAudM, c.revenue_over_aud_m), cmp(au.assetsAudM, c.assets_over_aud_m), cmp(au.employees, c.employees_over)];
    const n = k => s.filter(x => x === k).length;
    let size = n('Y') >= 2 ? 'Y' : n('Y') + n('B') + n('U') < 2 ? 'N' : n('U') ? 'U' : 'B';
    const trig = (c.rule.triggers.includes('nger_publication_threshold') && au.nger === 'publication')
      || (c.rule.triggers.includes('nger_reporter') && ['reporter', 'publication'].includes(au.nger))
      || (c.rule.triggers.includes('asset_owner') && au.assetOwnerAumAudBn != null && au.assetOwnerAumAudBn >= c.rule.asset_owner_aum_at_least_aud_bn);
    return { code: c.code, v: trig ? 'Y' : size };
  });
  const hit = results.find(r => r.v === 'Y');
  if (hit) return { verdict: 'yes', cohort: hit.code };
  return { verdict: results.some(r => r.v === 'U') ? 'unknown' : results.some(r => r.v === 'B') ? 'boundary' : 'no', cohort: null };
}

// Mulberry32, the generator the other simulations in this repo use.
let seed = Number(process.env.SEED || 1) >>> 0;
const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const pick = arr => arr[Math.floor(rnd() * arr.length)];
// Values cluster at every threshold the registers hold, including exactly on them.
const near = ts => { const r = rnd();
  if (r < 0.08) return null;
  const t = pick(ts);
  if (r < 0.3) return t;
  return Math.max(0, Math.round(t * (0.5 + rnd())));
};
const AU_T = { rev: DATA.au.cohorts.map(c => c.revenue_over_aud_m), ast: DATA.au.cohorts.map(c => c.assets_over_aud_m),
               emp: DATA.au.cohorts.map(c => c.employees_over) };
const EU_T = DATA.scope.thresholds.eu_company;

const N = 3000;
const GROUP_ORDER = DATA.au.cohorts.map(c => c.code);
for (let i = 0; i < N; i++) {
  const entity = {
    regions: { eu: true, au: true, sg: true },
    eu: { kind: 'eu-company', employees: near([EU_T.employees_over]), turnoverEurM: near([EU_T.net_turnover_over_eur_m]),
          alreadyReporting: rnd() < 0.5 },
    au: { revenueAudM: near(AU_T.rev), assetsAudM: near(AU_T.ast), employees: near(AU_T.emp),
          nger: pick(['none', 'none', 'none', 'reporter', 'publication']),
          assetOwnerAumAudBn: rnd() < 0.8 ? null : pick([2, 5, 8]) },
    sg: { listed: pick([true, false, null]), sti: rnd() < 0.3, revenueSgdM: near([1000]), assetsSgdM: near([500]) },
  };
  const a = assess(entity, DATA, TODAY);
  const csrd = reg(a, 'csrd'), au = reg(a, 'aasb-s2'), sg = reg(a, 'sg');

  const oc = oracleCsrd(entity.eu);
  if (csrd.verdict !== oc) { fail.push(`oracle: CSRD ${JSON.stringify(entity.eu)} engine ${csrd.verdict}, oracle ${oc}`); break; }
  const oa = oracleAu(entity.au);
  if (au.verdict !== oa.verdict || (au.cohort?.code ?? null) !== oa.cohort) {
    fail.push(`oracle: AU ${JSON.stringify(entity.au)} engine ${au.verdict}/${au.cohort?.code}, oracle ${oa.verdict}/${oa.cohort}`); break;
  }

  /* ── 3. properties ─── */
  for (const r of a.regimes) {
    if (r.verdict === 'yes' && r.code !== 'csrd') check(r.cohort, `${r.code}: yes without a cohort`);
    if (r.verdict !== 'yes') check(r.obligations.length === 0, `${r.code}: obligations without a yes`);
    for (const o of r.obligations) {
      if (o.date && !o.derived) {
        const known = JSON.stringify(DATA).includes(`"${o.date}"`)
          || o.date === `${DATA.scope.simplified_esrs.mandatory_from_fy}-01-01`;
        check(known, `${r.code}: ${o.id} has date ${o.date} that is in no register and is not marked derived`);
      }
      check(o.instrument && o.instrument.href.startsWith('/#/'), `${o.id}: every obligation must lead to an instrument`);
    }
  }
  // Growing never moves an entity to a later Australian group.
  if (au.cohort) {
    const bigger = { ...entity, au: { ...entity.au,
      revenueAudM: entity.au.revenueAudM == null ? null : entity.au.revenueAudM * 2 + 1,
      assetsAudM: entity.au.assetsAudM == null ? null : entity.au.assetsAudM * 2 + 1,
      employees: entity.au.employees == null ? null : entity.au.employees * 2 + 1 } };
    const b = reg(assess(bigger, DATA, TODAY), 'aasb-s2');
    check(b.cohort && GROUP_ORDER.indexOf(b.cohort.code) <= GROUP_ORDER.indexOf(au.cohort.code),
      `growing moved ${JSON.stringify(entity.au)} from ${au.cohort.code} to ${b.cohort?.code}`);
  }
  // Regions do not leak: the CSRD verdict is the same with AU and SG switched off.
  const alone = reg(assess({ ...entity, regions: { eu: true } }, DATA, TODAY), 'csrd');
  check(alone.verdict === csrd.verdict, 'CSRD verdict changed when other regions were switched off');
  if (fail.length > 12) break;
}

// Equality on its own never decides: nudging a value off the line must
// change a boundary verdict into a decided one.
for (const t of [EU_T.employees_over]) {
  const at = reg(assess({ regions: { eu: true }, eu: { kind: 'eu-company', employees: t, turnoverEurM: 10_000 } }, DATA, TODAY), 'csrd');
  const up = reg(assess({ regions: { eu: true }, eu: { kind: 'eu-company', employees: t + 1, turnoverEurM: 10_000 } }, DATA, TODAY), 'csrd');
  const dn = reg(assess({ regions: { eu: true }, eu: { kind: 'eu-company', employees: t - 1, turnoverEurM: 10_000 } }, DATA, TODAY), 'csrd');
  check(at.verdict === 'boundary' && up.verdict === 'yes' && dn.verdict === 'no',
    `threshold ${t}: at=${at.verdict} above=${up.verdict} below=${dn.verdict}`);
}
check(_internals.atLeastTwo([true, 'boundary', false]) === 'boundary', 'two-of-three with one edge is boundary');
check(_internals.atLeastTwo([true, null, false]) === null, 'two-of-three with a missing input is unknown');

if (fail.length) {
  console.error(`✗ workspace engine — ${fail.length} problem${fail.length > 1 ? 's' : ''}:`);
  for (const f of fail.slice(0, 14)) console.error('  - ' + f);
  process.exit(1);
}
console.log(`  ✓ workspace engine — ${G.length} hand-derived scenarios, ${N} generated entities agree with an `
  + `independent oracle, no property violations (SEED=${process.env.SEED || 1})`);
