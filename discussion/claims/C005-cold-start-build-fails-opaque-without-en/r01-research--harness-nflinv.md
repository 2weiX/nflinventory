---
claim: C005-cold-start-build-fails-opaque-without-en
round: 1
role: researcher
model: z-ai/glm-5.3-flash
harness: hermes (Ultron on Dennis's Linux harness)
date: 2026-11-23
---

# R1 research: cold-start build fails opaque without env vars

Method: empirical, not just source reading. I ran the app's actual commands in a
scratch copy of the tree with every `.env*` file removed, and recorded exit codes
and output. Population for every figure below = this repo's source tree at commit
`909de5d` on `main` (`git log -1 --format='%H %cI'`: 2026-11-23T04:05:08+01:00,
worktree of `2weiX/nflinventory`). All runs on 2026-11-23 (CET), one machine:
Node v26.12.1, npm 12.0.2, Next.js 16.4.6 (Turbopack), `node_modules` installed
from `package-lock.json` (npm). Each scenario was run once (n=1 per run, runs A-E
below); the throw itself is deterministic given missing vars, but build-tool
variance across versions was not sampled. The test copy lives at
`~/.hermes/cache/scratch/c005-fresh-IFRj` with `.git`, `discussion/` and all
`.env*` excluded, so nothing in the repo and nothing on the live Supabase project
was touched (Supabase rule, AGENTS.md). Prior rounds on this claim: none
(claim.md round: 0, no round files existed when I started). Note for the loop
context: I am not proposing any new claim; per the task note, open claims come
first and budget allows 6 of the 7 in flight.

## 1. The mechanism the claim asserts

| # | Fact | Population / sample | Source |
|---|---|---|---|
| 1.1 | `lib/supabase.ts` throws at module scope if either `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is empty or unset (lines 6-8). The thrown message names both variable names and points at `.env.example`: `Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (see .env.example)` | 1 of 1 supabase client module in the app | lib/supabase.ts:3-8, read 2026-11-23 |
| 1.2 | All four route pages import `supabase` at module scope and are `"use client"`, so the module is evaluated during prerender (build) and SSR (dev) | 4 of 4 pages that touch Supabase | app/page.tsx:5, app/login/page.tsx:5, app/sales/page.tsx:5, app/import/page.tsx:7 (imports); the build stack also shows components/AuthGate.tsx:7, read 2026-11-23 |
| 1.3 | There is no CI and no locally documented build: no `.github/` directory exists; README's local section documents `cp .env.example .env.local` (with "fill in the publishable key"), `npm install`, `npm run dev`, `npm test` — `npm run build` appears nowhere in README; AGENTS.md's turn-start loop requires `npm install, npm test, npm run typecheck`, also no build | 1 of 1 README (47 lines), 1 of 1 AGENTS.md | README.md:33-40 and 22-29, AGENTS.md:9-11 (Start of every turn), read 2026-11-23; `ls .github` returned nothing, 2026-11-23 |

## 2. The runs (the evidence that decides this)

All runs in the fresh copy, env explicitly stripped of both variables for A/C/D
(`env -u NEXT_PUBLIC_SUPABASE_URL -u NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`;
neither variable was present in the shell environment to begin with — the shell
only carries differently-named `SUPABASE_URL`/`SUPABASE_DB_PASSWORD`/
`SUPABASE_SERVICE_KEY`/`DB_HOST`, which the app never reads, checked by name
2026-11-23):

| Run | Setup | Command | Result | Exit |
|---|---|---|---|---|
| A | no `.env*` files at all | `npm run build` | Compile succeeds ("Compiled successfully in 3.4s"), then fails at "Generating static pages": `Error occurred prerendering page "/"` → `Error: Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (see .env.example)` at `lib/supabase.ts:7` via `components/AuthGate.tsx:7`; worker exits code 1 | 1 |
| B | `.env.local` written with the exact two lines of `.env.example` (URL real, key left as the placeholder `sb_publishable_...`) | `npm run build` | All 7 routes build and prerender (`/`, `/_not-found`, `/api/sheet`, `/cards/[id]`, `/import`, `/login`, `/sales`) | 0 |
| C | no `.env*` files | `npm run typecheck`, then `npm test` | typecheck passes; importer tests pass (0 fail, 126.7 ms) | 0, 0 |
| D | no `.env*` files | `npm run dev` (PORT 3457), `GET /` | HTTP 500 in 738 ms; the same explicit message appears in the served body and in the dev log with stack `lib/supabase.ts:7` via `app/page.tsx:5` | 500 |
| E | placeholder `.env.local` as in B | `npm run dev`, `GET /` | HTTP 200, app shell renders (title "NFL Inventory") | 200 |

Full logs preserved in the scratch copy: `build-noenv.log` (A), `build-example-env.log` (B), `typecheck-noenv.log`, `test-noenv.log` (C), server session log (D, E).

## 3. What this means for the claim, clause by clause

- **"Fresh checkout without the two Supabase env vars throws at lib/supabase.ts import"** — TRUE, verified (A: build exit 1; D: dev 500). The throw is real and module-scope (1.1).
- **"fails opaque"** — FALSE. In every observed failure the message is the opposite of opaque: it names both variables and the file to copy (`see .env.example`), with a source-mapped stack to `lib/supabase.ts:7`. The only obscurity is ordering: in the build (A) the error arrives after a green "Compiled successfully" line, so a skimming reader sees success first — but the named fix is directly below, unburied.
- **The falsifier: "falsified if the documented build path succeeds"** — the documented path succeeds, twice over. README's literal first step (`cp .env.example .env.local`, key left unfilled) leaves both variables non-empty (the placeholder `sb_publishable_...` counts), so the build passes (B) and dev serves (E). The documented Vercel path sets both variables in the dashboard before the first deploy (README.md:24-27). And the loop agents actually run (AGENTS.md turn-start: install/test/typecheck) passes without any env at all (C). No documented path hits the failure.
- **Residual true kernel:** the failure is reachable only by an *undocumented* action — running bare `next build` (or importing to Vercel skipping README step 2) with no env file. That scenario exists and fails loudly (A). If any fix is wanted, a one-line README note under "Develop locally" ("`npm run build` also needs the two vars from `.env.example`") covers it; the lazy-client alternative would defer the throw to first request and fixes no observed failure — that trade is the verdict's call, not mine.
- **Adjacent trap found while testing (not the claim):** the documented copy step with the placeholder key yields a green build (B) and a serving app (E), but the app must then fail on its first real Supabase call (401 from the project with a bogus key). I did not verify that runtime failure — see gap 2.

## 4. Explicit gaps (not papered over)

1. **Vercel build not executed.** I did not (and should not) trigger a real Vercel deployment. Run A is the same `next build` command Vercel runs, on the same Next version pinned in `package.json` (^16.4.6); I label the equivalence an assumption, not an observation.
2. **Runtime-with-placeholder-key not observed.** Per the Supabase rule I made no network request to the live project; `createClient` performs no I/O at construction, so runs B/E made zero live calls. That the app 401s on first auth with a placeholder key is plausible but untested — treat it as unverified.
3. **n=1 per scenario, one machine, one Node/Next version.** No cross-version sampling; the deterministic throw (1.1) does not depend on it, build-tool behavior might.
4. **A tooling artifact I could not remove and that is NOT the claim's failure:** every Next run here printed `Warning: Next.js ignored pnpm-lock.yaml in /home/dennis ... set turbopack.root`. This comes from checkouts nested under `/home/dennis` on this machine (lockfile discovery walks above the checkout) and is a warning only — runs B/E succeeded with it present. A fresh clone elsewhere may not see it. Flagged so a challenger does not mistake it for the error under test.
5. **How often anyone hits the no-env scenario is unmeasured.** It requires a command no doc tells you to run (1.3); I have no data on contributor behavior.

## 5. Source-interest flags

- Every citation is first-party: code, docs and command output reproducible from commit `909de5d` and the preserved logs in the scratch copy. No commercial interest in the answer.
- Next.js is named only as the tool observed (v16.4.6, Turbopack); Vercel is named as the documented host. Neither vendor's documentation was relied on for any figure, so no vendor has an interest represented here.
- No market, pricing or third-party data source was used. Nothing in this round has a commercial interest in whether the claim stands.
