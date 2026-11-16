// r4 로망 이식(`shared/ui/panel/stage/StateBox.tsx` · `panel/types.ts`): 창 안 단계 띠 · 할 일 상자의 상태 색 표.
// 모양은 원본 그대로, 색만 경찰 토큰으로 대응:
//   먹 2 채움(아직) → `bg-[var(--t-emblem-to)]`(창 머리와 같은 어두운 칸) · 흰 글자 → paper
//   진분홍 채움(문제) → danger · 연회색 칩(끝) → panel-3 · 회색 글자 → muted-foreground · 분홍 동그라미 → brand-bg
//   지금 할 칸(로망 SEQ_NOW 진분홍) → brand-3 채움
// 부품은 판정을 모른다 — 상태 이름만 받는다. (컴포넌트 파일과 나눈 까닭: 빠른 새로 고침은 컴포넌트만 내보내는 파일에서 동작)

/** [UI] 창 부품이 받는 상태 이름(로망 PanelState 와 같은 글자) */
export type PanelState =
  | "done" // 끝 — 연한 칸 · 투명도 .55, 번호 대신 ✓
  | "pending" // 아직 — 어두운 채움 · 밝은 글자
  | "problem" // 문제 — 위험 색 채움
  | "notApplicable" // 해당 없음 — 점선 테 · 번호 대신 –
  | "unavailable" // 확인 못 함 — 회색
  | "noSource" // 출처 없음 — 어두운 칸 · 흐린 글자

/** 칸 색 — 아직 어두운 채움 · 문제 위험 채움 · 끝 연한 칸 .55 · 해당 없음 점선 · 확인 못 함 회색 · 출처 없음 어두운 칸 */
export const STATE_BOX: Record<PanelState, string> = {
  pending: "bg-[var(--t-emblem-to)] text-paper",
  problem: "bg-danger text-paper",
  done: "bg-panel-3 text-muted-foreground opacity-55",
  notApplicable: "bg-transparent text-faint outline-1 -outline-offset-1 outline-dashed outline-line-3",
  unavailable: "bg-strip text-faint",
  noSource: "bg-[var(--t-emblem-to)] text-paper/70",
}

/** 지금 할 칸 채움(로망 「지금 = 진분홍 네모」 → 경찰 brand-3). 상태(data)는 그대로 두어 문제로 세지 않는다 */
export const NOW_BOX = "bg-brand-3 text-paper"

/**
 * 보고 있는 칸 · 지금 칸 바깥 테 — 로망 PROGRESS_NOW(2px · 2px 띄움)의 「움직임 줄이기」 모양으로 멈춘 것.
 * 경찰 정본은 「움직이는 효과는 AI 가 실제로 일하는 자리에만」이라 깜빡이지 않는다.
 */
export const NOW_RING = "outline-2 outline-solid outline-offset-2 outline-brand opacity-100"

/** 번호 동그라미 색 — 아직 연한 강조 · 문제 흰 바탕 위험 글자 · 끝 어두운 바탕 ✓ · 해당 없음 연회색 – · 지금 흰 바탕 강조 글자 */
export const NUM_TONE: Record<PanelState | "now", string> = {
  pending: "bg-brand-bg text-brand-3",
  problem: "bg-panel text-danger",
  done: "bg-[var(--t-emblem-to)] text-paper",
  notApplicable: "bg-panel-3 text-faint",
  unavailable: "bg-paper/14 text-faint",
  noSource: "bg-paper/22 text-paper/70",
  now: "bg-panel text-brand-3",
}
