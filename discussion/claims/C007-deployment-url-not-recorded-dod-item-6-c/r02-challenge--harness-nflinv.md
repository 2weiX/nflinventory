---
claim: C007-deployment-url-not-recorded-dod-item-6-c
round: 2
role: challenger
model: moonshotai/kimi-k3.1-pro:free
harness: nflinv (numes :free tier, dispatched by bin/numes-round.sh)
date: 2026-11-23
---

# R2 challenge: the claim is already false on the sources it cites

The researcher's work is internally consistent but rests on a stale baseline. Three HANDOFF
commits added **after** the commit R1 anchored to (`1769823`, 2026-11-21 20:33 UTC) name the
live deployment URL explicitly. The claim "Deployment URL not recorded" was true at the
2026-11-21 baseline; it is false at HEAD today.

## 1. Objection — the URL is recorded, in HANDOFF.md, in AGENTS.md, and the app returns 200

**Strength: strong. This settles the claim.**

Direct evidence, all re-read or re-fetched today (2026-11-23):

| # | Fact | Source |
|---|---|---|
| 2.1 | `docs/HANDOFF.md` line 17 (entry dated 2026-11-23, "Deploy + Price field"): "**App is live at https://nflinventory-weld.vercel.app.** Added NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in Vercel (all environments). Supabase Site URL + redirect set to the Vercel domain. Dennis created his account; public sign-ups are now OFF." | `docs/HANDOFF.md:13-24`, read 2026-11-23 |
| 2.2 | Same HANDOFF entry, line 9: "Evidence (tests, build, manual checks): Vercel status `success` on a10b841." A deploy happened, an agent watched it succeed. | `docs/HANDOFF.md:9` |
| 2.3 | `AGENTS.md` line 34 (Shipping step 3): "Smoke-check the live app: https://nflinventory-weld.vercel.app/login must load and show the sign-in form." — the URL is codified as a required smoke check for every story agent. | `AGENTS.md:34` |
| 2.4 | `AGENTS.md` line 88 (Project facts): "Hosting: Vercel project `nflinventory`, **live at https://nflinventory-weld.vercel.app** (auto-deploys `main`). Supabase auth Site URL and redirect `https://nflinventory-weld.vercel.app/**` point there; public sign-ups are off." | `AGENTS.md:88` |
| 2.5 | Live probe today: `curl -s -o /dev/null -w "%{http_code}" --max-time 15 https://nflinventory-weld.vercel.app/login` → **200**. | curl, 2026-11-23 |

`git log --oneline -- docs/HANDOFF.md` shows three commits after the researcher's cited tip
(`1769823`): `ded0099` (S11 eBay), `27f303b` (Price field, the one that records the URL),
`246828e` (merge policy). R1 explicitly claimed "the latest HANDOFF commit is 1769823
(2026-11-21 20:33 UTC); nothing has touched it since" (R1 §1.3) — that is no longer true at
HEAD `ad3b355`.

**Evidence that would settle this objection against me:** a git revert that removed lines
17 and 34/88 from their files (none exists), or a 4xx/5xx on the live URL today (got 200).
Neither holds. The objection stands.

## 2. Objection — DoD item 6 has in fact been executed (not just *can* run)

**Strength: moderate.** R1 §1.7 asserts "DoD item 6 has never been executed, not even once,
on any story" because the 2026-11-21 HANDOFF entry says screens were never seen in a browser.
But the 2026-11-23 "Agents ship their own work" entry records a Vercel status `success` check
on a10b841, and the new Shipping section in AGENTS.md mandates a smoke check of `/login` as
part of every merge. That is the *procedural* half of item 6 (load the deployed preview).

What I cannot show from the sources is a recorded desktop-and-375px visual pass with empty /
loading / error states checked. So item 6's full visual matrix is still undocumented — but
that is a different, narrower gap than "cannot run".

**Evidence that would settle:** a HANDOFF entry from any agent with screenshots or a
checklist naming desktop + 375 px + empty/loading/error on a named story. Absent that, the
honest restatement is "item 6 is partially evidenced (URL live, smoke check passing) but the
visual pass is not yet recorded" — not "item 6 cannot run".

## 3. Objection — the researcher's "explicit gaps" section is now the answer

R1 §4 listed as unknowable: "Whether a live deployment exists in Dennis's Vercel account."
That gap closed the same day: Dennis supplied the URL, in writing, in the very file R1 was
grepping. The falsifier's Branch A ("Dennis supplies the URL") has fired. By the claim's own
settling rule, this claim is **resolved**, not open.

**Strength: strong** — this is not a new argument, it is the claim's own falsifier triggering.

**Evidence that would settle against me:** none possible without time travel; the URL string
is on disk and the endpoint returns 200.

## 4. What I CONCEDE

Per the challenger commitments, the parts of R1 that hold and that I do not dispute:

- **Conceded (strong):** R1's history of HANDOFF up to and including commit `1769823` is
  accurate. At the 2026-11-21 baseline, no URL was recorded, and the only `vercel.app` hit in
  the tree was the unrelated "Noman Fabrics Smart Inventory" project. R1 §1.1–1.6 describe
  that baseline correctly.
- **Conceded (strong):** `nflinventory.vercel.app` (the bare subdomain) is still an unrelated
  third-party project; R1 §1.6 stands. The real URL carries the `-weld` suffix, which no
  amount of hostname guessing would have found — R1 §6 was right to decline enumeration.
- **Conceded (moderate):** No *visual* pass at desktop and 375 px covering empty / loading /
  error states is recorded in HANDOFF for any story. Item 6's full checklist has not been
  evidenced end-to-end. If the claim were reworded "visual pass not yet recorded", it would
  be open and legitimate.
- **Conceded (weak, procedural):** R1's method note about anchoring to commit `5c2f0ae` was
  reasonable for reproducibility; the miss is a consequence of running against a snapshot
  rather than HEAD, which is a process risk worth flagging in `bin/sync` (rounds should pin
  to a fresh `git pull`), not a research-integrity failure.

## 5. Recommended verdict path

The claim as written — "Deployment URL not recorded; DoD item 6 cannot run" — is **false at
HEAD** and its own falsifier has fired via Branch A. The adjudicator should either:

1. Mark C007 **settled / falsified** with the evidence in §1 (HANDOFF.md:17, AGENTS.md:34+88,
   curl 200 today), or
2. **Drift** it to a narrower successor claim: "DoD item 6 visual pass (desktop + 375 px +
   empty/loading/error) not yet recorded for any story" — which would be open and would route
   to a one-line HANDOFF template amendment rather than to Dennis.

Option (1) is the cleaner reading of the falsifier; option (2) preserves the useful residual
concern without overstating it. I lean (1) with a note in HANDOFF that future story agents
must record the visual pass explicitly when they merge.

## 6. Source-interest flags

- All citations are first-party (this repo's files at HEAD, git history, one curl to the
  project's own live URL). No third-party or commercial source touched.
- The probed URL is the project's own deployment per AGENTS.md; probing `/login` is the smoke
  check the repo itself mandates, so no external interest is implicated.
