# Internal stack audit — data and AI

Baseline for the competitive landscape review. What we actually have today,
established by reading the code rather than from memory.

## Data

### Knowledge base — the strongest asset
- `knowledge/entries/*.json` → `knowledge/build.mjs` → `knowledge/kb.json`
- **64 entries.** Schema per entry: `id, tool, title, market, tags, facts[],
  source, confidence, reviewed`.
- Every entry carries a **source URL, a confidence grade and a review month**.
- Retrieved at runtime by `rgKbContext(tool, text, n)` and injected into Sage AI
  prompts — a real RAG pipeline, not a static FAQ.
- Build is deterministic (no wall-clock), so CI can verify kb.json is current.

This is genuinely good practice and is the thing most worth extending.

### Emission factors — the gap
- Factors are **inline numeric constants** scattered through `index.html`
  (`EF: 2.31`, `EF: 2.68`, `*0.467`, `*1.66` …). Roughly a dozen literals.
- **No factor table, no versioning, no vintage field, no per-factor source.**
- Attribution exists only as prose in the UI: "Sources: DEFRA UK GHG Conversion
  Factors 2024; IPCC AR6 WGI Table 7.SM.7 (GWP100)", "IPCC AR6 / MoEFCC India",
  IEA 2024, eGRID, CEA.
- Consequence: a factor cannot be updated without editing application code, and
  a user cannot see which factor produced a given number.

### The contradiction worth fixing first
The Assurance Studio instructs users to *"Create an emission factor register:
factor, source, vintage, applied-to"* and runs a test that fails when the oldest
factor in use is 3+ years old — calling it "a classic finding".

**We audit users against a control we do not provide.** Building the register we
already tell people to build is the most defensible next feature we have, and it
is the same argument the financed-emissions briefing makes externally: the
estimate, the method and the data quality have to travel together.

## AI

- **Sage AI** proxied through a Cloudflare Worker
  (`sageai.suranjan104.workers.dev`); the browser never holds a model key.
- **RAG**: `rgKbContext()` selects entries by tool and query text and appends
  them to the prompt. Used by at least the climate and advisor surfaces.
- **Feedback loop**: 👍/👎 on answers logged to Supabase `ai_feedback`, reviewed
  weekly.
- Every KB fact has a source, so answers can be grounded and attributed.

### What the AI does not do
No document or invoice extraction. No mapping of spend or activity lines to
emission factors. No supplier or counterparty data collection. No data quality
scoring on user inputs. No framework crosswalk generation.

## Data handling

- Tool inputs autosave to **browser localStorage**; they do not reach our
  servers. Strict CSP allowlist. Supabase holds leads, events, queries and AI
  feedback only — read by the owner dashboard.
- Free, no account required to start.

This is a real privacy position and a real differentiator against enterprise
platforms. It is also the reason we currently have no route to the
counterparty-data problem our own research says is the binding constraint.

## The strategic question the landscape review has to answer

Our published thesis is that the constraint in financed and Scope 3 emissions is
**counterparty and activity data collection, plus data quality scoring** — not
computation, and not more emission factors.

Our product currently does neither. So the question is not "what features do
competitors have" but: **which of those two capabilities can a small team build
credibly, and what data would it need to license or source to do it.**
