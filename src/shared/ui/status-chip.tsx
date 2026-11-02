import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/shared/lib/utils"

/**
 * 상태 칩 색 — 과학수사 팔레트 고정 의미:
 * `blue` 관리자·선택 / `teal` 성공·사용 / `amber` 권한 없음·잠금 / `red` 실패 / `gray` 중지·보조.
 */
export type StatusChipTone = "blue" | "teal" | "amber" | "red" | "gray"

const TONE_CLASS: Record<StatusChipTone, string> = {
  blue: "border-[#3B82F6]/40 bg-[#152238] text-[#4A9EFF]",
  teal: "border-[#2DD4BF]/35 bg-[#0E2A2A] text-[#2DD4BF]",
  amber: "border-[#F59E0B]/40 bg-[#2A1E0A] text-[#F59E0B]",
  red: "border-[#EF4444]/40 bg-[#2A1215] text-[#EF4444]",
  gray: "border-[#26334A] bg-[#111A28] text-[#8A93A6]",
}

export interface StatusChipProps {
  tone: StatusChipTone
  children: ReactNode
  /** 글자 앞 작은 아이콘(실패 경고 등). */
  icon?: LucideIcon
  className?: string
}

/** 알약 모양의 작은 상태 칩(사용자 구분·계정 상태·기능 기록 결과 등). */
export function StatusChip({ tone, children, icon: Icon, className }: StatusChipProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-px text-[11px] leading-[18px] font-semibold tracking-wide whitespace-nowrap",
        TONE_CLASS[tone],
        className
      )}
    >
      {Icon && <Icon className="size-3" aria-hidden="true" />}
      {children}
    </span>
  )
}
