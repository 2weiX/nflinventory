# Working on this repo (for AI agents)

Several agents work here in turns, often overnight, with no human watching. Two protocols share this
repo: **story development** (code agents building features) and the **overnight discussion loop**
(agents arguing in `discussion/` about what the stories should be). These rules keep every turn safe
and make it easy for the next agent to pick up.

## Start of every turn (story development)
1. Read `docs/HANDOFF.md` (most recent entry first), then `docs/STORIES.md`.
2. `git pull`. Run `npm install`, `npm test`, `npm run typecheck`. If main is broken, fixing it **is** your task.
3. Pick **one** story: the highest priority that isn't Done and isn't ⏳ Blocked. Don't start a second story in the same turn.

## While working
- Branch: `story/S7-mcp-endpoint` style. One pull request per story; small commits.
- Keep the stack: Next.js 16 (App Router), Supabase, Tailwind 4, TypeScript strict. No new UI framework or ORM.
  Next.js 16 differs from older versions: check `node_modules/next/dist/docs/` before using an API you're unsure of.
- Money is always integer cents in the database and in `lib/`. Convert to and from dollars only at the edges (UI, MCP arguments and results).
- Pure logic goes in `lib/` with tests in `lib/*.test.ts` (run with `node --test`, no extra test framework).
- Schema changes: add `supabase/migrations/000N_name.sql` (never edit an applied migration), apply it to the project, and enable row-level security on new tables. Only additive changes; see "Shipping" for destructive ones.
- Never put secrets in the repo, in `NEXT_PUBLIC_*` variables or in client code. The repo is **public**.
- Never delete or bulk-rewrite real data in the database. Tests use rolled-back transactions or a throwaway user that you delete afterwards.
- Never publish anything to eBay or Whatnot, never buy, bid or message anyone. eBay integration creates drafts only.

## Done means
Everything in "QA: Definition of Done" in `docs/STORIES.md`. If you can't finish, leave the branch in a state
where the checks pass, and say exactly what's left.

## Shipping: agents merge, verify and roll back (no human needed)
Dennis does not review pull requests. When a story meets "Done means", the agent that built it ships it:
1. Merge its own PR into `main` (squash): `gh api -X PUT repos/2weiX/nflinventory/pulls/<n>/merge -f merge_method=squash`.
   Only merge a PR whose checks pass and that has no conflicts. Never merge another agent's open PR, never force-push `main`.
2. Vercel deploys `main` automatically. Wait for it: `gh api repos/2weiX/nflinventory/commits/<sha>/status` until the
   `Vercel` context is `success` (about a minute).
3. Smoke-check the live app: https://nflinventory-weld.vercel.app/login must load and show the sign-in form.
4. If the deploy fails or the smoke check fails: roll back at once with `git revert <sha>` on a `revert/<branch>` branch,
   merge it the same way, and confirm the next deploy is `success`. Then log what broke in `docs/HANDOFF.md` and leave
   the story In progress.
5. Any agent that finds `main` broken (failed deploy, failing tests, dead login page) reverts the last merge first and
   investigates second.

Database changes follow a stricter rule, because a revert doesn't undo them:
- **Additive** migrations (new table, new nullable column, new index, new view) may be applied and merged by the agent.
- **Destructive** ones (drop or rename a column or table, change a type, rewrite or delete existing rows) are never
  applied by an agent. Leave the migration file in the PR unmerged and put it under "Anything Dennis must do".

## The project board (what Dennis looks at)
Dennis follows the work on one board: GitHub Project **nflinventory**,
https://github.com/users/2weiX/projects/5 (private, owner 2weiX). Keep it true; it is his only overview.
- Columns (Status): **Inbox** (new, untriaged) → **Triaged** → **Next** → **Building** → **Done**.
- Fields: Kind (Feature / Bug / Story / Claim), Story (e.g. S7), Priority (P0 / P1 / P2 / Later),
  Points (number), Source (football MCP / eBay API / Both).
- Issues and pull requests on 2weiX/nflinventory are added automatically and land in Inbox; closing one moves it
  to Done.
