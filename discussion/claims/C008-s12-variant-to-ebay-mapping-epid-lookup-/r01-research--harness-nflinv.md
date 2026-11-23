---
claim: C008-s12-variant-to-ebay-mapping-epid-lookup-
round: 1
role: researcher
model: z-ai/glm-5.3-flash
harness: hermes (Ultron on Dennis's Linux harness)
date: 2026-11-23
---

# R1 research: ePID lookup with checklist-keyword fallback

Method: I read this repo's S12 story text, credential notes and importer code on the harness on
2026-11-23 (CET). Population for repo figures = this tree at commit `74f71cb` on `main`
(git log -1: "discussion: file C009 (S7 auth) and C010 (S8 price source)"); sample = every file
cited, re-read in full today. I did not touch the live Supabase project (AGENTS.md rule) and did
not call any eBay endpoint: the production user-token flow does not exist yet (section 4), so
every external figure below is documentation, not a production observation. External sources are
eBay's own developer documentation (fetched 2026-11-23, full pages cached on this machine) plus
one community post and three blog sources, all flagged.

## 1. What the API actually requires

| # | Fact | Population / sample | Source |
|---|---|---|---|
| 1.1 | `GET /commerce/catalog/v1_beta/product_summary/search` (find candidates by keywords, category, aspect, GTIN, MPN) returns `productSummaries[]` each carrying `epid`, `title`, aspects, image and `productWebUrl`. Query params: `q`, `category_ids`, `aspect_filter`, `gtin`, `mpn`, `limit` (default 50, **max 200**), `offset`. GTIN/MPN search is of little use for cards (cards carry no UPC in this app's data) | 1 method spec, read in full 2026-11-23 | https://developer.ebay.com/api-docs/commerce/catalog/resources/product_summary/methods/search (cached: ~/.hermes/cache/web/developer.ebay.com-29efe1a09c.md). **Vendor source: eBay documents its own API.** |
| 1.2 | **Both `search` and `getProduct` require an access token created with the authorization code grant flow (a USER token)**, with scope `sell.inventory` OR `commerce.catalog.readonly`. The docs state this identically on both method pages; an application token (client credentials) cannot call them | 2 method specs, OAuth Scope sections quoted verbatim in the cached pages | same two URLs as 1.1; getProduct cached at ~/.hermes/cache/web/developer.ebay.com-e5972322d4.md. **Vendor source: eBay.** |
| 1.3 | This contradicts this repo's own working note, which assumed "the **client-credentials flow** (App ID + Cert ID) for public-data lookups like catalog/category reads" (docs/EBAY_SANDBOX.md line 33). That holds for Taxonomy (application or user token) but **not** for the Catalog API | 1 repo doc line vs 2 method specs | docs/EBAY_SANDBOX.md at `74f71cb`, read 2026-11-23, against the sources in 1.2 |
| 1.4 | Community experience (a developer thread, undated page, accessed 2026-11-23): `commerce.catalog.readonly` appeared under the sandbox authorization-code grant for that user and "is listed for neither [grant] in production", while `sell.inventory` works for production Catalog calls. Treat as anecdote, not spec: the official pages list both scopes for the authorization-code grant without an environment qualifier | 1 community report, 1 app's keyset | https://community.ebay.com/forum/account-inventory-catalog-and-compliance-57960/topic/how-do-i-add-an-api-scope-to-my-app-467218/ (accessed 2026-11-23). Peer report, no commercial interest apparent |
| 1.5 | Default call limit for the Catalog API: **10,000 calls per day**, marked with eBay's dagger "additional user restrictions apply" | 1 published limits table, current as of page fetch 2026-11-23 | https://developer.ebay.com/develop/api-call-limits. **Vendor source: eBay; the dagger's concrete per-user values are not published.** |

Chain from 1.1 + 1.2: the claim's primary path (Catalog product search per variant) is real and
returns ePIDs directly, but it can only run under a **user token**. The falsifier's first clause,
"production Catalog search rejects the app scope", is therefore not a remote risk but the
**documented default outcome** for any implementation that reuses the app-level (client
credentials) token the harness already minted on 2026-11-22: eBay's spec says that token type is
refused on these two methods (1.2). The clause is not yet *observed* in production (section 4),
but the spec-level evidence already points one way.

## 2. Volume arithmetic for the mapping pass

| # | Fact | Population / sample | Source |
|---|---|---|---|
| 2.1 | The mapping input is checklist variants served by Dennis's football MCP: Flagship 2026 **43,770** variants, Chrome 2026 **25,091** variants (plus Chrome 2025, Midnight 2026, Inception, Heritage, Donruss/Optic, 1990 Score) | 2 set counts + 7 further sets, as recorded 2026-11-20 | AGENTS.md "Project facts", read 2026-11-23; figures dated 2026-11-20 in that file |
| 2.2 | At one search per variant, Flagship 2026 + Chrome 2026 alone need **68,861** catalog searches (43,770 + 25,091), i.e. **at least 7 days** at the 10,000/day default limit (1.5), ignoring the other seven sets and retries | arithmetic on 2.1 and 1.5 | computed 2026-11-23 from the cited figures |
| 2.3 | eBay's documented escalation path for higher limits is the Application Growth Check | 1 policy statement | https://developer.ebay.com/develop/api-call-limits, fetched 2026-11-23. **Vendor source: eBay.** |

Implication for the claim's wording: a bulk "map each variant" pass is rate-bound by design. The
realistic shape is incremental (map on demand or per-set slices, cache the ePID in
`cards.ebay_epid`, never re-search a mapped variant). Note the app's own table is the wrong
population for sizing anyway - its row count is unknown (C006's standing gap); the checklist
variant counts in 2.1 are the honest input population.

## 3. What exists in the app today

| # | Fact | Population / sample | Source |
|---|---|---|---|
| 3.1 | `cards.ebay_epid` (text, nullable) already exists | 1 column, migration applied | supabase/migrations/0001_init.sql:52 at `74f71cb` |
| 3.2 | The importer already ingests an "eBay catalog ID (ePID)" sheet column and keeps only pure-numeric values, storing the neighbouring title as `ebay_catalog_title` (notes like "No Aqua Holo Foil..." are rejected as ePIDs and go to notes) | 1 importer path, lib/importer.ts:29,61,243,270-277 | read 2026-11-23 |
| 3.3 | S12's story text requires: search by year + set + player + card #, then pick the parallel using `ebay-catalog-parallel-mapping.md` from the Whatnot project, and **never assign silently** - candidates go to the user for confirmation | 1 story, docs/STORIES.md:267-269 | read 2026-11-23 |
| 3.4 | The referenced file `ebay-catalog-parallel-mapping.md` **does not exist on this machine** (filesystem-wide find returned nothing), so the parallel-name mapping that S12 depends on is an external dependency that is not yet reachable from this repo | 1 filesystem search, full `/`, 2026-11-23 | find command output, this session |

## 4. The falsifier: what can and cannot be tested today

- **Clause 1 ("production Catalog search rejects the app scope").** Untestable in production
  right now, and I did not try to force it. The production keyset is live (client-credentials
  token minted 2026-11-22, docs/EBAY_SANDBOX.md lines 4-11), but the **user-token flow is not**:
  no redirect URL / RuName is registered yet (same file, lines 13-14), so no user token exists,
  so no production Catalog call of either token type has been attempted against
  `product_summary/search`. Spec evidence (1.2) predicts the application token is refused; the
  community report (1.4) predicts `sell.inventory` is grantable in production. Prediction, not
  observation - the honest status is "documented, unobserved".
- **Clause 2 ("a mapped ePID resolves to a different card").** The API gives the verification
  tool: `getProduct` returns the full product (title, aspects, identifiers) for any ePID, so a
  wrong pick is checkable before use (1.1/1.2 sources). The residual risk is caller judgement,
  which S12 already contains by requiring human confirmation (3.3). No public evidence
  quantifies how often keyword-matched ePIDs are wrong for cards; none found, stated as a gap.
- **Catalog coverage of card parallels (the claim's fallback premise).** The claim asserts most
  parallels, numbered prints and autos have no catalog entry. **No authoritative public source
  quantifies eBay's catalog coverage of sports-card parallels.** I searched for such evidence and
  stopped where it ran out. What exists is blog-grade: a TCG-marketplace comparison asserting
  "eBay has no catalog" for TCG singles (Medium, 2026-07-28, hobby commentary), and two
  listing-tool vendor blogs (flowlister.com 2026-07-30, sparedollar.io, both commercial
  interests - they sell listing software and benefit from framing catalog gaps) saying catalog
  match rates drop sharply for items without barcodes and that eBay's scan-to-list computer
  vision covers Pokemon/Magic/Yu-Gi-Oh!, not sports cards. None of these measure the eBay
  catalog's football-card parallel coverage. **Explicit gap: the coverage fraction is unknown
  and unmeasurable until production user-token searches run** - the fallback's necessity is
  plausible, its extent is not evidenced.
- **The fallback's endpoint is ambiguous in the claim's wording.** "Fall back to a keyword query
  built from the checklist fields" can mean (a) the same Catalog search with `q=` keywords
  (supported, same 10k/day budget, same user-token requirement), (b) the Browse API
  item search (Buy APIs **require an additional license** per eBay's limits page, fetched
  2026-11-23) or (c) the legacy Shopping API `FindProducts` (catalog keyword search, per eBay's
  PBSE workflow docs) or Trading API `findItemsByKeywords` (5,000/day, works under the
  application token). Reading (c) is the only fallback that stays inside the token the harness
  already holds. This choice is open and belongs to the challenge round.

## 5. Sources, with interest flags

- developer.ebay.com method pages for `search` and `getProduct`, and the API Call Limits page,
  authorization guide and PBSE workflow pages - **eBay is the vendor of the API; these are the
  primary spec and there is no independent equivalent.** Fetched 2026-11-23.
- community.ebay.com scope thread - peer developer experience, no commercial interest apparent,
  undated page, accessed 2026-11-23.
- benstonetcg.medium.com (2026-07-28), flowlister.com (2026-07-30), sparedollar.io (2026) -
  commentary and listing-tool vendors with a commercial interest in the catalog-gap narrative;
  used only as directional colour, never as measurement.

## 6. Bottom line for the verdict

The claim's mechanism exists and is spec-documented, but two of its premises are already
contradicted or unproven by the evidence gathered today:

1. The primary path cannot run under the "app scope" at all - it needs a user token with
   `sell.inventory` (1.2, 1.3), which makes the falsifier's first clause a near-certainty for any
   implementation that starts from the existing client-credentials token, and couples S12 to S11's
   unfinished OAuth consent step.
2. The fallback premise (catalog coverage gaps) is plausible but has no measurement behind it,
   and the mapping file S12 names is not present on this machine (3.4).
3. A per-variant mapping pass is rate-bound (2.2): ~69k searches for two sets against a 10k/day
   default. The claim should be read as "map incrementally and cache", not "map the checklist".

The falsifier itself remains untested in production and cannot be tested until S11's user-token
flow exists. No production call was made for this round.
