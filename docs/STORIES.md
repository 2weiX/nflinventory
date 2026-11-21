# User stories and acceptance criteria

The single source of truth for what this app must do. Agents: pick the highest-priority story that isn't **Done**,
follow `AGENTS.md`, and prove every acceptance criterion before you mark a story Done.

**User:** Dennis, an NFL card collector and seller. He buys breaks on Whatnot and sells singles on eBay, Whatnot and at shows.
He works at a desk for bulk jobs and on his phone at shows. He also works through Claude, which has his own
"football" MCP (sets, checklists, odds, prices) running on his Hermes harness.

**Status key:** ✅ Done · 🔜 Next · ⏳ Blocked · 💤 Later

| ID | Story | Priority | Status |
|---|---|---|---|
| S1 | Sign in, private data | P0 | ✅ v1 |
| S2 | Browse and find cards | P0 | ✅ v1 |
| S3 | Add and edit a card | P0 | ✅ v1 |
| S4 | Import any inventory sheet | P0 | ✅ v1 |
| S5 | Record a sale, see profit | P0 | ✅ v1 |
| S6 | Export and back up | P1 | ✅ v1 (CSV); JSON backup 🔜 |
| S7 | Claude can work with my inventory (MCP) | P0 | 🔜 |
| S8 | Claude refreshes values with my football MCP | P1 | 🔜 (needs S7) |
| S9 | Value history per card | P1 | 🔜 |
| S10 | Works well on my phone at a show | P1 | 🔜 |
| S16 | Price a Whatnot board from a link | P2 | 🔜 (needs football MCP URL + ledger from Dennis) |
| S11 | Create an eBay draft in one click | P0 | ⏳ eBay developer approval |
| S12 | Match cards to the eBay catalog | P1 | ⏳ needs S11 keys |
| S13 | Whatnot integration | P3 | 💤 |
| S14 | Link cards to the break they came from | P3 | 💤 |
| S15 | Scan photos to add cards | P3 | 💤 |

---

## S1 · Sign in, private data ✅
*As Dennis, I sign in once and only I can see my cards, so a public URL and a public repo are safe.*

- [x] Email + password sign-in; signed-out visitors are sent to `/login` from every page.
- [x] Every table has row-level security: user B reading or writing user A's rows gets 0 rows / an error. (Verified with a two-user SQL test in a rolled-back transaction.)
- [x] Only the publishable Supabase key is used in the browser. No secret or service-role key exists in the repo or in `NEXT_PUBLIC_*` variables.
- [ ] Setup note: after Dennis creates his account, "Allow new users to sign up" is off. (Manual step for Dennis.)

## S2 · Browse and find cards ✅
*As Dennis, I find any card in seconds by player, number, parallel or print run.*

- [x] Search matches player, card #, parallel, team, set, insert and `/N` ("hurts", "NFLS-35", "/99"). All words must match.
- [x] Filters: status (default: in stock + listed), set, has eBay catalog ID, grading candidates.
- [x] Sort: value (high→low, default), player, card #, newest.
- [x] Identical copies collapse into one row with ×N (toggle).
- [x] Totals line shows the card count and estimated value of what's filtered.
- [x] Select rows → change the status of all of them in one action.

## S3 · Add and edit a card ✅
*As Dennis, I add a new card fast and fix any detail later.*

- [x] Required: card number and player. Everything else optional.
- [x] Fields: year, brand, set, insert, card #, player(s), team, jersey #, parallel, /N, copy #, auto (on-card / sticker / unknown), RC, patch, grade-it, grader, grade, status, cost, value, ask price, price source link, eBay ePID, notes.
- [x] "Save & add another" keeps year, brand, set and team for the next card.
- [x] Duplicate makes a copy; Delete asks first and can't be undone.
- [x] Shows an eBay title of at most 80 characters with a Copy button.

## S4 · Import any inventory sheet ✅
*As Dennis, I bring in any sheet, including ones I haven't made yet, without code changes.*

