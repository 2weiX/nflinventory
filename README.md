# NFL Inventory

Personal sports card inventory: track every card, what it's worth, what it sold for, and list it on eBay.
It replaces the old Google Sheets.

**Stack:** Next.js 16 · Supabase (Postgres, auth, row-level security) · Tailwind · deploys to Vercel.

## What it does (v1)

- **Inventory:** search by player, card #, parallel, team or `/99`. Filter by status, set, eBay catalog match and grading candidates. Duplicates are grouped (×4). Bulk status changes. CSV export.
- **Card page:** every detail (set, insert, parallel, serial, RC, auto on-card/sticker, patch, grading). Cost, value and ask price. A ready-made 80-character eBay title. The eBay catalog link.
- **Sales & profit:** record a sale (eBay, Whatnot, show, other) with fees and shipping. Profit = price − fees − shipping − cost, shown per card and in totals by year and channel.
- **Import:** upload an `.xlsx` or `.csv`, or paste a Google Sheets link. Columns are matched automatically; you check them, preview, then import. Past imports can be undone.
- **Coming next:** one-click eBay drafts through the eBay API, once the developer keys are approved.

## Set up (once)

1. **Supabase:** the database schema is in `supabase/migrations/0001_init.sql` and is already applied to the `nflinventory` project.
   - Authentication → Sign In / Providers → Email: keep it on. After you've created your own account, turn **"Allow new users to sign up" off**, so nobody else can register.
2. **Vercel:** New Project → import `2weiX/nflinventory` → add two environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://ngxfvhlbrhlqarpwavcf.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = the publishable key (Supabase → Project Settings → API Keys)
   - Deploy.
3. **Supabase → Authentication → URL Configuration:** set Site URL to your Vercel URL, so confirmation emails link to the app.
4. Open the app → "First time? Create your account" → confirm the email → sign in → **Import**.

Both environment values are public by design. Every row is locked to its owner by row-level security. Never put the Supabase **secret** key or eBay keys in `NEXT_PUBLIC_*` variables or in the repo.

## Develop locally

```bash
cp .env.example .env.local   # fill in the publishable key
npm install
npm run dev                  # http://localhost:3000
npm test                     # importer tests
```

## Data model

- `cards`: one row per physical card. Money is stored in whole cents. Status is `in_stock` → `listed` → `sold`, or `personal`.
- `sales`: one row per sale. The `card_profit` view calculates profit.
- `listings`: eBay or Whatnot listings (used by the coming eBay integration).
- `import_batches`: each import, so it can be undone.
