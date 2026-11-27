---
claim: C009-s7-auth-supabase-oauth-2-1-server-lets-c
round: 3
role: adjudicator
model: claude-sonnet-5-5
harness: claude-code (harness-nflinv on Dennis's Linux harness)
date: 2026-11-27
verdict: open
confidence: low
---

# R3 verdict: open. The claim is neither confirmed nor falsified, and the evidence cannot decide it from this tree

Independence: R1 was z-ai/glm-5.3-flash and R2 was moonshotai/kimi-k3.1-pro:free. I am claude-sonnet-5-5,
which is on neither round, so the gate is satisfied. R2 comes from a model different from R1's, so I
weigh it as an independent challenge. That matters less than it might, because R2 re-reads R1's
evidence and adds no new sources (see below).

I read R1 and R2 only. I tried to re-fetch `supabase/auth#2820` to see whether it has moved since
2026-11-05, but the fetch tool was not permitted in this turn. Everything below about #2820 is
therefore R1's reading, unrechecked by me.

## Recomputed figures

- R1 section 6 calls #2820 an "18-day-old bug report". Its own table (4.1) gives created 2026-09-20 and
  last updated 2026-11-05. 2026-11-05 to 2026-11-23 is **18 days since the last update**. Creation to
  2026-11-23 is 10 days left in September + 31 in October + 23 in November = **64 days**. The
  "18-day-old" label is wrong, but it errs in the direction that makes the bug look fresher, so it
  slightly understates how long it has stayed open. As of today (2026-11-27) it is 22 days since the
  last update and 68 days since creation, if nothing has changed since R1 looked.
- "Matrix of 6 rows, three independent triggers, one passing combination" is R1's own count. I cannot
  recompute it without the issue text.
- R2 repeats "removes one of three independent failure conditions". That is arithmetically consistent
  with R1 4.1/4.2.
- R2's "either parameter alone" is a fair restatement of R1's "each sufficient alone".

## What R1 established

- **RLS half (Half B): supported by vendor documentation.** Tokens are ordinary Supabase JWTs with
  `sub`, `role` and `client_id`. R2 conceded this. The remaining obligation is the app's own
  verification, which is implementation work. R1 is right that `aud` is always `"authenticated"` (#2610),
  so the endpoint must check signature, issuer and `client_id` itself.
- **Prerequisite: the OAuth server is disabled on this project.** The RFC 8414 document returned 404
  `feature_disabled` on 2026-11-23. That is configuration, not a falsifier. R2 conceded it.
- **Claude's required request shape.** This comes from Anthropic's pages as R1 quoted them. Claude
  always sends `resource`, always sends S256, and appends `offline_access` when the server advertises it.

## Where R1 and R2 both overreach

1. **"`offline_access` cannot be steered away from" is not established.** R1 4.2 bases it on the OIDC
   document (2.2), but R1 3.5 says Claude tries the **RFC 8414 document first**, and that document does
   not exist on this project yet (2.1). Its `scopes_supported` may differ from the OIDC document's, and
   nobody has seen it. R1's own gap 2 says it is unobservable. So one of the two "unavoidable"
   triggers is an inference from the wrong document. R2 inherits it ("this project's live OIDC metadata
   advertises it") and presents the chain as "exact rather than speculative". Only the `resource` trigger
   rests on a direct quote of Claude's behaviour. R1 and R2 are partly wrong on this.
2. **The whole adverse case rests on one open issue by one reporter on one project.** R1 says so and
   R2 concedes it. R2's label "strong" for Objection 1 is a statement about the mechanism, not about the
   current build. Open is not reproduced. Its last-updated date is 22 days before today and I could not
   check whether a fix has landed since.
3. **R2 adds no evidence.** It restates R1's chain and then specifies an experiment. The experiment is
   well designed (two client types, `resource`, `offline_access`, then a two-user RLS test with forged-token
   negatives), but a proposed experiment is not a result.
4. **The #2820 failure is at `getAuthorizationDetails` with the consent-lookup call.** R1 reads this as
   Claude's flow dying. That follows only if Supabase's redirect-to-consent design is what S7 uses. It
   is, per R1 1.4. I accept the inference, but it is a chain of four steps across two vendors' pages,
   none of them observed end to end.

## Verdict

**open.** The two falsifier clauses fare differently:

- **Clause 2 (token does not run under RLS as the user): not met.** No contrary evidence. Supported by
  documentation only, never observed on this project. Needs the two-user test in R2 Objection 3.
- **Clause 1 (flow cannot complete: discovery, DCR or PKCE fails): neither met nor refuted.** A credible
  specific failure report exists (#2820) and it would be hit by `resource` alone if still reproducible.
  Nothing shows it reproduces today, and nothing shows a completed claude.ai flow either. Both
  sources agree on that gap (R1 7.1, R2 Objection 2).

Neither side is wrong on its main point, and neither wins. The repo has not acted on the claim yet
(S7 is the build that depends on it), so there is no "already acted on" side to flag. R1's
"falsified today if #2820 still reproduces" is conditional, and I keep it conditional.

Confidence is **low**. I rely on R1's quoting of external pages and on a single bug report I could not
re-read.

## Consequence for S7 (does not change STORIES.md; a story agent decides)

The evidence supports **budgeting S7 with a fallback up front** rather than assuming either branch:

1. Make a throwaway-project spike the first task of S7, before any consent-UI work. Use R2's exact
   probe: confidential and DCR-created clients, S256, `resource`, `scope` with and without
   `offline_access`, capturing the Auth version and the `getAuthorizationDetails` response. Then add a
   real claude.ai custom connector against it. Never run it against the live inventory project without
   Dennis's go (AGENTS.md Supabase rule).
2. Keep the app-side work that is needed either way: 401 + RFC 9728 resource metadata, JWKS signature,
   issuer and `client_id` verification, and RLS via the user's token rather than the service role.
3. If the spike hits the 400 with the confidential client, switch to the claim's own fallback (an own
   OAuth layer in Next.js or a simpler token scheme). The claim says that, and I agree.

## What would settle it

Exactly the R2 experiment, in order: (a) enable the OAuth server on a test project and publish the
redacted RFC 8414 and OIDC documents (closes R1 gaps 2 and 4, and tests whether `offline_access` is
even advertised in the document Claude reads first); (b) run the `resource`-only and
`offline_access`-only rows with a confidential client against the current Auth build; (c) a real
claude.ai connector addition through to `tools/list`; (d) the two-user RLS test including forged-issuer
and missing-`client_id` negatives. A direct SQL test with hand-set JWT claims would not settle it.
Needs Dennis: enabling the OAuth server and creating a test project.
