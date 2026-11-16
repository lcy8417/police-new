import type { ConfirmFilterKey, ConfirmFilterValues, ConfirmImageBlock, ConfirmInsight, Judgement } from "./types"

// r3 이미지 블록 빠른 찾기 · 필터 칩. 묶음 안은 「또는」, 묶음 사이는 「그리고」. 거르는 건 보기만 바꾼다(저장 값은 그대로).

/** 필터가 읽는 판정 값 */
export interface ConfirmFilterContext {
  /** 결과확인완료된 판정(감정물 번호 → 판정) */
  completed: Readonly<Record<string, Judgement | undefined>>
  /** 고른 라디오(아직 저장 안 함) */
  judgements: Readonly<Record<string, Judgement | null | undefined>>
  /** +α 값(AI 추천) — 없으면 AI 묶음은 거르지 않는다 */
  insight: ConfirmInsight | null
}

/** 블록의 판정 — 저장된 것이 먼저, 없으면 고른 라디오 */
export function blockJudgement(aprthngNo: string, ctx: ConfirmFilterContext): Judgement | null {
  return ctx.completed[aprthngNo] ?? ctx.judgements[aprthngNo] ?? null
}

function matchesQuery(block: ConfirmImageBlock, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return block.aprthngNo.toLowerCase().includes(q) || (block.target?.ftwrId.toLowerCase().includes(q) ?? false)
}

function matchesGroup(key: ConfirmFilterKey, values: readonly string[], block: ConfirmImageBlock, ctx: ConfirmFilterContext): boolean {
  if (values.length === 0) return true
  const judgement = blockJudgement(block.aprthngNo, ctx)
  switch (key) {
    case "progress":
      return ctx.completed[block.aprthngNo] === undefined
    case "judgement":
      return judgement !== null && values.includes(judgement)
    case "ai": {
      const ai = ctx.insight?.blocks[block.aprthngNo]?.aiRecommend
      if (!ctx.insight) return true
      return ai !== undefined && judgement !== null && judgement !== ai
    }
  }
}

const KEYS: readonly ConfirmFilterKey[] = ["progress", "judgement", "ai"]

export function filterBlocks(
  blocks: readonly ConfirmImageBlock[],
  query: string,
  filters: ConfirmFilterValues,
  ctx: ConfirmFilterContext,
): ConfirmImageBlock[] {
  return blocks.filter((b) => matchesQuery(b, query) && KEYS.every((k) => matchesGroup(k, filters[k] ?? [], b, ctx)))
}

export function hasActiveFilter(query: string, filters: ConfirmFilterValues): boolean {
  return query.trim() !== "" || KEYS.some((k) => (filters[k] ?? []).length > 0)
}

/** 칩 옆 개수 — 그 값 하나만 걸었을 때 몇 장인지 */
export function optionCount(
  blocks: readonly ConfirmImageBlock[],
  key: ConfirmFilterKey,
  value: string,
  ctx: ConfirmFilterContext,
): number {
  return blocks.filter((b) => matchesGroup(key, [value], b, ctx)).length
}