- Every story and every claim is a **GitHub issue** on the board, labelled `story` or `claim`, titled `S7 · …` or
  `C009 claim · …` (stories #8–#24, claims #25–#34, created 2026-11-24). Its body mirrors the story section in
  docs/STORIES.md or the claim's claim.md, with a link back. Dennis, Claude sessions and the harness all read and edit
  them (`gh issue view/edit/comment`, or the REST API: it is repository-scoped, so cloud sessions can use it too).
- docs/STORIES.md and discussion/claims stay the binding text for agents. When an issue body or comment changes
  scope, the harness operator folds it into STORIES.md (or files it as a claim round) at triage and notes that on the
  issue. When STORIES.md or a claim changes, whoever changed it updates the issue body in the same turn.
- Done stories and settled claims are **closed** issues (closing moves the card to Done). A new story or claim gets
  its issue at the same time it is written, so the board never misses one.
- Who moves what: the harness operator moves issues out of Inbox at triage. A story agent moves its story to
  **Building** when it starts, comments progress on the issue, links its PR (`Part of #14` / `Closes #14`) and closes
  the issue when the story ships. The discussion loop's operator closes a claim's issue once it is settled.
- Tooling: issue text and state via `gh issue …` or REST (works everywhere). Board columns and fields via
  `gh project item-list 5 --owner 2weiX` / `gh project item-edit` (needs a token with the `project` scope; cloud
  Claude sessions cannot reach the Projects API, so column moves other than close→Done happen on the harness).

## End of every turn
Add an entry at the **top** of `docs/HANDOFF.md`:

```
## YYYY-MM-DD HH:MM · <agent name> · S<n> <title>
Status: Done | In progress | Blocked
Branch / PR:
What changed:
Evidence (tests, build, manual checks):
Open issues / next step:
Anything Dennis must do (keys, settings, decisions):
```

Questions for Dennis go under "Anything Dennis must do". Don't stall waiting for an answer: pick the safest
reasonable reading, note it, and move on.

## The overnight discussion loop (separate protocol, same repo)

`bin/` carries the claim-debate loop (the proven zipbiz machinery): several models argue in `discussion/`
about what the stories should be. Its rules:

- **Two trees, never mixed.** `discussion/` holds claims, rounds and verdicts. A discussion agent never
  edits app code, `docs/STORIES.md` or the database. A code change follows only from a claim that reached
  a verdict — the verdict's evidence is what proposes a story change (as a round under the claim, applied
  to `docs/STORIES.md` by a story agent or Dennis).
- **Independence is required.** `discussion/roster` declares role → command → model. The gate
  (`bin/gate-independence`, run inside `bin/sync`) refuses any challenger or adjudicator round whose model
  already appears earlier on the same claim. Attribution is binding, written by the dispatching adapter;
  a model never writes its own `model:` field.
- **The Supabase rule.** The live inventory database holds real personal data. Discussion agents never
  touch it — no credentials in the repo or in agent prompts. Schema proposals are migration files under
  decided claims, applied by story agents under the migration rules above.
- **Cost posture.** The loop runs overnight at minimal cost: research/proposal on GLM-5.3-flash (pennies),
  challenge on numes' $0 `:free` tier, adjudication on the Claude subscription. No paid OpenRouter models.
  The challenger seat must always point at a `:free` id — numes moved its free tier behind a suffix once
  already; re-check the provider catalog on every swap.
- **The loop stops, never spins.** `bin/overnight` stops on IDLE, on budget, or on a sync failure. A round
  that produces no file stops the circle before sync. The loop's crontab runs offset from other overnight
  loops so two never share a window.

## Project facts
- Supabase project `nflinventory`, ref `ngxfvhlbrhlqarpwavcf` (eu-west-1). Publishable key and URL are in `.env.example`.
- Hosting: Vercel project `nflinventory`, live at https://nflinventory-weld.vercel.app (auto-deploys `main`). Supabase auth Site URL and redirect `https://nflinventory-weld.vercel.app/**` point there; public sign-ups are off.
- Dennis's own MCP "football" (sets, checklists, odds, box prices, card prices) runs on his Hermes harness
  at `dennis.taila812b8.ts.net/cc/mcp` (funnel) and `127.0.0.1:8742/mcp` locally. Caps: 20 requests/minute
  per token, 30 s statement timeout, read-only (SELECT-only role). It serves, as of 2026-11-20: Flagship 2026
  (43,770 variants), Chrome 2026 (25,091 variants, 15,162 numbered runs, 2,603 official odds rates across
  8 box formats), Chrome 2025, Midnight 2026, Inception 2024+2026, Heritage 2026, Donruss/Optic 2022-2025,
  1990 Panini Score. For S8 (value refresh) Claude combines it with this app's MCP. For S16 (board pricing)
  the **harness** scrapes and prices boards hourly and pushes them to this app's ingest endpoint. The app
  never scrapes Whatnot and never re-implements the pricing model.
- Break market data: `2weiX/breakdata` on GitHub - Whatnot football boards hand-classified (breaks.csv with
  seller/product/mechanic/prices, per-board spot CSVs, daily scans). S16's harness side reads it; its schema
  is the source of the ingest payload's fields.
- The football MCP's sealed-box cost basis (EU shops, `v_box_basis`) can supply S16's `box_cost_cents`
  per product and format.
- Whatnot is **read-only** for this app: read boards, never click buy/bid/spot buttons, never place pre-bids.
- eBay developer account: approval pending (registered 2026-11-21). S11 and S12 stay blocked until keys exist.
