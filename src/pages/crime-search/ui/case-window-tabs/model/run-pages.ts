// 검색 이력 결과 쪽(D4)을 이어 받을 때의 전체 수 · 더 받기 판단.
// 서버 `total` 은 그 검색 당시 결과 수다. 201위 이후는 지금 기준으로 다시 계산하므로(그새 신발 문양이 바뀌어 필수 통과
// 후보가 줄면) 둘째 쪽 이후가 비어 올 수 있다 — 그때 「더 보기 · 200 / 250」이 남아 눌러도 아무것도 안 오던 것([검수]).

interface PageLike {
  items: readonly unknown[]
  total: number | null
}

/** 받은 쪽들(아직 못 받은 쪽 = undefined) → 보여 줄 전체 수 · 더 받을 것이 없나 */
export function runPagesState(pages: readonly (PageLike | undefined)[]): { total: number; exhausted: boolean } {
  const loaded = pages.filter((p): p is PageLike => p !== undefined)
  const rows = loaded.reduce((n, p) => n + p.items.length, 0)
  const last = loaded[loaded.length - 1]
  const exhausted = loaded.length > 1 && last !== undefined && last.items.length === 0
  if (exhausted) return { total: rows, exhausted: true }
  return { total: loaded[0]?.total ?? rows, exhausted: false }
}
