// Turns rows from any inventory sheet into card records.
// Pure functions only, so they can be tested without a browser or database.

export type FieldKey =
  | "ignore"
  | "card_number"
  | "player_names"
  | "team"
  | "jersey_number"
  | "year"
  | "brand"
  | "set_name"
  | "subset"
  | "parallel"
  | "serial"
  | "serial_number"
  | "signature"
  | "is_patch"
  | "is_rookie"
  | "grading_candidate"
  | "grader"
  | "grade"
  | "list_price"
  | "estimate"
  | "cost"
  | "price_source_url"
  | "ebay_reference_ids"
  | "ebay_epid"
  | "ebay_catalog_title"
  | "status"
  | "sold_price"
  | "sold_date"
  | "notes";

export const FIELDS: { key: FieldKey; label: string; synonyms: string[] }[] = [
  { key: "ignore", label: "— ignore —", synonyms: ["ebay match"] },
  { key: "card_number", label: "Card number", synonyms: ["card number", "card #", "card no", "number", "#", "card"] },
  { key: "player_names", label: "Player(s)", synonyms: ["player name(s)", "player names", "player", "players", "name"] },
  { key: "team", label: "Team", synonyms: ["team"] },
  { key: "jersey_number", label: "Jersey #", synonyms: ["jersey #", "jersey", "jersey number"] },
  { key: "year", label: "Year", synonyms: ["year", "season"] },
  { key: "brand", label: "Brand", synonyms: ["brand", "manufacturer"] },
  { key: "set_name", label: "Set", synonyms: ["set", "set name", "product"] },
  { key: "subset", label: "Insert / subset", synonyms: ["insert", "subset"] },
  { key: "parallel", label: "Parallel", synonyms: ["parallel", "variant", "variation", "color"] },
  { key: "serial", label: "Numbered (/N)", synonyms: ["numbered", "serial", "print run", "/"] },
  { key: "serial_number", label: "Copy # (e.g. 24 of /99)", synonyms: ["copy #", "serial number"] },
  { key: "signature", label: "Autograph (sticker / on card)", synonyms: ["signature", "auto", "autograph"] },
  { key: "is_patch", label: "Patch / relic", synonyms: ["patch", "relic", "memorabilia"] },
  { key: "is_rookie", label: "Rookie (RC)", synonyms: ["rookie", "rc"] },
  { key: "grading_candidate", label: "Grade it? (yes / maybe / no)", synonyms: ["grading?", "grading", "grade it"] },
  { key: "grader", label: "Grader (PSA, BGS…)", synonyms: ["grader", "grading company"] },
  { key: "grade", label: "Grade", synonyms: ["grade"] },
  { key: "list_price", label: "List / ask price", synonyms: ["price", "list price", "ask"] },
  { key: "estimate", label: "Value estimate", synonyms: ["price estimate", "estimate", "value", "market value"] },
  { key: "cost", label: "Cost", synonyms: ["cost", "paid", "purchase price"] },
  { key: "price_source_url", label: "Price source link", synonyms: ["scp link", "link", "url", "sportscardspro"] },
  { key: "ebay_reference_ids", label: "eBay listings seen (comps)", synonyms: ["ebay auction id", "ebay ids", "ebay item id"] },
  { key: "ebay_epid", label: "eBay catalog ID (ePID)", synonyms: ["ebay epid", "epid"] },
  { key: "ebay_catalog_title", label: "eBay catalog title", synonyms: ["ebay catalog title"] },
  { key: "status", label: "Status", synonyms: ["status"] },
  { key: "sold_price", label: "Sold price", synonyms: ["sold price", "sold for", "sale price"] },
  { key: "sold_date", label: "Sold date", synonyms: ["sold date", "date sold", "sold on"] },
  { key: "notes", label: "Notes", synonyms: ["notes", "comment", "comments"] },
];

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

