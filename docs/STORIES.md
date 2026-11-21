# User stories and acceptance criteria

The single source of truth for what this app must do. Agents: pick the highest-priority story that isn't **Done**,
follow `AGENTS.md`, and prove every acceptance criterion before you mark a story Done.

**User:** Dennis, an NFL card collector and seller. He buys breaks on Whatnot and sells singles on eBay, Whatnot and at shows.
He works at a desk for bulk jobs and on his phone at shows. He also works through Claude, which has his own
"football" MCP (sets, checklists, odds, box prices, card prices) running on his Hermes harness.

**The systems this app draws on (state as of 2026-11-20, verified live):**

- **The football MCP** (`dennis.taila812b8.ts.net/cc/mcp`, local `127.0.0.1:8742/mcp`; caps 20 req/min/token,
  30 s statement timeout, SELECT-only role) serves **seven live products**: Flagship 2026 (43,770 variants),
  Chrome 2026 (25,091 variants, 15,162 numbered print runs, 2,603 official odds rates across 8 box formats),
  Chrome 2025 (24,220), Midnight 2026 (7,543), Inception 2024+2026 (13,546), Heritage 2026 (8,891),
  Donruss/Optic 2022–2025, and 1990 Panini Score (934 variants with ~4,600 immediate vintage comps).
  Tools: `pc` (prices, /N run queries), `odds` (per-format pack rates), `checklist`, `box` (EU sealed
  basis `v_box_basis`), `sets`, `status`.
- **`2weiX/breakdata`** on GitHub: Whatnot football boards hand-classified (321+ boards at ingest;
  `breaks.csv` one row per break with seller/product/mechanic/prices, `spots/<break_id>.csv` per spot,
  daily scans in `scan/`). S16's harness side reads it; its columns are the ingest payload's source.
- **The break economics tables** in the same football database (`break`, `spot`, `spot_event`,
  `sold_rate`, `purchase`): realized spot sales, not just asks. Value refreshes (S8) can cite realized
  comps (`football:sold_rate`) alongside ask comps (`football:pc`).
