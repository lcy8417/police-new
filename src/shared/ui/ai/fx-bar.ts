// 시안 `.fx-bar` · `.fx-bar > i` 의 공통 클래스(AiProgress · ConfidenceBar 가 함께 쓴다).
// 움직임(fx-fill · fx-shimmer)은 `motion-safe:` 로만 건다 — 움직임 줄이기면 목표 폭 그라데이션이 최종 모양이다(motion.md).
// 키프레임이 src/index.css 에 들어오기 전에는 `animate-fx-*` 가 만들어지지 않아 멈춘 모양으로 보인다.
export const FX_BAR_TRACK = "relative h-[4px] overflow-hidden rounded-[3px] bg-border"

export const FX_BAR_FILL = "absolute inset-y-0 left-0 rounded-[3px] bg-[linear-gradient(90deg,var(--t-brand-2),var(--t-ai))]"

/** 채움이 차오르는 움직임(1회). 반짝이는 막대(running)는 FX_BAR_RUN 이 채움 + 반짝임을 한 번에 건다. */
export const FX_BAR_FILL_MOTION = "motion-safe:animate-fx-fill"

/** 시안 `.fx-bar.run > i`: 가운데 밝은 띠가 있는 200% 그라데이션 + 채움·반짝임 동시 움직임(animation 속성이 하나라 한 클래스로 묶음). */
export const FX_BAR_RUN =
  "bg-[linear-gradient(90deg,var(--t-brand-2),var(--t-ai)_40%,var(--t-ai-shine)_50%,var(--t-ai)_60%,var(--t-brand-2))] bg-[length:200%_100%] motion-safe:animate-fx-run"

/** 0~1 로 자른다(NaN 은 0). */
export function clampRatio(r: number): number {
  if (!Number.isFinite(r)) return 0
  return Math.min(1, Math.max(0, r))
}
