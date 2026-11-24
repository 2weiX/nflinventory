import { test } from "node:test";
import assert from "node:assert/strict";
import { saleWarning, summarizeSaleInserts, undoCheck } from "./importResult.ts";

const ok = { error: null };
const bad = (m: string) => ({ error: { message: m } });

test("all sale inserts landed: no warning", () => {
  const s = summarizeSaleInserts([ok, ok]);
  assert.deepEqual(s, { total: 2, landed: 2, failed: 0, firstError: null });
  assert.equal(saleWarning(s), null);
});

test("no sold rows: no warning", () => {
  assert.equal(saleWarning(summarizeSaleInserts([])), null);
});

test("partial failure counts failures and keeps the first message", () => {
  const s = summarizeSaleInserts([ok, bad("timeout"), bad("jwt expired")]);
  assert.equal(s.failed, 2);
  assert.equal(s.landed, 1);
  assert.equal(s.firstError, "timeout");
  assert.match(saleWarning(s)!, /^2 of 3 sold rows lost their sale: timeout/);
});

test("zero sales landed still warns", () => {
  const s = summarizeSaleInserts([bad("boom"), bad("boom")]);
  assert.equal(s.landed, 0);
  assert.match(saleWarning(s)!, /^2 of 2 sold rows lost their sale: boom/);
  assert.match(saleWarning(s)!, /Undo/);
});

test("undo is refused when sales exist", () => {
  const r = undoCheck(3, 1);
  assert.equal(r.ok, false);
  assert.match((r as { message: string }).message, /3 sales recorded on cards from this import - delete those sales first/);
  assert.match((undoCheck(1, 0) as { message: string }).message, /^1 sale recorded/);
});

test("undo with listings only proceeds and names the count in the confirm", () => {
  const r = undoCheck(0, 2);
  assert.equal(r.ok, true);
  assert.match((r as { confirm: string }).confirm, /2 listings will be deleted too/);
});

test("undo with nothing attached has the plain confirm", () => {
  const r = undoCheck(0, 0) as { ok: true; confirm: string };
  assert.equal(r.ok, true);
  assert.doesNotMatch(r.confirm, /listing/);
});
