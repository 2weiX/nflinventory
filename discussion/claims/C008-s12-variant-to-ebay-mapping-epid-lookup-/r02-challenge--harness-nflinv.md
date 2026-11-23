---
claim: C008-s12-variant-to-ebay-mapping-epid-lookup-
round: 2
role: challenger
model: moonshotai/kimi-k3.1-pro:free
harness: nflinv
date: 2026-11-23
---

# R2 challenge: ePID lookup with checklist-keyword fallback

I argue **against** the claim as a sound, executable design. The researcher established that the Catalog API mechanism exists on paper and that no production call has ever been made. What the claim actually proposes is an unmeasured, rate-bound, multi-variant mapping pass whose primary token type is refused by the vendor spec, whose fallback is ambiguous, whose parallel-mapping dependency is missing, and whose volume arithmetic makes it impractical. The claim should not be settled in its current wording.

---

## 1. Explicit concessions

I cannot dispute the following; I accept them and argue around them:

- **C1. The Catalog API search and getProduct methods exist and return ePIDs.** eBay's own documentation confirms `GET /commerce/catalog/v1_beta/product_summary/search` and `getProduct` (r01 §1.1).
- **C2. Both methods require a user token, not an application token.** The spec says the authorization-code grant with `sell.inventory` or `commerce.catalog.readonly` is required; client credentials are refused (r01 §1.2).
- **C3. `cards.ebay_epid` and `ebay_catalog_title` already exist and are imported.** Migration `0001_init.sql:52` and `lib/importer.ts:243-277` confirm this.
- **C4. S12 already requires human confirmation of candidates.** `docs/STORIES.md:269`: "Shows the candidates for confirmation; never assigns one silently."
- **C5. The fallback premise is plausible.** Most parallels, numbered prints and autos likely lack catalog entries; the claim's direction is reasonable even if unmeasured.

I concede the *mechanism* and the *direction*. I challenge the claim's **executability**, **scope**, and **unstated assumptions**.

---

## 2. Objections to the claim, rated

### Objection A — The claim's primary path is impossible with the credentials the project actually holds
**Rating: strong**

The claim says "Map each variant to an eBay ePID via the Catalog API product search." The researcher proved this requires a user token (r01 §1.2). The project does not have a user-token flow: no redirect URL / RuName is registered (`docs/EBAY_SANDBOX.md:13-14`), and the only production token ever minted was a client-credentials token on 2026-11-22. The repo's own working note still wrongly assumes catalog reads work under client credentials (r01 §1.3).

Therefore the claim, read literally, proposes an operation that **cannot execute today and cannot execute without first building S11's OAuth consent step**. The falsifier's first clause — "production Catalog search rejects the app scope" — is not a hypothetical risk; it is the documented default outcome for any implementation that starts from the existing keyset. The claim pretends this is a fallback design problem when it is actually a missing-prerequisite problem.

**Evidence that would settle this:** A registered eBay redirect URL and a successful production authorization-code grant yielding a user token with `sell.inventory` scope, followed by one successful `product_summary/search` call. Until then, the claim is speculative architecture, not a tested design.

### Objection B — The volume arithmetic makes "map each variant" impractical
**Rating: strong**

The researcher calculated that Flagship 2026 + Chrome 2026 alone require **68,861 searches** (r01 §2.2). At the default 10,000 calls/day limit, that is **at least 7 days** of continuous API usage for two sets, ignoring the other seven sets in the football MCP, retries, and the `getProduct` verification calls the claim implies.

The claim's wording "Map each variant" suggests a bulk pass. That is rate-bound by design. A realistic implementation must be incremental (map on demand or per-set slices, cache the ePID, never re-search a mapped variant), but the claim does not say this. It presents ePID lookup as a straightforward per-variant operation without acknowledging that the API quota forces a different shape.

**Evidence that would settle this:** eBay approving an Application Growth Check that raises the daily limit high enough to cover the full checklist population in a reasonable window, or a revised claim wording that explicitly scopes the mapping to on-demand/incremental with caching.

### Objection C — The fallback endpoint is ambiguous and may be unusable
**Rating: moderate**

The claim says "fall back to a keyword query built from the checklist fields." The researcher identified three possible readings (r01 §4): (a) the same Catalog search with `q=`, (b) Browse API item search, or (c) legacy Shopping/Trading APIs. These are not equivalent:

- (a) stays inside the same user-token requirement and 10k/day budget, so it does not solve the token problem and adds to the rate problem.
- (b) requires an additional license per eBay's limits page.
- (c) works under the application token the project already holds, but uses deprecated APIs with their own limits (5,000/day for Trading).

