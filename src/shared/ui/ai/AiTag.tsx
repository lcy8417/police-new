import * as React from "react"

import { cn } from "@/shared/lib/utils"
import { partAttrs } from "../part-attrs"

// 시안 `.ai-tag` 의 부품판. 변형 이름은 시안 S01 · S02 의 `data-part-variant` 값 그대로다.
// - default: 기본(높이 17 · 안쪽 6 · 글자 9.5) — S02 「AI 제안」
// - progress: 표 안 작은 표식(높이 15 · 안쪽 4 · 글자 9 · 짙은 배경 · 그림자) + 맥박 점 — S01 「7/12」
// - done: progress 와 같은 크기 · 배경, 그림자 없음 — S01 「AI✓」
// (시안 `.ai-mark` 는 S01 · S02 에 쓰인 자리가 없어 아직 변형으로 두지 않았다.)
export type AiTagVariant = "default" | "progress" | "done"

const BASE =
  "inline-flex items-center gap-[4px] whitespace-nowrap rounded-[999px] border border-solid border-ai-line " +
  "font-code font-semibold text-ai"

const VARIANT_CLASS: Record<AiTagVariant, string> = {
  default: "h-[17px] px-[6px] text-[9.5px] tracking-[0.04em] bg-ai-bg",
  progress:
    "h-[15px] px-[4px] text-[9px] tracking-[0.04em] bg-ai-bg-deep [box-shadow:0_2px_6px_0_var(--t-ai-tag-drop)]",
  done: "h-[15px] px-[4px] text-[9px] tracking-[0.04em] bg-ai-bg-deep",
}

export interface AiTagProps extends Omit<React.ComponentProps<"span">, "children"> {
  variant?: AiTagVariant
  /** 글자. 없으면 default 는 「AI」, done 은 「AI✓」 */
  children?: React.ReactNode
  /** 시안 위치 식별자(`data-part-id`) */
  partId?: string
}

export function AiTag({ variant = "default", children, partId, className, ...props }: AiTagProps) {
  const text = children ?? (variant === "done" ? "AI✓" : "AI")
  return (
    <span
      {...partAttrs("AiTag", { variant, id: partId })}
      // leading 은 글자 크기 뒤에 둔다(tailwind-merge 가 font-size 뒤따르는 leading 만 남기고 앞의 leading 은 지운다)
      className={cn(BASE, VARIANT_CLASS[variant], "leading-[normal]", className)}
      {...props}
    >
      {variant === "progress" && (
        <span
          aria-hidden="true"
          className="inline-block size-[5px] rounded-[50%] border-none bg-ai motion-safe:animate-ai-pulse"
        />
      )}
      {text}
    </span>
  )
}
