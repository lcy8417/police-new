import * as React from "react"
import { Slot } from "radix-ui"

import { cn } from "@/shared/lib/utils"
import { partAttrs } from "../part-attrs"

// 시안 `.btn` 의 부품판(docs/mockups/scas-redesign/assets/mockup.css). 기존 shadcn `../button.tsx` 와는 별개 파일이다.
// 변형은 시안 클래스 `pri · ai · ok · warn · danger · ghost`, 크기는 `.sm`, 잠김은 `.locked`.

export type ButtonVariant = "default" | "pri" | "ai" | "ok" | "warn" | "danger" | "ghost"
// 크기: 시안 `.btn`(md) · `.btn.sm` 과 높이만 다른 `sm-h26` · `sm-h22`(설계서 §14-2: 작은 차이도 변형으로 보존)
export type ButtonSize = "md" | "sm" | "sm-h26" | "sm-h22"

const BASE =
  "inline-flex items-center gap-[6px] border border-solid whitespace-nowrap cursor-pointer"

const SIZE_CLASS: Record<ButtonSize, string> = {
  md: "h-[30px] px-[12px] rounded-[8px] text-[12.5px]",
  sm: "h-[24px] px-[8px] rounded-[6px] text-[11.5px]",
  "sm-h26": "h-[26px] px-[8px] rounded-[6px] text-[11.5px]",
  "sm-h22": "h-[22px] px-[8px] rounded-[6px] text-[11.5px]",
}

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  default: "bg-panel-2 border-line-3 text-fg-2",
  pri: "bg-brand-3 border-brand-3 text-white [box-shadow:0_0_18px_0_var(--t-brand-glow)]",
  ai: "bg-ai-bg border-ai-line text-ai",
  ok: "bg-ok-bg border-ok-line text-ok-fg",
  warn: "bg-warn-bg border-warn-line text-warn",
  danger: "bg-danger-bg border-danger-line text-danger-fg",
  ghost: "bg-transparent border-transparent text-muted-foreground",
}

export interface ButtonProps extends React.ComponentProps<"button"> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** 잠김: 비활성 + `data-part-state="locked"` */
  locked?: boolean
  /** 자식 요소(예: `<a>`)에 버튼 모양과 표식을 입힌다 */
  asChild?: boolean
  /** 표 행 안 버튼: 좌우 패딩 6px, 변형 이름 끝에 `-row` */
  row?: boolean
  /** 보는 사람 역할에 따라 잠기는 버튼(`data-part-state="role-lock"`). 이 시점에선 잠기지 않은 모양 그대로 */
  roleLock?: boolean
  /** 시안 위치 식별자(`data-part-id`) */
  partId?: string
}

// 표식 변형 이름: 크기(md 는 생략) + 기본이 아닌 변형 + 행이면 `row` → "sm" · "sm-h26" · "sm-pri" · "sm-ok-row" · "pri".
function variantName(variant: ButtonVariant, size: ButtonSize, row: boolean): string | undefined {
  const parts = [
    size === "md" ? "" : size,
    variant === "default" ? "" : variant,
    row ? "row" : "",
  ].filter(Boolean)
  return parts.length ? parts.join("-") : undefined
}

export function Button({
  variant = "default",
  size = "md",
  locked = false,
  asChild = false,
  row = false,
  roleLock = false,
  partId,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button"
  return (
    <Comp
      {...partAttrs("Button", {
        variant: variantName(variant, size, row),
        state: locked ? "locked" : roleLock ? "role-lock" : undefined,
        id: partId,
      })}
      disabled={disabled || locked}
      className={cn(
        BASE,
        SIZE_CLASS[size],
        row && "px-[6px]",
        VARIANT_CLASS[variant],
        (locked || disabled) && "opacity-35 cursor-not-allowed",
        className,
      )}
      {...props}
    />
  )
}
