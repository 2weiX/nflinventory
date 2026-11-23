---
claim: C010-s8-price-source-the-football-mcp-not-the
round: 1
role: researcher
model: z-ai/glm-5.3-flash
harness: hermes (Ultron on Dennis's Linux harness)
date: 2026-11-23
---

# R1 research: is the football MCP the right price source for the app's Price column?

Everything below was gathered on 2026-11-23 (CET) on Dennis's harness. Every figure carries
its date, the population it counts, the sample (always a full census of the named table, never a
sample drawn from it) and where it came from: either a query I re-ran today (SQL shown), a file
in this repo with a line reference, or a fetched eBay developer page. Where the evidence does not
exist, I say so and stop, per the brief.

Populations first, because the falsifier's population is narrower than what I can measure:

- **P-app** = the cards in the app's inventory (Dennis's owned cards, Supabase project
  `ngxfvhlbrhlqarpwavcf`). NOT measured. Discussion agents may not touch the inventory database
  (AGENTS.md, "The Supabase rule"). This is an explicit gap, see section 5.
- **P-cc** = the full staged checklist of a product in the cc price database (every variant the
  price platform tracks for that set, not only the cards Dennis owns). Measured in full, 2026-11-23.

## 1. What the app defines Price as (repo evidence, 2026-11-23)

`cards.comp_cents` is defined as "Price: last researched eBay comp, integer cents"
(`supabase/migrations/0002_comp_price.sql:5,8`), separate from `estimate_cents` (Est. price) and
`list_price_cents` (eBay ask). HANDOFF 2026-11-23 ("Deploy + Price field"): 50 cards currently in
the app carry Price or Est. price after the Midnight import fix; the importer maps a sheet's PRICE
column to Price (comp). S8's story (docs/STORIES.md:135, "Claude refreshes values with my football
MCP") already names the football MCP as the value source and requires every written value to carry
a source id and date. So the claim is really a definitional question: the column is *defined* as an
eBay comp, and the football MCP does not serve eBay comps. What it serves is in section 3.

## 2. The eBay side (fetched 2026-11-23 unless noted)

- **Sold prices = Marketplace Insights API = Limited Release.** eBay's own buying-application
  guide: "Marketplace Insights API: Retrieve the sales history of items sold on eBay. (This is a
  Limited Release.)" Source: https://developer.ebay.com/develop/get-started/get-started-on-a-buying-application
  (fetched 2026-11-23). Production access to any Buy API additionally requires an Application
  Growth Check: applications are granted "based on the proposed business model" (same page).
  This app's business model (an inventory app for one user that lists drafts) is not one of the
  named Buy API categories on that page (Affiliate, member checkout, guest checkout, Offer API).
