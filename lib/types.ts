import type { CardDraft } from "./importer";

export type Status = "in_stock" | "listed" | "sold" | "personal";
export type Channel = "ebay" | "whatnot" | "show" | "other";

export type Card = CardDraft & {
  id: string;
  created_at: string;
  updated_at: string;
  import_batch_id: string | null;
};

export type Sale = {
  id: string;
  card_id: string;
  channel: Channel;
  sold_at: string;
  price_cents: number;
  fees_cents: number;
  shipping_cents: number;
  notes: string | null;
};

export const STATUS_LABEL: Record<Status, string> = {
  in_stock: "In stock",
  listed: "Listed",
  sold: "Sold",
  personal: "Personal",
};

export const STATUS_STYLE: Record<Status, string> = {
  in_stock: "bg-emerald-100 text-emerald-800",
  listed: "bg-sky-100 text-sky-800",
  sold: "bg-zinc-200 text-zinc-700",
  personal: "bg-amber-100 text-amber-800",
};