/** Guess which field each column header holds. Exact synonym match first, then "contains". */
export function guessMapping(headers: string[]): Record<string, FieldKey> {
  const used = new Set<FieldKey>();
  const out: Record<string, FieldKey> = {};
  // pass 1: exact matches
  for (const h of headers) {
    const n = norm(h);
    const f = FIELDS.find((f) => f.key !== "ignore" && !used.has(f.key) && f.synonyms.includes(n));
    if (f) {
      out[h] = f.key;
      used.add(f.key);
    } else if (FIELDS[0].synonyms.includes(n)) {
      out[h] = "ignore";
    }
  }
  // pass 2: partial matches for the rest
  for (const h of headers) {
    if (out[h]) continue;
    const n = norm(h);
    const f = FIELDS.find(
      (f) => f.key !== "ignore" && !used.has(f.key) && f.synonyms.some((s) => s.length > 2 && n.includes(s)),
    );
    out[h] = f ? f.key : "ignore";
    if (f) used.add(f.key);
  }
  return out;
}

// ---------- value parsers ----------

const EMPTY = new Set(["", "-", "n/a", "na", "none", "none live", "not checked", "null"]);
const isEmpty = (v: unknown) => v === null || v === undefined || EMPTY.has(norm(String(v)));

export function parseCents(v: unknown): number | null {
  if (isEmpty(v)) return null;
  if (typeof v === "number") return Math.round(v * 100);
  const s = String(v).replace(/[^0-9.,-]/g, "");
  if (!s) return null;
  // "1.234,50" (EU) vs "1,234.50" (US)
  const eu = /,\d{1,2}$/.test(s) && s.indexOf(",") > s.lastIndexOf(".");
  const n = Number(eu ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, ""));
  return Number.isFinite(n) ? Math.round(n * 100) : null;
}

export function parseIntLoose(v: unknown): number | null {
  if (isEmpty(v)) return null;
  const m = String(v).match(/\d+/);
  return m ? Number(m[0]) : null;
}

/** "99", "/99", "24/99", "24 of 99" → { to: 99, number: 24 | null } */
export function parseSerial(v: unknown): { to: number | null; number: number | null } {
  if (isEmpty(v)) return { to: null, number: null };
  const s = String(v).trim();
  const both = s.match(/(\d+)\s*(?:\/|of)\s*(\d+)/i);
  if (both) return { number: Number(both[1]), to: Number(both[2]) };
  return { to: parseIntLoose(s), number: null };
}

export function parseBool(v: unknown): boolean {
  if (isEmpty(v)) return false;
  return ["yes", "y", "true", "x", "1", "rc", "✓", "✔"].includes(norm(String(v)));
}

export function parseSignature(v: unknown): { is_auto: boolean; auto_type: "on_card" | "sticker" | null } {
  if (isEmpty(v)) return { is_auto: false, auto_type: null };
  const s = norm(String(v)).replace(/[-_\s]/g, "");
  if (s.includes("sticker")) return { is_auto: true, auto_type: "sticker" };
  if (s.includes("oncard")) return { is_auto: true, auto_type: "on_card" };
  if (["no", "false", "0"].includes(s)) return { is_auto: false, auto_type: null };
  return { is_auto: true, auto_type: null };
}

export function parseParallel(v: unknown): string | null {
  if (isEmpty(v)) return null;
  const s = String(v).trim();
  if (norm(s) === "base") return null;
  // title-case all-lowercase entries ("green" → "Green"), keep anything already cased
  return s === s.toLowerCase() ? s.replace(/\b\w/g, (c) => c.toUpperCase()) : s;
}

export function parseGradingCandidate(v: unknown): "yes" | "maybe" | "no" | null {
  if (isEmpty(v)) return null;
  const s = norm(String(v));
  return s === "yes" || s === "maybe" || s === "no" ? s : null;
}

export function parseStatus(v: unknown): "in_stock" | "listed" | "sold" | "personal" | null {
  if (isEmpty(v)) return null;
  const s = norm(String(v)).replace(/[\s-]/g, "_");
  if (["in_stock", "stock", "available", "inventory"].includes(s)) return "in_stock";
  if (["listed", "live", "active"].includes(s)) return "listed";
  if (["sold"].includes(s)) return "sold";
  if (["personal", "pc", "keep", "kept"].includes(s)) return "personal";
  return null;
}