- [x] Sources: `.xlsx` (choose the tab), `.csv`, or a Google Sheets link shared as "anyone with the link".
- [x] Columns are guessed from their headers; every guess can be changed; unknown columns default to "ignore".
- [x] Year, brand, set and status for the whole sheet are guessed from the file name and editable.
- [x] Preview shows the first 25 cards, the number ready and the number skipped (rows without a card number).
- [x] Warns when the same file and tab were already imported.
- [x] Each import can be undone in one click.
- [x] Both real sheets parse: `toppsinventory` 82/82, `inceptioninventory` 73/73 (`npm test` covers the rules).
- [ ] 🔜 Imports over 1,000 rows still work (chunked inserts exist; add a test).

## S5 · Record a sale, see profit ✅
*As Dennis, I know what I actually made on every card.*

- [x] Record a sale with channel (eBay, Whatnot, show, other), date, price, fees and shipping; the card becomes Sold.
- [x] Profit = price − fees − shipping − cost (missing cost counts as 0). The `card_profit` view and the UI agree.
- [x] Sales page: totals per year (revenue, fees + shipping, cost, profit), per channel, and a CSV export.

## S6 · Export and back up
- [x] CSV export of the current inventory view.
- [ ] 🔜 One-click JSON backup of all tables, and a restore that refuses to create duplicates.

---

## S7 · Claude can work with my inventory (MCP) 🔜 P0
*As Dennis, I ask Claude, on any device, "what Mendoza cards do I have in stock?" or "mark the Hurts /99 as sold for $40 on Whatnot", and it happens in my app.*

**Design constraints**
- A remote MCP server inside this app at `/api/mcp` (Streamable HTTP), deployed on Vercel. Use the official `@modelcontextprotocol/sdk`.
- Claude connects from Anthropic's cloud, so the endpoint must be public HTTPS on port 443.
- Auth: OAuth 2.1 as the MCP spec requires, so it can be added in Claude under Customize → Connectors → custom. Use Supabase Auth as the identity provider. Every tool call runs **as the signed-in user**, so row-level security still applies. Never use the service-role key for tool calls.

**Tools** (names are a contract; keep them stable)
| Tool | Does |
|---|---|
| `search_cards` | Same filters as S2 (query, status, set, has_epid, grading). Returns compact rows with an id. |
| `get_card` | One card with all fields, its sales and its listings. |
| `add_card` | Creates a card. Validates like S3. Returns the id. |
| `update_card` | Changes the given fields only (partial update). |
| `set_status` | Status for one or many card ids. |
| `record_sale` | Same rules as S5. |
| `inventory_summary` | Counts and values by status and set, plus profit year-to-date. |

**Acceptance criteria**
- [ ] Without a token, `/api/mcp` returns 401 with a `WWW-Authenticate` header pointing to the protected-resource metadata. The OAuth discovery endpoints work.
- [ ] Added as a custom connector in claude.ai: sign-in completes in the browser and all 7 tools are listed.
- [ ] Tested in claude.ai: each of these works end to end:
      "how many cards are in stock and what are they worth?",
      "find my Caleb Williams cards",
      "add 2026 Topps Flagship #151 Fernando Mendoza, /150, value $160",
      "mark that card sold on eBay for $175, fees $23, shipping $1".
- [ ] A second test account's token cannot read or change the first account's cards through any tool.
- [ ] Money goes in and out as dollars in tool arguments and results, and is stored as cents. Bad input gets a clear error, not a crash.
- [ ] `docs/MCP.md` explains how to add the connector and lists every tool with an example.
- [ ] Unit tests for argument validation and the dollars ↔ cents conversion.

## S8 · Claude refreshes values with my football MCP 🔜 P1 (needs S7, S9)
*As Dennis, I tell Claude "update the values of my in-stock Flagship cards" and it prices them with my football MCP and writes the new values into the app.*

- Claude does the orchestration: it uses both connectors in the same chat. The app doesn't call the football MCP itself.
- [ ] `update_card` (or a new `set_values` tool for many cards) accepts a value **with its source** (e.g. `football:pc`) and a date. The value goes to `estimate_cents` and into the history from S9.
- [ ] A test in claude.ai with both connectors updates at least 10 cards. Each changed card shows its new value, source and date.
- [ ] Cards the football MCP can't price are left unchanged and listed back to Dennis. No zero or blank values get written.

