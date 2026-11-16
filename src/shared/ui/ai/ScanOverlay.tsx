import * as React from "react"

import { cn } from "@/shared/lib/utils"
import { partAttrs } from "../part-attrs"

// 시안 `.fx-scan`: 사진 위를 위에서 아래로 훑는 가로 선(2px · ai 색 · 번짐). 부모가 `relative` 여야 한다.
// 멈춘 모양(= 움직임 줄이기)은 `top: 100%` · 불투명도 0 = 안 보임(motion.md). 움직임은 `motion-safe:animate-fx-scan`
// (키프레임 fx-scan 3.2s ease-in-out 무한 — src/index.css 에 들어오면 켜진다). 순수 장식이라 좌표 판정을 막지 않는다.
export interface ScanOverlayProps extends Omit<React.ComponentProps<"span">, "children"> {
  active: boolean
  /** 시안 위치 식별자(`data-part-id`) */
  partId?: string
}

export function ScanOverlay({ active, partId, className, ...props }: ScanOverlayProps) {
  if (!active) return null
  return (
    <span
      {...partAttrs("ScanOverlay", { id: partId })}
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-x-0 top-full h-[2px] bg-ai opacity-0",
        "shadow-[0_0_12px_3px_var(--t-ai-pulse)] motion-safe:animate-fx-scan",
        className,
      )}
      {...props}
    />
  )
}
