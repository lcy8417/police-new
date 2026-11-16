import { cn } from "@/shared/lib/utils"
import { partAttrs } from "../part-attrs"

// 시안 `.avatar`: 28×28 원, 이니셜 한 글자(12px 600). 이름은 가려진 값(`박○○`)이 오므로 첫 글자만 쓴다.
export type AvatarTone = "blue" | "teal" | "violet" | "amber"

const TONE_CLASS: Record<AvatarTone, string> = {
  blue: "bg-brand-bg text-brand",
  teal: "bg-ai-bg text-ai",
  violet: "bg-violet-bg text-violet",
  amber: "bg-warn-bg text-warn",
}

export interface AvatarProps {
  name: string
  /** 역할색. 없으면 기본(panel-3 · fg-2) */
  tone?: AvatarTone
  /** 시안 위치 식별자(`data-part-id`) */
  partId?: string
  className?: string
}

export function Avatar({ name, tone, partId, className }: AvatarProps) {
  const initial = Array.from(name.trim())[0] ?? ""
  return (
    <span
      {...partAttrs("Avatar", { variant: tone, id: partId })}
      role="img"
      aria-label={name}
      className={cn(
        "inline-grid place-items-center size-[28px] shrink-0 rounded-[50%] text-[12px] font-semibold",
        tone ? TONE_CLASS[tone] : "bg-panel-3 text-fg-2",
        className
      )}
    >
      {initial}
    </span>
  )
}
