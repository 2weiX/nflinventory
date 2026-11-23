---
claim: C004-duplicate-grouping-merges-differing-card
round: 1
role: researcher
model: z-ai/glm-5.3-flash
harness: hermes (Ultron on Dennis's Linux harness)
date: 2026-11-23
---

# R1 research: duplicate grouping merges differing cards; group row shows g[0]

Method: traced the grouping path end to end on the harness, on 2026-11-23 (CET).
Population for every figure below = this repo's source tree at commit `d66bffa`
on `main` (`git log -1 --format='%H %cI'`: 2026-11-23T04:03:42+01:00). Every
citation is a file+line I re-read today. The live Supabase project was
deliberately not touched (discussion agents never touch it, per AGENTS.md), so
no live divergent pair could be pulled from Dennis's data; section 4 states
that gap and what the code proves instead. Prior rounds on this claim: none
(claim.md round: 0, no round files existed when I started). C001 r02/r03
discussed this grouping from a survey angle and left it unresolved there; this
round stands on its own citations and does not lean on those files.

## 1. The claim, step by step

| # | Fact | Population / sample | Source |
|---|---|---|---|
| 1.1 | The grouping key is exactly 12 fields: `set_name, year, card_number, player_names, parallel, serial_to, serial_number, is_auto, is_patch, status, grader, grade` | 1 of 1 grouping function in the app (`groupKey`, the only key built for the inventory table) | app/page.tsx:21-22, read 2026-11-23 |
| 1.2 | The cards table carries money columns not in that key: `cost_cents`, `estimate_cents`, `list_price_cents` (plus identity fields not in the key: `team`, `subset`, `jersey_number`, `is_rookie`, `auto_type`, `grading_candidate`, `ebay_*`, `notes`) | 1 of 1 migrations in the repo; 12 key fields (1.1) vs ~15 card columns absent from it | supabase/migrations/0001_init.sql:21-58, read 2026-11-23 |
| 1.3 | The row is rendered from the group's first member: `const c = g[0]` (line 190). The Value column prints `money(c.estimate_cents)` (line 211) and the Ask column `money(c.list_price_cents)` (line 212) — representative's values only, regardless of the other members | 1 of 1 render path for the group row | app/page.tsx:189-216, read 2026-11-23 |
| 1.4 | The header total sums ALL filtered members, not the representatives: `filtered.reduce((s, c) => s + (c.estimate_cents ?? 0), 0)` (line 79), count `filtered.length` (line 80) | 1 of 1 totals path; totals depend on `filtered` (lines 44-60), not on `rows`/groups | app/page.tsx:78-81, read 2026-11-23 |
| 1.5 | `g[0]` is deterministically the oldest-created member of the group: cards are fetched ordered by `created_at` (line 14) and `groups.set(k, [...(get(k) ?? []), c])` (line 66) preserves insertion order, so the first card that entered the group is the representative | 1 fetch path + 1 group-building path | app/page.tsx:13-14, 62-67, read 2026-11-23 |
| 1.6 | Sorting by "Value (high → low)" also ranks groups by one member only: `estimate: (a, b) => (b[0].estimate_cents ?? -1) - (a[0].estimate_cents ?? -1)` (line 70). A group whose members differ by $50 is ranked as if it were one card worth `g[0]`'s value | 4 of 4 sort keys use `g[0]` (lines 70-73) | app/page.tsx:69-75, read 2026-11-23 |
| 1.7 | The Qty cell (`×N`, line 209) is the only group-aware signal in the row. Nothing marks the row as "representative's values" and nothing aggregates Value/Ask across the group | 1 row component | app/page.tsx:209-212, read 2026-11-23 |

Chain, assembled from 1.1 + 1.3 + 1.4: if a group contains two cards equal on
the 12 key fields (1.1) but different in `estimate_cents` (a column not in the
key, 1.2), the row displays one member's value (1.3) while the header total
counts both members' values (1.4). The row's Value contradicts the total it
sits under, silently (1.7). Same for Ask (1.3, line 212) — a field with no
total at all, so no contradiction is even visible for it.

## 2. The concrete divergent pair the falsifier asks for

The falsifier says: "needs a concrete divergent pair to file." Here it is.
Constructed, schema-valid, every field real (0001_init.sql:21-58); I could not
query live data for a real-world instance (section 4, gap 1).

Pair A/B, identical on all 12 key fields:

| Field | Card A | Card B | In key? |
|---|---|---|---|
| year / brand / set_name | 2024 / Topps / Chrome | same | yes |
| card_number / player_names | 161 / C.J. Stroud | same | yes |
| parallel / serial_to / serial_number | Refractor / 499 / 12 | same | yes |
| is_auto / is_patch | false / false | same | yes |
| status | in_stock | same | yes |
| grader / grade | null / null | same | yes |
| is_rookie | false | true | **no** |
| estimate_cents | 8000 ($80.00) | 5500 ($55.00) | **no** |
| list_price_cents | 9500 ($95.00) | null | **no** |
| team | Houston Texans | Texans | **no** |

Rendered with grouping on: one row, Qty ×2, Value $80.00, Ask $95.00, no RC
badge (A is g[0] — oldest by created_at, 1.5). Header: 2 cards · est. value
$135.00 (80 + 55). The row's Value is neither member's group value, the total
is not the sum of what the row displays (80 × 2 = 160 ≠ 135), and B's rookie
status is invisible because variantLabel reads g[0]'s `is_rookie`
(lib/format.ts:29, called at app/page.tsx:204). Nothing in the row hints any
of this exists (1.7).

## 3. Reachability: how such a pair arises in real use

Two independent paths produce key-identical cards with differing money, no
import bug required:

- **Import:** the importer parses `estimate` and `list_price` per row
  independently (`parseCents(get("estimate"))`, `parseCents(get("list_price"))`,
  lib/importer.ts:263-264, read 2026-11-23). A sheet listing the same card
  twice with different estimates — the normal case for hand-maintained sheets,
  where the two rows came from different sources — imports as a divergent
  group. No uniqueness constraint in 0001_init.sql:21-58 prevents it.
- **Manual edit:** the card editor writes `estimate_cents` / `list_price_cents`
  / `team` per card (app/cards/[id]/page.tsx:55-56, 105, read 2026-11-23).
  Repricing one copy of a duplicate — the entire reason to track copies
  separately — diverges a previously identical pair. The edit UI has no
  knowledge of the grouping key.

So the divergent pair is not an exotic data defect; it is the normal output of
both write paths. Money fields are the ones a user re-edits per copy.

## 4. Explicit gaps (not papered over)

- **No live instance found.** Per the Supabase rule I did not query Dennis's
  data, so section 2's pair is constructed, not observed. The code structure
  (1.1-1.7) is deterministic about what happens to such a pair once it exists;
  the only open question is whether one already exists in the live data. A
  read-only reconciliation query (compare group-key columns of every key-identical
  set against its money columns) would settle that; it is a story-agent or
  Dennis task, not this round.
- **Frequency unmeasured.** How many live groups diverge is unknown to me.
  Reachability (section 3) says the mechanism is routine, not how often it fired.
- **Intent unrecorded.** Nothing in docs/ or code states what the Value column
  is supposed to mean for a multi-member group (representative? sum? range?).
  If Dennis's answer is "representative is fine, just show a range or a sum,"
  the claim's harm is a display improvement, not a bug. That is a product
  decision for the verdict to name; the silent mismatch with the header total
  (1.4 vs 1.3) is the part that needs deciding either way.
- **Adjacent, same class (not the claim):** `is_rookie` and `auto_type` are
  displayed from g[0] via variantLabel but are not in the key (1.2,
  lib/format.ts:29-30) — the row can mislabel identity, not just money. Same
  for `team` (line 201), `grading_candidate` (line 205) and `ebay_epid`
  (line 213). A verdict can decide whether the fix joins the same story.

## 5. Source-interest flags

- Every citation is first-party code in this repo, reproducible from commit
  `d66bffa`; no commercial interest in the answer.
- No third-party, market, vendor or pricing source was used. Nothing in this
  round has a commercial interest in whether the claim stands.
