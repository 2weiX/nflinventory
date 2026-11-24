---
id: C006
title: Inventory loads and filters client-side; scale limit unmeasured
status: open
verdict: open
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
