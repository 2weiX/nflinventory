"use client";

import Link from "next/link";
import Papa from "papaparse";
import readXlsxFile from "read-excel-file/browser";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { money, variantLabel } from "@/lib/format";
import { FIELDS, guessMapping, transformRow, type BatchDefaults, type FieldKey, type RowResult } from "@/lib/importer";
import { STATUS_LABEL, type Status } from "@/lib/types";

type Grid = unknown[][];
type Source = { name: string; sheets: { name: string; grid: Grid }[] };
type Batch = { id: string; file_name: string; set_label: string | null; row_count: number; created_at: string };

const cellText = (v: unknown) => (v instanceof Date ? v.toISOString().slice(0, 10) : v === null || v === undefined ? "" : String(v));

/** First row with at least 3 filled cells is treated as the header row. */
const guessHeaderRow = (grid: Grid) => Math.max(0, grid.findIndex((r) => r.filter((c) => cellText(c).trim()).length >= 3));

/** Guess brand / set from a file name like "inceptioninventory.xlsx" or "2026 Topps Chrome.csv". */
function guessDefaults(name: string): Partial<BatchDefaults> {
  const n = name.toLowerCase();
  const year = n.match(/20\d\d/)?.[0];
  const sets = ["inception", "chrome", "midnight", "finest", "flagship", "prizm", "select", "mosaic", "optic", "donruss", "bowman", "cosmic"];
  const set = sets.find((s) => n.includes(s));
  const brand = /panini|prizm|select|mosaic|optic|donruss/.test(n) ? "Panini" : "Topps";
  return {
    year: year ? Number(year) : 2026,
    brand,
    set_name: set ? set[0].toUpperCase() + set.slice(1) : n.includes("topps") ? "Flagship" : "",
  };
}

