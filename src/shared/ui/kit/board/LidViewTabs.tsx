import type { ComponentPropsWithRef } from "react"

import { cn } from "@/shared/lib/utils"
import { partAttrs } from "../../part-attrs"
import { BOARD_BUTTON, BOARD_TRANSITION, CHIP_SHADOW } from "./board-classes"

// r4 로망 이식(`LidViewTabs` · `LidViewTab`): 뚜껑 맨 앞 보기 탭 묶음. 켜진 탭 = 종이색 바탕 · brand-3 글자.
export interface LidViewTabsProps extends ComponentPropsWithRef<"div"> {
  /** 위치 식별자(`data-part-id`) */
  partId?: string
}

export function LidViewTabs({ partId, className, ...props }: LidViewTabsProps) {
  return (
    <div
      role="group"
      {...props}
      {...partAttrs("LidViewTabs", { id: partId })}
      data-slot="lid-view-tabs"
      className={cn(
        "flex flex-none flex-nowrap gap-[3px] rounded-[10px] p-0.5 text-start text-[12px] font-bold leading-[1.5] text-paper inset-ring inset-ring-paper/55",
        className
      )}
    />
  )
}

export interface LidViewTabProps extends ComponentPropsWithRef<"button"> {
  active: boolean
  /** 고르지 않은 탭에 전환 효과 */
  animate?: boolean
  /** 메뉴를 여는 탭 안에 ▾ 표시 */
  menu?: boolean
  /** 위치 식별자(`data-part-id`) */
  partId?: string
}

export function LidViewTab({ active, animate = false, menu = false, partId, className, children, ...props }: LidViewTabProps) {
  return (
    <button
      type="button"
      {...props}
      {...partAttrs("LidViewTab", { state: active ? "on" : undefined, id: partId })}
      data-slot="lid-view-tab"
      data-state={active ? "on" : "off"}
      aria-pressed={active}
      className={cn(
        BOARD_BUTTON,
        animate && BOARD_TRANSITION,
        "box-border flex h-7 items-center gap-1.5 rounded-[8px] px-3 text-[13px] font-bold leading-[1.5] whitespace-nowrap enabled:active:[transform:translateY(1px)] [&_b]:text-[11.5px] [&_b]:font-bold [&_b]:tabular-nums",
        active
          ? cn("bg-paper text-brand-3 [&_b]:text-brand-3 [&_b]:opacity-100", CHIP_SHADOW)
          : "bg-paper/16 text-paper hover:bg-paper/28 [&_b]:opacity-[0.72]",
        className
      )}
    >
      {children}
      {menu && (
        <i
          data-slot="lid-view-tab-caret"
          aria-hidden="true"
          className="-mr-[5px] inline-grid size-[18px] place-items-center rounded-[7px] bg-strip text-[10px] not-italic text-fg-2"
        >
          ▾
        </i>
      )}
    </button>
  )
}
