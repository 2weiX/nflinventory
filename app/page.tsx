"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { download, money, toCsv, variantLabel } from "@/lib/format";
import { STATUS_LABEL, STATUS_STYLE, type Card, type Status } from "@/lib/types";

type SortKey = "estimate" | "player" | "number" | "newest";

async function loadAllCards(): Promise<Card[]> {
  const out: Card[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from("cards").select("*").range(from, from + 999).order("created_at");
    if (error) throw error;
    out.push(...(data as Card[]));
    if (!data || data.length < 1000) return out;
  }
}

const groupKey = (c: Card) =>
  [c.set_name, c.year, c.card_number, c.player_names, c.parallel, c.serial_to, c.serial_number, c.is_auto, c.is_patch, c.status, c.grader, c.grade].join("|");

export default function InventoryPage() {
  const [cards, setCards] = useState<Card[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<Status | "all" | "active">("active");
  const [setName, setSetName] = useState("all");
  const [onlyEbay, setOnlyEbay] = useState(false);
  const [onlyGrade, setOnlyGrade] = useState(false);
  const [group, setGroup] = useState(true);
  const [sort, setSort] = useState<SortKey>("estimate");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const reload = () => loadAllCards().then(setCards).catch((e) => setError(e.message));
  useEffect(() => { reload(); }, []);

  const sets = useMemo(
    () => [...new Set((cards ?? []).map((c) => [c.year, c.brand, c.set_name].filter(Boolean).join(" ")))].sort(),
    [cards],
  );

  const filtered = useMemo(() => {
    if (!cards) return [];
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    return cards.filter((c) => {
      if (status === "active" && !(c.status === "in_stock" || c.status === "listed")) return false;
      if (status !== "all" && status !== "active" && c.status !== status) return false;
      if (setName !== "all" && [c.year, c.brand, c.set_name].filter(Boolean).join(" ") !== setName) return false;
      if (onlyEbay && !c.ebay_epid) return false;
      if (onlyGrade && !(c.grading_candidate === "yes" || c.grading_candidate === "maybe")) return false;
      if (words.length) {
        const hay = [c.player_names, c.card_number, c.parallel, c.team, c.set_name, c.subset, c.serial_to ? `/${c.serial_to}` : ""]
          .join(" ").toLowerCase();
        if (!words.every((w) => hay.includes(w))) return false;
      }
      return true;
    });
  }, [cards, q, status, setName, onlyEbay, onlyGrade]);

  const rows = useMemo(() => {
    const groups = new Map<string, Card[]>();
    for (const c of filtered) {
      const k = group ? groupKey(c) : c.id;
      groups.set(k, [...(groups.get(k) ?? []), c]);
    }
    const list = [...groups.values()];
    const cmp: Record<SortKey, (a: Card[], b: Card[]) => number> = {
      estimate: (a, b) => (b[0].estimate_cents ?? -1) - (a[0].estimate_cents ?? -1),
      player: (a, b) => a[0].player_names.localeCompare(b[0].player_names),
      number: (a, b) => a[0].card_number.localeCompare(b[0].card_number, undefined, { numeric: true }),
      newest: (a, b) => b[0].created_at.localeCompare(a[0].created_at),
    };
    return list.sort(cmp[sort]);
  }, [filtered, group, sort]);

  const totals = useMemo(() => {
    const est = filtered.reduce((s, c) => s + (c.estimate_cents ?? 0), 0);
    return { count: filtered.length, est };
  }, [filtered]);

  async function bulkStatus(s: Status) {
    const ids = [...selected];
    const { error } = await supabase.from("cards").update({ status: s }).in("id", ids);
    if (error) return alert(error.message);
    setSelected(new Set());
    reload();
  }

  function exportCsv() {
    const data = filtered.map(({ id, import_batch_id, ...c }) => ({ ...c, id }));
    download(`nfl-inventory-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(data));
  }

  const toggle = (ids: string[]) => {
    const next = new Set(selected);
    const all = ids.every((i) => next.has(i));
    ids.forEach((i) => (all ? next.delete(i) : next.add(i)));
    setSelected(next);
  };

  if (error) return <p className="text-red-600">{error}</p>;
  if (!cards) return <p className="text-sm text-zinc-500">Loading cards…</p>;

  if (!cards.length)
    return (
      <div className="card mx-auto max-w-lg p-8 text-center">
        <h1 className="text-lg font-semibold">No cards yet</h1>
        <p className="mt-2 text-sm text-zinc-500">Import your existing sheets, or add a card by hand.</p>
        <div className="mt-4 flex justify-center gap-2">
          <Link href="/import" className="btn-primary">Import a sheet</Link>
          <Link href="/cards/new" className="btn">Add a card</Link>
        </div>
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-60 flex-1">
          <label className="label">Search</label>
          <input className="input" placeholder="Player, card #, parallel, team, /99…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            <option value="active">In stock + listed</option>
            <option value="all">All</option>
            {(Object.keys(STATUS_LABEL) as Status[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Set</label>
          <select className="input" value={setName} onChange={(e) => setSetName(e.target.value)}>
            <option value="all">All sets</option>
            {sets.map((s) => <option key={s} value={s}>{s || "(no set)"}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Sort</label>
          <select className="input" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
            <option value="estimate">Value (high → low)</option>
            <option value="player">Player</option>
            <option value="number">Card #</option>
            <option value="newest">Newest</option>
          </select>
        </div>
        <div className="flex flex-col gap-1 text-sm">
          <label className="flex items-center gap-1.5"><input type="checkbox" checked={onlyEbay} onChange={(e) => setOnlyEbay(e.target.checked)} /> Has eBay ID</label>
          <label className="flex items-center gap-1.5"><input type="checkbox" checked={onlyGrade} onChange={(e) => setOnlyGrade(e.target.checked)} /> Grading candidates</label>
        </div>
        <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={group} onChange={(e) => setGroup(e.target.checked)} /> Group duplicates</label>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="text-zinc-500">
          <b className="text-zinc-900">{totals.count}</b> cards · est. value <b className="text-zinc-900">{money(totals.est)}</b>
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          {selected.size > 0 && (
            <>
              <span className="self-center text-zinc-500">{selected.size} selected →</span>
              {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
                <button key={s} className="btn" onClick={() => bulkStatus(s)}>{STATUS_LABEL[s]}</button>
              ))}
            </>
          )}
          <button className="btn" onClick={exportCsv}>Export CSV</button>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs text-zinc-500">
            <tr>
              <th className="w-8 p-2"></th>
              <th className="p-2">Card</th>
              <th className="p-2">Player</th>
              <th className="p-2">Variant</th>
              <th className="p-2 text-right">Qty</th>
              <th className="p-2">Status</th>
              <th className="p-2 text-right">Value</th>
              <th className="p-2 text-right">Ask</th>
              <th className="p-2">eBay</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((g) => {
              const c = g[0];
              const ids = g.map((x) => x.id);
              return (
                <tr key={c.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                  <td className="p-2"><input type="checkbox" checked={ids.every((i) => selected.has(i))} onChange={() => toggle(ids)} /></td>
                  <td className="whitespace-nowrap p-2">
                    <Link href={`/cards/${c.id}`} className="font-medium hover:underline">#{c.card_number}</Link>
                    <div className="text-xs text-zinc-500">{[c.year, c.set_name].filter(Boolean).join(" ")}</div>
                  </td>
                  <td className="p-2">
                    <Link href={`/cards/${c.id}`} className="hover:underline">{c.player_names}</Link>
                    <div className="text-xs text-zinc-500">{c.team}</div>
                  </td>
                  <td className="p-2">
                    {variantLabel(c)}
                    {(c.grading_candidate === "yes" || c.grading_candidate === "maybe") && (
                      <span className="ml-1.5 rounded bg-violet-100 px-1.5 py-0.5 text-xs text-violet-800">grade {c.grading_candidate}</span>
                    )}
                  </td>
                  <td className="p-2 text-right tabular-nums">{g.length > 1 ? `×${g.length}` : ""}</td>
                  <td className="p-2"><span className={`rounded px-1.5 py-0.5 text-xs ${STATUS_STYLE[c.status]}`}>{STATUS_LABEL[c.status]}</span></td>
                  <td className="p-2 text-right tabular-nums">{money(c.estimate_cents)}</td>
                  <td className="p-2 text-right tabular-nums">{money(c.list_price_cents)}</td>
                  <td className="p-2">{c.ebay_epid ? <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-xs text-emerald-700" title={c.ebay_catalog_title ?? ""}>catalog ✓</span> : <span className="text-xs text-zinc-400">—</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!rows.length && <p className="p-6 text-center text-sm text-zinc-500">No cards match these filters.</p>}
      </div>
    </div>
  );
}
