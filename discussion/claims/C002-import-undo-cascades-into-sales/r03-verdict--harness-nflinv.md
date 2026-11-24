---
claim: C002-import-undo-cascades-into-sales
round: 3
role: adjudicator
model: claude-sonnet-5-5
harness: claude-round.sh (nflinv)
date: 2026-11-24
verdict: upheld
---

# R3 verdict: import undo cascades into sales

Independence: r01 = z-ai/glm-5.3-flash, r02 = moonshotai/kimi-k3.1-pro:free, r03 = claude-sonnet-5-5.
Three different models; no collision. I re-read the code on 2026-11-24 (working tree at `main`, 07d519c).

## Verdict: **upheld**

Both halves of the falsifier still hold, so it is not falsified.

| Falsifier clause | Status | Evidence (re-read today) |
|---|---|---|
| Undo deletes cards by batch | true | `app/import/page.tsx:139` `supabase.from("cards").delete().eq("import_batch_id", batchId)` |
| `sales.card_id` cascades | true | `supabase/migrations/0001_init.sql:85` `card_id uuid not null references cards(id) on delete cascade` |
| Dialog does not mention sales | true | `app/import/page.tsx:137`: "Delete every card from this import? Cards you edited since will be deleted too. This can't be undone." |
| Anything overriding the cascade | none | The repo has two migrations. 0002 only adds `cards.comp_cents`; no trigger, no FK change. |

## Checking the earlier rounds

**R1 (researcher): right on the substance, wrong on two details.**
- It says `0001_init.sql` is the only migration (§1.3). `0002_comp_price.sql` also exists. It adds one nullable column and does not touch the FK, so the conclusion is unchanged.
- It cites "136-142" for the undo function. The delete is at line 139 and the confirm at 137. Harmless.
- The listings cascade (`0001_init.sql:70`) is real and confirmed. It is out of this claim's scope.

**R2 (challenger): direction fair, three objections mostly weak. Same-model rule not engaged; it is independent of R1. Weighed as an independent challenge.**
- **O1 (dialog omission is only wording): rejected.** The dialog does not just omit a table. Its one specific warning, about edited cards, suggests the loss is limited to card rows. "This can't be undone" does not tell the user that recorded sale prices and profit history go too. For a card that has been sold and had a sale recorded, the omission matters.
- **O2 (live FK might not cascade, so undo deletes nothing): partly right, partly wrong.** The live schema was never checked and remains unverified. But the challenger's claimed result is incomplete. `undo()` ignores the error from the card delete (line 139) and then deletes the batch row (line 140). `cards.import_batch_id` is `on delete set null` (`0001_init.sql:58`), so the batch row goes either way. If the FK were not a cascade, the batch would vanish and the cards would stay, orphaned, with no error shown. That is a separate bug from this claim. This objection is unresolved but unlikely: the repo has no recorded schema drift.
- **O3 (banner vs past imports differ): refuted.** Both entry points (`page.tsx:170` and `:269`) call the same `undo()`, so they show the same dialog text. There is nothing to split. The fresh-import case is real, though. The import itself inserts sales (`:124-129`), so the dialog's "edited since" wording is wrong even for an immediate undo.
- R2's line reference, "line 138" for the delete, is off by one (it is 139). Immaterial.

## Where both sides were wrong
Neither checked that `undo()` swallows errors. The researcher implied a failed cascade would show an FK violation, and the challenger implied zero cards would be deleted. In the code, neither would surface to the user.

## Unresolved (labelled, not settled)
- **Live schema:** unverified. Settle it with a rolled-back transaction by a story agent, or Dennis's dashboard. Discussion agents must not touch the live database.
- **Size on real data:** how many sales sit on batch-imported cards is unmeasured.

## Severity
The mechanism is a silent data-loss path, behind a confirm dialog that does not name what is lost. It is not a UX polish item. Because the repo is single-user, deliberate and mistaken use are both limited to Dennis, so the risk is accidental loss, not abuse.

## Proposed story change (for a story agent or Dennis; I do not edit `docs/STORIES.md`)
Before deleting, count the affected sales and listings, and say so in the dialog, for example "N sales and M listings will be deleted too". Alternatively block undo when sales exist. Also check the error from the card delete, and only delete the batch row if it succeeded. Listings can ride along in the same story.

## Source-interest flags
First-party code only. No third-party, market or vendor source, so no commercial interest.
