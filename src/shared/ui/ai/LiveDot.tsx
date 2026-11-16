import * as React from "react"

import { cn } from "@/shared/lib/utils"
import { partAttrs } from "../part-attrs"

// 시안 `.fx-live`: 7px 점. busy 는 맥박(ai-pulse = 시안 fx-pulse, `motion-safe:` 로만), idle 은 맥박 없는 흐린 점.
// 멈춘 모양(움직임 줄이기)은 켜진 점 그대로. 점은 색만으로 구분하지 않도록 label 을 접근 이름 · 툴팁으로 단다 —
// 화면은 점 옆에 보이는 글자를 따로 둔다(시안 S01~ 에서 점은 항상 글자 곁에 놓인다).
export type LiveDotState = "busy" | "idle"

export interface LiveDotProps extends Omit<React.ComponentProps<"span">, "children"> {
  state: LiveDotState
  label: string
  /** 시안 위치 식별자(`data-part-id`) */
  partId?: string
}

export function LiveDot({ state, label, partId, className, ...props }: LiveDotProps) {
  return (
    <span
      {...partAttrs("LiveDot", { variant: state, id: partId })}
      title={label}
      className={cn(
        "relative inline-block size-[7px] rounded-[50%]",
        state === "busy" ? "bg-ai motion-safe:animate-ai-pulse" : "bg-dim",
        className,
      )}
      {...props}
    >
      <span className="sr-only">{label}</span>
    </span>
  )
}
