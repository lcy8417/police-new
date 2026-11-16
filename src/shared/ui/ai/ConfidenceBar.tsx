import * as React from "react"

import { cn } from "@/shared/lib/utils"
import { partAttrs } from "../part-attrs"
import { FX_BAR_FILL, FX_BAR_TRACK, clampRatio } from "./fx-bar"

// 확신도 · 유사도 막대(시안 S04 · S05 · S06 · S10 의 `.fx-bar` + 숫자). 값 척도는 호출하는 쪽이 정한다 —
// "percent" 는 0~100(예 69.99 → 「70%」), "unit" 은 0~1(예 0.97 → 「0.97」). 1 이하 값을 퍼센트로 추측해 바꾸지 않는다.
// threshold 는 value 와 같은 척도. 미만이면 주황(`data-part-state="low"`) — 색만으로 구분하지 않도록 숫자도 같이 보인다.
export type ConfidenceScale = "unit" | "percent"

export interface ConfidenceBarProps extends Omit<React.ComponentProps<"div">, "children"> {
  value: number
  scale: ConfidenceScale
  threshold?: number
  /** 접근 이름(예: 「AI 확신도」) */
  label?: string
  /** 시안 위치 식별자(`data-part-id`) */
  partId?: string
}

export function ConfidenceBar({
  value,
  scale,
  threshold,
  label,
  partId,
  className,
  ...props
}: ConfidenceBarProps) {
  const ratio = clampRatio(scale === "percent" ? value / 100 : value)
  const low = threshold !== undefined && value < threshold
  const state = threshold === undefined ? undefined : low ? "low" : "ok"
  const text = scale === "percent" ? `${Math.round(value)}%` : value.toFixed(2)
  return (
    <div
      {...partAttrs("ConfidenceBar", { variant: scale, state, id: partId })}
      className={cn("flex w-full items-center gap-[4px]", className)}
      {...props}
    >
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(ratio * 100)}
        className={cn(FX_BAR_TRACK, "h-[3px] flex-1")}
      >
        <i
          aria-hidden="true"
          className={cn(FX_BAR_FILL, low && "bg-none bg-warn")}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
      <span
        className={cn(
          "font-code text-[9.5px] leading-[normal]",
          low ? "text-warn" : "text-muted-foreground",
        )}
      >
        {text}
      </span>
    </div>
  )
}