## S9 · Value history per card 🔜 P1
*As Dennis, I see how a card's value moved and where each number came from.*

- [ ] New table `card_values` (card_id, value_cents, source, observed_at, user_id) with row-level security, plus a numbered migration in `supabase/migrations/`.
- [ ] Changing the value in the UI or through MCP adds a history row. The card keeps the latest value in `estimate_cents`.
- [ ] The card page shows the history (date, value, source). The inventory shows the source and date of the current value on hover.

## S10 · Works well on my phone at a show 🔜 P1
*As Dennis, at a show I look up a card and record a cash sale in under 30 seconds on my phone.*

- [ ] At 375 px width: no horizontal scrolling except inside the table, tap targets at least 40 px, and the search box at the top.
- [ ] Inventory becomes a card list on small screens: player, #, variant, value, status.
- [ ] The card page shows "Record sale" near the top on mobile, defaulting to channel "show" and today's date.
- [ ] The app can be added to the home screen (web app manifest and icon).

## S16 · Price a Whatnot break board from a link 🔜 P2 (needs S7 for the Claude part only)
*As Dennis, I paste a Whatnot link into the app. It reads the board and shows, for every spot, what the room usually pays, what the cards are fair for (odds × checklist × player prices) and my max bid. I can see at a glance which spots are worth bidding on, and I bid by hand.*

**Two fair values per spot, shown side by side**
1. **Room price:** what buyers actually pay for this team, in this product and box kind. Method (bidding playbook): take every sold-out board that isn't random-team, normalise each board to its own total, take the **median team share across boards**, pooled across sellers, scale so one box = box cost, × number of boxes.
2. **Card value:** what the cards are worth. Expected hits per box from the **odds** × which teams hold which cards from the **checklist** × **player prices**, attributed to teams, × number of boxes. Show coverage honestly: when most cards are unpriced, mark the value as a floor.

**Max bid:** a rule computed from the two (default `min(room, card)`, as breakwatch does). The rule is a setting, so Dennis can change it without code. Always show both inputs next to it.

**Data sources**
- **Whatnot board:** read-only, from the pasted link (show or break URL). No clicking, no buying, no bidding, no pre-bids, ever. First task is a spike: can the server read the board's public data from the link (title, description, seller, spots, asks, sold prices)? If Whatnot blocks server requests, fall back to a bookmarklet Dennis runs on the open board in his own browser. It reads the visible data and sends it to the app. Document which route works.
- **Dennis's football MCP (Hermes harness):** the app calls it **server-side** for `box` (box cost by format), `odds`, `checklist` and `pc` (prices). Needs `FOOTBALL_MCP_URL` and `FOOTBALL_MCP_TOKEN` in Vercel env only. Cache answers per product for a few hours.
- **Room-price history:** every board the app reads is stored (spots, sold prices, seller, box kind, mechanic, sold-out). Plus a one-time import of Dennis's existing ledger (≈313 boards, 10,160 spots) so room prices work from day one.

**Rules carried over from the playbook (each one needs a test)**
- Random-team boards (≤3 distinct prices, max/min spread < 1.3) are stored but excluded from room prices.
- Team names are matched by the **full team name anchored at the start** of the spot title; short aliases that collide (e.g. "Washington", "Arizona") are not used. Player spots on pick-your-player boards are summed into team totals, but only for sold-out boards with a "Rest/Others" spot.
- The number of boxes and the box kind are parsed from title and description separately, taking the richer; the two are never summed. If unclear, ask Dennis on the page instead of guessing 1.
- Hobby, Value, Mega, Jumbo, Blaster, Hanger and Fat Pack are never compared with each other.
- Sold prices ending in .20 indicate a running 20% code: show the effective ask (0.8×).
- Room prices need at least N sold-out boards (default 5, setting); below that, show "too few boards" instead of a number.

