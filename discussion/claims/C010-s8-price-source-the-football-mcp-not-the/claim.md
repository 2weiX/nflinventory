---
id: C010
title: S8 price source: the football MCP, not the eBay API, is the right source for each card's Price (last comp)
status: open
verdict: open
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
