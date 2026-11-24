/** Outcome of one sale insert; matches what supabase-js returns (`error` is null or has a message). */
export type SaleInsertOutcome = { error: { message: string } | null };

export type SaleSummary = { total: number; landed: number; failed: number; firstError: string | null };

/** Count how many sale inserts landed and keep the first error message. */
export function summarizeSaleInserts(outcomes: SaleInsertOutcome[]): SaleSummary {
  const failures = outcomes.filter((o) => o.error);
  return {
    total: outcomes.length,
    landed: outcomes.length - failures.length,
    failed: failures.length,
    firstError: failures[0]?.error?.message ?? null,
  };
}

/** Warning shown after an import when some sold rows lost their sale; null when all landed. */
export function saleWarning(s: SaleSummary): string | null {
  if (!s.failed) return null;
  return `${s.failed} of ${s.total} sold rows lost their sale: ${s.firstError ?? "unknown error"}. Those cards are marked sold but have no sale recorded. Use "Undo this import" and import again.`;
}

/** Decide whether an import may be undone, given what hangs off its cards. */
export function undoCheck(sales: number, listings: number): { ok: false; message: string } | { ok: true; confirm: string } {
  if (sales > 0) {
    return { ok: false, message: `${sales} sale${sales === 1 ? "" : "s"} recorded on cards from this import - delete those sales first.` };
  }
  const extra = listings > 0 ? ` ${listings} listing${listings === 1 ? "" : "s"} will be deleted too.` : "";
  return { ok: true, confirm: `Delete every card from this import? Cards you edited since will be deleted too.${extra} This can't be undone.` };
}
