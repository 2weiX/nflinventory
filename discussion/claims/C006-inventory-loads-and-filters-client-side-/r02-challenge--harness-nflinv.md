---
claim: C006-inventory-loads-and-filters-client-side-
round: 2
role: challenger
model: moonshotai/kimi-k3.1-pro:free
harness: opencode (OpenCode on Dennis's Linux harness)
date: 2026-11-23
---

# R2 challenge: inventory loads and filters client-side; scale limit unmeasured

Method: I read the same load path, filter path, import path, and the full r01-research round. I did
not re-run the researcher's code reading — I verified the claims against the source at current
`main` (`4fccb99`, "discussion: housekeeping") and focused on finding weaknesses, overstatements,
and missing context in the claim. I did not touch the live Supabase project.

## 1. What I could not dispute (concessions)

These facts stand unchallenged:

- **C1: The entire table is fetched.** `loadAllCards()` at `app/page.tsx:11-19` pages in
  1,000-row steps with no ceiling, no server-side filter, and no count check. Every row of the
  `cards` table is transferred to the browser on every inventory page load. This is not in
  dispute.
- **C2: Filtering is 100% client-side.** The `useMemo` at `app/page.tsx:44-60` runs status,
  set, eBay ID, grading, and free-text filters over the full in-memory array. There is no
  `ilike`, no `textSearch`, no server-side filter mode anywhere in `app/` or `lib/`. Confirmed.
- **C3: No windowing or pagination of rendered rows.** The `<tbody>` at `app/page.tsx:189-218`
  renders every filtered row. No virtualisation, no "load more". Confirmed.
- **C4: No live row count exists in the repo.** The researcher searched thoroughly and found
  nothing. I re-checked: no fixture, no seed file, no published aggregate, no `data/`
  directory content. The gap is real.
- **C5: The import path is unbounded.** `app/import/page.tsx:119-122` inserts in 500-row
  chunks until the sheet is exhausted, with no per-import row cap. Confirmed.

## 2. Objections

### OBJ-1: The claim presents a design choice as a latent defect without establishing that the
### intended use case ever approaches the threshold where it matters — weak

The claim title says "scale limit unmeasured" and the body builds an O(N) cost chain (network,
memory, per-keystroke CPU) that implies a problem waiting to happen. But the researcher's own
evidence undercuts the urgency:

- **S2 is marked done.** `docs/STORIES.md` line 33: `S2 | Browse and find cards | P0 | ✅ v1`.
  The story's acceptance criteria are met. The app works for its intended purpose today.
- **This is a single-user personal inventory tool.** S1's story: "As Dennis, I sign in once and
  only I can see my cards." There is one user. The `cards` table holds one person's sports card
  collection. The football MCP database (43,770 variants for Flagship 2026 alone, per AGENTS.md)
  is a *checklist* database — it catalogues every card that *exists*. Dennis's inventory is the
  cards he *owns*, which is a fundamentally different and far smaller population.
- **The claim provides no evidence that a personal card collection approaches the scale where
  client-side filtering degrades.** For reference, a JavaScript `Array.filter()` with
  `String.includes()` over 10,000 objects with ~20 fields each completes in under 5ms on any
  modern hardware. The bottleneck at that scale is the initial network transfer (~2-4MB for
  10,000 rows with `select("*")`), not the filter.

**Rating: weak.** The objection is that the claim is theoretically true but practically
irrelevant at realistic scale. However, I must concede that "realistic scale" is itself
unmeasured — which is the falsifier's own point. This objection is weak because it argues
"probably not a problem" without evidence, which is symmetric to the claim's "maybe a problem"
without evidence.

**What would settle it:** Dennis's actual row count and expected growth trajectory. If the
table holds <5,000 rows and Dennis expects <20,000 lifetime rows, the design is fine and the
claim should be settled as "design observation, not a defect at real scale." If the table
already holds >50,000 rows or Dennis plans bulk imports of entire checklist databases, the
claim has teeth.

### OBJ-2: The claim ignores that the paging loop is correct and the architecture is a
### deliberate v1 simplification, not an oversight — moderate

The researcher treats the O(N) chain as a finding. But the evidence shows this is a conscious
v1 architecture, not a bug:

- The paging loop exists specifically because Supabase truncates at 1,000 rows by default. The
  researcher correctly identifies this (r01 §1.2) and confirms "the loop is therefore correct
  at any size." This is not an oversight — someone understood the platform constraint and
  handled it.
- S2 is a P0 story marked done. The acceptance criteria (browse, filter, search, group, sort,
  export) all work. The client-side approach is the simplest correct implementation of those
  criteria. Server-side filtering would add complexity (API routes, query builders, pagination
  state) for no measured benefit.
- The claim's `decides: []` field is empty — no story decision depends on this. The claim does
  not identify what would be done differently if the scale limit were known.

**Rating: moderate.** This is a fair characterisation of the code as it stands. The claim
reads as if something is wrong ("scale limit unmeasured" in the title implies risk), but the
evidence describes a working v1 that made reasonable simplifications. The moderate rating (not
strong) reflects that even deliberate simplifications can become problems, and noting the
architectural boundary has some value.

**What would settle it:** A statement from Dennis that client-side loading was a deliberate v1
choice and that the expected collection size is <X rows. If Dennis says "I know, I'll add
server-side filtering when I need it," the claim is settled as a non-issue. If Dennis says
"I didn't think about that and I'm about to import 100K cards," the claim is actionable.

### OBJ-3: The falsifier is mis-specified — it conflates two different questions — moderate

The falsifier reads: "loadAllCards pages the whole table and filters in memory; the design
observation needs a live row-count range from the owner before it is a defect."

The first clause is a code fact that is already proven (r01 §1.1-1.4, confirmed above). The
second clause is an evidentiary precondition. The falsifier is structured as if both need
verification, but only the second is outstanding. More importantly, a row count alone does not
settle whether this is a defect — you also need a performance threshold. 50,000 rows might be
fine on Dennis's desktop over fibre but unusable on a phone over cellular.

**Rating: moderate.** The falsifier's imprecision means the claim could be "settled" by a row
count that still doesn't answer the real question (does the page perform acceptably?). A
well-specified falsifier would ask for: (a) current row count, (b) expected maximum row count,
(c) acceptable page-load time threshold.

**What would settle it:** Rewrite the falsifier to: "A count of rows in `cards` and a statement
of acceptable inventory page load time. If measured or projected load time at that row count
exceeds the threshold, this is a defect; otherwise it is a non-issue."

### OBJ-4: The claim omits that `exportCsv` already handles the full dataset correctly — weak

The researcher notes (r01 §1.5) that export "serialises the full filtered set client-side."
This is listed as evidence of the client-side architecture, alongside the lack of fallbacks.
But client-side CSV export is not a deficiency — it is a feature that works precisely *because*
all data is in memory. Moving to server-side filtering would *break* CSV export unless a
separate server-side export endpoint were built. The current architecture is coherent: load
everything once, then filter, group, sort, and export entirely in the browser.

**Rating: weak.** This is a minor point about framing. The researcher did not explicitly call
export a deficiency, but including it in the "no size-aware fallback" paragraph implies it is
part of the problem. It is not — it is part of the solution working as intended.

**What would settle it:** Nothing to settle. This is a framing correction, not an evidentiary
dispute.

## 3. Summary

| Objection | Rating | Core point |
|---|---|---|
| OBJ-1 | **weak** | Scale concern may be irrelevant for a single-user personal collection; no evidence either way |
| OBJ-2 | **moderate** | The architecture is a deliberate, correct v1 simplification, not an oversight |
| OBJ-3 | **moderate** | The falsifier conflates a proven code fact with an evidentiary precondition, and a row count alone is insufficient |
| OBJ-4 | **weak** | CSV export works *because* of client-side loading, not despite it |

**Bottom line:** The claim is factually accurate about the code but editorially loaded. The
evidence describes a working, deliberate v1 architecture. The only genuine gap is the absence
of a row count — and even with that number, the claim needs a performance threshold to be
actionable. The falsifier should be sharpened, and the claim's framing should shift from
"scale limit unmeasured" (implies risk) to "client-side architecture: adequate for expected
scale, needs measurement to confirm" (neutral observation).

## 4. Source interest summary

- All code evidence: first-party, this repo, no commercial interest.
- No external sources consulted for this challenge.
