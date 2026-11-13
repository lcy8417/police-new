import * as React from "react"

import { cn } from "@/shared/lib/utils"
import { partAttrs } from "../part-attrs"

// 시안 `.panel`(+ `.tc` 모서리 장식, `.panel-h` 머리)의 부품판. 변형 이름은 시안 S01 · S02 의 `data-part-variant` 값 그대로다.
// - default: 기본 패널
// - tc: 왼쪽 위 · 오른쪽 아래 모서리 장식(시안 `.panel.tc`)
// - default-pad: 안쪽 여백 50px 14px 0 (시안 S02 의 틀 자리)
// 높이 · 바깥 여백은 배치라서 변형이 아니다(쓰는 쪽 부모가 정한다). 머리 아래 내용은 쓰는 쪽이 그대로 넣는다(시안에 .panel-b 쓰임 없음).
export type PanelVariant = "default" | "tc" | "default-pad"

// 모서리 장식(::before 왼쪽 위 · ::after 오른쪽 아래). 선 색은 brand-2, 빛번짐은 값 토큰.
const CORNER =
  // box-content: 시안은 가상요소에 border-box 가 걸리지 않아(`*` 는 ::before 를 못 잡음) 12px + 테두리 2px = 14px 모서리다(R24 측정: right 1165 ↔ 1167)
  "before:absolute after:absolute before:box-content after:box-content before:pointer-events-none after:pointer-events-none " +
  "before:content-[''] after:content-[''] before:size-[12px] after:size-[12px] " +
  "before:border-solid after:border-solid before:border-brand-2 after:border-brand-2 " +
  "before:[filter:drop-shadow(0_0_4px_var(--t-corner-glow))] after:[filter:drop-shadow(0_0_4px_var(--t-corner-glow))] " +
  "before:top-[-1px] before:left-[-1px] before:[border-width:2px_0_0_2px] before:rounded-tl-[14px] " +
  "after:bottom-[-1px] after:right-[-1px] after:[border-width:0_2px_2px_0] after:rounded-br-[14px]"

const BASE =
  "relative rounded-[14px] border border-solid border-border bg-panel " +
  "[box-shadow:inset_0_1px_0_0_var(--t-panel-edge),0_0_40px_0_var(--t-panel-drop)]"

const VARIANT_CLASS: Record<PanelVariant, string> = {
  default: "",
  tc: CORNER,
  "default-pad": "pt-[50px] px-[14px] pb-0",
}

export interface PanelProps extends Omit<React.ComponentProps<"div">, "title"> {
  /** 머리 제목(h2). 제목 · 라벨 · actions 가 모두 없으면 머리를 그리지 않는다 */
  title?: React.ReactNode
  /** 머리 안 작은 영문 라벨 */
  label?: string
  /** 머리 오른쪽에 놓일 내용(보통 ButtonBar) */
  actions?: React.ReactNode
  /** 모서리 장식(변형 tc 의 줄임). variant 를 직접 주면 variant 가 우선 */
  corners?: boolean
  variant?: PanelVariant
  /** 시안 위치 식별자(`data-part-id`) */
  partId?: string
}

export function Panel({
  title,
  label,
  actions,
  corners = false,
  variant,
  partId,
  className,
  children,
  ...props
}: PanelProps) {
  const resolved: PanelVariant = variant ?? (corners ? "tc" : "default")
  const hasHead = title != null || label != null || actions != null
  return (
    <div
      {...partAttrs("Panel", { variant: resolved, id: partId })}
      className={cn(BASE, VARIANT_CLASS[resolved], className)}
      {...props}
    >
      {hasHead && (
        <header
          className={
            "flex min-h-[40px] items-center gap-[10px] rounded-t-[14px] bg-[var(--t-panel-head)] px-[14px] " +
            "border-b-line-2 [border-style:none_none_solid] [border-width:0_0_1px]"
          }
        >
          {title != null && <h2 className="border-none text-[13px] font-semibold">{title}</h2>}
          {label != null && (
            <span className="font-code text-[9.5px] font-semibold tracking-[0.2em] text-faint">{label}</span>
          )}
          {actions}
        </header>
      )}
      {children}
    </div>
  )
}
