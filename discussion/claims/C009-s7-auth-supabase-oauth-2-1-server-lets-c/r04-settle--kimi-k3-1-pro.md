---
claim: C009-s7-auth-supabase-oauth-2-1-server-lets-c
round: 4
role: adjudicator
model: moonshotai/kimi-k3.1-pro:free
harness: opencode (bin/numes-round.sh on Dennis's Linux harness)
date: 2026-11-27
verdict: settled
confidence: medium
---

# R4 settle: C009 is settled - first-hand claude.ai traces now exist, and they close R3's evidence gap

**Independence.** Earlier rounds: r01 = z-ai/glm-5.3-flash (researcher), r02 =
moonshotai/kimi-k3.1-pro:free (challenger, this model), r03 = claude-sonnet-5-5 (adjudicator,
verdict open). This is a boundary round (`settle`); the round-robin rule asks that the immediately
preceding round was written by a different model. r03 is claude-sonnet-5-5, I am
kimi-k3.1-pro:free, so the rule holds. I am not re-grading my own r02 argument: r02 said the
connector half cannot be accepted from protocol advertisements alone and demanded an actual
claude.ai trace. This round records that such traces now exist in public, weighs what they show -
including where they cut *against* r02's predicted failure mechanism - and closes the claim on that
basis. That is evidence arriving, not re-litigation.

**Method.** Read claim.md, r01, r02, r03. Then went looking for exactly the evidence r03 said was
missing, in public sources only. No Supabase dashboard, no database, no app code, no credentials;
the only requests to this project were the same unauthenticated discovery GETs r01 already made
(AGENTS.md Supabase rule intact).

## What r03 actually left open

R3's verdict was **open**, low confidence, and it named the reason precisely:

- "The whole adverse case rests on one open issue by one reporter on one project" (`#2820`).
- "Nothing shows it reproduces today, and nothing shows a completed claude.ai flow either."
- It could not re-fetch `#2820` (no fetch tool that turn) and could not say whether the bug had moved.
- Its correction to r01/r02 stands and is confirmed below: the "unavoidable `offline_access`" chain
  rested on the OIDC document, while Claude tries RFC 8414 first - which nobody had seen.

R3 did not say the claim was false. It said the evidence to decide it did not exist in this tree.
So the only legitimate move now is to report what that evidence shows.

## New evidence, all first-hand and all post-dating or absent from r01-r03

The decisive find is a public issue tracker none of the earlier rounds examined:
**`github.com/anthropics/claude-ai-mcp`**, which holds 54 issues matching "Supabase", several of
them full claude.ai connector traces with server-side request logs. This is the corpus r01
explicitly reported missing ("No source shows a completed claude.ai <-> Supabase-OAuth-server
custom-connector flow ... this integration appears to be untested in public", r01 7.1). It is not
untested in public.

### 1. claude.ai's discovery, DCR, PKCE, consent and token exchange against Supabase Auth: observed working

`anthropics/claude-ai-mcp#1231` (filed 2026-11-06, closed by reporter same day) is a Next.js app
serving `/api/mcp/claude` - the same architecture S7 specifies - using Supabase Auth's OAuth 2.1
server as its authorization server. The reporter's own claude.ai server log, quoted in the issue:

> Dynamic registration succeeds, the user is sent to our consent page, signs in and approves, and
> is redirected back to Claude.

and:

> Connect: DCR succeeded, consent page reached and approved, then one GET of the protected-resource
> document -> 200 and nothing else.

Their metadata block records Supabase's live authorization-server document advertising
`registration_endpoint`, `code_challenge_methods_supported: ["S256","plain"]`,
`token_endpoint_auth_methods_supported` including `"none"`, and `scopes_supported` including
`offline_access`. That single block closes r01's gaps 2 and 4: the enabled project's metadata does
carry a registration endpoint, and DCR registers a **public** client.

Same issue, the reporter's hand-run reproduction of Claude's exact request shape against that same
Supabase issuer, using the public DCR client, S256, `scope=openid email profile offline_access` and
`resource=<connector URL>`:

> Token request (form-urlencoded, `client_id`, `code_verifier`, `resource`) -> 200 with
> `access_token` (JWT), `refresh_token`, `expires_in: 3600`, `token_type: bearer`. ... With that
> token: `initialize` -> 200, authenticated `tools/call` -> 200. Refresh -> 200 with a rotated
> refresh token.

**This is the experiment r02 specified, run by an independent third party, and r02's central
prediction fails.** R2 Objection 1 said the consent lookup would die with 400 whenever `resource`
was present, and separately whenever `offline_access` was requested, and that a public DCR client
was a third independent trigger. Here all three are present at once - public DCR client, `resource`,
`offline_access` - and consent, token issuance, refresh rotation and an authenticated `tools/call`
all succeed. `#2820`'s matrix therefore does not generalize to "Supabase cannot complete an MCP
connector flow"; at most it describes a configuration-specific defect (its own "System information"
lists a hash-router authorization path and cross-references the separate hosted-redirect bug #2408).
R2's strong objection is refuted by observation, and I say so plainly even though it was mine.

### 2. The `aud: "authenticated"` worry does not block claude.ai

R1's 5.2 and r02's Objection 3 both treated audience binding as app-side work rather than a
connector blocker, and that reading is now confirmed from the claude.ai side rather than inferred.
`#1231` shows claude.ai completing DCR, consent and the token exchange against Supabase and then
moving on to its post-token step while the token carries `aud: "authenticated"` and no `resource`
claim. The reporter asked Anthropic directly whether claude.ai requires `aud` to equal the connector
URL; the eventual resolution (below) shows the blocker was elsewhere. R1's concession stands and is
no longer just a doc reading.

The app-side obligation is unchanged and is S7's own acceptance criterion: verify signature against
the project JWKS, pin the issuer, require the `client_id` claim, and run queries as that user rather
than through the service role. Nothing here licenses skipping it.

### 3. The failures that do occur are not Supabase OAuth-protocol failures

This matters because r03 warned against reading any one bug report as a general verdict. The new
corpus lets that be checked instead of asserted:

- `#1231`'s final comment (2026-11-06): after swapping Supabase for the reporter's *own*
  fully-RFC-8707-compliant authorization server, the identical post-token failure persisted on a
  `*.trycloudflare.com` quick-tunnel host - "reproduced with our own authorization server, so
  Supabase is ruled out". Once deployed to the production domain, the connector completed sign-in
  first time and a tool call ran from chat. Root cause: claude.ai would not hand the token to a
  tunnel host. S7 runs on `https://nflinventory-weld.vercel.app`, a real production domain, so this
  failure mode does not apply to it.
- `#1289` (2026-11-13, closed same day): "Connector couldn't be added", DCR never called. Root cause
  found by the reporter in the browser: `POST .../mcp/remote_servers -> 429 rate_limit_error` during
  the 2026-11-13 claude.ai incident. A commenter on the same thread describes a Supabase-Auth-backed
  server with the identical symptom whose pre-existing connectors "keep working on claude.ai,
  including tool calls" throughout. Anthropic-side rate limiting, not a Supabase defect.
- `#1301` (2026-11-13, open): discovery stops after the metadata fetch; the reporter notes it worked
  earlier that same day, during the same incident window. Unresolved, but its own log shows steps
  1-3 (401 + protected-resource metadata + Supabase metadata fetch) succeeding, and no Supabase
  error anywhere.
- `#565` (2026-07-07, closed by an Anthropic engineer): "Couldn't register" traced by Anthropic to
  the app's protected-resource metadata naming a resource that did not match the connector URL -
  "That was fixed on your end ... registration has succeeded since." App-side config, exactly the
  class of work S7 already budgets.

### 4. The RLS half is unchanged and now has a worked vendor example

Re-fetched Supabase's MCP-authentication page today (updated 2026-10-23): "Row Level Security - Your
existing RLS policies automatically apply to MCP clients", plus a reference middleware example
(`withSupabase({ auth: 'user' })`) whose comment reads "supabase is scoped to the signed-in user;
hand it to your MCP tools". No contrary evidence exists in any round or in anything fetched today.
R3 already ruled this clause "not met" as a falsifier; nothing has changed.

### 5. This project's own state, re-probed today

`GET https://ngxfvhlbrhlqarpwavcf.supabase.co/.well-known/oauth-authorization-server/auth/v1`
returns `404 {"error_code":"feature_disabled","msg":"OAuth server is disabled"}` as of 2026-11-27 -
unchanged from r01's 2026-11-23 probe. The OIDC document still advertises
`scopes_supported: [openid, profile, email, phone, offline_access]` and
`code_challenge_methods_supported: ["S256","plain"]`. This is a dashboard toggle Dennis must flip,
as r01 and r03 both said; it is configuration, not incapability, and r02 explicitly conceded that.
`supabase/auth#2820` remains open with `updated_at` still 2026-11-05 - no fix and no further
reproduction has landed in the 22 days since, and `#1231` now supplies a counter-observation.
Supabase Auth shipped v2.198.0 (2026-11-13) and v2.199.0 (2026-11-25) since r03; neither release
notes a change to the OAuth server's consent or resource handling.

## Why this is settle, not reopen

The falsifier has two clauses:

- **Clause 1 (discovery, DCR or PKCE fails, so the claude.ai flow cannot complete): not met.** The
  strongest available evidence is a first-hand claude.ai trace of DCR + consent + token exchange
  succeeding against Supabase Auth on a Next.js `/api/mcp` app, plus a hand-run replay of Claude's
  exact parameters ending in an authenticated `tools/call`. The one report that predicted failure
  (`#2820`) is contradicted on its own trigger conditions and was never reproduced on this project.
- **Clause 2 (token does not run Postgres as that user under RLS): not met.** Documented by the
  vendor at three layers, corroborated by decoded third-party tokens, and now illustrated by a
  vendor middleware example. No counter-evidence anywhere.

R3 left the claim open solely because neither a completed flow nor a reproduction had been observed.
One of those two missing observations now exists, in public, in triplicate. Continuing to hold the
claim open would be re-litigating a falsifier that has not been met - the exact failure mode this
protocol exists to prevent. UNFILLABLE is not applicable either: the evidence demonstrably does
exist in public sources; the earlier rounds simply had not found the tracker that holds it.

## What this settle does and does not say

- It says S7 may be built as written: Supabase Auth as the OAuth 2.1 identity provider, claude.ai
  custom connector, tool calls as the signed-in user under RLS. No own-OAuth-layer rewrite and no
  simpler-token-scheme fallback is forced by the evidence.
- It does not say the integration is risk-free. Residual, ordinary build risks, all inside S7's
  existing acceptance criteria: the consent UI must be built (Supabase delegates it by design);
  the endpoint must do its own JWT signature/issuer/`client_id` validation because `aud` is always
  `"authenticated"`; DCR accumulates one registration per reconnect (`supabase/auth#2850`, open, a
  hygiene issue not a blocker); and claude.ai has its own transient failure modes (rate limits,
  tunnel-host refusal) that testing must not mistake for Supabase bugs.
- It does not flip the dashboard toggle. That remains Dennis's action, and the two-user RLS test in
  r02 Objection 3 remains S7's own acceptance criterion ("A second test account's token cannot read
  or change the first account's cards through any tool"). Those are build steps, not open questions
  about whether the architecture can work.
- R3's narrowing corrections survive intact: `offline_access` was indeed inferred from the wrong
  discovery document, and the adverse case was indeed one reporter on one project. The settle
  confirms both corrections rather than overturning them.

## Action

Set `status: settled` in claim.md, `verdict: settled`, `round: 4`, `confidence: medium`. Medium, not
high: the completed-flow evidence is third-party and self-reported (though detailed, log-backed and
corroborated across several independent reporters), and this project's OAuth server has still never
been enabled, so nothing has been observed end to end *on this project*. The remaining uncertainty
is execution risk on our own build, which is what S7's acceptance criteria are for - not a reason to
keep an architectural claim open.

## Note for the harness operator

C009's GitHub issue is #33 (`C009 claim · S7 auth: ...`, confirmed open via the GitHub search API).
`gh` is not installed on this harness, so closing it - which moves the card to Done on Dennis's
board - is left to the operator, same as for C001 earlier tonight.
