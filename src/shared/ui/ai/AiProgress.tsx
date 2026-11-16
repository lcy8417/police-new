import * as React from "react"

import { cn } from "@/shared/lib/utils"
import { partAttrs } from "../part-attrs"
import { FX_BAR_FILL, FX_BAR_FILL_MOTION, FX_BAR_RUN, FX_BAR_TRACK, clampRatio } from "./fx-bar"

// 시안 `.fx-bar` 의 부품판. 상태 이름이 곧 변형 이름이다.
// - running: 진행 중. 반짝임(`.run`)은 `motion-safe:animate-fx-shimmer` — 움직임 줄이기면 그라데이션 막대 그대로
// - done: 끝(value 없으면 100%)
// - failed: 실패. 막대는 위험색, 막대 옆에 글자 「실패」(색만으로 구분 금지)
export type AiProgressState = "running" | "done" | "failed"

export interface AiProgressProps extends Omit<React.ComponentProps<"div">, "children"> {
  state: AiProgressState
  /** 0~1. running 에서 없으면 폭을 모르는 진행(aria-valuenow 없음), done 은 1 */
  value?: number
  /** 접근 이름(예: 「이미지 확인」). failed 의 글자는 항상 「실패」 */
  label?: string
  /** 시안 위치 식별자(`data-part-id`) */
  partId?: string
}

export function AiProgress({ state, value, label, partId, className, ...props }: AiProgressProps) {
  const raw = state === "done" ? (value ?? 1) : value
  const ratio = raw === undefined ? undefined : clampRatio(raw)
  const attrs = partAttrs("AiProgress", { variant: state, id: partId })

  const barProps = {
    role: "progressbar" as const,
    "aria-label": label,
    "aria-valuemin": 0,
    "aria-valuemax": 100,
    "aria-valuenow": ratio === undefined ? undefined : Math.round(ratio * 100),
  }
  const fill = (
    <i
      aria-hidden="true"
      className={cn(
        FX_BAR_FILL,
        state === "running" ? FX_BAR_RUN : FX_BAR_FILL_MOTION,
        state === "failed" && "bg-none bg-danger",
      )}
      style={{ width: ratio === undefined ? "100%" : `${ratio * 100}%` }}
    />
  )

  if (state === "failed") {
    return (
      <div {...attrs} className={cn("flex items-center gap-[6px]", className)} {...props}>
        <div {...barProps} className={cn(FX_BAR_TRACK, "flex-1")}>
          {fill}
        </div>
        <span className="text-[11px] font-semibold text-danger-fg">실패</span>
      </div>
    )
  }
  return (
    <div {...attrs} {...barProps} className={cn(FX_BAR_TRACK, className)} {...props}>
      {fill}
    </div>
  )
}
