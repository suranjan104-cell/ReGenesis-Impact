# Credibl's "Incredibl Agents" — model analysis and what we take from it

Source: Credibl launch carousel, 7 pages, "Meet the Incredibl Agents" (crediblesg.com).
Marketing collateral, not documentation. Everything below distinguishes **what the
deck claims** from **what it evidences**. It evidences very little about the
underlying data or models — see "What the deck does not answer".

---

## 1. The model, as presented

Five named agents over one pipeline:

| Agent | Role | Stated function |
|---|---|---|
| **EVA** | Orchestrator | "1 front door." Understands, plans and coordinates every request; delegates to the other four; returns one answer |
| **Argus** | Data analyst | Utility bills, CSV dumps, meter photos → extract, clean, map → "every row mapped to the right facility, month & KPI" |
| **Cira** | GHG | Selects and justifies method; answers "right emission factor?", "why did Q2 jump 18%?", "which method fits best?" |
| **Quill** | Reporting | Verified data + evidence → drafts disclosures → BRSR, GRI, ESRS, TCFD → "map once, reuse everywhere" |
| **Verity** | Assurance | Continuously monitors data, calculations and drafts → evidence, confidence, audit trail, readiness |

That is the standard ESG pipeline — ingest → calculate → report → assure. Credibl
did not add a stage. They **named** the stages and gave each one a face.

## 2. The one genuinely important line in the deck

> **"The platform calculates. Cira grounds it in the right method."**
> — page 4, under a box reading *"Credibl calculation engine — deterministic Scope 1 · 2 · 3 math"*

This is an architecture decision, not copy. The LLM does **not** do arithmetic. A
deterministic engine computes; the model selects the method, explains the variance
and cites the factor. Everything else in the deck is packaging around that boundary.

It matters because it is the only version of AI-in-GHG that survives assurance. An
auditor can re-perform a deterministic calculation. They cannot re-perform a token
sample. Any vendor that lets the model compute has a product that fails ASSA 5000
re-performance testing on contact.

**We already have this boundary — by accident, not by design.** Our calculators are
plain deterministic JS; Sage is a separate RAG surface that never touches the maths.
We have never said so. Credibl said it first and will get the credit for it.

## 3. The second-order design choices worth copying

**Human approval is a named stage, not a footnote.** Page 3 draws "You preview &
approve" as a dashed box *inside* the flow. Page 2 ends "1 clear answer, nothing done
without your approval." Consequence: the approval is a demonstrable artefact, and it
is also where the liability transfers back to the preparer. That is the correct
answer to "can I trust the AI" and it is a design answer, not a policy answer.

**One front door, not five chat windows.** EVA is an orchestrator over specialists.
Our Sage is currently per-tool: the climate surface and the assurance surface each
carry their own context and neither knows the other exists.

**Map once, reuse everywhere.** Page 5 makes the crosswalk the asset, not the report.
One answered disclosure populates BRSR, GRI, ESRS and TCFD.

**Assurance as a running state.** Verity "continuously monitors" and outputs
*readiness*, not a report. Audit readiness as a live gauge is a materially better
product than an annual checklist.

## 4. What the deck does not answer

Directly relevant to the question we set out to answer — what data repository and
models are they using:

- **No emission factor provenance.** Cira "grounds every calculation" but no factor
  register, no vintage, no source hierarchy, no GWP set is shown. The one thing that
  would make "right emission factor?" answerable is absent from the deck.
- **No model, no vendor, no retrieval architecture.** Nothing on grounding method,
  hallucination controls, evaluation, or where the sustainability corpus comes from.
- **No data quality method.** "Confidence" is a Verity output tile with no stated
  scale or method behind it.
- **No numbers of any kind.** No accuracy rate, no extraction precision, no coverage.

So the deck tells us their **product architecture** and nothing about their **data
moat**. Treat any claim about their repository as unestablished.

## 5. What their framework list tells us about their market

BRSR · GRI · ESRS · TCFD.

