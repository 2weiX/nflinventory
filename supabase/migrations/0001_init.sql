-- NFL Inventory: initial schema
-- One row in `cards` = one physical card. Money is stored in whole cents.

create type card_status as enum ('in_stock', 'listed', 'sold', 'personal');
create type sale_channel as enum ('ebay', 'whatnot', 'show', 'other');

create table import_batches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  file_name text not null,
  set_label text,
  column_mapping jsonb not null default '{}'::jsonb,
  row_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,

  -- identity
  year integer,
  brand text,                 -- e.g. Topps
  set_name text,              -- e.g. Flagship, Inception
  subset text,                -- e.g. Wild Card Moments, 1991 Topps Chrome
  card_number text not null,
  player_names text not null,
  team text,
  jersey_number text,

  -- variant
  parallel text,              -- e.g. Gold Foil, Green Rainbow Foil
  serial_to integer,          -- the /N print run
  serial_number integer,      -- this copy's number, e.g. 24 of /99
  is_rookie boolean not null default false,
  is_auto boolean not null default false,
  auto_type text check (auto_type in ('on_card', 'sticker')),
  is_patch boolean not null default false,

  -- grading
  grader text,                -- PSA, BGS, SGC
  grade text,
  grading_candidate text check (grading_candidate in ('yes', 'maybe', 'no')),

  -- money (cents)
  cost_cents integer,
  estimate_cents integer,
  list_price_cents integer,

  -- status + marketplace
  status card_status not null default 'in_stock',
  ebay_epid text,
  ebay_catalog_title text,
  ebay_reference_ids text,    -- live eBay listings seen for comps (from the old sheets)
  price_source_url text,      -- e.g. SportsCardsPro link

  notes text,
  import_batch_id uuid references import_batches(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index cards_user_status_idx on cards (user_id, status);
create index cards_player_idx on cards using gin (to_tsvector('simple', player_names));
create index cards_set_number_idx on cards (user_id, set_name, card_number);

create table listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  card_id uuid not null references cards(id) on delete cascade,
  channel sale_channel not null default 'ebay',
  external_id text,           -- eBay offer/listing id
  status text not null default 'draft' check (status in ('draft', 'active', 'ended', 'sold')),
  title text,
  price_cents integer,
  format text check (format in ('auction', 'fixed_price')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index listings_card_idx on listings (card_id);

create table sales (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  card_id uuid not null references cards(id) on delete cascade,
  channel sale_channel not null,
  sold_at date not null default current_date,
  price_cents integer not null,
  fees_cents integer not null default 0,
  shipping_cents integer not null default 0,   -- what shipping cost you
  notes text,
  created_at timestamptz not null default now()
);
create index sales_card_idx on sales (card_id);

-- profit per sold card
create view card_profit with (security_invoker = true) as
select
  c.id as card_id,
  c.user_id,
  s.sold_at,
  s.channel,
  s.price_cents,
  s.fees_cents,
  s.shipping_cents,
  coalesce(c.cost_cents, 0) as cost_cents,
  s.price_cents - s.fees_cents - s.shipping_cents - coalesce(c.cost_cents, 0) as profit_cents
from cards c
join sales s on s.card_id = c.id;

-- updated_at trigger
create function set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger cards_updated_at before update on cards
  for each row execute function set_updated_at();
create trigger listings_updated_at before update on listings
  for each row execute function set_updated_at();

-- Row level security: each user sees only their own rows
alter table import_batches enable row level security;
alter table cards enable row level security;
alter table listings enable row level security;
alter table sales enable row level security;

create policy "own rows" on import_batches for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own rows" on cards for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own rows" on listings for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own rows" on sales for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
