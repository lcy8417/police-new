import type { SearchHistoryRow } from "./types"

// S04 검색 이력 표 보기(r3): 열 고르기 + 검색(검색번호 · 검색방법 · 매칭된 신발 · 검색일).
/** 검색 이력 열(SCAS 순서). 검색번호는 잠금 */
export const HISTORY_COLUMNS = [
  { key: "searchNo", label: "검색번호", locked: true },
  { key: "resultCount", label: "결과건수" },
  { key: "method", label: "검색방법" },
  { key: "open", label: "검색결과" },
  { key: "frstRegistDt", label: "검색일" },
  { key: "ranking", label: "순위" },
  { key: "mtchgId", label: "매칭된 신발 정보" },
] as const

export function filterHistory(rows: readonly SearchHistoryRow[], query: string): SearchHistoryRow[] {
  const q = query.trim().toLowerCase()
  if (!q) return [...rows]
  return rows.filter((r) =>
    [String(r.searchNo), r.method ?? "", r.mtchgId ?? "", r.frstRegistDt].some((t) => t.toLowerCase().includes(q)),
  )
}
