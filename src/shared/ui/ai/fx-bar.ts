// 시안 `.fx-bar` · `.fx-bar > i` 의 공통 클래스(AiProgress · ConfidenceBar 가 함께 쓴다).
// 움직임(fx-fill · fx-shimmer)은 `motion-safe:` 로만 건다 — 움직임 줄이기면 목표 폭 그라데이션이 최종 모양이다(motion.md).
// 키프레임이 src/index.css 에 들어오기 전에는 `animate-fx-*` 가 만들어지지 않아 멈춘 모양으로 보인다.
export const FX_BAR_TRACK = "relative h-[4px] overflow-hidden rounded-[3px] bg-border"

export const FX_BAR_FILL =
  "absolute inset-y-0 left-0 rounded-[3px] bg-linear-to-r from-brand-2 to-ai motion-safe:animate-fx-fill"

/** 0~1 로 자른다(NaN 은 0). */
export function clampRatio(r: number): number {
  if (!Number.isFinite(r)) return 0
  return Math.min(1, Math.max(0, r))
}
