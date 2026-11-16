import * as React from "react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { partAttrs } from "../part-attrs"

// 작업판 단추(11/17 사용자 「취소 확인 저장 이런 버튼이 너무 아카데믹함」 → 사건 창 이미지 편집 탭에서 처음 그린 편집 도구식 단추를 부품으로 뽑음).
// 어두운 작업판(`data-theme="dark"`) 위에서도 밝은 바탕에서도 토큰만으로 그린다 — 새 색 없음.
//   ghost   = 글자만(취소 · 닫기처럼 물러나는 동작)
//   soft    = 옅은 판 + 1px 테(확인 · 되돌리기 · 다시 불러오기처럼 보조 동작)
//   primary = 채움 + 그림자(저장 · 검색처럼 그 판의 주 동작 하나)
// `aria-pressed` 를 주면 켜고 끄는 도구 단추가 되고, 켜진 동안 옅은 brand 판 + 1px brand 테(옆 줄 없음 — 도구 타일과 같은 결).

export type WorkbenchButtonVariant = "ghost" | "soft" | "primary"
/** md = 높이 28(작업판 막대 기본) · sm = 높이 24(칸 안 좁은 줄) */
export type WorkbenchButtonSize = "md" | "sm"

const BASE =
  "inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap border border-solid font-semibold transition-colors duration-150 motion-reduce:transition-none disabled:cursor-default disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-1 focus-visible:outline-brand"

const SIZE_CLASS: Record<WorkbenchButtonSize, { box: string; icon: string; only: string }> = {
  md: { box: "h-[28px] gap-[6px] rounded-[8px] px-[11px] text-[12px]", icon: "size-[14px]", only: "w-[28px] justify-center px-0" },
  sm: { box: "h-[24px] gap-[5px] rounded-[7px] px-[8px] text-[11.5px]", icon: "size-[13px]", only: "w-[24px] justify-center px-0" },
}

const VARIANT_CLASS: Record<WorkbenchButtonVariant, string> = {
  ghost: "border-transparent bg-transparent text-muted-foreground hover:bg-panel-3 hover:text-foreground",
  soft: "border-line-3 bg-panel-3 text-foreground hover:border-brand-line",
  primary: "border-brand-3 bg-brand-3 text-paper [box-shadow:0_2px_8px_var(--t-panel-drop)] hover:bg-brand-2",
}

/** 켜진 도구 단추(aria-pressed=true) */
const PRESSED = "border-brand-line bg-brand-bg text-foreground hover:bg-brand-bg"

export interface WorkbenchButtonProps extends React.ComponentProps<"button"> {
  variant?: WorkbenchButtonVariant
  size?: WorkbenchButtonSize
  /** 앞 아이콘(lucide 선 아이콘) — 읽지 않는다(aria-hidden) */
  icon?: LucideIcon
  /** 아이콘만(글자 없음) — 그러면 `aria-label` 이 꼭 있어야 한다 */
  iconOnly?: boolean
  /** 시안 위치 식별자(`data-part-id`) */
  partId?: string
}

/** [UI] 작업판 단추 — ghost · soft · primary, 아이콘 + 글자, 켜고 끄기(aria-pressed) */
export function WorkbenchButton({
  variant = "soft",
  size = "md",
  icon: Icon,
  iconOnly = false,
  partId,
  className,
  children,
  type = "button",
  ...props
}: WorkbenchButtonProps) {
  const pressed = props["aria-pressed"] === true || props["aria-pressed"] === "true"
  const s = SIZE_CLASS[size]
  return (
    <button
      type={type}
      {...partAttrs("WorkbenchButton", { variant: size === "md" ? variant : `${variant}-sm`, state: pressed ? "on" : undefined, id: partId })}
      className={cn(BASE, s.box, VARIANT_CLASS[variant], pressed && PRESSED, iconOnly && s.only, className)}
      {...props}
    >
      {Icon ? <Icon aria-hidden="true" className={cn(s.icon, pressed && "text-brand")} strokeWidth={2} /> : null}
      {children}
    </button>
  )
}
