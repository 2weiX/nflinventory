---
claim: C006-inventory-loads-and-filters-client-side-
round: 1
role: researcher
model: z-ai/glm-5.3-flash
harness: hermes (Ultron on Dennis's Linux harness)
date: 2026-11-23
---

# R1 research: inventory loads and filters client-side; scale limit unmeasured

Method: I read the load path, the filter path and the import path in this repo on the harness on
2026-11-23 (CET). Population for every code figure below = this repo's source tree at commit
`5b41dc5` on `main` (`git log -1`: 2026-11-23 04:09:00 +0100, "discussion: housekeeping"); the
sample is every file cited, re-read in full today. I did **not** touch the live Supabase project
(discussion agents never touch it, per AGENTS.md). I did not browse Whatnot, eBay or any app
endpoint; the only external source is the Supabase JS documentation, cited and flagged below.

## 1. The claim, step by step

| # | Fact | Population / sample | Source |
|---|---|---|---|
| 1.1 | `loadAllCards()` fetches the **entire** `cards` table: an unbounded loop pages in 1,000-row `.range(from, from+999)` steps, `select("*")`, ordered by `created_at`, and only stops when a page comes back short. There is no limit, no filter and no count check in the loop | 1 code path, `app/page.tsx:11-19`; it is the only loader on the inventory page, called on mount (line 37) and after every bulk status change (line 88) | app/page.tsx, read 2026-11-23 |
| 1.2 | The paging step of 1,000 matches the platform default: Supabase-hosted PostgREST returns a maximum of 1,000 rows per request by default, so a single un-paged `select()` would silently truncate at 1,000 with HTTP 200. The loop is therefore correct at any size, but it means one HTTP round trip per 1,000 rows, all awaited serially before the first render shows a card | 1 vendor default (project API setting, owner-configurable) | Supabase JS v1 docs, https://supabase.com/docs/reference/javascript/v1/select ("By default, Supabase projects will return a maximum of 1,000 rows"), accessed 2026-11-23. **Vendor source: Supabase has an interest in describing the cap as a benign default; the cap's exact value on project `ngxfvhlbrhlqarpwavcf` is not in the repo and was not verified.** |
| 1.3 | All filtering happens in the browser: a single `useMemo` runs every active filter (status, set, eBay ID, grading candidate, free-text search) over the full in-memory array on each keystroke of `q`. Free-text search is `String.includes` over a concatenated haystack — no Postgres `ilike`, no `textSearch`, anywhere in the app (`grep -rn "textSearch" app lib` = 0 hits) | 1 filter function over the full table; 1 grep over app/ + lib/ at `5b41dc5` | app/page.tsx:44-60; grep output, 2026-11-23 |
| 1.4 | Grouping, sorting and totals also run over the full filtered array in memory (`groupKey` Map, 4-way sort, sum of `estimate_cents`), and the table renders **every** resulting row in one `<tbody>` with no pagination and no windowing | 3 render-path memos + 1 unwindowed map, same file | app/page.tsx:62-81, 189-218, read 2026-11-23 |
| 1.5 | There is no size-aware fallback anywhere: no "load more", no server-side filter mode, no row cap. Export (`exportCsv`) also serialises the full filtered set client-side | whole app/ tree at `5b41dc5` | app/page.tsx:91-94; `git grep loadAllCards` (2 hits, both in app/page.tsx), 2026-11-23 |
| 1.6 | The table's growth path is unbounded bulk import: the import page inserts parsed sheets in 500-row chunks until the sheet is exhausted, with no ceiling on rows per import | 1 insert loop, `app/import/page.tsx:119-122` (chunk size 500), read 2026-11-23 |

Chain, from 1.1 + 1.3 + 1.4: every inventory page visit transfers the whole table (ceil(N/1000)
serial round trips, N = total rows), then does all filter/group/sort/render work over all N rows in
the browser. Cost is O(N) in network round trips, transfer, memory and per-keystroke CPU, for a
table fed by an unbounded import path (1.6).

## 2. The scale limit: the evidence does not exist, and I stopped there

The falsifier asks for "a live row-count range from the owner". I state plainly:

- **No row-count figure for the live `cards` table exists in this repo.** I searched
  `docs/STORIES.md`, `docs/HANDOFF.md`, `README.md`, `discussion/index.md` and the whole
  `discussion/` tree for row counts and for prior measurement of this page: nothing. The only row
  counts on file are for Dennis's football **MCP** checklist database (e.g. Flagship 2026, 43,770
  variants, as of 2026-11-20, per AGENTS.md project facts) — that is a different database and a
  different population; it says nothing about the inventory app's `cards` table.
- **I could not measure it and did not try.** The live Supabase project holds real personal data
  and discussion agents never touch it (AGENTS.md). No dev fixture, seed file or published
  aggregate in `data/` gives a proxy (`discussion/archive/` is empty).
- **Therefore the size at which the design in section 1 degrades is unknown.** No benchmark, no
  timing, no transfer measurement exists — an explicit gap, not a negative finding. Until Dennis
  supplies a live range (or authorises a story agent to run one `count(*)` under the story rules),
  the correct status of this claim is a **design observation with an unmeasured scale limit**,
  exactly as C001's adjudicator recorded it on 2026-11-22 ("No live-size measurement exists, so the
  finding is a design observation, not a measured failure" —
  `discussion/claims/C001-.../r03-verdict--harness-nflinv.md`, verified in code today).

## 3. What would settle the falsifier

One number from Dennis: the current row count of `cards`, and any expected ceiling (e.g. planned
import volume). A single `select count(*)` run by a story agent under the normal rules would do the
same. With that figure the claim can move from "unmeasured" to either "harmless at real scale" or
"defect above X rows"; without it no amount of code reading can decide it.

## 4. Source interest summary

- All code evidence: first-party, this repo, no commercial interest.
- Supabase docs (1.2): vendor source, cited for the platform's default page behaviour only. No
  interest in the answer to this claim (the finding is independent of whether the 1,000 default is
  raised); flagged anyway.
