---
claim: C010-s8-price-source-the-football-mcp-not-the
round: 2
role: challenger
model: moonshotai/kimi-k3.1-pro:free
harness: nflinv
date: 2026-11-24
---

# R2 challenge: the football MCP as the source for Price (last comp)

I argue AGAINST the claim as worded. The researcher (r01, `z-ai/glm-5.3-flash`)
concludes the evidence supports the claim; I conclude the same evidence defeats
the claim's actual wording and supports only a narrower, interim statement the
claim does not make. I cite r01 as the controlling source throughout and re-run
none of its research. All figures are r01's 2026-11-23 census (P-cc) and fetched
vendor pages; repo citations are first-party.

The claim has three load-bearing pieces: (a) Price means "last comp", (b) the
football MCP is the right source for it, (c) the eBay API is not. R01's own
evidence makes (a) and (b) contradictory and leaves (c) resting on an
application nobody has filed and a toggle nobody has flipped.

## 1. Concessions (what I cannot dispute)

- **C1. The eBay API cannot supply sold comps today.** Browse shows active
  asks, not solds; sold history requires Marketplace Insights, a Limited
  Release, plus an Application Growth Check for any Buy API production access
  (r01 §2, eBay's own pages fetched 2026-11-23). I do not dispute this at all.
- **C2. The football MCP is the only working valuation source in the system
  right now.** No eBay sold comp exists in the app (r01 §5.3), no third source
  is worth chasing (r01 §4: ToS-risky scrapers with commercial interest;
  Terapeak not an API for this use). As an *interim valuation* source the MCP
  is unopposed. My challenge is to the claim's wording and permanence, not to
  using the MCP today.
- **C3. The no-persist exemption is currently incompatible with storing eBay
  data.** Dennis enabled "I do not persist eBay data" on 2026-11-23 and S11
  carries the acceptance criterion to build the deletion endpoint and switch it
  off before any eBay data is stored (r01 §2; docs/HANDOFF.md). As of today,
  falsifier 3 does not fire.
- **C4. R01's coverage measurements themselves.** The P-cc census, the
  comp/estimate disjointness check (0 shared variants over 135,366 estimate
  rows), the one-day freshness, the 98.5% `scp_csv`/PriceCharting provenance,
  and the MCP caps. I accept every number; I dispute what they are taken to
  prove.
- **C5. S8's story already targets `estimate_cents`.** docs/STORIES.md:139:
  "The value goes to `estimate_cents` and into the history from S9", with
  source id and date. The story's mechanism is sound and I do not challenge it
  — indeed this concession is the basis of O1.
- **C6. The P-app coverage denominator is unmeasurable from this seat.** The
  Supabase rule (AGENTS.md) bars discussion agents from the inventory database
  and S7 is not built (r01 §5.1). I do not claim the falsifier's coverage arm
  has fired on the real inventory; I claim the claim survives that arm only by
  a redefinition (O2).

## 2. Objections to the claim

### O1 — A source that does not carry eBay comps cannot be "the right source" for a column defined as an eBay comp. **STRONG.**

`cards.comp_cents` is defined as "Price: last researched eBay comp"
(`supabase/migrations/0002_comp_price.sql:5,8`, quoted in r01 §1). R01 §3
establishes what the MCP actually serves: 98.5% PriceCharting guide-download
rows (`scp_csv`), 1.5% `legacy`, plus derived estimates. R01 §1 itself names
the problem: "the column is *defined* as an eBay comp, and the football MCP
does not serve eBay comps." R01 §6 then prices the cost honestly: an
MCP-sourced value "is a PriceCharting guide comp or a derived estimate, and
the value history must record that source truthfully rather than calling it an
eBay comp."

That is not a source choice; it is a redefinition of the column. The claim's
title asserts the MCP is the right source for "Price (last comp)". Read
literally, that is false by construction — no feed without eBay sold data can
be the right source for a last eBay comp. Read charitably, it means "the MCP
should feed Price, and Price should stop meaning an eBay comp" — which is a
schema/semantics change the claim never states and whose cost r01 flags but
the claim does not carry. Meanwhile S8's actual story (C5) writes MCP values
to `estimate_cents`, a column that already exists for exactly this purpose.
So the claim as titled decides a question S8 does not ask, in a direction the
app's own schema contradicts, while the story it claims to decide already
routes the same values correctly.

- **What would settle it:** the text of migration 0002 and
  docs/STORIES.md:135-141, read together. If `comp_cents` stays defined as an
  eBay comp and S8 writes `estimate_cents`, O1 is settled: the claim must be
  rewritten as "the football MCP is the right source for Est. price", not for
  Price (last comp). O1 falls only if a migration or story amendment
  explicitly redefines `comp_cents` to accept non-eBay guide comps — which
  would be a different claim.

### O2 — The claim survives its own falsifier only by counting derived estimates as "prices", contradicting its title. **STRONG.**

Falsifier 2: the claim dies if the MCP "lacks prices for more than a quarter
of the cards in the inventory (Midnight, Flagship, Inception, Chrome)". Take
"prices" as the claim's title takes them — comps. R01 §3's comp-only column:

| Product | real comp coverage | lacking comps |
|---|---|---|
| nfl_chrome_2026 | 3.0% | 97.0% |
| nfl_midnight_2026 | 14.6% | 85.4% |
| nfl_inception_2026 | 24.2% | 75.8% |
| nfl_flagship_2026 | 45.9% | 54.1% |

Every named set lacks comps for far more than a quarter of its checklist. The
78.8–100% headline that r01 §6 uses to say "no falsifier fires" exists only
once stored estimates are counted — estimates that r01 §3 itself says are
"tier-median or ladder-derivation over the product's own priced anchors", that
the app already has a separate column for, and that feeding into Price would
be "semantic drift from the column's definition". So the claim's survival
depends on the exact redefinition (comp → comp-or-estimate) that its title
("last comp") forbids. That is an internal contradiction, not a measurement
dispute. Per C6 I do not assert the falsifier has fired on P-app; I assert the
claim cannot consistently argue it has *not* fired.

- **What would settle it:** the app-side join r01 §5.1 names (inventory cards
  per set left-joined to MCP priced variants, once S7 exists), run twice:
  comp-only and comps-plus-estimates. If comp-only coverage on the real
  inventory is under 75%, falsifier 2 fires under the claim's own "last comp"
  reading. If the verdict instead declares estimates valid "prices" for this
  falsifier, that declaration itself settles O1 — the claim was never about
  comps.

### O3 — P-cc is a structurally biased proxy for the inventory, in the direction that keeps the claim alive. **MODERATE.**

R01 §5.1 states the proxy holds "only if Dennis's inventory is not
concentrated on the unpriced tail (new numbered parallels, 1/1s)". But a
collector's tracked inventory is concentrated precisely there: nobody opens an
inventory app to track thousands of base cards; the cards worth pricing are
numbered parallels, autos and short prints — the newest, thinnest-traded
variants a guide covers worst. The P-cc denominators (43,770 Flagship
variants; 25,091 Chrome 2026) are dominated by base and common parallels that
will never enter the app, so the aggregate coverage percentages overstate the
coverage that matters. The comp-coverage collapse on new sets (O2's table) is
exactly the signature of this bias: the tail the guide misses is the tail the
inventory holds. I rate this moderate, not strong, because the inventory's
actual composition is unmeasured (C6) and the bias magnitude is inferred, not
observed.

- **What would settle it:** the inventory's variant-type distribution versus
  the checklist's (one app-side query once S7 exists), or a hand count of the
  ~50 priced cards r01 §1 says exist today, classifying each as base /
  numbered parallel / auto and checking whether the MCP has a real comp for
  that exact variant. If the inventory turns out to be base-heavy, O3 dies.

### O4 — "Last comp" implies a recency and transaction specificity a nightly third-party guide snapshot does not have, and no baseline comparison exists. **MODERATE.**

The MCP's freshest comp is observed_on 2026-11-22 with a nightly pipeline
(r01 §3), and the rows are PriceCharting guide values — r01 flags that
PriceCharting "tracks sold comps but is not eBay itself and not a neutral
market feed". A "last comp" is a specific most-recent transaction; a nightly
aggregated guide value is a smoothed level. For the newly released sets this
claim names (Chrome 2026, Midnight 2026, Inception 2026), where prices move
fastest and comps are thinnest, the difference is material and compounds with
O2: where the guide has no comp it interpolates from the product's own
anchors, so the freshest market is priced by the stalest method. R01 §5.3
concedes no same-card comparison between an eBay comp and a PriceCharting
guide price exists anywhere in the app — so "right source" is, in r01's own
words, "a design choice, not a measured winner". Moderate because the harm is
unmeasured, not because the mechanism is speculative.

- **What would settle it:** a one-time sample (e.g. 30 owned cards across the
  four named sets) comparing the MCP's `football:pc` value against the actual
  last eBay sold comp obtained manually by Dennis (no API, no storage — a
  spreadsheet), recording divergence and comp age. Small median divergence
  kills O4; large divergence on new-set parallels proves the semantic gap is
  also a valuation error. R01 §5.3 confirms this comparison has never been
  run.

### O5 — "Not the eBay API" forecloses an option whose gatekeeping application has never been filed. **MODERATE.**

Falsifier 1 is "eBay grants Marketplace Insights to this app". R01 §2: "No
evidence exists anywhere in the repo that Marketplace Insights access was
requested or granted", and gap 2: only Dennis's dev portal knows. The claim
asks for a settled verdict that the eBay API is the wrong source while the one
cheap, decisive test — applying for Marketplace Insights — has not been run.
The application costs a portal form; a grant would flip the entire economics
(the app's own keyset is already production-live since 2026-11-22, so an
existing application stands a real Growth Check review). Settling "not the
eBay API" now converts an untested external decision into a design axiom, and
the value history written under it (source ids, dates) entrenches the MCP
semantics before the question is even asked. Moderate: this is about deciding
prematurely, not about the MCP being wrong today (C1, C2).

- **What would settle it:** Dennis applies for Marketplace Insights and the
  answer is recorded in the repo. Grant → falsifier 1 fires and the claim
  falls outright. Documented refusal → the "not eBay" half of the claim is
  settled on evidence instead of on the absence of an application, and O5
  disappears.

### O6 — The exemption arm of the claim treats a reversible compliance posture as a permanent wall. **MODERATE.**

R01 §2's own verdict: storing eBay data "is compatible in principle — turn the
toggle off, run the deletion endpoint ... a precondition, not a grant". And
that precondition is not new work invented for this challenge: S11 already
carries "build the deletion endpoint and switch the exemption OFF before the
app stores any eBay data" as an acceptance criterion (C3). The moment S11
ships as written, falsifier 3's underlying constraint vanishes and the only
remaining barrier to eBay-sourced comps is O5's unfiled application. A claim
whose "not the eBay API" rests on the no-persist exemption is therefore
resting on work already scheduled to remove that exemption's obstacle. The
claim should be explicit that its eBay exclusion is valid only until S11's
deletion endpoint ships — as worded, it asserts a standing verdict.

- **What would settle it:** S11's deletion endpoint ships and the portal
  toggle is switched off (both are already acceptance criteria, so this is a
  matter of watching the story land). At that point the storage objection to
  eBay comps is settled gone; if Dennis instead decides to keep the exemption
  permanently and delete the S11 criterion, that decision — recorded —
  settles O6 in the claim's favour.

### O7 — The MCP path currently has no realized-sale cross-check, so the claim crowns a single commercial vendor's guide as the comp of record. **WEAK.**

S8's story names `football:sold_rate` as the "realized-comp sanity check";
r01 §3 measured that table at **0 rows** (2026-11-23). So within the MCP
ecosystem there is today no realized-transaction feed at all: the claim's
"last comp" would rest entirely on PriceCharting, a vendor r01 flags for
commercial interest, with the designed sanity check empty and (per O5) the
independent eBay baseline unrequested. I rate this weak because it is a gap
to fill rather than a refutation — an empty table says nothing about whether
the guide is wrong — but it belongs in the verdict's cost column alongside
r01 §6's items (a)–(c).

- **What would settle it:** `sold_rate` populated and a live MCP query
  returning realized sales for a sample of inventory cards, with the
  guide-versus-realized divergence reported. Until then the sanity check
  named in S8's story does not exist (r01's words).

## 3. Where this leaves the claim

- Conceded: eBay cannot serve sold comps today (C1); the MCP is the only
  working valuation feed (C2); the exemption currently bars eBay storage
  (C3); all of r01's measurements (C4); S8's mechanism and its
  `estimate_cents` target (C5); P-app unmeasurability from this seat (C6).
- **O1 (strong):** the claim as titled is false by construction — a
  PriceCharting guide cannot source a column defined as a last eBay comp;
  S8's own story already writes these values to the estimate column.
- **O2 (strong):** the falsifier's coverage arm is survived only by counting
  derived estimates as comps, which the title forbids — an internal
  contradiction, independent of the P-app gap.
- **O3, O4 (moderate):** the coverage proxy is biased toward base cards the
  inventory does not hold, and no guide-versus-actual-comp comparison has
  ever been run.
- **O5, O6 (moderate):** both eBay arms of the falsifier are live, not dead —
  the Marketplace Insights application was never filed, and S11 is already
  committed to removing the storage obstacle.
- **O7 (weak):** the realized-sales cross-check is an empty table.

**Net:** the claim should not be settled as worded. The defensible residue is
narrower and mostly already written into S8: *the football MCP is the right
interim source for `estimate_cents` (source-id-and-dated guide values and
estimates), while `comp_cents` keeps its definition as a last eBay comp and
stays unpopulated pending two cheap external tests — a Marketplace Insights
application and S11's deletion endpoint.* That wording survives O1–O7
untouched. The verdict should also commission the two settling measurements
that need no eBay access: the comp-only inventory join once S7 exists (O2/O3)
and the 30-card manual guide-versus-sold-comp sample (O4). Settling the claim
as titled would bake a column redefinition and a premature eBay foreclosure
into the story list on the strength of coverage numbers that, read as comps,
point the other way.

## 4. Source-interest flags

- All quantitative evidence is r01's first-party census and live MCP status
  calls (2026-11-23), plus first-party repo files (migration 0002,
  docs/STORIES.md, docs/HANDOFF.md). I re-ran nothing and added no new
  sources.
- eBay developer pages are the vendor's own documentation, fetched by r01;
  PriceCharting's commercial interest is flagged in r01 §3 and relied on only
  as flagged. The secondary scraping-API blog r01 cites plays no role in my
  objections.
- I have no commercial interest in either source winning. I did not touch the
  live Supabase project, `.env*` secrets, app code, `docs/STORIES.md` or any
  database (Supabase rule, two-trees rule, AGENTS.md). My only write is this
  round file.
