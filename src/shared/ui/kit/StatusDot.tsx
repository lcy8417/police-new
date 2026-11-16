import { cn } from "@/shared/lib/utils"
import { partAttrs } from "../part-attrs"

// 시안 `.dot`(7×7 원 · currentColor · 빛 0 0 6px)에 글자를 붙인 부품. 색만으로 구분하지 않는다(SKILL 「원칙」).
export type StatusDotTone = "ok" | "warn" | "danger" | "off"

const TONE_CLASS: Record<StatusDotTone, string> = {
  ok: "text-ok",
  warn: "text-warn",
  danger: "text-danger",
  off: "text-faint",
}

export interface StatusDotProps {
  tone: StatusDotTone
  label: string
  /** 시안 위치 식별자(`data-part-id`) */
  partId?: string
  className?: string
}

export function StatusDot({ tone, label, partId, className }: StatusDotProps) {
  return (
    <span
      {...partAttrs("StatusDot", { variant: tone, id: partId })}
      className={cn("inline-flex items-center gap-[6px] text-[12px]", TONE_CLASS[tone], className)}
    >
      <span
        aria-hidden="true"
        className="size-[7px] rounded-full bg-current [box-shadow:0_0_6px_currentColor]"
      />
      <span className="text-fg-2">{label}</span>
    </span>
  )
}