**Acceptance criteria**
- [ ] Paste a Whatnot link → within 30 s the board page shows: product, box kind, boxes, seller, mechanic, and per spot: ask (or sold price), room price, card value, max bid, edge (max bid − ask), flag.
- [ ] Whole-board line: total asks ÷ (boxes × box cost), and how many boards the room price is based on.
- [ ] Spots sort by edge. Buy flags where ask ≤ max bid. Spots already sold show their price, and how they compare to the room price.
- [ ] "I bought this spot" with the price paid, which feeds the S5 profit view later (cost basis) and S14 (cards from this break).
- [ ] Tables `boards`, `board_spots` (and `ledger_imports` if useful) with row-level security and a numbered migration.
- [ ] Unit tests for: random-team detection, team-name matching (including the Raiders/Washington and Arizona cases), box parsing, median-share room price, card value with coverage, the max-bid rule.
- [ ] Check against reality: for 3 boards already in the ledger, the app's room price per team is within 10% of the ledger's own median share. Document the comparison in the handoff.
- [ ] The football MCP being down or slow shows "card value unavailable", and room price still works.
- [ ] MCP tools for Claude (once S7 exists): `price_board(url)`, `list_boards`, `get_board`, `mark_spot_bought`.

**Dennis must provide:** the football MCP's URL and how it authenticates (token), and where the ledger CSV lives (or upload it once).

## S11 · Create an eBay draft in one click ⏳ (waiting for eBay developer approval)
*As Dennis, I press one button on a card and an eBay draft appears in my Seller Hub, ready for photos and a final check.*

- [ ] Server-side eBay OAuth (user token, `sell.inventory` scope). Tokens are stored encrypted per user, refresh automatically, and are never sent to the browser. Keys live only in Vercel env vars: `EBAY_CLIENT_ID`, `EBAY_CLIENT_SECRET`, `EBAY_RUNAME`.
- [ ] The draft uses the ePID when there is one, otherwise title + category 261328 + item specifics (player, team, year, manufacturer, set, card #, parallel, print run, auto, RC, graded).
- [ ] It never publishes. Draft only. A `listings` row is saved with the eBay id; the card status stays unchanged until Dennis publishes.
- [ ] Rate limits get retries with backoff. eBay errors are shown in plain words.
- [ ] Exposed as an MCP tool `create_ebay_draft` once S7 exists.
- Reference: `YosefHayim/ebay-mcp` (MIT) for the OAuth and token-refresh patterns.

## S12 · Match cards to the eBay catalog ⏳
- [ ] For cards without an ePID: search eBay's catalog by year + set + player + card #, then pick the parallel using the name mapping in the Whatnot project (`ebay-catalog-parallel-mapping.md`).
- [ ] Shows the candidates for confirmation; never assigns one silently.

## 💤 Later: S13 Whatnot integration (selling side; board pricing is S16) · S14 link cards to the break they came from (from Dennis's break trackers) · S15 photo scanning with a review step

---

# QA: Definition of Done (every story, every agent)

A story is **Done** only when all of these hold. Paste the evidence in `docs/HANDOFF.md`.

1. **Checks pass:** `npm test`, `npm run typecheck`, `npm run build`, all clean.
2. **Tests:** new logic (parsing, money, validation, permissions) has unit tests next to it (`lib/*.test.ts`).
3. **Database:** every schema change is a new numbered file in `supabase/migrations/` that is also applied to the project. Every new table has row-level security plus a two-user test. Supabase security advisors show no new warnings.
4. **Security:** no secrets in git (`git grep -iE "secret|service_role|sk-|EBAY_CLIENT_SECRET="` finds only docs and examples). Server-only keys never appear in `NEXT_PUBLIC_*` or client code.
5. **No data loss:** never delete or rewrite Dennis's existing rows in a migration. Destructive actions in the UI ask first.
6. **Works in a browser:** the changed screens were opened on the deployed preview at desktop width and at 375 px. Empty, loading and error states all show something sensible.
7. **Acceptance criteria:** each one ticked, with a one-line note on how it was verified.
8. **Docs:** README and the story's checkboxes updated. Any new environment variable added to `.env.example`.
