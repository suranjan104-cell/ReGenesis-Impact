# Execution plan — P1 to P5

Sequenced from `COMPETITIVE-CREDIBL.md`. Built to ship **one slice, prove it, then
decide** rather than committing the whole programme up front.

The structure is deliberate: Phase 0 makes the rest safe, Phase 1 ships the linchpin,
**Gate A** is a real stop where we look at what happened before spending anything on
P2–P5.

---

## Phase 0 — Prepare (do first, ships nothing user-visible)

Two pieces of scaffolding. Both exist to make Phase 1 provable rather than hopeful.

**0.1 Golden-value harness.**
Capture current calculator outputs for a fixed input set — every scope, every fuel,
every refrigerant, both regions — into a committed fixture. This runs *before* any
factor is moved.

> Why this comes first: Phase 1 refactors live numeric paths in a 14,290-line
> `index.html`. The failure mode is silently changing a number a user has already put
> in a report. A golden fixture turns that from a worry into a test.

**0.2 Instrumentation.**
Add event types ahead of the features that emit them, so we have a clean before/after:
`factor_view`, `factor_source_click`, `working_open`, `dq_score_set`.
No schema migration needed — `events.event_type` is free-form text.

**Exit criteria**
- [ ] Fixture covers every calculator path currently reachable in the UI
- [ ] `node test/golden.mjs` passes green against unmodified `index.html`
- [ ] Event types emit and land in Supabase `events`

---

## Phase 1 — Emission factor register (P1)

The linchpin. Nothing downstream works without it.

**1.1 Schema.** Mirror the KB discipline, which already works:
`knowledge/factors/*.json` → build → `knowledge/factors.json`

```
id, name, category, value, unit, basis,
gwp_set (AR5|AR6), gas_breakdown?,
source { publisher, document, table, url },
vintage, region, applies_to[], confidence, reviewed
```

Build is deterministic (no wall-clock), same as `kb.json`, so CI can assert the
committed artefact is current.

**1.2 Migration.** Move every inline literal — `EF: 2.31`, `EF: 2.68`, `*0.467`,
`*1.66`, the GWP values currently living in `<option>` labels — out of markup and
point the calculators at the register.

**1.3 Surface.** A register view: filterable table, source link and vintage per row,
"last reviewed" per row. This is the artefact Assurance Studio has been telling users
to build.

**Scope discipline — read before expanding.**
We encode **only the factors we already use and already cite**. That is fair citation.
Bulk-encoding a third-party factor database is a different act with different terms —
DEFRA is Open Government Licence, IPCC values are citable, but **IEA and eGRID carry
redistribution restrictions**. Check terms before any coverage expansion. Do not let
"register" drift into "we are now a factor data vendor".

**Exit criteria**
- [ ] Golden-value test passes — **every** computed result byte-identical to Phase 0
- [ ] Build twice → byte-identical output (determinism)
- [ ] Schema check: zero factors missing `source.url`, `vintage` or `reviewed`
- [ ] Grep gate: no numeric factor literals left in calculator code paths
- [ ] A factor can be updated by editing JSON only — **prove it by doing one**
- [ ] Assurance Studio's own factor-register test passes against our register
      (this is the contradiction in `STACK-AUDIT.md` closing)

---

## ⛔ GATE A — land and review

**Stop here.** Everything above is defensible on engineering grounds alone. Everything
below is a bet on demand. Review before continuing.

**Quality signals — objective, available regardless of traffic. These carry the decision.**
1. Did the migration change any number? (Must be no.)
2. Can we update a factor without touching application code? (Demonstrated, not asserted.)
3. Does Assurance Studio now pass its own test? Is the contradiction closed?
4. Did P1 make P2 cheap? If "show the working" is not now nearly free, the schema is
   wrong and should be fixed before building on it.

**Demand signals — directional only.**
- `tool_open` → `factor_view` rate
- `factor_source_click` — does anyone actually follow a source through?
- `queries` table: are people asking Sage about factors, vintages or sources?
  This one is available *now*, from existing data, and is worth reading before Phase 1
  even starts.

> **Honest caveat.** At current traffic the demand signals will be thin and possibly
> unreadable. Do not manufacture a conclusion from a handful of sessions. If the
> quality gate passes and P2 looks cheap, continue on that basis and treat behavioural
> data as a tiebreak, not a verdict.

**Decision:** continue to Phase 2 · fix the schema and re-gate · stop and reassess.

---

## Phase 2 — Show the working (P2)

Cheap once P1 exists — mostly presentation over data that now has structure.

Every computed number opens: input → factor (value, vintage, source) → GWP set →
result → citation.

This is the visible form of the boundary Credibl only asserts. They say the platform
calculates and the model grounds it. We show the grounding, per number, per line.

**Exit criteria**
- [ ] Every result in every calculator has an inspectable derivation
- [ ] Derivation cites factor id, vintage and source URL from the register
- [ ] No new numeric literals introduced
- [ ] `working_open` firing

---

## Phase 3 — Data quality scoring (P3)

PCAF-style 1–5 tier per entered figure, rolled up to an inventory-level score.
Method published on the site before it is implemented — we argue in the financed-
emissions briefing that data quality scoring is the binding constraint, so we should
be the ones who state the method openly and then build to it.

**Exit criteria**
- [ ] Scoring method documented publicly, with its limits stated
- [ ] Every input carries a tier; inventory-level score derives from them
- [ ] Score travels with any export

---

## ⛔ GATE B — second review

P1–P3 together are a coherent product story: sourced factors, visible derivation,
scored quality. Re-read the demand signals with three phases of data behind them
before committing to P4/P5, which are larger and more speculative.

---

## Phase 4 — Crosswalk as data (P4)

Machine-readable disclosure map: IFRS S2 · AASB S2 · ESRS · GRI · BRSR · TCFD.
One answer populates all. Their "map once, reuse everywhere", plus the APAC mandatory
regimes their list omits.

Largest content-authoring job in the programme. Do not start it before Gate B.

## Phase 5 — Sage as one front door (P5)

Route by intent across tool contexts instead of per-tool RAG. `rgKbContext()` already
does retrieval; routing is the missing layer. Sequenced last because it is the item
that most benefits from the other four existing first — an orchestrator over four
strong surfaces beats one over two.

---

## Risk register

| Risk | Severity | Mitigation |
|---|---|---|
| Migration silently changes a published number | **High** | Phase 0 golden fixture; Gate A criterion 1 |
| "Register" drifts into redistributing a licensed factor database | **High** | Encode only what we already use and cite; check IEA/eGRID terms before expanding |
| Schema wrong, discovered late | Medium | Gate A criterion 4 — P2 must be cheap, or the schema is wrong |
| Thin demand data over-read | Medium | Quality gate carries the decision; demand is a tiebreak |
| Scope creep into ingestion (an Argus clone) | Medium | Out of scope for P1–P5. Extraction breaks the "data never leaves the browser" position and needs its own decision |

## Sequencing note

P1 → P2 is tight coupling: P2 is nearly free after P1 and nearly impossible before it.
P3 is independent and could run in parallel if we wanted throughput over certainty —
we don't, yet.

P4 and P5 are separable and reorderable. Nothing before Gate B depends on them.
