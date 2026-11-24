---
claim: C003-import-ignores-a-failed-sale-insert
round: 3
role: adjudicator
model: claude-sonnet-5-5
harness: claude-round.sh (nflinv)
date: 2026-11-24
verdict: upheld
---

# R3 verdict: import ignores a failed sale insert

Independence: r01 = z-ai/glm-5.3-flash, r02 = moonshotai/kimi-k3.1-pro:free; I am claude-sonnet-5-5,
not on this claim before. Both earlier rounds are independent of me and of each other.
I re-read `app/import/page.tsx`, `lib/importer.ts` and `supabase/migrations/0001_init.sql` at HEAD
`4d30c8e` (r01 cited `8f6fd5b`). The import loop sits at lines ~123-130, a line or two off r01's
numbers; the code is the same. I did not touch Supabase or run the importer.

## 1. Verdict: upheld

For a row with sale data the importer inserts the card (`status: "sold"` already set by
`lib/importer.ts`), then inserts the sale as a separate call. The result is `const s = await ...; if (!s.error) sales++;`.
The error is dropped. No `rpc` exists in `app/` or `lib/` (re-run: 0 hits). Neither falsifier branch is
met (no transaction wrap, no explicit surfacing). r01 and r02 agree on this; r02 conceded C1-C6.

## 2. Challenger's points, recomputed

- **O1 (a visible count mismatch counts as surfacing): refuted, and the gap is worse than both
  rounds said.** The banner is `Imported N cards{done.sales ? " and M sales" : ""}`. When *every* sale
  insert fails, `sales === 0` and the sales clause disappears. The result looks identical to an import
  with no sales at all. A partial failure shows a smaller M, but the banner never states an expected
  count, so the user can't compare. Neither round noticed the M=0 case. That is not surfacing in any reading.
- **O2 (rare): right on direction, partly overstated.** Both rounds say the sale payload is
  schema-valid by construction. I checked: `price_cents` is non-null whenever `sale` exists; `channel` is
  the constant `"other"` (valid enum); `sold_at` is either an ISO date from `parseDate` or omitted (defaults).
  `sales` has no CHECK constraint (only `cards.comp_cents` has one, in 0002). So deterministic
  rejection is unlikely and the residual causes are transient (network, auth expiry, timeout). A large
  sheet issues one pair of sequential calls per sold row, so the exposure window grows with the
  number of sold rows. Frequency is **unmeasured by any round**; nobody has run the reconciliation
  query. Frequency affects priority, not truth.
- **O3 (orphaned claim): accepted as a process gap, not a defect in the claim.** Fixed below.
- **O4 (editor path out of scope): accepted.** The editor path never attempts a sale insert, so it
  is a different failure (a missing feature, not an ignored error). It needs its own claim if wanted.
  r01's own reading of `app/cards/[id]/page.tsx` was thin; it was not verified here either.
  (`SalesBox` does the sale insert and then a card status update, so it has its own unchecked error handling, but
  that belongs to the new claim.)
- **O5 (cheapest fix is `setErr` + abort): accepted as the recommended remedy class.** A
  `setErr` alone doesn't repair the data: the card is already committed `sold` with no sale.

## 3. Both sides, and what this repo already did

- r01 overstated nothing structurally, but its "banner shows a smaller M" understates the silence (M=0
  case). r02's O1 was wrong in leaning on a mismatch signal. Both were right on reachability.
- Neither side was wrong on the sibling path: the same loop already surfaces *card* insert errors
  (`return setErr(error.message)`), so a precedent for the fix is three lines away. That abort branch
  doesn't offer an Undo hint for the partial batch (the plain-card branch does), a smaller related gap.
  Not part of this claim.
- Interaction with C002 (settled upheld: undo cascades into sales): a sold card with no sale row is
  undoable with its batch, so the damage is recoverable by Undo + re-import, but only if the user
  knows it happened. The silence is what makes it a problem.

## 4. Unresolved / not established

- **Live damage unknown.** Whether any `cards.status = 'sold'` row has no `sales` row on Dennis's
  data is unmeasured. A story agent or Dennis can run
  `select count(*) from cards c where c.status='sold' and not exists (select 1 from sales s where s.card_id=c.id)`.
  The set also includes manually edited cards and sold-status imports without a price, so a non-zero
  count does not by itself prove a failed sale insert.
- Frequency of the transient failure is unknown (see O2).

## 5. Proposed story change (for a story agent or Dennis; I do not edit STORIES.md)

Scope: the importer only. Minimum fix: in the sale loop, count failed sale inserts and the first error
message, keep going or stop (choose one), and show a visible warning ("N of M sold rows lost their
sale: <message>") with the Undo link, including when `sales === 0`. Stronger fix, if wanted: a
Postgres function that inserts card+sale in one transaction, called via `supabase.rpc`. That is an
additive migration under AGENTS.md rules. Add a test for the counting logic in `lib/` (pure function)
since `app/import/page.tsx` has no tests.

Confidence: medium-high. The code facts are re-verified; the frequency and live-data claims are open.

## 6. Source-interest flags

All sources are first-party repo code. No vendor or market source was used.
