# Sourcing worksheet — the four unsourced factors

Four factors in the register carry `"publisher": "Not established"`. They are now
visible in three places at once — the register, the ledger's gap list, and the
assurance pack a reviewer reads — so they are the highest-leverage open item in
the product.

**This cannot be finished from the build sandbox.** Every primary source domain
refuses the connection there (`gov.uk`, `ghgprotocol.org`,
`carbonaccountingfinancials.com`, `epa.gov` all return `000`). Recording a value
from a search snippet would be the same unsourced guess we are trying to remove,
so the values are left alone until someone can open the actual table.

Each entry below names the exact document and row needed. Fill in the value and
the citation, then edit the JSON and run:

```bash
node knowledge/build-factors.mjs && node knowledge/sync-factors.mjs && npm test
```

The golden fixture **will fail** — that is correct, it means user-facing numbers
changed. Regenerate with `node test/golden-ghg.mjs --write` and state the delta
in the commit, the way the R-22 correction did.

---

## 1. `s3-cat1-spend` — Purchased goods & services, spend-based

**Current:** 350 tCO2e/USD mn · low confidence · no source
**Why it matters most:** carries ~12% of a typical inventory in our worked
example, and EEIO intensities vary by model, region and sector by more than an
order of magnitude. A single global default is a placeholder, not a factor.

**What to find.** Pick one EEIO model and cite it explicitly — the register
should name the model, not "spend-based EEIO":
- **USEEIO v2** (US EPA) — supply chain GHG emission factors by NAICS code
- **Exiobase 3** — multi-regional, better for non-US entities
- **India:** no widely-adopted public EEIO equivalent; if none is defensible,
  the honest move is to withdraw the default the way project finance was.

**Decide:** a single global number is probably not defensible at all. Consider
replacing it with a sector selector, or removing the default and requiring input.

## 2. `s3-cat6-hotel` — Business travel, hotel nights

**Current:** 0.031 tCO2e/night · low confidence · no source
**What to find:** DEFRA *Hotel stay* factors, in the business travel — land
section of the UK Government GHG Conversion Factors. They are published
**per country**, so record the country alongside the value, or offer a selector.
A single global night factor is weakly defensible at best.

## 3. `s3-cat15-corporate` — PCAF corporate lending WACI default

**Current:** 150 tCO2e/USD mn · low confidence · no source
**What to find:** the PCAF *Global GHG Accounting and Reporting Standard for the
Financial Industry*, Part A, business loans and unlisted equity.

**Read the note before changing it.** A portfolio-wide WACI default is PCAF data
quality score 4–5 territory by construction, because scores 1–2 exist only where
the counterparty supplied the data. Our own financed-emissions briefing argues
this is the binding constraint. A sourced default is still a default — the
correct fix may be to keep the tier honest rather than to find a better number.

## 4. `s3-cat15-project` — Project finance intensity

**Current:** 0 · default **withdrawn**, user input required
**Status:** already handled. The inherited 0.035 tCO2e/USD mn sat ~4,000× below
corporate lending in the same units and could not be sourced, so the default was
removed rather than replaced with a guess.
**Only revisit** if PCAF Part A publishes a project-finance intensity that can be
cited directly. Otherwise leave it withdrawn — it is the correct outcome.

---

## Also worth resolving while in there

| Factor | Issue |
|---|---|
| `s3-cat5-waste` | 0.467 tCO2e/t vs 0.58 in the superseded table, same nominal source. Unresolved disagreement. |
| `s3-cat6-air` | 0.0001 tCO2e/pkm = 0.1 kg/pkm, matching none of the haul-band values it replaced, and discarding the haul-band and cabin-class distinctions the source makes. |

Both are sourced-but-doubtful rather than unsourced, so they score DQ 4 on
confidence rather than provenance. Same fix path.
