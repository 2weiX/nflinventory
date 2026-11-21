# Agent protocol

You are one of several agents working on this repository, probably from a different machine than the
others, probably not at the same time. This file is the whole coordination mechanism. There is no server,
no queue and no orchestrator — just git, a directory convention, and the rules below.

Read this file, run `bin/next`, do the one task it gives you, write one file, run `bin/sync`. That is a round.

## The hard rule: two trees, never mixed

| Tree | Holds | Who writes it |
|---|---|---|
| `discussion/` | claims, evidence, challenges, verdicts, decisions | discussion agents |
| app code (`app/`, `components/`, `lib/`, `supabase/`) | the inventory application | code agents, via claims that decide it |

A discussion agent never edits app code. A code change follows only from a claim that reached a verdict
pointing at it. This separation is what lets three models argue about what to build without any of them
silently building the thing they argued for.

## The round

1. `bin/next` — hands you one task: research a claim, challenge it, adjudicate it, or survey.
2. Do exactly that task. Write exactly one file under `discussion/`.
3. `bin/sync` — stages, runs the independence gate (`bin/gate-independence`: no challenger or
   adjudicator round whose model already appears earlier on the same claim), commits, pushes.
   Fail-closed: if the gate refuses, the round does not enter the tree.

## Independence (required)

`discussion/roster` declares the role → command → model map. A challenger must not share a model with the
researcher it challenges; an adjudicator must not share one with either. A round whose attribution names a
model already on the claim is refused, not re-tried with a better story. The round frontmatter's `model:`
field is binding — the dispatching adapter writes it, the agent never edits it.

## Cost posture

This repo runs overnight at minimal cost. The roster's seats: research/proposal on GLM-5.3-flash
(pennies), challenge on numes' $0 `:free` tier, adjudication on the Claude subscription (no metering).
Paid OpenRouter models are not on this roster. The challenger seat must always point at a `:free` id —
numes moved its free tier behind a suffix once already; re-check the catalog on every swap.

## The Supabase rule

The app's live database (the `nflinventory` Supabase project) holds real personal inventory data.
Discussion agents NEVER touch it. Schema changes happen as migration files in `supabase/migrations/`,
proposed in a claim, applied by the owner (or a code agent under a decided claim) — never by a
discussion agent, never from a discussion round. No Supabase credentials belong in this repo or in
agent prompts.

## Conventions

- Claim ids: `C001`, `C002`, ... (`bin/claim "title" "falsifier"` scaffolds one).
- Round files: `discussion/claims/<id>/r<N>-<role>.md` with binding frontmatter
  (`model:`, `role:`). The adapter writes `model:`; tampering with it is the one sin the gate exists to catch.
- One owner per file: a round file is written once by the agent that dispatched it and never edited again.
- The overnight loop (`bin/overnight`) stops on IDLE, on budget, or on a sync failure — never spins.
  A round that produces no file stops the circle before sync; no housekeeping commits.
