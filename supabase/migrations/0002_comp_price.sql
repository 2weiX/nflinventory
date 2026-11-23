-- "Price" = the last researched eBay comp (what the card actually sells for).
-- Separate from estimate_cents (Est. price, when there's no comp) and
-- list_price_cents (what it's listed at on eBay).
alter table public.cards
  add column comp_cents integer check (comp_cents is null or comp_cents >= 0);

comment on column public.cards.comp_cents is 'Price: last researched eBay comp, integer cents';
comment on column public.cards.estimate_cents is 'Est. price: estimate when no comp exists, integer cents';
comment on column public.cards.list_price_cents is 'eBay list price (ask), integer cents';
