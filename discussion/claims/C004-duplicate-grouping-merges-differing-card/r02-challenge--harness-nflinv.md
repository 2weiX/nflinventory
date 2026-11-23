---
claim: C004-duplicate-grouping-merges-differing-card
round: 2
role: challenger
model: moonshotai/kimi-k3.1-pro:free
harness: nflinv
date: 2026-11-23
---

# R2 challenge: Duplicate grouping merges differing cards; group row shows g[0]

I argue **against** the claim's severity. The researcher proves a display mismatch between a group row and the header total. That is not the same as proving data corruption, loss of control, or an operational decision risk that demands a fix. The grouping is a **view convenience** with a user-controlled toggle and a per-card detail page one click away. The claim as stated inflates a cosmetic imperfection into a correctness bug.

---

## 1. Explicit concessions

I cannot dispute these facts; I accept them and argue around them:

- **C1. The 12-field grouping key is exact and omits money columns.** `app/page.tsx:21-22` confirms it. `supabase/migrations/0001_init.sql:45-48` confirms `cost_cents`, `estimate_cents`, `list_price_cents` exist outside that key.
- **C2. The row renders from `g[0]`.** `app/page.tsx:190`, `211-212`. The Price and Est. price columns are the representative's values only.
- **C3. The header total sums all filtered cards.** `app/page.tsx:78-81`. `filtered.reduce` operates on every card, not on group representatives.
- **C4. A divergent pair is constructible and reachable.** Two rows equal on the 12 key fields but differing in `estimate_cents` produce a row that shows one value and a total that sums both. No uniqueness constraint prevents this.

I concede the mechanism. I challenge the **interpretation** that this mechanism constitutes a defect requiring remediation.

---

## 2. Objections to the claim, rated

### Objection A — The claim ignores the user's explicit control over grouping
**Rating: strong**

The inventory page ships with a "Group duplicates" checkbox (`app/page.tsx:153`). Grouping is **on by default** (`useState(true)`), but the user can turn it off at any time and see every card individually. A user who wants per-copy granularity has an immediate, discoverable escape hatch. The claim treats the grouped view as the only view and the mismatch as unavoidable; neither is true.

The app also provides a per-card detail page (`app/cards/[id]/page.tsx`) reachable by clicking any row. A user who needs exact per-copy values can (a) uncheck "Group duplicates" or (b) click through. The mismatch exists only inside a convenience summary that the user opted into and can exit.

**Evidence that would settle this:** A usability study or even a single user report showing that Dennis does not know the toggle exists, or that he expects grouped rows to aggregate money. Without that, this objection stands on the UI contract already visible in the code.

### Objection B — The claim conflates "display inconsistency" with "data corruption"
**Rating: strong**

Nothing in the grouping path mutates, overwrites, or destroys data. `groupKey` is a read-only function used in a `useMemo`. The `filtered` array remains intact; every card's `estimate_cents` is still in the database and still counted in `totals.est`. The worst outcome is that a human reads two numbers on the same screen and finds them inconsistent. That is a **presentation-layer inconsistency**, not a correctness failure in the data model.

The falsifier says the row "shows g[0] while totals use all members." True. But totals and row values are **different questions**: the total answers "what is my filtered inventory worth?"; the row answers "what is this representative card worth?" A sum-of-representatives would answer a third question ("what would my inventory be worth if every copy matched its group's representative?") — a question nobody asked.

**Evidence that would settle this:** A demonstration that any write path (save, import, bulk status) depends on the grouped view's displayed values, or that Dennis makes pricing decisions from the row without clicking through. The code shows writes operate on `card.id` directly (`app/cards/[id]/page.tsx:61`, `app/page.tsx:85`), independent of grouping.

### Objection C — The claim never establishes that aggregation is the intended semantic
**Rating: strong**

The researcher admits this gap: "Nothing in docs/ or code states what the Value column is supposed to mean for a multi-member group" (r01 §4). The claim nonetheless presumes the correct semantic is **sum** (or at least not **representative**). But `docs/STORIES.md:65` says only: "Identical copies collapse into one row with ×N (toggle)." It does not say "identical copies collapse and their values are summed in the row." The ×N badge signals quantity, not a value multiplier.

