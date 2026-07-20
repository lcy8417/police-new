/**
 * 대응 순위(rank)별 강조 색 팔레트.
 *
 * `features/crime-search/model/similarity.ts`의 `MATCH_COLORS`/`matchColor`와
 * 의도적으로 동일한 6색 팔레트를 이 feature 안에 소규모 복제한다 — FSD가
 * features↔features cross-import를 금지하므로(`docs/architecture.md` §1), 6줄
 * 상수 하나를 위해 `crime-search`를 import하지 않는다.
 */
// @MX:NOTE: [AUTO] MATCH_TOP10_COLORS - crime-search/model/similarity.ts의 MATCH_COLORS와 의도적으로 동일한 팔레트를 소규모 복제, FSD features 간 cross-import 금지 규칙 준수 목적
export const MATCH_TOP10_COLORS = [
  "#4A9EFF", // blue
  "#2DD4BF", // teal
  "#F59E0B", // amber
  "#A78BFA", // violet
  "#F472B6", // pink
  "#4ADE80", // green
] as const

/** 1-based 순위를 팔레트 색으로 매핑(6색 순환). */
export function matchTop10Color(rank: number): string {
  const n = Math.max(1, Math.round(rank || 1))
  return MATCH_TOP10_COLORS[(n - 1) % MATCH_TOP10_COLORS.length]
}
