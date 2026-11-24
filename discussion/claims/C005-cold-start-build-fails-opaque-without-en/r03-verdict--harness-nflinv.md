---
claim: C005-cold-start-build-fails-opaque-without-en
round: 3
role: adjudicator
model: claude-sonnet-5-5
harness: claude-code (nflinv overnight loop on Dennis's Linux harness)
date: 2026-11-24
verdict: weakened
confidence: medium
---

# R3 verdict: cold-start build fails opaque without env vars

**Verdict: weakened.** The mechanism is true; "opaque" is refuted; the falsifier's
success condition is met by every documented path; a small docs gap survives.

Independence: r01 = `z-ai/glm-5.3-flash`, r02 = `moonshotai/kimi-k3.1-pro:free`, me =
`claude-sonnet-5-5`. All three differ, and r02 (the round directly before) is not my
model, so the gate rule holds. r02 is an independent challenger of r01, so I weight it
normally, not as a same-model echo. I did not re-run the build; see "What I checked".

## What I checked (first-hand, 2026-11-24, HEAD `5a72033`)

- `lib/supabase.ts:6-8`: module-scope `throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (see .env.example)")` when either value is falsy. Matches r01 §1.1 and r02 C1/C5.
- `README.md` (47 lines): Vercel path lines 24-27 sets both vars before Deploy; "Develop locally" lines 35-40 is `cp .env.example .env.local`, `npm install`, `npm run dev`, `npm test`. `npm run build` is not mentioned. Matches r01 §1.3.
- `package.json` scripts: `build`=`next build`, `test`, `typecheck` exist; `.env.example` holds the two vars with a placeholder key.
- `lib/supabase.ts`, `README.md` and `package.json` show no change since r01's commit `909de5d` in this check (the diff stat against `909de5d` was empty).
- I could not independently confirm "no `.github/`": in this sandbox `.github` is a character device (`/dev/null` mask), so `ls` tells me nothing either way. r01's claim of no CI is unverified by me; it does not affect the verdict, because Vercel, not CI, is the documented build.
- Not re-run: r01's runs A-E (build exit 1 / 0, dev 500 / 200). I rely on them as r02 does; r02 disputes none of them. Treat those figures as one researcher's single observation each (n=1 per run, one machine, one Node/Next version), as r01 itself says.

## Recomputing r02

r02 contains no numbers beyond r01's, so there is no arithmetic to correct. I checked its directional claims instead:

- **O1 "opaque" is false: upheld.** The message names both variables and `.env.example`. r01 and r02 agree, and the source confirms the text. The only blemish is that it prints after a green "Compiled successfully" line; that is ordering, not opacity.
- **O2 "falsifier already satisfied": upheld with a limit.** The falsifier says "falsified if the documented build path succeeds." The documented builds are the Vercel deploy (vars set first, README:24-27) and the local `cp .env.example .env.local` (non-empty placeholder passes the `!url || !key` check, r01 run B). Neither hits the throw. r02 is slightly too strong in saying the claim is "falsified as written": the first half of the claim (throws at import without the vars) is true and was conceded by both. What is falsified is the defect framing, not the mechanism.
- **O3 "lazy client would regress to runtime failure": right direction, wrong reason.** r02 says Vercel "injects at build, so runtime injection is not a legitimate target", and frames the cost as a production 500. For `NEXT_PUBLIC_*` values Next inlines them into the client bundle at build time, so a lazy client in a build without the vars would still see `undefined` in the browser forever. The failure would move from the build log to every user's browser. That strengthens r02's conclusion, but through a different mechanism than the one it gave. This is from my knowledge of Next's env inlining, not a run in this repo, so I label it reasoned, not observed.
- **O4 "not decision-ready" (`decides:` empty, "Why it matters" is TODO): upheld as a fact about the claim file** (checked in `claim.md`). Hit frequency is unmeasured (r01 gap 5) and nobody has measured it since.
- **O5 "residual kernel is a docs fix": upheld.**

## Where both sides were wrong or incomplete

- **The claim** overstated: "opaque" is wrong, and "needs a lazy client" is the wrong remedy.
- **r01** correctly refuted "opaque" but left the remedy to the verdict and did not note that the lazy client also fails in the browser (see O3 above). Its "no `.github/`" is unconfirmed by me, as above.
- **r02** over-stated "falsified as written" (see O2) and gave the wrong reason on O3.
- **This repo has not acted on the claim**: README is unchanged and no code was altered, so there is no prior action to contradict.

## Unresolved, labelled

- **Placeholder-key trap (r01 §3, gap 2).** The documented `cp .env.example .env.local` with the key unfilled builds and serves but would fail at the first real Supabase call. r01 did not observe that failure (no live request, per the Supabase rule) and I did not either. Whether it deserves a note is open; it is a different claim from C005, so I do not decide it here.
- **Whether anyone hits bare `next build` without env** is unmeasured. No data on either side.

## Outcome for the story tree (proposal only; discussion agents do not edit `docs/STORIES.md`)

Keep the throw as is (fail-fast at build, with a good message). If a story agent wants to close the gap, the whole fix is one README line under "Develop locally", for example: "`npm run build` also needs the two variables from `.env.example`". No lazy client. It is a docs touch-up, not a story on its own; fold it into the next story that touches README.

## Source-interest flags

All evidence is first-party (repo files and r01's reproduced command output). No vendor or commercial source was relied on. The Next env-inlining point is my own background knowledge and is marked as such. I did not touch the database, `.env*`, app code or `docs/STORIES.md`; my only writes are this file and the `claim.md` frontmatter.
