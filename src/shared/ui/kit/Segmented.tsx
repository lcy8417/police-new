import * as React from "react"

import { cn } from "@/shared/lib/utils"
import { partAttrs } from "../part-attrs"

// 시안 `.seg` 의 부품판. 눌린 칸은 `aria-pressed="true"`(시안 선택자 그대로).
// `scas` 는 시안 `.is-scas` — SCAS 화면 모양을 재현하는 자리의 눌림 색(밝은 바탕).
// 시안 값 #e9ecf3 · #1f2a5a 은 토큰이 없어 가장 가까운 fg · panel 로 대신한다(노트 「토큰 빈틈」).
export interface SegmentedItem {
  value: string
  label: React.ReactNode
}

export interface SegmentedProps {
  items: SegmentedItem[]
  value: string
  onValueChange: (value: string) => void
  /** SCAS 모양 눌림 색(`data-part-variant="scas"`) */
  scas?: boolean
  /** 접근성 이름 */
  "aria-label"?: string
  /** 시안 위치 식별자(`data-part-id`) */
  partId?: string
  className?: string
}

export function Segmented({
  items,
  value,
  onValueChange,
  scas = false,
  partId,
  className,
  "aria-label": ariaLabel,
}: SegmentedProps) {
  return (
    <div
      {...partAttrs("Segmented", { variant: scas ? "scas" : undefined, id: partId })}
      role="group"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex gap-[2px] p-[3px] border border-solid border-border rounded-[8px] bg-background",
        className
      )}
    >
      {items.map((item) => {
        const pressed = item.value === value
        return (
          <button
            key={item.value}
            type="button"
            aria-pressed={pressed}
            onClick={() => onValueChange(item.value)}
            className={cn(
              "border-0 bg-transparent cursor-pointer px-[12px] py-[5px] rounded-[6px] text-[12.5px] whitespace-nowrap text-muted-foreground",
              pressed &&
                (scas
                  ? "bg-fg text-panel"
                  : "bg-brand-bg text-foreground [box-shadow:inset_0_0_0_1px_var(--t-brand-line)]")
            )}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
