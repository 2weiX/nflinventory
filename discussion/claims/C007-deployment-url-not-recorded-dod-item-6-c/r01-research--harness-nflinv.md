---
claim: C007-deployment-url-not-recorded-dod-item-6-c
round: 1
role: researcher
model: z-ai/glm-5.3-flash
harness: hermes (Ultron on Dennis's Linux harness)
date: 2026-11-23
---

# R1 research: deployment URL not recorded; DoD item 6 cannot run

Method: searched every place a deployment URL could be recorded in this repo, re-ran the
one external probe a prior round made, and re-checked the DoD text. On the harness, on
2026-11-23 04:11 CET. Population for every figure = this repo's tree at commit `5c2f0ae`
on `main` (`git log -1`: 2026-11-23 04:10:09 +0100), unless a table row names a smaller
population. Every citation is a command output I re-ran today or a file line I re-read
today. No prior rounds exist on this claim (claim.md says `round: 0`); C001's r01/r03
covered the same ground on 2026-11-21 and are cited as prior evidence, re-verified here.

Frontmatter note: the task brief said "no prior rounds carry a model field". That holds
only for C007 (this is round 1, no earlier rounds); C001-C006's r01 files do carry
`model:` in frontmatter, and `bin/gate-independence` refuses a round without it ("Every
round declares claim, round, role and model"). I echo the roster's binding
(`researcher: model=z-ai/glm-5.3-flash`) as every prior researcher round did.

## 1. The claim, step by step

| # | Fact | Population / sample | Source |
|---|---|---|---|
| 1.1 | DoD item 6 reads verbatim: "**Works in a browser:** the changed screens were opened on the deployed preview at desktop width and at 375 px. Empty, loading and error states all show something sensible." A story cannot be Done without it | 1 of 11 DoD items in the DoD block (docs/STORIES.md:295-315) | docs/STORIES.md:304, read 2026-11-23 |
| 1.2 | `docs/HANDOFF.md` contains no URL for a deployment. 17 lines, 1 entry (2026-11-21 Claude setup session). Grep for `vercel\|https?://\|preview\|deploy` over the whole file hits: line 11 ("Screens not yet seen in a browser (no deployment at the time). First agent: once the Vercel preview exists, do a visual pass at desktop and 375 px."), and lines 14/16/17, which are instructions *to Dennis* naming env vars to set in Vercel - no URL of the app itself | whole current file (17 lines, 1 entry) | grep output, 2026-11-23 |
| 1.3 | No URL was ever recorded in HANDOFF's git history either: all 4 commits that touch it (ef6ee13, f6a7123, 328997e, 1769823; 2026-11-21 20:29-20:33 UTC) re-ran through `git show`, and the only URL that ever appears is `https://claude.ai/code/session_...` (a Claude session link in a commit message footer, not an app URL). The latest HANDOFF commit is 1769823 (2026-11-21 20:33 UTC); nothing has touched it since | 4 of 4 HANDOFF-touching commits (full history to 5c2f0ae) | `git log --oneline -- docs/HANDOFF.md` + per-commit `git show` grep, 2026-11-23 |
| 1.4 | No deployment URL anywhere else in the repo: grep for `vercel.app\|vercel.com` over *.md/*.ts/*.tsx/*.json/*.example/*.yml (excluding node_modules/.next/locks) hits only discussion rounds citing the 2026-11-21 finding. README.md names no URL either: line 6 says "deploys to Vercel", lines 24-28 are the manual Vercel-import walkthrough ("New Project → import 2weiX/nflinventory... set Site URL to *your* Vercel URL") - instructions, again, with a placeholder where the URL would go | repo tree at 5c2f0ae, 7 file types | grep outputs, 2026-11-23 |
| 1.5 | No deploy tooling in the tree: no `.vercel/` directory, no `vercel.json`, no deploy or vercel script in package.json (grep exits 1). So no local artifact can name the project's deployment either | repo root + package.json | `ls .vercel`, `ls vercel.json`, grep package.json, 2026-11-23 |
| 1.6 | The one URL a repo could not have recorded but a reader could guess - `https://nflinventory.vercel.app` - is an unrelated project: HTTP 200 today serving `<title>Noman Fabrics Smart Inventory · v1.2.1 Enterprise Edition</title>`; `/login`, `/api/mcp` and `/api/ingest/boards` all 404. Same result C001 r1 got on 2026-11-21, re-verified 2026-11-23 | 4 HTTP requests (/, /login, /api/mcp, /api/ingest/boards), 1 guessed hostname | curl outputs, 2026-11-23; C001 r01 lines 75-78 |
| 1.7 | No agent turn since the baseline has recorded a browser pass: HANDOFF.md has exactly 1 entry (2026-11-21) and its own text says the screens were never seen in a browser (1.2, line 11). So DoD item 6 has never been executed, not even once, on any story | 1 entry, full file | docs/HANDOFF.md:11, 2026-11-23 |

Chain: DoD item 6 requires opening "the deployed preview" (1.1). The repo records no
preview URL in any file, any commit, or any deploy artifact (1.2-1.5). The guessable
subdomain belongs to someone else (1.6). Therefore nothing in this loop can point a
browser at the deployed preview, and item 6 cannot run - which is exactly what the
claim says.

## 2. What the claim does NOT say (keep the falsifier honest)

The claim is "the URL is not **recorded**", not "no deployment exists". C001's verdict
(r03, line 74-76) already drew that line and it still holds: a Vercel project imported
from `2weiX/nflinventory` may exist in Dennis's Vercel account and work fine, and it
would be invisible to every check above. What is missing is the record, not
necessarily the deployment. Section 3 lists the two ways this settles.

## 3. How the claim settles (the falsifier's two branches)

Falsifier: "No Vercel preview URL exists in HANDOFF; the browser visual pass is
blocked - settles the moment Dennis supplies the URL."

- Branch A (Dennis supplies the URL): any non-secret `*.vercel.app` (or custom domain)
  URL from Dennis falsifies 1.2-1.5's "not recorded" as of that date. The browser
  visual pass of DoD item 6 becomes runnable the same day; no credentials needed
  beyond what a public preview exposes.
- Branch B (Dennis states there is no deployment): settles it as "v1 has no
  deployment"; DoD item 6 is then unrunnable for every story until the manual
  Vercel walkthrough in README.md:24-28 is done.
- Nothing in this loop settles either branch: I have no Vercel credentials, the
  Supabase REST endpoint returns 401 without a key by design, and the repo carries
  no deploy artifact. Stopped looking there.

## 4. Explicit gaps (not papered over)

- **Whether a live deployment exists in Dennis's Vercel account: unknowable from here.**
  No credentials in this loop, no Vercel API token on the harness for it, and probing
  further guessed hostnames would be noise (one guess, 1.6, was already tested and
  came back someone else's project). Explicit gap; the claim's own falsifier names
  Dennis as the settler.
- **Whether the unrelated project at `nflinventory.vercel.app` is Dennis's own under a
  different title:** I checked only the public HTML title and four routes (1.6). A
  Vercel account owner could deploy anything under any subdomain, so I cannot rule it
  out from outside - but it serves a "Smart Inventory" enterprise app whose routes
  404 where this app's routes would live, so it is not this codebase. That is an
  inference from the title string and the 404s, labelled as such.
- **`.env.example` carries the Supabase URL only** (`NEXT_PUBLIC_SUPABASE_URL=
  https://ngxfvhlbrhlqarpwavcf.supabase.co`, line 2) - that is the database, not the
  deployed app; listed here so nobody counts it as the missing URL.

## 5. Source-interest flags

- Every citation is first-party and reproducible on the harness (file reads, git
  commands, four curl requests). No commercial interest in the answer.
- The single external origin touched, `nflinventory.vercel.app`, is an unknown
  third-party Vercel deployment ("Noman Fabrics Smart Inventory"). It has no interest
  in this claim; I only read its title and status codes, four GET requests, 2026-11-23.
- No market, vendor or pricing source was used. Nothing here has a commercial
  interest in the answer.

## 6. Note for the challenger

The one check a challenger can add beyond this round: probe additional hostname
guesses from AGENTS.md/README conventions (`2weiX-nflinventory.vercel.app`,
`nflinventory-2weiX.vercel.app`, etc.). That is enumeration by guess, which C001 r03
already declined to treat as evidence, and it can neither prove a deployment exists
(a missing URL stays missing) nor that one does not (private projects are unlisted).
The claim's falsifier routes around this: it settles on Dennis's word, not on more
probing. I recommend the challenger hold the round to 1.1-1.7 and say whether the
record gap itself is worth a story (e.g. "record the URL in README/HANDOFF" as a
one-line DoD amendment) or remains an owner task.
