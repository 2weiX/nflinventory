# Handoff log

Newest entry first. Every agent adds one entry at the end of its turn (format in `AGENTS.md`).

## 2026-11-24 · Claude Sonnet 5.5 · C002 + C003 import data-loss fixes
Status: In progress (code done and built clean; PR not opened; count query untested live)
Branch / PR: story/C002-C003-import-data-loss, no PR yet. The page edit was swept into the harness's commit 4b4f9e3 on main; lib/importResult.ts and its test are committed on the branch (1830936).
What changed:
- C002: `undo()` in app/import/page.tsx now counts sales and listings on the batch's cards first (embedded `cards!inner` count). Sales present: undo is refused with "N sales recorded on cards from this import - delete those sales first". Only listings: the confirm names them ("M listings will be deleted too"). The card-delete error is checked; the import_batches row is only deleted if the card delete succeeded; errors are shown.
- C003: the importer collects each sale insert's outcome; `summarizeSaleInserts` / `saleWarning` (new lib/importResult.ts) produce an amber banner "N of M sold rows lost their sale: <first message>" with an Undo link, shown even when zero sales landed. The loop keeps going.
- No migration. The Postgres-RPC variant is deferred.
Evidence: in a clean clone of the branch (so the stray .vscode in the working dir is absent): `npm test` passes, `npm run typecheck` clean, `next build` succeeds (7 routes). The count query is `select("id, cards!inner(import_batch_id)", {count:"exact", head:true}).eq("cards.import_batch_id", id)`; supabase-js emits `?select=id,cards!inner(import_batch_id)&cards.import_batch_id=eq.<id>` (checked with a stub fetch), the standard PostgREST inner-join filter, and sales/listings each have exactly one FK to cards. NOT run against live Supabase (no throwaway user available: sign-ups are off and there is no service key), so the filtering itself is unverified.
Open issues / next step: open a PR; before merging, check the undo count on a real batch with sales (expect >0 refusal) and on a batch without (expect 0). Untracked .vscode/.idea/.bashrc etc. in the working dir are not from this change.
Anything Dennis must do: nothing.

## 2026-11-23 · Claude (with Dennis) · Agents ship their own work
Status: Done
Branch / PR: story/merge-policy
What changed: PR #1 (Price field) merged and live. AGENTS.md has a new "Shipping" section: agents merge their own PR once Done, wait for the Vercel deploy, smoke-check /login, and revert on failure. Additive migrations allowed; destructive ones wait for Dennis.
Evidence (tests, build, manual checks): Vercel status `success` on a10b841.
Open issues / next step: S7 MCP endpoint.
Anything Dennis must do (keys, settings, decisions): Nothing. Destructive DB changes will show up here when an agent needs one.

## 2026-11-23 · Claude (with Dennis) · Deploy + "Price" (last eBay comp) field
Status: Done
Branch / PR: story/comp-price (merged to main)
What changed:
- App is live at https://nflinventory-weld.vercel.app. Added NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in Vercel (all environments). Supabase Site URL + redirect set to the Vercel domain. Dennis created his account; public sign-ups are now OFF.
- New column `cards.comp_cents` (migration 0002, applied) = **Price**, the last researched eBay comp. `estimate_cents` = **Est. price** (used when there's no comp). `list_price_cents` = eBay list price (ask), no longer shown in the inventory list.
- Importer: a sheet column "PRICE" now maps to Price (comp), not list price. "list price"/"ask" still map to list price.
- Inventory list shows Price and Est. price; sorting and the total use Price, falling back to Est. price.
- Data fix (Dennis asked): the Midnight import had put PRICE into list price; moved those 35 values to comp_cents. 50 cards, every one has Price or Est. price.
Evidence (tests, build, manual checks): npm test 9/9, typecheck clean, next build ok, SQL count check after the move.
Open issues / next step: S7 MCP endpoint is still the top story. S8 (value refresh) should write comp_cents.
Anything Dennis must do (keys, settings, decisions): Supabase org shows "Exceeding usage limits" (likely another project); check before it restricts this one.

## 2026-11-23 · Claude (with Dennis) · eBay keyset compliance
Status: Done (account setting), follow-up added to S11
Branch / PR: main (docs only)
What changed: eBay Production keyset `nflinventory` was "Non Compliant". Dennis enabled the Marketplace Account Deletion **exemption** (reason: "I do not persist eBay data"); the keyset now shows as compliant. Added an S11 acceptance criterion: build the account-deletion endpoint and switch off the exemption before the app stores any eBay data.
Evidence: eBay developer portal, Alerts & Notifications (production) no longer shows "Non Compliant"; "Get OAuth Application Token" is now offered.
Open issues / next step: S11 still needs the eBay user sign-in setup (RuName with accept/decline URLs on the Vercel domain) and the keys in Vercel env vars.
Anything Dennis must do: deploy to Vercel so the RuName and the account-deletion endpoint have a real address.

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
- For S16: on the harness, add a step that pushes priced boards to `/api/ingest/boards` and polls `/api/ingest/requests` (contract in `docs/INGEST.md` once S16 is built). Generate a long random `INGEST_TOKEN` and set it in Vercel and on the harness; also set `SUPABASE_SECRET_KEY` and `OWNER_USER_ID` in Vercel.
- When eBay approves the developer account: create the Production keyset + RuName and put them in Vercel env vars (unblocks S11).
