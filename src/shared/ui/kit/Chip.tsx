import * as React from "react"

import { cn } from "@/shared/lib/utils"
import { partAttrs } from "../part-attrs"

// 시안 `.chip` 의 부품판. 변형 이름은 시안 S01 · S02 의 `data-part-variant` 값 그대로다
// (색 + 높이/글자 크기 조합이 달라도 서로 다른 변형으로 보존한다 — 설계서 §14-2).
export type ChipVariant =
  | "default"
  | "blue"
  | "violet-h20"
  | "green-h18"
  | "h18"
  | "amber"
  | "amber-h18"
  | "amber-h19"
  | "h19"
  | "blue-h20"
  | "h20-warn"
  | "blue-mono-h20"
  | "h22"

const BASE =
  "inline-flex items-center gap-[5px] rounded-[999px] border border-solid whitespace-nowrap h-[22px] px-[8px] text-[11.5px]"

// 색 묶음(시안 .chip 의 색 클래스)
const TONE = {
  plain: "bg-panel-2 border-line-3 text-fg-2",
  blue: "bg-brand-bg border-brand-line text-brand",
  violet: "bg-violet-bg border-violet-line text-violet",
  green: "bg-ok-bg border-ok-line text-ok-fg",
  amber: "bg-warn-bg border-warn-line text-warn",
} as const

const VARIANT_CLASS: Record<ChipVariant, string> = {
  default: TONE.plain,
  blue: TONE.blue,
  "violet-h20": cn(TONE.violet, "h-[20px] px-[6px]"),
  "green-h18": cn(TONE.green, "h-[18px] px-[6px] text-[10px]"),
  h18: cn(TONE.plain, "h-[18px] px-[6px] text-[10px]"),
  amber: TONE.amber,
  "amber-h18": cn(TONE.amber, "h-[18px] px-[6px] text-[10.5px]"),
  "amber-h19": cn(TONE.amber, "h-[19px] text-[10px]"),
  h19: cn(TONE.plain, "h-[19px] text-[10px]"),
  "blue-h20": cn(TONE.blue, "h-[20px]"),
  // 바탕은 기본 칩 그대로, 글자·테두리만 경고색(시안 인라인 덧씌움)
  "h20-warn": "bg-panel-2 border-warn-line text-warn h-[20px]",
  "blue-mono-h20": cn(TONE.blue, "h-[20px] font-code font-semibold"),
  h22: cn(TONE.plain, "h-[22px]"),
}

export interface ChipProps extends React.ComponentProps<"span"> {
  variant?: ChipVariant
  /** 선택됨: `data-part-state="on"` */
  on?: boolean
  /** 시안 위치 식별자(`data-part-id`) */
  partId?: string
}

export function Chip({ variant = "default", on = false, partId, className, ...props }: ChipProps) {
  return (
    <span
      {...partAttrs("Chip", {
        variant: variant === "default" ? undefined : variant,
        state: on ? "on" : undefined,
        id: partId,
      })}
      className={cn(BASE, VARIANT_CLASS[variant], className)}
      {...props}
    />
  )
}