- **The Browse API shows asks, not sold prices.** Its endpoints are item_summary/search, item and
  friends; the search filters target active listings ("search eBay listings", Browse API overview,
  https://developer.ebay.com/api-docs/buy/browse/static/overview.html, fetched 2026-11-23). No
  sold/ended resource exists in the Browse API. A secondary source agrees (getanyapi.com blog:
  "It has no filter for sold or ended listings", citing eBay's call-limits page as of 2026-10-02,
  Browse default 5,000 calls/day) - flagged as commercial interest: that blog sells an eBay
  scraping API. The primary fact needs no secondary source.
- **This app's keyset state.** Production keyset live 2026-11-22: OAuth token minted, taxonomy
  tree answered (docs/EBAY_SANDBOX.md, "Production (live 2026-11-22)"). Developer account
  registered 2026-11-21 (AGENTS.md project facts). **No evidence exists anywhere in the repo that
  Marketplace Insights access was requested or granted.** I cannot see the dev portal from here;
  the approval status is unknown to the app. Stated as a gap, not resolved by guessing.
- **The 'I do not persist eBay data' exemption.** eBay's account-deletion guide: every
  third-party developer must either (1) subscribe to marketplace account deletion/closure
  notifications or (2) apply for exemption "if they do not store any eBay data"; the portal toggle
  is "Not persisting eBay data". Source:
  https://developer.ebay.com/develop/guides/sell/marketplace-user-account-deletion
  (fetched 2026-11-23). Repo state: the production keyset was flagged "Non Compliant" and Dennis
  enabled the exemption (reason: "I do not persist eBay data") on 2026-11-23, with a new S11
  acceptance criterion: build the deletion endpoint and switch the exemption OFF before the app
  stores any eBay data (docs/HANDOFF.md, entry "eBay Production keyset ... Non Compliant").
  **Verdict on falsifier 3: as of 2026-11-23 storing eBay API data is NOT compatible with the
  live exemption.** It is compatible in principle - turn the toggle off, run the deletion
  endpoint - but that is an owner-side portal action plus a built endpoint, i.e. a precondition,
  not a grant.

## 3. Football MCP coverage (measured 2026-11-23; data cutoff 2026-11-22)

Population: P-cc, full census of cc.variant per product. Two coverage tiers, disjoint by
construction and verified: **real comps** (cc.card_price rows) and **stored estimates**
(cc.price_estimate). Verified disjoint: of 135,366 estimate rows, 0 share a variant with any
card_price row (query re-run 2026-11-23).

| Product | Variants | Real comps | comp % | comps + estimates | % |
|---|---|---|---|---|---|
| nfl_flagship_2026 | 43,770 | 20,109 | 45.9% | 42,163 | 96.3% |
| nfl_chrome_2026 | 25,091 | 750 | 3.0% | 19,776 | 78.8% |
| nfl_chrome_2025 | 24,220 | 15,336 | 63.3% | 23,308 | 96.2% |
| nfl_midnight_2026 | 7,543 | 1,102 | 14.6% | 6,799 | 90.1% |
| nfl_midnight_2024 | 4,866 | 3,710 | 76.2% | 4,866 | 100.0% |
| nfl_inception_2024 | 4,186 | 3,251 | 77.7% | 4,012 | 95.8% |
| nfl_inception_2026 | 4,680 | 1,131 | 24.2% | 3,854 | 82.4% |

Query: `count(distinct v.variant_id)` over cc.product join cc.variant, with
`exists(cc.card_price)` and `exists(cc.price_estimate)` filters, run on the harness against the
Supabase pooler in read-only session (port 6543) on 2026-11-23; statement timeout 30 s. The MCP's
own `status` tool (called 2026-11-23 via 127.0.0.1:8742/mcp) reports the same variants/priced
counts per product, and database size 537 MB.

- **Freshness:** latest comp observed_on = 2026-11-22 on every product above (same query).
  The SCP download pipeline runs nightly (23:00, cc-cards) so the data is one day old at any
  morning read.
- **Provenance of comps:** source `scp_csv` = 1,189,468 of 1,206,897 card_price rows
  (98.5%), the rest `legacy` (17,429) (query run 2026-11-23). scp_csv rows come from the
  PriceCharting price-guide download channel (docs/COLLECTINGCARDS_PROJECT.md:72,
  www.pricecharting.com/price-guide/download-custom). **Commercial interest flag: PriceCharting
  sells its price guide; its data tracks sold comps but is not eBay itself and not a neutral
  market feed.** The `legacy` source is the Mac-side fetcher history.
- **Grade dimension:** card_price rows split raw / psa10 / g9 (e.g. Flagship 2026: 40,644 raw,
  54,749 psa10, 50,565 g9) - the MCP can quote a graded or raw price, which matters for the comp
  semantics (query run 2026-11-23).
- **The estimates are derived, not comps.** Per the platform's estimator contract, stored
  estimates are tier-median or ladder-derivation over the product's own priced anchors
  (~/collectingcards-data skill, estimator contract; docs/SPEC_database.md). A "Price" column fed
  by them is an estimate, which the app already has a separate column for (`estimate_cents`).
- **Real-comp coverage collapses on new sets:** Chrome 2026 at 3.0%, Midnight 2026 at 14.6%,
  Inception 2026 at 24.2% (census 2026-11-23). If Price strictly means a comp, the MCP cannot
  price most of those sets today; estimates fill in, at the cost of semantic drift from the
  column's definition.
- **The football:sold_rate source is empty.** S8's story lists `football:sold_rate` (realized
  break-economics sales) as the realized-comp sanity check; the cc table `sold_rate` has **0
  rows** (MCP status, 2026-11-23; `purchase` has 163). Explicit gap: that sanity check does not
  exist yet.
- **MCP caps** (recorded in S8's story, verified live 2026-11-20 per the story, and consistent
  with cc-mcp's rate limiter): 20 requests/minute/token, 30 s statement timeout, SELECT-only.

## 4. No third source was found worth chasing

eBay's scraping-based third parties (Apify, getanyapi and friends) sell sold-listing access
against eBay's ToS posture and per-sale pricing (getanyapi blog, 2026-10-02 figures, fetched
2026-11-23 - commercial interest flagged). Terapeak is a seller-facing analytics product, not an
API for this use. I stopped looking here.

## 5. Explicit gaps

1. **The falsifier's real denominator is unmeasurable from this seat.** "More than a quarter of
   the cards in the inventory" means P-app: Dennis's owned cards. Discussion agents cannot touch
   the inventory database (AGENTS.md, Supabase rule), and the app's own MCP endpoint (S7) is not
   built yet, so there is no read path. What I measured is coverage over the full staged
   checklists (P-cc), which is the right proxy only if Dennis's inventory is not concentrated on
   the unpriced tail (new numbered parallels, 1/1s). The exact test is one app-side query the
   moment S7 exists: left-join the inventory's cards per set against the MCP's priced variants.
   Until then the falsifier's coverage arm is unresolved, not refuted.
2. **Marketplace Insights approval status is unknowable from the repo.** Only Dennis's dev
   portal knows; no application is evidenced. If he applies and eBay grants it, falsifier 1 fires
   and the whole economics change.
3. **No eBay sold-comp exists in the app at all today**, so there is no baseline quality
   comparison between an eBay comp and a PriceCharting guide price on the same card. The claim's
   "right source" is therefore a design choice, not a measured winner.

## 6. Read of the evidence

No falsifier fires today. The MCP prices 78.8-100% of every named set's checklist variants
(census 2026-11-23) once stored estimates count, and the eBay sold-price path is gated twice
(Marketplace Insights Limited Release + Growth Check; the live no-persist exemption with its
S11 precondition). The honest cost of the MCP path, which the verdict must weigh: (a) the Price
column's definition ("last researched eBay comp") is contradicted - an MCP-sourced value is a
PriceCharting guide comp or a derived estimate, and the value history must record that source
truthfully rather than calling it an eBay comp; (b) on the newest sets most of that coverage is
estimates, not comps (Chrome 2026: 3.0% real comps); (c) the realized-sales sanity check named in
S8's story (football:sold_rate) is an empty table today. These are semantic and freshness costs,
not blockers, and the claim as worded ("the football MCP is the right source") is what the
evidence supports as of 2026-11-23.
