/**
 * Root under which pattern PNGs live. The server sends bare pattern *names*;
 * the client prepends this root. Canonical single-slash form (mirrors
 * path-utils.pathInsert / crud.js, not toPatternPaths' cosmetic double slash).
 */
// @MX:NOTE: [AUTO] 패턴 이미지 루트 경로 하드코딩 - 여러 파일에 중복 존재(use-pattern-manager.ts의 patternsRoot 클로저, 레거시 path-utils.js, crud.js#fetchHistoryData). 현재는 이 상수가 사실상 단일 출처로 취급됨
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
// @MX:ANCHOR: [AUTO] insertPatternPath - crime-store.refetch·crime-api·shoe-api·PatternZones 등 문양 표시 경로가 공유하는 경로 hydrate 진입점
// @MX:REASON: fan_in 다수(엔티티 API 3곳 + 상태 + UI) — 서버가 이름만 보내는 문양을 자산 경로로 바꾸는 유일한 지점, 이중 변환 시 경로 깨짐 위험
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
// @MX:ANCHOR: [AUTO] stripPatternPath - 서버 전송 직전 이름만 추출하는 유일한 지점(crime-api PUT/POST, shoe-api PUT/POST, use-pattern-manager 중복검사)
// @MX:REASON: fan_in 다수 — crime 튜플/shoe 문자열 두 표현을 모두 처리하는 단일 분기점, 이름 기준 비교 불변식이 여기 캡슐화됨
export function stripPatternPath(
  entry: PatternEntry
): string | readonly [string, EssentialFlag] {
  if (typeof entry === "string") {
    return baseName(entry);
  }
  return [baseName(entry[0]), entry[1]] as const;
}
