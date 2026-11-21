"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { download, money, toCsv } from "@/lib/format";

type Row = {
  id: string;
  card_id: string;
  channel: string;
  sold_at: string;
  price_cents: number;
  fees_cents: number;
  shipping_cents: number;
  cards: { player_names: string; card_number: string; set_name: string | null; year: number | null; cost_cents: number | null } | null;
};

export default function SalesPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("sales")
      .select("id, card_id, channel, sold_at, price_cents, fees_cents, shipping_cents, cards(player_names, card_number, set_name, year, cost_cents)")
      .order("sold_at", { ascending: false })
      .then(({ data, error }) => (error ? setErr(error.message) : setRows(data as unknown as Row[])));
  }, []);

  const years = useMemo(() => [...new Set((rows ?? []).map((r) => r.sold_at.slice(0, 4)))].sort().reverse(), [rows]);
  const shown = useMemo(() => (rows ?? []).filter((r) => year === "all" || r.sold_at.startsWith(year)), [rows, year]);

  const sum = useMemo(() => {
    const t = { revenue: 0, fees: 0, shipping: 0, cost: 0, profit: 0, byChannel: {} as Record<string, { n: number; profit: number }> };
    for (const r of shown) {
      const cost = r.cards?.cost_cents ?? 0;
      const p = r.price_cents - r.fees_cents - r.shipping_cents - cost;
      t.revenue += r.price_cents; t.fees += r.fees_cents; t.shipping += r.shipping_cents; t.cost += cost; t.profit += p;
      const c = (t.byChannel[r.channel] ??= { n: 0, profit: 0 });
      c.n++; c.profit += p;
    }
    return t;
  }, [shown]);

  if (err) return <p className="text-red-600">{err}</p>;
  if (!rows) return <p className="text-sm text-zinc-500">Loading…</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <h1 className="text-lg font-semibold">Sales & profit</h1>
        <select className="input ml-auto w-auto" value={year} onChange={(e) => setYear(e.target.value)}>
          <option value="all">All time</option>
          {[...new Set([String(new Date().getFullYear()), ...years])].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <button className="btn" onClick={() => download(`sales-${year}.csv`, toCsv(shown.map((r) => ({
          sold_at: r.sold_at, channel: r.channel, player: r.cards?.player_names, card: r.cards?.card_number, set: r.cards?.set_name,
          price: r.price_cents / 100, fees: r.fees_cents / 100, shipping: r.shipping_cents / 100, cost: (r.cards?.cost_cents ?? 0) / 100,
          profit: (r.price_cents - r.fees_cents - r.shipping_cents - (r.cards?.cost_cents ?? 0)) / 100,
        }))))}>Export CSV</button>
      </div>

      <div className="grid gap-3 sm:grid-cols-5">
        {[
          ["Cards sold", String(shown.length)],
          ["Revenue", money(sum.revenue)],
          ["Fees + shipping", money(sum.fees + sum.shipping)],
          ["Card cost", money(sum.cost)],
          ["Profit", money(sum.profit)],
        ].map(([k, v]) => (
          <div key={k} className="card p-3">
            <div className="text-xs text-zinc-500">{k}</div>
            <div className={`text-lg font-semibold tabular-nums ${k === "Profit" ? (sum.profit >= 0 ? "text-emerald-700" : "text-red-600") : ""}`}>{v}</div>
          </div>
        ))}
      </div>

      {Object.keys(sum.byChannel).length > 0 && (
        <div className="flex flex-wrap gap-2 text-sm">
          {Object.entries(sum.byChannel).map(([ch, v]) => (
            <span key={ch} className="rounded-md bg-white px-2 py-1 ring-1 ring-zinc-200">{ch}: {v.n} sold · {money(v.profit)} profit</span>
          ))}
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs text-zinc-500">
            <tr>
              <th className="p-2">Date</th><th className="p-2">Card</th><th className="p-2">Channel</th>
              <th className="p-2 text-right">Sold for</th><th className="p-2 text-right">Fees + ship</th>
              <th className="p-2 text-right">Cost</th><th className="p-2 text-right">Profit</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => {
              const cost = r.cards?.cost_cents ?? 0;
              const p = r.price_cents - r.fees_cents - r.shipping_cents - cost;
              return (
                <tr key={r.id} className="border-b border-zinc-100 last:border-0">
                  <td className="p-2 whitespace-nowrap">{r.sold_at}</td>
                  <td className="p-2"><Link className="hover:underline" href={`/cards/${r.card_id}`}>{r.cards?.player_names} #{r.cards?.card_number}</Link></td>
                  <td className="p-2">{r.channel}</td>
                  <td className="p-2 text-right tabular-nums">{money(r.price_cents)}</td>
                  <td className="p-2 text-right tabular-nums">{money(r.fees_cents + r.shipping_cents)}</td>
                  <td className="p-2 text-right tabular-nums">{money(cost)}</td>
                  <td className={`p-2 text-right tabular-nums ${p >= 0 ? "text-emerald-700" : "text-red-600"}`}>{money(p)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!shown.length && <p className="p-6 text-center text-sm text-zinc-500">No sales yet. Record one from a card's page.</p>}
      </div>
    </div>
  );
}