- **BRSR** → India. **ESRS** → EU. **GRI/TCFD** → legacy voluntary.
- **Absent: IFRS S2, AASB S2, MAS, SGX, PCAF, ISSB.**

Their coverage stops at the voluntary/backward-looking boundary. Every mandatory
APAC regime we write about, and the entire forward-looking half of the discipline —
scenario analysis, transition planning, financed emissions — is outside their stated
scope. That is not a small gap. It is the subject of both of our published briefings.

## 6. Honest map against our stack

| Credibl stage | What we have | Verdict |
|---|---|---|
| EVA (orchestrate) | Sage AI + `rgKbContext()` RAG, 64 sourced KB entries | **Partial.** Real RAG, but per-tool, no routing |
| Argus (ingest) | Nothing. No extraction, no mapping | **Absent** |
| Cira (ground) | Deterministic JS calculators, no factor register | **Half.** The engine exists; the grounding layer does not |
| Quill (report) | ISSB hub, no machine-readable crosswalk | **Partial** |
| Verity (assure) | Assurance Studio — closest match we have | **Closest.** And it audits for a control we don't ship |

The standing contradiction from `STACK-AUDIT.md` is now also a competitive one:
Assurance Studio tells users to *"create an emission factor register: factor, source,
vintage, applied-to"* and fails them when the oldest factor is 3+ years old. We do not
provide one. Our factors are inline literals — `EF: 2.31`, `EF: 2.68`, GWP values in
`<option>` labels — that a user cannot inspect and we cannot version.

## 7. Where we are structurally stronger

These are not spin; they follow from architecture.

1. **Data never leaves the browser.** Argus requires uploading utility bills and meter
   photos to Credibl's servers. Our tool inputs autosave to localStorage under a strict
   CSP and reach no server. For a bank's InfoSec review that is a different
   conversation entirely.
2. **Every KB fact carries `source`, `confidence` and `reviewed`.** 64 entries, all
   graded, deterministic build. No competitor shows this. It is publishable as a trust
   artefact and currently invisible.
3. **Forward-looking and APAC mandatory coverage** — IFRS S2, AASB S2, MAS, PCAF,
   scenario analysis — where their list stops at TCFD.
4. **Free, no account.** Different segment; not competing for the same procurement.

## 8. What to build, in order

Sequenced by leverage, not effort. Each item unblocks the next.

### P1 — Emission factor register
The linchpin. Move every factor out of markup into a versioned dataset:
`factor, unit, value, source, vintage, gwp_set, region, applied_to, reviewed` —
the same discipline the KB already uses. Ship it as `knowledge/factors.json` with a
deterministic build, exactly like `kb.json`.

Unblocks: a real Cira equivalent; closes the Assurance Studio contradiction; makes
factors updatable without editing application code; makes every result inspectable.

### P2 — "Show the working" on every number
Once P1 exists, every calculator result opens: input → factor (with vintage and
source) → GWP set → result → citation. This is the *visible* version of the boundary
Credibl only asserts. They say the platform calculates and the AI grounds it. We can
show the grounding, per number, per line.

### P3 — Data quality scoring on every input
PCAF-style 1–5 tier on each entered figure, rolled up to a portfolio/inventory score.
Credibl shows a "Confidence" tile with no method. Our financed-emissions briefing
argues data quality scoring *is* the binding constraint — we should be the ones who
publish the method and then implement it.

### P4 — Crosswalk as data
A machine-readable disclosure map spanning IFRS S2 · AASB S2 · ESRS · GRI · BRSR ·
TCFD, so one answer populates all. Their "map once, reuse everywhere" with the APAC
mandatory regimes their list omits.

### P5 — Sage as one front door
Route by intent across tool contexts instead of per-tool RAG. `rgKbContext()` already
selects by tool and query; the routing layer is the missing piece, not the retrieval.

### Not doing
**Five named agent mascots.** It is their brand, it would read as derivative, and it
does not fit our editorial design language. Copy the boundary and the legibility, not
the costume.

---

*Analysis of a marketing deck. Product claims are theirs and unverified; our stack
assessment is from reading the code.*
