---
id: C002
title: Import undo cascades into sales
status: open
verdict: open
round: 0
confidence: unknown
falsifier: Undo deletes cards by batch and sales reference card_id with on delete cascade; the confirm dialog mentions edited cards but not sales - falsified if undo no longer deletes sales or the dialog warns.
decides: []
opened: 2026-11-22
---

## Claim

Import undo cascades into sales

## Why it matters

TODO - which decision depends on this.

## Falsifier

Undo deletes cards by batch and sales reference card_id with on delete cascade; the confirm dialog mentions edited cards but not sales - falsified if undo no longer deletes sales or the dialog warns.
