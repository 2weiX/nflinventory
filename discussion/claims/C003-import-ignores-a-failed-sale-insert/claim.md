---
id: C003
title: Import ignores a failed sale insert
status: open
verdict: open
round: 0
confidence: unknown
falsifier: A sold card may exist without its sale record if the sale insert fails after the card insert; falsified by a transaction wrap or explicit failure surfacing.
decides: []
opened: 2026-11-22
---

## Claim

Import ignores a failed sale insert

## Why it matters

TODO - which decision depends on this.

## Falsifier

A sold card may exist without its sale record if the sale insert fails after the card insert; falsified by a transaction wrap or explicit failure surfacing.
