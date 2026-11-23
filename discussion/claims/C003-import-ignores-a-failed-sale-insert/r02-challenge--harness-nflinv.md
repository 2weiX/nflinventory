---
claim: C003-import-ignores-a-failed-sale-insert
round: 2
role: challenger
model: moonshotai/kimi-k3.1-pro:free
harness: opencode (nflinv, on Dennis's Linux harness)
date: 2026-11-23
---

# R2 challenge: import ignores a failed sale insert

Task brief: argue AGAINST the claim as hard as the sources in r01 allow. I have read r01
end-to-end and re-read the cited lines (`app/import/page.tsx`, `lib/importer.ts`,
`supabase/migrations/0001_init.sql`, `app/cards/[id]/page.tsx`) before writing. I did not
re-run r01's greps, did not touch Supabase, and did not run the importer. Population =
same tree as r01 (commit `8f6fd5b` on `main`), so all line numbers below line up with r01.

## 0. Concessions up front (commitment 1)

These I cannot dispute on the evidence r01 produced. I am listing them so the reader
knows exactly which parts of the claim the rest of this round does **not** attack:

- **C1.** `app/import/page.tsx:124-130` really does fire two independent PostgREST calls
  in sequence — card insert at 126, sale insert at 128. There is no `rpc(` call, no
  client-side transaction, no `BEGIN`/`COMMIT`. The two writes are not atomic.
- **C2.** `lib/importer.ts:277-279` really does set `status: "sold"` on the card draft
  before any network call, so the card row that lands on the first insert already says
  `sold` regardless of what happens to the sale insert.
- **C3.** `app/import/page.tsx:128-129` really does read `s.error` only as a truthy
  counter (`if (!s.error) sales++`). The error object is never `setErr`'d, never logged,
  never compared against an expected count.
- **C4.** The banner (`app/import/page.tsx:132, 166-168`) prints `cards: good.length,
  sales` with no reconciliation. A user cannot see from the UI which card lost its sale.
- **C5.** There is no unit or integration test that exercises a failing sale insert
  (r01 §1.4: `grep -rn supabase lib/*.test.ts` = 0 hits). The parse layer is tested;
  the write layer is not.
- **C6.** supabase-js exposes no client-side transaction API. There is no in-library
  escape hatch the code could be using that r01 missed.

Given C1-C6, the structural failure mode the claim names — a card committed `sold` with
no corresponding `sales` row, with no signal to the operator — is **reachable** in this
code. I do not dispute reachability. The objections below attack the *strength* of the
claim as a driver of action, not its bare existence.

## 1. Objections, rated (commitment 2)

### O1 (WEAK) — "Explicit failure surfacing" is defined too narrowly

The falsifier says the claim is falsified by "a transaction wrap **or** explicit failure
surfacing." r01 §2 takes "surfacing" to mean a UI-level or log-level signal. That is one
reading. Another reading, which the code arguably already satisfies: the PostgREST error
object **is** returned to the caller; it is stored in `s.error`; the `sales` counter
**is** lower than `good.length` whenever a sale insert fails. A user looking at the
banner who expected N sales and sees M < N has *a* signal — weak, non-specific, and easy
to miss, but not literally zero.

I rate this **weak** because (a) the code does not compute or display the expected
count, so the user has to hold it in their head; (b) there is no per-row attribution;
(c) C3 stands — the error object is never shown. This is a real gap, not a defence.
But the falsifier's "explicit failure surfacing" phrasing is doing load-bearing work:
if it means "any observable difference," the claim is closer to falsified than r01
suggests; if it means "an actionable, attributed error," r01 is correct.

**Settle it with:** a one-line verdict decision on what "explicit failure surfacing"
means in the falsifier — must the error be attributed to a specific card row, or is a
visible count mismatch sufficient? Until that is pinned, "the claim is falsified by
existing surfacing" and "no surfacing exists" are both defensible readings.

### O2 (WEAK) — Failure probability is unmeasured, so "ignores" overstates intent

r01 §4 concedes the failure rate is unmeasured. The claim's *title* says "import
**ignores** a failed sale insert." The code does ignore the error (C3). But the falsifier
is "a sold card **may** exist without its sale record." On PostgREST over Supabase with
the schema in `0001_init.sql:82-93` and the RLS in `0001_init.sql:136-137`, the sale
insert can fail only on: network fault, auth expiry mid-loop, statement timeout, RLS
denial, or a `price_cents`/`channel` constraint violation. r01 §1.6 shows the parse layer
already guarantees `price_cents` non-null when a sale exists, and §1.7 shows the RLS
policy is the same shape as on `cards` — so a card insert that just succeeded implies
the sale insert's RLS check would also pass on the same session.

The residual failure surface is therefore: transient network fault between two calls
that fire within milliseconds of each other, or an auth token that expires in that
same window. Both are rare. The claim is **reachable but low-frequency** on the
evidence presented. That matters for prioritisation even though it does not falsify.

I rate this **weak** because reachability is the falsifier's bar, not frequency — and
r01 is careful to claim only possibility.

**Settle it with:** one live reconciliation query by a story agent (never by a
discussion agent — AGENTS.md Supabase rule): `SELECT COUNT(*) FROM cards c WHERE
c.status = 'sold' AND NOT EXISTS (SELECT 1 FROM sales s WHERE s.card_id = c.id);`
If that returns 0 across Dennis's real import history, the failure mode is theoretical
on his data; if it returns > 0, the failure mode has already fired and the count is
the damage figure. Either number settles the practical stakes without weakening or
strengthening the structural claim.

### O3 (MODERATE) — "Why it matters" is still TODO; the claim has no decision attached

`claim.md:19` still reads `TODO - which decision depends on this.` r01 §4 flags this
but does not resolve it. A claim whose `decides: []` and whose `why it matters` is TODO
cannot yet drive a story, because the verdict has nowhere to land. The strongest
argument against treating this claim as load-bearing right now is not that it is wrong
— it is that it is **orphaned**. No S-story currently cites C003 as its precondition.

I rate this **moderate** because it does not attack the truth of the claim, only its
actionability — but actionability is the entire point of the loop (AGENTS.md: "A code
change follows only from a claim that reached a verdict"). A claim that reaches
"upheld" and then sits in `decides: []` produces no diff.

**Settle it with:** a one-line edit to `claim.md` filling in `why it matters` and
`decides:` with the S-story this gates (most plausibly an S-story for import atomicity
via RPC, or for import error surfacing — r01 §4 names both candidates). That is an
operator or adjudicator action, not a challenger action.

### O4 (WEAK) — The adjacent editor finding is smuggled into the claim's blast radius

r01 §2 last bullet records that the manual card editor
(`app/cards/[id]/page.tsx:191, 209`) has the same shape — status can be set to `sold`
without a sale row. That is a true observation, but it is **out of scope** for the
falsifier as written. The falsifier is specifically about the *import* path: "if the
sale insert fails after the card insert." The editor path has no sale insert to fail;
it simply never creates one. Lumping them under one claim makes the eventual fix look
bigger than the falsifier requires.

I rate this **weak** because r01 itself flags it as "adjacent finding, same class (not
the claim)" — it is honest about the scope. But the verdict should resist the
temptation to widen the fix to both paths on the strength of this claim alone.

**Settle it with:** adjudicator states explicitly in the verdict whether the editor
path is in scope. If yes, file a separate claim (C-new) for the editor; if no, the
verdict's fix scope is the importer only.

### O5 (WEAK) — The fix the falsifier implies is not the only fix, and may not be the best one

The falsifier names two acceptable falsifications: "transaction wrap or explicit
failure surfacing." r01 §4 gestures at "transaction wrap via RPC, or surface the error
and reconcile." But a third option is strictly stronger than both and cheaper than the
first: **reorder the writes** — insert the sale row first with a placeholder or a
nullable `card_id`, then insert the card, then patch the sale. Or: use a Postgres
function that takes both rows and runs them in one transaction server-side, which is
what "RPC" means but is worth naming so the implementer does not reach for a client-
side workaround. Or simplest: **check `s.error` and call `setErr` + abort the batch**
— this is a two-line change that converts silent loss into loud loss without any
schema work.

I rate this **weak** because the falsifier's "explicit failure surfacing" branch
already covers the two-line fix, so this is not a new argument — it is a note that
the *cheapest* satisfying fix is much smaller than "transaction wrap" suggests, and
the verdict should not over-specify.

**Settle it with:** adjudicator's verdict names the chosen remedy class (wrap /
surface / reorder) explicitly, rather than waving at "atomicity."

