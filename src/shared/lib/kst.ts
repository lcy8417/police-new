const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/**
 * ISO timestamp shifted to KST with an explicit `+09:00` suffix.
 * Preserves the exact behavior hardcoded in crud.js#fetchHistorySave:
 * `new Date(Date.now() + 9h).toISOString().replace("Z", "+09:00")`.
 */
export function toKstIso(date: Date = new Date()): string {
  return new Date(date.getTime() + KST_OFFSET_MS)
    .toISOString()
    .replace("Z", "+09:00");
}