The claim does not specify which fallback it means. An implementer cannot build against this wording without making an architectural choice that the claim should have made explicit.

**Evidence that would settle this:** The claim amended to name the exact API, method, token type, and daily limit for the fallback path, plus a spike proving that endpoint returns usable results for at least one parallel variant.

### Objection D — The parallel-mapping dependency is missing and unverifiable
**Rating: strong**

S12 requires picking the parallel using `ebay-catalog-parallel-mapping.md` from the Whatnot project (`docs/STORIES.md:268`). The researcher searched the entire filesystem and found no such file (r01 §3.4). The claim assumes this mapping exists and is usable, but it is an external dependency that is not reachable from this repo.

Without the parallel-name mapping, the keyword fallback cannot reliably distinguish a base card from a Silver Prizm from a /99 auto. The claim treats this as a solved input when it is actually an open dependency.

**Evidence that would settle this:** The file `ebay-catalog-parallel-mapping.md` added to the repo or vendored with a license-compatible source, plus a unit test showing it maps at least the parallels present in the imported checklist data.

### Objection E — The catalog-coverage gap is unmeasured, so the fallback's necessity is speculative
**Rating: moderate**

The claim asserts "where the catalog has no entry - most parallels, numbered prints, autos." The researcher searched for authoritative coverage data and found none (r01 §4). What exists is blog-grade commentary from listing-tool vendors with a commercial interest in the catalog-gap narrative.

If coverage is actually high for the specific sets Dennis collects, the fallback may rarely fire and the claim over-engineers. If coverage is low, the primary path is mostly useless and the claim should have led with keyword search. Either way, the claim's central design choice is not evidence-based.

**Evidence that would settle this:** A sample of production user-token Catalog searches across a representative slice of the checklist (e.g., 100 variants spanning base, parallels, numbered prints, autos) with hit/miss rates recorded. Until then, the fallback's extent is unknown.

### Objection F — The falsifier's second clause is weak and already mitigated
**Rating: weak**

The falsifier says the claim is falsified if "a mapped ePID resolves to a different card on lookup." But the API provides `getProduct` to verify any ePID before use (r01 §4), and S12 already requires human confirmation (C4). A wrong candidate is therefore checkable and, under the story's own acceptance criteria, must be shown to a human before assignment.

The residual risk is not that the system silently maps wrong cards; it is that a human confirms a wrong candidate. That is a UX/training problem, not a falsifier of the lookup mechanism. The clause as written would falsify the claim on the first bad candidate even if the human rejects it, which is too broad.

**Evidence that would settle this:** A revised falsifier that measures the *rate* of wrong candidates after human confirmation, or a requirement that `getProduct` verification must pass before any candidate is shown.

### Objection G — The claim does not engage with the existing import path
**Rating: moderate**

The importer already accepts an "eBay catalog ID (ePID)" sheet column and stores it in `cards.ebay_epid` (r01 §3.2). Many cards may already have ePIDs from Dennis's existing spreadsheets. The claim's "Map each variant" wording implies starting from zero, but the real task is "map variants that do not already have an ePID."

This matters for volume: if the existing collection is already partially mapped, the incremental search load is smaller than Objection B suggests. The claim should have scoped itself to the unmapped subset and acknowledged the import path.

**Evidence that would settle this:** A count of `cards` rows where `ebay_epid IS NULL` versus total, or a revised claim wording that explicitly targets only unmapped variants.

---

## 3. Summary

I concede the API mechanism, the token requirement, the existing schema, and the human-confirmation safeguard. I object that the claim:

1. Proposes a primary path that cannot execute with the project's current credentials (strong).
2. Ignores rate limits that make "map each variant" impractical as written (strong).
3. Leaves the fallback endpoint ambiguous across three incompatible APIs (moderate).
4. Depends on a parallel-mapping file that does not exist on this machine (strong).
5. Assumes an unmeasured catalog-coverage gap (moderate).
6. Uses a falsifier clause that is already mitigated by the story's own confirmation requirement (weak).
7. Fails to scope itself to the unmapped subset given the existing importer (moderate).

The claim should not be settled as written. The honest verdict is **"spec-documented but unexecutable and unmeasured; rewrite as an incremental, cached, user-token-gated mapping task with an explicit fallback endpoint and a vendored parallel mapping, or block until S11's OAuth flow exists."**

---

## 4. Source-interest flags

- All repo citations are first-party code/docs read 2026-11-23.
- eBay developer documentation is the vendor's own spec; there is no independent equivalent.
- No third-party market, pricing, or listing-tool source was relied upon for this challenge.
- I have no commercial interest in whether the claim stands.
