---
id: C008
title: S12 variant-to-eBay mapping: ePID lookup with checklist-keyword fallback
status: adjudicated
verdict: weakened
round: 3
confidence: medium
falsifier: Map each variant to an eBay ePID via the Catalog API product search (player + set + card number); where the catalog has no entry - most parallels, numbered prints, autos - fall back to a keyword query built from the checklist fields (card no, player, parallel, set, RC/auto flags). Falsified if production Catalog search rejects the app scope or a mapped ePID resolves to a different card on lookup.
decides: []
opened: 2026-11-23
---

## Claim

S12 variant-to-eBay mapping: ePID lookup with checklist-keyword fallback

## Why it matters

TODO - which decision depends on this.

## Falsifier

Map each variant to an eBay ePID via the Catalog API product search (player + set + card number); where the catalog has no entry - most parallels, numbered prints, autos - fall back to a keyword query built from the checklist fields (card no, player, parallel, set, RC/auto flags). Falsified if production Catalog search rejects the app scope or a mapped ePID resolves to a different card on lookup.
