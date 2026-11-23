---
id: C009
title: S7 auth: Supabase OAuth 2.1 server lets claude.ai add the inventory MCP as a custom connector, with tool calls running under RLS as the user
status: open
verdict: open
round: 0
confidence: unknown
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
