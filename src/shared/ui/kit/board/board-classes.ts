// 목록 판 부품 공용 클래스(r4 — romang `shared/ui/board/board-classes.ts` 이식, 색만 경찰 토큰).
// 출입구(kit index)로 내보내지 않는 안쪽 값이다.

/** 색 · 테 · 그림자 · 투명도 0.15초, 눌림 이동 0.12초. 움직임 줄이기면 바뀜 없음 */
export const BOARD_TRANSITION =
  "[transition:background-color_0.15s,border-color_0.15s,color_0.15s,box-shadow_0.15s,opacity_0.15s,transform_0.12s] motion-reduce:transition-none"

/**
 * 진한 뚜껑 띠(bg-brand-3) 위 단추의 키보드 초점 — 로망은 연분홍 2px 링 · 2px 띄움.
 * 경찰 brand 는 띠 색과 붙어 안 보이므로 띠 위에서는 종이색(항상 밝음) 테를 쓴다.
 */
export const LID_FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-paper"

/** 흰 판 위 초점 — 로망 `outline-focus` → 경찰 `outline-brand` */
export const PANEL_FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-brand"

export const BOARD_BUTTON = `m-0 cursor-pointer border-0 bg-transparent p-0 text-start disabled:cursor-default disabled:opacity-40 ${LID_FOCUS_RING}`

/** 칩 켜짐 그림자(로망 `shadow-sh-chip`) — 값 토큰 재사용 */
export const CHIP_SHADOW = "[box-shadow:0_2px_6px_-2px_var(--t-ai-tag-drop)]"
