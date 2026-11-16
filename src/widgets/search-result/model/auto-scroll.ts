// 사건 창 검색 결과 자동 스크롤(11/17 사용자 「자동 누르면 … 스크롤 자체가 내려가는거야 … 속도로 할 수도 있고, 페이지 넘김으로 초를 할 수도 있고」).
// 순수 계산만 — 화면은 rAF(속도) · 시계(쪽 넘김)로 이 값을 써서 scrollTop 을 바꾼다.

/** 속도 방식 px/초 범위 · 기본 */
export const SCROLL_SPEED_MIN = 20
export const SCROLL_SPEED_MAX = 240
export const SCROLL_SPEED_STEP = 10
export const SCROLL_SPEED_DEFAULT = 60

/** 쪽 넘김 방식 초 범위 · 기본(한 화면씩) */
export const PAGE_SEC_MIN = 1
export const PAGE_SEC_MAX = 10
export const PAGE_SEC_DEFAULT = 3

/** 끝에서 이만큼(px) 남으면 다음 순위들을 붙여 달라고 한다 */
export const LOAD_MORE_GAP = 240

/** 속도 방식 한 걸음: 지난 시간(ms)만큼 내려간 scrollTop(끝 넘지 않음) */
export function nextScrollTop(top: number, dtMs: number, pxPerSec: number, maxTop: number): number {
  const dt = Math.max(0, Math.min(dtMs, 100)) // 탭이 멈췄다 돌아와도 한 번에 튀지 않게
  return Math.min(maxTop, top + (pxPerSec * dt) / 1000)
}

/** 쪽 넘김 방식 한 걸음: 한 화면(겹침 조금 남김) 아래 */
export function nextPageTop(top: number, viewH: number, maxTop: number): number {
  return Math.min(maxTop, top + Math.max(40, viewH - 32))
}

/** 목록 위 가장자리를 다 지나간(아래 끝이 보이는 칸 위로 올라간) 카드 중 가장 큰 순위 — 「본 것」으로 올릴 순위 */
export function passedRank(cards: readonly { rank: number; bottom: number }[], viewTop: number): number | null {
  let best: number | null = null
  for (const c of cards) if (c.bottom <= viewTop && (best === null || c.rank > best)) best = c.rank
  return best
}
