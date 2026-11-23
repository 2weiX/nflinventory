---
claim: C005-cold-start-build-fails-opaque-without-en
round: 2
role: challenger
model: moonshotai/kimi-k3.1-pro:free
harness: hermes (nflinv overnight loop on Dennis's Linux harness)
date: 2026-11-23
---

# R2 challenge: cold-start build fails opaque without env vars

I argue AGAINST the claim as written. The claim has three load-bearing words —
"fails", "opaque", and the implicit "this is a real defect worth a story" — and
r01's own empirical runs undercut two of them outright and relegate the third to
an undocumented edge case. I cite r01 (model `z-ai/glm-5.3-flash`) as the
controlling source throughout; I do not re-run its research. I do not dispute
any command output it captured. Population = r01's runs A-E at commit `909de5d`.

## 1. Concessions (what I cannot dispute)

These are facts r01 established empirically that I accept without reservation:

- **C1.** `lib/supabase.ts:6-8` throws at module scope when either
  `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is empty
  or unset. Module-scope, deterministic. (r01 §1.1.)
- **C2.** All four Supabase-touching pages import the client at module scope and
  are `"use client"`, so the throw fires during prerender, not lazily on first
  request. (r01 §1.2.)
- **C3.** Run A: bare `npm run build` with no `.env*` and no shell vars exits 1
  during "Generating static pages", after a green "Compiled successfully". The
  build does fail. (r01 §2, run A.)
- **C4.** Run D: bare `npm run dev` with no env serves HTTP 500 on `/`. (r01 §2,
  run D.)
- **C5.** The thrown message text is exactly:
  `Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (see .env.example)`,
  with a source-mapped stack to `lib/supabase.ts:7`. (r01 §2 run A.)

I am not going to pretend the build "doesn't really fail" — it does, in run A.
My objections are about what that failure *means* for the claim.

## 2. Objections to the claim

### O1 — "Opaque" is false by the claim's own evidence. **STRONG.**

The claim's title is "Cold-start build fails **opaque** without env vars." R01 §3
(second bullet) already concedes this is FALSE, and the run logs back it: the
error names both missing variables verbatim, names the exact file to copy
(`.env.example`), and lands at a source-mapped `lib/supabase.ts:7`. That is the
opposite of opaque — it is a self-describing, actionable error. The only blemish
r01 could find is *ordering*: the message arrives after "Compiled successfully",
so a skimming reader sees green first. That is a cosmetic sequencing nit, not
opacity. A developer who reads to the bottom of their own failed build has the
full fix in front of them.

- **What would settle it:** quote the exact stderr of run A end-to-end. If the
  final error block names both vars and `.env.example` (r01 says it does),
  "opaque" is settled false. If someone can produce a run where the vars are
  *not* named, "opaque" survives — r01 found no such run.

### O2 — The falsifier is already satisfied: the documented build path succeeds. **STRONG.**

The claim's own falsifier reads: "falsified if the documented build path
succeeds." R01 §3 (third bullet) shows the documented path succeeds three ways:

1. **README local path** (run B): `cp .env.example .env.local` — README's literal
   step 1 — leaves both vars non-empty (the placeholder `sb_publishable_...`
   counts), and `npm run build` exits 0 with all 7 routes prerendered.
2. **README Vercel path**: README.md:24-27 has the deployer set both vars in the
   Vercel dashboard *before* the first deploy.
3. **The loop agents actually run** (run C): AGENTS.md turn-start is
   `npm install, npm test, npm run typecheck` — no build — and run C shows
   typecheck and tests pass with zero env at all.

By the claim's own stated success condition, it is falsified. The only way the
failure reproduces (run A) is by performing an action no document instructs:
running bare `next build` while skipping README step 1. You cannot both define
the falsifier as "documented path succeeds" and then point at an *undocumented*
path as the counterexample.

- **What would settle it:** show a command that README.md or AGENTS.md actually
  instructs a cold-start user to run, with no env, that exits non-zero. R01 found
  none — README never says `npm run build`, and the turn-start trio passes
  env-less. If such a documented command exists, O2 falls; r01's reading of
  README.md:33-40 and AGENTS.md:9-11 says it does not.

### O3 — "Needs a lazy client" is the wrong fix and would regress the failure mode. **MODERATE.**

The claim offers two remedies: "README note or a lazy client." The lazy-client
option is strictly worse. Today the throw is *fail-fast at build time* — the
developer learns about missing env before deploying. A lazy client defers the
throw to first request, converting a build-time error into a runtime 500 in
production (exactly run D's behavior, but now shipped). That trades a cheap,
caught-early failure for an expensive, caught-by-users one. R01 §3 (residual
kernel) reaches the same conclusion: "the lazy-client alternative would defer the
throw to first request and fixes no observed failure." The README note is the
only remedy that isn't a regression — and it's a one-liner, which barely clears
the bar for a story.

- **What would settle it:** a demonstration that build-time throwing causes a
  *worse* outcome than request-time throwing in some real workflow (e.g. it
  breaks a legitimate env-injected-at-runtime deploy target). R01 documents no
  such target; Vercel injects at build. Absent that, lazy-client is settled as
  the inferior fix.

### O4 — The reachable failure is undocumented and unmeasured; "why it matters" is literally TODO. **MODERATE.**

Two red flags that this claim is not decision-ready:

1. `claim.md` line 19: `## Why it matters — TODO - which decision depends on
   this.` The claim cannot name the decision it informs. Per AGENTS.md the whole
   point of the loop is "arguing about what the stories should be" — a claim with
   a TODO where its deciding story goes is arguing in a vacuum.
2. R01 §4 gap 5: "How often anyone hits the no-env scenario is unmeasured. It
   requires a command no doc tells you to run." So the defect fires only on an
   undocumented action, at an unknown (plausibly near-zero) frequency.

A real, frequent, documented-path breakage would deserve urgency. An
undocumented, unmeasured, self-describing error on a path nobody is told to walk
does not — at most it deserves the one-line README note.

- **What would settle it:** (a) fill in `decides:` with a concrete story ID, and
  (b) any signal on hit-frequency — a contributor report, a CI log, a Vercel
  failed-deploy trace. With both, O4 weakens; with neither, the claim is a
  documentation nit wearing a defect's title.

### O5 — The residual true kernel is real but tiny, and is a docs fix, not a code fix. **WEAK (as an objection to the kernel; strong that it's minor).**

I concede (C3) that run A fails. The honest residual claim is narrow: "an
undocumented `next build` with no env fails at prerender with a clear message."
That is true and worth a single README line under "Develop locally" — r01 §3
suggests exactly this wording. But it is not "build fails opaque," and it does
not warrant the lazy-client half of the remedy. I flag this only to mark the
boundary: the claim as *titled* overstates a true-but-minor docs gap.

- **What would settle it:** whether the verdict scopes the fix to a README line
  (kernel survives, title dies) or to a code change (over-engineering). That is
  the adjudicator's scoping call, not a factual dispute.

## 3. Where this leaves the claim

- The mechanism (C1-C5): **conceded, true.**
- "Fails **opaque**": **false** (O1, strong) — the error is explicit and actionable.
- Falsifier "documented build path succeeds": **satisfied, claim falsified as
  written** (O2, strong) — runs B, C, and the Vercel path all succeed.
- "Needs a lazy client": **wrong remedy** (O3, moderate) — would regress
  build-time safety to runtime 500s.
- Decision-readiness: **not ready** (O4, moderate) — `decides:` is TODO and
  hit-frequency is unmeasured.

**Net:** the claim should not stand as titled. The defensible residue is a
one-line README note documenting that `npm run build` needs the two `.env.example`
vars — a trivial docs fix. The "opaque" framing and the lazy-client remedy should
be rejected. I would not spend a story on a code change here; at most a docs
touch-up, and only once `decides:` names a story that actually needs it.

## 4. Source-interest flags

All evidence is r01's first-party code, docs, and command output at commit
`909de5d`. No vendor docs, market data, or third-party source is relied on. No
commercial interest in the outcome. I did not touch the live Supabase project,
`.env*` secrets, app code, `docs/STORIES.md`, or the database (Supabase rule and
two-trees rule, AGENTS.md). My only write is this round file.
