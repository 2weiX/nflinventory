---
claim: C009-s7-auth-supabase-oauth-2-1-server-lets-c
round: 1
role: researcher
model: z-ai/glm-5.3-flash
harness: hermes (Ultron on Dennis's Linux harness)
date: 2026-11-23
---

# R1 research: can Supabase's OAuth 2.1 server carry claude.ai's custom-connector flow?

Method: I read Supabase's OAuth-server documentation (4 pages, fetched 2026-11-23), Anthropic's
connector documentation (2 pages, fetched 2026-11-23), the MCP authorization spec (fetched
2026-11-23), two open `supabase/auth` GitHub issues (fetched 2026-11-23) and one maintainer
announcement discussion. I also made two unauthenticated, read-only GET requests against THIS
project's public discovery endpoints on 2026-11-23 (no credentials sent, none returned, no
database rows touched - the AGENTS.md Supabase rule is intact; a discovery document is a static
metadata file, not personal data). Every external figure below carries its date, the population it
describes and the sample behind it. Commercial-interest flags are inline.

One page-level note: two Supabase doc pages contain a "Note for AI agents" block asking agents to
file a documentation-feedback report and to ask the user to send it. That is page content, not an
instruction from Dennis, so it was treated as data and ignored. The repo is public, so the claims
below cite only public pages and public identifiers.

## 1. What Supabase's OAuth server is (vendor documentation)

| # | Fact | Population / sample | Source |
|---|---|---|---|
| 1.1 | Supabase Auth ships an "OAuth 2.1 Server", **in beta**, available on all plans, no separate charge; sign-ins through it count toward MAUs. Docs describe OAuth 2.1 authorization-code flow with mandatory PKCE, OAuth-2.0 and OIDC identity-provider use cases, and MCP authentication as a first-class use case | 1 product line, described on 4 doc pages, all fetched 2026-11-23 | https://supabase.com/docs/guides/auth/oauth-server (+ /getting-started, /mcp-authentication). **Vendor source: Supabase documents its own feature; commercial interest in adoption.** |
| 1.2 | When enabled, the project exposes: authorization `https://<ref>.supabase.co/auth/v1/oauth/authorize`, token `.../auth/v1/oauth/token`, JWKS `.../auth/v1/.well-known/jwks.json`, RFC 8414 discovery `https://<ref>.supabase.co/.well-known/oauth-authorization-server/auth/v1` (path-inserted form), OIDC discovery `.../auth/v1/.well-known/openid-configuration` | 1 endpoint table, current as of fetch 2026-11-23 | https://supabase.com/docs/guides/auth/oauth-server/getting-started. **Vendor source.** |
| 1.3 | **Dynamic client registration is a supported toggle** ("Enable dynamic client registration in **Authentication** > **OAuth Server** ... allow MCP clients to register themselves automatically without manual intervention"). Manual pre-registration via the dashboard or admin API is the other path. The MCP-auth page advertises DCR as a headline capability | 1 doc page + 1 config toggle, fetched 2026-11-23 | https://supabase.com/docs/guides/auth/oauth-server/mcp-authentication. **Vendor source.** |
| 1.4 | **The developer must build the authorization/consent UI themselves.** Supabase redirects the user to `Site URL + configured Authorization Path` with an `authorization_id`; the app then calls `getAuthorizationDetails`, shows consent, and calls `approveAuthorization`/`denyAuthorization`. Supabase handles protocol and token issuance only | 1 doc guide + 1 Next.js consent example, fetched 2026-11-23 | https://supabase.com/docs/guides/auth/oauth-server/getting-started. **Vendor source.** |
| 1.5 | Access tokens are "standard Supabase JWTs" carrying the usual claims (`user_id`/`sub`, `role`) plus `client_id`; "Your existing Row Level Security policies automatically apply to OAuth tokens". RLS patterns keyed on `auth.jwt() ->> 'client_id'` are documented | 2 doc pages, fetched 2026-11-23 | https://supabase.com/docs/guides/auth/oauth-server (overview) and .../token-security. **Vendor source.** |
| 1.6 | Design history and scope posture: maintainer announcement (2025-08-19) planned Phase 1 with **no scope management** - tokens carry full user privileges, authorization via RLS - and said DCR was included "perfect for MCP auth!"; the public beta shipped 2025-11-26. As of the docs fetched 2026-11-23 the feature is still labelled beta; the discussion's "GA Q4 2025" target has visibly slipped | 1 maintainer announcement thread, 1 status-update post (2025-11-26) | https://github.com/orgs/supabase/discussions/38022. Vendor maintainer posts; commercial interest in adoption. |