If the intended semantic is "show me one example of this card, and tell me how many I have," then `g[0]` is a reasonable implementation. The header total already provides the aggregate; repeating it inside every group row would be redundant and would make the table harder to scan.

**Evidence that would settle this:** A sentence from Dennis in `docs/STORIES.md` or a design note stating that grouped rows must display group-summed money. Absent that, the claim is arguing for a new requirement, not reporting a bug against an existing one.

### Objection D — The constructed divergent pair is pathological, not typical
**Rating: moderate**

The researcher's Pair A/B has Card A as `is_rookie: false` and Card B as `is_rookie: true`, with different teams and different estimates, yet identical `player_names`, `card_number`, `parallel`, `serial_to`, `serial_number`, `grader`, `grade`, and `status`. In real collecting, a rookie designation is part of a card's identity; a user who cares enough to track serial numbers and grades will usually also distinguish RC from non-RC. The example is **schema-valid but semantically odd**.

More typical divergence is two copies of the exact same card with different `cost_cents` (paid different amounts at different shows) or different `estimate_cents` (repriced one copy after a comp moved). In those cases, showing the representative's value and summing in the header is arguably the **least confusing** choice: the user sees a representative price point and a true total.

**Evidence that would settle this:** A read-only query against the live database showing how many groups actually diverge in money fields, and by how much. If the median divergence is small or the count is zero, the claim's urgency collapses.

### Objection E — The harm is bounded by the ×N badge and the total line
**Rating: moderate**

The row is not presented as an authoritative per-group valuation. It carries a ×N badge (`app/page.tsx:209`) and sits under a total line that explicitly counts all cards and sums all estimates. A user reading the screen sees:

- "N cards · worth $X" at the top,
- a table where some rows say ×2, ×3, etc.

The arithmetic is not hidden. The mismatch is visible to anyone who multiplies the row value by the badge and compares to the total. That visibility is a design feature: it signals "these are individual prices, not a group sum."

**Evidence that would settle this:** An A/B test or user interview showing that Dennis misreads the grouped view as a group sum despite the ×N badge and total line.

### Objection F — The proposed fix would create new problems
**Rating: moderate**

If the row must show group-summed money, then:
- Sorting by value must also sort by group sum, not by representative. Otherwise the sort order contradicts the displayed values.
- The CSV export (`app/page.tsx:91-94`) currently exports `filtered`, one row per physical card. That is correct for backup and re-import. A grouped display with summed values would diverge further from the export, creating a new inconsistency.
- The mobile story (S10) requires a compact card list. Group sums add width and cognitive load.

The claim does not engage with these trade-offs. It assumes "fix the row" is costless.

**Evidence that would settle this:** A concrete design proposal showing how group sums interact with sort, export, and mobile layout without introducing new inconsistencies.

### Objection G — The claim's own falsifier is already satisfied, yet the claim remains open
**Rating: weak**

The falsifier says: "needs a concrete divergent pair to file." The researcher provided one in r01 §2. By the claim's own criterion, it should now be filed and moved toward a verdict, not left open as an ongoing investigation. The continued "open" status suggests the researcher is searching for additional justification beyond the original falsifier — a sign that the original claim was under-specified.

**Evidence that would settle this:** The claim's status changing to "settled" or "verdict" now that the falsifier is met, or a revised falsifier that names a stronger harm.

---

## 3. Summary

I concede the mechanism and the constructed pair. I object that the claim:

1. Ignores the user-controlled grouping toggle and detail-page escape hatch (strong).
2. Mistakes a display inconsistency for data corruption (strong).
3. Assumes an aggregation semantic that no requirement states (strong).
4. Relies on a pathological example rather than measured live frequency (moderate).
5. Overlooks the ×N badge and total line as disambiguating signals (moderate).
6. Ignores the downstream costs of the implied fix (moderate).

The appropriate verdict is **not** "this is a bug to fix." It is **"this is a design choice; if Dennis wants group sums, write a story for group sums."** Until then, the current behavior is a defensible implementation of the stated requirement: "Identical copies collapse into one row with ×N."

---

## 4. Source-interest flags

- All citations are first-party code in this repo, read 2026-11-23.
- No third-party, market, vendor, or pricing source was used.
- I have no commercial interest in whether the claim stands.
