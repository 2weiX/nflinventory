---
claim: C006-inventory-loads-and-filters-client-side-
round: 3
role: adjudicator
model: claude-sonnet-5-5
harness: claude-code (Claude subscription, Dennis's Linux harness)
date: 2026-11-24
verdict: open
confidence: low
---

# R3 verdict: inventory loads and filters client-side; scale limit unmeasured

Independence: r01 = z-ai/glm-5.3-flash, r02 = moonshotai/kimi-k3.1-pro:free, r03 = claude-sonnet-5-5.
All three differ, so the gate is satisfied. The challenge is independent of the research (different
model), so it carries full weight; neither side is a same-model echo.

Method: I re-read `app/page.tsx` (loader, filter memo, render), `app/import/page.tsx:119-122`,
`supabase/migrations/0001_init.sql`, `0002_comp_price.sql` and `docs/STORIES.md` S2 on `main`
(`4b4f9e3`) today. I did not touch the live Supabase project, so no row count exists and none is
invented here.

## 1. What is settled (code facts, both sides agree, I re-verified)

- `loadAllCards` (`app/page.tsx:11-19`) pages the whole `cards` table, 1,000 rows per request,
  `select("*")`, serially, with no cap. Filter, group, sort, totals and CSV export all run in memory;
  the `<tbody>` renders every row, unwindowed. Confirmed.
- The import path has no row ceiling (500-row insert chunks, `app/import/page.tsx:119-122`). Confirmed.
- S2 is marked done and its acceptance criteria are met. Confirmed.
- No live row count exists anywhere in the repo. The 43,770 figure in AGENTS.md is the football MCP
  checklist, not `cards`. Confirmed.

## 2. Ruling on the objections

| Obj | Challenger rating | My ruling | Reason |
|---|---|---|---|
| OBJ-1 single-user, so small | weak | **weak, agreed** | Plausible but unevidenced; it is the mirror image of the claim. The challenger says so itself. |
| OBJ-2 deliberate v1 simplification | moderate | **partly refuted** | "Simplest correct implementation" is wrong; see section 3. Also nothing in the repo records that this was a deliberate choice: S2 says nothing about scale. That is an inference from the code, not a source. |
| OBJ-3 falsifier conflates two questions | moderate | **upheld** | Row count alone cannot make this a defect; a load-time budget is needed too. Section 4 gives a sharper falsifier. |
| OBJ-4 CSV export is a feature | weak | **upheld, immaterial** | r01 1.5 listed it as an absence of fallback, not a fault. Server-side filtering would need a separate export; true but irrelevant to the verdict. |

## 3. Both sides were wrong about the loop being correct

r01 §1.2 says "the loop is therefore correct at any size"; r02 OBJ-2 builds on that ("handled it").
Neither checked the sort key.

- The loader orders by `created_at` only (`app/page.tsx:15`). `created_at` defaults to `now()`
  (`0001_init.sql:59`), and `now()` is the transaction start time. The import inserts up to 500 rows
  per statement (`app/import/page.tsx:120-121`), so every row of a chunk carries an identical
  `created_at`. Ties of up to 500 rows are therefore the normal case, not an edge case.
- Postgres does not guarantee a stable order among ties between separate `OFFSET`/`LIMIT` queries.
  With ties straddling a 1,000-row page boundary, a row can appear on two pages or on none. The
  page-1 and page-2 queries run independently, with different offsets.
- Consequence if it happens: a card is silently missing from the inventory (or duplicated, which the
  grouping would show as ×N). Totals and the "estimated value" line would be wrong with no error.
- Scope and confidence: this only matters once the table passes 1,000 rows, and I did **not** run it,
  so whether the live planner actually reorders ties is unobserved. Status: **plausible, unmeasured**.
  Unlike the scale question, it needs no owner number to be a defect; it is a missing tiebreaker.
  The fix would be small: `.order("created_at").order("id")`. That is a story change, not a
  discussion edit; I do not make it here.

## 4. Recomputing the challenger's numbers

- "10,000 objects, `String.includes`, under 5 ms": unmeasured assertion, no source. The filter also
  builds a lowercased haystack string per row per keystroke (`page.tsx:53-55`), plus `groupKey`
  joins 12 fields per row and `groups.set(k, [...(groups.get(k) ?? []), c])` copies the group array
  on each insert (`page.tsx:66`), which is quadratic for a large ×N group. I did not time any of
  it. Treat 5 ms as unsupported rather than wrong.
- "10,000 rows ~2-4 MB with `select("*")`": `cards` has 32 columns in `0001` plus 3 added by `0002`,
  about 35 keys per row. Estimated JSON is roughly 1 KB per row (keys alone ~16 bytes each, about
  560 bytes, plus three UUIDs and two timestamps), so 10,000 rows is about 10 MB uncompressed, i.e.
  **2.5 to 5 times higher than the challenger's range**. Compression of repeated keys probably brings
  the wire size back to about the challenger's figure; I did not measure it. Direction right,
  arithmetic unverified. This is an estimate from schema shape, not a measurement.
- Round trips: ceil(N/1000). 10,000 rows = 10 serial requests. 5,000 = 5. The challenger's thresholds
  (<5,000 fine, >50,000 has teeth) are guesses by both sides; no data separates them.

## 5. Verdict: open

- The design observation is **upheld**: the whole table is loaded and filtered client-side, and no
  scale limit is known.
- Whether it is a defect at real scale is **open**, and cannot be closed by reading code. The
  evidence does not conflict; it is absent.
- Conflict left labelled, not resolved: r01 says the loop is correct at any size; my section 3 says
  ties may break it above 1,000 rows. Unresolved until someone runs the paging on a table with
  tied `created_at`.
- The claim's `decides: []` stays empty. The decision it could drive is "does S2 need server-side
  filtering or a count guard", but nothing in `docs/STORIES.md` depends on it yet.

Sharper falsifier (per OBJ-3): the claim is a defect if `count(*)` on `cards`, taken by the owner or
by a story agent under the story rules, times a full inventory load on a phone at that size beyond a
load-time budget Dennis names (suggest 3 s). Otherwise it closes as a non-issue. Separately, the
tiebreaker finding stands on its own and does not need the count.

## 6. Suggested follow-up (a round or story, not applied here)

1. Dennis: current `cards` row count and expected ceiling, plus the load-time budget.
2. A story agent: add `id` as a second `order` key in `loadAllCards`, with a test; optionally a
   `count` guard that warns when pages fetched disagree with the head count.

## 7. Source interest

All evidence first-party (this repo). No external source consulted. No commercial interest.
