---
claim: C004-duplicate-grouping-merges-differing-card
round: 3
role: adjudicator
model: claude-sonnet-5-5
harness: nflinv
date: 2026-11-24
---

# R3 verdict: duplicate grouping merges differing cards; group row shows g[0]

**Verdict: weakened.** The mechanism is real and now has its concrete divergent pair. The claim does not show harm beyond a display inconsistency, and it does not show that the current behaviour breaks a stated requirement. Both rounds were partly wrong.

Independence: r01 was z-ai/glm-5.3-flash and r02 was moonshotai/kimi-k3.1-pro:free. I am claude-sonnet-5-5, which appears on no earlier round of this claim, so the gate is satisfied. r02 is independent of r01, so I weigh it at full strength, not as a same-model challenge.

Method: I re-read `app/page.tsx`, `lib/format.ts`, `lib/importer.ts`, the migrations and `docs/STORIES.md` at HEAD (96dbe7e) on 2026-11-24. I did not touch the live database (AGENTS.md rule), so nothing below is measured on real data.

## 1. Code moved under r01 - its citations need updating

r01 read commit d66bffa. `app/page.tsx` changed after that in 27f303b ("Add Price (last eBay comp) field"), so several r01 cites no longer hold at HEAD:

| r01 said | At HEAD |
|---|---|
| Value column = `money(c.estimate_cents)`, Ask column = `money(c.list_price_cents)` (l.211-212) | Columns are Price = `money(c.comp_cents)` (l.211) and Est. price = `money(c.estimate_cents)` (l.212). **No Ask column exists**: `list_price_cents` is not rendered on the list page. r01's "Ask" point (§1.3, §2) is moot. |
| Header total sums `estimate_cents` (l.79) | It sums `worth(c)` = `comp_cents ?? estimate_cents` (l.79, l.225-227) |
| Sort key `b[0].estimate_cents` (l.70) | Sort key is `worth(b[0])` (l.70). The `g[0]` representative problem is unchanged. |

What still holds: the 12-field key (l.21-22) omits `cost_cents`, `comp_cents`, `estimate_cents`, `list_price_cents`, `is_rookie`, `auto_type` and `team`. `const c = g[0]` (l.190) drives the row. The total sums every filtered card (l.78-81). `g[0]` is the oldest by `created_at` (l.14, l.62-67). `variantLabel(c)` reads `is_rookie` and `auto_type` from `g[0]` (lib/format.ts:29-30).

Recomputed r01's example at HEAD. Two key-identical cards, A with comp $80 and B with no comp and estimate $55:
- The row shows Price $80.00, with A's Est. price in the next column.
- The total counts $80 + $55 = $135. The row's Price × 2 would be $160, so the row does not reconcile with the total.
- The mismatch comes from `comp_cents` and `estimate_cents` differing across copies. It is not an artefact of the old estimate-only code.

The "concrete divergent pair" falsifier is therefore **met**, as a constructed pair. The claim is not falsified.

## 2. Checking r02's objections

- **A (toggle and detail page, "strong"): partly right.** `group` defaults to true (l.32) and the checkbox is at l.154, so ungrouped per-card rows are one click away. That limits the harm. It does not remove the silent mismatch while grouping is on, and grouping is the default view.
- **B (display, not corruption, "strong"): right.** `groupKey` feeds only `useMemo` and display. Writes go by `card.id`. Selection uses `ids = g.map(x => x.id)` (l.191), which targets the whole group, so a bulk action on a divergent group acts on all members. That is consistent with "×N", not harmful.
- **C (aggregation semantic never stated, "strong"): right.** `docs/STORIES.md:65` says only "Identical copies collapse into one row with ×N (toggle)". It defines neither the row's money semantics nor "identical". r01 §4 conceded this too. This is the deciding point. Without a stated requirement this is a design question, not a bug.
- **D (pair is pathological, "moderate"): half right.** r01's pair uses `is_rookie` and `team` differences, which is odd. But r02's own "typical" case, a repriced copy or a different `comp_cents`, is exactly the divergence that §1 shows. It is the normal output of editing one copy. r02 argues "least confusing" for it; that is an opinion with no test behind it.
- **E (×N badge disambiguates, "moderate"): overstated.** The row shows one price beside "×2" and a total above. Nothing says the price is only the first copy's. A reader can multiply and compare, but the page does not invite it.
- **F (fix costs, "moderate"): fair but premature.** It argues against one fix (summing). It does not exclude the cheaper fixes in §4. r02 cited the CSV export; I confirmed only that `exportCsv` exists (l.91-93), not that it exports `filtered`, so I give that point no weight.
- **G (falsifier met, so the claim should close, "weak"): wrong in logic.** Meeting a falsifier means the claim survived it. It does not mean the claim is settled or that a fix is mandated.

## 3. Where both sides were wrong

- **r01** wrote "the row's Value contradicts the total" as if it were a defect in an existing requirement. §4 of its own text admits no requirement exists. It also let its Ask point stand on code that HEAD no longer has.
- **r02** called the claim "a cosmetic imperfection" and the behaviour "a defensible implementation of the stated requirement". The stated requirement says nothing about money, so it can neither justify nor condemn `g[0]`. "Defensible" is unsupported. r02's G is a logic error.
- Neither measured live frequency. Both are working from a constructed pair. That gap is unresolved, not decided.

## 4. What the evidence supports

1. **Established:** key-identical cards can differ in comp, estimate, cost, rookie flag and team. The grouped row hides that. The header total counts every member and the row shows one.
2. **Not established:** that this has ever happened in Dennis's data, or that he misreads it. The live-data query is the missing evidence, and it belongs to a story agent or Dennis.
3. **Not established:** which behaviour Dennis wants. This is a product decision. It is open and labelled unresolved here.

**Recommendation for the story layer** (a proposal, not an edit to `docs/STORIES.md`): log a small display story, not a data one. Options from cheapest:
- (a) Mark a divergent group, for example a "~" or "varies" tag on the Price and Est. cells, so the row is no longer silent.
- (b) Add the money fields to the key. That splits groups, so it conflicts with "identical copies collapse".
- (c) Show a min-max range.
- (d) Show a group sum.

Option (a) is cheap and needs no semantic decision. Sort and the export stay as they are. Dennis would decide between (a) and (b)-(d).

## 5. Source-interest flags

All sources are first-party code at HEAD or r01/r02. No market, vendor or pricing source was used. No commercial interest.

verdict: weakened. Confidence: medium. Mechanism confirmed. Severity capped at display-level. Intent undecided.
