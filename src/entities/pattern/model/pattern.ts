/**
 * Root under which pattern PNGs live. The server sends bare pattern *names*;
 * the client prepends this root. Canonical single-slash form (mirrors
 * path-utils.pathInsert / crud.js, not toPatternPaths' cosmetic double slash).
 */
export const PATTERNS_ROOT = "/src/assets/Patterns/전체/";

/**
 * The crime "필수(essential)" flag. It is INITIALIZED to the number `0`
 * (usePatternManager) and only becomes a boolean after the user toggles it —
 * so the runtime type is genuinely `0 | boolean`, not `boolean`. The `0`
 * sentinel must pass through to the wire unchanged.
 */
export type EssentialFlag = 0 | boolean;

/**
 * A pattern entry's shape depends on context:
 *  - crime patterns: `[path, essential]` tuple
 *  - shoe patterns:  a bare path string
 * Both variants coexist; code must always know which it holds.
 */
export type PatternEntry =
  | string
  | readonly [path: string, essential: EssentialFlag];

export type PatternZone = "top" | "mid" | "bottom" | "outline";

const baseName = (path: string): string => path.split("/").pop()!.split(".")[0];

/**
 * Prepend the pattern root to a bare-name entry.
 * Mirror of pathInsert (crime tuple) / toPatternPaths (shoe string).
 */
export function insertPatternPath(entry: PatternEntry): PatternEntry {
  if (typeof entry === "string") {
    return PATTERNS_ROOT + entry + ".png";
  }
  return [PATTERNS_ROOT + entry[0] + ".png", entry[1]] as const;
}

/**
 * Strip a pattern entry back to the bare-name wire form the server expects.
 * Typed successor to utils/get-input-change.js#onlyPatternName (per item):
 *  - crime tuple → `[name, essential]` (0-sentinel passed through unchanged)
 *  - shoe string → `name`
 */
export function stripPatternPath(
  entry: PatternEntry
): string | readonly [string, EssentialFlag] {
  if (typeof entry === "string") {
    return baseName(entry);
  }
  return [baseName(entry[0]), entry[1]] as const;
}
