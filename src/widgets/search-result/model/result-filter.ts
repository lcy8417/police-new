import { parseSimilarity, similarityGrade } from "./similarity"
import type { ImageSearchResultItem, ResultFilterKey, ResultFilterValues, SearchTarget } from "./types"

// r3 빠른 찾기 · 필터 칩(지금 쪽 안에서 거름). 묶음 안은 「또는」, 묶음 사이는 「그리고」.
// 거르는 건 보기만 바꾼다 — 순위 · 쪽 · 전체 건수는 그대로.

/** 순위가 붙은 결과 한 칸 */
export interface RankedResult {
  item: ImageSearchResultItem
  /** 1부터 센 전체 순위 */
  rank: number
}

/** 필터가 읽는 +α 값(없으면 그 묶음은 거르지 않는다) */
export interface FilterContext {
  /** 어디까지 봤나(순위) — 없으면 null */
  seenUpTo: number | null
  /** 확인대상 */
  targets: readonly SearchTarget[]
  /** AI가 먼저 보라는 10건의 신발 ID — 없으면 null */
  aiIds: ReadonlySet<string> | null
}

/** 화류번호 · 상표 글자 검색(대소문자 무시, 앞뒤 공백 무시) */
export function matchesQuery(item: ImageSearchResultItem, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return item.ftwrId.toLowerCase().includes(q) || (item.brandNm ?? "").toLowerCase().includes(q)
}

function matchesGroup(key: ResultFilterKey, values: readonly string[], row: RankedResult, ctx: FilterContext): boolean {
  if (values.length === 0) return true
  switch (key) {
    case "grade":
      return values.includes(similarityGrade(parseSimilarity(row.item.similarity)))
    case "seen": {
      if (ctx.seenUpTo === null) return true
      const seen = row.rank <= ctx.seenUpTo
      return values.includes(seen ? "seen" : "unseen")
    }
    case "target":
      return ctx.targets.some((t) => t.ftwrId === row.item.ftwrId)
    case "ai":
      return ctx.aiIds === null ? true : ctx.aiIds.has(row.item.ftwrId)
  }
}

const KEYS: readonly ResultFilterKey[] = ["grade", "seen", "target", "ai"]

/** 조건에 맞는 칸만(순서 그대로) */
export function filterResults(
  rows: readonly RankedResult[],
  query: string,
  filters: ResultFilterValues,
  ctx: FilterContext,
): RankedResult[] {
  return rows.filter(
    (row) => matchesQuery(row.item, query) && KEYS.every((key) => matchesGroup(key, filters[key] ?? [], row, ctx)),
  )
}

/** 조건이 하나라도 걸렸나 */
export function hasActiveFilter(query: string, filters: ResultFilterValues): boolean {
  return query.trim() !== "" || KEYS.some((key) => (filters[key] ?? []).length > 0)
}

/** 칩 옆 개수 — 그 값 하나만 걸었을 때 지금 쪽에서 몇 건인지 */
export function optionCount(rows: readonly RankedResult[], key: ResultFilterKey, value: string, ctx: FilterContext): number {
  return rows.filter((row) => matchesGroup(key, [value], row, ctx)).length
}
