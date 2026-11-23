---
claim: C002-import-undo-cascades-into-sales
round: 2
role: challenger
model: moonshotai/kimi-k3.1-pro:free
harness: numes-round.sh (nflinv)
date: 2026-11-23
---

# R2 challenge: import undo cascades into sales

I argue AGAINST the claim that "undo deletes cards by batch and sales reference card_id with on delete cascade; the confirm dialog mentions edited cards but not sales" is a **live** problem. The research is thorough and largely correct; my objections are narrow, rated, and each names the evidence that would settle it.

## Objections (rated)

### O1 — The cascade is real, but the *dialog omission* is the weaker half of the claim
**Rating: moderate**

The falsifier treats "undo deletes sales" and "the dialog warns about sales" as co-equal. The first is mechanically true in the repo; the second is a UX judgment. A confirm dialog that says "This can't be undone" already signals total destruction; adding "sales" is copywriting, not safety engineering. The claim therefore over-weights a wording gap.

**Evidence that would settle it:** a user test or explicit product requirement stating that the undo dialog must enumerate every dependent table that will be deleted. Absent that, the dialog objection is preference, not defect.

### O2 — Live schema is unverified; if the FK is not cascade the claim collapses to an error message
**Rating: weak**

The researcher admits (§4) that the live Supabase project was not queried. If `sales.card_id` on the live DB is **not** `on delete cascade`, undo will raise an FK violation and delete **zero** cards. The claim would then be falsified on its first clause ("undo deletes sales") because undo would delete nothing at all.

**Evidence that would settle it:** a story-agent migration test or `pg_dump --schema-only` showing `on delete cascade` on `sales_card_id_fkey` in project `ngxfvhlbrhlqarpwavcf`.

### O3 — The import-time sale path makes undo *more* destructive, but only for fresh imports
**Rating: moderate**

Research correctly notes (§2) that undoing a fresh import destroys sales the import itself created, with no user edit in between. That undercuts the dialog's "cards you edited since" framing. However, this applies only to the immediate undo banner, not to the "Past imports" list. The claim as written does not distinguish the two entry points, so it over-generalizes the special case.

**Evidence that would settle it:** instrumenting or code-reviewing whether the banner and the past-imports button should share the same warning text; if they should not, the claim needs splitting.

## Explicit concessions

- I **concede** that `app/import/page.tsx:138` issues `DELETE FROM cards WHERE import_batch_id = $1` and that `supabase/migrations/0001_init.sql:85` declares `sales.card_id … on delete cascade`. There is no app-level guard or pre-count of affected sales.
- I **concede** that the confirm dialog string (line 137) never contains the words "sale", "sales", or "listing".
- I **concede** that `listings.card_id` also cascades, so listings die too; the claim's focus on sales is not wrong, merely incomplete.
- I **concede** that no later migration alters the FK, and the code path is unchanged since v1.

## Net position

The claim is **structurally true in the repo** and **not falsified by any code I can see**. My strongest objection (O1) only reduces its severity from "data-loss bug" to "incomplete warning copy." I do not dispute the mechanism; I dispute whether the dialog omission, standing alone, justifies treating this as an open defect rather than a UX polish item.
