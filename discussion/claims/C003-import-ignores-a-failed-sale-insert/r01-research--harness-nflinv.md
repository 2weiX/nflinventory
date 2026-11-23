---
claim: C003-import-ignores-a-failed-sale-insert
round: 1
role: researcher
model: z-ai/glm-5.3-flash
harness: hermes (Ultron on Dennis's Linux harness)
date: 2026-11-23
---

# R1 research: import ignores a failed sale insert

Method: traced the import write path for sold rows and every place a sale insert error
could surface, on the harness, on 2026-11-23 (CET). Population for every figure below =
this repo's source tree at commit `8f6fd5b` on `main` (`git log -1 --format='%H %cI'`:
2026-11-23T04:01:01+01:00). Every citation is a file+line I re-read today or a shell command
I re-ran today. The live Supabase project was deliberately not touched (discussion agents
never touch it, per AGENTS.md); that gap is stated in section 4. Prior rounds on this claim:
none (claim.md round: 0, no round files existed when I started).

## 1. The claim, step by step

| # | Fact | Population / sample | Source |
|---|---|---|---|
| 1.1 | Sold rows import as two independent network calls in sequence, not one transaction: line 126 inserts the card (`supabase.from("cards").insert({...}).select("id").single()`), line 128 then inserts the sale (`supabase.from("sales").insert({ card_id: c.id, channel: "other", price_cents: ... })`) | 1 code path, the only importer in the app (`grep -rn rpc app/ lib/` = 0 hits, so no transaction-wrap RPC anywhere) | app/import/page.tsx:124-130, read 2026-11-23; `grep -rn rpc app/ lib/` run 2026-11-23 |
| 1.2 | A card insert is auto-committed on its own: the PostgREST call at line 126 completes before the sale call at line 128 starts. supabase-js exposes no transaction API, and the repo uses none | 1 client library in use (`@supabase/supabase-js`, package.json) | app/import/page.tsx:126-128; package.json, read 2026-11-23 |
| 1.3 | The sale insert's error is discarded: `const s = await supabase.from("sales").insert(...); if (!s.error) sales++;` — `s.error` is read exactly once, as a boolean success counter. It is never passed to `setErr`, never logged, and the loop continues to the next row | 1 of 1 sale-insert call sites in the import path | app/import/page.tsx:128-129, read 2026-11-23 |
| 1.4 | The card row's draft already carries `status: "sold"` before any network call: `if (sale) card.status = "sold"` (lib/importer.ts:279). So a card whose sale insert later fails is still committed with status `sold` and zero sales rows | 1 parse path, tested at parse level only (lib/importer.test.ts:123-129 asserts the draft shape; 9 tests in the file, `grep -rn supabase lib/*.test.ts` = 0 hits, no test mocks a failing sale insert) | lib/importer.ts:277-279; lib/importer.test.ts, read 2026-11-23 |
| 1.5 | The success banner cannot reveal the loss: `setDone({ batchId, cards: good.length, sales })` (line 132) and the banner prints "Imported N cards and M sales" (lines 166-168). A failed sale insert shows up, at most, as a smaller M with no warning, no comparison against the expected sale count, and no indication of which card lost its sale | 1 UI surface | app/import/page.tsx:132, 166-168, read 2026-11-23 |
| 1.6 | Schema cannot deterministically reject these sale rows at parse time: `sales` requires `channel` (not null, enum — code supplies `"other"`), `price_cents not null` (sale only exists when `soldPrice !== null`, so parseCents guaranteed non-null), `sold_at` defaults to `current_date` when omitted (code omits it when parseDate is null) | 1 of 1 migrations in the repo | supabase/migrations/0001_init.sql:82-93; lib/importer.ts:277-278, read 2026-11-23 |
| 1.7 | RLS would not block a normal import: `create policy "own rows" on sales for all to authenticated ... with check ((select auth.uid()) = user_id)` — same policy shape as cards, so card insert succeeding implies the session is authenticated with a valid user_id | 1 policy on sales | supabase/migrations/0001_init.sql:136-137, read 2026-11-23 |

Chain, assembled from 1.1 + 1.2 + 1.3 + 1.4: for every imported row with sale data, the card
is committed first (1.2) and marked `sold` (1.4); the sale insert is a second, independent
call (1.1); if that call fails for any runtime reason (transient network/5xx, expired auth,
statement timeout, RLS denial), `s.error` is swallowed (1.3), the loop continues, and the batch
reports success (1.5). Result: a committed card with `status = 'sold'` and no sales row —
exactly the failure state the claim names.

## 2. What "explicit failure surfacing" would require, and what exists

The falsifier says the claim is falsified by a transaction wrap or explicit failure surfacing.

- **Transaction wrap: absent.** `grep -rn rpc app/ lib/` returns zero hits (1.1); supabase-js
  has no client-side transaction API (1.2). Nothing in the tree makes card+sale atomic.
- **Explicit failure surfacing: absent.** The sale error is never shown, never logged, never
  compared against the expected count (1.3, 1.5). Contrast: the *card* insert path does surface
  its error via `setErr` (lines 122, 127) — the asymmetry is inside the same loop, three lines
  apart. This reads as an oversight, not a design choice; either way the claim's failure state
  is reachable and silent.
- **Adjacent finding, same class (not the claim):** the manual card editor has the same shape —
  setting status `sold` from the card page does not force a sale record
  (app/cards/[id]/page.tsx:191, 209). A verdict can decide whether that path joins the same fix
  or stays separate. I record it here only so it is not lost.

## 3. Verdict-relevant readings of the falsifier

Falsifier: "A sold card may exist without its sale record if the sale insert fails after the
card insert; falsified by a transaction wrap or explicit failure surfacing."

- Sold card without sale record possible: **yes** (1.1-1.5; deterministic structure, no guard
  anywhere in the tree).
- Transaction wrap exists: **no** (1.1, 1.2, section 2).
- Explicit failure surfacing exists: **no** (1.3, 1.5).
- Claim stands on the code evidence as of 2026-11-23. Not falsified.

## 4. Explicit gaps (not papered over)

- **Live database schema not verified.** I confirmed the constraints and RLS in the repo's
  single migration, not on the running Supabase project (`ngxfvhlbrhlqarpwavcf`). Per the
  Supabase rule I did not query it. If live RLS on sales were stricter than 1.7, failures
  would be more frequent, not less — the claim is not weakened either way.
- **No runtime reproduction.** I did not execute an import against real data (the repo's rule:
  never touch real data). The evidence is the code path, which is deterministic about the
  structure; a live demo would only re-prove it.
- **Failure rate unmeasured.** How often the sale insert actually fails in practice is unknown
  to me — there are no client-side error logs for me to read. This round proves the possibility
  and the silence around it, not the frequency. Whatever the rate, the fix decision (transaction
  wrap via RPC, or surface the error and reconcile) is the same.
- **"Why it matters" is still TODO on claim.md** — which decision depends on this claim is not
  recorded. The verdict will need to name it (most plausibly: S-story for import atomicity or
  error surfacing).
- **Row counts at risk unmeasured.** How many sold cards sit on imported batches, and how many
  already have status `sold` with no sales row on Dennis's live data, is unknown to me (no live
  query). A reconciliation query would settle the existing-damage question; that is a
  story-agent or Dennis task, not this round.

## 5. Source-interest flags

- Every citation is first-party code in this repo, reproducible from commit `8f6fd5b`; no
  commercial interest in the answer.
- No third-party, market, vendor or pricing source was used. Nothing in this round has a
  commercial interest in whether the claim stands.
