# The workspace (`/app/`)

## Why it exists

Four colour schemes were applied to the site and none landed, because the
problem was never the palette. The product was thirteen calculators, each a
destination, and a visitor had to know already which regime applied to them,
which calculator answered it, and in what order. The evidence ledger that
connected the tools existed but lived on one page.

The workspace answers the visitor's actual question on arrival — *what do I
owe, to whom, and by when* — around three verbs:

| | What it does | Backed by |
|---|---|---|
| **Scope** | Describe the entity once. Every regime decides itself. | `knowledge/esrs/scope.json`, `knowledge/markets/{australia,singapore}.json` |
| **Plan** | Every obligation, every regime, one axis. Export to a calendar. | the same registers, plus `knowledge/esrs/transition.json` |
| **Prove** | Which evidence each regime needs, which instrument produces it, and whether you have run it. | `rg_ledger_v1`, written by the instruments |

The instruments are unchanged and are where the work is done; the workspace
routes to them, and each of their headers routes back.

## Design

Chrome is ink on paper and **colour belongs only to data**: the three regimes,
and status. Nothing in the interface competes with the timeline. Light is the
default and dark an equal second theme — both chosen, neither derived.

- Regime hues are the first three slots of the dataviz reference palette,
  which validate *all-pairs* in both modes. Re-validated on these surfaces:
  light worst CVD ΔE 9.2, dark 9.4. The light aqua is 2.7:1 on the surface, so
  every lane and marker carries a text label.
- Text never wears a regime colour; a swatch sits beside ink.
- Muted ink clears 4.5:1 on all four surfaces in both modes (worst 4.73 light,
  5.41 dark).
- Geist and Geist Mono are bundled. The page's CSP is same-origin only, so the
  workspace keeps the site's promise that nothing entered leaves the browser.

### Precision is visible

A date the register states is a solid diamond. A date that follows from a
stated rule — "Scope 3 is mandatory from the second reporting period" — is a
hollow one, and the list says so. A report the register knows only to the year
is a bar across that year, and the calendar export makes it a year-long event
rather than inventing a day.

## The engine

`workspace-app/src/engine/applicability.js` — plain JavaScript with JSDoc, so
the app (through TypeScript's `checkJs`) and the repository's tests (through
bare Node) import the same file.

1. **It reads registers, never regulation.** No threshold or date is written
   in the engine. Australia's and Singapore's cohorts carry a machine-readable
   `rule` beside their prose, and `knowledge/build-markets.mjs` fails if the two
   disagree.
2. **Equality is not decided.** A value exactly on a threshold returns
   `boundary` with the reason. The registers are built from practitioner
   summaries, and "more than" against "or more" is exactly what those blur.
   The one exception is Australia's asset-owner trigger, whose register text
   says "or more".
3. **A gap is an answer.** Non-EU groups under CSRD have a threshold and no
   date in the register; wave-one reporters below the Omnibus thresholds leave
   scope at a time the register does not give. Both are said, not filled in.

## Building

```bash
cd workspace-app && npm install && npm run build   # writes ../app/
```

`app/` is committed and served as-is, like `platform/`. Every build stamps
`app/build-info.json` with a hash of its sources; `test/workspace.mjs`
recomputes it, so an edit without a rebuild fails `npm test`.

## Gates

- `test/workspace-engine.mjs` — 17 hand-derived scenarios; 3,000 generated
  entities clustered on every threshold, compared with an independent
  table-driven oracle; properties (growing never moves you to a later
  Australian group, regions do not leak, no undated date is presented as
  stated).
- `test/workspace.mjs` — 13 scenarios in a real browser: every worked example,
  every verdict state, light and dark, desktop and a **true** 390px, a seeded
  ledger, the command palette. Every expectation comes from the engine in Node,
  never from the UI.

A true 390px matters: Chromium will not make a headless window narrower than
about 485px, so a gate passing `--window-size=390` measures at 485. Both this
gate and `test/pages.mjs` now render inside an iframe of the exact width and
assert the viewport they actually got.
