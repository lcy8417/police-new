import * as React from "react"

import { cn } from "@/shared/lib/utils"
import { partAttrs } from "../part-attrs"

// 시안 `.fx-live`: 7px 점. busy 는 꽉 찬 점 + 맥박(ai-pulse = 시안 fx-pulse, `motion-safe:` 로만),
// idle 은 속이 빈 고리(맥박 없음). 색 · 맥박이 꺼진 움직임 줄이기에서도 모양(채움/빈 고리)과 글자로 구분된다.
// label 은 점 옆에 보이는 글자다. 이미 옆에 같은 뜻의 글자가 있는 화면만 `hideLabel` 로 숨긴다(접근 이름으로는 남음).
export type LiveDotState = "busy" | "idle"

export interface LiveDotProps extends Omit<React.ComponentProps<"span">, "children"> {
  state: LiveDotState
  label: string
  /** 옆에 같은 뜻의 글자가 이미 있을 때만 true(기본 false = 글자 보임) */
  hideLabel?: boolean
  /** 시안 위치 식별자(`data-part-id`) */
  partId?: string
}

export function LiveDot({ state, label, hideLabel = false, partId, className, ...props }: LiveDotProps) {
  return (
    <span
      {...partAttrs("LiveDot", { variant: state, id: partId })}
      title={label}
      className={cn("inline-flex items-center gap-[6px]", className)}
      {...props}
    >
      <span
        aria-hidden="true"
        data-live-dot=""
        className={cn(
          "inline-block size-[7px] shrink-0 rounded-[50%]",
          state === "busy"
            ? "bg-ai motion-safe:animate-ai-pulse"
            : "border border-solid border-dim bg-transparent",
        )}
      />
      <span className={cn("text-[11px] text-muted-foreground", hideLabel && "sr-only")}>{label}</span>
    </span>
  )
}
