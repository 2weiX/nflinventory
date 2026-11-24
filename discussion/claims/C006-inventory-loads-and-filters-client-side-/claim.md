---
id: C006
title: Inventory loads and filters client-side; scale limit unmeasured
status: settled
verdict: settled (owner decision)
round: 3
confidence: low
falsifier: loadAllCards pages the whole table and filters in memory; the design observation needs a live row-count range from the owner before it is a defect.
decides: []
opened: 2026-11-22
---

## Claim

Inventory loads and filters client-side; scale limit unmeasured

## Why it matters

TODO - which decision depends on this.

## Falsifier

loadAllCards pages the whole table and filters in memory; the design observation needs a live row-count range from the owner before it is a defect.

## Owner decision (2026-11-24)

Dennis: "hundreds for now". The client-side load and filter stands; server-side pagination is
deferred until the inventory leaves the hundreds. Re-open if an import pushes it past ~1,000
rows or the list feels sluggish.
