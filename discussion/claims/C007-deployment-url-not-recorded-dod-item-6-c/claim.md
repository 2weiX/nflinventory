---
id: C007
title: Deployment URL not recorded; DoD item 6 cannot run
status: settled
verdict: settled
round: 0
confidence: unknown
falsifier: No Vercel preview URL exists in HANDOFF; the browser visual pass is blocked - settles the moment Dennis supplies the URL.
decides: []
opened: 2026-11-22
---

## Claim

Deployment URL not recorded; DoD item 6 cannot run

## Why it matters

TODO - which decision depends on this.

## Falsifier

No Vercel preview URL exists in HANDOFF; the browser visual pass is blocked - settles the moment Dennis supplies the URL.

## Resolution (2026-11-23)

The app is live at **https://nflinventory-weld.vercel.app** - deployed by the Mac story agent
(HANDOFF 2026-11-23 entry): Vercel env vars set, Supabase Site URL + redirect pointed at the
domain, Dennis's account created, public sign-ups disabled. The harness browser verified the
login wall renders (title "NFL Inventory", /login, no env-var crash). The visual QA pass on the
inner pages needs Dennis's login session; the DoD item can run whenever he walks the app or
grants a test session.