## 2. Summary

| # | Objection | Rating | What settles it |
|---|---|---|---|
| O1 | "Explicit failure surfacing" is ambiguous | weak | Verdict defines the term |
| O2 | Failure rate unmeasured; reachable but possibly rare | weak | One reconciliation COUNT on live data by a story agent |
| O3 | `why it matters` TODO, `decides: []` — claim is orphaned | moderate | Operator/adjudicator fills claim.md and names the gated story |
| O4 | Editor finding smuggled into blast radius | weak | Verdict states scope explicitly |
| O5 | Cheapest satisfying fix is a 2-line `setErr`, not a transaction wrap | weak | Verdict picks remedy class |

**Net position.** The claim as written is **structurally sound on the code evidence** —
C1-C6 are not in dispute and jointly entail the falsifier's possibility. The objections
above are all weak except O3, which is moderate and is about actionability rather than
truth. I cannot, on the sources available, argue that the claim is **false**. The
strongest honest challenge is: the claim is true but currently *unattached* (O3), the
failure rate is *unmeasured* (O2), and the *cheapest* remedy is smaller than the
falsifier's framing suggests (O5). An adjudicator weighing this round should probably
uphold the claim, attach it to a story, and prefer the minimal error-surfacing fix over
a transaction wrap — but that is the adjudicator's call, not mine.

## 3. What I did not do

- Did not re-run r01's greps or re-trace the write path — r01's citations were
  sufficient and re-verifiable from the same commit.
- Did not touch Supabase or any live data (AGENTS.md Supabase rule).
- Did not run the importer or reproduce the failure — r01 §4 already covers why a
  live repro adds nothing structural.
- Did not edit `claim.md`, `docs/STORIES.md`, or any app code (discussion-agent rule).

## 4. Source-interest flags

- All citations are first-party repo code at commit `8f6fd5b`, same population as r01.
- No commercial, vendor, or market source consulted. Nothing here has a stake in the
  verdict.
