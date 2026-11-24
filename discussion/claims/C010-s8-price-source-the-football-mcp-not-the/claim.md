---
id: C010
title: S8 price source: the football MCP, not the eBay API, is the right source for each card's Price (last comp)
status: settled
verdict: settled (owner decision)
round: 0
confidence: unknown
falsifier: Falsified if eBay grants Marketplace Insights (sold-item history) to this app, or if the football MCP lacks prices for more than a quarter of the cards in the inventory (Midnight, Flagship, Inception, Chrome), or if storing eBay API data is compatible with the keyset's 'I do not persist eBay data' exemption.
decides: [S8, S12]
opened: 2026-11-23
---

## Claim

S8 price source: the football MCP, not the eBay API, is the right source for each card's Price (last comp)

## Why it matters

Dennis's "Price" is the last researched eBay comp (`cards.comp_cents`, migration 0002). Sold-price history from eBay needs the Marketplace Insights API, a limited release that needs eBay's approval. The Browse API only shows asking prices. The football MCP on the harness already serves card prices for these sets. The eBay keyset is exempt from account-deletion notices on the basis that the app stores no eBay data. Decides where S8 reads prices from and whether S12 may store eBay data.

## Falsifier

Falsified if eBay grants Marketplace Insights (sold-item history) to this app, or if the football MCP lacks prices for more than a quarter of the cards in the inventory (Midnight, Flagship, Inception, Chrome), or if storing eBay API data is compatible with the keyset's 'I do not persist eBay data' exemption.

## Owner decision (2026-11-24)

Dennis: the football MCP stays the primary price source for the card page (stable, cached, free
of API budget), AND the app gains a separate column/section with eBay comps for the same card -
"the last three comps". Sequencing note from the platform facts: live asking prices (Browse API)
are available with the production keys today; SOLD comps (Marketplace Insights) are behind the
growth check. Build the column on the last-3 asking prices first, upgrade it to sold comps when
the access lands. The eBay lookups are on-demand per card view/listing, cached - never a bulk
crawl (see the C008 adjudication for the corrected mapping shape).
