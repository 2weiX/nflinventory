# Working on this repo (for AI agents)

Several agents work here in turns, often overnight, with no human watching. These rules keep each
turn safe and make it easy for the next agent to pick up.

## Start of every turn
1. Read `docs/HANDOFF.md` (most recent entry first), then `docs/STORIES.md`.
2. `git pull`. Run `npm install`, `npm test`, `npm run typecheck`. If main is broken, fixing it **is** your task.
3. Pick **one** story: the highest priority that isn't Done and isn't ⏳ Blocked. Don't start a second story in the same turn.

## While working
- Branch: `story/S7-mcp-endpoint` style. One pull request per story; small commits.
- Keep the stack: Next.js 16 (App Router), Supabase, Tailwind 4, TypeScript strict. No new UI framework or ORM.
  Next.js 16 differs from older versions: check `node_modules/next/dist/docs/` before using an API you're unsure of.
- Money is always integer cents in the database and in `lib/`. Convert to and from dollars only at the edges (UI, MCP arguments and results).
- Pure logic goes in `lib/` with tests in `lib/*.test.ts` (run with `node --test`, no extra test framework).
- Schema changes: add `supabase/migrations/000N_name.sql` (never edit an applied migration), apply it to the project, and enable row-level security on new tables.
- Never put secrets in the repo, in `NEXT_PUBLIC_*` variables or in client code. The repo is **public**.
- Never delete or bulk-rewrite real data in the database. Tests use rolled-back transactions or a throwaway user that you delete afterwards.
- Never publish anything to eBay or Whatnot, never buy, bid or message anyone. eBay integration creates drafts only.

## Done means
Everything in "QA: Definition of Done" in `docs/STORIES.md`. If you can't finish, leave the branch in a state
where the checks pass, and say exactly what's left.

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

## Project facts
- Supabase project `nflinventory`, ref `ngxfvhlbrhlqarpwavcf` (eu-west-1). Publishable key and URL are in `.env.example`.
- Hosting: Vercel (project imported from `2weiX/nflinventory`, branch `main`).
- Dennis's own MCP "football" (sets, checklists, odds, box prices, card prices) runs on his Hermes harness.
  For S8 (value refresh) Claude combines it with this app's MCP. For S16 (board pricing) the **harness** scrapes and
  prices boards hourly and pushes them to this app's ingest endpoint. The app never scrapes Whatnot and never
  re-implements the pricing model.
- Whatnot is **read-only** for this app: read boards, never click buy/bid/spot buttons, never place pre-bids.
- eBay developer account: approval pending (registered 2026-11-21). S11 and S12 stay blocked until keys exist.