export default function ImportPage() {
  const [source, setSource] = useState<Source | null>(null);
  const [sheetIdx, setSheetIdx] = useState(0);
  const [headerRow, setHeaderRow] = useState(0);
  const [mapping, setMapping] = useState<Record<string, FieldKey>>({});
  const [defaults, setDefaults] = useState<BatchDefaults>({ year: 2026, brand: "Topps", set_name: "", status: "in_stock" });
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<{ batchId: string; cards: number; sales: number } | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);

  const loadBatches = () =>
    supabase.from("import_batches").select("*").order("created_at", { ascending: false })
      .then(({ data }) => setBatches((data as Batch[]) ?? []));
  useEffect(() => { loadBatches(); }, []);

  const grid = source?.sheets[sheetIdx]?.grid ?? [];
  const headers = useMemo(() => {
    const raw = (grid[headerRow] ?? []).map((h, i) => cellText(h).trim() || `Column ${i + 1}`);
    // make duplicate header names unique
    return raw.map((h, i) => (raw.indexOf(h) === i ? h : `${h} (${i + 1})`));
  }, [grid, headerRow]);

  const records = useMemo(
    () => grid.slice(headerRow + 1).map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? null]))),
    [grid, headerRow, headers],
  );

  useEffect(() => { setMapping(guessMapping(headers)); }, [headers]);

  const results: RowResult[] = useMemo(() => records.map((r) => transformRow(r, mapping, defaults)), [records, mapping, defaults]);
  const good = results.filter((r): r is Extract<RowResult, { ok: true }> => r.ok);
  const skipped = results.filter((r) => !r.ok && r.reason !== "empty row");
  const hasCardNumber = Object.values(mapping).includes("card_number");
  const alreadyImported = source && batches.find((b) => b.file_name === source.name && (b.set_label ?? "") === (source.sheets[sheetIdx]?.name ?? ""));

  function loadSource(s: Source) {
    setSource(s);
    setSheetIdx(0);
    setHeaderRow(guessHeaderRow(s.sheets[0].grid));
    setDefaults((d) => ({ ...d, ...guessDefaults(s.name) }));
    setDone(null);
    setErr(null);
  }

  async function onFile(file: File) {
    setErr(null);
    try {
      if (/\.xlsx$/i.test(file.name)) {
        const sheets = await readXlsxFile(file);
        loadSource({ name: file.name, sheets: sheets.map((s) => ({ name: s.sheet, grid: s.data as Grid })) });
      } else {
        const text = await file.text();
        loadSource({ name: file.name, sheets: [{ name: "", grid: Papa.parse<string[]>(text, { skipEmptyLines: false }).data }] });
      }
    } catch (e) {
      setErr(`Couldn't read that file: ${(e as Error).message}`);
    }
  }

  async function onLink() {
    setBusy(true);
    setErr(null);
    const res = await fetch(`/api/sheet?url=${encodeURIComponent(link)}`);
    const text = await res.text();
    setBusy(false);
    if (!res.ok) return setErr(text);
    const id = link.match(/\/d\/([\w-]+)/)?.[1] ?? "sheet";
    loadSource({ name: `google-sheet-${id}`, sheets: [{ name: link.match(/gid=(\d+)/)?.[1] ?? "0", grid: Papa.parse<string[]>(text).data }] });
  }

  async function runImport() {
    if (!source) return;
    setBusy(true);
    setErr(null);
    const sheetName = source.sheets[sheetIdx]?.name ?? "";
    const { data: batch, error: bErr } = await supabase
      .from("import_batches")
      .insert({ file_name: source.name, set_label: sheetName, column_mapping: { mapping, defaults, headerRow }, row_count: good.length })
      .select("id")
      .single();
    if (bErr) { setBusy(false); return setErr(bErr.message); }

    const plain = good.filter((r) => !r.sale).map((r) => ({ ...r.card, import_batch_id: batch.id }));
    for (let i = 0; i < plain.length; i += 500) {
      const { error } = await supabase.from("cards").insert(plain.slice(i, i + 500));
      if (error) { setBusy(false); return setErr(`Stopped after ${i} cards: ${error.message}. Use "Undo" below to remove the partial import.`); }
    }
    let sales = 0;
    for (const r of good.filter((r) => r.sale)) {
      const { data: c, error } = await supabase.from("cards").insert({ ...r.card, import_batch_id: batch.id }).select("id").single();
      if (error) { setBusy(false); return setErr(error.message); }
      const s = await supabase.from("sales").insert({ card_id: c.id, channel: "other", price_cents: r.sale!.price_cents, ...(r.sale!.sold_at ? { sold_at: r.sale!.sold_at } : {}) });
      if (!s.error) sales++;
    }
    setBusy(false);
    setDone({ batchId: batch.id, cards: good.length, sales });
    loadBatches();
  }

  async function undo(batchId: string) {
    if (!confirm("Delete every card from this import? Cards you edited since will be deleted too. This can't be undone.")) return;
    await supabase.from("cards").delete().eq("import_batch_id", batchId);
    await supabase.from("import_batches").delete().eq("id", batchId);
    if (done?.batchId === batchId) setDone(null);
    loadBatches();
  }

  return (
    <div className="space-y-5">
      <h1 className="text-lg font-semibold">Import a sheet</h1>

      <div className="card grid gap-4 p-4 sm:grid-cols-2">
        <div>
          <div className="label">Upload a file (.xlsx or .csv)</div>
          <input type="file" accept=".xlsx,.csv,text/csv" className="text-sm" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
          <p className="mt-1 text-xs text-zinc-500">Google Sheets: File → Download → Microsoft Excel (.xlsx) keeps every tab.</p>
        </div>
        <div>
          <div className="label">…or paste a Google Sheets link</div>
          <div className="flex gap-2">
            <input className="input" placeholder="https://docs.google.com/spreadsheets/d/…" value={link} onChange={(e) => setLink(e.target.value)} />
            <button className="btn" disabled={!link || busy} onClick={onLink}>Load</button>
          </div>
          <p className="mt-1 text-xs text-zinc-500">The sheet must be shared as “Anyone with the link can view”.</p>
        </div>
      </div>

      {err && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{err}</p>}

      {done && (
        <div className="rounded-md bg-emerald-50 p-4 text-sm text-emerald-800">
          Imported <b>{done.cards}</b> cards{done.sales ? ` and ${done.sales} sales` : ""}.{" "}
          <Link href="/" className="font-medium underline">Open inventory</Link> ·{" "}
          <button className="underline" onClick={() => undo(done.batchId)}>Undo this import</button>
        </div>
      )}

      {source && !done && (
        <>
          <section className="card grid gap-3 p-4 sm:grid-cols-6">
            <h2 className="text-sm font-semibold sm:col-span-6">1 · What is this sheet?</h2>
            {source.sheets.length > 1 && (
              <div className="sm:col-span-2">
                <label className="label">Tab</label>
                <select className="input" value={sheetIdx} onChange={(e) => { const i = Number(e.target.value); setSheetIdx(i); setHeaderRow(guessHeaderRow(source.sheets[i].grid)); }}>
                  {source.sheets.map((s, i) => <option key={i} value={i}>{s.name} ({s.grid.length} rows)</option>)}
                </select>
              </div>
            )}
            <div><label className="label">Year</label><input className="input" value={defaults.year ?? ""} onChange={(e) => setDefaults({ ...defaults, year: e.target.value ? Number(e.target.value) : null })} /></div>
            <div><label className="label">Brand</label><input className="input" value={defaults.brand ?? ""} onChange={(e) => setDefaults({ ...defaults, brand: e.target.value || null })} /></div>
            <div><label className="label">Set</label><input className="input" placeholder="Flagship, Inception…" value={defaults.set_name ?? ""} onChange={(e) => setDefaults({ ...defaults, set_name: e.target.value || null })} /></div>
            <div>
              <label className="label">Cards are</label>
              <select className="input" value={defaults.status} onChange={(e) => setDefaults({ ...defaults, status: e.target.value as Status })}>
                {(Object.keys(STATUS_LABEL) as Status[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </select>
            </div>
            <div><label className="label">Header row</label><input className="input" type="number" min={1} value={headerRow + 1} onChange={(e) => setHeaderRow(Math.max(0, Number(e.target.value) - 1))} /></div>
          </section>

          <section className="card p-4">
            <h2 className="mb-3 text-sm font-semibold">2 · Check the columns <span className="font-normal text-zinc-500">(guessed automatically, change any that are wrong)</span></h2>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {headers.map((h) => {
                const sample = records.map((r) => cellText(r[h])).find((v) => v.trim()) ?? "";
                return (
                  <div key={h} className={`rounded-md border p-2 ${mapping[h] === "ignore" ? "border-zinc-200 opacity-60" : "border-zinc-300"}`}>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-medium">{h}</span>
                      <span className="truncate text-xs text-zinc-400">{sample.slice(0, 30)}</span>
                    </div>
                    <select className="input mt-1" value={mapping[h] ?? "ignore"} onChange={(e) => setMapping({ ...mapping, [h]: e.target.value as FieldKey })}>
                      {FIELDS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
                    </select>
                  </div>
                );
              })}
            </div>
            {!hasCardNumber && <p className="mt-3 text-sm text-red-600">Pick which column holds the card number.</p>}
          </section>

          <section className="card p-4">
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <h2 className="text-sm font-semibold">3 · Preview</h2>
              <span className="text-sm text-zinc-500">
                <b className="text-zinc-900">{good.length}</b> cards ready{skipped.length ? ` · ${skipped.length} rows skipped (no card number)` : ""}
              </span>
              <button className="btn-primary ml-auto" disabled={!hasCardNumber || !good.length || busy} onClick={runImport}>
                {busy ? "Importing…" : `Import ${good.length} cards`}
              </button>
            </div>
            {alreadyImported && (
              <p className="mb-3 rounded-md bg-amber-50 p-2 text-sm text-amber-800">
                This sheet was already imported on {alreadyImported.created_at.slice(0, 10)} ({alreadyImported.row_count} cards). Importing again will add duplicates.
              </p>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-zinc-500">
                  <tr><th className="p-1.5">Set</th><th className="p-1.5">#</th><th className="p-1.5">Player</th><th className="p-1.5">Variant</th><th className="p-1.5">Status</th><th className="p-1.5 text-right">Value</th><th className="p-1.5 text-right">Ask</th><th className="p-1.5">eBay</th><th className="p-1.5">Note</th></tr>
                </thead>
                <tbody>
                  {good.slice(0, 25).map((r, i) => (
                    <tr key={i} className="border-t border-zinc-100">
                      <td className="p-1.5 whitespace-nowrap">{[r.card.year, r.card.set_name].filter(Boolean).join(" ")}</td>
                      <td className="p-1.5">{r.card.card_number}</td>
                      <td className="p-1.5">{r.card.player_names}</td>
                      <td className="p-1.5">{variantLabel(r.card)}</td>
                      <td className="p-1.5">{STATUS_LABEL[r.card.status]}</td>
                      <td className="p-1.5 text-right tabular-nums">{money(r.card.estimate_cents)}</td>
                      <td className="p-1.5 text-right tabular-nums">{money(r.card.list_price_cents)}</td>
                      <td className="p-1.5">{r.card.ebay_epid ? "✓" : ""}</td>
                      <td className="p-1.5 text-xs text-amber-700">{r.warnings.join(", ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {good.length > 25 && <p className="mt-2 text-xs text-zinc-500">…and {good.length - 25} more.</p>}
            </div>
          </section>
        </>
      )}

      {batches.length > 0 && (
        <section className="card p-4">
          <h2 className="mb-2 text-sm font-semibold">Past imports</h2>
          <ul className="divide-y divide-zinc-100 text-sm">
            {batches.map((b) => (
              <li key={b.id} className="flex items-center gap-3 py-1.5">
                <span className="flex-1">{b.file_name}{b.set_label ? ` · ${b.set_label}` : ""}</span>
                <span className="text-zinc-500">{b.row_count} cards · {b.created_at.slice(0, 10)}</span>
                <button className="text-xs text-red-600 hover:underline" onClick={() => undo(b.id)}>Undo</button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
