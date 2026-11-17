import * as React from "react"

import { cn } from "@/shared/lib/utils"
import { partAttrs } from "../part-attrs"

// 시안 `M.sole` 을 쓰는 작은 밑창 그림(S01 목록 26×38 · 30×44 등)의 부품판. 누르면 고르는 버튼이다.
// 표시 크기를 재서 좌표를 보내는 캔버스 화면에는 쓰지 않는다(layout.md).
export type SoleThumbSize = "sm" | "md" | "lg"

const SIZE_CLASS: Record<SoleThumbSize, string> = {
  sm: "h-[38px] w-[26px]",
  md: "h-[44px] w-[30px]",
  lg: "h-[56px] w-[38px]",
}

export interface SoleThumbProps extends Omit<React.ComponentProps<"button">, "children" | "type"> {
  src: string
  alt: string
  size?: SoleThumbSize
  /** 고름(파란 테) — `aria-pressed` */
  selected?: boolean
  /** 시안 위치 식별자(`data-part-id`) */
  partId?: string
}

export function SoleThumb({ src, alt, size = "md", selected = false, partId, className, ...props }: SoleThumbProps) {
  return (
    <button
      type="button"
      aria-label={alt}
      aria-pressed={selected}
      {...partAttrs("SoleThumb", { variant: size, state: selected ? "on" : undefined, id: partId })}
      className={cn(
        "relative flex-none cursor-pointer overflow-hidden rounded-[5px] border border-solid border-border bg-canvas p-0",
        SIZE_CLASS[size],
        selected && "outline-2 outline-offset-1 outline-brand",
        className
      )}
      {...props}
    >
      {/* 볼 권한이 없거나 그림이 없으면 src 가 빈 글자 — 빈 src 는 페이지를 다시 받으려 하고 React 가 경고하므로 그리지 않는다 */}
      {src ? <img src={src} alt={alt} className="block size-full object-contain" /> : null}
    </button>
  )
}
