import type { ComponentPropsWithRef } from "react"

import { cn } from "@/shared/lib/utils"
import { partAttrs } from "../../part-attrs"

// r4 로망 이식(`CountDot`): 놓치면 안 되는 수 동그라미. 로망 진분홍(`bg-cta`) → 경찰 `bg-brand-3` · 종이색 글자.
// 0 이하 · 모름(null)은 그리지 않는다(「0」 동그라미는 남은 일이 없다고 믿게 함). 100 이상은 「99+」.

/** 동그라미 안 글자. 그리지 않을 수면 null */
function formatCountDot(count: number | null): string | null {
  if (count === null || count <= 0) return null
  return count >= 100 ? "99+" : String(count)
}

export interface CountDotProps extends ComponentPropsWithRef<"span"> {
  count: number | null
  /** 고른 줄 위 — 종이색 2px 고리 */
  selected?: boolean
  /** 접힌 아이콘 줄 — 작은 동그라미 + 틀 바탕색 고리 */
  collapsed?: boolean
  /** 위치 식별자(`data-part-id`) */
  partId?: string
}

export function CountDot({ count, selected = false, collapsed = false, partId, className, ...props }: CountDotProps) {
  const label = formatCountDot(count)
  if (label === null) return null
  return (
    <span
      {...props}
      {...partAttrs("CountDot", { state: selected ? "on" : undefined, id: partId })}
      data-slot="count-dot"
      data-state={selected ? "on" : "off"}
      data-collapsed={collapsed}
      aria-hidden="true"
      className={cn(
        "box-border inline-grid shrink-0 place-items-center rounded-[99px] bg-brand-3 font-bold not-italic text-paper tabular-nums",
        collapsed ? "h-4 min-w-4 px-1 text-[9.5px] leading-[16px]" : "h-[18px] min-w-[18px] px-[5px] text-[11px] leading-none",
        selected ? "ring-2 ring-paper" : collapsed ? "ring-2 ring-[var(--t-emblem-to)]" : "ring-[1.5px] ring-paper",
        className
      )}
    >
      {label}
    </span>
  )
}
