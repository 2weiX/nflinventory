---
claim: C009-s7-auth-supabase-oauth-2-1-server-lets-c
round: 2
role: challenger
model: moonshotai/kimi-k3.1-pro:free
harness: opencode (harness-nflinv on Dennis's Linux harness)
date: 2026-11-24
---

# R2 challenge: the connector must survive Claude's actual request shape, not just advertise OAuth features

Evidence base: R1's dated documentation, issue reports and public discovery probes. I did not repeat
those fetches or probes. The distinction below is between what the sources establish, what R1
infers by combining them, and what still requires a live test.

## Position

The claim should not be accepted on the present evidence. Its RLS half is well supported, but its
connector half has a specific failure mechanism on Claude's documented path: Claude unconditionally
sends `resource` and, with this project's advertised scopes, requests `offline_access`; the open
Supabase report described in R1 says that **either parameter alone** can make the required consent
lookup fail. That is much stronger than a generic warning that Supabase OAuth is beta.

This is not yet proof that every Supabase-hosted project or every possible client configuration
fails. It is enough to reject "the documented feature set shows this will work" as a basis for S7.
If the reported failure reproduces on the current hosted build with Claude's parameters, the first
clause of the falsifier is met: claude.ai cannot complete the custom-connector flow through
Supabase's OAuth server, regardless of how good the discovery and PKCE metadata look.

## Explicit concessions

1. **The protocol building blocks exist.** R1 found vendor documentation for authorization-code
   OAuth 2.1 with PKCE, RFC 8414 and OIDC discovery, and dynamic client registration. The project's
   live OIDC metadata advertises S256. I cannot dispute any of that (R1 1.1-1.3, 2.2).
2. **The currently disabled OAuth server is not evidence of incapability.** The 404 from the RFC
   8414 endpoint is a configuration prerequisite, not a falsifier. Enabling the feature on a test
   project is the right next step; the disabled state must not be counted as an objection (R1 2.1).
3. **The central adverse report is not a current reproduction on this project.** `supabase/auth#2820`
   is one external reporter's matrix on one hosted project, last updated 2026-11-05. An open issue
   does not establish that the current hosted build still fails. I concede that this limits the
   objection below to a strong, narrowly targeted risk until reproduced (R1 4.1, 7.3).
4. **The RLS half has no contrary evidence in R1.** Supabase says OAuth access tokens are ordinary
   Supabase JWTs carrying the user's `sub` and `role`, plus `client_id`, and that existing RLS
   policies apply. That is consistent with the decoded third-party token R1 cites. I do not dispute
   the documented mechanism (R1 1.5, 4.3, 5.1).
5. **`aud: "authenticated"` is not itself a connector-flow failure.** Claude does not enforce the
   resource server's audience check, and the app can validate signature, issuer and `client_id`
   itself. This is implementation work, not proof that Supabase cannot issue a user-scoped token
   (R1 5.2).
6. **Building a consent page does not contradict the claim.** Supabase explicitly delegates consent
   UI to the developer, and S7 already includes an application endpoint. It would overstate the
   case to call that required UI an own-OAuth-server rewrite (R1 1.4).

## Objection 1 — Claude's documented parameters intersect two independent reported failure triggers

**Rating: strong, but limited to the reported default-flow failure mechanism; it is not yet a
current end-to-end reproduction.**

The chain is exact rather than speculative:

- Claude sends the RFC 8707 `resource` parameter on both authorization and token requests
  unconditionally (R1 3.3).
- Claude appends `offline_access` when the authorization-server metadata advertises it. This
  project's live OIDC metadata advertises it (R1 2.2, 3.4).
- The consent UI is not optional: Supabase redirects to the app's authorization path, and the app
  must call `getAuthorizationDetails` before it can approve or deny the request (R1 1.4).
- In the #2820 matrix, that details call returned 400 when `resource` was present, and separately
  returned 400 when `offline_access` was requested. Each was reported sufficient without the other
  (R1 4.1).

Consequently, a successful OPTIONS/GET discovery check, a DCR response or an S256 advertisement
would not answer the claim. The flow can pass all three and still stop before consent and token
issuance. Nor does pre-registering a confidential client remove the core problem: it addresses only
the report's third, independent trigger (`token_endpoint_auth_method: none`), while Claude still
sends `resource` and requests `offline_access` (R1 4.2). A workaround that removes one of three
independent failure conditions is not a passing flow.

This objection would be overstated if phrased as "Supabase OAuth never works with any MCP client."
The source does not show that. It supports the narrower and decisive statement that Claude's own
unconditional/default behavior reaches the reported failure twice, so success cannot be presumed
from Supabase's feature checklist or from a different client's success.

**Evidence that would settle it:** on a throwaway Supabase project with OAuth Server enabled, run
the current hosted Auth build through Claude's exact authorization-code flow with S256,
`resource=https://<test-resource>/api/mcp`, and `scope=openid email profile offline_access`.
Capture the authorization request, the `getAuthorizationDetails` response, the token exchange and
the Auth version/build. Test two rows: (a) the client type created by DCR, and (b) a pre-registered
confidential client, to isolate the public-client trigger. Then add the actual claude.ai custom
connector and complete browser sign-in. If both the exact probe and claude.ai reach consent and
issue a token, this objection is refuted for that build. If either `resource` alone or
`offline_access` alone reproduces the 400 with the confidential client, the workaround is ruled out
too and the claim's first falsifier is satisfied for that build. A successful discovery response or
a successful flow with `resource`/`offline_access` removed would **not** settle this objection,
because those are not Claude's documented requests.

## Objection 2 — There is still no observed successful claude.ai flow, and the metadata needed for
Claude's client-selection branch is unknown

**Rating: weak.**

R1 explicitly found no first-hand completed claude.ai ↔ Supabase OAuth custom-connector flow, in
either direction. It also could not establish whether an enabled project's RFC 8414 document will
advertise CIMD or a `registration_endpoint`, or what client type Supabase DCR creates (R1 7.1, 7.2,
7.4). Those omissions matter because Claude chooses CIMD only from particular metadata and
otherwise falls back to DCR, which requires a registration endpoint (R1 3.1). Vendor statements
that DCR exists do not demonstrate that this exact client can discover and use it.

Absence of a public success story is not evidence of failure, and an unobserved metadata document
is expected while the feature is disabled. This objection therefore cannot falsify the claim and
must carry less weight than Objection 1. It only blocks treating the integration as already
demonstrated.

**Evidence that would settle it:** after enabling OAuth Server on a throwaway project, publish the
redacted RFC 8414 and OIDC discovery documents and the DCR response shape (no secrets or personal
data), then record one actual claude.ai connector addition from 401/resource metadata through
browser consent to a successful authenticated MCP `tools/list`. A completed trace settles this
objection in the claim's favor. A missing registration endpoint, failed DCR, or claude.ai error
would instead localize the failure; neither a dashboard toggle nor documentation alone settles it.

## Objection 3 — Audience and user isolation remain application obligations, not properties to infer
from a Supabase JWT

**Rating: weak as an objection to the literal claim; moderate as an implementation trap if S7 treats
Supabase as a drop-in validator.**

The reported `aud: "authenticated"` behavior means the resource server cannot establish MCP
resource audience binding from `aud` alone. R1's proposed signature + pinned issuer + `client_id`
validation is plausible, but it is not an observed implementation in this app (R1 4.3, 5.2). Also,
"RLS automatically applies" describes Postgres/PostgREST behavior only after the MCP endpoint has
correctly authenticated the token and made the database call as that user. An endpoint that uses a
service-role client, or merely decodes a JWT without verifying it, would invalidate the claimed tool
behavior even while Supabase's token itself is sound.

This does not show that Supabase tokens fail under RLS. I expressly concede the documented token
mechanism above. The objection is only to accepting the end-to-end phrase "tool calls running under
RLS as the user" without observing the actual MCP path.

**Evidence that would settle it:** using a real token minted by the enabled test project's OAuth
server, decode and record the non-sensitive claims, verify its signature against that project's
JWKS, and run the MCP tools with two throwaway users. For every read and write tool, user B must
receive zero of user A's rows or a clear authorization error, while user A's own operation succeeds.
Include a forged/wrong-issuer token and a token without the accepted OAuth `client_id`; the MCP
endpoint must reject them before any database call. A direct SQL RLS test using manually set JWT
claims would not settle this point, because it would bypass token issuance and MCP validation.
Conversely, if a genuine OAuth token reliably enforces the two-user boundary through every tool,
the RLS half of the claim is supported end to end and this objection is closed.

## What would change my conclusion

The strongest evidence for the claim is not another documentation page: it is a current, actual
claude.ai trace using Supabase OAuth with Claude's mandatory `resource`, its advertised-scope-driven
`offline_access`, S256, and either DCR/CIMD or a documented manual-client configuration, followed
by the two-user tool test. That single experiment can refute Objections 1 and 2 and, with the
negative token cases, Objection 3.

Until then, the defensible challenge is narrow: **concede Supabase's documented RLS mechanism, but
do not accept the connector claim from protocol advertisements alone.** If the #2820 consent error
reproduces with either unavoidable Claude parameter, the claim as written is falsified for the
current hosted service and S7 needs its own OAuth layer or a simpler token scheme. If the complete
flow succeeds, the main challenge collapses and only the ordinary app-side consent and token
validation work remains.
