import * as React from "react"

import { cn } from "@/shared/lib/utils"
import { partAttrs } from "../part-attrs"

// 시안 `.picon` 의 부품판. `src` 는 받은 그대로 그린다 — 경로를 붙이거나 바꾸지 않는다
// (docs/pattern-data-model.md §3: 표시 컴포넌트 안에서 재변환 금지, 소비 측이 hydrate 해서 넘긴다).
export type PatternIconSize = "sm" | "md" | "lg"

const SIZE_CLASS: Record<PatternIconSize, string> = {
  sm: "size-[28px]",
  md: "size-[36px]",
  lg: "size-[48px]",
}

export interface PatternIconProps extends Omit<React.ComponentProps<"span">, "children"> {
  /** 문양 이름(대체글 · 툴팁) */
  name: string
  /** 이미지 경로(그대로 사용) */
  src: string
  size?: PatternIconSize
  /** 필수 문양 — 「필수」 표시 */
  essential?: boolean
  /** 같은 문양 개수 표시 */
  count?: number
  /** 고름(`sel`, 파란 테) */
  selected?: boolean
  /** AI 제안(`ai`, 청록 테) */
  ai?: boolean
  /** 시안 위치 식별자(`data-part-id`) */
  partId?: string
}

export function PatternIcon({
  name,
  src,
  size = "md",
  essential = false,
  count,
  selected = false,
  ai = false,
  partId,
  className,
  title,
  ...props
}: PatternIconProps) {
  return (
    <span
      {...partAttrs("PatternIcon", { variant: size, state: selected ? "sel" : ai ? "ai" : undefined, id: partId })}
      title={title ?? name}
      className={cn(
        // 시안 바탕 #f3f5f8(밝은 종이색)은 토큰이 없어 가장 가까운 white 를 쓴다
        "relative inline-grid place-items-center rounded-[6px] border border-solid border-line-3 bg-white",
        SIZE_CLASS[size],
        selected && "outline-2 outline-offset-1 outline-brand",
        ai && !selected && "outline-2 outline-offset-1 outline-ai",
        className
      )}
      {...props}
    >
      <img src={src} alt={name} loading="lazy" className="size-full overflow-hidden rounded-[5px] object-contain" />
      {essential ? (
        <span className="absolute -top-[5px] -left-[5px] rounded-[3px] border border-solid border-danger-line bg-danger-bg px-[3px] text-[9px] leading-[12px] text-danger-fg">
          필수
        </span>
      ) : null}
      {count !== undefined ? (
        <span className="absolute -right-[5px] -bottom-[5px] min-w-[14px] rounded-[7px] border border-solid border-brand-line bg-brand-bg px-[3px] text-center font-code text-[9px] leading-[12px] text-brand">
          {count}
        </span>
      ) : null}
    </span>
  )
}