export function parseDate(v: unknown): string | null {
  if (isEmpty(v)) return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

const text = (v: unknown) => (isEmpty(v) ? null : String(v).trim());

// ---------- row transform ----------

export type BatchDefaults = {
  year: number | null;
  brand: string | null;
  set_name: string | null;
  status: "in_stock" | "listed" | "sold" | "personal";
};

export type CardDraft = {
  year: number | null;
  brand: string | null;
  set_name: string | null;
  subset: string | null;
  card_number: string;
  player_names: string;
  team: string | null;
  jersey_number: string | null;
  parallel: string | null;
  serial_to: number | null;
  serial_number: number | null;
  is_rookie: boolean;
  is_auto: boolean;
  auto_type: "on_card" | "sticker" | null;
  is_patch: boolean;
  grader: string | null;
  grade: string | null;
  grading_candidate: "yes" | "maybe" | "no" | null;
  cost_cents: number | null;
  estimate_cents: number | null;
  list_price_cents: number | null;
  status: "in_stock" | "listed" | "sold" | "personal";
  ebay_epid: string | null;
  ebay_catalog_title: string | null;
  ebay_reference_ids: string | null;
  price_source_url: string | null;
  notes: string | null;
};

export type SaleDraft = { price_cents: number; sold_at: string | null };

export type RowResult =
  | { ok: true; card: CardDraft; sale: SaleDraft | null; warnings: string[] }
  | { ok: false; reason: string };

export function transformRow(
  row: Record<string, unknown>,
  mapping: Record<string, FieldKey>,
  defaults: BatchDefaults,
): RowResult {
  const get = (key: FieldKey): unknown => {
    const header = Object.keys(mapping).find((h) => mapping[h] === key);
    return header === undefined ? undefined : row[header];
  };
  const warnings: string[] = [];

  const card_number = text(get("card_number"));
  const player_names = text(get("player_names"));
  if (!card_number && !player_names) return { ok: false, reason: "empty row" };
  if (!card_number) return { ok: false, reason: "no card number" };
  if (!player_names) warnings.push("no player name");

  const serial = parseSerial(get("serial"));
  const copy = parseIntLoose(get("serial_number"));
  const sig = parseSignature(get("signature"));
  const epid = text(get("ebay_epid"))?.replace(/^'/, "") ?? null;
  const catalogTitle = text(get("ebay_catalog_title"));

  const card: CardDraft = {
    year: parseIntLoose(get("year")) ?? defaults.year,
    brand: text(get("brand")) ?? defaults.brand,
    set_name: text(get("set_name")) ?? defaults.set_name,
    subset: text(get("subset")),
    card_number,
    player_names: player_names ?? "Unknown",
    team: text(get("team")),
    jersey_number: text(get("jersey_number")),
    parallel: parseParallel(get("parallel")),
    serial_to: serial.to,
    serial_number: copy ?? serial.number,
    is_rookie: parseBool(get("is_rookie")),
    is_auto: sig.is_auto,
    auto_type: sig.auto_type,
    is_patch: parseBool(get("is_patch")),
    grader: text(get("grader")),
    grade: text(get("grade")),
    grading_candidate: parseGradingCandidate(get("grading_candidate")),
    cost_cents: parseCents(get("cost")),
    estimate_cents: parseCents(get("estimate")),
    list_price_cents: parseCents(get("list_price")),
    status: parseStatus(get("status")) ?? defaults.status,
    // only keep an ePID that is really a number; notes like "No Aqua Holo Foil…" go to notes
    ebay_epid: epid && /^\d+$/.test(epid) ? epid : null,
    ebay_catalog_title: epid && /^\d+$/.test(epid) ? catalogTitle : null,
    ebay_reference_ids: text(get("ebay_reference_ids")),
    price_source_url: text(get("price_source_url")),
    notes: text(get("notes")),
  };
  if (!card.ebay_epid && catalogTitle) {
    card.notes = [card.notes, `eBay catalog: ${catalogTitle}`].filter(Boolean).join("\n");
  }

  const soldPrice = parseCents(get("sold_price"));
  const sale = soldPrice !== null ? { price_cents: soldPrice, sold_at: parseDate(get("sold_date")) } : null;
  if (sale) card.status = "sold";

  return { ok: true, card, sale, warnings };
}
