---
claim: C002-import-undo-cascades-into-sales
round: 1
role: researcher
model: z-ai/glm-5.3-flash
harness: hermes (Ultron on Dennis's Linux harness)
date: 2026-11-23
---

# R1 research: import undo cascades into sales

Method: traced the undo code path and the foreign keys it touches, on the harness, on 2026-11-23
(CET). Population for every figure below = this repo's source tree at commit `5e202cb` on `main`
(`git log -1`: 2026-11-22 17:40:34 +0100). Every citation is a file+line I re-read today or a git
command output I re-ran today. The live Supabase project was deliberately not touched
(discussion agents never touch it, per AGENTS.md); that gap is stated in section 4.

## 1. The claim, step by step

| # | Fact | Population / sample | Source |
|---|---|---|---|
| 1.1 | Undo is the only delete path for imported cards: `undo(batchId)` runs `supabase.from("cards").delete().eq("import_batch_id", batchId)` then deletes the batch row | 1 code path (app/import/page.tsx:136-142), called from 2 places: the just-imported banner (line 170) and every row of "Past imports" (line 269) | app/import/page.tsx, read 2026-11-23 |
| 1.2 | The confirm dialog says exactly: "Delete every card from this import? Cards you edited since will be deleted too. This can't be undone." It mentions edited cards. The words "sale", "sales", "listing" appear nowhere in the dialog or anywhere else on the import page | 1 string, 277-line file | app/import/page.tsx:137, `grep -in "sale" app/import/page.tsx` (only hits: the import-time sales counter, not the dialog), 2026-11-23 |
| 1.3 | `sales.card_id uuid not null references cards(id) on delete cascade` — deleting a card deletes its sales rows, enforced by Postgres, not by app code | 1 of 1 migrations in the repo (`ls supabase/migrations/` = `0001_init.sql` only) | supabase/migrations/0001_init.sql:85, read 2026-11-23 |
| 1.4 | The app never deletes sales rows directly: `git grep 'from("sales")'` hits only select (cards/[id]/page.tsx:40, sales/page.tsx:26) and insert (cards/[id]:204, import:128). So the only way sales vanish is the cascade in 1.3 | whole app/ + lib/ trees at 5e202cb | git grep output, 2026-11-23 |
| 1.5 | Both facts are original v1 code and unchanged since: `git log --follow -- app/import/page.tsx` = one commit `f209a9d` ("NFL Inventory v1"); no later migration alters the FK (`git log` on supabase/migrations = f209a9d only) | full history to 5e202cb (2026-11-22) | git log outputs, 2026-11-23 |

Chain, assembled from 1.1 + 1.3: undo(batchId) issues `DELETE FROM cards WHERE import_batch_id = $1`;
for every deleted card that has a sales row, Postgres deletes that sales row via the cascade. The
app code contains no guard, no pre-count of affected sales, and no warning text.

## 2. What the confirm dialog warns about vs what actually dies

Dialog mentions (line 137): cards from the batch, cards edited since the batch, irreversibility.
Dialog does not mention:

- **Sales.** Any card from the batch whose status later became `sold` carries sales rows; those
  rows are deleted with it (1.3). Undoing an import days or months later erases the recorded
  sale and, with it, the profit history — `card_profit` (0001_init.sql:97-109) joins cards to
  sales, so both sides of the row disappear from the sales & profit screen.
- **Listings** (adjacent finding, same class): `listings.card_id … on delete cascade`
  (0001_init.sql:70). Undo also silently deletes every listing row for the batch's cards,
  including `external_id` references that matter once S11/S12 exist. The claim's falsifier only
  names sales; I record the listings cascade here so a verdict can decide whether it joins the
  same fix or gets its own claim.
- A same-day special case: the import itself creates card+sale pairs for rows with sale data
  (import/page.tsx:124-129). Undoing a fresh import destroys sales it just created, with no edit
  by anyone in between. So the dialog's framing ("cards you edited since") understates even the
  immediate case.

## 3. Verdict-relevant readings of the falsifier

Falsifier: "falsified if undo no longer deletes sales or the dialog warns."

- Undo deletes sales: **yes, still true** (1.1 + 1.3 + 1.5; nothing in the tree overrides the FK,
  no trigger, no later migration).
- The dialog warns about sales: **no** (1.2).
- Claim stands on the code evidence as of 2026-11-23. Not falsified.

## 4. Explicit gaps (not papered over)

- **Live database schema not verified.** I confirmed the cascade in the repo's single migration,
  not on the running Supabase project (`ngxfvhlbrhlqarpwavcf`). Per the Supabase rule I did not
  query it, and I found no recorded check that the live schema matches `0001_init.sql`. If the
  live FK were not `on delete cascade`, undo would fail differently (FK violation) rather than
  destroy sales. Settling this needs a story-agent rolled-back-transaction test or Dennis's
  dashboard, not this round.
- **No runtime reproduction.** I did not execute undo against real data (the repo's own rule:
  never delete real data; a discussion agent must not either). The evidence is the code path plus
  the DB-enforced FK, which is deterministic; a live demo would add nothing except the live-schema
  check above.
- **Row counts at risk unmeasured.** How many sales rows currently sit on batch-imported cards is
  unknown to me (no live query). The blast radius claim ("a wrong click can lose profit history")
  is proven structurally; its size on Dennis's data is not measured.

## 5. Source-interest flags

- Every citation is first-party code in this repo, reproducible from commit `5e202cb`; no
  commercial interest in the answer.
- No third-party, market, vendor or pricing source was used. Nothing in this round has a
  commercial interest in whether the claim stands.
