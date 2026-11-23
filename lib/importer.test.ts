import { test } from "node:test";
import assert from "node:assert/strict";
import {
  guessMapping,
  parseCents,
  parseSerial,
  parseSignature,
  parseParallel,
  transformRow,
  type BatchDefaults,
} from "./importer.ts";

const HEADERS = [
  "Card Number", "Numbered", "Parallel", "Signature", "Patch", "Player Name(s)", "Team",
  "PRICE", "PRICE ESTIMATE", "GRADING?", "SCP link", "ebay auction ID", "Jersey #",
  "eBay ePID", "eBay catalog title", "eBay match",
];

const defaults: BatchDefaults = { year: 2026, brand: "Topps", set_name: "Flagship", status: "in_stock" };

test("guesses every column of the existing sheets", () => {
  const m = guessMapping(HEADERS);
  assert.deepEqual(m, {
    "Card Number": "card_number",
    Numbered: "serial",
    Parallel: "parallel",
    Signature: "signature",
    Patch: "is_patch",
    "Player Name(s)": "player_names",
    Team: "team",
    PRICE: "comp",
    "PRICE ESTIMATE": "estimate",
    "GRADING?": "grading_candidate",
    "SCP link": "price_source_url",
    "ebay auction ID": "ebay_reference_ids",
    "Jersey #": "jersey_number",
    "eBay ePID": "ebay_epid",
    "eBay catalog title": "ebay_catalog_title",
    "eBay match": "ignore",
  });
});

test("money parsing", () => {
  assert.equal(parseCents("$77.07"), 7707);
  assert.equal(parseCents("$1,234.50"), 123450);
  assert.equal(parseCents("12,50 €"), 1250);
  assert.equal(parseCents(""), null);
  assert.equal(parseCents(4.5), 450);
});

test("serial parsing", () => {
  assert.deepEqual(parseSerial("150"), { to: 150, number: null });
  assert.deepEqual(parseSerial("/99"), { to: 99, number: null });
  assert.deepEqual(parseSerial("24/99"), { to: 99, number: 24 });
  assert.deepEqual(parseSerial(""), { to: null, number: null });
});

test("signature parsing", () => {
  assert.deepEqual(parseSignature("sticker "), { is_auto: true, auto_type: "sticker" });
  assert.deepEqual(parseSignature("oncard"), { is_auto: true, auto_type: "on_card" });
  assert.deepEqual(parseSignature("on-card"), { is_auto: true, auto_type: "on_card" });
  assert.deepEqual(parseSignature(""), { is_auto: false, auto_type: null });
});

test("parallel normalising", () => {
  assert.equal(parseParallel("Base"), null);
  assert.equal(parseParallel("green"), "Green");
  assert.equal(parseParallel("Rainbow Green"), "Rainbow Green");
});

test("full Flagship row", () => {
  const m = guessMapping(HEADERS);
  const r = transformRow(
    {
      "Card Number": "WC-9", Numbered: "50", Parallel: "Gold", Signature: "", Patch: "",
      "Player Name(s)": "Caleb Williams", Team: "Chicago Bears", PRICE: "", "PRICE ESTIMATE": "$77.07",
      "GRADING?": "yes", "SCP link": "https://www.sportscardspro.com/x", "ebay auction ID": "",
      "Jersey #": "18", "eBay ePID": "'6101571848", "eBay catalog title": "2026 Topps - WC-9 Gold Foil /50", "eBay match": "Matched",
    },
    m,
    defaults,
  );
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.equal(r.card.card_number, "WC-9");
  assert.equal(r.card.serial_to, 50);
  assert.equal(r.card.estimate_cents, 7707);
  assert.equal(r.card.comp_cents, null);
  assert.equal(r.card.list_price_cents, null);
  assert.equal(r.card.ebay_epid, "6101571848");
  assert.equal(r.card.grading_candidate, "yes");
  assert.equal(r.card.set_name, "Flagship");
  assert.equal(r.sale, null);
});

test("Inception row with dual players, 'none live' and a non-numeric eBay note", () => {
  const m = guessMapping(HEADERS);
  const r = transformRow(
    {
      "Card Number": "DRA-ST", Numbered: "25", Parallel: "dual auto", Signature: "sticker",
      "Player Name(s)": "Carnell Tate / Nick Singleton", "ebay auction ID": "none live",
      "eBay ePID": "", "eBay catalog title": "No Aqua Holo Foil in catalog",
    },
    m,
    { ...defaults, set_name: "Inception" },
  );
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.equal(r.card.is_auto, true);
  assert.equal(r.card.auto_type, "sticker");
  assert.equal(r.card.parallel, "Dual Auto");
  assert.equal(r.card.ebay_reference_ids, null);
  assert.equal(r.card.ebay_epid, null);
  assert.match(r.card.notes ?? "", /No Aqua Holo Foil/);
});

test("skips empty rows and rows without a card number", () => {
  const m = guessMapping(HEADERS);
  assert.deepEqual(transformRow({}, m, defaults), { ok: false, reason: "empty row" });
  const r = transformRow({ "Player Name(s)": "X" }, m, defaults);
  assert.equal(r.ok, false);
});

test("a sold price makes a sale and marks the card sold", () => {
  const m = guessMapping(["Card", "Player", "Sold price", "Sold date"]);
  const r = transformRow({ Card: "151", Player: "Fernando Mendoza", "Sold price": "$55", "Sold date": "2026-11-20" }, m, defaults);
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.equal(r.card.status, "sold");
  assert.deepEqual(r.sale, { price_cents: 5500, sold_at: "2026-11-20" });
});
