# ReGenesis Knowledge Base

This directory is the **training corpus** for every tool's AI on the site.
The site's AI (Sage) is a hosted model that cannot be fine-tuned, so we use
the approach production AI products use instead: **retrieval-augmented
generation (RAG)**. Curated, sourced entries live here in the repo; at
runtime each tool retrieves the entries most relevant to the user's question
and injects them into the AI's context. Better corpus → better answers, with
no model training required and full auditability of what the AI "knows".

## Layout

```
knowledge/
  entries/*.json   ← the corpus, one file per tool (edit these)
  build.mjs        ← validates every entry and compiles kb.json
  kb.json          ← built artifact the site fetches (do not hand-edit)
```

## Entry schema

```json
{
  "id": "ghg-004",              // unique, prefixed by tool
  "tool": "ghg",                // issb | ghg | climate | credits | assurance | dd | advisor
  "title": "PCAF data quality scores",
  "market": "global",           // sg | au | in | global
  "tags": ["pcaf", "financed emissions", "data quality"],
  "facts": [                    // 2–5 short, verifiable statements
    "PCAF scores data quality 1 (audited actuals) to 5 (estimated proxies)."
  ],
  "source": "https://carbonaccountingfinancials.com",  // where to verify
  "confidence": "high",         // high = primary source; medium = secondary
  "reviewed": "2026-07"         // when a human last checked it
}
```

## Quality rules — read before adding entries

1. **Never invent case studies.** Every entry must be traceable to a public
   source (regulator, standard-setter, company disclosure, registry).
2. Figures that change (carbon prices, grid factors, thresholds) carry the
   year they were true and `confidence: "medium"` unless from the primary
   source.
3. Keep facts short and declarative — they're injected into prompts, so
   every extra word costs context.
4. Run `node knowledge/build.mjs` before committing. CI rejects entries
   that fail schema validation or reuse an id.

## How it grows (the improvement loop)

1. **Signals in**: every Sage question is logged to Supabase (`queries`
   table) and every AI answer gets 👍/👎 feedback buttons (logged to
   `events` as `ai_feedback`). The owner dashboard shows both.
2. **Weekly**: the existing `weekly-improve.yml` Claude audit reviews the
   worst-rated topics and adds/edits KB entries in its improvement PR.
3. **Validation**: `kb-validate.yml` builds and schema-checks the corpus on
   every push — malformed knowledge can't reach production.
4. **Scale**: the retrieval layer selects the top few entries per question,
   so the corpus can grow to thousands of entries without slowing the site
   (kb.json is fetched lazily, once per session).
