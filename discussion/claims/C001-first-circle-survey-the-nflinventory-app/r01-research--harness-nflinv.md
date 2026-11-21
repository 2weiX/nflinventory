---
claim: C001-first-circle-survey-the-nflinventory-app
round: 1
role: researcher
model: z-ai/glm-5.3-flash
harness: hermes (Ultron on Dennis's Linux harness)
date: 2026-11-21
---

# R1 research: survey of the nflinventory app

Survey of the whole repo, done 2026-11-21 (CET) on the harness. Method: read every source file
(app/, components/, lib/, supabase/migrations/, docs/, README), then re-ran the project's own
checks and probed the network. Every number below is one of: a command output I re-ran today, a
file+line citation, or an HTTP probe with the URL shown. Nothing is taken from memory of other
repos. Where the running app was needed and could not be reached, the gap is stated, not papered
over.

## 1. What exists (verified 2026-11-21, population = whole repo at commit 0f141ad on main)

| # | Fact | Population / sample | Source |
|---|---|---|---|
| 1.1 | App surface is 5 screens: inventory, card detail/add, import, sales, login. 14 TypeScript files, ~1,050 lines total (865 counted in app/*.tsx + lib/*.ts via wc -l; excludes cards/[id]/page.tsx from that glob, counted separately) | all source files | `find app components lib -type f`, `wc -l`, 2026-11-21 |
| 1.2 | One migration, 137 lines: 4 tables (cards, sales, listings, import_batches), 1 view (card_profit), RLS on all 4 tables, one policy each | supabase/migrations/ | 0001_init.sql lines 7-137 |
| 1.3 | `npm test`: 9 pass, 0 fail (importer tests only; sample = the 9 cases in lib/importer.test.ts) | unit tests | re-ran 2026-11-21 |
| 1.4 | `npm run typecheck` (tsc --noEmit): clean | whole repo | re-ran 2026-11-21 |
| 1.5 | `npm run build`: FAILS on a clean checkout (no .env.local); PASSES with dummy env values | 1 run each way | see 2.1 |
| 1.6 | app/api contains exactly one route: `sheet/route.ts` (Google Sheets CSV proxy). No /api/mcp, no /api/ingest/* | app/api/ | `ls app/api/*` 2026-11-21 |
| 1.7 | Chunked inserts exist at 500 rows per batch (import page), contradicting nothing in S4's open checkbox which mentions chunking | app/import/page.tsx:120-121 | read 2026-11-21 |
| 1.8 | `git grep -iE "secret|service_role|sk-|EBAY_CLIENT_SECRET="` hits only docs, .env.example comments and discussion. No secrets in tree | whole repo minus discussion/rounds | re-ran 2026-11-21 |

## 2. Findings that look like work

**2.1 Build depends on env vars at build time.** `lib/supabase.ts:7` throws at module
evaluation when the two NEXT_PUBLIC_* vars are absent; `components/AuthGate.tsx:7` re-exports that
client, so every statically prerendered page dies. Reproduced 2026-11-21: bare `npm run build`
exits with "Export encountered an error on /page"; the same command with
`NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co` and a dummy key builds clean (5 routes).
So any agent checking out the repo cold (per AGENTS.md's start-of-turn ritual) sees a red build
that is not a code defect. Population: 1 checkout, 2 builds. Source: command outputs above.

**2.2 Import undo can destroy sales records.** The undo button (app/import/page.tsx:136-137)
deletes every card created by a batch. `sales.card_id` is `references cards(id) on delete
cascade` (0001_init.sql:85), so undoing an old import also deletes the sale rows recorded since.
The UI's own confirm text admits it ("Cards you edited since will be deleted too") but does not
mention sales. Population: 1 code path. Source: both files, read 2026-11-21.

**2.3 The entire inventory is loaded into the browser, then searched client-side.**
app/page.tsx:11-19 pages through every `cards` row (1,000 at a time) into React state; the
filter (lines 44-60) is substring matching in memory. The Postgres full-text index
`cards_player_idx` (0001_init.sql:64, gin on to_tsvector of player_names) is unused by any
query: grep finds no `.textSearch` call in the repo. Fine at hundreds of cards; unknown at
thousands. Population: 1 code path, 0 live-size measurements. Source: file lines above.

**2.4 Mobile story not started.** Zero `@media` rules in app/globals.css; 10 `sm:/md:/lg:`
class usages across all four pages; no web app manifest anywhere in the repo. S10's acceptance
criteria (375 px, 40 px targets, card list, manifest) are all unmet as of 2026-11-21. This is
expected (S10 is 🔜), recorded so the backlog is grounded. Source: `grep -rn "manifest\|@media"`,
`grep -c "md:\|sm:\|lg:"`.

**2.5 S7 and S16 app-side do not exist yet.** Only `app/api/sheet/route.ts` exists (1.6), so
`/api/mcp` (S7, P0, the next story per docs/HANDOFF.md) and `/api/ingest/*` (S16) have no code.
Also expected; recorded for the same reason. Source: 1.6.

## 3. Cross-check: README vs code vs the running app

README v1 claims verified in code on 2026-11-21: search across player/#/parallel/team/set and
`/N` (app/page.tsx:53-57), duplicate grouping ×N with toggle (21-22, 62-76, 209), bulk status
change (83-89), CSV export (91-94), eBay title capped at 80 chars (lib/format.ts:35-60),
profit = price − fees − shipping − cost both in the view (0001_init.sql:97-109) and the sales
page (app/sales/page.tsx:39-40), undo per import (import page:136), chunked inserts (2 above).

**The running app: an explicit gap.** No deployed URL is recorded anywhere in the repo (README
and docs/HANDOFF.md describe deployment as a manual Dennis step; grep for `vercel.app` across
*.md/*.ts/*.tsx/*.json finds no URL). I probed `https://nflinventory.vercel.app` on 2026-11-21:
HTTP 200, but the page is "Noman Fabrics Smart Inventory · v1.2.1 Enterprise Edition" - an
unrelated project holding that subdomain; `/login`, `/api/mcp` and `/api/ingest/boards` all
return 404 there. Conclusion: **as of 2026-11-21 this survey cannot verify any claim about the
running app, because no URL for it exists in the repo and the obvious subdomain is occupied.**
The QA Definition of Done's item 6 ("works in a browser: opened on the deployed preview") is
therefore unverifiable for v1 from where I sit. An explicit gap, and a decision for Dennis:
record the real URL in README/HANDOFF, or accept that v1 has no deployment.

**Other things I could not check and stopped looking at:** live row counts in the Supabase
project (REST probe of `ngxfvhlbrhlqarpwavcf.supabase.co` returns 401 without a key, by design;
no credentials belong in this loop); whether "Allow new users to sign up" is off; whether RLS
holds on the live project (the repo carries a recorded two-user transaction test from the v1
handoff, dated 2026-11-21, but I did not repeat it). These need Dennis's dashboard or a story
agent's rolled-back-transaction test, not a discussion round.

## 4. Source-interest flags

- Every code citation above is first-party and reproducible; no commercial interest.
- docs/STORIES.md's MCP figures (43,770 Flagship variants, 25,091 Chrome 2026, 2,603 odds rates,
  breakdata's 321+ boards, etc.) are dated 2026-11-20 and marked "verified live", but they are
  self-reported by the same repo's authors and I did not re-verify them against the football MCP.
  Treat them as claims from an interested party (they motivate S8/S16's design) until a
  challenger re-pulls them from the MCP itself.
- No third-party market, vendor or pricing source was used in this round; nothing here has a
  commercial interest in the answer.

## 5. Claim backlog this survey proposes

Numbering starts at C002. Each is filed by `bin/claim` (operator or next circle), not by this
round; the falsifier is what the challenger must run against the actual code.

| # | Proposed claim | Falsifier |
|---|---|---|
| 1 | A clean clone cannot build without env vars present (2.1); fix is lazy Supabase init or forced-dynamic pages, so the AGENTS.md cold-start ritual passes | Challenger re-clones, runs `npm run build` with no env, reproduces or refutes the throw |
| 2 | Import undo destroys sales recorded after the import (2.2), so a wrong click can lose real profit history | Challenger traces the FK cascade in 0001_init.sql:85 against import/page.tsx:136 and shows the deletion path |
| 3 | Inventory search scales to Dennis's real stock size (client-side load-all, 2.3) | Needs the real row count from the live DB - currently unavailable (section 3 gap); claim stays open with `needs:` = row count |
| 4 | The app has no recorded deployment; QA DoD item 6 cannot be executed for any story until a URL exists | Dennis states the URL (or the absence), which settles it immediately |
| 5 | S7's MCP endpoint is the highest-value next build (P0, unblocks S8, everything else it needs exists) | Challenger orders the open stories by dependency and value and shows a different ordering |
| 6 | The unused `cards_player_idx` is dead weight or a future fix; decide when real row counts justify moving search server-side | Same evidence need as #3 |

Nothing in the backlog touches eBay (S11/S12 stay blocked on developer keys per AGENTS.md) or
suggests touching the live database.