- **The overnight discussion loop** in `bin/`+`discussion/` argues about what the stories should be; a
  claim that reaches a verdict proposes a story change here (see AGENTS.md's loop section).

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
| S16 | Whatnot board prices from the harness (desktop) | P2 | 🔜 |
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
- [ ] `update_card` (or a new `set_values` tool for many cards) accepts a value **with its source** and a date. The value goes to `estimate_cents` and into the history from S9.
- [ ] A test in claude.ai with both connectors updates at least 10 cards. Each changed card shows its new value, source and date.
- [ ] Cards the football MCP can't price are left unchanged and listed back to Dennis. No zero or blank values get written.

**Value sources (the football MCP, verified live 2026-11-20):**

| Source id | What it is | Use for |
|---|---|---|
| `football:pc` | ask comps from `card_price` (SCP loose/cib/graded) | default valuation |
| `football:sold_rate` | realized sales from the break economics tables (`sold_rate`, `purchase`) | realized-comp sanity check |
| `football:box_basis` | EU sealed-box basis per product and format (`v_box_basis`) | sealed/break cost side |
| `football:odds` | official per-format pull rates (e.g. Chrome 2026: 588 labels × 8 formats) | expected-value math on packs/breaks |

**Constraints the refresh must respect (from the MCP's actual caps):**
- The football MCP allows **20 requests/minute per token** with a **30 s statement timeout**. A bulk refresh
  of 100+ cards must pace itself (~5 minutes for 100 `pc` calls) — Claude batches and paces; the app never
  assumes the whole stock can be refreshed in one call.
- Print-run queries go through `pc`'s `/N` run filter (e.g. `mendoza chrome /299` resolves the Lavender
  Refractor) — the source string in the value history records the exact query, so a value is traceable.
- The MCP is SELECT-only: it can price but never mutate anything. All writes happen through this app's own MCP.

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

## S16 · Whatnot board prices from the harness 🔜 P2
*As Dennis, I open the app on my desktop and see every Whatnot board my harness scraped this hour. For each spot I see the room price, the card value and my max bid, with good buys flagged. When I paste a board link the harness hasn't seen yet, it gets priced on the next run.*

**Who does what**
| Where | Does |
|---|---|
| **Hermes harness** (Dennis's, hourly) | Scrapes Whatnot boards (read-only), saves board numbers and data to GitHub, prices each board with the football MCP (room price + card value + max bid), and **pushes the result to this app**. |
| **This app** | Receives and stores the priced boards, shows them, takes "please price this link" requests, records which spots Dennis bought. **The app does no scraping and no pricing maths.** That keeps one pricing model, on the harness. |

**Desktop first.** The board screens are built for a desktop width. On the phone they only need to be readable (S10 rules don't apply here).

**What the app builds**
1. **Ingest endpoint** `POST /api/ingest/boards`: the harness sends one or many priced boards as JSON. Idempotent per Whatnot break id: resending replaces that board's spots. Authenticated with a long random `INGEST_TOKEN` (Vercel env, server-only; the harness keeps the same value). Rows are written as Dennis's user (`OWNER_USER_ID` env) using the Supabase secret key **on the server only**.
2. **Request queue**: pasting a Whatnot link in the app stores the break id in `board_requests` (status: waiting / priced / failed + reason). The harness picks them up with `GET /api/ingest/requests` (same token) and marks them done when it pushes the board.
3. **Boards list** (desktop): newest first. Seller, product, box kind, boxes, start time, mechanic, whole-board ratio (total asks ÷ (boxes × box cost)), number of buy flags, last priced.
4. **Board page**: per spot: ask or sold price, room price, card value, max bid, edge (max bid − ask), flag, and the number of boards behind the room price. Sorted by edge. Random-team boards are labelled. A standing .20 discount shows the effective ask. A "data age" warning shows when the last push is over 2 hours old.
5. **"I bought this spot"** with the price paid (feeds profit and S14 later).

**Payload contract** (`docs/INGEST.md`; the harness must match it, so version it)
```json
{
  "version": 1,
  "boards": [{
    "break_id": "6155252", "url": "https://www.whatnot.com/...", "seller": "zo20rips",
    "title": "...", "product": "2026 Topps Inception", "box_kind": "hobby", "boxes": 4,
    "mechanic": "auction|list|rtb|rtb-div", "currency": "EUR", "starts_at": "2026-11-22T19:00:00Z",
    "sold_out": false, "box_cost_cents": 21900,
    "model": "breakwatch min(fair_retail,fair_sold) v3", "priced_at": "2026-11-21T22:00:00Z",
    "spots": [{ "name": "Las Vegas Raiders", "kind": "team|team-player|team-others|multi-team|blank",
                "ask_cents": 3100, "sold_cents": null, "room_cents": 2850, "room_n": 27,
                "card_cents": 2400, "card_coverage": 0.62, "max_bid_cents": 2400 }]
  }]
}
```

**Acceptance criteria**
- [ ] Ingest rejects a missing or wrong token (401), an unknown `version` (400) and a malformed board (400, with the reason). It never writes partial boards.
- [ ] Sending the same board twice gives one board with the newer spots, not duplicates.
- [ ] Tables `boards`, `board_spots`, `board_requests` with row-level security (Dennis reads; only the server writes ingest rows) and a numbered migration.
- [ ] Paste link → request shows "waiting" → after a simulated harness push it shows the priced board. Tested with a script in `scripts/` that posts a sample payload.
- [ ] Money as cents with the currency per board. No conversion.
- [ ] Unit tests: payload validation, buy-flag and edge maths, whole-board ratio, .20 discount detection, stale-data warning.
- [ ] `docs/INGEST.md` documents the endpoint, the payload, the token setup and a curl example for the harness side.
- [ ] Secrets: `INGEST_TOKEN` and the Supabase secret key exist only in Vercel env vars and on the harness, never in the repo or browser code.

**Harness side (not in this repo, for Dennis's harness agents):** add a step after hourly pricing that posts to `/api/ingest/boards`, and poll `/api/ingest/requests` for pasted links.

**Harness-side data sources, verified live 2026-11-20:**
- Board inventory: `2weiX/breakdata` (`scan/` daily scans, `breaks.csv` per-break rows, `spots/<id>.csv`
  per spot). The payload contract above maps 1:1 from its columns (`seller` → `seller`, `product` →
  `product`, `boxes` → `boxes`, spot rows → `spots`); `mechanic` derives from `wn_format` +
  `wn_spot_type` (PICK_YOUR + TEAM → team boards, PICK_YOUR + CUSTOM → pick-your-own).
- `box_cost_cents`: from the football MCP's `box` tool (EU sealed basis, `v_box_basis`) per product and
  format — e.g. Chrome 2025 value €59.99, blaster €60.00 as of the last observation — falling back to
  the board's own box count × the seller's stated per-box price when the product has no basis row.
- Card values (`card_cents`): from the football MCP's `pc` per spot's player/set/parallel, paced at the
  MCP's 20 req/min cap (a 32-spot board ≈ 2 minutes of pacing).
- The pricing model itself ("breakwatch min(fair_retail,fair_sold) v3") lives on the Mac and stays there;
  this repo consumes its output through the ingest contract only.

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
9. **MCP contract tests (S7/S8):** every exposed MCP tool has a unit test for argument validation, the
    dollars ↔ cents conversion, and the unauthenticated 401 path. A tool renamed or added without
    updating `docs/MCP.md` fails review — the tool names are a contract.
10. **Ingest contract tests (S16):** the payload version is checked; a re-post of the same board id
    produces one board, not duplicates; a malformed board writes nothing (all-or-nothing); the
    `INGEST_TOKEN` path rejects a missing or wrong token.
11. **External-data traceability (S8/S16):** every value or board price carries its source
    (`football:pc`, `football:sold_rate`, `football:box_basis`) and an `observed_at` date. A value
    without a source is a bug, not a style choice.
12. **Discussion-loop hygiene (loop rounds only):** a round file's `model:` frontmatter matches the
    roster's declaration for its role, the round touches only `discussion/`, and
    `bin/gate-independence` passed. The loop never edits stories, app code or the database — its
    output is a verdict, and the verdict's evidence is what a story agent consumes.