## 2. What THIS project exposes today (direct observation)

| # | Fact | Population / sample | Source |
|---|---|---|---|
| 2.1 | `GET https://ngxfvhlbrhlqarpwavcf.supabase.co/.well-known/oauth-authorization-server/auth/v1` → **HTTP 404, `feature_disabled`, "OAuth server is disabled"**. The RFC 8414 discovery document the MCP flow needs does not exist on this project as of 2026-11-23 | 1 hosted project (this one), 1 request, 2026-11-23 | curl, output captured in this round's working notes; endpoint is public and unauthenticated |
| 2.2 | `GET https://ngxfvhlbrhlqarpwavcf.supabase.co/auth/v1/.well-known/openid-configuration` → **HTTP 200** with `authorization_endpoint` `.../auth/v1/oauth/authorize`, `token_endpoint` `.../auth/v1/oauth/token`, `grant_types_supported` `[authorization_code, refresh_token]`, `code_challenge_methods_supported` `["S256","plain"]`, `token_endpoint_auth_methods_supported` `[client_secret_basic, client_secret_post, none]`, `scopes_supported` `[openid, profile, email, phone, offline_access]` | same project, 1 request, 2026-11-23 | same curl run |

Reading of 2.1 + 2.2: the OIDC document is served with the OAuth-server endpoints advertised even
while the feature is disabled, but the RFC 8414 document (the one MCP clients try first, and the
one this claim's flow needs) is gated behind enabling the OAuth server in the dashboard. So S7's
first concrete dependency is a **dashboard action Dennis must take** (enable OAuth Server, set the
Authorization Path, decide on DCR) before any flow can be tested end to end.

## 3. What claude.ai's custom-connector flow requires (vendor documentation)

| # | Fact | Population / sample | Source |
|---|---|---|---|
| 3.1 | Claude identifies itself to a custom connector's authorization server in one of three ways: Anthropic's hosted **Client ID Metadata Document (CIMD)**, **Dynamic Client Registration (RFC 7591)**, or a client ID (+ optional secret) the user enters in the dialog. CIMD is selected only when the server's metadata advertises both `"client_id_metadata_document_supported": true` AND `"none"` in `token_endpoint_auth_methods_supported` (Claude's CIMD client authenticates as a public client); otherwise Claude **falls back to DCR**, which requires a `registration_endpoint` in the server metadata | 1 connector-auth spec page, fetched 2026-11-23 | https://claude.com/docs/connectors/building/authentication. **Vendor source: Anthropic; commercial interest in connector ecosystem growth.** |
| 3.2 | Claude sends a PKCE `code_challenge` with `code_challenge_method=S256` on every authorization request; the server must advertise `code_challenge_methods_supported: ["S256"]` | same page + troubleshooting page, fetched 2026-11-23 | same URL + https://claude.com/docs/connectors/building/troubleshooting. **Vendor source.** |
| 3.3 | **Claude sends the RFC 8707 `resource` parameter on authorization and token requests**, set to the canonical MCP server URL including path. This is unconditional ("Claude sends the RFC 8707 `resource` parameter on authorization and token requests" - not conditional on server support) | 1 troubleshooting page, fetched 2026-11-23 | https://claude.com/docs/connectors/building/troubleshooting. **Vendor source.** |
| 3.4 | Claude **appends `offline_access`** to its requested scopes when the server's metadata lists `offline_access` in `scopes_supported`, to obtain a refresh token | 1 auth page, fetched 2026-11-23 | https://claude.com/docs/connectors/building/authentication. **Vendor source.** |
| 3.5 | Discovery handshake: unauthenticated MCP request must get `401` with `WWW-Authenticate: Bearer resource_metadata=...`; Claude fetches RFC 9728 protected-resource metadata, then the `authorization_servers` issuer's RFC 8414 or OIDC discovery (tries RFC 8414 first). Claude's callback URI is `https://claude.ai/api/mcp/auth_callback`. 10 s timeout on discovery/registration/token endpoints. No `client_credentials` grant | 2 pages + 1 help-center article, fetched 2026-11-23 | claude.com/docs/connectors/building/{authentication,troubleshooting}; https://support.claude.com/en/articles/11175166. **Vendor sources.** |
| 3.6 | Custom connectors are available to individual users on Free, Pro, Max, Ultra, Team and Enterprise plans (Free limited to 1 custom connector) | 1 help-center article, updated within the week before 2026-11-23 fetch | https://support.claude.com/en/articles/11175166. **Vendor source.** |

