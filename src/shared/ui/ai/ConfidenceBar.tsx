import * as React from "react"

import { cn } from "@/shared/lib/utils"
import { partAttrs } from "../part-attrs"
import { FX_BAR_FILL, FX_BAR_FILL_MOTION, FX_BAR_TRACK, clampRatio } from "./fx-bar"

// 확신도 · 유사도 막대(시안 S04 · S05 · S06 · S10 의 `.fx-bar` + 숫자). 값 척도는 호출하는 쪽이 정한다 —
// "percent" 는 0~100(예 69.99 → 「70%」), "unit" 은 0~1(예 0.97 → 「0.97」). 1 이하 값을 퍼센트로 추측해 바꾸지 않는다.
// threshold 는 value 와 같은 척도. 미만이면 주황(`data-part-state="low"`). 숫자는 두 상태 모두 보이므로 색 구분의 대신이 못 된다 —
// 시안에는 낮음 표식이 따로 없어, 낮음일 때 막대의 읽는 값(aria-valuetext)에 「낮음」을 붙이고 툴팁(title)도 단다(보이는 표식이 필요하면 시안부터 바꿀 것).
// 표시 숫자는 막대와 같은 범위로 자르고, 숫자가 아니면 「—」.
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
  const valid = Number.isFinite(value)
  const ratio = clampRatio(scale === "percent" ? value / 100 : value)
  const low = valid && threshold !== undefined && value < threshold
  const state = threshold === undefined || !valid ? undefined : low ? "low" : "ok"
  // 막대와 같은 범위(0~1 / 0~100)로 잘라 보여 준다. 숫자가 아니면 「—」.
  const text = !valid ? "—" : scale === "percent" ? `${Math.round(ratio * 100)}%` : ratio.toFixed(2)
  return (
    <div
      {...partAttrs("ConfidenceBar", { variant: scale, state, id: partId })}
      title={low ? "낮음" : undefined}
      className={cn("flex w-full items-center gap-[4px]", className)}
      {...props}
    >
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={valid ? Math.round(ratio * 100) : undefined}
        aria-valuetext={low ? `${text} 낮음` : undefined}
        className={cn(FX_BAR_TRACK, "h-[3px] flex-1")}
      >
        <i
          aria-hidden="true"
          className={cn(FX_BAR_FILL, FX_BAR_FILL_MOTION, low && "bg-none bg-warn")}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
      <span
        className={cn(
          "font-code text-[9.5px]",
          low ? "text-warn" : "text-muted-foreground",
        )}
      >
        {text}
      </span>
    </div>
  )
}
