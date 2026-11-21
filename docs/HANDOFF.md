# Handoff log

Newest entry first. Every agent adds one entry at the end of its turn (format in `AGENTS.md`).

## 2026-11-21 · Claude (setup session) · v1 baseline
Status: Done (S1–S5, S6 CSV part)
Branch / PR: main @ initial commit
What changed: Schema `0001_init.sql` (cards, sales, listings, import_batches, card_profit view, row-level security). Next.js app: inventory, card page, sales & profit, import wizard (.xlsx / .csv / Google Sheets link), CSV export.
Evidence: `npm test` 9/9 pass (incl. real rows from both sheets); full sheets parse 82/82 and 73/73; `next build` clean; two-user row-level security test in a rolled-back transaction (user B sees 0 rows, profit maths correct).
Open issues / next step:
- Screens not yet seen in a browser (no deployment at the time). First agent: once the Vercel preview exists, do a visual pass at desktop and 375 px.
- Next story: **S7 MCP endpoint** (P0), then S9 → S8 → S10 → S16 (Whatnot board pricing).
Anything Dennis must do:
- Deploy on Vercel with the two env vars from `.env.example`; set Supabase Auth Site URL to the Vercel URL; create your account; then turn off "Allow new users to sign up".
- Import toppsinventory from the live Google Sheet (it carries the eBay IDs), then inceptioninventory.
- For S16 (board pricing from a Whatnot link): give the football MCP's URL + token (as Vercel env vars `FOOTBALL_MCP_URL`, `FOOTBALL_MCP_TOKEN`), and the existing board ledger CSV. Max bid defaults to min(room price, card value); change it any time in settings.
- When eBay approves the developer account: create the Production keyset + RuName and put them in Vercel env vars (unblocks S11).