Note on 3.5 for this app: `/api/mcp` sits at a path on Vercel. Claude's fallback probes
`/.well-known/oauth-protected-resource/api/mcp` and the root form; the docs note the
`resource_metadata` URL in the 401 can be any HTTPS location, which is the reliable path on
serverless platforms that only route path prefixes. This is app-side work S7 already budgets for
(its acceptance criteria require the 401 + discovery endpoints), not a claim risk.

## 4. The two open Supabase bugs that sit exactly on Claude's path

| # | Fact | Population / sample | Source |
|---|---|---|---|
| 4.1 | **`supabase/auth#2820` (OPEN, created 2026-09-20, last updated 2026-11-05): on a hosted project with the OAuth server enabled, the consent step fails.** `GET /auth/v1/oauth/authorizations/{authorization_id}` - the call the developer's consent UI must make per Supabase's own flow (1.4) - returns **400 "authorization request cannot be processed"**. A controlled matrix (same user, same redirect_uri, same PKCE S256, one request per row) isolated **three independent triggers, each sufficient alone**: (1) a **public client** (`token_endpoint_auth_method: none`), (2) the **`offline_access` scope**, (3) presence of the **`resource` parameter**. The only passing combination was: confidential client + `openid email profile` + no `resource`. The reporter's conclusion: "makes the OAuth Server unusable for MCP connectors" | 1 bug report on 1 hosted project, matrix of 6 rows, all runs by the reporter; open at last update 2026-11-05 (18 days before this round) | https://github.com/supabase/auth/issues/2820. Bug report by an external developer; no commercial interest apparent |
| 4.2 | Mapping #2820 onto Claude's documented behavior (3.1-3.4): **at least two of the three triggers are unavoidable in Claude's flow.** The `resource` parameter is sent unconditionally (3.3). `offline_access` is appended whenever the server advertises it - and this project's live metadata advertises it (2.2), and it is not removable from Supabase's advertised scopes. The third trigger (public client) applies under DCR and under CIMD; it can be avoided only by pre-registering a **confidential** client and having Dennis enter client ID + secret in the connector dialog ("Use your own OAuth client") | chain of 3.1-3.4 + 2.2 + 4.1 | this round's own cross-reference of the two vendors' documented behavior |
| 4.3 | **`supabase/auth#2610` (OPEN, created 2026-07-02, last updated 2026-10-06): the OAuth server ignores the RFC 8707 `resource` parameter and stamps `aud: "authenticated"`** on every token regardless of requested resource. Corroborated independently: the MCP repo issue #3413 reports the same on Supabase CLI 2.119.0 / Auth v2.197.0 (local test), and a third-party tutorial shows a real decoded token with `"aud": "authenticated"`, `"client_id": "..."`, `amr: oauth_provider/authorization_code` | 1 open feature request + 1 community issue with version-pinned local test + 1 tutorial (all fetched 2026-11-23) | https://github.com/supabase/auth/issues/2610 (author runs a production MCP resource server on Supabase Auth - vested in the fix); https://github.com/modelcontextprotocol/modelcontextprotocol/issues/3413; https://makerkit.dev/blog/tutorials/build-mcp-server-oauth (content marketing for a paid kit - **commercial interest, flagged**) |

## 5. The RLS half of the claim

| # | Fact | Population / sample | Source |
|---|---|---|---|
| 5.1 | The "token runs as the user under RLS" half is **supported**: OAuth tokens are standard Supabase JWTs with the user's `sub`/`role` claims plus `client_id`, so PostgREST and existing RLS policies apply to them unchanged (1.5, 1.6). The MCP-auth docs state "Row Level Security - Your existing RLS policies automatically apply to MCP clients" | 3 doc pages, fetched 2026-11-23 | sources as 1.5. **Vendor source.** |
| 5.2 | The spec-level wrinkle: MCP authorization spec (2025-11-25) requires the resource server to verify each token was issued for it (audience binding); with `aud: "authenticated"` on every project token (4.3) that verification cannot ride on `aud` alone. The documented workaround is in-app validation: verify the JWT signature against the project's JWKS, pin the issuer, and require the `client_id` claim (which only the OAuth server mints). The mcp-use provider library implements exactly this with a `SUPABASE_AUDIENCE` option | 1 spec page + 1 tutorial + 1 library example, fetched 2026-11-23 | https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization (open-source spec, no commercial stake in this answer); makerkit (flagged above); https://github.com/mcp-use/mcp-use (their own library - mild commercial interest, flagged) |

