"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { centsToInput, ebayTitle, money, toCents } from "@/lib/format";
import { STATUS_LABEL, type Card, type Channel, type Sale, type Status } from "@/lib/types";
import type { CardDraft } from "@/lib/importer";

const EMPTY: CardDraft = {
  year: 2026, brand: "Topps", set_name: "", subset: null, card_number: "", player_names: "", team: null,
  jersey_number: null, parallel: null, serial_to: null, serial_number: null, is_rookie: false, is_auto: false,
  auto_type: null, is_patch: false, grader: null, grade: null, grading_candidate: null, cost_cents: null,
  estimate_cents: null, list_price_cents: null, status: "in_stock", ebay_epid: null, ebay_catalog_title: null,
  ebay_reference_ids: null, price_source_url: null, notes: null,
};

const nullIfBlank = (v: string) => (v.trim() === "" ? null : v);
const intOrNull = (v: string) => (v.trim() === "" ? null : Number(v));

export default function CardPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === "new";
  const router = useRouter();
  const [card, setCard] = useState<CardDraft | null>(isNew ? EMPTY : null);
  const [money_, setMoney] = useState({ cost: "", estimate: "", list: "" });
  const [sales, setSales] = useState<Sale[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isNew) return;
    supabase.from("cards").select("*").eq("id", id).single().then(({ data, error }) => {
      if (error) return setMsg(error.message);
      const c = data as Card;
      setCard(c);
      setMoney({ cost: centsToInput(c.cost_cents), estimate: centsToInput(c.estimate_cents), list: centsToInput(c.list_price_cents) });
    });
    supabase.from("sales").select("*").eq("card_id", id).order("sold_at").then(({ data }) => setSales((data as Sale[]) ?? []));
  }, [id, isNew]);

  if (!card) return <p className="text-sm text-zinc-500">{msg ?? "Loading…"}</p>;

  const set = <K extends keyof CardDraft>(k: K, v: CardDraft[K]) => setCard({ ...card, [k]: v });

  async function save(andNew = false) {
    if (!card) return;
    if (!card.card_number.trim() || !card.player_names.trim()) return setMsg("Card number and player are required.");
    setSaving(true);
    setMsg(null);
    const row = {
      ...card,
      cost_cents: toCents(money_.cost),
      estimate_cents: toCents(money_.estimate),
      list_price_cents: toCents(money_.list),
    };
    const res = isNew
      ? await supabase.from("cards").insert(row).select("id").single()
      : await supabase.from("cards").update(row).eq("id", id).select("id").single();
    setSaving(false);
    if (res.error) return setMsg(res.error.message);
    if (andNew) {
      // keep set + player context for fast entry of the next card
      setCard({ ...EMPTY, year: card.year, brand: card.brand, set_name: card.set_name, team: card.team });
      setMoney({ cost: "", estimate: "", list: "" });
      setMsg("Saved. Next card:");
      if (!isNew) router.push("/cards/new");
      return;
    }
    router.push(isNew ? `/cards/${res.data.id}` : "/");
  }

  async function remove() {
    if (!confirm("Delete this card permanently? This can't be undone.")) return;
    const { error } = await supabase.from("cards").delete().eq("id", id);
    if (error) return setMsg(error.message);
    router.push("/");
  }

  async function duplicate() {
    if (!card) return;
    const { data, error } = await supabase.from("cards").insert({ ...card }).select("id").single();
    if (error) return setMsg(error.message);
    router.push(`/cards/${data.id}`);
  }

  const title = ebayTitle(card);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-900">← Inventory</Link>
          <h1 className="text-lg font-semibold">{isNew ? "Add card" : `${card.player_names} #${card.card_number}`}</h1>
        </div>

        <Section title="Card">
          <Field label="Year"><input className="input" inputMode="numeric" value={card.year ?? ""} onChange={(e) => set("year", intOrNull(e.target.value))} /></Field>
          <Field label="Brand"><input className="input" value={card.brand ?? ""} onChange={(e) => set("brand", nullIfBlank(e.target.value))} /></Field>
          <Field label="Set"><input className="input" placeholder="Flagship, Inception…" value={card.set_name ?? ""} onChange={(e) => set("set_name", nullIfBlank(e.target.value))} /></Field>
          <Field label="Insert / subset"><input className="input" placeholder="Wild Card Moments…" value={card.subset ?? ""} onChange={(e) => set("subset", nullIfBlank(e.target.value))} /></Field>
          <Field label="Card number *"><input className="input" value={card.card_number} onChange={(e) => set("card_number", e.target.value)} /></Field>
          <Field label="Player(s) *" wide><input className="input" value={card.player_names} onChange={(e) => set("player_names", e.target.value)} /></Field>
          <Field label="Team"><input className="input" value={card.team ?? ""} onChange={(e) => set("team", nullIfBlank(e.target.value))} /></Field>
          <Field label="Jersey #"><input className="input" value={card.jersey_number ?? ""} onChange={(e) => set("jersey_number", nullIfBlank(e.target.value))} /></Field>
        </Section>

        <Section title="Variant">
          <Field label="Parallel"><input className="input" placeholder="blank = base" value={card.parallel ?? ""} onChange={(e) => set("parallel", nullIfBlank(e.target.value))} /></Field>
          <Field label="Numbered to (/N)"><input className="input" inputMode="numeric" value={card.serial_to ?? ""} onChange={(e) => set("serial_to", intOrNull(e.target.value))} /></Field>
          <Field label="Copy # (e.g. 24)"><input className="input" inputMode="numeric" value={card.serial_number ?? ""} onChange={(e) => set("serial_number", intOrNull(e.target.value))} /></Field>
          <Field label="Autograph">
            <select className="input" value={card.is_auto ? card.auto_type ?? "yes" : "no"}
              onChange={(e) => {
                const v = e.target.value;
                setCard({ ...card, is_auto: v !== "no", auto_type: v === "on_card" || v === "sticker" ? v : null });
              }}>
              <option value="no">No</option>
              <option value="on_card">On-card</option>
              <option value="sticker">Sticker</option>
              <option value="yes">Yes (type unknown)</option>
            </select>
          </Field>
          <Checks>
            <label className="flex items-center gap-1.5"><input type="checkbox" checked={card.is_rookie} onChange={(e) => set("is_rookie", e.target.checked)} /> Rookie (RC)</label>
            <label className="flex items-center gap-1.5"><input type="checkbox" checked={card.is_patch} onChange={(e) => set("is_patch", e.target.checked)} /> Patch / relic</label>
          </Checks>
        </Section>

        <Section title="Grading">
          <Field label="Grade it?">
            <select className="input" value={card.grading_candidate ?? ""} onChange={(e) => set("grading_candidate", (e.target.value || null) as CardDraft["grading_candidate"])}>
              <option value="">—</option><option value="yes">Yes</option><option value="maybe">Maybe</option><option value="no">No</option>
            </select>
          </Field>
          <Field label="Grader"><input className="input" placeholder="PSA, BGS, SGC" value={card.grader ?? ""} onChange={(e) => set("grader", nullIfBlank(e.target.value))} /></Field>
          <Field label="Grade"><input className="input" value={card.grade ?? ""} onChange={(e) => set("grade", nullIfBlank(e.target.value))} /></Field>
        </Section>

        <Section title="Money & status">
          <Field label="Status">
            <select className="input" value={card.status} onChange={(e) => set("status", e.target.value as Status)}>
              {(Object.keys(STATUS_LABEL) as Status[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
          </Field>
          <Field label="Cost ($)"><input className="input" inputMode="decimal" value={money_.cost} onChange={(e) => setMoney({ ...money_, cost: e.target.value })} /></Field>
          <Field label="Value estimate ($)"><input className="input" inputMode="decimal" value={money_.estimate} onChange={(e) => setMoney({ ...money_, estimate: e.target.value })} /></Field>
          <Field label="Ask price ($)"><input className="input" inputMode="decimal" value={money_.list} onChange={(e) => setMoney({ ...money_, list: e.target.value })} /></Field>
          <Field label="Price source link" wide><input className="input" value={card.price_source_url ?? ""} onChange={(e) => set("price_source_url", nullIfBlank(e.target.value))} /></Field>
        </Section>

        <Section title="Notes">
          <div className="sm:col-span-4">
            <textarea className="input min-h-20" value={card.notes ?? ""} onChange={(e) => set("notes", nullIfBlank(e.target.value))} />
          </div>
        </Section>

        {msg && <p className="text-sm text-red-600">{msg}</p>}
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary" disabled={saving} onClick={() => save()}>Save</button>
          <button className="btn" disabled={saving} onClick={() => save(true)}>Save & add another</button>
          {!isNew && <button className="btn" onClick={duplicate}>Duplicate</button>}
          {!isNew && <button className="btn ml-auto text-red-600" onClick={remove}>Delete</button>}
        </div>
      </div>

      <aside className="space-y-4">
        <div className="card space-y-3 p-4">
          <h2 className="text-sm font-semibold">eBay</h2>
          <div>
            <div className="label">Listing title ({title.length}/80)</div>
            <div className="flex gap-2">
              <p className="flex-1 rounded-md bg-zinc-50 p-2 text-sm">{title}</p>
              <button className="btn self-start" onClick={() => navigator.clipboard.writeText(title)}>Copy</button>
            </div>
          </div>
          <Field label="eBay catalog ID (ePID)">
            <input className="input" value={card.ebay_epid ?? ""} onChange={(e) => set("ebay_epid", nullIfBlank(e.target.value.replace(/\D/g, "")))} />
          </Field>
          {card.ebay_epid && (
            <a className="block text-xs text-sky-700 hover:underline" href={`https://www.ebay.com/p/${card.ebay_epid}`} target="_blank" rel="noreferrer">
              {card.ebay_catalog_title ?? "Open catalog page"} ↗
            </a>
          )}
          <button className="btn w-full justify-center" disabled title="Available once your eBay developer keys are approved">
            Create eBay draft (soon)
          </button>
        </div>

        {!isNew && <SalesBox cardId={id} cost={card.cost_cents} sales={sales} onChange={(s) => { setSales(s); if (s.length) set("status", "sold"); }} />}
      </aside>
    </div>
  );
}

function SalesBox({ cardId, cost, sales, onChange }: { cardId: string; cost: number | null; sales: Sale[]; onChange: (s: Sale[]) => void }) {
  const [form, setForm] = useState({ channel: "ebay" as Channel, price: "", fees: "", shipping: "", date: new Date().toISOString().slice(0, 10) });
  const [err, setErr] = useState<string | null>(null);

  async function add() {
    const price = toCents(form.price);
    if (price === null) return setErr("Enter the sale price.");
    const { data, error } = await supabase.from("sales").insert({
      card_id: cardId, channel: form.channel, sold_at: form.date, price_cents: price,
      fees_cents: toCents(form.fees) ?? 0, shipping_cents: toCents(form.shipping) ?? 0,
    }).select("*").single();
    if (error) return setErr(error.message);
    await supabase.from("cards").update({ status: "sold" }).eq("id", cardId);
    onChange([...sales, data as Sale]);
    setForm({ ...form, price: "", fees: "", shipping: "" });
    setErr(null);
  }

  return (
    <div className="card space-y-3 p-4">
      <h2 className="text-sm font-semibold">Sale</h2>
      {sales.map((s) => {
        const profit = s.price_cents - s.fees_cents - s.shipping_cents - (cost ?? 0);
        return (
          <div key={s.id} className="rounded-md bg-zinc-50 p-2 text-sm">
            <div className="flex justify-between"><span>{s.sold_at} · {s.channel}</span><b>{money(s.price_cents)}</b></div>
            <div className="text-xs text-zinc-500">fees {money(s.fees_cents)} · ship {money(s.shipping_cents)} · cost {money(cost)}</div>
            <div className={`text-sm font-medium ${profit >= 0 ? "text-emerald-700" : "text-red-600"}`}>Profit {money(profit)}</div>
          </div>
        );
      })}
      <div className="grid grid-cols-2 gap-2">
        <select className="input" value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value as Channel })}>
          <option value="ebay">eBay</option><option value="whatnot">Whatnot</option><option value="show">Card show</option><option value="other">Other</option>
        </select>
        <input className="input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        <input className="input" placeholder="Sold for $" inputMode="decimal" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        <input className="input" placeholder="Fees $" inputMode="decimal" value={form.fees} onChange={(e) => setForm({ ...form, fees: e.target.value })} />
        <input className="input col-span-2" placeholder="Shipping cost $" inputMode="decimal" value={form.shipping} onChange={(e) => setForm({ ...form, shipping: e.target.value })} />
      </div>
      {err && <p className="text-xs text-red-600">{err}</p>}
      <button className="btn w-full justify-center" onClick={add}>Record sale</button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card p-4">
      <h2 className="mb-3 text-sm font-semibold">{title}</h2>
      <div className="grid gap-3 sm:grid-cols-4">{children}</div>
    </section>
  );
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

function Checks({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col justify-end gap-1 text-sm">{children}</div>;
}
