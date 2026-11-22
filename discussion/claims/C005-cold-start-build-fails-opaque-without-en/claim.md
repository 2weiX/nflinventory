---
id: C005
title: Cold-start build fails opaque without env vars
status: open
verdict: open
round: 0
confidence: unknown
falsifier: Fresh checkout without the two Supabase env vars throws at lib/supabase.ts import; needs README note or a lazy client - falsified if the documented build path succeeds.
decides: []
opened: 2026-11-22
---

## Claim

Cold-start build fails opaque without env vars

## Why it matters

TODO - which decision depends on this.

## Falsifier

Fresh checkout without the two Supabase env vars throws at lib/supabase.ts import; needs README note or a lazy client - falsified if the documented build path succeeds.