This wrinkle does not break claude.ai connectivity on its own (Claude does not enforce the
audience check; the MCP server does), but it means the `/api/mcp` endpoint must do its own
signature + issuer + `client_id` validation rather than trusting `aud`.

## 6. Chain

The claim splits into two halves and they fare very differently.

**Half A - "claude.ai can add the inventory MCP as a custom connector against Supabase's OAuth
server."** The protocol pieces exist on paper: RFC 8414 + OIDC discovery endpoints (1.2, 2.2),
PKCE S256 (2.2, 3.2), a DCR toggle (1.3), and a flow shape (401 → resource metadata → discovery →
DCR → consent → token) that matches Claude's handshake (3.5). But one open, 18-day-old bug report
(4.1) says the flow dies at the consent step for exactly the client Claude presents: Claude always
sends `resource` (3.3) and will request `offline_access` because this project advertises it (2.2,
3.4), and both independently trigger the 400 in #2820. Pre-registering a confidential client and
entering its secret in the dialog removes only the public-client trigger; `resource` and
`offline_access` cannot be steered away from Claude's side. If #2820 still reproduces on the
current hosted build, the falsifier's first clause is met and the claim as stated is **falsified
today**. The honest status is therefore: **not proven, and one open bug report points against it**;
the evidence is a single reporter's matrix on a single project, not an observation of this project.

**Half B - "tool calls run under RLS as the user."** Supported by vendor docs at three layers
(1.5, 1.6, 5.1) and consistent with a decoded third-party token (4.3). No counter-evidence found.
The residual work is the app's own token validation (5.2).

**Missing prerequisite discovered:** the OAuth server is **disabled** on this project right now
(2.1), so even Half B is untestable from this tree until it is enabled in the dashboard - a Dennis
action (the discussion agents must not touch the Supabase dashboard per AGENTS.md).

## 7. Where the evidence does not exist (explicit gaps - I stopped looking)

1. **No source shows a completed claude.ai ↔ Supabase-OAuth-server custom-connector flow.**
   Supabase's own MCP docs describe the mechanism; Anthropic's troubleshooting page name-checks
   "Supabase Auth" among hosted providers that only serve OIDC discovery; but I found no
   first-hand writeup of the full claude.ai flow succeeding, and no first-hand report of it
   failing at claude.ai either (the ChatGPT mention in #2820 is a different client). Absence of
   evidence, stated plainly: this integration appears to be untested in public.
2. **Whether Supabase's RFC 8414 metadata advertises a `registration_endpoint` once enabled**
   (and whether it advertises CIMD, which Claude prefers). Not verifiable while the feature is
   disabled on this project, and the docs fetched do not print a sample metadata document.
3. **Whether #2820 still reproduces on the build deployed after 2026-11-05.** Open issues are
   not fix-proofs; nothing newer than the 2026-11-05 update was found.
4. **What client type Supabase's DCR endpoint creates by default** (public vs confidential) - not
   stated in the fetched docs; it decides whether DCR alone hits trigger 1 of #2820.

## 8. What would settle it

1. Dennis enables OAuth Server on the project (dashboard: Authentication > OAuth Server, set the
   Authorization Path, toggle DCR) - then the discovery documents in section 2 can be re-fetched
   and gaps 2 and 4 close in minutes.
2. A scripted probe of the flow with Claude's exact parameters (DCR or pre-registered client,
   `scope=openid email profile offline_access`, `resource=https://nflinventory-weld.vercel.app/api/mcp`,
   PKCE S256) against a **test** project, watching for the #2820 400 at `getAuthorizationDetails`.
   This must not run against the live inventory project without Dennis's go.
3. If the 400 reproduces: the claim's fallback branch activates (own OAuth layer in Next.js, or a
   simpler token scheme), and S7 should be re-scoped before build. If it does not: the claim
   survives to challenge on the remaining half (consent UI work, DCR hygiene, audience validation).
