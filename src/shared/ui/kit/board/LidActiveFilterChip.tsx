import type { ComponentPropsWithRef } from "react"

import { cn } from "@/shared/lib/utils"
import { partAttrs } from "../../part-attrs"
import { BOARD_BUTTON, BOARD_TRANSITION } from "./board-classes"

// r4 로망 이식(`LidActiveFilterChip`): 켜진 조건 하나 + 오른쪽 ✕ 동그라미. 누르면 그 조건을 푼다.
// 로망 연분홍 동그라미(`bg-state-pink-tint`) → 경찰 `bg-brand-bg`.
export interface LidActiveFilterChipProps extends ComponentPropsWithRef<"button"> {
  /** 위치 식별자(`data-part-id`) */
  partId?: string
}

export function LidActiveFilterChip({ partId, className, children, ...props }: LidActiveFilterChipProps) {
  return (
    <button
      type="button"
      {...props}
      {...partAttrs("LidActiveFilterChip", { id: partId })}
      data-slot="lid-active-filter-chip"
      data-state="on"
      className={cn(
        BOARD_BUTTON,
        BOARD_TRANSITION,
        "inline-flex items-center gap-[7px] rounded-[7px] bg-paper py-[5px] pr-1.5 pl-[11px] text-[12px] font-bold text-brand-3",
        className
      )}
    >
      {children}
      <span aria-hidden="true" className="grid size-[18px] place-items-center rounded-[99px] bg-brand-bg text-[10px]">
        ✕
      </span>
    </button>
  )
}
