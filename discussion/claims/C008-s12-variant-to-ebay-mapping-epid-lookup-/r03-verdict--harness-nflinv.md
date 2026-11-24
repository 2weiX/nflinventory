---
claim: C008-s12-variant-to-ebay-mapping-epid-lookup-
round: 3
role: adjudicator
model: claude-sonnet-5-5
harness: nflinv
date: 2026-11-24
verdict: weakened
---

# R3 verdict: C008 is weakened - mechanism real, wording wrong, falsifier untested

**Independence.** r01 = z-ai/glm-5.3-flash, r02 = moonshotai/kimi-k3.1-pro:free. I am claude-sonnet-5-5, the
roster's adjudicator, in neither round; the challenge is from a model other than the researcher's, so it
carries full weight.

**Method.** I re-read `docs/EBAY_SANDBOX.md`, the S11/S12 text in `docs/STORIES.md`, and ran a filesystem
find for the mapping file on 2026-11-24. I made no network call and no eBay call, and I did not touch the
database. The eBay API facts (user token required for Catalog `search`/`getProduct`, 10,000 calls/day) are
r01's reading of eBay's pages; **I did not re-fetch them**, so they are carried, not verified, here.

## Verified / recomputed

| Item | Result |
|---|---|
| 43,770 + 25,091 | = 68,861. Correct. |
| 68,861 / 10,000 | 6.89, so at least 7 days. Correct, with r01's own caveat: the dagger means per-user limits are unpublished. |
| `docs/EBAY_SANDBOX.md:32-34` says client credentials serve "catalog/category reads" | **Confirmed present.** r01 says that is wrong for Catalog; if r01's spec reading holds, the repo note is wrong. |
| No production user token exists; no RuName registered | Confirmed (`EBAY_SANDBOX.md:13-14`). |
| `ebay-catalog-parallel-mapping.md` | `find /` returns nothing here. Confirmed absent **on this machine**. |
| S12 requires confirmation, never silent assignment | Confirmed (`STORIES.md`, S12 section). |

## Weighing the objections

- **A (primary path impossible with held credentials) - upheld in part, overstated.** The client-credentials
  token cannot run Catalog search, if r01 is right. But S11 is already specced as a **user-token
  `sell.inventory`** flow, and S12 is marked ⏳ behind it. So the claim is not impossible; it is
  **sequenced after S11**. The falsifier's "rejects the app scope" is ambiguous. If "app scope" means the
  existing client-credentials token, it is near-certain to fail (r01 §1.2). If it means S11's `sell.inventory`
  user token, it is untested; r01 §1.4's anecdote says that works in production. r01 called the first clause
  "a near-certainty" without saying which reading; that is a reading of the claim, not an observation.
- **B (68,861 searches) - arithmetic right, target wrong.** Both sides sized the work on the **checklist**
  (43,770 + 25,091 variants). S12 as written maps "cards without an ePID", meaning rows in the app's inventory.
  That count is unknown (the C006 gap). The 7-day figure applies only to a bulk checklist pass nobody has
  proposed. The claim's word "each variant" invites the misreading; the story does not. Rate limits do force
  incremental, cached mapping, which the story already implies.
- **C (fallback ambiguous) - upheld, and the story answers it differently than the claim.** S11 already says
  the draft uses the ePID "otherwise title + category 261328 + item specifics". So the real fallback is
  **no ePID plus item specifics**, which needs no catalog search at all. The claim's "keyword query" fallback
  is a second, search-based path the story does not ask for. r01 §4 lists three endpoints; the challenger adds
  that they are "deprecated", which nobody sourced. r01's "Trading API `findItemsByKeywords`" mixes up the
  Finding and Trading APIs; I do not rely on it.
- **D (missing mapping file) - upheld, discounted.** The file is named as living in the Whatnot project,
  which may be on Dennis's Mac. Absence on this machine shows an unreachable dependency, not a nonexistent one.
  It remains a real blocker for the parallel-selection step.
- **E (coverage unmeasured) - upheld.** No source measures eBay's football parallel coverage. The claim's
  "most parallels, numbered prints, autos" is unsupported. That is the only number-shaped premise, and it has
  no number.
- **F (second clause already mitigated) - refuted as stated.** The falsifier says "a mapped ePID resolves to
  a different card **on lookup**". That is a `getProduct` verification check, not "the first bad candidate
  a human rejects". The challenger misread it. A narrower point survives: nothing defines the verification
  step or its pass rate.
- **G (importer already ingests ePIDs) - upheld.** `lib/importer.ts` already keeps numeric ePIDs from the
  sheet. The addressable set is cards where `ebay_epid IS NULL`, size unknown. The claim never says so.

## Both sides were partly wrong

- **r01** treated the falsifier's first clause as near-certain without fixing which token "app scope"
  means. It also sized the work on the wrong population and mislabelled one API.
- **r02** repeated the wrong population in B, misread F, and added the unsourced "deprecated" claim in C. It
  did land the real points: C (fallback ambiguity) and E (coverage unmeasured).
- **The repo** acted on a stale assumption in `EBAY_SANDBOX.md` (client credentials for catalog reads).
  That note should be corrected once r01's reading is confirmed against a live call.

## Unresolved, labelled

1. **Does the production Catalog search accept a `sell.inventory` user token for this app?** Conflict
   between the eBay method pages (both scopes listed, no environment qualifier) and one community report
   (`commerce.catalog.readonly` not grantable in production). **Unresolved; only a live call after S11
   settles it.** This is the claim's actual falsifier, and it is not yet tested.
2. **Whether catalog hit rates are high enough that a search-based fallback is needed.** No data.
3. **Size of the unmapped set.** Unknown without reading the database, which discussion agents must not do.

## Verdict: weakened

The mechanism is real and documented. The claim as worded is not safe to build from:
- "Map each variant" should read "map cards without an ePID, on demand, cache in `cards.ebay_epid`".
- The fallback is not specified: the story's no-ePID path (item specifics) is a different thing from a keyword
  search.
- The falsifier's token reading is ambiguous.
- Clause 1 is **unresolved** and cannot be tested before S11 ships a user token.
- Clause 2 is testable via `getProduct` but has no defined pass criterion.

Confidence: **medium-low**. The two strongest findings (user-token requirement, missing coverage data) rest on
eBay pages I did not re-fetch.

## Recommended filing for the next circle

1. **Story agent, docs only:** correct `docs/EBAY_SANDBOX.md` lines 32-34 to say Catalog needs a user token
   (verify at S11 time).
2. **Amend the claim wording:** "unmapped cards, on demand, cached; fallback = S11 item-specifics listing
   with no ePID; falsifier clause 1 = first production `product_summary/search` with S11's `sell.inventory`
   user token".
3. **After S11:** run a 100-card sample (base, parallels, numbered, autos) and record hit and wrong-card rates.
   Do that before building any search-based fallback.
4. **Ask Dennis** where `ebay-catalog-parallel-mapping.md` lives and whether it can be vendored.
