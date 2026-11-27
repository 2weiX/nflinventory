---
id: C009
title: S7 auth: Supabase OAuth 2.1 server lets claude.ai add the inventory MCP as a custom connector, with tool calls running under RLS as the user
status: settled
verdict: settled
round: 4
confidence: medium
falsifier: Falsified if Supabase's OAuth server (beta) cannot complete claude.ai's custom-connector flow (discovery, dynamic client registration or PKCE fails), or if a token it issues does not run Postgres queries as that user under row-level security. Then S7 needs its own OAuth layer in Next.js or a simpler token scheme.
decides: [S7]
opened: 2026-11-23
---

## Claim

S7 auth: Supabase OAuth 2.1 server lets claude.ai add the inventory MCP as a custom connector, with tool calls running under RLS as the user

## Why it matters

S7 is the P0 story. Its acceptance needs claude.ai to add `/api/mcp` as a custom connector with OAuth 2.1 and every tool call scoped to the signed-in user. The Supabase project shows an "OAuth Server (beta)" in Authentication. If it works with claude.ai, S7 needs no hand-written OAuth; if not, the story must budget for its own auth layer. Decides how S7 is built.

## Falsifier

Falsified if Supabase's OAuth server (beta) cannot complete claude.ai's custom-connector flow (discovery, dynamic client registration or PKCE fails), or if a token it issues does not run Postgres queries as that user under row-level security. Then S7 needs its own OAuth layer in Next.js or a simpler token scheme.

## Resolution (2026-11-27, r04 settle)

Settled: S7 can be built as written - Supabase Auth as the OAuth 2.1 identity provider, a claude.ai
custom connector, tool calls as the signed-in user under RLS. Neither falsifier clause is met.

R3 left the claim open for one reason: no completed claude.ai flow had ever been observed in public,
and the single adverse report (`supabase/auth#2820`) had never been reproduced. R4 found the missing
evidence in `github.com/anthropics/claude-ai-mcp`, a tracker no earlier round had searched:

- **#1231** (2026-11-06): a Next.js `/api/mcp` app using Supabase Auth completed claude.ai DCR,
  consent and token exchange; the reporter's hand-run replay with Claude's exact parameters (public
  DCR client, PKCE S256, `scope=openid email profile offline_access`, `resource=<connector URL>`)
  ended in an authenticated `tools/call` and a working refresh rotation. That refutes r02's central
  prediction that `resource`, `offline_access` or a public client each independently break consent.
- **#1231 resolution**: the post-token failure was claude.ai refusing to hand a token to a
  `*.trycloudflare.com` tunnel host - reproduced with the reporter's own fully-RFC-8707-compliant
  authorization server, "so Supabase is ruled out". On the production domain the connector worked.
  S7 runs on `nflinventory-weld.vercel.app`, so this failure mode does not apply.
- **#1289, #565**: other connector failures traced to claude.ai-side 429 rate limiting and to
  app-side protected-resource metadata mismatch respectively, not to Supabase's OAuth protocol.
- RLS half unchanged: vendor-documented, now with a worked middleware example
  (`withSupabase({ auth: 'user' })`, "scoped to the signed-in user"). No counter-evidence.

Build obligations that remain (all already S7 acceptance criteria, not open questions): build the
consent UI; validate JWT signature + issuer + `client_id` in-app because `aud` is always
`"authenticated"`; never use the service role for tool calls; pass the two-user isolation test.
Still Dennis's action: enable Authentication > OAuth Server on the project (still returns 404
`feature_disabled` as of 2026-11-27) and set the Authorization Path; DCR optional. DCR registrations
accumulate per reconnect (`supabase/auth#2850`) - hygiene, not a blocker.

