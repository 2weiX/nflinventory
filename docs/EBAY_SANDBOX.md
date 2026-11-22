# eBay REST API - sandbox credentials

Registered 2026-11-22. Sandbox keys, safe to commit **except the Cert ID**,
which functions as a password (it mints OAuth tokens) and lives in the local
environment file, never in the tree. GitHub push protection also blocks eBay
secret patterns on public repos.

| Field | Value | Where |
|---|---|---|
| App ID / Client ID | `5465daib-nflinven-SBX-cd09bb0ca-ba9b149f` | here + local env (`EBAY_SANDBOX_APP_ID`) |
| Dev ID | `01432ecc-dc8e-4876-8c49-eb85dfc2325b` | here + local env (`EBAY_SANDBOX_DEV_ID`) |
| Cert ID | **not committed** | local env only (`EBAY_SANDBOX_CERT_ID`) |

Notes for whoever builds S11/S12:

- Token exchange uses the **user token flow** (OAuth 2.1: authorization code +
  refresh) for anything acting as a user, and the **client-credentials flow**
  (App ID + Cert ID) for public-data lookups like catalog/category reads.
- The user-token flow needs a **redirect URL** registered in the eBay dev
  portal; that is not recorded yet. The Mac-side Claude or the app agents
  should ask before guessing it.
- `reference: YosefHayim/ebay-mcp (MIT)` holds working OAuth + refresh
  plumbing (S11's named reference).

## Production

Production keys are a different App ID + Cert ID pair under the same developer
account, minted when the eBay developer-program approval completes. **Production
credentials follow the standing rule: environment file only, never committed,
never pasted into chat** - even though these sandbox ones were, because the
owner judged the sandbox pair low-risk. The Cert ID in any form stays out of
the tree.

Unblocks (per docs/STORIES.md): S11 eBay draft creation can now be built and
tested against the sandbox; the production cutover stays behind the developer
approval.
