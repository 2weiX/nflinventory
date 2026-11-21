export const money = (cents: number | null | undefined) =>
  cents === null || cents === undefined
    ? "—"
    : (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });

export const toCents = (v: string): number | null => {
  const s = v.replace(/[^0-9.-]/g, "");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n * 100) : null;
};

export const centsToInput = (c: number | null | undefined) => (c === null || c === undefined ? "" : (c / 100).toFixed(2));

/** Short description of a card's variant, e.g. "Gold Foil /50 · Auto (sticker) · Patch". */
export function variantLabel(c: {
  parallel: string | null;
  serial_to: number | null;
  serial_number: number | null;
  is_auto: boolean;
  auto_type: string | null;
  is_patch: boolean;
  is_rookie: boolean;
}) {
  const parts: string[] = [];
  const serial = c.serial_to ? (c.serial_number ? `${c.serial_number}/${c.serial_to}` : `/${c.serial_to}`) : "";
  const p = [c.parallel ?? (c.serial_to ? "" : "Base"), serial].filter(Boolean).join(" ");
  if (p) parts.push(p);
  if (c.is_rookie) parts.push("RC");
  if (c.is_auto) parts.push(c.auto_type === "on_card" ? "Auto (on-card)" : c.auto_type === "sticker" ? "Auto (sticker)" : "Auto");
  if (c.is_patch) parts.push("Patch");
  return parts.join(" · ");
}

/** eBay-style title, max 80 characters. */
export function ebayTitle(c: {
  year: number | null;
  brand: string | null;
  set_name: string | null;
  subset: string | null;
  player_names: string;
  card_number: string;
  parallel: string | null;
  serial_to: number | null;
  is_rookie: boolean;
  is_auto: boolean;
  is_patch: boolean;
  team: string | null;
}) {
  const bits = [
    c.year, c.brand, c.set_name, c.subset, c.player_names, `#${c.card_number}`,
    c.parallel, c.serial_to ? `/${c.serial_to}` : null,
    c.is_rookie ? "RC" : null, c.is_auto ? "Auto" : null, c.is_patch ? "Patch" : null, c.team,
  ].filter(Boolean);
  let t = bits.join(" ");
  while (t.length > 80 && bits.length > 1) {
    bits.pop();
    t = bits.join(" ");
  }
  return t.slice(0, 80);
}

export function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");
}

export function download(filename: string, content: string, type = "text/csv") {
  const blob = new Blob([content], { type });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
